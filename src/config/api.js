// src/config/api.js
import { ref as dbRef, get, set, update, remove, onValue, runTransaction } from 'firebase/database'
import { db } from './firebase'
import {
  ALLOWED_ADMIN_EMAILS,
  isAllowedAdminEmail,
  getAuthorizedAdminUser,
  loginWithGoogleFirebase,
  logoutAdminFirebase,
  subscribeAdminAuthState,
  waitForFirebaseAuth,
} from './adminAuth'
import {
  DATA_LANG_CODES,
  normalizeProductI18n,
  syncProductWithI18n,
  normalizeNoticeI18n,
  syncNoticeWithI18n,
  resolveNoticeText,
} from '../utils/i18nData'
import {
  normalizeNccDiscountType,
  normalizeNccDiscountValue,
  calcOrderLineProfit,
} from '../utils/nccDiscount'
import { buildUniqueProductCode } from '../utils/productCode'
import { normalizeThemeConfig } from '../utils/storefrontTheme'
import {
  normalizeBannerAction,
  normalizeBannerLink,
  normalizeBannerPlacement,
  normalizeVerticalBannerTarget,
  isBannerActive,
} from '../utils/bannerLink'
import { normalizePartnerHexColor } from '../utils/partnerColor'
import { sanitizeFeedCaptionHtml } from '../utils/feedCaption'
import {
  slugifyVi,
  normalizeBlogPost,
  normalizeBlogCategory,
  analyzePostSeo,
  sanitizeBlogHtml,
  parseTags,
} from '../utils/blogSeo'

export const CLOUDINARY_CLOUD_NAME = 'dsmtq5rbh'
export const CLOUDINARY_SIGN_ENDPOINT = '/api/cloudinary-sign'

// Legacy constant kept empty/unused so any external import does not break
export const API_URL = ''

export const SHEETS = [
  'hang_hoa',
  'khach_hang',
  'hoa_don_tong_quat',
  'hoa_don_chi_tiet',
  'so_thu_chi',
  'bao_cao',
  'don_hang',
  'live_orders',
  'thong_bao',
  'banner',
  'logo',
  'khuyenmai_info',
  'shop_contact',
  'partners',
  'feed_posts',
  'time',
  'thong_tin_chuyen_khoan',
  'display_config',
  'chiet_khau_doi_soat',
  'blog_posts',
  'blog_categories',
  'Login',
]

export const DATA_SHEETS = SHEETS.filter(
  (sName) =>
    sName !== 'Login' &&
    sName !== 'live_orders' &&
    sName !== 'chiet_khau_doi_soat' &&
    sName !== 'blog_posts' &&
    sName !== 'blog_categories' &&
    sName !== 'feed_posts',
)

export const STOREFRONT_SHEETS = [
  'hang_hoa',
  'banner',
  'thong_bao',
  'logo',
  'shop_contact',
  'partners',
  'khuyenmai_info',
  'time',
  'thong_tin_chuyen_khoan',
  'display_config',
]

/* =========================================================
 * INTERNAL HELPERS (ORDER-PRESERVING KEYS & SANITIZATION)
 * ========================================================= */
let _rowSeq = 0

export function createRowKey() {
  _rowSeq = (_rowSeq + 1) % 1000000
  const ts = String(Date.now()).padStart(13, '0')
  const seq = String(_rowSeq).padStart(6, '0')
  const rand = Math.random().toString(36).slice(2, 6)
  return `r_${ts}_${seq}_${rand}`
}

function s(val, fallback = '') {
  if (val === undefined || val === null) return fallback
  return String(val)
}

function n(val, fallback = 0) {
  if (val === undefined || val === null || val === '') return fallback
  const num = Number(val)
  return Number.isFinite(num) ? num : fallback
}

function genShortId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID().slice(0, 8)
  }
  return Math.random().toString(36).slice(2, 10)
}

