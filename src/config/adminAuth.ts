import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth'
import { auth } from './firebase'

const DEFAULT_ALLOWED_ADMIN_EMAILS = ['bazoka24101973@gmail.com']

function parseAllowedAdminEmails(): string[] {
  const raw = String(import.meta.env.VITE_ADMIN_EMAILS || '').trim()
  if (!raw) return DEFAULT_ALLOWED_ADMIN_EMAILS
  const list = raw
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean)
  return list.length ? list : DEFAULT_ALLOWED_ADMIN_EMAILS
}

export const ALLOWED_ADMIN_EMAILS: string[] = parseAllowedAdminEmails()

export interface AdminUserSession {
  uid: string
  email: string
  username: string
  displayName: string
  photoURL: string
  provider: 'google'
}

export interface GoogleLoginResult {
  success: boolean
  user?: AdminUserSession
  code?: string
  cancelled?: boolean
  message?: string
}

export function isAllowedAdminEmail(email?: string | null): boolean {
  const normalized = String(email || '').trim().toLowerCase()
  return Boolean(normalized && ALLOWED_ADMIN_EMAILS.includes(normalized))
}

function toAdminSession(fbUser: User): AdminUserSession {
  const email = String(fbUser.email || '').trim().toLowerCase()
  return {
    uid: fbUser.uid,
    email,
    username: email,
    displayName: fbUser.displayName || 'Admin',
    photoURL: fbUser.photoURL || '',
    provider: 'google',
  }
}

function saveSessionStorage(session: AdminUserSession | null) {
  try {
    if (session) {
      localStorage.setItem('user', JSON.stringify(session))
    } else {
      localStorage.removeItem('user')
    }
  } catch {
    // Ignore storage quota/privacy errors
  }
}

let authReadyPromise: Promise<User | null> | null = null

export function waitForFirebaseAuth(): Promise<User | null> {
  if (!authReadyPromise) {
    authReadyPromise = new Promise<User | null>((resolve) => {
      const unsubscribe = onAuthStateChanged(
        auth,
        (user) => {
          unsubscribe()
          resolve(user || null)
        },
        () => {
          unsubscribe()
          resolve(null)
        },
      )
    })
  }
  return authReadyPromise.then(() => auth.currentUser || null)
}

export async function logoutAdminFirebase(): Promise<{ success: true }> {
  saveSessionStorage(null)
  try {
    await signOut(auth)
  } catch {
    // Ignore sign-out errors if auth is not active
  }
  return { success: true }
}

export async function getAuthorizedAdminUser(): Promise<AdminUserSession | null> {
  const fbUser = await waitForFirebaseAuth()
  if (!fbUser) {
    saveSessionStorage(null)
    return null
  }

  if (!isAllowedAdminEmail(fbUser.email) || fbUser.emailVerified === false) {
    await logoutAdminFirebase()
    return null
  }

  const session = toAdminSession(fbUser)
  saveSessionStorage(session)
  return session
}

export function subscribeAdminAuthState(
  callback: (session: AdminUserSession | null) => void,
): () => void {
  return onAuthStateChanged(auth, async (fbUser) => {
    if (!fbUser) {
      saveSessionStorage(null)
      callback(null)
      return
    }
    if (!isAllowedAdminEmail(fbUser.email) || fbUser.emailVerified === false) {
      await logoutAdminFirebase()
      callback(null)
      return
    }
    const session = toAdminSession(fbUser)
    saveSessionStorage(session)
    callback(session)
  })
}

export async function loginWithGoogleFirebase(): Promise<GoogleLoginResult> {
  const provider = new GoogleAuthProvider()
  provider.setCustomParameters({
    prompt: 'select_account',
    ...(ALLOWED_ADMIN_EMAILS[0] ? { login_hint: ALLOWED_ADMIN_EMAILS[0] } : {}),
  })

  try {
    const result = await signInWithPopup(auth, provider)
    const fbUser = result?.user
    const email = String(fbUser?.email || '').trim().toLowerCase()

    if (!fbUser || !email || fbUser.emailVerified === false || !isAllowedAdminEmail(email)) {
      await logoutAdminFirebase()
      return {
        success: false,
        code: 'UNAUTHORIZED_EMAIL',
        message: email
          ? `Tài khoản "${email}" không có quyền truy cập trang quản trị.`
          : 'Tài khoản Google này không có quyền truy cập trang quản trị.',
      }
    }

    const session = toAdminSession(fbUser)
    saveSessionStorage(session)
    return {
      success: true,
      user: session,
    }
  } catch (err: unknown) {
    const code =
      typeof err === 'object' && err !== null && 'code' in err
        ? String((err as { code?: unknown }).code || '')
        : ''
    const rawMessage =
      typeof err === 'object' && err !== null && 'message' in err
        ? String((err as { message?: unknown }).message || '')
        : ''

    if (code === 'auth/popup-closed-by-user') {
      return {
        success: false,
        code,
        cancelled: true,
        message: 'Bạn đã đóng cửa sổ đăng nhập Google.',
      }
    }
    if (code === 'auth/cancelled-popup-request') {
      return {
        success: false,
        code,
        cancelled: true,
        message: '',
      }
    }
    if (code === 'auth/popup-blocked') {
      return {
        success: false,
        code,
        message: 'Trình duyệt đang chặn cửa sổ bật lên (Popup). Vui lòng cho phép popup rồi thử lại.',
      }
    }
    if (code === 'auth/unauthorized-domain') {
      const host = typeof window !== 'undefined' ? window.location.hostname : ''
      return {
        success: false,
        code,
        message: `Tên miền "${host}" chưa được thêm vào mục Authorized domains trong Firebase Authentication.`,
      }
    }
    if (code === 'auth/operation-not-allowed') {
      return {
        success: false,
        code,
        message: 'Phương thức đăng nhập Google chưa được bật trên Firebase Console.',
      }
    }
    if (code === 'auth/network-request-failed') {
      return {
        success: false,
        code,
        message: 'Lỗi kết nối mạng khi đăng nhập Google. Vui lòng thử lại.',
      }
    }

    return {
      success: false,
      code,
      message: rawMessage || 'Đăng nhập Google thất bại. Vui lòng thử lại.',
    }
  }
}
