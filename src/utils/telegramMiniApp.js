// src/utils/telegramMiniApp.js
// Lightweight, zero-blocking Telegram Mini App (WebApp) integration for SA KITCHEN (@sakitchenweb_bot)

export const TELEGRAM_CUSTOMER_BOT_USERNAME = 'sakitchenweb_bot'

const SUPPORTED_APP_LANGS = ['vi', 'en', 'zh-CN', 'fil', 'ko']

const INITIAL_SEARCH = typeof window !== 'undefined' ? String(window.location.search || '') : ''
const INITIAL_HASH = typeof window !== 'undefined' ? String(window.location.hash || '') : ''

function parseInitialTelegramParams() {
  let rawInitData = ''
  let startParam = ''

  try {
    if (INITIAL_SEARCH) {
      const sp = new URLSearchParams(INITIAL_SEARCH)
      startParam = String(sp.get('tgWebAppStartParam') || '').trim()
    }
    if (INITIAL_HASH && INITIAL_HASH.length > 1) {
      const hp = new URLSearchParams(INITIAL_HASH.slice(1))
      rawInitData = String(hp.get('tgWebAppData') || '').trim()
      if (!startParam && rawInitData) {
        const dp = new URLSearchParams(rawInitData)
        startParam = String(dp.get('start_param') || '').trim()
      }
    }
  } catch {
    // ignore malformed URL params
  }

  let parsedUser = null
  if (rawInitData) {
    try {
      const dp = new URLSearchParams(rawInitData)
      const userJson = dp.get('user')
      if (userJson) {
        parsedUser = JSON.parse(userJson)
      }
    } catch {
      parsedUser = null
    }
  }

  return { rawInitData, startParam, parsedUser }
}

const CACHED_LAUNCH = parseInitialTelegramParams()

export function getTelegramWebApp() {
  if (typeof window === 'undefined') return null
  return window.Telegram?.WebApp || null
}

export function getTelegramInitData() {
  const wa = getTelegramWebApp()
  const sdkInitData = String(wa?.initData || '').trim()
  if (sdkInitData) return sdkInitData
  return CACHED_LAUNCH.rawInitData || ''
}

export function isTelegramMiniApp() {
  const wa = getTelegramWebApp()
  if (wa?.initData && String(wa.initData).trim().length > 0) return true
  if (wa?.initDataUnsafe?.user?.id) return true
  if (CACHED_LAUNCH.rawInitData) return true
  return false
}

export function getTelegramUserProfile() {
  const wa = getTelegramWebApp()
  const rawUser = wa?.initDataUnsafe?.user || CACHED_LAUNCH.parsedUser || null
  if (!rawUser || typeof rawUser !== 'object') return null

  const id = rawUser.id ? String(rawUser.id).trim() : ''
  const firstName = String(rawUser.first_name || '').trim()
  const lastName = String(rawUser.last_name || '').trim()
  const fullName = [firstName, lastName].filter(Boolean).join(' ').trim()
  const username = String(rawUser.username || '').trim().replace(/^@+/, '')
  const handle = username ? `@${username}` : ''
  const displayLabel =
    fullName && handle ? `${fullName}|${handle}` : fullName || handle || ''
  const languageCode = String(rawUser.language_code || '').trim().toLowerCase()

  return {
    id,
    firstName,
    lastName,
    fullName,
    username,
    handle,
    displayLabel,
    languageCode,
    initData: getTelegramInitData(),
  }
}

export function getTelegramStartOrderId() {
  const wa = getTelegramWebApp()
  const rawStart =
    String(wa?.initDataUnsafe?.start_param || '').trim() || CACHED_LAUNCH.startParam || ''
  if (!rawStart) return ''
  if (rawStart.startsWith('order_')) {
    return rawStart.slice('order_'.length).trim()
  }
  return ''
}