export function sanitizeRow(obj) {
  if (obj === undefined || obj === null) return ''
  if (typeof obj === 'number') return Number.isFinite(obj) ? obj : 0
  if (typeof obj !== 'object') return obj
  if (Array.isArray(obj)) return obj.map((v) => sanitizeRow(v))

  const clean = {}
  for (const [k, v] of Object.entries(obj)) {
    if (!k || /[.$#[\]/]/.test(k)) continue
    clean[k] = sanitizeRow(v)
  }
  return clean
}

function compareKeys(a, b) {
  const na = /^\d+$/.test(a) ? Number(a) : null
  const nb = /^\d+$/.test(b) ? Number(b) : null
  if (na !== null && nb !== null) return na - nb
  if (na !== null) return -1
  if (nb !== null) return 1
  return a.localeCompare(b)
}

function rawToEntries(raw) {
  if (!raw || typeof raw !== 'object') return []
  return Object.entries(raw)
    .filter(([, v]) => v !== null && v !== undefined && typeof v === 'object')
    .sort(([ka], [kb]) => compareKeys(ka, kb))
    .map(([key, row]) => ({ key, row: { ...row } }))
}

export function normalizeSheet(raw) {
  return rawToEntries(raw).map((e) => e.row)
}

async function readSheetEntries(sheetName) {
  const snap = await get(dbRef(db, sheetName))
  if (!snap.exists()) return []
  return rawToEntries(snap.val())
}

/* =========================================================
 * READ & REALTIME SUBSCRIPTION API
 * ========================================================= */
export async function getOneSheet(sheetName) {
  if (!SHEETS.includes(sheetName)) {
    return { success: false, message: 'Sheet not allowed', data: [] }
  }
  const entries = await readSheetEntries(sheetName)
  return { success: true, data: entries.map((e) => e.row) }
}

export async function getSheets(sheetNames = DATA_SHEETS) {
  const allowed = sheetNames.filter((name) => SHEETS.includes(name))
  const pairs = await Promise.all(
    allowed.map(async (name) => {
      try {
        const snap = await get(dbRef(db, name))
        return [name, snap.exists() ? normalizeSheet(snap.val()) : []]
      } catch (err) {
        console.warn(`[Firebase] getSheets(${name}) error:`, err)
        return [name, []]
      }
    }),
  )
  const result = {}
  for (const [name, rows] of pairs) {
    result[name] = rows
  }
  return { success: true, data: result }
}

export async function getAllSheets() {
  return getSheets(DATA_SHEETS)
}

export async function getStorefrontSheets() {
  return getSheets(STOREFRONT_SHEETS)
}

export async function findByKey(sheetName, key, value) {
  if (!SHEETS.includes(sheetName)) {
    return { success: false, message: 'Sheet not allowed', data: [] }
  }
  const entries = await readSheetEntries(sheetName)
  const filtered = entries
    .map((e) => e.row)
    .filter((r) => String(r[key] ?? '') === String(value ?? ''))
  return { success: true, data: filtered }
}

/**
 * Realtime listener on a single collection (returns unsubscribe function)
 */
export function subscribeSheet(sheetName, callback, onError) {
  const targetRef = dbRef(db, sheetName)
  return onValue(
    targetRef,
    (snapshot) => {
      const rows = snapshot.exists() ? normalizeSheet(snapshot.val()) : []
      callback(rows)
    },
    (err) => {
      if (onError) onError(err)
      else console.warn(`[Firebase] subscribeSheet(${sheetName}) error:`, err)
    },
  )
}

/* =========================================================
 * AUTHENTICATION & EXPIRATION CHECK (Firebase Google Auth)
 * ========================================================= */
export {
  ALLOWED_ADMIN_EMAILS,
  isAllowedAdminEmail,
  getAuthorizedAdminUser,
  loginWithGoogleFirebase,
  subscribeAdminAuthState,
  waitForFirebaseAuth,
}

export async function loginWithFirebase() {
  return {
    success: false,
    message: 'Hệ thống đã chuyển sang đăng nhập bằng tài khoản Google quản trị.',
  }
}

export async function checkUserExpired() {
  try {
    const adminUser = await getAuthorizedAdminUser()
    return { success: true, expired: !adminUser }
  } catch (err) {
    console.warn('[Firebase] checkUserExpired warning:', err)
    return { success: false, expired: false }
  }
}

export async function logoutFirebase() {
  return logoutAdminFirebase()
}

/* =========================================================
 * DEDUPLICATION HELPERS (MA_HANG & MA_KHACH_HANG)
 * ========================================================= */
function genUniqueMaHang(baseMa, existingMaList) {
  const matched = existingMaList
    .filter((m) => m === baseMa || m.startsWith(baseMa + '_'))
    .map((m) => {
      const parts = m.split('_')
      const last = parts[parts.length - 1]
      return isNaN(Number(last)) ? 0 : Number(last)
    })

  if (!matched.length) return baseMa
  const max = Math.max(...matched)
  return `${baseMa}_${max + 1}`
}

function deduplicateCodeEntries(entries, fieldName) {
  const counter = {}
  let fixed = 0
  const changedKeys = new Set()

  for (const entry of entries) {
    const ma = s(entry.row[fieldName]).trim()
    if (!ma) continue
    const base = ma.replace(/_\d+$/, '')
    if (!counter[base]) {
      counter[base] = 1
      if (entry.row[fieldName] !== base) {
        entry.row[fieldName] = base
        changedKeys.add(entry.key)
      }
    } else {
      const newMa = `${base}_${counter[base]}`
      counter[base]++
      if (entry.row[fieldName] !== newMa) {
        entry.row[fieldName] = newMa
        changedKeys.add(entry.key)
        fixed++
      }
    }
  }

  return { fixed, changedKeys }
}

/* =========================================================
 * POS & ORDER ACTIONS
 * ========================================================= */
async function handleHoanThanhDon(payload) {
  const { hoa_don = {}, items = [], khach_hang = {} } = payload
  const maHoaDon = s(hoa_don.Ma_hoa_don).trim()
  const orderKey = maHoaDon ? safeFirebaseKey(maHoaDon) : ''
  const donViTienTe =
    hoa_don.Don_vi_tien_te ||
    items?.[0]?.Don_vi_tien_te ||
    items?.[0]?.donViTienTe ||
    'P'

  const [
    hangHoaEntries,
    khEntries,
    hdEntries,
    ctEntries,
    tcEntries,
    bcEntries,
    dhEntries,
    liveSnap,
  ] = await Promise.all([
    readSheetEntries('hang_hoa'),
    readSheetEntries('khach_hang'),
    readSheetEntries('hoa_don_tong_quat'),
    readSheetEntries('hoa_don_chi_tiet'),
    readSheetEntries('so_thu_chi'),
    readSheetEntries('bao_cao'),
    readSheetEntries('don_hang'),
    orderKey ? get(dbRef(db, `live_orders/${orderKey}`)) : Promise.resolve(null),
  ])

  const existingHD = maHoaDon
    ? hdEntries.find((e) => s(e.row.Ma_hoa_don).trim() === maHoaDon)
    : null
  const existingTC = maHoaDon
    ? tcEntries.find((e) => s(e.row.Ma_hoa_don).trim() === maHoaDon)
    : null
  const existingBC = maHoaDon
    ? bcEntries.find((e) => s(e.row.Ma_hoa_don).trim() === maHoaDon)
    : null
  const existingDH = maHoaDon
    ? dhEntries.find((e) => s(e.row.Ma_hoa_don).trim() === maHoaDon)
    : null
  const liveParsed =
    liveSnap && liveSnap.exists() ? normalizeLiveOrderSnapshot(maHoaDon, liveSnap.val()) : null

  const oldTotal = existingHD ? n(existingHD.row.Tong_cong) : 0
  const alreadyAccounted = Boolean(existingHD)
  const resolvedSoHoaDon = s(
    hoa_don.So_hoa_don || existingHD?.row?.So_hoa_don || existingDH?.row?.So_hoa_don,
  )
  const resolvedNgayTao = s(
    existingHD?.row?.Ngay_tao_duong_lich ||
      existingDH?.row?.Ngay_tao_duong_lich ||
      hoa_don.Ngay_tao_duong_lich,
  )
  const targetOrderStatus = s(
    hoa_don.Trang_thai ||
      (existingDH?.row?.Trang_thai && existingDH.row.Trang_thai !== 'Chờ duyệt'
        ? existingDH.row.Trang_thai
        : 'Đang xử lý'),
  ).trim()

  const updates = {}

  // 1. Upsert hoa_don_tong_quat
  const hdKey = existingHD ? existingHD.key : createRowKey()
  updates[`hoa_don_tong_quat/${hdKey}`] = sanitizeRow({
    ...(existingHD?.row || {}),
    Ma_hoa_don: maHoaDon,
    So_hoa_don: resolvedSoHoaDon,
    Ma_khach_hang: s(hoa_don.Ma_khach_hang || existingHD?.row?.Ma_khach_hang),
    Ten_khach_hang: s(hoa_don.Ten_khach_hang),
    Ngay_tao_duong_lich: resolvedNgayTao,
    Thoi_gian_nhan_hang: s(hoa_don.Thoi_gian_nhan_hang),
    Tra_tien: n(hoa_don.Tra_tien),
    Tam_tinh: n(hoa_don.Tam_tinh),
    Tong_giam_gia: n(hoa_don.Tong_giam_gia),
    Tong_tien_chiet_khau: n(hoa_don.Tong_tien_chiet_khau),
    Tong_cong: n(hoa_don.Tong_cong),
    Hinh_thuc_thanh_toan: s(hoa_don.Hinh_thuc_thanh_toan),
    Tong_loi_nhuan: n(hoa_don.Tong_loi_nhuan),
  })

  // 2. Replace hoa_don_chi_tiet for this Ma_hoa_don (prevent duplicate detail lines)
  if (maHoaDon) {
    for (const ct of ctEntries) {
      if (s(ct.row.Ma_hoa_don).trim() === maHoaDon) {
        updates[`hoa_don_chi_tiet/${ct.key}`] = null
      }
    }
  }
  for (const i of items) {
    updates[`hoa_don_chi_tiet/${createRowKey()}`] = sanitizeRow({
      Ma_hoa_don: s(i.Ma_hoa_don || maHoaDon),
      So_hoa_don: s(i.So_hoa_don || resolvedSoHoaDon),
      Ngay_tao_duong_lich: s(i.Ngay_tao_duong_lich || resolvedNgayTao),
      Ma_hang: s(i.Ma_hang),
      Ten_hang: s(i.Ten_hang),
      Trang_thai: s(i.Trang_thai || 'Còn hàng'),
      Danh_muc: s(i.Danh_muc),
      Size: s(i.Size),
      Dvt: s(i.Dvt),
      So_luong: n(i.So_luong),
      Gia_goc: n(i.Gia_goc),
      Gia_ban: n(i.Gia_ban),
      Giam_gia: n(i.Giam_gia),
      Chiet_khau: n(i.Chiet_khau ?? i.chietKhau),
      Tien_chiet_khau: n(i.Tien_chiet_khau),
      Ncc_loai_giam: normalizeNccDiscountType(i.Ncc_loai_giam ?? i.nccLoaiGiam),
      Ncc_gia_tri_giam: normalizeNccDiscountValue(i.Ncc_gia_tri_giam ?? i.nccGiaTriGiam),
      Thanh_tien: n(i.Thanh_tien),
      Loi_nhuan: n(i.Loi_nhuan),
      Ghi_chu: s(i.Ghi_chu),
      Nguoi_dat: s(i.Nguoi_dat),
      Nguoi_dat_id: s(i.Nguoi_dat_id),
      Added_by_role: s(i.Added_by_role),
      lineId: s(i.lineId),
      Trang_thai_don: targetOrderStatus,
      Thoi_gian_nhan_hang: s(hoa_don.Thoi_gian_nhan_hang),
    })
  }

  // 3. Auto-add missing hang_hoa (no stock counting — only Còn hàng / Hết hàng)
  const dirtyHangHoa = new Set()
  for (const i of items) {
    if (i.Ma_hang) {
      const existsByMa = hangHoaEntries.some((e) => s(e.row.Ma_hang) === s(i.Ma_hang))
      if (!existsByMa) {
        const newKey = createRowKey()
        const newRow = syncProductWithI18n({
          Ma_hang: s(i.Ma_hang),
          Ten_hang: s(i.Ten_hang),
          Main_img: s(i.Main_img),
          Mo_ta: s(i.Mo_ta),
          Danh_muc_cha: s(i.Danh_muc_cha),
          Danh_muc: s(i.Danh_muc),
          Size: s(i.Size),
          Dvt: s(i.Dvt),
          Gia_goc: n(i.Gia_goc),
          Gia_ban: n(i.Gia_ban),
          Ncc_loai_giam: normalizeNccDiscountType(i.Ncc_loai_giam ?? i.nccLoaiGiam),
          Ncc_gia_tri_giam: normalizeNccDiscountValue(i.Ncc_gia_tri_giam ?? i.nccGiaTriGiam),
          Trang_thai: 'Còn hàng',
          Don_vi_tien_te: s(i.Don_vi_tien_te || donViTienTe),
          Gia_Giam: '',
          img_1: '',
          img_2: '',
          img_3: '',
          img_4: '',
          img_5: '',
          img_6: '',
          i18n: i.i18n,
        })
        hangHoaEntries.push({ key: newKey, row: newRow })
        dirtyHangHoa.add(newKey)
      }
    }
  }
  for (const entry of hangHoaEntries) {
    if (dirtyHangHoa.has(entry.key)) {
      updates[`hang_hoa/${entry.key}`] = sanitizeRow(entry.row)
    }
  }

  // 4. Upsert so_thu_chi
  const soTien = n(hoa_don.Tong_cong)
  const tcKey = existingTC ? existingTC.key : createRowKey()
  updates[`so_thu_chi/${tcKey}`] = sanitizeRow({
    ...(existingTC?.row || {}),
    Ma_hoa_don: maHoaDon,
    So_hoa_don: resolvedSoHoaDon,
    Ngay_tao_duong_lich: resolvedNgayTao,
    Trang_thai: 'BAN_HANG',
    so_tien: soTien,
    loi_nhuan: n(hoa_don.Tong_loi_nhuan),
    hinh_thuc_thanh_toan: s(hoa_don.Hinh_thuc_thanh_toan),
    Ma_khach_hang: s(hoa_don.Ma_khach_hang),
    Ten_khach_hang: s(hoa_don.Ten_khach_hang),
    Ma_dich_vu: '',
    Ten_dich_vu: '',
    Don_vi_tien_te: s(donViTienTe),
  })

  // 5. khach_hang (ensure exists + update info + deduplicate + increment only delta Tong_chi_tieu)
  const maKH = s(hoa_don.Ma_khach_hang || existingHD?.row?.Ma_khach_hang).trim()
  if (maKH) {
    const dirtyKH = new Set()
    let khTarget = khEntries.find((e) => s(e.row.Ma_khach_hang) === maKH)
    if (!khTarget) {
      const newKey = createRowKey()
      khTarget = {
        key: newKey,
        row: {
          Ma_khach_hang: maKH,
          Ten_khach_hang: s(hoa_don.Ten_khach_hang),
          So_dien_thoai: s(hoa_don.So_dien_thoai),
          Dia_chi: s(hoa_don.Dia_chi),
          Cong_no_hien_tai: 0,
          Tong_chi_tieu: 0,
          Ghi_chu: s(khach_hang?.Ghi_chu),
        },
      }
      khEntries.push(khTarget)
      dirtyKH.add(newKey)
    } else {
      if (hoa_don.Ten_khach_hang !== undefined) {
        khTarget.row.Ten_khach_hang = s(hoa_don.Ten_khach_hang)
      }
      if (hoa_don.So_dien_thoai !== undefined) {
        khTarget.row.So_dien_thoai = s(hoa_don.So_dien_thoai)
      }
      if (hoa_don.Dia_chi !== undefined) {
        khTarget.row.Dia_chi = s(hoa_don.Dia_chi)
      }
      if (khach_hang?.Ghi_chu !== undefined) {
        khTarget.row.Ghi_chu = s(khach_hang.Ghi_chu)
      }
      dirtyKH.add(khTarget.key)
    }

    const spendDelta = alreadyAccounted ? n(hoa_don.Tong_cong) - oldTotal : n(hoa_don.Tong_cong)
    khTarget.row.Tong_chi_tieu = Math.max(0, n(khTarget.row.Tong_chi_tieu) + spendDelta)
    dirtyKH.add(khTarget.key)

    const { changedKeys } = deduplicateCodeEntries(khEntries, 'Ma_khach_hang')
    for (const k of changedKeys) dirtyKH.add(k)

    for (const entry of khEntries) {
      if (dirtyKH.has(entry.key)) {
        updates[`khach_hang/${entry.key}`] = sanitizeRow(entry.row)
      }
    }
  }

  // 6. Upsert bao_cao
  const tongGiaGoc = items.reduce((acc, it) => acc + n(it.Gia_goc) * n(it.So_luong), 0)
  const bcKey = existingBC ? existingBC.key : createRowKey()
  updates[`bao_cao/${bcKey}`] = sanitizeRow({
    ...(existingBC?.row || {}),
    Ma_hoa_don: maHoaDon,
    So_hoa_don: resolvedSoHoaDon,
    Thoi_gian_tao_duong_lich: resolvedNgayTao,
    Tong_gia_goc: tongGiaGoc,
    Tien_chiet_khau: n(hoa_don.Tong_tien_chiet_khau),
    Tong_gia_ban: n(hoa_don.Tong_cong),
    Tong_cong: n(hoa_don.Tong_loi_nhuan),
    Hinh_thuc_thanh_toan: s(hoa_don.Hinh_thuc_thanh_toan),
    So_tien: '',
    Noi_dung: '',
    Trang_thai: '',
  })

  // 7. Upsert don_hang
  const dhKey = existingDH ? existingDH.key : createRowKey()
  updates[`don_hang/${dhKey}`] = sanitizeRow({
    ...(existingDH?.row || {}),
    Ma_hoa_don: maHoaDon,
    So_hoa_don: resolvedSoHoaDon,
    Ngay_tao_duong_lich: resolvedNgayTao,
    Ma_khach_hang: maKH,
    Dia_chi: s(hoa_don.Dia_chi),
    So_dien_thoai: s(hoa_don.So_dien_thoai),
    Thoi_gian_nhan_hang: s(hoa_don.Thoi_gian_nhan_hang),
    Tong_gia_ban: n(hoa_don.Tong_cong),
    Phi_ship: n(hoa_don.Phi_ship),
    Ghi_chu: s(hoa_don.Ghi_chu_don_hang),
    Hinh_thuc_thanh_toan: s(hoa_don.Hinh_thuc_thanh_toan),
    Trang_thai: targetOrderStatus,
    Ten_khach_hang: s(hoa_don.Ten_khach_hang),
    Don_vi_tien_te: s(donViTienTe),
  })

  // 8. Sync live_orders so online customer tracker sees updated total/items/info
  const isWebLinkedOrder =
    Boolean(liveParsed) ||
    s(existingDH?.row?.Nguon_don).trim() === 'WEB' ||
    s(maHoaDon).startsWith('WEB')
  if (isWebLinkedOrder && orderKey) {
    const hhMap = new Map(hangHoaEntries.map((e) => [s(e.row.Ma_hang).trim(), e.row]))
    const syncedItemsObj = {}
    let idx = 0
    for (const rawIt of items) {
      idx++
      const baseLineId =
        s(rawIt.lineId).trim() ||
        makeLineId(
          rawIt.Ma_hang || rawIt.Ten_hang || `item_${idx}`,
          rawIt.Nguoi_dat_id || rawIt.Nguoi_dat || `pos_${idx}`,
        )
      const resolved = resolveCanonicalViItem({ ...rawIt, lineId: baseLineId }, hhMap)
      if (resolved.So_luong <= 0) continue
      let k = safeFirebaseKey(resolved.lineId)
      if (syncedItemsObj[k]) {
        k = safeFirebaseKey(`${k}_${idx}`)
      }
      resolved.lineId = k
      const itemGiamGia = n(rawIt.Giam_gia)
      const itemChietKhau = n(rawIt.Chiet_khau ?? rawIt.chietKhau)
      const itemTienCK = n(rawIt.Tien_chiet_khau ?? rawIt.tongChietKhauTien)
      const grossLine = n(rawIt.Thanh_tien) || n(resolved.Gia_ban) * n(resolved.So_luong)
      const lineDiscount = Math.max(0, itemGiamGia * n(resolved.So_luong) + itemTienCK)
      const netLine = Math.max(0, grossLine - lineDiscount)
      syncedItemsObj[k] = sanitizeRow({
        ...resolved,
        Giam_gia: itemGiamGia,
        Chiet_khau: itemChietKhau,
        Tien_chiet_khau: itemTienCK,
        Thanh_tien: grossLine,
        Thanh_tien_sau_giam: netLine,
      })
    }
    const baseLiveMeta = liveParsed?.meta || {}
    const syncedMembersObj = buildSyncedLiveMembers(
      liveParsed?.rawMembers,
      items,
      s(hoa_don.Ten_khach_hang),
      s(baseLiveMeta.Host_id),
    )
    if (targetOrderStatus === 'Hoàn thành') {
      const adminMessage = s(payload.Admin_message ?? hoa_don.Admin_message).trim()
      updates[`live_orders/${orderKey}`] = {
        meta: sanitizeRow({
          ...baseLiveMeta,
          Ma_hoa_don: maHoaDon,
          So_hoa_don: resolvedSoHoaDon,
          Ma_khach_hang: maKH,
          Trang_thai: 'Hoàn thành',
          Ten_khach_hang: s(hoa_don.Ten_khach_hang),
          So_dien_thoai: s(hoa_don.So_dien_thoai),
          Dia_chi: s(hoa_don.Dia_chi),
          Thoi_gian_nhan_hang: s(hoa_don.Thoi_gian_nhan_hang),
          Hinh_thuc_thanh_toan: s(hoa_don.Hinh_thuc_thanh_toan),
          Ghi_chu: s(hoa_don.Ghi_chu_don_hang),
          Don_vi_tien_te: s(donViTienTe),
          Tam_tinh: n(hoa_don.Tam_tinh),
          Tong_giam_gia: n(hoa_don.Tong_giam_gia),
          Tong_tien_chiet_khau: n(hoa_don.Tong_tien_chiet_khau),
          Phi_ship: n(hoa_don.Phi_ship),
          Tong_cong: 0,
          Admin_message: adminMessage,
          ...(adminMessage ? { Admin_message_at: Date.now() } : {}),
          Synced_by_admin: true,
          Last_source: 'admin',
          Closed_at: Date.now(),
          Updated_at: Date.now(),
        }),
        items: null,
      }
    } else {
      updates[`live_orders/${orderKey}`] = {
        meta: sanitizeRow({
          ...baseLiveMeta,
          Ma_hoa_don: maHoaDon,
          So_hoa_don: resolvedSoHoaDon,
          Ma_khach_hang: maKH,
          Trang_thai: targetOrderStatus,
          Ten_khach_hang: s(hoa_don.Ten_khach_hang),
          So_dien_thoai: s(hoa_don.So_dien_thoai),
          Dia_chi: s(hoa_don.Dia_chi),
          Thoi_gian_nhan_hang: s(hoa_don.Thoi_gian_nhan_hang),
          Hinh_thuc_thanh_toan: s(hoa_don.Hinh_thuc_thanh_toan),
          Ghi_chu: s(hoa_don.Ghi_chu_don_hang),
          Don_vi_tien_te: s(donViTienTe),
          Tam_tinh: n(hoa_don.Tam_tinh),
          Tong_giam_gia: n(hoa_don.Tong_giam_gia),
          Tong_tien_chiet_khau: n(hoa_don.Tong_tien_chiet_khau),
          Phi_ship: n(hoa_don.Phi_ship),
          Tong_cong: n(hoa_don.Tong_cong),
          Synced_by_admin: true,
          Last_source: 'admin',
          Approved_at:
            targetOrderStatus !== 'Chờ duyệt'
              ? baseLiveMeta?.Approved_at || Date.now()
              : baseLiveMeta?.Approved_at,
          Shipped_at:
            targetOrderStatus === 'Đang ship'
              ? baseLiveMeta?.Shipped_at || Date.now()
              : baseLiveMeta?.Shipped_at,
          Updated_at: Date.now(),
        }),
        items: syncedItemsObj,
        members: syncedMembersObj,
      }
    }
  }

  await update(dbRef(db), updates)
  return { success: true }
}

/* =========================================================
 * LIVE GROUP CART & CUSTOMER <-> ADMIN ORDER APPROVAL FLOW
 * ========================================================= */
export function formatVNDateTime(d = new Date()) {
  const p = (num) => String(num).padStart(2, '0')
  return (
    `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())} ` +
    `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()}`
  )
}

export function safeFirebaseKey(raw) {
  const cleaned = encodeURIComponent(String(raw || '').trim()).replace(/[.%$#[\]/]/g, '_')
  return cleaned || 'k'
}

export function genOrderId(prefix = 'WEB') {
  const d = new Date()
  const p = (num) => String(num).padStart(2, '0')
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase()
  return `${prefix}${p(d.getDate())}${p(d.getMonth() + 1)}${p(d.getHours())}${p(d.getMinutes())}_${rand}`
}

export function makeLineId(maHang, memberId = 'host') {
  return `L_${safeFirebaseKey(maHang)}__${safeFirebaseKey(memberId)}`
}

function genAutoMaKhachHang(ten, sdt, diaChi) {
  const t = ten ? String(ten).toLowerCase().replace(/\s+/g, '') : ''
  const ph = sdt ? String(sdt).replace(/\D/g, '') : ''
  const dc = diaChi ? String(diaChi).toLowerCase().replace(/\s+/g, '') : ''
  return `${t || 'ten'}_${ph || 'sdt'}_${dc || 'dc'}`
}

function genNextSoHoaDon(donHangEntries = [], hoaDonEntries = []) {
  let max = 0
  for (const e of [...donHangEntries, ...hoaDonEntries]) {
    const raw = s(e?.row?.So_hoa_don).trim()
    if (!raw) continue
    const num = parseInt(raw.replace(/^OD-/i, ''), 10)
    if (!Number.isNaN(num) && num > max) max = num
  }
  return 'OD-' + String(max + 1).padStart(4, '0')
}

function resolveCanonicalViItem(item, hangHoaMap) {
  const maHang = s(item?.Ma_hang || item?.maHang).trim()
  const hh = maHang ? hangHoaMap.get(maHang) : null
  const hhI18n = hh ? normalizeProductI18n(hh) : null

  const tenVi =
    hhI18n?.vi?.Ten_hang ||
    s(hh?.Ten_hang).trim() ||
    s(item?._tenVi || item?.Ten_hang_vi || item?.Ten_hang || item?.tenHang).trim()

  const danhMucVi =
    hhI18n?.vi?.Danh_muc ||
    s(hh?.Danh_muc).trim() ||
    s(item?._danhMucVi || item?.Danh_muc_vi || item?.Danh_muc || item?.danhMuc).trim()

  const hasCustomDvt = Boolean(item?.Dvt_custom || item?._dvtCustom)
  const dvtVi = hasCustomDvt
    ? s(item?.Dvt ?? item?.dvt).trim()
    : hhI18n?.vi?.Dvt ||
      s(hh?.Dvt).trim() ||
      s(item?._dvtVi || item?.Dvt_vi || item?.Dvt || item?.dvt).trim()

  const defaultSellPrice = hh
    ? hh.Gia_Giam !== '' && hh.Gia_Giam !== null && hh.Gia_Giam !== undefined && n(hh.Gia_Giam) > 0
      ? n(hh.Gia_Giam)
      : n(hh.Gia_ban)
    : n(item?.Gia_ban ?? item?.giaBan)

  const giaBan =
    item?.Gia_ban !== undefined && item?.Gia_ban !== '' && item?.Gia_ban !== null
      ? n(item.Gia_ban)
      : defaultSellPrice

  const giaGoc =
    item?.Gia_goc !== undefined && item?.Gia_goc !== '' && item?.Gia_goc !== null
      ? n(item.Gia_goc)
      : n(hh?.Gia_goc ?? 0)

  const soLuong = Math.max(0, n(item?.So_luong ?? item?.qty ?? item?.soLuong, 1))
  const donViTienTe = s(item?.Don_vi_tien_te || hh?.Don_vi_tien_te || 'P').trim() || 'P'
  const hasExplicitNccType =
    item?.Ncc_loai_giam !== undefined || item?.nccLoaiGiam !== undefined
  const hasExplicitNccVal =
    item?.Ncc_gia_tri_giam !== undefined || item?.nccGiaTriGiam !== undefined
  const nccLoaiGiam = normalizeNccDiscountType(
    hasExplicitNccType ? (item?.Ncc_loai_giam ?? item?.nccLoaiGiam) : hh?.Ncc_loai_giam,
  )
  const nccGiaTriGiam = normalizeNccDiscountValue(
    hasExplicitNccVal ? (item?.Ncc_gia_tri_giam ?? item?.nccGiaTriGiam) : hh?.Ncc_gia_tri_giam,
  )

  return {
    lineId: s(item?.lineId).trim() || makeLineId(maHang || tenVi, item?.Nguoi_dat_id || 'host'),
    Ma_hang: maHang,
    Ten_hang: tenVi,
    Danh_muc: danhMucVi,
    Dvt: dvtVi,
    ...(hasCustomDvt ? { Dvt_custom: true } : {}),
    Size: s(item?.Size || hh?.Size),
    Main_img: s(item?.Main_img || hh?.Main_img),
    Don_vi_tien_te: donViTienTe,
    Gia_goc: giaGoc,
    Gia_ban: giaBan,
    Gia_ban_goc: n(item?.Gia_ban_goc || defaultSellPrice || giaBan),
    Ncc_loai_giam: nccLoaiGiam,
    Ncc_gia_tri_giam: nccGiaTriGiam,
    So_luong: soLuong,
    Thanh_tien: giaBan * soLuong,
    Ghi_chu: s(item?.Ghi_chu ?? item?.note),
    Nguoi_dat: s(item?.Nguoi_dat ?? item?.memberName),
    Nguoi_dat_id: s(item?.Nguoi_dat_id ?? item?.memberId),
    Added_by_role: s(item?.Added_by_role || 'host'),
    Added_at: n(item?.Added_at, Date.now()),
    Updated_at: Date.now(),
  }
}

function buildSyncedLiveMembers(existingRawMembers, items = [], fallbackHostName = '', hostId = '') {
  const nextMembers = { ...(existingRawMembers && typeof existingRawMembers === 'object' ? existingRawMembers : {}) }
  const nowTs = Date.now()
  for (const rawIt of items || []) {
    if (!rawIt) continue
    if (rawIt.Added_by_role === 'admin' || rawIt.Nguoi_dat === 'Quán thêm') continue
    const mId = s(rawIt.Nguoi_dat_id).trim()
    const mName = s(rawIt.Nguoi_dat).trim()
    if (!mId || !mName) continue

    let existingKey = Object.keys(nextMembers).find(
      (k) => s(nextMembers[k]?.id || k).trim() === mId,
    )
    if (!existingKey) {
      existingKey = safeFirebaseKey(mId)
    }
    const prevRec = nextMembers[existingKey] || {}
    const resolvedRole =
      (hostId && mId === hostId) || rawIt.Added_by_role === 'host' || prevRec.role === 'host'
        ? 'host'
        : 'guest'
    nextMembers[existingKey] = sanitizeRow({
      ...prevRec,
      id: mId,
      name: mName,
      role: resolvedRole,
      done: resolvedRole === 'host' ? true : prevRec.done !== undefined ? Boolean(prevRec.done) : true,
      joinedAt: n(prevRec.joinedAt, nowTs),
      updatedAt: nowTs,
    })
  }
  if (hostId && fallbackHostName) {
    const hostKey = Object.keys(nextMembers).find(
      (k) => s(nextMembers[k]?.id || k).trim() === hostId,
    )
    if (hostKey && !nextMembers[hostKey].name) {
      nextMembers[hostKey].name = fallbackHostName
    }
  }
  return nextMembers
}

function normalizeLiveItemsObject(rawItems) {
  const itemsMap = {}
  const itemsList = []
  if (!rawItems || typeof rawItems !== 'object') {
    return { itemsMap, itemsList }
  }

  for (const [k, v] of Object.entries(rawItems)) {
    if (!v || typeof v !== 'object') continue
    const qty = n(v.So_luong, 0)
    if (qty <= 0) continue
    const price = n(v.Gia_ban, 0)
    const itemGiam = n(v.Giam_gia, 0)
    const itemCk = n(v.Chiet_khau, 0)
    const itemTienCk = n(v.Tien_chiet_khau, 0)
    const grossLine = n(v.Thanh_tien, 0) || price * qty
    const netLine =
      v.Thanh_tien_sau_giam !== undefined
        ? n(v.Thanh_tien_sau_giam, 0)
        : Math.max(0, grossLine - itemGiam * qty - itemTienCk)
    const normalized = {
      ...v,
      lineId: s(v.lineId || k),
      So_luong: qty,
      Gia_ban: price,
      Giam_gia: itemGiam,
      Chiet_khau: itemCk,
      Tien_chiet_khau: itemTienCk,
      Thanh_tien: grossLine,
      Thanh_tien_sau_giam: netLine,
      Ghi_chu: s(v.Ghi_chu),
      Nguoi_dat: s(v.Nguoi_dat),
      Nguoi_dat_id: s(v.Nguoi_dat_id),
    }
    itemsMap[k] = normalized
    itemsList.push(normalized)
  }

  itemsList.sort((a, b) => n(a.Added_at, 0) - n(b.Added_at, 0))
  return { itemsMap, itemsList }
}

export function normalizeLiveOrderSnapshot(orderId, raw) {
  const cleanId = s(orderId).trim()
  if (!raw || typeof raw !== 'object') {
    return {
      exists: false,
      orderId: cleanId,
      meta: null,
      submittedMeta: null,
      itemsMap: {},
      itemsList: [],
      submittedItemsMap: {},
      submittedItemsList: [],
      rawMembers: {},
      membersMap: {},
      membersList: [],
      kickedMap: {},
    }
  }

  const meta = raw.meta && typeof raw.meta === 'object' ? { ...raw.meta } : {}
  const submittedMeta =
    raw.submitted_meta && typeof raw.submitted_meta === 'object'
      ? { ...raw.submitted_meta }
      : meta
  const rawMembers = raw.members && typeof raw.members === 'object' ? { ...raw.members } : {}
  const kickedMap = raw.kicked && typeof raw.kicked === 'object' ? { ...raw.kicked } : {}
  const { itemsMap, itemsList } = normalizeLiveItemsObject(raw.items)
  const hasSubmittedItems =
    raw.submitted_items && typeof raw.submitted_items === 'object'
  const { itemsMap: submittedItemsMap, itemsList: submittedItemsList } = hasSubmittedItems
    ? normalizeLiveItemsObject(raw.submitted_items)
    : { itemsMap, itemsList }
  const membersMap = {}
  const membersList = []

  for (const [mk, mv] of Object.entries(rawMembers)) {
    if (!mv || typeof mv !== 'object') continue
    const mId = s(mv.id || mk)
    const isHost = Boolean(meta.Host_id && mId === s(meta.Host_id)) || mv.role === 'host'
    const entry = {
      key: mk,
      id: mId,
      name: s(mv.name),
      role: isHost ? 'host' : 'guest',
      done: isHost ? true : Boolean(mv.done),
      joinedAt: n(mv.joinedAt, 0),
      updatedAt: n(mv.updatedAt, 0),
    }
    membersMap[mk] = entry
    membersList.push(entry)
  }

  membersList.sort((a, b) => {
    if (a.role === 'host' && b.role !== 'host') return -1
    if (a.role !== 'host' && b.role === 'host') return 1
    return a.joinedAt - b.joinedAt
  })

  return {
    exists: true,
    orderId: cleanId,
    meta,
    submittedMeta,
    itemsMap,
    itemsList,
    submittedItemsMap,
    submittedItemsList,
    rawMembers,
    membersMap,
    membersList,
    kickedMap,
  }
}

export function subscribeLiveOrder(orderId, callback, onError) {
  const cleanId = safeFirebaseKey(orderId)
  const targetRef = dbRef(db, `live_orders/${cleanId}`)
  return onValue(
    targetRef,
    (snap) => {
      callback(normalizeLiveOrderSnapshot(orderId, snap.exists() ? snap.val() : null))
    },
    (err) => {
      if (onError) onError(err)
      else console.warn(`[Firebase] subscribeLiveOrder(${orderId}) error:`, err)
    },
  )
}

export function subscribeAllLiveOrders(callback, onError) {
  const targetRef = dbRef(db, 'live_orders')
  return onValue(
    targetRef,
    (snap) => {
      const map = {}
      if (snap.exists()) {
        const raw = snap.val() || {}
        for (const [key, val] of Object.entries(raw)) {
          if (!val || typeof val !== 'object') continue
          const oid = s(val?.meta?.Ma_hoa_don || key).trim() || key
          map[oid] = normalizeLiveOrderSnapshot(oid, val)
        }
      }
      callback(map)
    },
    (err) => {
      if (onError) onError(err)
      else console.warn('[Firebase] subscribeAllLiveOrders error:', err)
    },
  )
}

function stripAutoPromoTagText(rawNote) {
  return s(rawNote)
    .replace(/\s*\[KM ĐẠT ĐƯỢC:[^\]]*\]/gi, '')
    .trim()
}

function computeEarnedMilestonesViSummary(tongCong, kmEntries = []) {
  const total = n(tongCong, 0)
  if (total <= 0) return ''
  const unlocked = (kmEntries || [])
    .map((e) => e?.row || e)
    .filter(
      (k) =>
        k &&
        s(k.Loai_km).trim() === 'MILESTONE' &&
        k.Kich_hoat !== false &&
        n(k.Moc_tien, 0) > 0 &&
        total >= n(k.Moc_tien, 0),
    )
    .sort((a, b) => n(a.Moc_tien, 0) - n(b.Moc_tien, 0))
    .map((k) => {
      const viText = resolveNoticeText(k, 'vi')
      if (s(k.Kieu_uu_dai).trim() === 'GIFT') {
        return viText || 'Quà tặng'
      }
      return viText || 'Freeship'
    })
    .filter(Boolean)
  return unlocked.join(' | ')
}

async function syncSubmittedLiveOrderToDonHang(orderKey, orderId, options = {}) {
  const snap = await get(dbRef(db, `live_orders/${orderKey}`))
  if (!snap.exists()) return
  const parsed = normalizeLiveOrderSnapshot(orderId, snap.val())
  const meta = parsed.meta || {}
  const status = s(meta.Trang_thai).trim()
  const tongCong = parsed.itemsList.reduce((acc, it) => acc + n(it.Gia_ban) * n(it.So_luong), 0)
  const donViTienTe =
    s(parsed.itemsList[0]?.Don_vi_tien_te || meta.Don_vi_tien_te || 'P').trim() || 'P'

  const nowTs = Date.now()
  const updates = {
    [`live_orders/${orderKey}/meta/Tong_cong`]: tongCong,
    [`live_orders/${orderKey}/meta/Don_vi_tien_te`]: donViTienTe,
    [`live_orders/${orderKey}/meta/Updated_at`]: nowTs,
  }

  if (status === 'Chờ duyệt' || status === 'Đang xử lý') {
    const [dhEntries, kmEntries] = await Promise.all([
      readSheetEntries('don_hang'),
      status === 'Chờ duyệt' ? readSheetEntries('khuyenmai_info') : Promise.resolve([]),
    ])

    let syncedNote = meta.Ghi_chu !== undefined ? stripAutoPromoTagText(meta.Ghi_chu) : undefined
    let earnedPromoVi = s(meta.Khuyen_mai_dat_duoc)

    if (status === 'Chờ duyệt') {
      earnedPromoVi = computeEarnedMilestonesViSummary(tongCong, kmEntries)
      updates[`live_orders/${orderKey}/meta/Khuyen_mai_dat_duoc`] = earnedPromoVi
      if (syncedNote !== undefined) {
        updates[`live_orders/${orderKey}/meta/Ghi_chu`] = syncedNote
      }
      if (!options.skipSubmittedBump) {
        updates[`live_orders/${orderKey}/meta/Submitted_at`] = nowTs
        updates[`live_orders/${orderKey}/meta/Last_source`] = 'web'
        updates[`live_orders/${orderKey}/meta/Synced_by_admin`] = false
      }
    }

    const dhTarget = dhEntries.find((e) => s(e.row.Ma_hoa_don).trim() === s(orderId).trim())
    if (dhTarget) {
      dhTarget.row.Tong_gia_ban = tongCong
      dhTarget.row.Don_vi_tien_te = donViTienTe
      if (meta.Ten_khach_hang !== undefined) dhTarget.row.Ten_khach_hang = s(meta.Ten_khach_hang)
      if (meta.So_dien_thoai !== undefined) dhTarget.row.So_dien_thoai = s(meta.So_dien_thoai)
      if (meta.Dia_chi !== undefined) dhTarget.row.Dia_chi = s(meta.Dia_chi)
      if (meta.Thoi_gian_nhan_hang !== undefined) {
        dhTarget.row.Thoi_gian_nhan_hang = s(meta.Thoi_gian_nhan_hang)
      }
      if (meta.Hinh_thuc_thanh_toan !== undefined) {
        dhTarget.row.Hinh_thuc_thanh_toan = s(meta.Hinh_thuc_thanh_toan)
      }
      if (syncedNote !== undefined) dhTarget.row.Ghi_chu = syncedNote
      if (status === 'Chờ duyệt') dhTarget.row.Khuyen_mai_dat_duoc = earnedPromoVi
      updates[`don_hang/${dhTarget.key}`] = sanitizeRow(dhTarget.row)
    }
  }

  await update(dbRef(db), updates)
}

export async function ensureLiveOrderSession({
  orderId,
  hostId = '',
  hostName = '',
  meta = {},
  initialItems = [],
} = {}) {
  const cleanOrderId = s(orderId || genOrderId('WEB')).trim()
  const orderKey = safeFirebaseKey(cleanOrderId)
  const existingSnap = await get(dbRef(db, `live_orders/${orderKey}`))

  if (existingSnap.exists()) {
    const parsed = normalizeLiveOrderSnapshot(cleanOrderId, existingSnap.val())
    const st = s(parsed.meta?.Trang_thai).trim()
    if (st === 'Hoàn thành' || st === 'Đã hủy') {
      return { success: false, closed: true, status: st, orderId: cleanOrderId }
    }
    return { success: true, orderId: cleanOrderId, data: parsed, created: false }
  }

  const hhEntries = initialItems.length ? await readSheetEntries('hang_hoa') : []
  const hhMap = new Map(hhEntries.map((e) => [s(e.row.Ma_hang).trim(), e.row]))

  const itemsObj = {}
  let tongCong = 0
  let currency = s(meta.Don_vi_tien_te || 'P').trim() || 'P'

  for (const rawIt of initialItems) {
    const resolved = resolveCanonicalViItem(rawIt, hhMap)
    if (resolved.So_luong <= 0) continue
    const key = safeFirebaseKey(resolved.lineId)
    resolved.lineId = key
    itemsObj[key] = sanitizeRow(resolved)
    tongCong += resolved.Thanh_tien
    if (resolved.Don_vi_tien_te) currency = resolved.Don_vi_tien_te
  }

  const nowStr = formatVNDateTime()
  const hostMemberKey = hostId ? safeFirebaseKey(hostId) : ''
  const membersObj = hostMemberKey
    ? {
        [hostMemberKey]: sanitizeRow({
          id: s(hostId),
          name: s(hostName || meta.Ten_khach_hang),
          role: 'host',
          done: true,
          joinedAt: Date.now(),
          updatedAt: Date.now(),
        }),
      }
    : {}

  const sessionPayload = {
    meta: sanitizeRow({
      Ma_hoa_don: cleanOrderId,
      So_hoa_don: '',
      Trang_thai: 'Nháp',
      Ngay_tao_duong_lich: nowStr,
      Ten_khach_hang: s(meta.Ten_khach_hang || hostName),
      So_dien_thoai: s(meta.So_dien_thoai),
      Dia_chi: s(meta.Dia_chi),
      Thoi_gian_nhan_hang: s(meta.Thoi_gian_nhan_hang),
      Hinh_thuc_thanh_toan: s(meta.Hinh_thuc_thanh_toan || 'TIEN_MAT'),
      Ghi_chu: s(meta.Ghi_chu),
      Don_vi_tien_te: currency,
      Tong_cong: tongCong,
      Host_id: s(hostId),
      Host_name: s(hostName),
      ...(meta.Telegram_chat_id ? { Telegram_chat_id: s(meta.Telegram_chat_id) } : {}),
      ...(meta.Telegram_username ? { Telegram_username: s(meta.Telegram_username) } : {}),
      ...(meta.Telegram_lang ? { Telegram_lang: s(meta.Telegram_lang) } : {}),
      Created_at: Date.now(),
      Updated_at: Date.now(),
    }),
    items: itemsObj,
    members: membersObj,
  }

  await set(dbRef(db, `live_orders/${orderKey}`), sessionPayload)
  return {
    success: true,
    orderId: cleanOrderId,
    data: normalizeLiveOrderSnapshot(cleanOrderId, sessionPayload),
    created: true,
  }
}

export async function upsertLiveOrderMember({
  orderId,
  memberId,
  name = '',
  role = 'guest',
  done,
} = {}) {
  const cleanOrderId = s(orderId).trim()
  const cleanMemberId = s(memberId).trim()
  if (!cleanOrderId || !cleanMemberId) {
    return { success: false, message: 'Thiếu thông tin thành viên' }
  }

  const orderKey = safeFirebaseKey(cleanOrderId)
  const memberKey = safeFirebaseKey(cleanMemberId)
  const orderSnap = await get(dbRef(db, `live_orders/${orderKey}`))
  if (!orderSnap.exists()) {
    return { success: false, closed: true }
  }

  const parsed = normalizeLiveOrderSnapshot(cleanOrderId, orderSnap.val())
  const status = s(parsed.meta?.Trang_thai).trim()
  if (status === 'Hoàn thành' || status === 'Đã hủy') {
    return { success: false, closed: true, status }
  }
  if (status === 'Đang xử lý' || status === 'Đang ship') {
    return { success: false, locked: true, status }
  }

  const existingMember = parsed.membersMap?.[memberKey] || null
  const isHost =
    (parsed.meta?.Host_id && cleanMemberId === s(parsed.meta.Host_id)) ||
    existingMember?.role === 'host' ||
    role === 'host'

  const nextName = s(name) || s(existingMember?.name)
  const nextDone = isHost ? true : done !== undefined ? Boolean(done) : Boolean(existingMember?.done)

  const memberPayload = sanitizeRow({
    id: cleanMemberId,
    name: nextName,
    role: isHost ? 'host' : 'guest',
    done: nextDone,
    joinedAt: n(existingMember?.joinedAt, Date.now()),
    updatedAt: Date.now(),
  })

  const updates = {
    [`live_orders/${orderKey}/members/${memberKey}`]: memberPayload,
    [`live_orders/${orderKey}/kicked/${memberKey}`]: null,
    [`live_orders/${orderKey}/meta/Updated_at`]: Date.now(),
  }
  if (isHost && nextName) {
    updates[`live_orders/${orderKey}/meta/Host_name`] = nextName
  }
  if (nextName) {
    for (const [ik, iv] of Object.entries(parsed.itemsMap || {})) {
      if (s(iv.Nguoi_dat_id) === cleanMemberId && iv.Added_by_role !== 'admin') {
        updates[`live_orders/${orderKey}/items/${ik}/Nguoi_dat`] = nextName
      }
    }
  }

  await update(dbRef(db), updates)
  return { success: true, member: memberPayload }
}

export async function markAllLiveOrderMembersDone({ orderId, requesterId = '' } = {}) {
  const cleanOrderId = s(orderId).trim()
  if (!cleanOrderId) return { success: false, message: 'Thiếu mã đơn' }
  const orderKey = safeFirebaseKey(cleanOrderId)
  const orderSnap = await get(dbRef(db, `live_orders/${orderKey}`))
  if (!orderSnap.exists()) return { success: false, closed: true }

  const parsed = normalizeLiveOrderSnapshot(cleanOrderId, orderSnap.val())
  const status = s(parsed.meta?.Trang_thai).trim()
  if (status === 'Hoàn thành' || status === 'Đã hủy') {
    return { success: false, closed: true, status }
  }
  if (status === 'Đang xử lý' || status === 'Đang ship') {
    return { success: false, locked: true, status }
  }

  const hostId = s(parsed.meta?.Host_id).trim()
  if (hostId && requesterId && s(requesterId) !== hostId) {
    return { success: false, forbidden: true }
  }

  const nowTs = Date.now()
  const updates = {
    [`live_orders/${orderKey}/meta/Updated_at`]: nowTs,
  }
  for (const [mk, mv] of Object.entries(parsed.rawMembers || {})) {
    if (!mv || typeof mv !== 'object') continue
    if (!mv.done) {
      updates[`live_orders/${orderKey}/members/${mk}/done`] = true
      updates[`live_orders/${orderKey}/members/${mk}/updatedAt`] = nowTs
    }
  }
  await update(dbRef(db), updates)
  return { success: true }
}

export async function removeLiveOrderMember({
  orderId,
  targetMemberId = '',
  targetName = '',
  requesterId = '',
} = {}) {
  const cleanOrderId = s(orderId).trim()
  const cleanTargetId = s(targetMemberId).trim()
  const cleanTargetName = s(targetName).trim()
  if (!cleanOrderId || (!cleanTargetId && !cleanTargetName)) {
    return { success: false, message: 'Thiếu thông tin thành viên cần xóa' }
  }

  const orderKey = safeFirebaseKey(cleanOrderId)
  const orderSnap = await get(dbRef(db, `live_orders/${orderKey}`))
  if (!orderSnap.exists()) {
    return { success: false, closed: true }
  }

  const parsed = normalizeLiveOrderSnapshot(cleanOrderId, orderSnap.val())
  const status = s(parsed.meta?.Trang_thai).trim()
  if (status === 'Hoàn thành' || status === 'Đã hủy') {
    return { success: false, closed: true, status }
  }
  if (status === 'Đang xử lý' || status === 'Đang ship') {
    return { success: false, locked: true, status }
  }

  const hostId = s(parsed.meta?.Host_id).trim()
  if (hostId && requesterId && s(requesterId) !== hostId) {
    return { success: false, forbidden: true, message: 'Chỉ trưởng nhóm mới có quyền xóa thành viên' }
  }
  if (hostId && cleanTargetId && cleanTargetId === hostId) {
    return { success: false, message: 'Không thể xóa trưởng nhóm khỏi đơn' }
  }

  const updates = {
    [`live_orders/${orderKey}/meta/Updated_at`]: Date.now(),
  }

  const removedItems = []
  const lowerTargetName = cleanTargetName.toLowerCase()
  for (const [ik, iv] of Object.entries(parsed.itemsMap || {})) {
    if (iv.Added_by_role === 'admin') continue
    const itemMemberId = s(iv.Nguoi_dat_id).trim()
    const matchById = Boolean(cleanTargetId && itemMemberId === cleanTargetId)
    const matchByName = Boolean(
      !cleanTargetId &&
        !itemMemberId &&
        lowerTargetName &&
        s(iv.Nguoi_dat).trim().toLowerCase() === lowerTargetName,
    )
    if (matchById || matchByName) {
      removedItems.push(sanitizeRow(iv))
      updates[`live_orders/${orderKey}/items/${ik}`] = null
    }
  }

  if (cleanTargetId) {
    const memberKey = safeFirebaseKey(cleanTargetId)
    updates[`live_orders/${orderKey}/members/${memberKey}`] = null
    updates[`live_orders/${orderKey}/kicked/${memberKey}`] = sanitizeRow({
      id: cleanTargetId,
      name: cleanTargetName,
      kickedAt: Date.now(),
      items: removedItems,
    })
  }

  await update(dbRef(db), updates)
  return { success: true }
}

export async function rejoinLiveOrderMember({
  orderId,
  memberId,
  name = '',
  items = [],
} = {}) {
  const cleanOrderId = s(orderId).trim()
  const cleanMemberId = s(memberId).trim()
  if (!cleanOrderId || !cleanMemberId) {
    return { success: false, message: 'Thiếu thông tin thành viên' }
  }

  const orderKey = safeFirebaseKey(cleanOrderId)
  const memberKey = safeFirebaseKey(cleanMemberId)
  const orderSnap = await get(dbRef(db, `live_orders/${orderKey}`))
  if (!orderSnap.exists()) {
    return { success: false, closed: true }
  }

  const parsed = normalizeLiveOrderSnapshot(cleanOrderId, orderSnap.val())
  const status = s(parsed.meta?.Trang_thai).trim()
  if (status === 'Hoàn thành' || status === 'Đã hủy') {
    return { success: false, closed: true, status }
  }
  if (status === 'Đang xử lý' || status === 'Đang ship') {
    return { success: false, locked: true, status }
  }

  const existingMember = parsed.membersMap?.[memberKey] || null
  const isHost =
    (parsed.meta?.Host_id && cleanMemberId === s(parsed.meta.Host_id)) ||
    existingMember?.role === 'host'
  const kickedRecord = parsed.kickedMap?.[memberKey] || null
  const savedFromKicked = Array.isArray(kickedRecord?.items)
    ? kickedRecord.items
    : Object.values(kickedRecord?.items || {})
  const itemsToRestore = Array.isArray(items) && items.length > 0 ? items : savedFromKicked

  const resolvedName =
    s(name) || s(existingMember?.name) || s(kickedRecord?.name) || 'Khách'

  const updates = {
    [`live_orders/${orderKey}/meta/Updated_at`]: Date.now(),
    [`live_orders/${orderKey}/kicked/${memberKey}`]: null,
    [`live_orders/${orderKey}/members/${memberKey}`]: sanitizeRow({
      id: cleanMemberId,
      name: resolvedName,
      role: isHost ? 'host' : 'guest',
      done: isHost ? true : false,
      joinedAt: n(existingMember?.joinedAt, Date.now()),
      updatedAt: Date.now(),
    }),
  }

  if (itemsToRestore.length > 0) {
    const hhEntries = await readSheetEntries('hang_hoa')
    const hhMap = new Map(hhEntries.map((e) => [s(e.row.Ma_hang).trim(), e.row]))

    for (const rawIt of itemsToRestore) {
      if (!rawIt || typeof rawIt !== 'object') continue
      const qty = n(rawIt.So_luong ?? rawIt.qty, 0)
      if (qty <= 0) continue
      const maHang = s(rawIt.Ma_hang || rawIt.maHang).trim()
      const targetLineKey = safeFirebaseKey(
        rawIt.lineId || makeLineId(maHang || rawIt.Ten_hang, cleanMemberId),
      )
      const canonical = resolveCanonicalViItem(
        {
          ...rawIt,
          lineId: targetLineKey,
          So_luong: qty,
          Nguoi_dat: resolvedName,
          Nguoi_dat_id: cleanMemberId,
          Added_by_role: isHost ? 'host' : 'guest',
        },
        hhMap,
      )
      canonical.lineId = targetLineKey
      updates[`live_orders/${orderKey}/items/${targetLineKey}`] = sanitizeRow(canonical)
    }
  }

  await update(dbRef(db), updates)
  await syncSubmittedLiveOrderToDonHang(orderKey, cleanOrderId)
  return { success: true, restoredCount: itemsToRestore.length }
}

export async function upsertLiveOrderItem({
  orderId,
  lineId = '',
  item = {},
  memberId = 'host',
  memberName = '',
  role = 'guest',
  deltaQty = null,
} = {}) {
  const cleanOrderId = s(orderId).trim()
  if (!cleanOrderId) return { success: false, message: 'Thiếu mã đơn' }
  const orderKey = safeFirebaseKey(cleanOrderId)

  const [orderSnap, hhEntries] = await Promise.all([
    get(dbRef(db, `live_orders/${orderKey}`)),
    readSheetEntries('hang_hoa'),
  ])

  if (!orderSnap.exists()) {
    return { success: false, closed: true, message: 'Phiên đặt đơn không tồn tại hoặc đã đóng' }
  }

  const parsed = normalizeLiveOrderSnapshot(cleanOrderId, orderSnap.val())
  const status = s(parsed.meta?.Trang_thai).trim()
  if (status === 'Hoàn thành' || status === 'Đã hủy') {
    return { success: false, closed: true, status }
  }
  if (role !== 'admin' && (status === 'Đang xử lý' || status === 'Đang ship')) {
    return {
      success: false,
      locked: true,
      status,
      message: 'Đơn hàng đã được quán duyệt nên không thể tự chỉnh sửa thêm.',
    }
  }

  const hhMap = new Map(hhEntries.map((e) => [s(e.row.Ma_hang).trim(), e.row]))
  const maHang = s(item.Ma_hang || item.maHang).trim()
  const targetLineKey = safeFirebaseKey(
    lineId || item.lineId || makeLineId(maHang || item.Ten_hang, memberId),
  )
  const existingLine = parsed.itemsMap[targetLineKey] || null

  const nextQty =
    deltaQty !== null && deltaQty !== undefined
      ? n(existingLine?.So_luong, 0) + n(deltaQty, 0)
      : n(item.So_luong ?? item.qty ?? existingLine?.So_luong, 1)

  if (nextQty <= 0) {
    await remove(dbRef(db, `live_orders/${orderKey}/items/${targetLineKey}`))
    if (role === 'admin') {
      await remove(dbRef(db, `live_orders/${orderKey}/submitted_items/${targetLineKey}`))
      await syncSubmittedLiveOrderToDonHang(orderKey, cleanOrderId, { skipSubmittedBump: true })
    }
    return { success: true, removed: true, lineId: targetLineKey }
  }

  const effectiveRole =
    role === 'admin'
      ? 'admin'
      : parsed.meta?.Host_id && s(memberId) === s(parsed.meta.Host_id)
        ? 'host'
        : s(existingLine?.Added_by_role || role)

  const mergedInput = {
    ...(existingLine || {}),
    ...item,
    lineId: targetLineKey,
    So_luong: nextQty,
    // Keep admin-edited price when customer only changes qty/note
    Gia_ban:
      role === 'admin' && item.Gia_ban !== undefined
        ? n(item.Gia_ban)
        : existingLine?.Gia_ban !== undefined
          ? n(existingLine.Gia_ban)
          : item.Gia_ban,
    Ghi_chu:
      item.Ghi_chu !== undefined
        ? s(item.Ghi_chu)
        : item.note !== undefined
          ? s(item.note)
          : s(existingLine?.Ghi_chu),
    Nguoi_dat:
      item.Nguoi_dat !== undefined
        ? s(item.Nguoi_dat)
        : s(existingLine?.Nguoi_dat || memberName),
    Nguoi_dat_id: s(item.Nguoi_dat_id || existingLine?.Nguoi_dat_id || memberId),
    Added_by_role: effectiveRole,
    Added_at: n(existingLine?.Added_at, Date.now()),
  }

  const canonical = resolveCanonicalViItem(mergedInput, hhMap)
  canonical.lineId = targetLineKey

  const writeUpdates = {
    [`live_orders/${orderKey}/items/${targetLineKey}`]: sanitizeRow(canonical),
  }

  if (role !== 'admin' && memberId) {
    const memberKey = safeFirebaseKey(memberId)
    const existingMember = parsed.membersMap?.[memberKey] || null
    const isHost =
      (parsed.meta?.Host_id && s(memberId) === s(parsed.meta.Host_id)) ||
      existingMember?.role === 'host'
    writeUpdates[`live_orders/${orderKey}/members/${memberKey}`] = sanitizeRow({
      id: s(memberId),
      name: s(canonical.Nguoi_dat || memberName || existingMember?.name),
      role: isHost ? 'host' : 'guest',
      done: isHost ? true : false,
      joinedAt: n(existingMember?.joinedAt, Date.now()),
      updatedAt: Date.now(),
    })
    writeUpdates[`live_orders/${orderKey}/kicked/${memberKey}`] = null
  }

  if (role === 'admin') {
    writeUpdates[`live_orders/${orderKey}/submitted_items/${targetLineKey}`] = sanitizeRow(canonical)
  }

  await update(dbRef(db), writeUpdates)
  if (role === 'admin') {
    await syncSubmittedLiveOrderToDonHang(orderKey, cleanOrderId, { skipSubmittedBump: true })
  }
  return { success: true, lineId: targetLineKey, item: canonical }
}

export async function removeLiveOrderItem({
  orderId,
  lineId,
  role = 'guest',
} = {}) {
  const cleanOrderId = s(orderId).trim()
  const cleanLineKey = safeFirebaseKey(lineId)
  if (!cleanOrderId || !cleanLineKey) return { success: false, message: 'Thiếu thông tin dòng' }

  const orderKey = safeFirebaseKey(cleanOrderId)
  const orderSnap = await get(dbRef(db, `live_orders/${orderKey}`))
  if (!orderSnap.exists()) return { success: false, closed: true }

  const parsed = normalizeLiveOrderSnapshot(cleanOrderId, orderSnap.val())
  const status = s(parsed.meta?.Trang_thai).trim()
  if (status === 'Hoàn thành' || status === 'Đã hủy') {
    return { success: false, closed: true, status }
  }
  if (role !== 'admin' && (status === 'Đang xử lý' || status === 'Đang ship')) {
    return { success: false, locked: true, status }
  }

  await remove(dbRef(db, `live_orders/${orderKey}/items/${cleanLineKey}`))
  if (role === 'admin') {
    await remove(dbRef(db, `live_orders/${orderKey}/submitted_items/${cleanLineKey}`))
    await syncSubmittedLiveOrderToDonHang(orderKey, cleanOrderId, { skipSubmittedBump: true })
  }
  return { success: true }
}

export async function updateLiveOrderMeta({
  orderId,
  patch = {},
  role = 'host',
} = {}) {
  const cleanOrderId = s(orderId).trim()
  if (!cleanOrderId) return { success: false, message: 'Thiếu mã đơn' }
  const orderKey = safeFirebaseKey(cleanOrderId)

  const orderSnap = await get(dbRef(db, `live_orders/${orderKey}`))
  if (!orderSnap.exists()) return { success: false, closed: true }

  const parsed = normalizeLiveOrderSnapshot(cleanOrderId, orderSnap.val())
  const status = s(parsed.meta?.Trang_thai).trim()
  if (status === 'Hoàn thành' || status === 'Đã hủy') {
    return { success: false, closed: true, status }
  }
  if (role !== 'admin' && (status === 'Đang xử lý' || status === 'Đang ship')) {
    return { success: false, locked: true, status }
  }

  const allowedFields = [
    'Ten_khach_hang',
    'So_dien_thoai',
    'Dia_chi',
    'Thoi_gian_nhan_hang',
    'Hinh_thuc_thanh_toan',
    'Ghi_chu',
    'Khuyen_mai_dat_duoc',
    'Host_nudge_at',
  ]
  const updates = {
    [`live_orders/${orderKey}/meta/Updated_at`]: Date.now(),
  }
  for (const f of allowedFields) {
    if (patch[f] !== undefined) {
      updates[`live_orders/${orderKey}/meta/${f}`] = s(patch[f])
    }
  }

  await update(dbRef(db), updates)
  if (role === 'admin') {
    await syncSubmittedLiveOrderToDonHang(orderKey, cleanOrderId, { skipSubmittedBump: true })
  }
  return { success: true }
}

export async function sendAdminOrderMessage({ orderId, message } = {}) {
  const cleanOrderId = s(orderId).trim()
  const cleanMsg = s(message).trim()
  if (!cleanOrderId) return { success: false, message: 'Thiếu mã đơn' }
  if (!cleanMsg) return { success: false, message: 'Chưa nhập nội dung lời nhắn' }

  const orderKey = safeFirebaseKey(cleanOrderId)
  const orderSnap = await get(dbRef(db, `live_orders/${orderKey}`))
  if (!orderSnap.exists()) {
    return { success: false, message: 'Không tìm thấy phiên đơn web của khách' }
  }

  const rawSnapVal = orderSnap.val() || {}
  const now = Date.now()
  await update(dbRef(db), {
    [`live_orders/${orderKey}/meta/Admin_message`]: cleanMsg,
    [`live_orders/${orderKey}/meta/Admin_message_at`]: now,
    [`live_orders/${orderKey}/meta/Updated_at`]: now,
  })
  if (rawSnapVal.meta?.Telegram_chat_id) {
    notifyCustomerTelegram({
      orderId: cleanOrderId,
      event: 'message',
      adminMessage: cleanMsg,
    })
  }
  return { success: true, sentAt: now }
}

export async function restoreSubmittedLiveOrderDraft({ orderId } = {}) {
  const cleanOrderId = s(orderId).trim()
  if (!cleanOrderId) return { success: false, message: 'Thiếu mã đơn' }
  const orderKey = safeFirebaseKey(cleanOrderId)
  const snap = await get(dbRef(db, `live_orders/${orderKey}`))
  if (!snap.exists()) return { success: false, closed: true }

  const raw = snap.val() || {}
  const subMeta = raw.submitted_meta && typeof raw.submitted_meta === 'object' ? raw.submitted_meta : raw.meta
  const subItems =
    raw.submitted_items && typeof raw.submitted_items === 'object' ? raw.submitted_items : null
  if (!subItems || !Object.keys(subItems).length) {
    return { success: false, message: 'Không tìm thấy món đã đặt trước đó' }
  }

  const updates = {
    [`live_orders/${orderKey}/items`]: subItems,
    [`live_orders/${orderKey}/meta/Updated_at`]: Date.now(),
  }
  if (subMeta?.Submitted_sig !== undefined) {
    updates[`live_orders/${orderKey}/meta/Submitted_sig`] = s(subMeta.Submitted_sig)
  }
  await update(dbRef(db), updates)
  return { success: true }
}

export async function submitCustomerOrder(body = {}) {
  const rawOrderId = s(body.orderId || body.Ma_hoa_don).trim()
  let cleanOrderId = rawOrderId || genOrderId('WEB')
  let orderKey = safeFirebaseKey(cleanOrderId)

  const [existingSnap, hhEntries, dhEntries, kmEntries] = await Promise.all([
    get(dbRef(db, `live_orders/${orderKey}`)),
    readSheetEntries('hang_hoa'),
    readSheetEntries('don_hang'),
    readSheetEntries('khuyenmai_info'),
  ])

  let existingParsed = existingSnap.exists()
    ? normalizeLiveOrderSnapshot(cleanOrderId, existingSnap.val())
    : null

  // Prevent reusing an already completed/cancelled order link
  if (
    existingParsed &&
    (existingParsed.meta?.Trang_thai === 'Hoàn thành' ||
      existingParsed.meta?.Trang_thai === 'Đã hủy')
  ) {
    cleanOrderId = genOrderId('WEB')
    orderKey = safeFirebaseKey(cleanOrderId)
    existingParsed = null
  }

  if (
    existingParsed &&
    (existingParsed.meta?.Trang_thai === 'Đang xử lý' ||
      existingParsed.meta?.Trang_thai === 'Đang ship')
  ) {
    return {
      success: false,
      locked: true,
      orderId: cleanOrderId,
      message: 'Đơn hàng này đã được quán duyệt và đang xử lý/ship đi.',
    }
  }

  const hhMap = new Map(hhEntries.map((e) => [s(e.row.Ma_hang).trim(), e.row]))
  const incomingItems = Array.isArray(body.items) ? body.items : null
  const itemsObj = {}
  const resolvedList = []

  if (incomingItems && incomingItems.length > 0) {
    for (const rawIt of incomingItems) {
      const existingLine =
        rawIt.lineId && existingParsed?.itemsMap?.[safeFirebaseKey(rawIt.lineId)]
          ? existingParsed.itemsMap[safeFirebaseKey(rawIt.lineId)]
          : null
      const resolved = resolveCanonicalViItem(
        {
          ...rawIt,
          Gia_ban: existingLine?.Gia_ban !== undefined ? existingLine.Gia_ban : rawIt.Gia_ban,
          ...(existingLine?.Dvt_custom
            ? { Dvt: existingLine.Dvt ?? '', Dvt_custom: true }
            : {}),
          Added_at: existingLine?.Added_at || rawIt.Added_at || Date.now(),
        },
        hhMap,
      )
      if (resolved.So_luong <= 0) continue
      const key = safeFirebaseKey(resolved.lineId)
      resolved.lineId = key
      itemsObj[key] = sanitizeRow(resolved)
      resolvedList.push(resolved)
    }
  } else if (existingParsed) {
    for (const it of existingParsed.itemsList) {
      const resolved = resolveCanonicalViItem(it, hhMap)
      if (resolved.So_luong <= 0) continue
      const key = safeFirebaseKey(resolved.lineId)
      resolved.lineId = key
      itemsObj[key] = sanitizeRow(resolved)
      resolvedList.push(resolved)
    }
  }

  if (!resolvedList.length) {
    return { success: false, message: 'Giỏ hàng đang trống' }
  }

  const metaIn = body.meta || {}
  const prevStatus = s(existingParsed?.meta?.Trang_thai).trim()
  const nowStr =
    prevStatus && prevStatus !== 'Nháp' && existingParsed?.meta?.Ngay_tao_duong_lich
      ? existingParsed.meta.Ngay_tao_duong_lich
      : formatVNDateTime()
  const tongCong = resolvedList.reduce((acc, it) => acc + n(it.Gia_ban) * n(it.So_luong), 0)
  const currency =
    s(resolvedList[0]?.Don_vi_tien_te || metaIn.Don_vi_tien_te || 'P').trim() || 'P'

  const tenKhach = s(
    metaIn.Ten_khach_hang ?? existingParsed?.meta?.Ten_khach_hang ?? body.hostName ?? 'Khách lẻ',
  ).trim() || 'Khách lẻ'
  const sdt = s(metaIn.So_dien_thoai ?? existingParsed?.meta?.So_dien_thoai).trim()
  const diaChi = s(metaIn.Dia_chi ?? existingParsed?.meta?.Dia_chi).trim()
  const thoiGian = s(
    metaIn.Thoi_gian_nhan_hang ?? existingParsed?.meta?.Thoi_gian_nhan_hang,
  ).trim() || nowStr
  const thanhToan = s(
    metaIn.Hinh_thuc_thanh_toan ?? existingParsed?.meta?.Hinh_thuc_thanh_toan ?? 'TIEN_MAT',
  ).trim() || 'TIEN_MAT'
  const earnedPromoVi =
    computeEarnedMilestonesViSummary(tongCong, kmEntries) ||
    s(metaIn.Khuyen_mai_dat_duoc).trim()
  const ghiChu = stripAutoPromoTagText(metaIn.Ghi_chu ?? existingParsed?.meta?.Ghi_chu)
  const maKH = genAutoMaKhachHang(tenKhach, sdt, diaChi)

  const dhTarget = dhEntries.find((e) => s(e.row.Ma_hoa_don).trim() === cleanOrderId)
  const dhKey = dhTarget ? dhTarget.key : createRowKey()
  const existingOrderStatus = s(existingParsed?.meta?.Trang_thai).trim()
  const isNewOrderNotification =
    !dhTarget && (!existingOrderStatus || existingOrderStatus === 'Nháp')
  const webUpdateTs = isNewOrderNotification ? 0 : Date.now()

  const tgChatId = s(metaIn.Telegram_chat_id || existingParsed?.meta?.Telegram_chat_id).trim()
  const tgUsername = s(metaIn.Telegram_username || existingParsed?.meta?.Telegram_username).trim()
  const tgLang = s(metaIn.Telegram_lang || existingParsed?.meta?.Telegram_lang).trim()

  const nextMeta = sanitizeRow({
    Ma_hoa_don: cleanOrderId,
    So_hoa_don: s(existingParsed?.meta?.So_hoa_don),
    Ma_khach_hang: maKH,
    Trang_thai: 'Chờ duyệt',
    Ngay_tao_duong_lich: nowStr,
    Ten_khach_hang: tenKhach,
    So_dien_thoai: sdt,
    Dia_chi: diaChi,
    Thoi_gian_nhan_hang: thoiGian,
    Hinh_thuc_thanh_toan: thanhToan,
    Ghi_chu: ghiChu,
    Khuyen_mai_dat_duoc: earnedPromoVi,
    Submitted_sig: s(metaIn.Submitted_sig ?? existingParsed?.meta?.Submitted_sig),
    Don_vi_tien_te: currency,
    Phi_ship: n(existingParsed?.meta?.Phi_ship),
    Tong_cong: tongCong,
    Host_id: s(body.hostId || existingParsed?.meta?.Host_id),
    Host_name: s(body.hostName || existingParsed?.meta?.Host_name || tenKhach),
    ...(tgChatId ? { Telegram_chat_id: tgChatId } : {}),
    ...(tgUsername ? { Telegram_username: tgUsername } : {}),
    ...(tgLang ? { Telegram_lang: tgLang } : {}),
    Created_at: n(existingParsed?.meta?.Created_at, Date.now()),
    Submitted_at: Date.now(),
    Updated_at: Date.now(),
    Last_web_update_at: webUpdateTs,
    Synced_by_admin: false,
    Last_source: 'web',
  })

  const dhRow = sanitizeRow({
    ...(dhTarget?.row || {}),
    Ma_hoa_don: cleanOrderId,
    So_hoa_don: s(dhTarget?.row?.So_hoa_don || ''),
    Ngay_tao_duong_lich: nowStr,
    Ma_khach_hang: maKH,
    Ten_khach_hang: tenKhach,
    So_dien_thoai: sdt,
    Dia_chi: diaChi,
    Thoi_gian_nhan_hang: thoiGian,
    Tong_gia_ban: tongCong,
    Ghi_chu: ghiChu,
    Khuyen_mai_dat_duoc: earnedPromoVi,
    Hinh_thuc_thanh_toan: thanhToan,
    Trang_thai: 'Chờ duyệt',
    Don_vi_tien_te: currency,
    Nguon_don: 'WEB',
    ...(webUpdateTs > 0 ? { Last_web_update_at: webUpdateTs } : {}),
  })

  const preservedMembers = { ...(existingParsed?.rawMembers || {}) }
  const nowMemberTs = Date.now()
  for (const mk of Object.keys(preservedMembers)) {
    if (!preservedMembers[mk] || typeof preservedMembers[mk] !== 'object') continue
    preservedMembers[mk] = sanitizeRow({
      ...preservedMembers[mk],
      done: true,
      updatedAt: nowMemberTs,
    })
  }
  const submitHostId = s(body.hostId || existingParsed?.meta?.Host_id)
  if (submitHostId) {
    const hKey = safeFirebaseKey(submitHostId)
    preservedMembers[hKey] = sanitizeRow({
      ...(preservedMembers[hKey] || {}),
      id: submitHostId,
      name: s(body.hostName || existingParsed?.meta?.Host_name || tenKhach),
      role: 'host',
      done: true,
      joinedAt: n(preservedMembers[hKey]?.joinedAt, Date.now()),
      updatedAt: Date.now(),
    })
  }

  const updates = {
    [`live_orders/${orderKey}`]: {
      meta: nextMeta,
      submitted_meta: nextMeta,
      items: itemsObj,
      submitted_items: itemsObj,
      members: preservedMembers,
    },
    [`don_hang/${dhKey}`]: dhRow,
  }

  await update(dbRef(db), updates)

  const updateChanges = isNewOrderNotification
    ? []
    : buildOrderUpdateSummaryForTelegram(
        existingParsed?.submittedMeta || dhTarget?.row || null,
        existingParsed?.submittedItemsList?.length
          ? existingParsed.submittedItemsList
          : existingParsed?.itemsList || [],
        { tenKhach, sdt, diaChi, thoiGian, thanhToan, ghiChu },
        resolvedList,
      )

  try {
    notifyNewOrderTelegram({
      orderId: cleanOrderId,
      isUpdate: !isNewOrderNotification,
      updateChanges,
      tenKhach,
      sdt,
      diaChi,
      thoiGian,
      hinhThucTT: thanhToan,
      ghiChu,
      khuyenMai: earnedPromoVi,
      tongCong,
      donViTienTe: currency,
      items: resolvedList,
      adminUrl: 'https://sakitchen.shop/admin',
    })
  } catch {}

  if (tgChatId || body.telegramInitData) {
    const totalItemQty = resolvedList.reduce((acc, it) => acc + Math.max(0, n(it.So_luong)), 0)
    notifyCustomerTelegram({
      orderId: cleanOrderId,
      event: isNewOrderNotification ? 'submitted' : 'updated',
      initData: s(body.telegramInitData),
      lang: tgLang || 'vi',
      tenKhach,
      tongCong,
      donViTienTe: currency,
      itemCount: totalItemQty,
      thoiGian,
    })
  }

  return {
    success: true,
    orderId: cleanOrderId,
    status: 'Chờ duyệt',
    Tong_cong: tongCong,
  }
}

function buildOrderUpdateSummaryForTelegram(prevMeta, prevItems, nextMeta, nextItems) {
  const changes = []
  const prevList = Array.isArray(prevItems) ? prevItems : []
  const nextList = Array.isArray(nextItems) ? nextItems : []
  const prevMap = new Map()
  for (const it of prevList) {
    const key = safeFirebaseKey(it?.lineId || it?.Ma_hang || it?.Ten_hang)
    if (key) prevMap.set(key, it)
  }
  const nextMap = new Map()
  for (const it of nextList) {
    const key = safeFirebaseKey(it?.lineId || it?.Ma_hang || it?.Ten_hang)
    if (key) nextMap.set(key, it)
  }

  for (const [key, nextIt] of nextMap.entries()) {
    const name = s(nextIt?.Ten_hang || nextIt?.Ma_hang || 'Món').trim()
    const nextQty = n(nextIt?.So_luong, 0)
    const prevIt = prevMap.get(key)
    if (!prevIt) {
      changes.push(`+ Thêm ${name} ×${nextQty}`)
      continue
    }
    const prevQty = n(prevIt?.So_luong, 0)
    if (nextQty !== prevQty) {
      changes.push(`~ Đổi SL ${name}: ×${prevQty} → ×${nextQty}`)
    }
    if (s(nextIt?.Ghi_chu).trim() !== s(prevIt?.Ghi_chu).trim()) {
      const nextNote = s(nextIt?.Ghi_chu).trim()
      changes.push(nextNote ? `~ Ghi chú ${name}: ${nextNote}` : `~ Xóa ghi chú ${name}`)
    }
  }

  for (const [key, prevIt] of prevMap.entries()) {
    if (!nextMap.has(key)) {
      const name = s(prevIt?.Ten_hang || prevIt?.Ma_hang || 'Món').trim()
      const prevQty = n(prevIt?.So_luong, 0)
      changes.push(`- Bỏ ${name} (trước ×${prevQty})`)
    }
  }

  if (prevMeta && typeof prevMeta === 'object') {
    const prevTen = s(prevMeta.Ten_khach_hang).trim()
    const nextTen = s(nextMeta.tenKhach).trim()
    if (nextTen !== prevTen && nextTen) {
      changes.push(`~ Đổi tên khách: ${prevTen || '—'} → ${nextTen}`)
    }
    const prevSdt = s(prevMeta.So_dien_thoai).trim()
    const nextSdt = s(nextMeta.sdt).trim()
    if (nextSdt !== prevSdt) {
      changes.push(`~ Đổi SĐT: ${prevSdt || '—'} → ${nextSdt || '—'}`)
    }
    const prevAddr = s(prevMeta.Dia_chi).trim()
    const nextAddr = s(nextMeta.diaChi).trim()
    if (nextAddr !== prevAddr) {
      changes.push(`~ Đổi địa chỉ: ${prevAddr || '—'} → ${nextAddr || '—'}`)
    }
    const prevTime = s(prevMeta.Thoi_gian_nhan_hang).trim()
    const nextTime = s(nextMeta.thoiGian).trim()
    if (nextTime !== prevTime) {
      changes.push(`~ Đổi giờ nhận: ${prevTime || '—'} → ${nextTime || '—'}`)
    }
    const prevPay = s(prevMeta.Hinh_thuc_thanh_toan).trim()
    const nextPay = s(nextMeta.thanhToan).trim()
    if (nextPay !== prevPay) {
      const label = (v) => (v === 'CHUYEN_KHOAN' ? 'Chuyển khoản' : 'Tiền mặt')
      changes.push(`~ Đổi thanh toán: ${label(prevPay)} → ${label(nextPay)}`)
    }
    const prevNote = stripAutoPromoTagText(prevMeta.Ghi_chu)
    const nextNote = s(nextMeta.ghiChu).trim()
    if (nextNote !== prevNote) {
      changes.push(nextNote ? `~ Đổi ghi chú đơn: ${nextNote}` : '~ Xóa ghi chú đơn')
    }
  }

  return changes
}

function notifyNewOrderTelegram(payload) {
  if (typeof fetch !== 'function') return
  try {
    fetch('/api/telegram-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      keepalive: true,
      body: JSON.stringify(payload),
    }).catch(() => {})
  } catch {}
}

function notifyCustomerTelegram(payload) {
  if (typeof fetch !== 'function') return
  try {
    fetch('/api/telegram-customer-notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      keepalive: true,
      body: JSON.stringify(payload),
    }).catch(() => {})
  } catch {}
}

export async function adminSyncOrderItems(body = {}) {
  const maHoaDon = s(body.Ma_hoa_don || body.orderId).trim()
  if (!maHoaDon) return { success: false, message: 'Thiếu Ma_hoa_don' }
  const orderKey = safeFirebaseKey(maHoaDon)

  const [
    liveSnap,
    hhEntries,
    dhEntries,
    hdEntries,
    ctEntries,
    tcEntries,
    bcEntries,
    khEntries,
  ] = await Promise.all([
    get(dbRef(db, `live_orders/${orderKey}`)),
    readSheetEntries('hang_hoa'),
    readSheetEntries('don_hang'),
    readSheetEntries('hoa_don_tong_quat'),
    readSheetEntries('hoa_don_chi_tiet'),
    readSheetEntries('so_thu_chi'),
    readSheetEntries('bao_cao'),
    readSheetEntries('khach_hang'),
  ])

  const dhTarget = dhEntries.find((e) => s(e.row.Ma_hoa_don).trim() === maHoaDon)
  const liveParsed = liveSnap.exists()
    ? normalizeLiveOrderSnapshot(maHoaDon, liveSnap.val())
    : null

  if (!dhTarget && !liveParsed) {
    return { success: false, message: 'Không tìm thấy đơn hàng' }
  }

  const hhMap = new Map(hhEntries.map((e) => [s(e.row.Ma_hang).trim(), e.row]))
  const incomingItems = Array.isArray(body.items)
    ? body.items
    : liveParsed
      ? liveParsed.itemsList
      : ctEntries.filter((e) => s(e.row.Ma_hoa_don).trim() === maHoaDon).map((e) => e.row)

  const itemsObj = {}
  const resolvedList = []
  let idx = 0
  for (const rawIt of incomingItems) {
    idx++
    const fallbackLineId =
      s(rawIt.lineId).trim() ||
      makeLineId(
        rawIt.Ma_hang || rawIt.Ten_hang || `item_${idx}`,
        rawIt.Nguoi_dat_id || rawIt.Nguoi_dat || `line_${idx}`,
      )
    const resolved = resolveCanonicalViItem({ ...rawIt, lineId: fallbackLineId }, hhMap)
    if (resolved.So_luong <= 0) continue
    const k = safeFirebaseKey(resolved.lineId)
    resolved.lineId = k
    itemsObj[k] = sanitizeRow(resolved)
    resolvedList.push(resolved)
  }

  const metaPatch = body.meta || {}
  const curStatus = s(
    dhTarget?.row?.Trang_thai || liveParsed?.meta?.Trang_thai || 'Chờ duyệt',
  ).trim()
  const nowStr = s(
    dhTarget?.row?.Ngay_tao_duong_lich ||
      liveParsed?.meta?.Ngay_tao_duong_lich ||
      formatVNDateTime(),
  )
  const soHoaDon = s(dhTarget?.row?.So_hoa_don || liveParsed?.meta?.So_hoa_don)
  const tenKhach = s(
    metaPatch.Ten_khach_hang ??
      dhTarget?.row?.Ten_khach_hang ??
      liveParsed?.meta?.Ten_khach_hang ??
      'Khách lẻ',
  )
  const sdt = s(
    metaPatch.So_dien_thoai ?? dhTarget?.row?.So_dien_thoai ?? liveParsed?.meta?.So_dien_thoai,
  )
  const diaChi = s(metaPatch.Dia_chi ?? dhTarget?.row?.Dia_chi ?? liveParsed?.meta?.Dia_chi)
  const thoiGian = s(
    metaPatch.Thoi_gian_nhan_hang ??
      dhTarget?.row?.Thoi_gian_nhan_hang ??
      liveParsed?.meta?.Thoi_gian_nhan_hang ??
      nowStr,
  )
  const thanhToan = s(
    metaPatch.Hinh_thuc_thanh_toan ??
      dhTarget?.row?.Hinh_thuc_thanh_toan ??
      liveParsed?.meta?.Hinh_thuc_thanh_toan ??
      'TIEN_MAT',
  )
  const ghiChu = s(metaPatch.Ghi_chu ?? dhTarget?.row?.Ghi_chu ?? liveParsed?.meta?.Ghi_chu)
  const maKH = s(
    dhTarget?.row?.Ma_khach_hang ||
      liveParsed?.meta?.Ma_khach_hang ||
      genAutoMaKhachHang(tenKhach, sdt, diaChi),
  )

  const tongCong = resolvedList.reduce((acc, it) => acc + n(it.Gia_ban) * n(it.So_luong), 0)
  const tongGiaGoc = resolvedList.reduce((acc, it) => acc + n(it.Gia_goc) * n(it.So_luong), 0)
  const tongLoiNhuan = resolvedList.reduce(
    (acc, it) =>
      acc +
      calcOrderLineProfit({
        giaBan: it.Gia_ban,
        giaGoc: it.Gia_goc,
        soLuong: it.So_luong,
        nccLoaiGiam: it.Ncc_loai_giam,
        nccGiaTriGiam: it.Ncc_gia_tri_giam,
      }),
    0,
  )
  const currency =
    s(
      resolvedList[0]?.Don_vi_tien_te ||
        dhTarget?.row?.Don_vi_tien_te ||
        liveParsed?.meta?.Don_vi_tien_te ||
        'P',
    ).trim() || 'P'
  const phiShip =
    metaPatch.Phi_ship !== undefined
      ? Math.max(0, n(metaPatch.Phi_ship))
      : n(liveParsed?.meta?.Phi_ship ?? dhTarget?.row?.Phi_ship)

  const updates = {}

  // 1. Sync live_orders so Customer's cart & submitted snapshot stay in sync
  if (liveParsed || curStatus === 'Chờ duyệt') {
    const nextLiveMeta = sanitizeRow({
      ...(liveParsed?.meta || {}),
      Ma_hoa_don: maHoaDon,
      So_hoa_don: soHoaDon,
      Ma_khach_hang: maKH,
      Trang_thai: curStatus,
      Ngay_tao_duong_lich: nowStr,
      Ten_khach_hang: tenKhach,
      So_dien_thoai: sdt,
      Dia_chi: diaChi,
      Thoi_gian_nhan_hang: thoiGian,
      Hinh_thuc_thanh_toan: thanhToan,
      Ghi_chu: ghiChu,
      Don_vi_tien_te: currency,
      Phi_ship: phiShip,
      Tong_cong: tongCong,
      Synced_by_admin: true,
      Last_source: 'admin',
      Updated_at: Date.now(),
    })
    updates[`live_orders/${orderKey}`] = {
      meta: nextLiveMeta,
      submitted_meta: nextLiveMeta,
      items: itemsObj,
      submitted_items: itemsObj,
      members: buildSyncedLiveMembers(
        liveParsed?.rawMembers,
        resolvedList,
        tenKhach,
        s(liveParsed?.meta?.Host_id),
      ),
    }
  }

  // 2. Sync don_hang
  const dhKey = dhTarget ? dhTarget.key : createRowKey()
  updates[`don_hang/${dhKey}`] = sanitizeRow({
    ...(dhTarget?.row || {}),
    Ma_hoa_don: maHoaDon,
    So_hoa_don: soHoaDon,
    Ngay_tao_duong_lich: nowStr,
    Ma_khach_hang: maKH,
    Ten_khach_hang: tenKhach,
    So_dien_thoai: sdt,
    Dia_chi: diaChi,
    Thoi_gian_nhan_hang: thoiGian,
    Tong_gia_ban: tongCong,
    Phi_ship: phiShip,
    Ghi_chu: ghiChu,
    Hinh_thuc_thanh_toan: thanhToan,
    Trang_thai: curStatus,
    Don_vi_tien_te: currency,
  })

  // 3. If already approved (Đang xử lý / Hoàn thành), sync accounting & detail tables too
  const hdTarget = hdEntries.find((e) => s(e.row.Ma_hoa_don).trim() === maHoaDon)
  if (curStatus !== 'Chờ duyệt' && curStatus !== 'Nháp') {
    const oldTotal = hdTarget ? n(hdTarget.row.Tong_cong) : tongCong

    // Replace hoa_don_chi_tiet rows for this Ma_hoa_don
    for (const ct of ctEntries) {
      if (s(ct.row.Ma_hoa_don).trim() === maHoaDon) {
        updates[`hoa_don_chi_tiet/${ct.key}`] = null
      }
    }
    for (const it of resolvedList) {
      updates[`hoa_don_chi_tiet/${createRowKey()}`] = sanitizeRow({
        Ma_hoa_don: maHoaDon,
        So_hoa_don: soHoaDon,
        Ngay_tao_duong_lich: nowStr,
        Ma_hang: s(it.Ma_hang),
        Ten_hang: s(it.Ten_hang),
        Trang_thai: 'Còn hàng',
        Danh_muc: s(it.Danh_muc),
        Size: s(it.Size),
        Dvt: s(it.Dvt),
        So_luong: n(it.So_luong),
        Gia_goc: n(it.Gia_goc),
        Gia_ban: n(it.Gia_ban),
        Giam_gia: 0,
        Tien_chiet_khau: 0,
        Ncc_loai_giam: normalizeNccDiscountType(it.Ncc_loai_giam),
        Ncc_gia_tri_giam: normalizeNccDiscountValue(it.Ncc_gia_tri_giam),
        Thanh_tien: n(it.Thanh_tien),
        Loi_nhuan: calcOrderLineProfit({
          giaBan: it.Gia_ban,
          giaGoc: it.Gia_goc,
          soLuong: it.So_luong,
          nccLoaiGiam: it.Ncc_loai_giam,
          nccGiaTriGiam: it.Ncc_gia_tri_giam,
        }),
        Ghi_chu: s(it.Ghi_chu),
        Nguoi_dat: s(it.Nguoi_dat),
        Nguoi_dat_id: s(it.Nguoi_dat_id),
        Added_by_role: s(it.Added_by_role),
        Trang_thai_don:
          curStatus === 'Hoàn thành'
            ? 'Hoàn thành'
            : curStatus === 'Đang ship'
              ? 'Đang ship'
              : 'Đang xử lý',
        Thoi_gian_nhan_hang: thoiGian,
      })
    }

    if (hdTarget) {
      updates[`hoa_don_tong_quat/${hdTarget.key}`] = sanitizeRow({
        ...hdTarget.row,
        Ten_khach_hang: tenKhach,
        Thoi_gian_nhan_hang: thoiGian,
        Tra_tien: tongCong,
        Tam_tinh: tongCong,
        Tong_cong: tongCong,
        Hinh_thuc_thanh_toan: thanhToan,
        Tong_loi_nhuan: tongLoiNhuan,
      })
    }

    const tcTarget = tcEntries.find((e) => s(e.row.Ma_hoa_don).trim() === maHoaDon)
    if (tcTarget) {
      updates[`so_thu_chi/${tcTarget.key}`] = sanitizeRow({
        ...tcTarget.row,
        so_tien: tongCong,
        loi_nhuan: tongLoiNhuan,
        hinh_thuc_thanh_toan: thanhToan,
        Ten_khach_hang: tenKhach,
        Don_vi_tien_te: currency,
      })
    }

    const bcTarget = bcEntries.find((e) => s(e.row.Ma_hoa_don).trim() === maHoaDon)
    if (bcTarget) {
      updates[`bao_cao/${bcTarget.key}`] = sanitizeRow({
        ...bcTarget.row,
        Tong_gia_goc: tongGiaGoc,
        Tong_gia_ban: tongCong,
        Tong_cong: tongLoiNhuan,
        Hinh_thuc_thanh_toan: thanhToan,
      })
    }

    const deltaTotal = tongCong - oldTotal
    if (maKH && deltaTotal !== 0) {
      const khTarget = khEntries.find((e) => s(e.row.Ma_khach_hang).trim() === maKH)
      if (khTarget) {
        khTarget.row.Ten_khach_hang = tenKhach
        khTarget.row.So_dien_thoai = sdt
        khTarget.row.Dia_chi = diaChi
        khTarget.row.Tong_chi_tieu = Math.max(0, n(khTarget.row.Tong_chi_tieu) + deltaTotal)
        updates[`khach_hang/${khTarget.key}`] = sanitizeRow(khTarget.row)
      }
    }
  }

  await update(dbRef(db), updates)
  return {
    success: true,
    Ma_hoa_don: maHoaDon,
    Tong_cong: tongCong,
    items: resolvedList,
  }
}

export async function getOrderForInvoice(orderId) {
  const maHoaDon = s(orderId).trim()
  if (!maHoaDon) return { success: false, message: 'Thiếu Ma_hoa_don' }
  const orderKey = safeFirebaseKey(maHoaDon)

  const [liveSnap, dhEntries, hdEntries, ctEntries, hhEntries] = await Promise.all([
    get(dbRef(db, `live_orders/${orderKey}`)),
    readSheetEntries('don_hang'),
    readSheetEntries('hoa_don_tong_quat'),
    readSheetEntries('hoa_don_chi_tiet'),
    readSheetEntries('hang_hoa'),
  ])

  const dhRow = dhEntries.find((e) => s(e.row.Ma_hoa_don).trim() === maHoaDon)?.row || null
  const hdRow = hdEntries.find((e) => s(e.row.Ma_hoa_don).trim() === maHoaDon)?.row || null
  const liveParsed = liveSnap.exists()
    ? normalizeLiveOrderSnapshot(maHoaDon, liveSnap.val())
    : null

  if (!dhRow && !hdRow && !liveParsed) {
    return { success: false, message: 'Không tìm thấy đơn hàng' }
  }

  const hhMap = new Map(hhEntries.map((e) => [s(e.row.Ma_hang).trim(), e.row]))
  const ctItems = ctEntries
    .filter((e) => s(e.row.Ma_hoa_don).trim() === maHoaDon)
    .map((e) => e.row)

  const liveSubmittedMeta = liveParsed?.submittedMeta || liveParsed?.meta
  const liveSubmittedItems = liveParsed?.submittedItemsList?.length
    ? liveParsed.submittedItemsList
    : liveParsed?.itemsList || []
  const rawItems = ctItems.length ? ctItems : liveSubmittedItems
  const resolvedItems = rawItems.map((raw) => {
    const resolved = resolveCanonicalViItem(raw, hhMap)
    const giaGoc = n(raw.Gia_goc !== undefined ? raw.Gia_goc : resolved.Gia_goc)
    const giaBan = n(raw.Gia_ban !== undefined ? raw.Gia_ban : resolved.Gia_ban)
    const qty = Math.max(1, n(raw.So_luong))
    const giamGia = n(raw.Giam_gia)
    const ck = n(raw.Chiet_khau || 0)
    const thanhTien = n(raw.Thanh_tien) || giaBan * qty
    const tienCK = n(raw.Tien_chiet_khau)
    const nccLoaiGiam = normalizeNccDiscountType(
      raw.Ncc_loai_giam !== undefined ? raw.Ncc_loai_giam : resolved.Ncc_loai_giam,
    )
    const nccGiaTriGiam = normalizeNccDiscountValue(
      raw.Ncc_gia_tri_giam !== undefined ? raw.Ncc_gia_tri_giam : resolved.Ncc_gia_tri_giam,
    )
    const loiNhuan =
      raw.Loi_nhuan !== undefined
        ? n(raw.Loi_nhuan)
        : calcOrderLineProfit({
            giaBan,
            giaGoc,
            soLuong: qty,
            giamGia,
            ck1sp: qty > 0 ? tienCK / qty : 0,
            nccLoaiGiam,
            nccGiaTriGiam,
          })
    return {
      ...resolved,
      lineId: s(raw.lineId || resolved.lineId),
      Gia_goc: giaGoc,
      Gia_ban: giaBan,
      So_luong: qty,
      Giam_gia: giamGia,
      Chiet_khau: ck,
      Tien_chiet_khau: tienCK,
      Ncc_loai_giam: nccLoaiGiam,
      Ncc_gia_tri_giam: nccGiaTriGiam,
      Thanh_tien: thanhTien,
      Loi_nhuan: loiNhuan,
    }
  })

  const meta = {
    Ma_hoa_don: maHoaDon,
    So_hoa_don: s(hdRow?.So_hoa_don || dhRow?.So_hoa_don || liveSubmittedMeta?.So_hoa_don),
    Ma_khach_hang: s(
      hdRow?.Ma_khach_hang || dhRow?.Ma_khach_hang || liveSubmittedMeta?.Ma_khach_hang,
    ),
    Ten_khach_hang: s(
      dhRow?.Ten_khach_hang || hdRow?.Ten_khach_hang || liveSubmittedMeta?.Ten_khach_hang,
    ),
    So_dien_thoai: s(dhRow?.So_dien_thoai || liveSubmittedMeta?.So_dien_thoai),
    Dia_chi: s(dhRow?.Dia_chi || liveSubmittedMeta?.Dia_chi),
    Thoi_gian_nhan_hang: s(
      dhRow?.Thoi_gian_nhan_hang || hdRow?.Thoi_gian_nhan_hang || liveSubmittedMeta?.Thoi_gian_nhan_hang,
    ),
    Hinh_thuc_thanh_toan: s(
      dhRow?.Hinh_thuc_thanh_toan ||
        hdRow?.Hinh_thuc_thanh_toan ||
        liveSubmittedMeta?.Hinh_thuc_thanh_toan ||
        'TIEN_MAT',
    ),
    Ghi_chu: s(dhRow?.Ghi_chu || liveSubmittedMeta?.Ghi_chu),
    Trang_thai: s(dhRow?.Trang_thai || liveSubmittedMeta?.Trang_thai || 'Chờ duyệt'),
    Don_vi_tien_te: s(
      dhRow?.Don_vi_tien_te ||
        liveSubmittedMeta?.Don_vi_tien_te ||
        resolvedItems[0]?.Don_vi_tien_te ||
        'P',
    ),
    Tong_giam_gia: n(hdRow?.Tong_giam_gia),
    Tong_tien_chiet_khau: n(hdRow?.Tong_tien_chiet_khau),
    Phi_ship: n(liveSubmittedMeta?.Phi_ship ?? dhRow?.Phi_ship ?? 0),
    Ngay_tao_duong_lich: s(
      dhRow?.Ngay_tao_duong_lich ||
        hdRow?.Ngay_tao_duong_lich ||
        liveSubmittedMeta?.Ngay_tao_duong_lich,
    ),
    Submitted_at: n(liveSubmittedMeta?.Submitted_at || liveParsed?.meta?.Submitted_at || 0),
  }

  return {
    success: true,
    order: meta,
    invoice: hdRow,
    items: resolvedItems,
  }
}

export async function duyetDonHang(body = {}) {
  const maHoaDon = s(body.Ma_hoa_don || body.orderId).trim()
  if (!maHoaDon) return { success: false, message: 'Thiếu Ma_hoa_don' }
  const orderKey = safeFirebaseKey(maHoaDon)

  // If Admin also passed updated items/meta right when clicking Approve, sync them first
  if (Array.isArray(body.items) || body.meta) {
    await adminSyncOrderItems({
      Ma_hoa_don: maHoaDon,
      items: body.items,
      meta: body.meta,
    })
  }

  const [
    liveSnap,
    hhEntries,
    dhEntries,
    hdEntries,
    ctEntries,
    tcEntries,
    bcEntries,
    khEntries,
  ] = await Promise.all([
    get(dbRef(db, `live_orders/${orderKey}`)),
    readSheetEntries('hang_hoa'),
    readSheetEntries('don_hang'),
    readSheetEntries('hoa_don_tong_quat'),
    readSheetEntries('hoa_don_chi_tiet'),
    readSheetEntries('so_thu_chi'),
    readSheetEntries('bao_cao'),
    readSheetEntries('khach_hang'),
  ])

  const dhTarget = dhEntries.find((e) => s(e.row.Ma_hoa_don).trim() === maHoaDon)
  const liveParsed = liveSnap.exists()
    ? normalizeLiveOrderSnapshot(maHoaDon, liveSnap.val())
    : null

  if (!dhTarget && !liveParsed) {
    return { success: false, message: 'Không tìm thấy đơn hàng để duyệt' }
  }

  const hhMap = new Map(hhEntries.map((e) => [s(e.row.Ma_hang).trim(), e.row]))
  const sourceItems = liveParsed?.itemsList?.length
    ? liveParsed.itemsList
    : ctEntries.filter((e) => s(e.row.Ma_hoa_don).trim() === maHoaDon).map((e) => e.row)

  const resolvedList = sourceItems
    .map((it) => resolveCanonicalViItem(it, hhMap))
    .filter((it) => it.So_luong > 0)

  if (!resolvedList.length) {
    return { success: false, message: 'Đơn hàng chưa có món ăn nào để duyệt!' }
  }

  const soHoaDon =
    s(dhTarget?.row?.So_hoa_don || liveParsed?.meta?.So_hoa_don).trim() ||
    genNextSoHoaDon(dhEntries, hdEntries)

  const nowStr = s(
    dhTarget?.row?.Ngay_tao_duong_lich ||
      liveParsed?.meta?.Ngay_tao_duong_lich ||
      formatVNDateTime(),
  )
  const tenKhach = s(
    dhTarget?.row?.Ten_khach_hang || liveParsed?.meta?.Ten_khach_hang || 'Khách lẻ',
  )
  const sdt = s(dhTarget?.row?.So_dien_thoai || liveParsed?.meta?.So_dien_thoai)
  const diaChi = s(dhTarget?.row?.Dia_chi || liveParsed?.meta?.Dia_chi)
  const thoiGian = s(
    dhTarget?.row?.Thoi_gian_nhan_hang || liveParsed?.meta?.Thoi_gian_nhan_hang || nowStr,
  )
  const thanhToan = s(
    dhTarget?.row?.Hinh_thuc_thanh_toan || liveParsed?.meta?.Hinh_thuc_thanh_toan || 'TIEN_MAT',
  )
  const ghiChu = s(dhTarget?.row?.Ghi_chu || liveParsed?.meta?.Ghi_chu)

  // Match existing customer by phone or generated code
  let khTarget =
    (sdt &&
      khEntries.find(
        (e) => s(e.row.So_dien_thoai).replace(/\D/g, '') === sdt.replace(/\D/g, ''),
      )) ||
    null
  const maKH = s(
    khTarget?.row?.Ma_khach_hang ||
      dhTarget?.row?.Ma_khach_hang ||
      liveParsed?.meta?.Ma_khach_hang ||
      genAutoMaKhachHang(tenKhach, sdt, diaChi),
  )
  if (!khTarget && maKH) {
    khTarget = khEntries.find((e) => s(e.row.Ma_khach_hang).trim() === maKH) || null
  }

  const tongCong = resolvedList.reduce((acc, it) => acc + n(it.Gia_ban) * n(it.So_luong), 0)
  const tongGiaGoc = resolvedList.reduce((acc, it) => acc + n(it.Gia_goc) * n(it.So_luong), 0)
  const tongLoiNhuan = resolvedList.reduce(
    (acc, it) =>
      acc +
      calcOrderLineProfit({
        giaBan: it.Gia_ban,
        giaGoc: it.Gia_goc,
        soLuong: it.So_luong,
        nccLoaiGiam: it.Ncc_loai_giam,
        nccGiaTriGiam: it.Ncc_gia_tri_giam,
      }),
    0,
  )
  const currency =
    s(
      resolvedList[0]?.Don_vi_tien_te ||
        dhTarget?.row?.Don_vi_tien_te ||
        liveParsed?.meta?.Don_vi_tien_te ||
        'P',
    ).trim() || 'P'

  const updates = {}

  // 1. Update live_orders status -> 'Đang xử lý' (locks customer editing & shows approved state)
  if (liveParsed) {
    const cleanItemsObj = {}
    for (const it of resolvedList) {
      const k = safeFirebaseKey(it.lineId)
      it.lineId = k
      cleanItemsObj[k] = sanitizeRow(it)
    }
    updates[`live_orders/${orderKey}`] = {
      meta: sanitizeRow({
        ...liveParsed.meta,
        Ma_hoa_don: maHoaDon,
        So_hoa_don: soHoaDon,
        Ma_khach_hang: maKH,
        Trang_thai: 'Đang xử lý',
        Ten_khach_hang: tenKhach,
        So_dien_thoai: sdt,
        Dia_chi: diaChi,
        Thoi_gian_nhan_hang: thoiGian,
        Hinh_thuc_thanh_toan: thanhToan,
        Ghi_chu: ghiChu,
        Don_vi_tien_te: currency,
        Tong_cong: tongCong,
        Approved_at: Date.now(),
        Updated_at: Date.now(),
      }),
      items: cleanItemsObj,
      members: liveParsed.rawMembers || {},
    }
  }

  // 2. Update don_hang -> 'Đang xử lý'
  const dhKey = dhTarget ? dhTarget.key : createRowKey()
  updates[`don_hang/${dhKey}`] = sanitizeRow({
    ...(dhTarget?.row || {}),
    Ma_hoa_don: maHoaDon,
    So_hoa_don: soHoaDon,
    Ngay_tao_duong_lich: nowStr,
    Ma_khach_hang: maKH,
    Ten_khach_hang: tenKhach,
    So_dien_thoai: sdt,
    Dia_chi: diaChi,
    Thoi_gian_nhan_hang: thoiGian,
    Tong_gia_ban: tongCong,
    Ghi_chu: ghiChu,
    Hinh_thuc_thanh_toan: thanhToan,
    Trang_thai: 'Đang xử lý',
    Don_vi_tien_te: currency,
  })

  // 3. Upsert hoa_don_tong_quat (idempotent if approved once)
  const existingHD = hdEntries.find((e) => s(e.row.Ma_hoa_don).trim() === maHoaDon)
  const alreadyAccounted = Boolean(existingHD)
  const hdKey = existingHD ? existingHD.key : createRowKey()
  updates[`hoa_don_tong_quat/${hdKey}`] = sanitizeRow({
    Ma_hoa_don: maHoaDon,
    So_hoa_don: soHoaDon,
    Ma_khach_hang: maKH,
    Ten_khach_hang: tenKhach,
    Ngay_tao_duong_lich: nowStr,
    Thoi_gian_nhan_hang: thoiGian,
    Tra_tien: tongCong,
    Tam_tinh: tongCong,
    Tong_giam_gia: 0,
    Tong_tien_chiet_khau: 0,
    Tong_cong: tongCong,
    Hinh_thuc_thanh_toan: thanhToan,
    Tong_loi_nhuan: tongLoiNhuan,
  })

  // 4. Replace hoa_don_chi_tiet rows for this Ma_hoa_don
  for (const ct of ctEntries) {
    if (s(ct.row.Ma_hoa_don).trim() === maHoaDon) {
      updates[`hoa_don_chi_tiet/${ct.key}`] = null
    }
  }
  for (const it of resolvedList) {
    updates[`hoa_don_chi_tiet/${createRowKey()}`] = sanitizeRow({
      Ma_hoa_don: maHoaDon,
      So_hoa_don: soHoaDon,
      Ngay_tao_duong_lich: nowStr,
      Ma_hang: s(it.Ma_hang),
      Ten_hang: s(it.Ten_hang),
      Trang_thai: 'Còn hàng',
      Danh_muc: s(it.Danh_muc),
      Size: s(it.Size),
      Dvt: s(it.Dvt),
      So_luong: n(it.So_luong),
      Gia_goc: n(it.Gia_goc),
      Gia_ban: n(it.Gia_ban),
      Giam_gia: 0,
      Tien_chiet_khau: 0,
      Ncc_loai_giam: normalizeNccDiscountType(it.Ncc_loai_giam),
      Ncc_gia_tri_giam: normalizeNccDiscountValue(it.Ncc_gia_tri_giam),
      Thanh_tien: n(it.Thanh_tien),
      Loi_nhuan: calcOrderLineProfit({
        giaBan: it.Gia_ban,
        giaGoc: it.Gia_goc,
        soLuong: it.So_luong,
        nccLoaiGiam: it.Ncc_loai_giam,
        nccGiaTriGiam: it.Ncc_gia_tri_giam,
      }),
      Ghi_chu: s(it.Ghi_chu),
      Nguoi_dat: s(it.Nguoi_dat),
      Nguoi_dat_id: s(it.Nguoi_dat_id),
      Added_by_role: s(it.Added_by_role),
      Trang_thai_don: 'Đang xử lý',
      Thoi_gian_nhan_hang: thoiGian,
    })
  }

  // 5. Upsert so_thu_chi
  const existingTC = tcEntries.find((e) => s(e.row.Ma_hoa_don).trim() === maHoaDon)
  const tcKey = existingTC ? existingTC.key : createRowKey()
  updates[`so_thu_chi/${tcKey}`] = sanitizeRow({
    Ma_hoa_don: maHoaDon,
    So_hoa_don: soHoaDon,
    Ngay_tao_duong_lich: nowStr,
    Trang_thai: 'BAN_HANG',
    so_tien: tongCong,
    loi_nhuan: tongLoiNhuan,
    hinh_thuc_thanh_toan: thanhToan,
    Ma_khach_hang: maKH,
    Ten_khach_hang: tenKhach,
    Ma_dich_vu: '',
    Ten_dich_vu: '',
    Don_vi_tien_te: currency,
  })

  // 6. Upsert bao_cao
  const existingBC = bcEntries.find((e) => s(e.row.Ma_hoa_don).trim() === maHoaDon)
  const bcKey = existingBC ? existingBC.key : createRowKey()
  updates[`bao_cao/${bcKey}`] = sanitizeRow({
    Ma_hoa_don: maHoaDon,
    So_hoa_don: soHoaDon,
    Thoi_gian_tao_duong_lich: nowStr,
    Tong_gia_goc: tongGiaGoc,
    Tien_chiet_khau: 0,
    Tong_gia_ban: tongCong,
    Tong_cong: tongLoiNhuan,
    Hinh_thuc_thanh_toan: thanhToan,
    So_tien: '',
    Noi_dung: '',
    Trang_thai: '',
  })

  // 7. Upsert khach_hang & increment Tong_chi_tieu once
  if (maKH && !alreadyAccounted) {
    if (!khTarget) {
      updates[`khach_hang/${createRowKey()}`] = sanitizeRow({
        Ma_khach_hang: maKH,
        Ten_khach_hang: tenKhach,
        So_dien_thoai: sdt,
        Dia_chi: diaChi,
        Cong_no_hien_tai: 0,
        Tong_chi_tieu: tongCong,
        Ghi_chu: '',
      })
    } else {
      if (tenKhach) khTarget.row.Ten_khach_hang = tenKhach
      if (sdt) khTarget.row.So_dien_thoai = sdt
      if (diaChi) khTarget.row.Dia_chi = diaChi
      khTarget.row.Tong_chi_tieu = n(khTarget.row.Tong_chi_tieu) + tongCong
      updates[`khach_hang/${khTarget.key}`] = sanitizeRow(khTarget.row)
    }
  }

  await update(dbRef(db), updates)
  if (!body.silentCustomerNotify && liveParsed?.meta?.Telegram_chat_id) {
    notifyCustomerTelegram({
      orderId: maHoaDon,
      event: 'approved',
      tongCong,
      donViTienTe: currency,
    })
  }
  return {
    success: true,
    Ma_hoa_don: maHoaDon,
    So_hoa_don: soHoaDon,
    Tong_cong: tongCong,
  }
}

export async function shipDonHang(body = {}) {
  const maHoaDon = s(body.Ma_hoa_don || body.orderId).trim()
  if (!maHoaDon) return { success: false, message: 'Thiếu Ma_hoa_don' }
  const orderKey = safeFirebaseKey(maHoaDon)

  if (Array.isArray(body.items) || body.meta) {
    await adminSyncOrderItems({
      Ma_hoa_don: maHoaDon,
      items: body.items,
      meta: body.meta,
    })
  }

  // If the order is still in 'Chờ duyệt' or not accounted yet, approve it first so accounting records exist
  const initialDhEntries = await readSheetEntries('don_hang')
  const pendingDh = initialDhEntries.find((e) => s(e.row.Ma_hoa_don).trim() === maHoaDon)
  if (!pendingDh || s(pendingDh.row.Trang_thai).trim() === 'Chờ duyệt') {
    const approved = await duyetDonHang({ Ma_hoa_don: maHoaDon, silentCustomerNotify: true })
    if (!approved.success) return approved
  }

  const [dhEntries, ctEntries, liveSnap] = await Promise.all([
    readSheetEntries('don_hang'),
    readSheetEntries('hoa_don_chi_tiet'),
    get(dbRef(db, `live_orders/${orderKey}`)),
  ])

  const updates = {}
  let foundDH = 0
  let updatedCT = 0

  for (const e of dhEntries) {
    if (s(e.row.Ma_hoa_don).trim() === maHoaDon) {
      e.row.Trang_thai = 'Đang ship'
      updates[`don_hang/${e.key}`] = sanitizeRow(e.row)
      foundDH++
    }
  }

  for (const e of ctEntries) {
    if (s(e.row.Ma_hoa_don).trim() === maHoaDon) {
      e.row.Trang_thai_don = 'Đang ship'
      updates[`hoa_don_chi_tiet/${e.key}`] = sanitizeRow(e.row)
      updatedCT++
    }
  }

  if (liveSnap.exists()) {
    const curVal = liveSnap.val() || {}
    updates[`live_orders/${orderKey}/meta`] = sanitizeRow({
      ...(curVal.meta || {}),
      Ma_hoa_don: maHoaDon,
      Trang_thai: 'Đang ship',
      Shipped_at: Date.now(),
      Updated_at: Date.now(),
    })
  }

  if (foundDH === 0 && updatedCT === 0 && !liveSnap.exists()) {
    return { success: false, message: 'Không tìm thấy đơn hàng để chuyển sang Đang ship' }
  }

  await update(dbRef(db), updates)
  const shipMeta = liveSnap.exists() ? liveSnap.val()?.meta : null
  if (shipMeta?.Telegram_chat_id) {
    notifyCustomerTelegram({
      orderId: maHoaDon,
      event: 'shipping',
    })
  }
  return {
    success: true,
    Ma_hoa_don: maHoaDon,
    status: 'Đang ship',
    updated: {
      don_hang: foundDH,
      hoa_don_chi_tiet: updatedCT,
    },
  }
}

async function hoanThanhTrangThaiDon(payload) {
  const maHoaDon = s(payload.Ma_hoa_don).trim()
  if (!maHoaDon) {
    return { success: false, message: 'Thiếu Ma_hoa_don' }
  }

  const orderKey = safeFirebaseKey(maHoaDon)

  // If the order is still in 'Chờ duyệt', approve it first so accounting records are created
  const initialDhEntries = await readSheetEntries('don_hang')
  const pendingDh = initialDhEntries.find((e) => s(e.row.Ma_hoa_don).trim() === maHoaDon)
  if (pendingDh && s(pendingDh.row.Trang_thai).trim() === 'Chờ duyệt') {
    await duyetDonHang({ Ma_hoa_don: maHoaDon, silentCustomerNotify: true })
  }

  const [dhEntries, ctEntries, liveSnap] = await Promise.all([
    readSheetEntries('don_hang'),
    readSheetEntries('hoa_don_chi_tiet'),
    get(dbRef(db, `live_orders/${orderKey}`)),
  ])

  const updates = {}
  let foundDH = 0
  let updatedCT = 0

  for (const e of dhEntries) {
    if (s(e.row.Ma_hoa_don) === maHoaDon) {
      e.row.Trang_thai = 'Hoàn thành'
      updates[`don_hang/${e.key}`] = sanitizeRow(e.row)
      foundDH++
    }
  }

  for (const e of ctEntries) {
    if (s(e.row.Ma_hoa_don) === maHoaDon) {
      e.row.Trang_thai_don = 'Hoàn thành'
      updates[`hoa_don_chi_tiet/${e.key}`] = sanitizeRow(e.row)
      updatedCT++
    }
  }

  // Close live order session & wipe items so revisiting old link never shows leftover dishes
  if (liveSnap.exists()) {
    const curVal = liveSnap.val() || {}
    const adminMessage = s(payload.Admin_message).trim()
    updates[`live_orders/${orderKey}`] = {
      meta: sanitizeRow({
        ...(curVal.meta || {}),
        Ma_hoa_don: maHoaDon,
        Trang_thai: 'Hoàn thành',
        Tong_cong: 0,
        Admin_message: adminMessage,
        ...(adminMessage ? { Admin_message_at: Date.now() } : {}),
        Closed_at: Date.now(),
        Updated_at: Date.now(),
      }),
      items: null,
    }
  }

  if (foundDH === 0 && updatedCT === 0 && !liveSnap.exists()) {
    return { success: false, message: 'Không tìm thấy đơn hàng' }
  }

  await update(dbRef(db), updates)
  const doneMeta = liveSnap.exists() ? liveSnap.val()?.meta : null
  if (doneMeta?.Telegram_chat_id) {
    notifyCustomerTelegram({
      orderId: maHoaDon,
      event: 'completed',
      adminMessage: s(payload.Admin_message).trim(),
    })
  }
  return {
    success: true,
    updated: {
      don_hang: foundDH,
      hoa_don_chi_tiet: updatedCT,
    },
  }
}

async function huyDonHang(body) {
  const maHoaDon = s(body.Ma_hoa_don).trim()
  if (!maHoaDon) {
    return { success: false, message: 'Thiếu Ma_hoa_don' }
  }

  const orderKey = safeFirebaseKey(maHoaDon)
  const [hdEntries, ctEntries, khEntries, tcEntries, bcEntries, dhEntries, liveSnap] =
    await Promise.all([
      readSheetEntries('hoa_don_tong_quat'),
      readSheetEntries('hoa_don_chi_tiet'),
      readSheetEntries('khach_hang'),
      readSheetEntries('so_thu_chi'),
      readSheetEntries('bao_cao'),
      readSheetEntries('don_hang'),
      get(dbRef(db, `live_orders/${orderKey}`)),
    ])

  const updates = {}

  const hdEntry = hdEntries.find((e) => s(e.row.Ma_hoa_don) === maHoaDon)

  // Subtract Tong_cong from customer's Tong_chi_tieu (if order was already approved)
  let hoanChiTieu = false
  if (hdEntry && s(hdEntry.row.Ma_khach_hang) && n(hdEntry.row.Tong_cong)) {
    const kh = khEntries.find(
      (e) => s(e.row.Ma_khach_hang) === s(hdEntry.row.Ma_khach_hang),
    )
    if (kh) {
      kh.row.Tong_chi_tieu = Math.max(
        0,
        n(kh.row.Tong_chi_tieu) - n(hdEntry.row.Tong_cong),
      )
      updates[`khach_hang/${kh.key}`] = sanitizeRow(kh.row)
      hoanChiTieu = true
    }
  }

  // Delete matching Ma_hoa_don rows from all 5 order/report collections
  const deleted = {
    hoa_don_tong_quat: 0,
    hoa_don_chi_tiet: 0,
    so_thu_chi: 0,
    bao_cao: 0,
    don_hang: 0,
  }

  const collections = [
    ['hoa_don_tong_quat', hdEntries],
    ['hoa_don_chi_tiet', ctEntries],
    ['so_thu_chi', tcEntries],
    ['bao_cao', bcEntries],
    ['don_hang', dhEntries],
  ]

  for (const [name, list] of collections) {
    for (const e of list) {
      if (s(e.row.Ma_hoa_don) === maHoaDon) {
        updates[`${name}/${e.key}`] = null
        deleted[name]++
      }
    }
  }

  // Close live order session & wipe items so revisiting old link never shows leftover dishes
  if (liveSnap.exists()) {
    const curVal = liveSnap.val() || {}
    const adminMessage = s(body.Admin_message).trim()
    updates[`live_orders/${orderKey}`] = {
      meta: sanitizeRow({
        ...(curVal.meta || {}),
        Ma_hoa_don: maHoaDon,
        Trang_thai: 'Đã hủy',
        Tong_cong: 0,
        Admin_message: adminMessage,
        ...(adminMessage ? { Admin_message_at: Date.now() } : {}),
        Closed_at: Date.now(),
        Updated_at: Date.now(),
      }),
      items: null,
    }
  }

  if (Object.keys(updates).length > 0) {
    await update(dbRef(db), updates)
  }
  const cancelMeta = liveSnap.exists() ? liveSnap.val()?.meta : null
  if (cancelMeta?.Telegram_chat_id) {
    notifyCustomerTelegram({
      orderId: maHoaDon,
      event: 'cancelled',
      adminMessage: s(body.Admin_message).trim(),
    })
  }

  return {
    success: true,
    message: 'Đã hủy đơn hàng và đóng phiên đặt món',
    deleted,
    restored: {
      tong_chi_tieu_khach_hang: hoanChiTieu,
    },
  }
}

/* =========================================================
 * INVENTORY (HANG_HOA) ACTIONS — UNIFIED MULTI-LANGUAGE
 * ========================================================= */
function mergeProductI18n(existingRow, incomingItem) {
  const curI18n = normalizeProductI18n(existingRow)
  const incI18n = normalizeProductI18n(incomingItem)
  const merged = {}

  for (const code of DATA_LANG_CODES) {
    merged[code] = {
      Ten_hang: incI18n[code].Ten_hang || curI18n[code].Ten_hang || '',
      Danh_muc_cha: incI18n[code].Danh_muc_cha || curI18n[code].Danh_muc_cha || '',
      Danh_muc: incI18n[code].Danh_muc || curI18n[code].Danh_muc || '',
      Dvt: incI18n[code].Dvt || curI18n[code].Dvt || '',
      Mo_ta: incI18n[code].Mo_ta || curI18n[code].Mo_ta || '',
    }
  }

  return merged
}

async function nhapHangHoa(body) {
  const items = body.data || []
  if (!items.length) {
    return { success: false, message: 'Danh sách hàng trống' }
  }

  const entries = await readSheetEntries('hang_hoa')
  const dirtyKeys = new Set()

  let inserted = 0
  let updated = 0
  let skipped = 0

  for (const item of items) {
    let candidateMaHang = s(item.Ma_hang)
    if (!candidateMaHang) {
      if (!s(item.Ten_hang)) {
        skipped++
        continue
      }
      const existingMaList = entries.map((e) => s(e.row.Ma_hang)).filter(Boolean)
      candidateMaHang = buildUniqueProductCode(s(item.Ten_hang), existingMaList)
    }

    const existing = item._forceCreateNew
      ? null
      : entries.find((e) => s(e.row.Ma_hang) === s(candidateMaHang))

    if (existing) {
      const mergedI18n = mergeProductI18n(existing.row, item)
      existing.row.i18n = mergedI18n
      existing.row.Ten_hang = mergedI18n.vi.Ten_hang || s(existing.row.Ten_hang)
      existing.row.Danh_muc_cha = mergedI18n.vi.Danh_muc_cha || s(existing.row.Danh_muc_cha)
      existing.row.Danh_muc = mergedI18n.vi.Danh_muc || s(existing.row.Danh_muc)
      existing.row.Dvt = mergedI18n.vi.Dvt || s(existing.row.Dvt)
      existing.row.Mo_ta = mergedI18n.vi.Mo_ta || s(existing.row.Mo_ta)

      const fieldsToUpdate = {
        Main_img: item.Main_img,
        Size: item.Size,
        Gia_goc: item.Gia_goc !== undefined && item.Gia_goc !== '' ? n(item.Gia_goc) : undefined,
        Gia_ban: item.Gia_ban !== undefined && item.Gia_ban !== '' ? n(item.Gia_ban) : undefined,
        Ncc_loai_giam:
          item.Ncc_loai_giam !== undefined
            ? normalizeNccDiscountType(item.Ncc_loai_giam)
            : undefined,
        Ncc_gia_tri_giam:
          item.Ncc_gia_tri_giam !== undefined
            ? normalizeNccDiscountValue(item.Ncc_gia_tri_giam)
            : undefined,
        Gia_Giam:
          item.Gia_Giam !== undefined
            ? item.Gia_Giam === '' || item.Gia_Giam === null
              ? ''
              : n(item.Gia_Giam)
            : undefined,
        Don_vi_tien_te: item.Don_vi_tien_te,
        img_1: item.img_1,
        img_2: item.img_2,
        img_3: item.img_3,
        img_4: item.img_4,
        img_5: item.img_5,
        img_6: item.img_6,
      }

      for (const [field, val] of Object.entries(fieldsToUpdate)) {
        if (val !== undefined && val !== '') {
          existing.row[field] = val
        }
      }

      if (item.Badge !== undefined) {
        existing.row.Badge = s(item.Badge).trim()
      }

      if (item.Trang_thai === 'Hết hàng' || item.Trang_thai === 'Còn hàng') {
        existing.row.Trang_thai = item.Trang_thai
      } else if (!existing.row.Trang_thai) {
        existing.row.Trang_thai = 'Còn hàng'
      }

      delete existing.row.So_luong_kho
      delete existing.row.Lang
      delete existing.row.Ma_nha_cung_cap
      delete existing.row.Ten_nha_cung_cap

      dirtyKeys.add(existing.key)
      updated++
      continue
    }

    const existingMaList = entries.map((e) => s(e.row.Ma_hang)).filter(Boolean)
    const finalMaHang = genUniqueMaHang(candidateMaHang, existingMaList)
    const trangThaiMoi = s(item.Trang_thai) === 'Hết hàng' ? 'Hết hàng' : 'Còn hàng'

    const newKey = createRowKey()
    const newRow = syncProductWithI18n({
      Ma_hang: finalMaHang,
      Ten_hang: s(item.Ten_hang),
      Main_img: s(item.Main_img),
      Mo_ta: s(item.Mo_ta),
      Danh_muc_cha: s(item.Danh_muc_cha),
      Danh_muc: s(item.Danh_muc),
      Size: s(item.Size),
      Dvt: s(item.Dvt),
      Gia_goc: n(item.Gia_goc),
      Gia_ban: n(item.Gia_ban),
      Ncc_loai_giam: normalizeNccDiscountType(item.Ncc_loai_giam),
      Ncc_gia_tri_giam: normalizeNccDiscountValue(item.Ncc_gia_tri_giam),
      Trang_thai: trangThaiMoi,
      Badge: s(item.Badge).trim(),
      Don_vi_tien_te: s(item.Don_vi_tien_te || 'P'),
      Gia_Giam: item.Gia_Giam !== undefined && item.Gia_Giam !== '' ? n(item.Gia_Giam) : '',
      img_1: s(item.img_1),
      img_2: s(item.img_2),
      img_3: s(item.img_3),
      img_4: s(item.img_4),
      img_5: s(item.img_5),
      img_6: s(item.img_6),
      i18n: item.i18n,
      Ten_hang_en: item.Ten_hang_en,
      Danh_muc_cha_en: item.Danh_muc_cha_en,
      Danh_muc_en: item.Danh_muc_en,
      Dvt_en: item.Dvt_en,
      Mo_ta_en: item.Mo_ta_en,
      'Ten_hang_zh-CN': item['Ten_hang_zh-CN'] || item.Ten_hang_zh,
      'Danh_muc_cha_zh-CN': item['Danh_muc_cha_zh-CN'] || item.Danh_muc_cha_zh,
      'Danh_muc_zh-CN': item['Danh_muc_zh-CN'] || item.Danh_muc_zh,
      'Dvt_zh-CN': item['Dvt_zh-CN'] || item.Dvt_zh,
      'Mo_ta_zh-CN': item['Mo_ta_zh-CN'] || item.Mo_ta_zh,
      Ten_hang_fil: item.Ten_hang_fil,
      Danh_muc_cha_fil: item.Danh_muc_cha_fil,
      Danh_muc_fil: item.Danh_muc_fil,
      Dvt_fil: item.Dvt_fil,
      Mo_ta_fil: item.Mo_ta_fil,
      Ten_hang_ko: item.Ten_hang_ko,
      Danh_muc_cha_ko: item.Danh_muc_cha_ko,
      Danh_muc_ko: item.Danh_muc_ko,
      Dvt_ko: item.Dvt_ko,
      Mo_ta_ko: item.Mo_ta_ko,
    })

    entries.push({ key: newKey, row: newRow })
    dirtyKeys.add(newKey)
    inserted++
  }

  if (dirtyKeys.size > 0) {
    const updates = {}
    for (const e of entries) {
      if (dirtyKeys.has(e.key)) {
        updates[e.key] = sanitizeRow(e.row)
      }
    }
    await update(dbRef(db, 'hang_hoa'), updates)
  }

  return {
    success: true,
    inserted,
    updated,
    skipped,
    total: items.length,
  }
}

async function chongTrungMaHang() {
  const entries = await readSheetEntries('hang_hoa')
  if (!entries.length) {
    return { success: true, fixed: 0, message: 'Sheet rỗng, không cần xử lý' }
  }
  const { fixed, changedKeys } = deduplicateCodeEntries(entries, 'Ma_hang')
  if (changedKeys.size > 0) {
    const updates = {}
    for (const e of entries) {
      if (changedKeys.has(e.key)) {
        updates[e.key] = sanitizeRow(e.row)
      }
    }
    await update(dbRef(db, 'hang_hoa'), updates)
  }
  return {
    success: true,
    fixed,
    message: `Đã chống trùng ${fixed} mã hàng`,
  }
}

async function updateHangHoa(item) {
  if (!item?.Ma_hang) {
    return { success: false, message: 'Thiếu Ma_hang' }
  }

  const entries = await readSheetEntries('hang_hoa')
  const target = entries.find((e) => s(e.row.Ma_hang) === s(item.Ma_hang))
  if (!target) {
    return { success: false, message: 'Không tìm thấy mã hàng' }
  }

  const currentI18n = normalizeProductI18n(target.row)

  for (const [k, v] of Object.entries(item)) {
    if (
      v === undefined ||
      k === 'i18n' ||
      k === 'Lang' ||
      k === 'So_luong_kho' ||
      k === 'Ma_nha_cung_cap' ||
      k === 'Ten_nha_cung_cap'
    ) {
      continue
    }
    if (k.startsWith('_')) continue
    if (k === 'Gia_goc' || k === 'Gia_ban') {
      target.row[k] = n(v)
    } else if (k === 'Top_at') {
      target.row[k] = Math.max(0, n(v, 0))
    } else if (k === 'Thu_tu') {
      const parsedOrder = Math.floor(n(v, 0))
      target.row[k] = parsedOrder > 0 ? parsedOrder : 0
    } else if (k === 'Ncc_gia_tri_giam') {
      target.row[k] = normalizeNccDiscountValue(v)
    } else if (k === 'Ncc_loai_giam') {
      target.row[k] = normalizeNccDiscountType(v)
    } else if (k === 'Gia_Giam') {
      target.row[k] = v === '' || v === null ? '' : n(v)
    } else if (k === 'Is_hidden') {
      target.row[k] = v === true || String(v) === 'true'
    } else if (k === 'Badge') {
      target.row[k] = s(v).trim()
    } else {
      target.row[k] = s(v)
    }
  }

  if (item.i18n && typeof item.i18n === 'object') {
    const nextI18n = normalizeProductI18n(item)
    target.row.i18n = nextI18n
    target.row.Ten_hang = nextI18n.vi.Ten_hang || s(target.row.Ten_hang)
    target.row.Danh_muc_cha = nextI18n.vi.Danh_muc_cha || ''
    target.row.Danh_muc = nextI18n.vi.Danh_muc || ''
    target.row.Dvt = nextI18n.vi.Dvt || ''
    target.row.Mo_ta = nextI18n.vi.Mo_ta || ''
  } else {
    // Keep i18n.vi in sync when top-level text fields are edited directly (e.g. bulk edit)
    for (const f of ['Ten_hang', 'Danh_muc_cha', 'Danh_muc', 'Dvt', 'Mo_ta']) {
      if (item[f] !== undefined) {
        currentI18n.vi[f] = s(item[f]).trim()
      }
    }
    target.row.i18n = currentI18n
  }

  delete target.row.So_luong_kho
  delete target.row.Lang
  delete target.row.Ma_nha_cung_cap
  delete target.row.Ten_nha_cung_cap

  target.row.Trang_thai = s(target.row.Trang_thai) === 'Hết hàng' ? 'Hết hàng' : 'Còn hàng'

  await set(dbRef(db, `hang_hoa/${target.key}`), sanitizeRow(target.row))
  return { success: true }
}

async function deleteHangHoa(body) {
  const maHang = s(body.Ma_hang).trim()
  if (!maHang) {
    return { success: false, message: 'Thiếu Ma_hang' }
  }

  const entries = await readSheetEntries('hang_hoa')
  const target = entries.find((e) => s(e.row.Ma_hang) === maHang)
  if (!target) {
    return { success: false, message: 'Không tìm thấy mã hàng' }
  }

  await remove(dbRef(db, `hang_hoa/${target.key}`))
  return { success: true }
}

function applyBulkPriceRule(currentVal, rule, allowEmptyZero = false) {
  if (!rule || typeof rule !== 'object') return currentVal
  const base = n(currentVal)
  const mode = s(rule.mode).trim()
  const val = Number(rule.value || 0)
  const delta = Number.isFinite(val) ? val : 0

  let next = base
  if (mode === 'set') {
    next = Math.max(0, delta)
  } else if (mode === 'add_money') {
    next = Math.max(0, base + delta)
  } else if (mode === 'sub_money') {
    next = Math.max(0, base - delta)
  } else if (mode === 'add_percent') {
    next = Math.max(0, Math.round(base * (1 + delta / 100)))
  } else if (mode === 'sub_percent') {
    next = Math.max(0, Math.round(base * (1 - delta / 100)))
  }
  if (allowEmptyZero && next <= 0) return ''
  return next
}

async function bulkUpdateHangHoa(body = {}) {
  const maHangs = Array.isArray(body.maHangs)
    ? body.maHangs.map((m) => s(m).trim()).filter(Boolean)
    : []
  const patch = body.patch || {}
  if (!maHangs.length) {
    return { success: false, message: 'Chưa chọn sản phẩm nào' }
  }

  const targetSet = new Set(maHangs)
  const orderIndexMap = new Map(maHangs.map((m, idx) => [m, idx]))
  const baseTopAt = Date.now() + maHangs.length
  const entries = await readSheetEntries('hang_hoa')
  const updates = {}
  let updated = 0

  const lang = DATA_LANG_CODES.includes(patch.lang) ? patch.lang : 'vi'

  for (const entry of entries) {
    const code = s(entry.row?.Ma_hang).trim()
    if (!targetSet.has(code)) continue

    const row = { ...entry.row }
    const nextI18n = normalizeProductI18n(row)

    if (patch.Danh_muc_cha !== undefined) {
      const dmc = s(patch.Danh_muc_cha).trim()
      nextI18n[lang].Danh_muc_cha = dmc
      if (lang === 'vi') row.Danh_muc_cha = dmc
    }
    if (patch.Danh_muc !== undefined) {
      const dm = s(patch.Danh_muc).trim()
      nextI18n[lang].Danh_muc = dm
      if (lang === 'vi') row.Danh_muc = dm
    }
    if (patch.Dvt !== undefined) {
      const dvt = s(patch.Dvt).trim()
      nextI18n[lang].Dvt = dvt
      if (lang === 'vi') row.Dvt = dvt
    }
    if (patch.Size !== undefined) {
      row.Size = s(patch.Size).trim()
    }
    if (patch.Don_vi_tien_te !== undefined) {
      row.Don_vi_tien_te = s(patch.Don_vi_tien_te).trim() || 'P'
    }
    if (patch.Trang_thai !== undefined) {
      row.Trang_thai = s(patch.Trang_thai) === 'Hết hàng' ? 'Hết hàng' : 'Còn hàng'
    }
    if (patch.Badge !== undefined) {
      row.Badge = s(patch.Badge).trim()
    }
    if (patch.Is_hidden !== undefined) {
      row.Is_hidden = patch.Is_hidden === true || String(patch.Is_hidden) === 'true'
    }
    if (patch.Top_action === 'pin') {
      const idx = orderIndexMap.get(code) ?? 0
      row.Top_at = baseTopAt - idx
    } else if (patch.Top_action === 'unpin') {
      row.Top_at = 0
    } else if (patch.Top_at !== undefined) {
      row.Top_at = Math.max(0, n(patch.Top_at, 0))
    }
    if (patch.Ncc_discount !== undefined) {
      row.Ncc_loai_giam = normalizeNccDiscountType(patch.Ncc_discount?.Ncc_loai_giam)
      row.Ncc_gia_tri_giam = normalizeNccDiscountValue(patch.Ncc_discount?.Ncc_gia_tri_giam)
    }
    if (patch.Gia_goc !== undefined) {
      row.Gia_goc = applyBulkPriceRule(row.Gia_goc, patch.Gia_goc, false)
    }
    if (patch.Gia_ban !== undefined) {
      row.Gia_ban = applyBulkPriceRule(row.Gia_ban, patch.Gia_ban, false)
    }
    if (patch.Gia_Giam !== undefined) {
      const ruleMode = s(patch.Gia_Giam?.mode).trim()
      const ruleVal = Math.max(0, Number(patch.Gia_Giam?.value || 0))
      const currentBan = n(row.Gia_ban)
      if (ruleMode === 'off_money_from_ban') {
        if (ruleVal <= 0 || currentBan <= 0) {
          row.Gia_Giam = ''
        } else {
          const nextFinal = Math.round(currentBan - ruleVal)
          row.Gia_Giam = nextFinal > 0 && nextFinal < currentBan ? nextFinal : ''
        }
      } else if (ruleMode === 'off_percent_from_ban') {
        if (ruleVal <= 0 || ruleVal >= 100 || currentBan <= 0) {
          row.Gia_Giam = ''
        } else {
          const nextFinal = Math.round(currentBan * (1 - ruleVal / 100))
          row.Gia_Giam = nextFinal > 0 && nextFinal < currentBan ? nextFinal : ''
        }
      } else {
        row.Gia_Giam = applyBulkPriceRule(row.Gia_Giam, patch.Gia_Giam, true)
      }
    }

    row.i18n = nextI18n
    delete row.So_luong_kho
    delete row.Lang
    delete row.Ma_nha_cung_cap
    delete row.Ten_nha_cung_cap

    updates[`hang_hoa/${entry.key}`] = sanitizeRow(syncProductWithI18n(row))
    updated += 1
  }

  if (updated > 0) {
    await update(dbRef(db), updates)
  }
  return { success: true, updated }
}

async function bulkDeleteHangHoa(body = {}) {
  const maHangs = Array.isArray(body.maHangs)
    ? body.maHangs.map((m) => s(m).trim()).filter(Boolean)
    : []
  if (!maHangs.length) {
    return { success: false, message: 'Chưa chọn sản phẩm nào' }
  }

  const targetSet = new Set(maHangs)
  const entries = await readSheetEntries('hang_hoa')
  const updates = {}
  let deleted = 0

  for (const entry of entries) {
    const code = s(entry.row?.Ma_hang).trim()
    if (!targetSet.has(code)) continue
    updates[`hang_hoa/${entry.key}`] = null
    deleted += 1
  }

  if (deleted > 0) {
    await update(dbRef(db), updates)
  }
  return { success: true, deleted }
}

function parseProductThuTuVal(row) {
  const val = Number(row?.Thu_tu || 0)
  return Number.isFinite(val) && val > 0 ? Math.floor(val) : Number.MAX_SAFE_INTEGER
}

async function reorderHangHoa(body = {}) {
  const maHangs = Array.isArray(body.maHangs)
    ? body.maHangs.map((m) => s(m).trim()).filter(Boolean)
    : []
  const topMap = body.topUpdates && typeof body.topUpdates === 'object' ? body.topUpdates : {}
  const hasTopUpdates = Object.keys(topMap).length > 0

  if (!maHangs.length && !hasTopUpdates) {
    return { success: false, message: 'Danh sách sắp xếp trống' }
  }

  const entries = await readSheetEntries('hang_hoa')
  if (!entries.length) return { success: true, updated: 0 }

  const updates = {}
  let updated = 0

  if (maHangs.length) {
    // Build stable global ranking across all items
    const globallySorted = entries
      .map((entry, idx) => ({
        entry,
        idx,
        code: s(entry.row?.Ma_hang).trim(),
        order: parseProductThuTuVal(entry.row),
      }))
      .sort((a, b) => {
        if (a.order !== b.order) return a.order - b.order
        return a.idx - b.idx
      })

    const currentRankByCode = new Map()
    globallySorted.forEach((item, idx) => {
      if (item.code && !currentRankByCode.has(item.code)) {
        currentRankByCode.set(item.code, idx + 1)
      }
    })

    // Assign sorted slots belonging to the reordered subset back in new visual order
    const validSubset = maHangs.filter((code) => currentRankByCode.has(code))
    const slots = validSubset.map((code) => currentRankByCode.get(code)).sort((a, b) => a - b)
    const newRankByCode = new Map()
    validSubset.forEach((code, idx) => {
      newRankByCode.set(code, slots[idx])
    })

    for (const { entry, code } of globallySorted) {
      const nextRank = newRankByCode.has(code)
        ? newRankByCode.get(code)
        : currentRankByCode.get(code) || 0
      if (nextRank > 0 && Number(entry.row?.Thu_tu || 0) !== nextRank) {
        updates[`hang_hoa/${entry.key}/Thu_tu`] = nextRank
        updated += 1
      }
    }
  }

  if (hasTopUpdates) {
    for (const entry of entries) {
      const code = s(entry.row?.Ma_hang).trim()
      if (!code || !Object.prototype.hasOwnProperty.call(topMap, code)) continue
      const nextTop = Math.max(0, n(topMap[code], 0))
      if (n(entry.row?.Top_at, 0) !== nextTop) {
        updates[`hang_hoa/${entry.key}/Top_at`] = nextTop
        updated += 1
      }
    }
  }

  if (updated > 0) {
    await update(dbRef(db), updates)
  }
  return { success: true, updated }
}

function normalizeParentMapInput(rawMap) {
  if (!rawMap || typeof rawMap !== 'object') return {}
  const out = {}
  for (const [subKey, parentVal] of Object.entries(rawMap)) {
    const cleanSub = s(subKey).trim()
    const cleanParent = s(parentVal).trim()
    if (!cleanSub || !cleanParent || cleanSub === cleanParent) continue
    out[cleanSub] = cleanParent
  }
  return out
}

function normalizeParentI18nInput(rawI18n) {
  if (!rawI18n || typeof rawI18n !== 'object') return {}
  const out = {}
  for (const [parentKey, langObj] of Object.entries(rawI18n)) {
    const cleanParent = s(parentKey).trim()
    if (!cleanParent || !langObj || typeof langObj !== 'object') continue
    const cleanLangs = { vi: cleanParent }
    for (const code of DATA_LANG_CODES) {
      if (code === 'vi') continue
      const val = s(langObj[code]).trim()
      if (val) cleanLangs[code] = val
    }
    out[cleanParent] = cleanLangs
  }
  return out
}

function normalizeProductGroupsInput(rawGroups) {
  if (!Array.isArray(rawGroups)) return []
  const out = []
  const seenGroupIds = new Set()
  for (const raw of rawGroups) {
    if (!raw || typeof raw !== 'object') continue
    const items = Array.isArray(raw.items) ? raw.items : []
    const cleanItems = []
    const seenCodes = new Set()
    for (const it of items) {
      const maHang = s(typeof it === 'string' ? it : it?.maHang).trim()
      if (!maHang || seenCodes.has(maHang)) continue
      seenCodes.add(maHang)
      const shortLabel = s(typeof it === 'object' ? it?.shortLabel : '').trim()
      cleanItems.push({ maHang, shortLabel })
    }
    if (cleanItems.length < 2) continue
    let id = s(raw.id).trim() || `pg_${out.length + 1}`
    if (seenGroupIds.has(id)) id = `${id}_${out.length + 1}`
    seenGroupIds.add(id)
    out.push({
      id,
      name: s(raw.name).trim(),
      items: cleanItems,
    })
  }
  return out
}

function normalizeToppingGroupsInput(rawGroups) {
  if (!Array.isArray(rawGroups)) return []
  const out = []
  const seenIds = new Set()
  for (const raw of rawGroups) {
    if (!raw || typeof raw !== 'object') continue
    const toppings = [
      ...new Set(
        (Array.isArray(raw.toppings) ? raw.toppings : [])
          .map((t) => s(typeof t === 'string' ? t : t?.maHang).trim())
          .filter(Boolean),
      ),
    ]
    const targetCategories = [
      ...new Set(
        (Array.isArray(raw.targetCategories) ? raw.targetCategories : [])
          .map((c) => s(c).trim())
          .filter(Boolean),
      ),
    ]
    const targetProducts = [
      ...new Set(
        (Array.isArray(raw.targetProducts) ? raw.targetProducts : [])
          .map((p) => s(typeof p === 'string' ? p : p?.maHang).trim())
          .filter(Boolean),
      ),
    ]
    if (!toppings.length || (!targetCategories.length && !targetProducts.length)) continue
    let id = s(raw.id).trim() || `tg_${out.length + 1}`
    if (seenIds.has(id)) id = `${id}_${out.length + 1}`
    seenIds.add(id)
    out.push({
      id,
      name: s(raw.name).trim(),
      toppings,
      targetCategories,
      targetProducts,
    })
  }
  return out
}

async function saveDisplayConfig(body = {}) {
  const d = body.data || {}
  const existingEntries = await readSheetEntries('display_config')
  const existingRow =
    existingEntries.find((e) => s(e.row?.ID) === 'main')?.row || existingEntries[0]?.row || {}

  const nextCategoryOrder = Array.isArray(d.categoryOrder)
    ? [...new Set(d.categoryOrder.map((c) => s(c).trim()).filter(Boolean))]
    : Array.isArray(existingRow.categoryOrder)
      ? existingRow.categoryOrder
      : []

  const hasParentMapUpdate = d.parentMap !== undefined
  const nextParentMap = hasParentMapUpdate
    ? normalizeParentMapInput(d.parentMap)
    : normalizeParentMapInput(existingRow.parentMap)

  const nextParentI18n =
    d.parentI18n !== undefined
      ? normalizeParentI18nInput(d.parentI18n)
      : normalizeParentI18nInput(existingRow.parentI18n)

  const nextProductGroups =
    d.productGroups !== undefined
      ? normalizeProductGroupsInput(d.productGroups)
      : normalizeProductGroupsInput(existingRow.productGroups)

  const nextToppingGroups =
    d.toppingGroups !== undefined
      ? normalizeToppingGroupsInput(d.toppingGroups)
      : normalizeToppingGroupsInput(existingRow.toppingGroups)

  const nextProductSortMode =
    d.productSortMode !== undefined
      ? s(d.productSortMode) === 'by_category'
        ? 'by_category'
        : 'flat'
      : s(existingRow.productSortMode) === 'by_category'
        ? 'by_category'
        : 'flat'

  const nextThemeConfig =
    d.themeConfig !== undefined
      ? normalizeThemeConfig({ ...d.themeConfig, updatedAt: Date.now() })
      : existingRow.themeConfig
        ? normalizeThemeConfig(existingRow.themeConfig)
        : normalizeThemeConfig(null)

  const payload = sanitizeRow({
    ID: 'main',
    categoryOrder: nextCategoryOrder,
    parentMap: nextParentMap,
    parentI18n: nextParentI18n,
    productGroups: nextProductGroups,
    toppingGroups: nextToppingGroups,
    productSortMode: nextProductSortMode,
    themeConfig: nextThemeConfig,
    updatedAt: Date.now(),
  })

  const updates = {}
  for (const e of existingEntries) {
    if (e.key !== 'main') updates[`display_config/${e.key}`] = null
  }
  updates['display_config/main'] = payload

  // Sync Danh_muc_cha onto hang_hoa products when category hierarchy is saved
  if (hasParentMapUpdate) {
    const hhEntries = await readSheetEntries('hang_hoa')
    // Harvest existing translations per canonical parent name as fallback
    const harvestedParentLangs = {}
    for (const e of hhEntries) {
      const i18n = normalizeProductI18n(e.row)
      const pVi = s(i18n.vi?.Danh_muc_cha || e.row?.Danh_muc_cha).trim()
      if (!pVi) continue
      if (!harvestedParentLangs[pVi]) harvestedParentLangs[pVi] = { vi: pVi }
      for (const code of DATA_LANG_CODES) {
        if (code === 'vi') continue
        const val = s(i18n[code]?.Danh_muc_cha).trim()
        if (val && !harvestedParentLangs[pVi][code]) {
          harvestedParentLangs[pVi][code] = val
        }
      }
    }

    for (const e of hhEntries) {
      const curRow = e.row || {}
      const curI18n = normalizeProductI18n(curRow)
      const subVi = s(curI18n.vi?.Danh_muc || curRow.Danh_muc).trim()
      if (!subVi) continue

      const targetParentVi = nextParentMap[subVi] || ''
      const curParentVi = s(curI18n.vi?.Danh_muc_cha || curRow.Danh_muc_cha).trim()
      const langDefaults = targetParentVi
        ? nextParentI18n[targetParentVi] || harvestedParentLangs[targetParentVi] || { vi: targetParentVi }
        : null

      let changed = curParentVi !== targetParentVi
      const nextI18n = { ...curI18n }
      for (const code of DATA_LANG_CODES) {
        const prevLangParent = s(curI18n[code]?.Danh_muc_cha).trim()
        const nextLangParent = targetParentVi
          ? s(langDefaults?.[code] || (code === 'vi' ? targetParentVi : prevLangParent || targetParentVi)).trim()
          : ''
        if (prevLangParent !== nextLangParent) {
          changed = true
          nextI18n[code] = {
            ...(curI18n[code] || {}),
            Danh_muc_cha: nextLangParent,
          }
        }
      }

      if (changed) {
        updates[`hang_hoa/${e.key}`] = sanitizeRow(
          syncProductWithI18n({
            ...curRow,
            Danh_muc_cha: targetParentVi,
            i18n: nextI18n,
          }),
        )
      }
    }
  }

  await update(dbRef(db), updates)

  return { success: true, data: payload }
}

/* =========================================================
 * CUSTOMER (KHACH_HANG) ACTIONS
 * ========================================================= */
async function updateKhachHang(body) {
  const d = body.data || {}
  if (!d.Ma_khach_hang) {
    return { success: false, message: 'Thiếu Ma_khach_hang' }
  }

  const entries = await readSheetEntries('khach_hang')
  const target = entries.find((e) => s(e.row.Ma_khach_hang) === s(d.Ma_khach_hang))
  if (!target) {
    return { success: false, message: 'Không tìm thấy khách hàng' }
  }

  if (d.Ten_khach_hang !== undefined) target.row.Ten_khach_hang = s(d.Ten_khach_hang)
  if (d.So_dien_thoai !== undefined) target.row.So_dien_thoai = s(d.So_dien_thoai)
  if (d.Dia_chi !== undefined) target.row.Dia_chi = s(d.Dia_chi)
  if (d.Cong_no_hien_tai !== undefined) target.row.Cong_no_hien_tai = n(d.Cong_no_hien_tai)
  if (d.Ghi_chu !== undefined) target.row.Ghi_chu = s(d.Ghi_chu)

  await set(dbRef(db, `khach_hang/${target.key}`), sanitizeRow(target.row))
  return { success: true, message: 'Cập nhật khách hàng thành công' }
}

async function deleteKhachHang(body) {
  const ma = s(body.Ma_khach_hang).trim()
  if (!ma) {
    return { success: false, message: 'Thiếu Ma_khach_hang' }
  }

  const entries = await readSheetEntries('khach_hang')
  const target = entries.find((e) => s(e.row.Ma_khach_hang) === ma)
  if (!target) {
    return { success: false, message: 'Không tìm thấy khách hàng' }
  }

  await remove(dbRef(db, `khach_hang/${target.key}`))
  return { success: true, message: 'Xóa khách hàng thành công' }
}

/* =========================================================
 * EXPENSES (CHI_PHI_PHAT_SINH in SO_THU_CHI) ACTIONS
 * ========================================================= */
async function addChiPhiPhatSinh(body) {
  const d = body.data || {}
  if (!d.So_tien || n(d.So_tien) <= 0) {
    return { success: false, message: 'Số tiền không hợp lệ' }
  }
  if (!d.Ten_dich_vu) {
    return { success: false, message: 'Thiếu tên dịch vụ' }
  }

  const now = new Date()
  const p = (num) => String(num).padStart(2, '0')

  const maDichVu =
    'CPPS' +
    p(now.getDate()) +
    p(now.getMonth() + 1) +
    now.getFullYear() +
    p(now.getHours()) +
    p(now.getMinutes()) +
    p(now.getSeconds())

  const ngayTao =
    `${p(now.getHours())}:${p(now.getMinutes())}:${p(now.getSeconds())} ` +
    `${p(now.getDate())}/${p(now.getMonth() + 1)}/${now.getFullYear()}`

  const newRow = {
    Ma_hoa_don: '',
    So_hoa_don: '',
    Ngay_tao_duong_lich: ngayTao,
    Trang_thai: 'CHI_PHI_PHAT_SINH',
    so_tien: n(d.So_tien),
    loi_nhuan: 0,
    hinh_thuc_thanh_toan: '',
    Ma_khach_hang: '',
    Ten_khach_hang: '',
    Ma_dich_vu: maDichVu,
    Ten_dich_vu: s(d.Ten_dich_vu),
    Don_vi_tien_te: s(d.Don_vi_tien_te || 'P'),
  }

  await set(dbRef(db, `so_thu_chi/${createRowKey()}`), sanitizeRow(newRow))

  return {
    success: true,
    data: {
      Ma_dich_vu: maDichVu,
      Ngay_tao: ngayTao,
    },
  }
}

async function updateChiPhiPhatSinh(body) {
  const d = body.data || {}
  if (!d.Ma_dich_vu) {
    return { success: false, message: 'Thiếu Ma_dich_vu' }
  }

  const entries = await readSheetEntries('so_thu_chi')
  const target = entries.find((e) => s(e.row.Ma_dich_vu) === s(d.Ma_dich_vu))
  if (!target) {
    return { success: false, message: 'Không tìm thấy mã dịch vụ' }
  }

  if (d.So_tien !== undefined) target.row.so_tien = n(d.So_tien)
  if (d.Ten_dich_vu !== undefined) target.row.Ten_dich_vu = s(d.Ten_dich_vu)
  if (d.Don_vi_tien_te !== undefined) target.row.Don_vi_tien_te = s(d.Don_vi_tien_te)
  delete target.row.Ma_nha_cung_cap
  delete target.row.Ten_nha_cung_cap

  await set(dbRef(db, `so_thu_chi/${target.key}`), sanitizeRow(target.row))
  return { success: true, message: 'Cập nhật thành công' }
}

async function deleteChiPhiPhatSinh(body) {
  const maDV = s(body.Ma_dich_vu).trim()
  if (!maDV) {
    return { success: false, message: 'Thiếu Ma_dich_vu' }
  }

  const entries = await readSheetEntries('so_thu_chi')
  const target = entries.find((e) => s(e.row.Ma_dich_vu) === maDV)
  if (!target) {
    return { success: false, message: 'Không tìm thấy mã dịch vụ' }
  }

  await remove(dbRef(db, `so_thu_chi/${target.key}`))
  return { success: true, message: 'Xóa thành công' }
}

/* =========================================================
 * CMS / WEBSITE CONFIGURATION ACTIONS
 * ========================================================= */
async function deleteById(sheetName, id) {
  const cleanId = s(id).trim()
  if (!cleanId) return { success: false, message: 'Thiếu ID' }

  const entries = await readSheetEntries(sheetName)
  const target = entries.find((e) => s(e.row.ID) === cleanId)
  if (!target) return { success: false, message: 'Không tìm thấy ID' }

  await remove(dbRef(db, `${sheetName}/${target.key}`))
  return { success: true }
}

// --- thong_bao (with multi-language i18n, max 1 active per type) ---
function normalizeNoticeType(val) {
  return s(val).trim() === 'popup' ? 'popup' : 'marquee'
}

function isNoticeActiveFlag(val) {
  return val !== false && String(val) !== 'false'
}

async function addThongBao(body) {
  const d = body.data || {}
  const loai = normalizeNoticeType(d.Loai_thong_bao)
  const isActive = isNoticeActiveFlag(d.Kich_hoat)
  const newKey = createRowKey()
  const synced = sanitizeRow(
    syncNoticeWithI18n({
      ID: s(d.ID || genShortId()),
      Noi_dung: s(d.Noi_dung),
      URL: s(d.URL),
      Loai_thong_bao: loai,
      Popup_img: s(d.Popup_img),
      Popup_link: s(d.Popup_link),
      Kich_hoat: isActive,
      is_Important: s(d.is_Important),
      i18n: d.i18n,
    }),
  )

  if (isActive) {
    const entries = await readSheetEntries('thong_bao')
    const updates = {
      [`thong_bao/${newKey}`]: synced,
    }
    for (const entry of entries) {
      if (
        entry.row &&
        normalizeNoticeType(entry.row.Loai_thong_bao) === loai &&
        isNoticeActiveFlag(entry.row.Kich_hoat)
      ) {
        updates[`thong_bao/${entry.key}/Kich_hoat`] = false
      }
    }
    await update(dbRef(db), updates)
  } else {
    await set(dbRef(db, `thong_bao/${newKey}`), synced)
  }
  return { success: true }
}

async function updateThongBao(body) {
  const d = body.data || {}
  if (!d.ID) return { success: false, message: 'Thiếu ID' }
  const entries = await readSheetEntries('thong_bao')
  const target = entries.find((e) => s(e.row.ID) === s(d.ID))
  if (!target) return { success: false, message: 'Không tìm thấy thông báo' }

  const baseI18n = d.i18n ? normalizeNoticeI18n(d) : normalizeNoticeI18n(target.row)
  if (!d.i18n && d.Noi_dung !== undefined) {
    baseI18n.vi.Noi_dung = s(d.Noi_dung).trim()
  }

  const nextLoai =
    d.Loai_thong_bao !== undefined
      ? normalizeNoticeType(d.Loai_thong_bao)
      : normalizeNoticeType(target.row.Loai_thong_bao)

  const nextActive =
    d.Kich_hoat !== undefined
      ? isNoticeActiveFlag(d.Kich_hoat)
      : isNoticeActiveFlag(target.row.Kich_hoat)

  target.row = syncNoticeWithI18n({
    ID: s(d.ID),
    Noi_dung: baseI18n.vi.Noi_dung || s(d.Noi_dung),
    URL: d.URL !== undefined ? s(d.URL) : s(target.row.URL),
    Loai_thong_bao: nextLoai,
    Popup_img: d.Popup_img !== undefined ? s(d.Popup_img) : s(target.row.Popup_img),
    Popup_link: d.Popup_link !== undefined ? s(d.Popup_link) : s(target.row.Popup_link),
    Kich_hoat: nextActive,
    is_Important: d.is_Important !== undefined ? s(d.is_Important) : s(target.row.is_Important),
    i18n: baseI18n,
  })

  const updates = {
    [`thong_bao/${target.key}`]: sanitizeRow(target.row),
  }
  if (nextActive) {
    for (const entry of entries) {
      if (
        entry.key !== target.key &&
        entry.row &&
        normalizeNoticeType(entry.row.Loai_thong_bao) === nextLoai &&
        isNoticeActiveFlag(entry.row.Kich_hoat)
      ) {
        updates[`thong_bao/${entry.key}/Kich_hoat`] = false
      }
    }
  }
  await update(dbRef(db), updates)
  return { success: true }
}

async function deleteThongBao(body) {
  return deleteById('thong_bao', body.ID)
}

// --- banner (ordered by Thu_tu ascending, fallback ID descending) ---
function parseBannerOrder(val) {
  const n = Number(val)
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : Number.MAX_SAFE_INTEGER
}

function sortBannerEntries(entries) {
  return [...entries].sort((a, b) => {
    const orderDiff = parseBannerOrder(a.row?.Thu_tu) - parseBannerOrder(b.row?.Thu_tu)
    if (orderDiff !== 0) return orderDiff
    return s(b.row?.ID).localeCompare(s(a.row?.ID))
  })
}

async function addBanner(body) {
  const d = body.data || {}
  const placement = normalizeBannerPlacement(d.Placement)
  const allEntries = await readSheetEntries('banner')
  const entries = sortBannerEntries(
    allEntries.filter((e) => normalizeBannerPlacement(e.row?.Placement) === placement),
  )
  const newKey = createRowKey()
  const rawOrder = Number(d.Thu_tu)
  const insertIdx =
    Number.isFinite(rawOrder) && rawOrder > 0
      ? Math.min(Math.max(Math.floor(rawOrder) - 1, 0), entries.length)
      : 0

  const newEntry = {
    key: newKey,
    row: {
      ID: s(d.ID || genShortId()),
      URL: s(d.URL),
      Title: s(d.Title),
      Placement: placement,
      Target_pages: normalizeVerticalBannerTarget(d.Target_pages),
      is_Important: s(d.is_Important),
      Click_action: normalizeBannerAction(d.Click_action),
      Link_url: normalizeBannerLink(d.Link_url),
      Active: d.Active !== undefined ? isBannerActive(d) : true,
      Thu_tu: insertIdx + 1,
    },
  }

  const ordered = [...entries]
  ordered.splice(insertIdx, 0, newEntry)

  const updates = {}
  ordered.forEach((entry, idx) => {
    const pos = idx + 1
    if (entry.key === newKey) {
      updates[`banner/${newKey}`] = sanitizeRow({ ...entry.row, Thu_tu: pos })
    } else if (parseBannerOrder(entry.row?.Thu_tu) !== pos) {
      updates[`banner/${entry.key}/Thu_tu`] = pos
    }
  })

  await update(dbRef(db), updates)
  return { success: true }
}

async function updateBanner(body) {
  const d = body.data || {}
  if (!d.ID) return { success: false }
  const allEntries = await readSheetEntries('banner')
  const target = allEntries.find((e) => s(e.row?.ID) === s(d.ID))
  if (!target) return { success: false }

  const prevPlacement = normalizeBannerPlacement(target.row?.Placement)
  const nextPlacement =
    d.Placement !== undefined ? normalizeBannerPlacement(d.Placement) : prevPlacement

  const entries = sortBannerEntries(
    allEntries.filter(
      (e) => e.key === target.key || normalizeBannerPlacement(e.row?.Placement) === nextPlacement,
    ),
  )
  const currentIdx = entries.findIndex((e) => e.key === target.key)
  if (currentIdx === -1) return { success: false }

  const nextRow = {
    ID: s(d.ID),
    URL: d.URL !== undefined ? s(d.URL) : s(target.row.URL),
    Title: d.Title !== undefined ? s(d.Title) : s(target.row.Title),
    Placement: nextPlacement,
    Target_pages:
      d.Target_pages !== undefined
        ? normalizeVerticalBannerTarget(d.Target_pages)
        : normalizeVerticalBannerTarget(target.row.Target_pages),
    is_Important: d.is_Important !== undefined ? s(d.is_Important) : s(target.row.is_Important),
    Click_action:
      d.Click_action !== undefined
        ? normalizeBannerAction(d.Click_action)
        : normalizeBannerAction(target.row.Click_action),
    Link_url:
      d.Link_url !== undefined
        ? normalizeBannerLink(d.Link_url)
        : normalizeBannerLink(target.row.Link_url),
    Active: d.Active !== undefined ? isBannerActive(d) : isBannerActive(target.row),
    Thu_tu: currentIdx + 1,
  }

  const ordered = [...entries]
  const hasOrderProp = d.Thu_tu !== undefined && d.Thu_tu !== null && d.Thu_tu !== ''
  if (hasOrderProp) {
    const parsed = Math.floor(Number(d.Thu_tu))
    const destIdx = Number.isFinite(parsed)
      ? Math.min(Math.max(parsed - 1, 0), ordered.length - 1)
      : currentIdx
    if (destIdx !== currentIdx) {
      const [moved] = ordered.splice(currentIdx, 1)
      ordered.splice(destIdx, 0, moved)
    }
  }

  const updates = {}
  ordered.forEach((entry, idx) => {
    const pos = idx + 1
    if (entry.key === target.key) {
      updates[`banner/${target.key}`] = sanitizeRow({ ...nextRow, Thu_tu: pos })
    } else if (parseBannerOrder(entry.row?.Thu_tu) !== pos) {
      updates[`banner/${entry.key}/Thu_tu`] = pos
    }
  })

  if (prevPlacement !== nextPlacement) {
    const oldGroup = sortBannerEntries(
      allEntries.filter(
        (e) => e.key !== target.key && normalizeBannerPlacement(e.row?.Placement) === prevPlacement,
      ),
    )
    oldGroup.forEach((entry, idx) => {
      const pos = idx + 1
      if (parseBannerOrder(entry.row?.Thu_tu) !== pos) {
        updates[`banner/${entry.key}/Thu_tu`] = pos
      }
    })
  }

  await update(dbRef(db), updates)
  return { success: true }
}

async function reorderBanners(body) {
  const ids = Array.isArray(body?.ids) ? body.ids.map((id) => s(id)).filter(Boolean) : []
  if (!ids.length) return { success: false, message: 'Thiếu danh sách thứ tự banner' }

  const allEntries = await readSheetEntries('banner')
  const byId = new Map(allEntries.map((entry) => [s(entry.row?.ID), entry]))
  const firstFound = ids.map((id) => byId.get(id)).find(Boolean)
  const placement =
    body?.placement !== undefined
      ? normalizeBannerPlacement(body.placement)
      : normalizeBannerPlacement(firstFound?.row?.Placement)

  const groupEntries = allEntries.filter(
    (entry) => normalizeBannerPlacement(entry.row?.Placement) === placement,
  )
  const groupById = new Map(groupEntries.map((entry) => [s(entry.row?.ID), entry]))

  const ordered = []
  const usedKeys = new Set()
  for (const id of ids) {
    const found = groupById.get(id)
    if (found && !usedKeys.has(found.key)) {
      ordered.push(found)
      usedKeys.add(found.key)
    }
  }
  for (const leftover of sortBannerEntries(groupEntries)) {
    if (!usedKeys.has(leftover.key)) {
      ordered.push(leftover)
      usedKeys.add(leftover.key)
    }
  }

  const updates = {}
  ordered.forEach((entry, idx) => {
    const pos = idx + 1
    if (parseBannerOrder(entry.row?.Thu_tu) !== pos) {
      updates[`banner/${entry.key}/Thu_tu`] = pos
    }
  })

  if (Object.keys(updates).length) {
    await update(dbRef(db), updates)
  }
  return { success: true }
}

async function deleteBanner(body) {
  const targetId = s(body?.ID)
  if (!targetId) return { success: false }
  const allEntries = await readSheetEntries('banner')
  const target = allEntries.find((e) => s(e.row?.ID) === targetId)
  if (!target) return { success: false }

  const placement = normalizeBannerPlacement(target.row?.Placement)
  const remaining = sortBannerEntries(
    allEntries.filter(
      (e) => e.key !== target.key && normalizeBannerPlacement(e.row?.Placement) === placement,
    ),
  )
  const updates = {
    [`banner/${target.key}`]: null,
  }
  remaining.forEach((entry, idx) => {
    const pos = idx + 1
    if (parseBannerOrder(entry.row?.Thu_tu) !== pos) {
      updates[`banner/${entry.key}/Thu_tu`] = pos
    }
  })
  await update(dbRef(db), updates)
  return { success: true }
}

// --- logo ---
function buildLogoRowPayload(d = {}, existing = null) {
  return sanitizeRow({
    ID: s(d.ID || existing?.ID || genShortId()),
    URL: d.URL !== undefined ? s(d.URL) : s(existing?.URL),
    Name: d.Name !== undefined ? s(d.Name) : s(existing?.Name),
    Short_Name: d.Short_Name !== undefined ? s(d.Short_Name) : s(existing?.Short_Name),
    Favicon_URL: d.Favicon_URL !== undefined ? s(d.Favicon_URL) : s(existing?.Favicon_URL),
    Mobile_Icon_URL:
      d.Mobile_Icon_URL !== undefined ? s(d.Mobile_Icon_URL) : s(existing?.Mobile_Icon_URL),
    Share_Image_URL:
      d.Share_Image_URL !== undefined ? s(d.Share_Image_URL) : s(existing?.Share_Image_URL),
    SEO_Title: d.SEO_Title !== undefined ? s(d.SEO_Title) : s(existing?.SEO_Title),
    SEO_Description:
      d.SEO_Description !== undefined ? s(d.SEO_Description) : s(existing?.SEO_Description),
    SEO_H1: d.SEO_H1 !== undefined ? s(d.SEO_H1) : s(existing?.SEO_H1),
    SEO_Intro: d.SEO_Intro !== undefined ? s(d.SEO_Intro) : s(existing?.SEO_Intro),
    SEO_Keywords: d.SEO_Keywords !== undefined ? s(d.SEO_Keywords) : s(existing?.SEO_Keywords),
    Shop_Address: d.Shop_Address !== undefined ? s(d.Shop_Address) : s(existing?.Shop_Address),
    Map_URL: d.Map_URL !== undefined ? s(d.Map_URL) : s(existing?.Map_URL),
    Updated_at: Date.now(),
  })
}

async function addLogo(body) {
  const d = body.data || {}
  await set(dbRef(db, `logo/${createRowKey()}`), buildLogoRowPayload(d))
  return { success: true }
}

async function updateLogo(body) {
  const d = body.data || {}
  if (!d.ID) return { success: false }
  const entries = await readSheetEntries('logo')
  const target = entries.find((e) => s(e.row.ID) === s(d.ID))
  if (!target) return { success: false }

  target.row = buildLogoRowPayload(d, target.row)
  await set(dbRef(db, `logo/${target.key}`), target.row)
  return { success: true }
}

async function deleteLogo(body) {
  return deleteById('logo', body.ID)
}

async function upsertLogo(body) {
  const d = body.data || {}
  const entries = await readSheetEntries('logo')
  const target =
    (d.ID && entries.find((e) => s(e.row.ID) === s(d.ID))) || entries[0] || null

  const rowPayload = buildLogoRowPayload(d, target?.row || null)

  if (target) {
    await set(dbRef(db, `logo/${target.key}`), rowPayload)
    return { success: true, mode: 'update' }
  }

  await set(dbRef(db, `logo/${createRowKey()}`), rowPayload)
  return { success: true, mode: 'insert' }
}

// --- khuyenmai_info (with multi-language i18n + milestone config) ---
async function addKhuyenMai(body) {
  const d = body.data || {}
  const loaiKm = s(d.Loai_km).trim() === 'MILESTONE' ? 'MILESTONE' : 'TEXT'
  const basePayload = {
    ID: s(d.ID || genShortId()),
    Loai_km: loaiKm,
    Noi_dung: s(d.Noi_dung),
    i18n: d.i18n,
  }
  if (loaiKm === 'MILESTONE') {
    basePayload.Kieu_uu_dai = s(d.Kieu_uu_dai).trim() === 'GIFT' ? 'GIFT' : 'FREESHIP'
    basePayload.Moc_tien = Math.max(0, n(d.Moc_tien, 0))
    basePayload.Kich_hoat = d.Kich_hoat !== undefined ? Boolean(d.Kich_hoat) : true
  }
  const synced = syncNoticeWithI18n(basePayload)
  await set(dbRef(db, `khuyenmai_info/${createRowKey()}`), sanitizeRow(synced))
  return { success: true }
}

async function updateKhuyenMai(body) {
  const d = body.data || {}
  if (!d.ID) return { success: false }
  const entries = await readSheetEntries('khuyenmai_info')
  const target = entries.find((e) => s(e.row.ID) === s(d.ID))
  if (!target) return { success: false }

  const loaiKm =
    d.Loai_km !== undefined
      ? s(d.Loai_km).trim() === 'MILESTONE'
        ? 'MILESTONE'
        : 'TEXT'
      : s(target.row.Loai_km).trim() === 'MILESTONE'
        ? 'MILESTONE'
        : 'TEXT'

  const baseI18n = d.i18n ? normalizeNoticeI18n(d) : normalizeNoticeI18n(target.row)
  if (!d.i18n && d.Noi_dung !== undefined) {
    baseI18n.vi.Noi_dung = s(d.Noi_dung).trim()
  }

  const nextRow = {
    ...target.row,
    ID: s(d.ID),
    Loai_km: loaiKm,
    Noi_dung: baseI18n.vi.Noi_dung || s(d.Noi_dung ?? target.row.Noi_dung),
    i18n: baseI18n,
  }
  if (loaiKm === 'MILESTONE') {
    nextRow.Kieu_uu_dai =
      d.Kieu_uu_dai !== undefined
        ? s(d.Kieu_uu_dai).trim() === 'GIFT'
          ? 'GIFT'
          : 'FREESHIP'
        : s(target.row.Kieu_uu_dai).trim() === 'GIFT'
          ? 'GIFT'
          : 'FREESHIP'
    nextRow.Moc_tien =
      d.Moc_tien !== undefined
        ? Math.max(0, n(d.Moc_tien, 0))
        : Math.max(0, n(target.row.Moc_tien, 0))
    nextRow.Kich_hoat =
      d.Kich_hoat !== undefined
        ? Boolean(d.Kich_hoat)
        : target.row.Kich_hoat !== undefined
          ? Boolean(target.row.Kich_hoat)
          : true
  }

  target.row = syncNoticeWithI18n(nextRow)
  await set(dbRef(db, `khuyenmai_info/${target.key}`), sanitizeRow(target.row))
  return { success: true }
}

async function deleteKhuyenMai(body) {
  return deleteById('khuyenmai_info', body.ID)
}

// --- shop_contact ---
function isAllowMessageFlag(val) {
  return val === true || val === 1 || val === '1' || String(val).toLowerCase() === 'true'
}

async function addShopContact(body) {
  const d = body.data || {}
  const allowMessage = isAllowMessageFlag(d.Allow_message)
  const newKey = createRowKey()
  const newRow = sanitizeRow({
    ID: s(d.ID || genShortId()),
    PLATFORM_name: s(d.PLATFORM_name),
    URL_img: s(d.URL_img),
    Direct_link: s(d.Direct_link),
    INFO: s(d.INFO),
    Allow_message: allowMessage,
  })

  if (allowMessage) {
    const entries = await readSheetEntries('shop_contact')
    const updates = {
      [`shop_contact/${newKey}`]: newRow,
    }
    for (const entry of entries) {
      if (entry.row && isAllowMessageFlag(entry.row.Allow_message)) {
        updates[`shop_contact/${entry.key}/Allow_message`] = false
      }
    }
    await update(dbRef(db), updates)
  } else {
    await set(dbRef(db, `shop_contact/${newKey}`), newRow)
  }
  return { success: true }
}

async function updateShopContact(body) {
  const d = body.data || {}
  if (!d.ID) return { success: false }
  const entries = await readSheetEntries('shop_contact')
  const target = entries.find((e) => s(e.row.ID) === s(d.ID))
  if (!target) return { success: false }

  const hasAllowProp = Object.prototype.hasOwnProperty.call(d, 'Allow_message')
  const allowMessage = hasAllowProp
    ? isAllowMessageFlag(d.Allow_message)
    : isAllowMessageFlag(target.row.Allow_message)

  target.row = {
    ID: s(d.ID),
    PLATFORM_name: s(d.PLATFORM_name !== undefined ? d.PLATFORM_name : target.row.PLATFORM_name),
    URL_img: s(d.URL_img !== undefined ? d.URL_img : target.row.URL_img),
    Direct_link: s(d.Direct_link !== undefined ? d.Direct_link : target.row.Direct_link),
    INFO: s(d.INFO !== undefined ? d.INFO : target.row.INFO),
    Allow_message: allowMessage,
  }

  const updates = {
    [`shop_contact/${target.key}`]: sanitizeRow(target.row),
  }
  if (allowMessage) {
    for (const entry of entries) {
      if (entry.key !== target.key && entry.row && isAllowMessageFlag(entry.row.Allow_message)) {
        updates[`shop_contact/${entry.key}/Allow_message`] = false
      }
    }
  }
  await update(dbRef(db), updates)
  return { success: true }
}

async function deleteShopContact(body) {
  return deleteById('shop_contact', body.ID)
}

// --- partners ---
function isPartnerActiveFlag(val) {
  if (val === undefined || val === null || val === '') return true
  if (val === false || val === 0 || val === '0' || String(val).toLowerCase() === 'false') return false
  return true
}

async function addPartner(body) {
  const d = body.data || {}
  const entries = await readSheetEntries('partners')
  const nextOrder =
    d.Sort_order !== undefined && Number.isFinite(Number(d.Sort_order))
      ? Number(d.Sort_order)
      : entries.length + 1

  const newRow = sanitizeRow({
    ID: s(d.ID || genShortId()),
    Name: s(d.Name).trim(),
    Subtitle: s(d.Subtitle).trim(),
    Badge: s(d.Badge).trim(),
    Bg_color: normalizePartnerHexColor(d.Bg_color),
    URL_img: s(d.URL_img).trim(),
    Direct_link: normalizeBannerLink(d.Direct_link),
    Active: isPartnerActiveFlag(d.Active),
    Sort_order: nextOrder,
  })

  await set(dbRef(db, `partners/${createRowKey()}`), newRow)
  return { success: true }
}

async function updatePartner(body) {
  const d = body.data || {}
  if (!d.ID) return { success: false }
  const entries = await readSheetEntries('partners')
  const target = entries.find((e) => s(e.row.ID) === s(d.ID))
  if (!target) return { success: false }

  const nextLink =
    d.Direct_link !== undefined
      ? normalizeBannerLink(d.Direct_link)
      : normalizeBannerLink(target.row.Direct_link)

  const nextActive = Object.prototype.hasOwnProperty.call(d, 'Active')
    ? isPartnerActiveFlag(d.Active)
    : isPartnerActiveFlag(target.row.Active)

  target.row = sanitizeRow({
    ID: s(d.ID),
    Name: d.Name !== undefined ? s(d.Name).trim() : s(target.row.Name).trim(),
    Subtitle: d.Subtitle !== undefined ? s(d.Subtitle).trim() : s(target.row.Subtitle).trim(),
    Badge: d.Badge !== undefined ? s(d.Badge).trim() : s(target.row.Badge).trim(),
    Bg_color:
      d.Bg_color !== undefined
        ? normalizePartnerHexColor(d.Bg_color)
        : normalizePartnerHexColor(target.row.Bg_color),
    URL_img: d.URL_img !== undefined ? s(d.URL_img).trim() : s(target.row.URL_img).trim(),
    Direct_link: nextLink,
    Active: nextActive,
    Sort_order:
      d.Sort_order !== undefined && Number.isFinite(Number(d.Sort_order))
        ? Number(d.Sort_order)
        : n(target.row.Sort_order, 1),
  })

  await set(dbRef(db, `partners/${target.key}`), target.row)
  return { success: true }
}

async function reorderPartners(body) {
  const orderedIds = Array.isArray(body.ids) ? body.ids.map((id) => s(id)) : []
  if (!orderedIds.length) return { success: false }
  const entries = await readSheetEntries('partners')
  const updates = {}
  orderedIds.forEach((id, idx) => {
    const found = entries.find((e) => s(e.row.ID) === id)
    if (found) {
      updates[`partners/${found.key}/Sort_order`] = idx + 1
    }
  })
  if (Object.keys(updates).length) {
    await update(dbRef(db), updates)
  }
  return { success: true }
}

async function deletePartner(body) {
  return deleteById('partners', body.ID)
}

// --- feed_posts (Bảng tin & Feedback) ---
function normalizeFeedPostType(raw) {
  const val = s(raw).trim().toLowerCase()
  if (val === 'kitchen' || val === 'promo' || val === 'feedback') return val
  return 'feedback'
}

function normalizeStringArray(arr) {
  if (!Array.isArray(arr)) return []
  return arr.map((item) => s(item).trim()).filter(Boolean)
}

async function addFeedPost(body) {
  const d = body.data || {}
  const id = s(d.ID || genShortId()).trim()
  const now = Date.now()

  const newRow = sanitizeRow({
    ID: id,
    Post_type: normalizeFeedPostType(d.Post_type),
    Content: sanitizeFeedCaptionHtml(d.Content),
    Images: normalizeStringArray(d.Images),
    Product_codes: normalizeStringArray(d.Product_codes),
    Pinned: Boolean(d.Pinned),
    Active: isPartnerActiveFlag(d.Active),
    Base_views: Math.max(0, Math.round(n(d.Base_views, 0))),
    Base_hearts: Math.max(0, Math.round(n(d.Base_hearts, 0))),
    Views: 0,
    Like_count: 0,
    Heart_count: 0,
    Haha_count: 0,
    Wow_count: 0,
    Yummy_count: 0,
    Trust_count: 0,
    Created_at: n(d.Created_at, now),
    Updated_at: now,
  })

  await set(dbRef(db, `feed_posts/${safeFirebaseKey(id)}`), newRow)
  return { success: true, id }
}

async function updateFeedPost(body) {
  const d = body.data || {}
  const id = s(d.ID).trim()
  if (!id) return { success: false }

  const entries = await readSheetEntries('feed_posts')
  const target = entries.find((e) => s(e.row.ID) === id)
  if (!target) return { success: false }

  const prev = target.row || {}
  const nextActive = Object.prototype.hasOwnProperty.call(d, 'Active')
    ? isPartnerActiveFlag(d.Active)
    : isPartnerActiveFlag(prev.Active)
  const nextPinned = Object.prototype.hasOwnProperty.call(d, 'Pinned')
    ? Boolean(d.Pinned)
    : Boolean(prev.Pinned)

  const updatedRow = sanitizeRow({
    ...prev,
    ID: id,
    Post_type: d.Post_type !== undefined ? normalizeFeedPostType(d.Post_type) : normalizeFeedPostType(prev.Post_type),
    Content:
      d.Content !== undefined
        ? sanitizeFeedCaptionHtml(d.Content)
        : sanitizeFeedCaptionHtml(prev.Content),
    Images: d.Images !== undefined ? normalizeStringArray(d.Images) : normalizeStringArray(prev.Images),
    Product_codes:
      d.Product_codes !== undefined
        ? normalizeStringArray(d.Product_codes)
        : normalizeStringArray(prev.Product_codes),
    Pinned: nextPinned,
    Active: nextActive,
    Base_views:
      d.Base_views !== undefined
        ? Math.max(0, Math.round(n(d.Base_views, 0)))
        : Math.max(0, Math.round(n(prev.Base_views, 0))),
    Base_hearts:
      d.Base_hearts !== undefined
        ? Math.max(0, Math.round(n(d.Base_hearts, 0)))
        : Math.max(0, Math.round(n(prev.Base_hearts, 0))),
    Views: Math.max(0, Math.round(n(prev.Views, 0))),
    Like_count: Math.max(0, Math.round(n(prev.Like_count, 0))),
    Heart_count: Math.max(0, Math.round(n(prev.Heart_count, 0))),
    Haha_count: Math.max(0, Math.round(n(prev.Haha_count, 0))),
    Wow_count: Math.max(0, Math.round(n(prev.Wow_count, 0))),
    Yummy_count: Math.max(0, Math.round(n(prev.Yummy_count, 0))),
    Trust_count: Math.max(0, Math.round(n(prev.Trust_count, 0))),
    Created_at: n(prev.Created_at, Date.now()),
    Updated_at: Date.now(),
  })

  await set(dbRef(db, `feed_posts/${target.key}`), updatedRow)
  return { success: true }
}

async function deleteFeedPost(body) {
  return deleteById('feed_posts', body.ID)
}

const _feedKeyCache = new Map()

async function resolveFeedPostFirebaseKey(postId) {
  const cleanId = s(postId).trim()
  if (!cleanId) return ''
  if (_feedKeyCache.has(cleanId)) return _feedKeyCache.get(cleanId)

  const directKey = safeFirebaseKey(cleanId)
  try {
    const directSnap = await get(dbRef(db, `feed_posts/${directKey}/ID`))
    if (directSnap.exists() && s(directSnap.val()).trim() === cleanId) {
      _feedKeyCache.set(cleanId, directKey)
      return directKey
    }
  } catch {
    // fallback to entry scan
  }

  const entries = await readSheetEntries('feed_posts')
  const found = entries.find((e) => s(e.row.ID).trim() === cleanId)
  if (found) {
    _feedKeyCache.set(cleanId, found.key)
    return found.key
  }
  return ''
}

export async function incrementFeedPostView(postId) {
  try {
    const nodeKey = await resolveFeedPostFirebaseKey(postId)
    if (!nodeKey) return false
    await runTransaction(dbRef(db, `feed_posts/${nodeKey}/Views`), (cur) => {
      return Math.max(0, Math.round(Number(cur || 0))) + 1
    })
    return true
  } catch {
    return false
  }
}

export async function toggleFeedPostReaction(postId, reactionType, delta = 1) {
  const fieldMap = {
    like: 'Like_count',
    heart: 'Heart_count',
    haha: 'Haha_count',
    wow: 'Wow_count',
    yummy: 'Yummy_count',
    trust: 'Trust_count',
  }
  const field = fieldMap[reactionType]
  if (!field) return false

  try {
    const nodeKey = await resolveFeedPostFirebaseKey(postId)
    if (!nodeKey) return false
    const step = Number(delta) >= 0 ? 1 : -1
    await runTransaction(dbRef(db, `feed_posts/${nodeKey}/${field}`), (cur) => {
      return Math.max(0, Math.round(Number(cur || 0)) + step)
    })
    return true
  } catch {
    return false
  }
}

// --- time ---
async function addTimeShop(body) {
  const d = body.data || {}
  await set(
    dbRef(db, `time/${createRowKey()}`),
    sanitizeRow({
      ID: s(d.ID || genShortId()),
      thoi_gian_hoat_dong_shop: s(d.thoi_gian_hoat_dong_shop),
    }),
  )
  return { success: true }
}

async function updateTimeShop(body) {
  const d = body.data || {}
  if (!d.ID) return { success: false }
  const entries = await readSheetEntries('time')
  const target = entries.find((e) => s(e.row.ID) === s(d.ID))
  if (!target) return { success: false }

  target.row = {
    ID: s(d.ID),
    thoi_gian_hoat_dong_shop: s(d.thoi_gian_hoat_dong_shop),
  }
  await set(dbRef(db, `time/${target.key}`), sanitizeRow(target.row))
  return { success: true }
}

async function deleteTimeShop(body) {
  return deleteById('time', body.ID)
}

async function upsertOpenTime(data = {}) {
  const entries = await readSheetEntries('time')
  const target =
    (data.ID && entries.find((e) => s(e.row.ID) === s(data.ID))) || entries[0] || null

  const rowPayload = sanitizeRow({
    ID: s(data.ID || target?.row?.ID || genShortId()),
    thoi_gian_hoat_dong_shop: s(data.thoi_gian_hoat_dong_shop).trim(),
  })

  if (target) {
    await set(dbRef(db, `time/${target.key}`), rowPayload)
    return { success: true, type: 'update' }
  }

  await set(dbRef(db, `time/${createRowKey()}`), rowPayload)
  return { success: true, type: 'insert' }
}

// --- thong_tin_chuyen_khoan ---
async function clearOtherInvoiceQrFlags(excludeKey = '') {
  const entries = await readSheetEntries('thong_tin_chuyen_khoan')
  const updates = {}
  for (const { key, row } of entries) {
    if (key === excludeKey) continue
    if (row?.Show_in_invoice) {
      updates[`thong_tin_chuyen_khoan/${key}/Show_in_invoice`] = false
    }
  }
  if (Object.keys(updates).length > 0) {
    await update(dbRef(db), updates)
  }
}

async function addThongTinChuyenKhoan(body) {
  const d = body.data || {}
  const showInInvoice = Boolean(d.Show_in_invoice)
  const newKey = createRowKey()
  if (showInInvoice) {
    await clearOtherInvoiceQrFlags(newKey)
  }
  await set(
    dbRef(db, `thong_tin_chuyen_khoan/${newKey}`),
    sanitizeRow({
      ID: s(d.ID || genShortId()),
      Tieu_de: s(d.Tieu_de),
      ThongTin: s(d.ThongTin),
      QR_IMG: s(d.QR_IMG),
      Ti_gia: n(d.Ti_gia, 1),
      Don_vi_tien_te: s(d.Don_vi_tien_te || 'VND'),
      Show_in_invoice: showInInvoice,
    }),
  )
  return { success: true }
}

async function updateThongTinChuyenKhoan(body) {
  const d = body.data || {}
  if (!d.ID) return { success: false }
  const entries = await readSheetEntries('thong_tin_chuyen_khoan')
  const target = entries.find((e) => s(e.row.ID) === s(d.ID))
  if (!target) return { success: false }

  const showInInvoice =
    d.Show_in_invoice !== undefined ? Boolean(d.Show_in_invoice) : Boolean(target.row.Show_in_invoice)
  if (showInInvoice) {
    await clearOtherInvoiceQrFlags(target.key)
  }

  target.row = {
    ID: s(d.ID),
    Tieu_de: s(d.Tieu_de),
    ThongTin: s(d.ThongTin),
    QR_IMG: s(d.QR_IMG),
    Ti_gia: n(d.Ti_gia, 1),
    Don_vi_tien_te: s(d.Don_vi_tien_te || 'VND'),
    Show_in_invoice: showInInvoice,
  }
  await set(
    dbRef(db, `thong_tin_chuyen_khoan/${target.key}`),
    sanitizeRow(target.row),
  )
  return { success: true }
}

async function deleteThongTinChuyenKhoan(body) {
  return deleteById('thong_tin_chuyen_khoan', body.ID)
}

// --- blog_categories & blog_posts (WordPress-style SEO Blog CMS) ---
function genUniqueSlug(baseSlug, existingSlugs = [], fallbackPrefix = 'item') {
  const cleanBase = slugifyVi(baseSlug) || `${fallbackPrefix}-${genShortId().slice(0, 5)}`
  const existingSet = new Set(existingSlugs.map((x) => s(x).trim().toLowerCase()).filter(Boolean))
  if (!existingSet.has(cleanBase)) return cleanBase
  let i = 2
  while (existingSet.has(`${cleanBase}-${i}`)) {
    i += 1
  }
  return `${cleanBase}-${i}`
}

async function upsertBlogCategory(body) {
  const d = body.data || {}
  const name = s(d.Name).trim()
  if (!name) {
    return { success: false, message: 'Vui lòng nhập tên chuyên mục' }
  }

  const entries = await readSheetEntries('blog_categories')
  const target = d.ID ? entries.find((e) => s(e.row.ID) === s(d.ID)) : null
  const otherSlugs = entries
    .filter((e) => !target || e.key !== target.key)
    .map((e) => e.row?.Slug)

  const requestedSlug = s(d.Slug).trim() || name
  const uniqueSlug = genUniqueSlug(requestedSlug, otherSlugs, 'chuyen-muc')
  const now = Date.now()

  const payload = sanitizeRow(
    normalizeBlogCategory({
      ID: s(d.ID || target?.row?.ID || `CAT-${genShortId().toUpperCase()}`),
      Name: name,
      Slug: uniqueSlug,
      Description: s(d.Description ?? target?.row?.Description).trim(),
      Order: d.Order !== undefined ? n(d.Order, 0) : n(target?.row?.Order, entries.length),
      Updated_at: now,
    }),
  )

  if (target) {
    const updates = {
      [`blog_categories/${target.key}`]: payload,
    }
    // Cascade renamed category to posts referencing it
    const oldId = s(target.row.ID)
    const oldSlug = s(target.row.Slug)
    const postEntries = await readSheetEntries('blog_posts')
    for (const p of postEntries) {
      if (
        (oldId && s(p.row.Category_ID) === oldId) ||
        (oldSlug && s(p.row.Category_Slug) === oldSlug)
      ) {
        updates[`blog_posts/${p.key}/Category_ID`] = payload.ID
        updates[`blog_posts/${p.key}/Category_Name`] = payload.Name
        updates[`blog_posts/${p.key}/Category_Slug`] = payload.Slug
      }
    }
    await update(dbRef(db), updates)
    return { success: true, type: 'update', data: payload }
  }

  await set(dbRef(db, `blog_categories/${createRowKey()}`), payload)
  return { success: true, type: 'insert', data: payload }
}

async function deleteBlogCategory(body) {
  const targetId = s(body?.ID).trim()
  if (!targetId) return { success: false, message: 'Thiếu ID chuyên mục' }
  const entries = await readSheetEntries('blog_categories')
  const target = entries.find((e) => s(e.row.ID) === targetId)
  if (!target) return { success: false, message: 'Không tìm thấy chuyên mục' }

  const updates = {
    [`blog_categories/${target.key}`]: null,
  }
  const postEntries = await readSheetEntries('blog_posts')
  for (const p of postEntries) {
    if (s(p.row.Category_ID) === targetId || (target.row.Slug && s(p.row.Category_Slug) === s(target.row.Slug))) {
      updates[`blog_posts/${p.key}/Category_ID`] = ''
      updates[`blog_posts/${p.key}/Category_Name`] = ''
      updates[`blog_posts/${p.key}/Category_Slug`] = ''
    }
  }
  await update(dbRef(db), updates)
  return { success: true }
}

async function upsertBlogPost(body) {
  const d = body.data || {}
  const title = s(d.Title).trim()
  if (!title) {
    return { success: false, message: 'Vui lòng nhập tiêu đề bài viết' }
  }

  const [postEntries, catEntries] = await Promise.all([
    readSheetEntries('blog_posts'),
    readSheetEntries('blog_categories'),
  ])

  const target = d.ID ? postEntries.find((e) => s(e.row.ID) === s(d.ID)) : null
  const otherSlugs = postEntries
    .filter((e) => !target || e.key !== target.key)
    .map((e) => e.row?.Slug)

  const uniqueSlug = genUniqueSlug(s(d.Slug).trim() || title, otherSlugs, 'bai-viet')

  // Resolve category metadata cleanly
  let categoryId = s(d.Category_ID ?? target?.row?.Category_ID).trim()
  let categoryName = s(d.Category_Name ?? target?.row?.Category_Name).trim()
  let categorySlug = s(d.Category_Slug ?? target?.row?.Category_Slug).trim()
  if (categoryId) {
    const matchedCat = catEntries.find((e) => s(e.row.ID) === categoryId)
    if (matchedCat) {
      categoryName = s(matchedCat.row.Name).trim()
      categorySlug = s(matchedCat.row.Slug).trim()
    }
  } else if (categoryName) {
    const matchedByName = catEntries.find(
      (e) => s(e.row.Name).trim().toLowerCase() === categoryName.toLowerCase(),
    )
    if (matchedByName) {
      categoryId = s(matchedByName.row.ID)
      categoryName = s(matchedByName.row.Name).trim()
      categorySlug = s(matchedByName.row.Slug).trim()
    } else {
      categorySlug = slugifyVi(categorySlug || categoryName)
    }
  } else {
    categorySlug = ''
  }

  const now = Date.now()
  const existingRow = target?.row || {}
  const nextStatus = s(d.Status || existingRow.Status || 'draft').trim().toLowerCase()
  const cleanHtml = sanitizeBlogHtml(d.Content_HTML ?? existingRow.Content_HTML ?? '')
  const createdAt = n(d.Created_at || existingRow.Created_at, now) || now
  const publishedAt =
    d.Published_at !== undefined && n(d.Published_at, 0) > 0
      ? n(d.Published_at)
      : nextStatus === 'published'
        ? n(existingRow.Published_at, now) || now
        : n(existingRow.Published_at, 0)

  const draftForNormalize = {
    ...existingRow,
    ...d,
    ID: s(d.ID || existingRow.ID || `POST-${genShortId().toUpperCase()}`),
    Title: title,
    Slug: uniqueSlug,
    Category_ID: categoryId,
    Category_Name: categoryName,
    Category_Slug: categorySlug,
    Tags: parseTags(d.Tags !== undefined ? d.Tags : existingRow.Tags).join(', '),
    Content_HTML: cleanHtml,
    Status: nextStatus,
    Created_at: createdAt,
    Updated_at: now,
    Published_at: publishedAt,
  }

  const normalized = normalizeBlogPost(draftForNormalize)
  const seoReport = analyzePostSeo(normalized)

  const rowPayload = sanitizeRow({
    ID: normalized.ID,
    Title: normalized.Title,
    Slug: normalized.Slug,
    Category_ID: normalized.Category_ID,
    Category_Name: normalized.Category_Name,
    Category_Slug: normalized.Category_Slug,
    Tags: normalized.Tags,
    Excerpt: normalized.Excerpt,
    Content_HTML: normalized.Content_HTML,
    Featured_Image: normalized.Featured_Image,
    Featured_Alt: normalized.Featured_Alt,
    Status: normalized.Status,
    Author: normalized.Author,
    Focus_Keyword: normalized.Focus_Keyword,
    SEO_Title: normalized.SEO_Title,
    SEO_Description: normalized.SEO_Description,
    Canonical_URL: normalized.Canonical_URL,
    Robots: normalized.Robots,
    TOC_Enabled: normalized.TOC_Enabled,
    TOC_Max_Level: normalized.TOC_Max_Level,
    TOC_Default_Open: normalized.TOC_Default_Open,
    TOC_Title: normalized.TOC_Title,
    SEO_Score: seoReport.score,
    Created_at: normalized.Created_at,
    Updated_at: normalized.Updated_at,
    Published_at: normalized.Published_at,
  })

  if (target) {
    await set(dbRef(db, `blog_posts/${target.key}`), rowPayload)
    return { success: true, type: 'update', data: rowPayload }
  }

  await set(dbRef(db, `blog_posts/${createRowKey()}`), rowPayload)
  return { success: true, type: 'insert', data: rowPayload }
}

async function deleteBlogPost(body) {
  return deleteById('blog_posts', body.ID)
}

/* =========================================================
 * UNIFIED ACTION DISPATCHER
 * ========================================================= */
const ACTION_HANDLERS = {
  hoanThanhDon: handleHoanThanhDon,
  hoanThanhTrangThaiDon,
  huyDonHang,
  submitCustomerOrder,
  adminSyncOrderItems,
  duyetDonHang,
  shipDonHang,
  upsertLogo,
  upsertOpenTime: (b) => upsertOpenTime(b.data),
  addChiPhiPhatSinh,
  updateChiPhiPhatSinh,
  deleteChiPhiPhatSinh,
  nhapHangHoa,
  chongTrungMaHang: () => chongTrungMaHang(),
  updateHangHoa: (b) => updateHangHoa(b.data),
  reorderHangHoa,
  saveDisplayConfig,
  bulkUpdateHangHoa,
  bulkDeleteHangHoa,
  deleteHangHoa,
  updateKhachHang,
  deleteKhachHang,
  login: (b) => loginWithFirebase(b.username, b.password),
  logout: () => logoutFirebase(),
  checkExpired: (b) => checkUserExpired(b.username),

  // CMS
  addThongBao,
  updateThongBao,
  deleteThongBao,
  addBanner,
  updateBanner,
  reorderBanners,
  deleteBanner,
  addLogo,
  updateLogo,
  deleteLogo,
  addKhuyenMai,
  updateKhuyenMai,
  deleteKhuyenMai,
  addShopContact,
  updateShopContact,
  deleteShopContact,
  addPartner,
  updatePartner,
  reorderPartners,
  deletePartner,
  addFeedPost,
  updateFeedPost,
  deleteFeedPost,
  addTimeShop,
  updateTimeShop,
  deleteTimeShop,
  addThongTinChuyenKhoan,
  updateThongTinChuyenKhoan,
  deleteThongTinChuyenKhoan,
  upsertBlogPost,
  deleteBlogPost,
  upsertBlogCategory,
  deleteBlogCategory,
}

export async function saveDiscountSettlementPeriod(payload = {}) {
  const rawId = s(payload.id).trim() || `CK_${Date.now()}_${genShortId()}`
  const nodeKey = safeFirebaseKey(rawId)
  const now = Date.now()

  const record = sanitizeRow({
    id: rawId,
    sheetName: s(payload.sheetName).trim() || 'Doi_soat',
    fromDate: s(payload.fromDate).trim(),
    toDate: s(payload.toDate).trim(),
    exchangeRate: n(payload.exchangeRate, 425),
    groupMode: s(payload.groupMode).trim() === 'by_member' ? 'by_member' : 'grouped',
    tienThuHoMode: s(payload.tienThuHoMode).trim() || 'sell_minus_cost',
    excelLayoutMode: s(payload.excelLayoutMode).trim() || 'row_formula',
    rows: Array.isArray(payload.rows) ? payload.rows : [],
    summary: payload.summary && typeof payload.summary === 'object' ? payload.summary : {},
    createdAt: n(payload.createdAt, now),
    updatedAt: now,
  })

  await set(dbRef(db, `chiet_khau_doi_soat/${nodeKey}`), record)
  return { success: true, id: rawId, data: record }
}

export async function deleteDiscountSettlementPeriod(periodId) {
  const cleanId = s(periodId).trim()
  if (!cleanId) return { success: false, message: 'Thiếu ID kỳ đối soát' }
  const nodeKey = safeFirebaseKey(cleanId)
  await remove(dbRef(db, `chiet_khau_doi_soat/${nodeKey}`))
  return { success: true, id: cleanId }
}

export async function dispatchAction(body = {}) {
  const action = body?.action
  const handler = ACTION_HANDLERS[action]
  if (!handler) {
    return { success: false, message: `Invalid action: ${action}` }
  }
  return handler(body)
}

export async function fetchAPI(action = 'all', params = {}) {
  if (action === 'all') return getAllSheets()
  if (action === 'sheet') return getOneSheet(params.sheet)
  if (action === 'find') return findByKey(params.sheet, params.key, params.value)
  return { success: false, message: `Invalid GET action: ${action}` }
}

export async function postAPI(data) {
  return dispatchAction(data)
}
