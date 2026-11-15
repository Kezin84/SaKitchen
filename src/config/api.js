// src/config/api.js
import { ref as dbRef, get, set, update, remove, onValue } from 'firebase/database'
import { signInWithEmailAndPassword, signOut } from 'firebase/auth'
import { db, auth } from './firebase'
import {
  DATA_LANG_CODES,
  normalizeProductI18n,
  syncProductWithI18n,
  normalizeNoticeI18n,
  syncNoticeWithI18n,
  resolveNoticeText,
} from '../utils/i18nData'

export const IMGBB_KEY = 'b202a4bdc79bf1dc72f6f6ded6b74501'

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
  'time',
  'thong_tin_chuyen_khoan',
  'Login',
]

export const DATA_SHEETS = SHEETS.filter(
  (sName) => sName !== 'Login' && sName !== 'live_orders',
)

export const STOREFRONT_SHEETS = [
  'hang_hoa',
  'banner',
  'thong_bao',
  'logo',
  'shop_contact',
  'khuyenmai_info',
  'time',
  'thong_tin_chuyen_khoan',
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
      const snap = await get(dbRef(db, name))
      return [name, snap.exists() ? normalizeSheet(snap.val()) : []]
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
 * AUTHENTICATION & EXPIRATION CHECK
 * ========================================================= */
function toAuthEmail(username) {
  const clean = s(username).trim()
  return clean.includes('@') ? clean : `${clean}@sakitchen.local`
}

export async function loginWithFirebase(username, password) {
  const uInput = s(username).trim()
  const pInput = s(password).trim()

  if (!uInput || !pInput) {
    return { success: false, message: 'Thiếu username hoặc password' }
  }

  let firebaseAuthMatched = false
  try {
    await signInWithEmailAndPassword(auth, toAuthEmail(uInput), pInput)
    firebaseAuthMatched = true
  } catch {
    // Ignore when Firebase Auth is not configured or user is managed in RTDB Login sheet
  }

  try {
    const entries = await readSheetEntries('Login')
    for (const { row } of entries) {
      const u = s(row.USERNAME).trim()
      const p = s(row.PASSWORD).trim()
      const expired = s(row.Expired).trim().toLowerCase()

      if (u === uInput && (p === pInput || firebaseAuthMatched)) {
        if (expired === 'yes') {
          return {
            success: false,
            code: 'EXPIRED',
            message: 'Gói dịch vụ của bạn đã hết hạn. Vui lòng gia hạn để tiếp tục sử dụng.',
          }
        }
        return {
          success: true,
          user: { username: u },
        }
      }
    }

    if (firebaseAuthMatched) {
      return {
        success: true,
        user: { username: uInput },
      }
    }

    return { success: false, message: 'Sai tài khoản hoặc mật khẩu' }
  } catch (err) {
    console.error('[Firebase] Login error:', err)
    if (firebaseAuthMatched) {
      return { success: true, user: { username: uInput } }
    }
    throw err
  }
}

export async function checkUserExpired(username) {
  const uInput = s(username).trim()
  if (!uInput) return { success: true, expired: true }

  try {
    const entries = await readSheetEntries('Login')
    if (!entries.length) {
      if (auth.currentUser) return { success: true, expired: false }
      return { success: true, expired: true }
    }

    for (const { row } of entries) {
      const u = s(row.USERNAME).trim()
      const expired = s(row.Expired).trim().toLowerCase()
      if (u === uInput) {
        return { success: true, expired: expired === 'yes' }
      }
    }
    return { success: true, expired: true }
  } catch (err) {
    console.warn('[Firebase] checkUserExpired warning:', err)
    return { success: false, expired: false }
  }
}

export async function logoutFirebase() {
  try {
    await signOut(auth)
  } catch {
    // Ignore if Auth not active
  }
  return { success: true }
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
      Tien_chiet_khau: n(i.Tien_chiet_khau),
      Thanh_tien: n(i.Thanh_tien),
      Loi_nhuan: n(i.Loi_nhuan),
      Ghi_chu: s(i.Ghi_chu),
      Nguoi_dat: s(i.Nguoi_dat),
      Nguoi_dat_id: s(i.Nguoi_dat_id),
      Added_by_role: s(i.Added_by_role),
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
          Danh_muc: s(i.Danh_muc),
          Size: s(i.Size),
          Dvt: s(i.Dvt),
          Gia_goc: n(i.Gia_goc),
          Gia_ban: n(i.Gia_ban),
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
    Ghi_chu: s(hoa_don.Ghi_chu_don_hang),
    Hinh_thuc_thanh_toan: s(hoa_don.Hinh_thuc_thanh_toan),
    Trang_thai: targetOrderStatus,
    Ten_khach_hang: s(hoa_don.Ten_khach_hang),
    Don_vi_tien_te: s(donViTienTe),
  })

  // 8. Sync live_orders so online customer tracker sees updated total/items/info
  if (liveParsed && orderKey) {
    const hhMap = new Map(hangHoaEntries.map((e) => [s(e.row.Ma_hang).trim(), e.row]))
    const syncedItemsObj = {}
    let idx = 0
    for (const rawIt of items) {
      idx++
      const lineId =
        s(rawIt.lineId).trim() ||
        makeLineId(
          rawIt.Ma_hang || rawIt.Ten_hang || `item_${idx}`,
          rawIt.Nguoi_dat_id || rawIt.Nguoi_dat || `pos_${idx}`,
        )
      const resolved = resolveCanonicalViItem({ ...rawIt, lineId }, hhMap)
      if (resolved.So_luong <= 0) continue
      const k = safeFirebaseKey(resolved.lineId)
      resolved.lineId = k
      syncedItemsObj[k] = sanitizeRow({
        ...resolved,
        Giam_gia: n(rawIt.Giam_gia),
        Tien_chiet_khau: n(rawIt.Tien_chiet_khau),
        Thanh_tien: n(rawIt.Thanh_tien) || n(resolved.Gia_ban) * n(resolved.So_luong),
      })
    }
    if (targetOrderStatus === 'Hoàn thành') {
      updates[`live_orders/${orderKey}`] = {
        meta: sanitizeRow({
          ...liveParsed.meta,
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
          Tong_cong: 0,
          Closed_at: Date.now(),
          Updated_at: Date.now(),
        }),
        items: null,
      }
    } else {
      updates[`live_orders/${orderKey}`] = {
        meta: sanitizeRow({
          ...liveParsed.meta,
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
          Tong_cong: n(hoa_don.Tong_cong),
          Approved_at:
            targetOrderStatus !== 'Chờ duyệt'
              ? liveParsed.meta?.Approved_at || Date.now()
              : liveParsed.meta?.Approved_at,
          Shipped_at:
            targetOrderStatus === 'Đang ship'
              ? liveParsed.meta?.Shipped_at || Date.now()
              : liveParsed.meta?.Shipped_at,
          Updated_at: Date.now(),
        }),
        items: syncedItemsObj,
        members: liveParsed.rawMembers || {},
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

  const dvtVi =
    hhI18n?.vi?.Dvt ||
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

  return {
    lineId: s(item?.lineId).trim() || makeLineId(maHang || tenVi, item?.Nguoi_dat_id || 'host'),
    Ma_hang: maHang,
    Ten_hang: tenVi,
    Danh_muc: danhMucVi,
    Dvt: dvtVi,
    Size: s(item?.Size || hh?.Size),
    Main_img: s(item?.Main_img || hh?.Main_img),
    Don_vi_tien_te: donViTienTe,
    Gia_goc: giaGoc,
    Gia_ban: giaBan,
    Gia_ban_goc: n(item?.Gia_ban_goc || defaultSellPrice || giaBan),
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

export function normalizeLiveOrderSnapshot(orderId, raw) {
  const cleanId = s(orderId).trim()
  if (!raw || typeof raw !== 'object') {
    return {
      exists: false,
      orderId: cleanId,
      meta: null,
      itemsMap: {},
      itemsList: [],
      rawMembers: {},
      membersMap: {},
      membersList: [],
      kickedMap: {},
    }
  }

  const meta = raw.meta && typeof raw.meta === 'object' ? { ...raw.meta } : {}
  const rawItems = raw.items && typeof raw.items === 'object' ? raw.items : {}
  const rawMembers = raw.members && typeof raw.members === 'object' ? { ...raw.members } : {}
  const kickedMap = raw.kicked && typeof raw.kicked === 'object' ? { ...raw.kicked } : {}
  const itemsMap = {}
  const itemsList = []
  const membersMap = {}
  const membersList = []

  for (const [k, v] of Object.entries(rawItems)) {
    if (!v || typeof v !== 'object') continue
    const qty = n(v.So_luong, 0)
    if (qty <= 0) continue
    const price = n(v.Gia_ban, 0)
    const normalized = {
      ...v,
      lineId: s(v.lineId || k),
      So_luong: qty,
      Gia_ban: price,
      Thanh_tien: price * qty,
      Ghi_chu: s(v.Ghi_chu),
      Nguoi_dat: s(v.Nguoi_dat),
      Nguoi_dat_id: s(v.Nguoi_dat_id),
    }
    itemsMap[k] = normalized
    itemsList.push(normalized)
  }

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

  itemsList.sort((a, b) => n(a.Added_at, 0) - n(b.Added_at, 0))

  return {
    exists: true,
    orderId: cleanId,
    meta,
    itemsMap,
    itemsList,
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

function mergeNoteWithPromoTag(rawNote, promoSummary) {
  const cleanBase = stripAutoPromoTagText(rawNote)
  const cleanPromo = s(promoSummary).trim()
  if (!cleanPromo) return cleanBase
  const tag = `[KM ĐẠT ĐƯỢC: ${cleanPromo}]`
  return cleanBase ? `${cleanBase} ${tag}` : tag
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

async function syncSubmittedLiveOrderToDonHang(orderKey, orderId) {
  const snap = await get(dbRef(db, `live_orders/${orderKey}`))
  if (!snap.exists()) return
  const parsed = normalizeLiveOrderSnapshot(orderId, snap.val())
  const meta = parsed.meta || {}
  const status = s(meta.Trang_thai).trim()
  const tongCong = parsed.itemsList.reduce((acc, it) => acc + n(it.Gia_ban) * n(it.So_luong), 0)
  const donViTienTe =
    s(parsed.itemsList[0]?.Don_vi_tien_te || meta.Don_vi_tien_te || 'P').trim() || 'P'

  const updates = {
    [`live_orders/${orderKey}/meta/Tong_cong`]: tongCong,
    [`live_orders/${orderKey}/meta/Don_vi_tien_te`]: donViTienTe,
    [`live_orders/${orderKey}/meta/Updated_at`]: Date.now(),
  }

  if (status === 'Chờ duyệt' || status === 'Đang xử lý') {
    const [dhEntries, kmEntries] = await Promise.all([
      readSheetEntries('don_hang'),
      status === 'Chờ duyệt' ? readSheetEntries('khuyenmai_info') : Promise.resolve([]),
    ])

    let syncedNote = meta.Ghi_chu !== undefined ? s(meta.Ghi_chu) : undefined
    let earnedPromoVi = s(meta.Khuyen_mai_dat_duoc)

    if (status === 'Chờ duyệt') {
      earnedPromoVi = computeEarnedMilestonesViSummary(tongCong, kmEntries)
      syncedNote = mergeNoteWithPromoTag(meta.Ghi_chu, earnedPromoVi)
      updates[`live_orders/${orderKey}/meta/Khuyen_mai_dat_duoc`] = earnedPromoVi
      updates[`live_orders/${orderKey}/meta/Ghi_chu`] = syncedNote
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
  await syncSubmittedLiveOrderToDonHang(orderKey, cleanOrderId)
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
    await syncSubmittedLiveOrderToDonHang(orderKey, cleanOrderId)
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

  await update(dbRef(db), writeUpdates)
  await syncSubmittedLiveOrderToDonHang(orderKey, cleanOrderId)
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
  await syncSubmittedLiveOrderToDonHang(orderKey, cleanOrderId)
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
  await syncSubmittedLiveOrderToDonHang(orderKey, cleanOrderId)
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
  const nowStr = existingParsed?.meta?.Ngay_tao_duong_lich || formatVNDateTime()
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
  const rawGhiChu = s(metaIn.Ghi_chu ?? existingParsed?.meta?.Ghi_chu).trim()
  const ghiChu = mergeNoteWithPromoTag(rawGhiChu, earnedPromoVi)
  const maKH = genAutoMaKhachHang(tenKhach, sdt, diaChi)

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
    Tong_cong: tongCong,
    Host_id: s(body.hostId || existingParsed?.meta?.Host_id),
    Host_name: s(body.hostName || existingParsed?.meta?.Host_name || tenKhach),
    Created_at: n(existingParsed?.meta?.Created_at, Date.now()),
    Submitted_at: Date.now(),
    Updated_at: Date.now(),
  })

  const dhTarget = dhEntries.find((e) => s(e.row.Ma_hoa_don).trim() === cleanOrderId)
  const dhKey = dhTarget ? dhTarget.key : createRowKey()
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
  })

  const preservedMembers = { ...(existingParsed?.rawMembers || {}) }
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
      items: itemsObj,
      members: preservedMembers,
    },
    [`don_hang/${dhKey}`]: dhRow,
  }

  await update(dbRef(db), updates)
  return {
    success: true,
    orderId: cleanOrderId,
    status: 'Chờ duyệt',
    Tong_cong: tongCong,
  }
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
  const tongLoiNhuan = tongCong - tongGiaGoc
  const currency =
    s(
      resolvedList[0]?.Don_vi_tien_te ||
        dhTarget?.row?.Don_vi_tien_te ||
        liveParsed?.meta?.Don_vi_tien_te ||
        'P',
    ).trim() || 'P'

  const updates = {}

  // 1. Sync live_orders so Customer's cart updates in realtime
  if (liveParsed || curStatus === 'Chờ duyệt') {
    updates[`live_orders/${orderKey}`] = {
      meta: sanitizeRow({
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
        Tong_cong: tongCong,
        Updated_at: Date.now(),
      }),
      items: itemsObj,
      members: liveParsed?.rawMembers || {},
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
        Thanh_tien: n(it.Thanh_tien),
        Loi_nhuan: (n(it.Gia_ban) - n(it.Gia_goc)) * n(it.So_luong),
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

  const rawItems = ctItems.length ? ctItems : liveParsed?.itemsList || []
  const resolvedItems = rawItems.map((raw) => {
    const resolved = resolveCanonicalViItem(raw, hhMap)
    const giaGoc = n(raw.Gia_goc !== undefined ? raw.Gia_goc : resolved.Gia_goc)
    const giaBan = n(raw.Gia_ban !== undefined ? raw.Gia_ban : resolved.Gia_ban)
    const qty = Math.max(1, n(raw.So_luong))
    const giamGia = n(raw.Giam_gia)
    const ck = n(raw.Chiet_khau || 0)
    const thanhTien = n(raw.Thanh_tien) || giaBan * qty
    const tienCK = n(raw.Tien_chiet_khau)
    const loiNhuan =
      raw.Loi_nhuan !== undefined ? n(raw.Loi_nhuan) : (giaBan - giaGoc) * qty - tienCK
    return {
      ...resolved,
      Gia_goc: giaGoc,
      Gia_ban: giaBan,
      So_luong: qty,
      Giam_gia: giamGia,
      Chiet_khau: ck,
      Tien_chiet_khau: tienCK,
      Thanh_tien: thanhTien,
      Loi_nhuan: loiNhuan,
    }
  })

  const meta = {
    Ma_hoa_don: maHoaDon,
    So_hoa_don: s(hdRow?.So_hoa_don || dhRow?.So_hoa_don || liveParsed?.meta?.So_hoa_don),
    Ma_khach_hang: s(
      hdRow?.Ma_khach_hang || dhRow?.Ma_khach_hang || liveParsed?.meta?.Ma_khach_hang,
    ),
    Ten_khach_hang: s(
      dhRow?.Ten_khach_hang || hdRow?.Ten_khach_hang || liveParsed?.meta?.Ten_khach_hang,
    ),
    So_dien_thoai: s(dhRow?.So_dien_thoai || liveParsed?.meta?.So_dien_thoai),
    Dia_chi: s(dhRow?.Dia_chi || liveParsed?.meta?.Dia_chi),
    Thoi_gian_nhan_hang: s(
      dhRow?.Thoi_gian_nhan_hang || hdRow?.Thoi_gian_nhan_hang || liveParsed?.meta?.Thoi_gian_nhan_hang,
    ),
    Hinh_thuc_thanh_toan: s(
      dhRow?.Hinh_thuc_thanh_toan ||
        hdRow?.Hinh_thuc_thanh_toan ||
        liveParsed?.meta?.Hinh_thuc_thanh_toan ||
        'TIEN_MAT',
    ),
    Ghi_chu: s(dhRow?.Ghi_chu || liveParsed?.meta?.Ghi_chu),
    Trang_thai: s(dhRow?.Trang_thai || liveParsed?.meta?.Trang_thai || 'Chờ duyệt'),
    Don_vi_tien_te: s(
      dhRow?.Don_vi_tien_te ||
        liveParsed?.meta?.Don_vi_tien_te ||
        resolvedItems[0]?.Don_vi_tien_te ||
        'P',
    ),
    Tong_giam_gia: n(hdRow?.Tong_giam_gia),
    Tong_tien_chiet_khau: n(hdRow?.Tong_tien_chiet_khau),
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
  const tongLoiNhuan = tongCong - tongGiaGoc
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
      Thanh_tien: n(it.Thanh_tien),
      Loi_nhuan: (n(it.Gia_ban) - n(it.Gia_goc)) * n(it.So_luong),
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
    const approved = await duyetDonHang({ Ma_hoa_don: maHoaDon })
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
    await duyetDonHang({ Ma_hoa_don: maHoaDon })
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
    updates[`live_orders/${orderKey}`] = {
      meta: sanitizeRow({
        ...(curVal.meta || {}),
        Ma_hoa_don: maHoaDon,
        Trang_thai: 'Hoàn thành',
        Tong_cong: 0,
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
    updates[`live_orders/${orderKey}`] = {
      meta: sanitizeRow({
        ...(curVal.meta || {}),
        Ma_hoa_don: maHoaDon,
        Trang_thai: 'Đã hủy',
        Tong_cong: 0,
        Closed_at: Date.now(),
        Updated_at: Date.now(),
      }),
      items: null,
    }
  }

  if (Object.keys(updates).length > 0) {
    await update(dbRef(db), updates)
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
    if (!item.Ma_hang) {
      skipped++
      continue
    }

    const existing = entries.find((e) => s(e.row.Ma_hang) === s(item.Ma_hang))

    if (existing) {
      const mergedI18n = mergeProductI18n(existing.row, item)
      existing.row.i18n = mergedI18n
      existing.row.Ten_hang = mergedI18n.vi.Ten_hang || s(existing.row.Ten_hang)
      existing.row.Danh_muc = mergedI18n.vi.Danh_muc || s(existing.row.Danh_muc)
      existing.row.Dvt = mergedI18n.vi.Dvt || s(existing.row.Dvt)
      existing.row.Mo_ta = mergedI18n.vi.Mo_ta || s(existing.row.Mo_ta)

      const fieldsToUpdate = {
        Main_img: item.Main_img,
        Size: item.Size,
        Gia_goc: item.Gia_goc !== undefined && item.Gia_goc !== '' ? n(item.Gia_goc) : undefined,
        Gia_ban: item.Gia_ban !== undefined && item.Gia_ban !== '' ? n(item.Gia_ban) : undefined,
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
    const finalMaHang = genUniqueMaHang(s(item.Ma_hang), existingMaList)
    const trangThaiMoi = s(item.Trang_thai) === 'Hết hàng' ? 'Hết hàng' : 'Còn hàng'

    const newKey = createRowKey()
    const newRow = syncProductWithI18n({
      Ma_hang: finalMaHang,
      Ten_hang: s(item.Ten_hang),
      Main_img: s(item.Main_img),
      Mo_ta: s(item.Mo_ta),
      Danh_muc: s(item.Danh_muc),
      Size: s(item.Size),
      Dvt: s(item.Dvt),
      Gia_goc: n(item.Gia_goc),
      Gia_ban: n(item.Gia_ban),
      Trang_thai: trangThaiMoi,
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
      Danh_muc_en: item.Danh_muc_en,
      Dvt_en: item.Dvt_en,
      Mo_ta_en: item.Mo_ta_en,
      'Ten_hang_zh-CN': item['Ten_hang_zh-CN'] || item.Ten_hang_zh,
      'Danh_muc_zh-CN': item['Danh_muc_zh-CN'] || item.Danh_muc_zh,
      'Dvt_zh-CN': item['Dvt_zh-CN'] || item.Dvt_zh,
      'Mo_ta_zh-CN': item['Mo_ta_zh-CN'] || item.Mo_ta_zh,
      Ten_hang_fil: item.Ten_hang_fil,
      Danh_muc_fil: item.Danh_muc_fil,
      Dvt_fil: item.Dvt_fil,
      Mo_ta_fil: item.Mo_ta_fil,
      Ten_hang_ko: item.Ten_hang_ko,
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
    } else if (k === 'Gia_Giam') {
      target.row[k] = v === '' || v === null ? '' : n(v)
    } else {
      target.row[k] = s(v)
    }
  }

  if (item.i18n && typeof item.i18n === 'object') {
    const nextI18n = normalizeProductI18n(item)
    target.row.i18n = nextI18n
    target.row.Ten_hang = nextI18n.vi.Ten_hang || s(target.row.Ten_hang)
    target.row.Danh_muc = nextI18n.vi.Danh_muc || ''
    target.row.Dvt = nextI18n.vi.Dvt || ''
    target.row.Mo_ta = nextI18n.vi.Mo_ta || ''
  } else {
    // Keep i18n.vi in sync when top-level text fields are edited directly (e.g. bulk edit)
    for (const f of ['Ten_hang', 'Danh_muc', 'Dvt', 'Mo_ta']) {
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

// --- thong_bao (with multi-language i18n) ---
async function addThongBao(body) {
  const d = body.data || {}
  const synced = syncNoticeWithI18n({
    ID: s(d.ID || genShortId()),
    Noi_dung: s(d.Noi_dung),
    URL: s(d.URL),
    is_Important: s(d.is_Important),
    i18n: d.i18n,
  })
  await set(dbRef(db, `thong_bao/${createRowKey()}`), sanitizeRow(synced))
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

  target.row = syncNoticeWithI18n({
    ID: s(d.ID),
    Noi_dung: baseI18n.vi.Noi_dung || s(d.Noi_dung),
    URL: d.URL !== undefined ? s(d.URL) : s(target.row.URL),
    is_Important: d.is_Important !== undefined ? s(d.is_Important) : s(target.row.is_Important),
    i18n: baseI18n,
  })
  await set(dbRef(db, `thong_bao/${target.key}`), sanitizeRow(target.row))
  return { success: true }
}

async function deleteThongBao(body) {
  return deleteById('thong_bao', body.ID)
}

// --- banner ---
async function addBanner(body) {
  const d = body.data || {}
  await set(
    dbRef(db, `banner/${createRowKey()}`),
    sanitizeRow({
      ID: s(d.ID || genShortId()),
      URL: s(d.URL),
      is_Important: s(d.is_Important),
    }),
  )
  return { success: true }
}

async function updateBanner(body) {
  const d = body.data || {}
  if (!d.ID) return { success: false }
  const entries = await readSheetEntries('banner')
  const target = entries.find((e) => s(e.row.ID) === s(d.ID))
  if (!target) return { success: false }

  target.row = {
    ID: s(d.ID),
    URL: s(d.URL),
    is_Important: s(d.is_Important),
  }
  await set(dbRef(db, `banner/${target.key}`), sanitizeRow(target.row))
  return { success: true }
}

async function deleteBanner(body) {
  return deleteById('banner', body.ID)
}

// --- logo ---
async function addLogo(body) {
  const d = body.data || {}
  await set(
    dbRef(db, `logo/${createRowKey()}`),
    sanitizeRow({
      ID: s(d.ID || genShortId()),
      URL: s(d.URL),
      Name: s(d.Name),
    }),
  )
  return { success: true }
}

async function updateLogo(body) {
  const d = body.data || {}
  if (!d.ID) return { success: false }
  const entries = await readSheetEntries('logo')
  const target = entries.find((e) => s(e.row.ID) === s(d.ID))
  if (!target) return { success: false }

  target.row = {
    ID: s(d.ID),
    URL: s(d.URL),
    Name: s(d.Name),
  }
  await set(dbRef(db, `logo/${target.key}`), sanitizeRow(target.row))
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

  const rowPayload = sanitizeRow({
    ID: s(d.ID || target?.row?.ID || genShortId()),
    URL: s(d.URL),
    Name: s(d.Name),
  })

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
async function addThongTinChuyenKhoan(body) {
  const d = body.data || {}
  await set(
    dbRef(db, `thong_tin_chuyen_khoan/${createRowKey()}`),
    sanitizeRow({
      ID: s(d.ID || genShortId()),
      Tieu_de: s(d.Tieu_de),
      ThongTin: s(d.ThongTin),
      QR_IMG: s(d.QR_IMG),
      Ti_gia: n(d.Ti_gia, 1),
      Don_vi_tien_te: s(d.Don_vi_tien_te || 'VND'),
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

  target.row = {
    ID: s(d.ID),
    Tieu_de: s(d.Tieu_de),
    ThongTin: s(d.ThongTin),
    QR_IMG: s(d.QR_IMG),
    Ti_gia: n(d.Ti_gia, 1),
    Don_vi_tien_te: s(d.Don_vi_tien_te || 'VND'),
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
  addTimeShop,
  updateTimeShop,
  deleteTimeShop,
  addThongTinChuyenKhoan,
  updateThongTinChuyenKhoan,
  deleteThongTinChuyenKhoan,
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