export function mapTelegramLangToAppLang(rawLang) {
  const lc = String(rawLang || '').trim().toLowerCase()
  if (!lc) return ''
  if (lc.startsWith('vi')) return 'vi'
  if (lc.startsWith('zh')) return 'zh-CN'
  if (lc.startsWith('ko')) return 'ko'
  if (lc === 'tl' || lc.startsWith('fil')) return 'fil'
  if (lc.startsWith('en')) return 'en'
  return SUPPORTED_APP_LANGS.includes(rawLang) ? rawLang : ''
}

export function syncTelegramMiniAppTheme(isDark = false) {
  if (!isTelegramMiniApp()) return
  const wa = getTelegramWebApp()
  if (!wa) return

  const headerColor = isDark ? '#064e3b' : '#059669'
  const bgColor = isDark ? '#0b1220' : '#f8fafc'

  try {
    wa.setHeaderColor?.(headerColor)
  } catch {}
  try {
    wa.setBackgroundColor?.(bgColor)
  } catch {}
  try {
    wa.setBottomBarColor?.(bgColor)
  } catch {}
}

function applyTelegramWebAppBoot(isDark = false) {
  if (!isTelegramMiniApp()) return false
  const wa = getTelegramWebApp()
  if (!wa) return false

  try {
    wa.ready?.()
  } catch {}
  try {
    wa.expand?.()
  } catch {}
  try {
    wa.disableVerticalSwipes?.()
  } catch {}
  syncTelegramMiniAppTheme(isDark)
  return true
}

export function initTelegramMiniApp({ isDark = false, onReady = null } = {}) {
  if (typeof window === 'undefined') return
  if (applyTelegramWebAppBoot(isDark)) {
    if (typeof onReady === 'function') {
      try {
        onReady(getTelegramUserProfile())
      } catch {}
    }
    return
  }

  const sdkScript = document.getElementById('sa-tg-webapp-sdk')
  if (sdkScript) {
    sdkScript.addEventListener(
      'load',
      () => {
        if (applyTelegramWebAppBoot(isDark) && typeof onReady === 'function') {
          try {
            onReady(getTelegramUserProfile())
          } catch {}
        }
      },
      { once: true },
    )
  }
}

export function setTelegramClosingConfirmation(enabled = false) {
  if (!isTelegramMiniApp()) return
  const wa = getTelegramWebApp()
  if (!wa) return
  try {
    if (enabled) {
      wa.enableClosingConfirmation?.()
    } else {
      wa.disableClosingConfirmation?.()
    }
  } catch {}
}

export function triggerTelegramHaptic(kind = 'light') {
  if (!isTelegramMiniApp()) return
  const hf = getTelegramWebApp()?.HapticFeedback
  if (!hf) return
  try {
    if (kind === 'success' || kind === 'warning' || kind === 'error') {
      hf.notificationOccurred?.(kind)
    } else if (kind === 'selection') {
      hf.selectionChanged?.()
    } else {
      hf.impactOccurred?.(kind)
    }
  } catch {}
}

export function buildTelegramGroupShareAppUrl(orderId) {
  const clean = String(orderId || '').trim()
  if (!clean) return ''
  return `https://t.me/${TELEGRAM_CUSTOMER_BOT_USERNAME}?startapp=order_${encodeURIComponent(clean)}`
}

export function openTelegramShareUrl(shareUrl, shareText = '') {
  const cleanUrl = String(shareUrl || '').trim()
  if (!cleanUrl || typeof window === 'undefined') return
  const tgShareHref = `https://t.me/share/url?url=${encodeURIComponent(cleanUrl)}${
    shareText ? `&text=${encodeURIComponent(shareText)}` : ''
  }`

  const wa = getTelegramWebApp()
  if (isTelegramMiniApp() && typeof wa?.openTelegramLink === 'function') {
    try {
      wa.openTelegramLink(tgShareHref)
      return
    } catch {}
  }
  window.open(tgShareHref, '_blank', 'noopener,noreferrer')
}
