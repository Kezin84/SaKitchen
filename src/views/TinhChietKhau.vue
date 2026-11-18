<script setup>
import { ref, computed, onMounted } from 'vue'
import * as XLSXRaw from 'xlsx-js-style'
import {
  getSheets,
  getOneSheet,
  saveDiscountSettlementPeriod,
  deleteDiscountSettlementPeriod,
} from '@/config/api'
import { normalizeNccDiscountType, getNccDiscountPerUnit } from '@/utils/nccDiscount'
import { buildOrderTextInvoice } from '@/utils/invoiceTextExport'

const XLSX = XLSXRaw?.utils ? XLSXRaw : XLSXRaw?.default || XLSXRaw

/* ================= STATE ================= */
const loading = ref(true)
const savingPeriod = ref(false)
const toastState = ref(null)
let toastTimer = null

const rawDonHang = ref([])
const rawHoaDonTongQuat = ref([])
const rawHoaDonChiTiet = ref([])
const rawHangHoa = ref([])
const rawKhuyenMai = ref([])
const rawChuyenKhoan = ref([])
const savedPeriods = ref([])

const activeSavedId = ref('')
const selectedSavedIdsForExport = ref([])

// Toolbar & Period Config
const fromDate = ref('')
const toDate = ref('')
const sheetName = ref('')
const exchangeRate = ref(425)
const groupMode = ref('grouped') // 'grouped' | 'by_member'
const tienThuHoMode = ref('sell_minus_cost') // 'sell_minus_cost' | 'cod_full' | 'zero'
const excelLayoutMode = ref('formatck') // 'formatck' | 'formatck_with_footer'

// Editable Settlement Rows
const rows = ref([])
const searchRowQuery = ref('')

// Expanded Content Editor Modal (helpful on narrow screens or long multiline text)
const editingContentRowId = ref('')
const editingContentDraft = ref('')

function showToast(type, text, duration = 2600) {
  toastState.value = { type, text }
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => {
    toastState.value = null
    toastTimer = null
  }, duration)
}

/* ================= DATE HELPERS ================= */
function pad2(v) {
  return String(v).padStart(2, '0')
}

function toInputYmd(date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`
}

function parseInputYmdToNum(ymd) {
  if (!ymd || typeof ymd !== 'string') return 0
  const m = ymd.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!m) return 0
  return Number(m[1]) * 10000 + Number(m[2]) * 100 + Number(m[3])
}

function parseVNDateString(rawStr) {
  const txt = String(rawStr || '').trim()
  if (!txt) return null

  let datePart = txt
  if (datePart.includes(' ')) {
    datePart = datePart.split(' ').pop().trim()
  }

  // Handle YYYY-MM-DD or YYYY-MM-DDTHH:mm
  const isoMatch = txt.match(/(\d{4})-(\d{1,2})-(\d{1,2})/)
  if (isoMatch) {
    const year = Number(isoMatch[1])
    const month = Number(isoMatch[2])
    const day = Number(isoMatch[3])
    if (year > 1900 && month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      let hh = 0
      let mm = 0
      const timeMatch = txt.match(/(\d{1,2}):(\d{2})/)
      if (timeMatch) {
        hh = Number(timeMatch[1])
        mm = Number(timeMatch[2])
      }
      return {
        day,
        month,
        year,
        ymdNum: year * 10000 + month * 100 + day,
        sortTs: new Date(year, month - 1, day, hh, mm, 0).getTime(),
        displayDate: `${day}/${month}/${year}`,
      }
    }
  }

  // Handle dd/MM/yyyy or d/m/yyyy
  const dmyMatch = datePart.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (dmyMatch) {
    const day = Number(dmyMatch[1])
    const month = Number(dmyMatch[2])
    const year = Number(dmyMatch[3])
    if (year > 1900 && month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      let hh = 0
      let mm = 0
      const timeMatch = txt.match(/(\d{1,2}):(\d{2})/)
      if (timeMatch) {
        hh = Number(timeMatch[1])
        mm = Number(timeMatch[2])
      }
      return {
        day,
        month,
        year,
        ymdNum: year * 10000 + month * 100 + day,
        sortTs: new Date(year, month - 1, day, hh, mm, 0).getTime(),
        displayDate: `${day}/${month}/${year}`,
      }
    }
  }

  return null
}

function buildDefaultSheetName(fromYmd, toYmd) {
  const f = fromYmd ? fromYmd.split('-') : []
  const t = toYmd ? toYmd.split('-') : []
  if (f.length === 3 && t.length === 3) {
    return `${f[2]}${f[1]}-${t[2]}${t[1]}`
  }
  const now = new Date()
  return `${pad2(now.getDate())}${pad2(now.getMonth() + 1)}`
}

function toExcelDateSerial(dmyStr) {
  const txt = String(dmyStr || '').trim()
  const m = txt.match(/^(\d{1,2})\/(\d{1,2})(?:\/(\d{4}))?$/)
  if (!m) return null
  const day = Number(m[1])
  const month = Number(m[2])
  const year = m[3] ? Number(m[3]) : new Date().getFullYear()
  if (!year || month < 1 || month > 12 || day < 1 || day > 31) return null
  const utc = Date.UTC(year, month - 1, day)
  const excelEpoch = Date.UTC(1899, 11, 30)
  return Math.round((utc - excelEpoch) / 86400000)
}

function round2(num) {
  const n = Number(num || 0)
  if (!Number.isFinite(n)) return 0
  return Math.round(n * 100) / 100
}

function toNum(v) {
  if (v === '' || v === null || v === undefined) return 0
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

function formatNum(v) {
  const n = Number(v || 0)
  if (!Number.isFinite(n)) return '0'
  return n.toLocaleString('vi-VN', { maximumFractionDigits: 2 })
}

/* ================= COMPUTE ROWS FROM ORDERS ================= */
const hangHoaByMaMap = computed(() => {
  const m = new Map()
  for (const h of rawHangHoa.value) {
    const code = String(h?.Ma_hang || '').trim()
    if (code) m.set(code, h)
  }
  return m
})

function computePromoSummaryText(tongCong) {
  const total = Number(tongCong || 0)
  if (!total || !rawKhuyenMai.value.length) return ''
  const labels = []
  for (const km of rawKhuyenMai.value) {
    const threshold = Number(km?.So_tien_dat_muc ?? km?.Moc_tien ?? 0)
    const label = String(km?.Ten_khuyen_mai || km?.Qua_tang || km?.Mo_ta || '').trim()
    if (threshold > 0 && total >= threshold && label) {
      labels.push(label)
    }
  }
  return [...new Set(labels)].join(' + ')
}

function computeTienThuHoDefault(row) {
  const sellNoShip = toNum(row.tongGiaBanKhongShip)
  const costRev = toNum(row.doanhThuGoc)
  if (tienThuHoMode.value === 'zero') return 0
  if (tienThuHoMode.value === 'cod_full') {
    const payUpper = String(row.hinhThucTT || '').trim().toUpperCase()
    return payUpper === 'COD' || payUpper === 'TIEN_MAT' ? round2(sellNoShip) : 0
  }
  return round2(sellNoShip - costRev)
}

function buildRowsFromOrders() {
  const fromNum = fromDate.value ? parseInputYmdToNum(fromDate.value) : 0
  const toNumLimit = toDate.value ? parseInputYmdToNum(toDate.value) : 99999999

  const hdMap = new Map()
  for (const hd of rawHoaDonTongQuat.value) {
    const ma = String(hd?.Ma_hoa_don || '').trim()
    if (ma) hdMap.set(ma, hd)
  }

  const ctMap = new Map()
  for (const ct of rawHoaDonChiTiet.value) {
    const ma = String(ct?.Ma_hoa_don || '').trim()
    if (!ma) continue
    if (!ctMap.has(ma)) ctMap.set(ma, [])
    ctMap.get(ma).push(ct)
  }

  const matched = []
  for (const dh of rawDonHang.value) {
    if (String(dh?.Trang_thai || '').trim() !== 'Hoàn thành') continue
    const parsedTime = parseVNDateString(dh?.Thoi_gian_nhan_hang)
    if (!parsedTime) continue
    if (fromNum && parsedTime.ymdNum < fromNum) continue
    if (toNumLimit && parsedTime.ymdNum > toNumLimit) continue
    matched.push({ dh, parsedTime })
  }

  matched.sort((a, b) => a.parsedTime.sortTs - b.parsedTime.sortTs)

  const hhMap = hangHoaByMaMap.value
  return matched.map(({ dh, parsedTime }, idx) => {
    const maHD = String(dh?.Ma_hoa_don || '').trim()
    const hd = hdMap.get(maHD) || null
    const ctItems = ctMap.get(maHD) || []

    // Tổng giá gốc của đơn hàng
    let doanhThuGoc = 0
    let chietKhauGoc = 0

    for (const ct of ctItems) {
      const qty = Math.max(0, Number(ct?.So_luong || 0))
      const maHang = String(ct?.Ma_hang || '').trim()
      const prod = maHang ? hhMap.get(maHang) : null
      const giaGoc =
        Number(ct?.Gia_goc || 0) > 0
          ? Number(ct.Gia_goc)
          : Number(prod?.Gia_goc || 0)
      doanhThuGoc += giaGoc * qty

      // Chiết khấu gốc: 2B - chỉ lấy CK NCC đã cài đặt trên chi tiết đơn/sản phẩm, KHÔNG fallback % mặc định
      const hasDetailNcc = ct?.Ncc_gia_tri_giam !== undefined && ct?.Ncc_gia_tri_giam !== ''
      const nccSource = hasDetailNcc
        ? ct
        : prod
          ? {
              Ncc_loai_giam: normalizeNccDiscountType(prod.Ncc_loai_giam),
              Ncc_gia_tri_giam: prod.Ncc_gia_tri_giam,
            }
          : null
      if (nccSource) {
        chietKhauGoc += getNccDiscountPerUnit(giaGoc, nccSource) * qty
      }
    }

    doanhThuGoc = round2(doanhThuGoc)
    chietKhauGoc = round2(chietKhauGoc)

    const tongGiaBanKhongShip = round2(Number(hd?.Tong_cong ?? dh?.Tong_gia_ban ?? 0))
    const rawPay = String(dh?.Hinh_thuc_thanh_toan || hd?.Hinh_thuc_thanh_toan || 'TIEN_MAT')
      .trim()
      .toUpperCase()
    const hinhThucTT = rawPay === 'CHUYEN_KHOAN' ? 'CK' : 'COD'
    const donViTienTe = String(dh?.Don_vi_tien_te || 'P').trim() || 'P'
    const promoText = String(dh?.Khuyen_mai_dat_duoc || '').trim() || computePromoSummaryText(tongGiaBanKhongShip)

    const commonTextArgs = {
      items: ctItems,
      tenKhachHang: String(dh?.Ten_khach_hang || hd?.Ten_khach_hang || '').trim(),
      diaChi: String(dh?.Dia_chi || '').trim(),
      soDienThoai: String(dh?.So_dien_thoai || '').trim(),
      thoiGianNhanHang: String(dh?.Thoi_gian_nhan_hang || dh?.Ngay_tao_duong_lich || '').trim(),
      hinhThucThanhToan: rawPay,
      tongCong: tongGiaBanKhongShip,
      phiShip: Number(dh?.Phi_ship || 0),
      ckBaoGomShip: false,
      ghiChuDonHang: String(dh?.Ghi_chu || '').trim(),
      khuyenMaiText: promoText,
      donViTienTe,
      priceMode: 'giaGoc',
      hangHoaByMaMap: hhMap,
    }

    const textGrouped = ctItems.length
      ? buildOrderTextInvoice({ ...commonTextArgs, groupMode: 'grouped' })
      : String(dh?.Ghi_chu || `Đơn #${maHD}`).trim()
    const textByMember = ctItems.length
      ? buildOrderTextInvoice({ ...commonTextArgs, groupMode: 'by_member' })
      : textGrouped

    const chenhLech = round2(tongGiaBanKhongShip - doanhThuGoc)
    const rowObj = {
      uid: `${maHD}_${idx}`,
      maHoaDon: maHD,
      isManual: false,
      stt: idx + 1,
      thoiGian: parsedTime.displayDate,
      noiDung: groupMode.value === 'by_member' ? textByMember : textGrouped,
      textGrouped,
      textByMember,
      noiDungEdited: false,
      hinhThucTT,
      doanhThuGoc,
      chietKhauGoc,
      chietKhauByItem: chietKhauGoc,
      chietKhauMode: 'by_item',
      chietKhauPercent: 10,
      chietKhauEdited: false,
      tongGiaBanKhongShip,
      tienThuHo: 0,
      tienThuHoEdited: false,
      traShipHo: 0,
      chenhLech,
      chenhLechEdited: false,
      tongCongOverride: null,
      tongCuoiVndOverride: null,
    }
    rowObj.tienThuHo = computeTienThuHoDefault(rowObj)
    return rowObj
  })
}

function getEffectiveRowTongCong(row) {
  if (row.tongCongOverride !== null && row.tongCongOverride !== undefined && row.tongCongOverride !== '') {
    return toNum(row.tongCongOverride)
  }
  return round2(toNum(row.chietKhauGoc) + toNum(row.chenhLech) - toNum(row.traShipHo))
}

function getEffectiveRowVnd(row) {
  if (row.tongCuoiVndOverride !== null && row.tongCuoiVndOverride !== undefined && row.tongCuoiVndOverride !== '') {
    return toNum(row.tongCuoiVndOverride)
  }
  return Math.round(getEffectiveRowTongCong(row) * Math.max(0, toNum(exchangeRate.value)))
}

const focusedCellKey = ref('')
const focusedCellDraft = ref('')

function parseSmartNumberToken(rawToken) {
  const tok = String(rawToken ?? '').trim()
  if (!tok) return NaN

  const hasDot = tok.includes('.')
  const hasComma = tok.includes(',')
  let normalized = tok

  if (hasDot && hasComma) {
    normalized =
      tok.lastIndexOf(',') > tok.lastIndexOf('.')
        ? tok.replace(/\./g, '').replace(',', '.')
        : tok.replace(/,/g, '')
  } else if (hasDot) {
    const dotCount = (tok.match(/\./g) || []).length
    if (dotCount > 1 || /^[1-9]\d{0,2}\.\d{3}$/.test(tok)) {
      normalized = tok.replace(/\./g, '')
    }
  } else if (hasComma) {
    const commaCount = (tok.match(/,/g) || []).length
    if (commaCount > 1 || /^[1-9]\d{0,2},\d{3}$/.test(tok)) {
      normalized = tok.replace(/,/g, '')
    } else {
      normalized = tok.replace(',', '.')
    }
  }

  if (normalized === '.' || normalized === '-.') return NaN
  const num = Number(normalized)
  return Number.isFinite(num) ? num : NaN
}

function evaluateNumericDraft(rawText) {
  let expr = String(rawText ?? '')
    .trim()
    .replace(/\s+/g, '')
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .replace(/−/g, '-')

  if (!expr) return { empty: true, incomplete: false, value: 0 }

  if (expr.startsWith('=')) {
    expr = expr.slice(1)
    if (!expr) return { empty: false, incomplete: true, value: null }
  }

  if (!/^[0-9.,+\-*/()%]+$/.test(expr)) {
    return { empty: false, incomplete: false, value: null }
  }

  const tokens = []
  let i = 0
  while (i < expr.length) {
    const ch = expr[i]
    if (/[0-9.,]/.test(ch)) {
      let j = i
      while (j < expr.length && /[0-9.,]/.test(expr[j])) j += 1
      const numVal = parseSmartNumberToken(expr.slice(i, j))
      if (!Number.isFinite(numVal)) {
        return { empty: false, incomplete: true, value: null }
      }
      tokens.push({ type: 'num', val: numVal })
      i = j
    } else {
      tokens.push({ type: 'op', val: ch })
      i += 1
    }
  }

  let pos = 0
  let parseFailed = false

  function parseExpression() {
    let left = parseTerm()
    while (
      !parseFailed &&
      pos < tokens.length &&
      tokens[pos].type === 'op' &&
      (tokens[pos].val === '+' || tokens[pos].val === '-')
    ) {
      const op = tokens[pos].val
      pos += 1
      const right = parseTerm()
      left = op === '+' ? left + right : left - right
    }
    return left
  }

  function parseTerm() {
    let left = parseUnary()
    while (
      !parseFailed &&
      pos < tokens.length &&
      tokens[pos].type === 'op' &&
      (tokens[pos].val === '*' || tokens[pos].val === '/')
    ) {
      const op = tokens[pos].val
      pos += 1
      const right = parseUnary()
      if (op === '/') {
        if (right === 0) {
          parseFailed = true
          return 0
        }
        left /= right
      } else {
        left *= right
      }
    }
    return left
  }

  function parseUnary() {
    if (!parseFailed && pos < tokens.length && tokens[pos].type === 'op') {
      const op = tokens[pos].val
      if (op === '+' || op === '-') {
        pos += 1
        const val = parseUnary()
        return op === '-' ? -val : val
      }
    }
    return parsePostfix()
  }

  function parsePostfix() {
    let val = parsePrimary()
    while (!parseFailed && pos < tokens.length && tokens[pos].type === 'op' && tokens[pos].val === '%') {
      pos += 1
      val /= 100
    }
    return val
  }

  function parsePrimary() {
    if (pos >= tokens.length) {
      parseFailed = true
      return 0
    }
    const tok = tokens[pos]
    if (tok.type === 'num') {
      pos += 1
      return tok.val
    }
    if (tok.type === 'op' && tok.val === '(') {
      pos += 1
      const inner = parseExpression()
      if (pos >= tokens.length || tokens[pos].val !== ')') {
        parseFailed = true
        return 0
      }
      pos += 1
      return inner
    }
    parseFailed = true
    return 0
  }

  const result = parseExpression()
  if (parseFailed || pos !== tokens.length || !Number.isFinite(result)) {
    return { empty: false, incomplete: true, value: null }
  }
  return { empty: false, incomplete: false, value: Object.is(result, -0) ? 0 : result }
}

function getNumericCellDisplay(key, rawValue) {
  if (focusedCellKey.value === key) {
    return focusedCellDraft.value
  }
  return formatNum(rawValue)
}

function onNumericCellFocus(key, rawValue, event) {
  focusedCellKey.value = key
  focusedCellDraft.value = String(toNum(rawValue))
  const el = event?.target
  if (el && typeof el.select === 'function') {
    setTimeout(() => {
      try {
        el.select()
      } catch {}
    }, 0)
  }
}

function onNumericCellBlur() {
  focusedCellKey.value = ''
  focusedCellDraft.value = ''
}

function onNumericCellEnter(event) {
  event?.target?.blur?.()
}

function getDefaultRowChietKhau(row) {
  if (row.chietKhauMode === 'by_percent') {
    const pct =
      row.chietKhauPercent === undefined || row.chietKhauPercent === null ? 10 : toNum(row.chietKhauPercent)
    return round2(toNum(row.doanhThuGoc) * (pct / 100))
  }
  return round2(toNum(row.chietKhauByItem))
}

function syncRowDerivedFieldsAfterCostChange(row) {
  if (row.chietKhauMode === 'by_percent' && !row.chietKhauEdited) {
    row.chietKhauGoc = getDefaultRowChietKhau(row)
  }
  if (row.isManual) return
  if (!row.chenhLechEdited) {
    row.chenhLech = round2(toNum(row.tongGiaBanKhongShip) - toNum(row.doanhThuGoc))
  }
  if (!row.tienThuHoEdited) {
    row.tienThuHo = computeTienThuHoDefault(row)
  }
}

function onRowPaymentMethodChange(row) {
  if (row.isManual || row.tienThuHoEdited) return
  row.tienThuHo = computeTienThuHoDefault(row)
}

function setRowDiscountMode(row, mode) {
  row.chietKhauMode = mode === 'by_percent' ? 'by_percent' : 'by_item'
  if (row.chietKhauPercent === undefined || row.chietKhauPercent === null || row.chietKhauPercent === '') {
    row.chietKhauPercent = 10
  }
  row.chietKhauEdited = false
  row.chietKhauGoc = getDefaultRowChietKhau(row)
}

function setAllRowsDiscountMode(mode) {
  const nextMode = mode === 'by_percent' ? 'by_percent' : 'by_item'
  for (const r of rows.value) {
    setRowDiscountMode(r, nextMode)
  }
  showToast(
    'info',
    nextMode === 'by_percent'
      ? 'Đã chuyển toàn bộ dòng sang tính Chiết khấu theo % tổng đơn'
      : 'Đã chuyển toàn bộ dòng sang tính Chiết khấu theo từng mặt hàng',
  )
}

function onRowDiscountPercentInput(row, rawText) {
  focusedCellDraft.value = String(rawText ?? '')
  const evaluated = evaluateNumericDraft(rawText)
  if (!evaluated.empty && evaluated.value === null) return

  row.chietKhauPercent = evaluated.empty ? 0 : Math.max(0, round2(evaluated.value))
  row.chietKhauMode = 'by_percent'
  row.chietKhauEdited = false
  row.chietKhauGoc = getDefaultRowChietKhau(row)
}

function resetRowChietKhau(row) {
  row.chietKhauEdited = false
  row.chietKhauGoc = getDefaultRowChietKhau(row)
}

function onExchangeRateInput(rawText) {
  focusedCellDraft.value = String(rawText ?? '')
  const evaluated = evaluateNumericDraft(rawText)
  if (evaluated.empty) {
    exchangeRate.value = 0
    return
  }
  if (evaluated.value !== null) {
    exchangeRate.value = Math.max(0, round2(evaluated.value))
  }
}

function onRowNumFieldInput(row, field, rawText) {
  focusedCellDraft.value = String(rawText ?? '')
  const evaluated = evaluateNumericDraft(rawText)
  if (!evaluated.empty && evaluated.value === null) return

  row[field] = evaluated.empty ? 0 : round2(evaluated.value)
  if (field === 'chietKhauGoc') {
    row.chietKhauEdited = true
  } else if (field === 'tienThuHo') {
    row.tienThuHoEdited = true
  } else if (field === 'chenhLech') {
    row.chenhLechEdited = true
  } else if (field === 'doanhThuGoc') {
    syncRowDerivedFieldsAfterCostChange(row)
  }
}

function onRowTongCongInput(row, rawText) {
  focusedCellDraft.value = String(rawText ?? '')
  const evaluated = evaluateNumericDraft(rawText)
  if (evaluated.empty) {
    row.tongCongOverride = null
    return
  }
  if (evaluated.value !== null) {
    row.tongCongOverride = round2(evaluated.value)
  }
}

function onRowVndInput(row, rawText) {
  focusedCellDraft.value = String(rawText ?? '')
  const evaluated = evaluateNumericDraft(rawText)
  if (evaluated.empty) {
    row.tongCuoiVndOverride = null
    return
  }
  if (evaluated.value !== null) {
    row.tongCuoiVndOverride = Math.round(evaluated.value)
  }
}

function resetRowTienThuHo(row) {
  row.tienThuHoEdited = false
  row.tienThuHo = computeTienThuHoDefault(row)
}

function resetRowChenhLech(row) {
  row.chenhLechEdited = false
  row.chenhLech = round2(toNum(row.tongGiaBanKhongShip) - toNum(row.doanhThuGoc))
}

function resetRowTongCong(row) {
  row.tongCongOverride = null
}

function resetRowVnd(row) {
  row.tongCuoiVndOverride = null
}

/* ================= USER CONTROLS ================= */
function setQuickPreset(preset) {
  const now = new Date()
  const y = now.getFullYear()
  const m = now.getMonth()
  if (preset === 'today') {
    const s = toInputYmd(now)
    fromDate.value = s
    toDate.value = s
  } else if (preset === '7days') {
    const start = new Date(now)
    start.setDate(start.getDate() - 6)
    fromDate.value = toInputYmd(start)
    toDate.value = toInputYmd(now)
  } else if (preset === 'first_half') {
    fromDate.value = toInputYmd(new Date(y, m, 1))
    toDate.value = toInputYmd(new Date(y, m, 15))
  } else if (preset === 'second_half') {
    const end = new Date(y, m + 1, 0)
    fromDate.value = toInputYmd(new Date(y, m, 16))
    toDate.value = toInputYmd(end)
  } else if (preset === 'month') {
    const end = new Date(y, m + 1, 0)
    fromDate.value = toInputYmd(new Date(y, m, 1))
    toDate.value = toInputYmd(end)
  } else if (preset === 'all') {
    fromDate.value = ''
    toDate.value = ''
  }
  activeSavedId.value = ''
  sheetName.value = buildDefaultSheetName(fromDate.value, toDate.value)
  rows.value = buildRowsFromOrders()
}

function reloadFromOrders({ keepNotice = false } = {}) {
  activeSavedId.value = ''
  sheetName.value = buildDefaultSheetName(fromDate.value, toDate.value)
  rows.value = buildRowsFromOrders()
  if (!keepNotice) {
    showToast('success', `Đã nạp ${rows.value.length} đơn Hoàn thành trong kỳ chọn`)
  }
}

function onGroupModeChange(mode) {
  groupMode.value = mode === 'by_member' ? 'by_member' : 'grouped'
  for (const r of rows.value) {
    if (r.isManual || r.noiDungEdited) continue
    r.noiDung = groupMode.value === 'by_member' ? r.textByMember : r.textGrouped
  }
}

function applyContentFormatToAllRows() {
  for (const r of rows.value) {
    if (r.isManual) continue
    r.noiDung = groupMode.value === 'by_member' ? r.textByMember : r.textGrouped
    r.noiDungEdited = false
  }
  showToast('info', 'Đã cập nhật lại nội dung text giá gốc cho tất cả dòng')
}

function onTienThuHoModeChange(mode) {
  tienThuHoMode.value = mode
  for (const r of rows.value) {
    if (r.isManual || r.tienThuHoEdited) continue
    r.tienThuHo = computeTienThuHoDefault(r)
  }
}

function addManualRow() {
  const nextIdx = rows.value.length + 1
  const now = new Date()
  rows.value.push({
    uid: `MANUAL_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    maHoaDon: '',
    isManual: true,
    stt: nextIdx,
    thoiGian: `${now.getDate()}/${now.getMonth() + 1}/${now.getFullYear()}`,
    noiDung: '',
    textGrouped: '',
    textByMember: '',
    noiDungEdited: true,
    hinhThucTT: 'COD',
    doanhThuGoc: 0,
    chietKhauGoc: 0,
    chietKhauByItem: 0,
    chietKhauMode: 'by_item',
    chietKhauPercent: 10,
    chietKhauEdited: false,
    tongGiaBanKhongShip: 0,
    tienThuHo: 0,
    tienThuHoEdited: true,
    traShipHo: 0,
    chenhLech: 0,
    chenhLechEdited: true,
    tongCongOverride: null,
    tongCuoiVndOverride: null,
  })
}

function removeRow(uid) {
  const idx = rows.value.findIndex((r) => r.uid === uid)
  if (idx !== -1) rows.value.splice(idx, 1)
}

function renumberStt() {
  rows.value.forEach((r, idx) => {
    r.stt = idx + 1
  })
}

function openContentModal(row) {
  editingContentRowId.value = row.uid
  editingContentDraft.value = row.noiDung || ''
}

function saveContentModal() {
  const target = rows.value.find((r) => r.uid === editingContentRowId.value)
  if (target) {
    target.noiDung = editingContentDraft.value
    target.noiDungEdited = true
  }
  editingContentRowId.value = ''
}

/* ================= SUMMARY TOTALS ================= */
const filteredRows = computed(() => {
  const q = String(searchRowQuery.value || '').trim().toLowerCase()
  if (!q) return rows.value
  return rows.value.filter((r) => {
    const blob = [r.stt, r.maHoaDon, r.thoiGian, r.noiDung, r.hinhThucTT]
      .join(' ')
      .toLowerCase()
    return blob.includes(q)
  })
})

const totals = computed(() => {
  let doanhThuGoc = 0
  let chietKhauGoc = 0
  let tienThuHo = 0
  let traShipHo = 0
  let chenhLech = 0
  let tongCong = 0
  let tongCuoiVnd = 0

  for (const r of rows.value) {
    doanhThuGoc += toNum(r.doanhThuGoc)
    chietKhauGoc += toNum(r.chietKhauGoc)
    tienThuHo += toNum(r.tienThuHo)
    traShipHo += toNum(r.traShipHo)
    chenhLech += toNum(r.chenhLech)
    tongCong += getEffectiveRowTongCong(r)
    tongCuoiVnd += getEffectiveRowVnd(r)
  }

  return {
    count: rows.value.length,
    doanhThuGoc: round2(doanhThuGoc),
    chietKhauGoc: round2(chietKhauGoc),
    tienThuHo: round2(tienThuHo),
    traShipHo: round2(traShipHo),
    chenhLech: round2(chenhLech),
    tongCong: round2(tongCong),
    tongCuoiVnd: Math.round(tongCuoiVnd),
    tongCuoiRoundedK: `${Math.round(tongCuoiVnd / 1000).toLocaleString('en-US')}K VND`,
  }
})

/* ================= SAVE & LOAD PERIODS ================= */
async function saveCurrentPeriod() {
  if (savingPeriod.value) return
  const cleanSheet = String(sheetName.value || '').trim() || buildDefaultSheetName(fromDate.value, toDate.value)
  sheetName.value = cleanSheet
  savingPeriod.value = true
  try {
    const res = await saveDiscountSettlementPeriod({
      id: activeSavedId.value || undefined,
      sheetName: cleanSheet,
      fromDate: fromDate.value,
      toDate: toDate.value,
      exchangeRate:
        exchangeRate.value !== '' && exchangeRate.value !== null && exchangeRate.value !== undefined
          ? Math.max(0, toNum(exchangeRate.value))
          : 425,
      groupMode: groupMode.value,
      tienThuHoMode: tienThuHoMode.value,
      excelLayoutMode: excelLayoutMode.value,
      rows: rows.value.map((r) => ({ ...r })),
      summary: { ...totals.value },
    })
    if (res?.success) {
      activeSavedId.value = res.id
      const listRes = await getOneSheet('chiet_khau_doi_soat')
      savedPeriods.value = (listRes.data || []).sort((a, b) => Number(b.updatedAt || 0) - Number(a.updatedAt || 0))
      showToast('success', `Đã lưu kỳ đối soát "${cleanSheet}"`)
    }
  } catch (err) {
    console.error('saveCurrentPeriod error:', err)
    showToast('error', 'Lưu kỳ đối soát thất bại')
  } finally {
    savingPeriod.value = false
  }
}

function loadSavedPeriod(period) {
  if (!period) return
  activeSavedId.value = period.id || ''
  sheetName.value = period.sheetName || 'Doi_soat'
  fromDate.value = period.fromDate || ''
  toDate.value = period.toDate || ''
  exchangeRate.value = Number(period.exchangeRate ?? 425)
  groupMode.value = period.groupMode === 'by_member' ? 'by_member' : 'grouped'
  tienThuHoMode.value = period.tienThuHoMode || 'sell_minus_cost'
  excelLayoutMode.value =
    period.excelLayoutMode === 'formatck_with_footer' ? 'formatck_with_footer' : 'formatck'
  rows.value = Array.isArray(period.rows)
    ? period.rows.map((r, i) => {
        const rowObj = {
          ...r,
          uid: r.uid || `SAVED_${Date.now()}_${i}`,
        }
        if (rowObj.chenhLechEdited === undefined) {
          rowObj.chenhLechEdited = rowObj.isManual
            ? true
            : round2(toNum(rowObj.chenhLech)) !==
              round2(toNum(rowObj.tongGiaBanKhongShip) - toNum(rowObj.doanhThuGoc))
        }
        if (rowObj.chietKhauMode === undefined) rowObj.chietKhauMode = 'by_item'
        if (rowObj.chietKhauPercent === undefined) rowObj.chietKhauPercent = 10
        if (rowObj.chietKhauByItem === undefined) rowObj.chietKhauByItem = toNum(rowObj.chietKhauGoc)
        if (rowObj.chietKhauEdited === undefined) rowObj.chietKhauEdited = false
        return rowObj
      })
    : []
  showToast('info', `Đang mở kỳ đã lưu: ${sheetName.value}`)
}

async function removeSavedPeriod(period) {
  if (!period?.id) return
  if (typeof window !== 'undefined' && !window.confirm(`Xóa kỳ đối soát "${period.sheetName}"?`)) return
  const res = await deleteDiscountSettlementPeriod(period.id)
  if (res?.success) {
    savedPeriods.value = savedPeriods.value.filter((p) => p.id !== period.id)
    selectedSavedIdsForExport.value = selectedSavedIdsForExport.value.filter((id) => id !== period.id)
    if (activeSavedId.value === period.id) activeSavedId.value = ''
    showToast('success', 'Đã xóa kỳ đối soát')
  }
}

/* ================= EXCEL EXPORT (MATCHING FORMATCK.xlsx) ================= */
function sanitizeSheetTitle(rawTitle, usedNames) {
  let clean = String(rawTitle || 'Doi_soat')
    .replace(/[:\\/?*[\]]/g, '-')
    .trim()
  if (!clean) clean = 'Doi_soat'
  clean = clean.slice(0, 31)
  let candidate = clean
  let suffix = 2
  while (usedNames.has(candidate.toLowerCase())) {
    const tag = `_${suffix}`
    candidate = `${clean.slice(0, 31 - tag.length)}${tag}`
    suffix += 1
  }
  usedNames.add(candidate.toLowerCase())
  return candidate
}

function estimateExcelContentHeight(text, minHeight = 20, maxCharsPerLine = 44) {
  const lines = String(text ?? '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')
  let visualLines = 0
  for (const line of lines) {
    visualLines += line.length === 0 ? 1 : Math.ceil(line.length / maxCharsPerLine)
  }
  const computed = Math.max(1, visualLines) * 15.75 + 8
  return Math.max(minHeight, Math.round(computed * 100) / 100)
}

function buildWorksheetFromSettlement({
  rowList = [],
  rate = 425,
  layoutMode = 'formatck',
}) {
  const numericRate = Math.max(0, toNum(rate ?? 425))
  const thinBorder = {
    top: { style: 'thin', color: { rgb: '000000' } },
    bottom: { style: 'thin', color: { rgb: '000000' } },
    left: { style: 'thin', color: { rgb: '000000' } },
    right: { style: 'thin', color: { rgb: '000000' } },
  }

  const headerYellowLeftStyle = {
    font: { name: 'Calibri', sz: 12, bold: true, color: { rgb: '000000' } },
    fill: { patternType: 'solid', fgColor: { rgb: 'FFFF00' } },
    border: thinBorder,
    alignment: { horizontal: 'left', vertical: 'center', wrapText: true },
  }
  const headerYellowCenterStyle = {
    font: { name: 'Calibri', sz: 12, bold: true, color: { rgb: '000000' } },
    fill: { patternType: 'solid', fgColor: { rgb: 'FFFF00' } },
    border: thinBorder,
    alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
  }
  const headerRedStyle = {
    font: { name: 'Calibri', sz: 12, bold: true, color: { rgb: 'FFFFFF' } },
    fill: { patternType: 'solid', fgColor: { rgb: 'FF0000' } },
    border: thinBorder,
    alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
  }

  const dataCenterStyle = {
    font: { name: 'Calibri', sz: 12, color: { rgb: '000000' } },
    border: thinBorder,
    alignment: { horizontal: 'center', vertical: 'center' },
  }
  const dataDateStyle = {
    font: { name: 'Calibri', sz: 12, color: { rgb: '000000' } },
    border: thinBorder,
    numFmt: 'd/m/yyyy',
    alignment: { horizontal: 'center', vertical: 'center' },
  }
  const dataContentStyle = {
    font: { name: 'Calibri', sz: 12, color: { rgb: '000000' } },
    border: thinBorder,
    alignment: { horizontal: 'left', vertical: 'top', wrapText: true },
  }
  const dataNumStyle = {
    font: { name: 'Calibri', sz: 12, color: { rgb: '000000' } },
    border: thinBorder,
    numFmt: '#,##0.##',
    alignment: { horizontal: 'right', vertical: 'center' },
  }
  const dataNumBoldStyle = {
    font: { name: 'Calibri', sz: 12, bold: true, color: { rgb: '000000' } },
    border: thinBorder,
    numFmt: '#,##0.##',
    alignment: { horizontal: 'right', vertical: 'center' },
  }

  const k2SummaryStyle = {
    font: { name: 'Calibri', sz: 14, bold: true, color: { rgb: '000000' } },
    border: thinBorder,
    numFmt: '#,##0.##',
    alignment: { horizontal: 'center', vertical: 'center' },
  }
  const l2RateStyle = {
    font: { name: 'Calibri', sz: 14, bold: true, color: { rgb: '000000' } },
    border: thinBorder,
    numFmt: '#,##0.##',
    alignment: { horizontal: 'center', vertical: 'center' },
  }
  const greenVndStyle = {
    font: { name: 'Calibri', sz: 18, bold: true, color: { rgb: 'FFFFFF' } },
    fill: { patternType: 'solid', fgColor: { rgb: '00B050' } },
    border: thinBorder,
    numFmt: '#,##0 "VND"',
    alignment: { horizontal: 'center', vertical: 'center' },
  }
  const footTextStyle = {
    font: { name: 'Calibri', sz: 12, bold: true, color: { rgb: '000000' } },
    fill: { patternType: 'solid', fgColor: { rgb: 'FFF2CC' } },
    border: thinBorder,
    alignment: { horizontal: 'center', vertical: 'center' },
  }
  const footNumStyle = {
    font: { name: 'Calibri', sz: 12, bold: true, color: { rgb: '000000' } },
    fill: { patternType: 'solid', fgColor: { rgb: 'FFF2CC' } },
    border: thinBorder,
    numFmt: '#,##0.##',
    alignment: { horizontal: 'right', vertical: 'center' },
  }

  const header = [
    'STT',
    'Thời gian',
    'Nội dung đơn hàng',
    'Hình thức thanh toán',
    'Doanh thu gốc',
    'Chiết khấu gốc',
    'Tiền thu hộ',
    'Trả ship hộ',
    'Chênh lệch',
    'Tổng cộng\n( chiết khấu + chênh lệch - trả ship hộ )',
    'TỔNG CUỐI',
    'Tỉ giá',
  ]

  const ws = {}
  const encode = XLSX.utils.encode_cell
  const rowHeights = [{ hpt: 47.25 }]

  // Header row (Row 1: A1..L1)
  header.forEach((title, cIdx) => {
    let style = headerYellowLeftStyle
    if (cIdx === 9) style = headerYellowCenterStyle
    else if (cIdx === 10 || cIdx === 11) style = headerRedStyle
    ws[encode({ r: 0, c: cIdx })] = { t: 's', v: title, s: style }
  })

  const startDataRow = 2
  const endDataRow = rowList.length > 0 ? rowList.length + 1 : 2

  let grandTotalE = 0
  let grandTotalF = 0
  let grandTotalG = 0
  let grandTotalH = 0
  let grandTotalI = 0
  let grandTotalJ = 0

  rowList.forEach((row, idx) => {
    const excelRow = startDataRow + idx // 1-based Excel row
    const r = excelRow - 1

    const sttNum = Number(row.stt)
    ws[encode({ r, c: 0 })] =
      row.stt !== '' && Number.isFinite(sttNum) && String(row.stt).trim() === String(sttNum)
        ? { t: 'n', v: sttNum, s: dataCenterStyle }
        : { t: 's', v: String(row.stt ?? ''), s: dataCenterStyle }

    const dateSerial = toExcelDateSerial(row.thoiGian)
    ws[encode({ r, c: 1 })] =
      dateSerial !== null
        ? { t: 'n', v: dateSerial, z: 'd/m/yyyy', s: dataDateStyle }
        : { t: 's', v: String(row.thoiGian ?? ''), s: dataCenterStyle }

    const normalizedContent = String(row.noiDung ?? '')
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
    ws[encode({ r, c: 2 })] = { t: 's', v: normalizedContent, s: dataContentStyle }
    ws[encode({ r, c: 3 })] = { t: 's', v: String(row.hinhThucTT ?? ''), s: dataCenterStyle }

    const valE = toNum(row.doanhThuGoc)
    const valF = toNum(row.chietKhauGoc)
    const valG = toNum(row.tienThuHo)
    const valH = toNum(row.traShipHo)
    const valI = toNum(row.chenhLech)
    const hasJOverride =
      row.tongCongOverride !== null && row.tongCongOverride !== undefined && row.tongCongOverride !== ''
    const valJ = hasJOverride ? toNum(row.tongCongOverride) : round2(valF + valI - valH)

    grandTotalE += valE
    grandTotalF += valF
    grandTotalG += valG
    grandTotalH += valH
    grandTotalI += valI
    grandTotalJ += valJ

    const usePercentFormula = row.chietKhauMode === 'by_percent' && !row.chietKhauEdited
    const pctRate = Math.round(toNum(row.chietKhauPercent ?? 10) * 100) / 10000
    ws[encode({ r, c: 4 })] = { t: 'n', v: valE, z: '#,##0.##', s: dataNumStyle }
    ws[encode({ r, c: 5 })] = usePercentFormula
      ? { t: 'n', v: valF, f: `E${excelRow}*${pctRate}`, z: '#,##0.##', s: dataNumStyle }
      : { t: 'n', v: valF, z: '#,##0.##', s: dataNumStyle }
    ws[encode({ r, c: 6 })] = { t: 'n', v: valG, z: '#,##0.##', s: dataNumStyle }
    ws[encode({ r, c: 7 })] = { t: 'n', v: valH, z: '#,##0.##', s: dataNumStyle }
    ws[encode({ r, c: 8 })] = { t: 'n', v: valI, z: '#,##0.##', s: dataNumStyle }
    ws[encode({ r, c: 9 })] = hasJOverride
      ? { t: 'n', v: valJ, z: '#,##0.##', s: dataNumBoldStyle }
      : { t: 'n', v: valJ, f: `F${excelRow}+I${excelRow}-H${excelRow}`, z: '#,##0.##', s: dataNumBoldStyle }

    const minH = r === 1 ? 26 : r === 2 ? 34 : 20
    rowHeights[r] = { hpt: estimateExcelContentHeight(normalizedContent, minH, 44) }
  })

  // Cụm TỔNG CUỐI (K2), Tỉ giá (L2) và ô xanh lá K3:L3 (=K2*L2, format "#,##0 \"VND\"") chuẩn FORMATCK.xlsx
  const totalVndByRate = Math.round(round2(grandTotalJ) * numericRate)
  ws[encode({ r: 1, c: 10 })] = {
    t: 'n',
    v: round2(grandTotalJ),
    f: rowList.length > 0 ? `SUM(J2:J${endDataRow})` : '0',
    z: '#,##0.##',
    s: k2SummaryStyle,
  }
  ws[encode({ r: 1, c: 11 })] = {
    t: 'n',
    v: numericRate,
    z: '#,##0.##',
    s: l2RateStyle,
  }
  ws[encode({ r: 2, c: 10 })] = {
    t: 'n',
    v: totalVndByRate,
    f: 'K2*L2',
    z: '#,##0 "VND"',
    s: greenVndStyle,
  }
  ws[encode({ r: 2, c: 11 })] = {
    t: 's',
    v: '',
    s: greenVndStyle,
  }

  if (!rowHeights[1]) rowHeights[1] = { hpt: 26 }
  if (!rowHeights[2]) rowHeights[2] = { hpt: 34 }

  let maxRowIdx = Math.max(rowList.length, 2)

  if (layoutMode === 'formatck_with_footer' && rowList.length > 0) {
    const sumRowIdx = Math.max(rowList.length + 1, 3)
    ws[encode({ r: sumRowIdx, c: 0 })] = { t: 's', v: 'TỔNG', s: footTextStyle }
    ws[encode({ r: sumRowIdx, c: 1 })] = { t: 's', v: '', s: footTextStyle }
    ws[encode({ r: sumRowIdx, c: 2 })] = {
      t: 's',
      v: `Tổng ${rowList.length} đơn hàng`,
      s: { ...footTextStyle, alignment: { horizontal: 'left', vertical: 'center' } },
    }
    ws[encode({ r: sumRowIdx, c: 3 })] = { t: 's', v: '', s: footTextStyle }
    ws[encode({ r: sumRowIdx, c: 4 })] = {
      t: 'n',
      v: round2(grandTotalE),
      f: `SUM(E2:E${endDataRow})`,
      z: '#,##0.##',
      s: footNumStyle,
    }
    ws[encode({ r: sumRowIdx, c: 5 })] = {
      t: 'n',
      v: round2(grandTotalF),
      f: `SUM(F2:F${endDataRow})`,
      z: '#,##0.##',
      s: footNumStyle,
    }
    ws[encode({ r: sumRowIdx, c: 6 })] = {
      t: 'n',
      v: round2(grandTotalG),
      f: `SUM(G2:G${endDataRow})`,
      z: '#,##0.##',
      s: footNumStyle,
    }
    ws[encode({ r: sumRowIdx, c: 7 })] = {
      t: 'n',
      v: round2(grandTotalH),
      f: `SUM(H2:H${endDataRow})`,
      z: '#,##0.##',
      s: footNumStyle,
    }
    ws[encode({ r: sumRowIdx, c: 8 })] = {
      t: 'n',
      v: round2(grandTotalI),
      f: `SUM(I2:I${endDataRow})`,
      z: '#,##0.##',
      s: footNumStyle,
    }
    ws[encode({ r: sumRowIdx, c: 9 })] = {
      t: 'n',
      v: round2(grandTotalJ),
      f: `SUM(J2:J${endDataRow})`,
      z: '#,##0.##',
      s: footNumStyle,
    }
    rowHeights[sumRowIdx] = { hpt: 24 }
    maxRowIdx = sumRowIdx
  }

  ws['!merges'] = [{ s: { r: 2, c: 10 }, e: { r: 2, c: 11 } }]
  ws['!rows'] = rowHeights
  ws['!ref'] = XLSX.utils.encode_range({
    s: { r: 0, c: 0 },
    e: { r: maxRowIdx, c: 11 },
  })

  ws['!cols'] = [
    { wch: 7 },  // A: STT
    { wch: 13 }, // B: Thời gian
    { wch: 46 }, // C: Nội dung đơn hàng (wrap giống web)
    { wch: 14 }, // D: Hình thức thanh toán
    { wch: 15 }, // E: Doanh thu gốc
    { wch: 16 }, // F: Chiết khấu gốc
    { wch: 14 }, // G: Tiền thu hộ
    { wch: 13 }, // H: Trả ship hộ
    { wch: 13 }, // I: Chênh lệch
    { wch: 24 }, // J: Tổng cộng
    { wch: 21 }, // K: TỔNG CUỐI
    { wch: 11 }, // L: Tỉ giá
  ]

  return ws
}

function exportCurrentExcel() {
  if (!rows.value.length) {
    showToast('warn', 'Bảng hiện chưa có dòng nào để xuất Excel')
    return
  }
  const wb = XLSX.utils.book_new()
  const used = new Set()
  const title = sanitizeSheetTitle(sheetName.value || buildDefaultSheetName(fromDate.value, toDate.value), used)
  const ws = buildWorksheetFromSettlement({
    rowList: rows.value,
    rate: exchangeRate.value,
    layoutMode: excelLayoutMode.value,
  })
  XLSX.utils.book_append_sheet(wb, ws, title)
  XLSX.writeFile(wb, `tinhtoan-${title}.xlsx`)
  showToast('success', `Đã xuất file tinhtoan-${title}.xlsx`)
}

function exportSelectedSavedWorkbook() {
  const chosen = savedPeriods.value.filter((p) => selectedSavedIdsForExport.value.includes(p.id))
  if (!chosen.length) {
    showToast('warn', 'Hãy tick chọn ít nhất 1 kỳ đã lưu để xuất gộp nhiều sheet')
    return
  }
  const wb = XLSX.utils.book_new()
  const used = new Set()
  for (const period of chosen) {
    const title = sanitizeSheetTitle(period.sheetName || 'Doi_soat', used)
    const periodMode =
      period.excelLayoutMode === 'formatck_with_footer' ? 'formatck_with_footer' : 'formatck'
    const ws = buildWorksheetFromSettlement({
      rowList: Array.isArray(period.rows) ? period.rows : [],
      rate: Number(period.exchangeRate ?? exchangeRate.value ?? 425),
      layoutMode: periodMode,
    })
    XLSX.utils.book_append_sheet(wb, ws, title)
  }
  const stamp = toInputYmd(new Date()).replaceAll('-', '')
  XLSX.writeFile(wb, `tinhtoan-tonghop-${stamp}.xlsx`)
  showToast('success', `Đã xuất file gồm ${chosen.length} sheet`)
}

/* ================= INIT ================= */
async function loadAllData() {
  loading.value = true
  try {
    const [sheetsRes, savedRes] = await Promise.all([
      getSheets([
        'don_hang',
        'hoa_don_tong_quat',
        'hoa_don_chi_tiet',
        'hang_hoa',
        'khuyenmai_info',
        'thong_tin_chuyen_khoan',
      ]),
      getOneSheet('chiet_khau_doi_soat'),
    ])

    const d = sheetsRes?.data || {}
    rawDonHang.value = d.don_hang || []
    rawHoaDonTongQuat.value = d.hoa_don_tong_quat || []
    rawHoaDonChiTiet.value = d.hoa_don_chi_tiet || []
    rawHangHoa.value = d.hang_hoa || []
    rawKhuyenMai.value = d.khuyenmai_info || []
    rawChuyenKhoan.value = d.thong_tin_chuyen_khoan || []
    savedPeriods.value = (savedRes?.data || []).sort(
      (a, b) => Number(b.updatedAt || 0) - Number(a.updatedAt || 0),
    )

    // Lấy tỉ giá VND mặc định từ QR Banking nếu >= 100, fallback 425
    const ckPreferred =
      rawChuyenKhoan.value.find(
        (c) =>
          String(c?.Don_vi_tien_te || '').trim().toUpperCase() === 'VND' &&
          (c?.Show_in_invoice === true || c?.Show_in_invoice === 'YES'),
      ) ||
      rawChuyenKhoan.value.find((c) => String(c?.Don_vi_tien_te || '').trim().toUpperCase() === 'VND') ||
      rawChuyenKhoan.value[0]
    const ckRate = Number(ckPreferred?.Ti_gia || 0)
    exchangeRate.value = ckRate >= 100 ? ckRate : 425

    // Mặc định chọn 14 ngày gần nhất
    const now = new Date()
    const start = new Date(now)
    start.setDate(start.getDate() - 13)
    fromDate.value = toInputYmd(start)
    toDate.value = toInputYmd(now)
    sheetName.value = buildDefaultSheetName(fromDate.value, toDate.value)
    rows.value = buildRowsFromOrders()
  } catch (err) {
    console.error('Load TinhChietKhau failed:', err)
    showToast('error', 'Không thể tải dữ liệu đối soát')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadAllData()
})
</script>

<template>
  <div class="ck-page">
    <Transition name="ck-toast">
      <div v-if="toastState" class="ck-toast" :class="`is-${toastState.type}`">
        <i
          :class="
            toastState.type === 'error'
              ? 'ri-error-warning-fill'
              : toastState.type === 'warn'
                ? 'ri-alert-fill'
                : 'ri-checkbox-circle-fill'
          "
        ></i>
        <span>{{ toastState.text }}</span>
      </div>
    </Transition>

    <!-- HEADER -->
    <div class="ck-header">
      <div class="ck-title-wrap">
        <div class="ck-title-ico">
          <i class="ri-percent-line"></i>
        </div>
        <div>
          <h1>Tính chiết khấu &amp; Xuất Excel</h1>
          <p>
            Lọc đơn <strong>Hoàn thành</strong> theo ngày nhận hàng · Mọi ô đều sửa trực tiếp được trước khi xuất file chuẩn mẫu <code>tinhtoan.xlsx</code>
          </p>
        </div>
      </div>

      <div class="ck-header-actions">
        <button type="button" class="ck-btn ck-btn-ghost" @click="loadAllData" :disabled="loading">
          <i class="ri-refresh-line"></i>
          <span>Đồng bộ DB</span>
        </button>
        <button type="button" class="ck-btn ck-btn-save" @click="saveCurrentPeriod" :disabled="savingPeriod">
          <i class="ri-save-3-line"></i>
          <span>{{ savingPeriod ? 'Đang lưu...' : 'Lưu kỳ đối soát' }}</span>
        </button>
        <button type="button" class="ck-btn ck-btn-export" @click="exportCurrentExcel">
          <i class="ri-file-excel-2-fill"></i>
          <span>Xuất Excel (.xlsx)</span>
        </button>
      </div>
    </div>

    <!-- FILTER & SETTINGS BAR -->
    <div class="ck-toolbar-card">
      <div class="ck-preset-row">
        <span class="ck-preset-lbl"><i class="ri-calendar-2-line"></i> Kỳ nhận hàng:</span>
        <div class="ck-preset-chips">
          <button type="button" class="ck-chip" @click="setQuickPreset('today')">Hôm nay</button>
          <button type="button" class="ck-chip" @click="setQuickPreset('7days')">7 ngày</button>
          <button type="button" class="ck-chip" @click="setQuickPreset('first_half')">1 → 15</button>
          <button type="button" class="ck-chip" @click="setQuickPreset('second_half')">16 → Hết tháng</button>
          <button type="button" class="ck-chip" @click="setQuickPreset('month')">Cả tháng</button>
          <button type="button" class="ck-chip" @click="setQuickPreset('all')">Tất cả</button>
        </div>
      </div>

      <div class="ck-controls-grid">
        <div class="ck-field">
          <label>Từ ngày nhận</label>
          <input type="date" v-model="fromDate" @change="reloadFromOrders({ keepNotice: true })" />
        </div>

        <div class="ck-field">
          <label>Đến ngày nhận</label>
          <input type="date" v-model="toDate" @change="reloadFromOrders({ keepNotice: true })" />
        </div>

        <div class="ck-field">
          <label>Tên Sheet Excel</label>
          <input type="text" v-model="sheetName" placeholder="VD: 1210-1810" />
        </div>

        <div class="ck-field">
          <label>Tỉ giá VND (Cột K)</label>
          <input
            type="text"
            inputmode="decimal"
            :value="getNumericCellDisplay('rate', exchangeRate)"
            @focus="onNumericCellFocus('rate', exchangeRate, $event)"
            @input="onExchangeRateInput($event.target.value)"
            @keydown.enter="onNumericCellEnter"
            @blur="onNumericCellBlur"
          />
        </div>

        <div class="ck-field">
          <label>Nội dung text (Giá gốc)</label>
          <div class="ck-seg">
            <button
              type="button"
              :class="{ active: groupMode === 'grouped' }"
              @click="onGroupModeChange('grouped')"
            >
              Dạng gộp
            </button>
            <button
              type="button"
              :class="{ active: groupMode === 'by_member' }"
              @click="onGroupModeChange('by_member')"
            >
              Theo từng người
            </button>
          </div>
        </div>

        <div class="ck-field">
          <label>Mặc định Tiền thu hộ (G)</label>
          <select :value="tienThuHoMode" @change="onTienThuHoModeChange($event.target.value)">
            <option value="sell_minus_cost">Giá bán (ko ship) - Giá mua</option>
            <option value="cod_full">COD = Tổng thu / CK = 0</option>
            <option value="zero">Để 0 tự nhập</option>
          </select>
        </div>

        <div class="ck-field">
          <label>Kiểu xuất Excel</label>
          <select v-model="excelLayoutMode">
            <option value="formatck">Chuẩn FORMATCK (A-L · Ô xanh VND)</option>
            <option value="formatck_with_footer">Chuẩn FORMATCK + Hàng TỔNG cuối</option>
          </select>
        </div>

        <div class="ck-field">
          <label>Tìm nhanh trong bảng</label>
          <input type="text" v-model="searchRowQuery" placeholder="Tên khách, món, CK/COD..." />
        </div>
      </div>

      <div class="ck-sub-actions">
        <button type="button" class="ck-mini-btn is-primary" @click="addManualRow">
          <i class="ri-add-circle-line"></i>
          <span>Thêm dòng thủ công</span>
        </button>
        <button type="button" class="ck-mini-btn" @click="renumberStt">
          <i class="ri-list-ordered"></i>
          <span>Đánh lại STT</span>
        </button>
        <button type="button" class="ck-mini-btn" @click="applyContentFormatToAllRows">
          <i class="ri-text-wrap"></i>
          <span>Làm mới nội dung theo {{ groupMode === 'by_member' ? 'Từng người' : 'Dạng gộp' }}</span>
        </button>
        <button type="button" class="ck-mini-btn" @click="setAllRowsDiscountMode('by_item')">
          <i class="ri-price-tag-3-line"></i>
          <span>CK tất cả: Theo món</span>
        </button>
        <button type="button" class="ck-mini-btn" @click="setAllRowsDiscountMode('by_percent')">
          <i class="ri-percent-line"></i>
          <span>CK tất cả: % tổng đơn</span>
        </button>
        <button type="button" class="ck-mini-btn is-warn" @click="reloadFromOrders()">
          <i class="ri-restart-line"></i>
          <span>Nạp lại từ đơn Hoàn thành</span>
        </button>
      </div>
    </div>

    <!-- KPI SUMMARY CARDS -->
    <div class="ck-kpi-grid">
      <div class="ck-kpi">
        <span class="ck-kpi-lbl">Số đơn</span>
        <strong class="ck-kpi-val">{{ totals.count }}</strong>
      </div>
      <div class="ck-kpi">
        <span class="ck-kpi-lbl">Doanh thu gốc (E)</span>
        <strong class="ck-kpi-val">{{ formatNum(totals.doanhThuGoc) }}</strong>
      </div>
      <div class="ck-kpi">
        <span class="ck-kpi-lbl">Chiết khấu gốc (F)</span>
        <strong class="ck-kpi-val is-green">{{ formatNum(totals.chietKhauGoc) }}</strong>
      </div>
      <div class="ck-kpi">
        <span class="ck-kpi-lbl">Tiền thu hộ (G)</span>
        <strong class="ck-kpi-val">{{ formatNum(totals.tienThuHo) }}</strong>
      </div>
      <div class="ck-kpi">
        <span class="ck-kpi-lbl">Trả ship hộ (H)</span>
        <strong class="ck-kpi-val is-red">-{{ formatNum(totals.traShipHo) }}</strong>
      </div>
      <div class="ck-kpi">
        <span class="ck-kpi-lbl">Chênh lệch (I)</span>
        <strong class="ck-kpi-val is-sky">{{ formatNum(totals.chenhLech) }}</strong>
      </div>
      <div class="ck-kpi is-highlight">
        <span class="ck-kpi-lbl">Tổng cộng (J = F+I-H)</span>
        <strong class="ck-kpi-val is-green">{{ formatNum(totals.tongCong) }}</strong>
      </div>
      <div class="ck-kpi is-highlight-vnd">
        <span class="ck-kpi-lbl">Tổng cuối VND (×{{ exchangeRate || 0 }})</span>
        <strong class="ck-kpi-val">{{ formatNum(totals.tongCuoiVnd) }} đ</strong>
        <span class="ck-kpi-sub">≈ {{ totals.tongCuoiRoundedK }}</span>
      </div>
    </div>

    <!-- SAVED PERIODS BAR -->
    <div v-if="savedPeriods.length > 0" class="ck-saved-box">
      <div class="ck-saved-head">
        <div class="ck-saved-title">
          <i class="ri-archive-drawer-line"></i>
          <span>Các kỳ đối soát đã lưu ({{ savedPeriods.length }})</span>
        </div>
        <button
          v-if="selectedSavedIdsForExport.length > 0"
          type="button"
          class="ck-btn ck-btn-export ck-btn-sm"
          @click="exportSelectedSavedWorkbook"
        >
          <i class="ri-file-excel-2-fill"></i>
          <span>Xuất gộp {{ selectedSavedIdsForExport.length }} sheet</span>
        </button>
      </div>
      <div class="ck-saved-list">
        <div
          v-for="p in savedPeriods"
          :key="p.id"
          class="ck-saved-pill"
          :class="{ active: activeSavedId === p.id }"
        >
          <input
            type="checkbox"
            :value="p.id"
            v-model="selectedSavedIdsForExport"
            title="Chọn để xuất gộp nhiều sheet thành 1 file Excel"
          />
          <button type="button" class="ck-saved-open" @click="loadSavedPeriod(p)">
            <strong>{{ p.sheetName }}</strong>
            <span>{{ p.summary?.count ?? (p.rows?.length || 0) }} đơn · {{ formatNum(p.summary?.tongCuoiVnd || 0) }} đ</span>
          </button>
          <button
            type="button"
            class="ck-saved-del"
            title="Xóa kỳ đã lưu"
            @click="removeSavedPeriod(p)"
          >
            <i class="ri-close-line"></i>
          </button>
        </div>
      </div>
    </div>

    <!-- LOADING / EMPTY -->
    <div v-if="loading" class="ck-state-box">
      <div class="ck-spinner"></div>
      <p>Đang tải dữ liệu đơn hàng Hoàn thành...</p>
    </div>

    <div v-else-if="!filteredRows.length" class="ck-state-box">
      <i class="ri-inbox-2-line"></i>
      <p>Không có đơn hàng <strong>Hoàn thành</strong> nào trong khoảng ngày nhận này.</p>
      <button type="button" class="ck-mini-btn is-primary" @click="addManualRow">
        <i class="ri-add-line"></i> Thêm dòng thủ công
      </button>
    </div>

    <!-- EDITABLE TABLE (DESKTOP & TABLET) -->
    <div v-else class="ck-table-wrap">
      <table class="ck-table">
        <thead>
          <tr>
            <th class="col-stt">STT</th>
            <th class="col-date">Thời gian</th>
            <th class="col-content">Nội dung đơn hàng (Giá gốc · {{ groupMode === 'by_member' ? 'Theo người' : 'Gộp' }})</th>
            <th class="col-pay">TT</th>
            <th class="col-num">Doanh thu gốc</th>
            <th class="col-ck">Chiết khấu gốc</th>
            <th class="col-num">Tiền thu hộ</th>
            <th class="col-num">Trả ship hộ</th>
            <th class="col-num">Chênh lệch</th>
            <th class="col-num">Tổng cộng (F+I-H)</th>
            <th class="col-vnd">TỔNG CUỐI VND (×{{ exchangeRate || 0 }})</th>
            <th class="col-act"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in filteredRows" :key="row.uid" :class="{ 'is-manual-row': row.isManual }">
            <td>
              <input v-model="row.stt" class="ck-cell-input is-center" />
            </td>
            <td>
              <input v-model="row.thoiGian" class="ck-cell-input is-center" placeholder="d/m/yyyy" />
            </td>
            <td>
              <div class="ck-content-cell">
                <textarea
                  v-model="row.noiDung"
                  rows="4"
                  class="ck-cell-textarea"
                  @input="row.noiDungEdited = true"
                  placeholder="Nhập nội dung đơn hàng..."
                ></textarea>
                <div class="ck-content-foot">
                  <span v-if="row.maHoaDon" class="ck-order-tag">#{{ row.maHoaDon }}</span>
                  <span v-else class="ck-order-tag is-manual">Thủ công</span>
                  <button
                    type="button"
                    class="ck-expand-btn"
                    title="Mở khung sửa rộng"
                    @click="openContentModal(row)"
                  >
                    <i class="ri-fullscreen-line"></i> Phóng to
                  </button>
                </div>
              </div>
            </td>
            <td>
              <input
                v-model="row.hinhThucTT"
                list="ck-pay-options"
                @input="onRowPaymentMethodChange(row)"
                class="ck-cell-input is-center is-bold"
              />
            </td>
            <td>
              <input
                type="text"
                inputmode="decimal"
                :value="getNumericCellDisplay(`d_${row.uid}_E`, row.doanhThuGoc)"
                @focus="onNumericCellFocus(`d_${row.uid}_E`, row.doanhThuGoc, $event)"
                @input="onRowNumFieldInput(row, 'doanhThuGoc', $event.target.value)"
                @keydown.enter="onNumericCellEnter"
                @blur="onNumericCellBlur"
                class="ck-cell-input is-num"
              />
            </td>
            <td>
              <div class="ck-f-cell">
                <div class="ck-override-wrap">
                  <input
                    type="text"
                    inputmode="decimal"
                    :value="getNumericCellDisplay(`d_${row.uid}_F`, row.chietKhauGoc)"
                    @focus="onNumericCellFocus(`d_${row.uid}_F`, row.chietKhauGoc, $event)"
                    @input="onRowNumFieldInput(row, 'chietKhauGoc', $event.target.value)"
                    @keydown.enter="onNumericCellEnter"
                    @blur="onNumericCellBlur"
                    class="ck-cell-input is-num is-green"
                    :class="{ 'is-overridden': row.chietKhauEdited && (!row.isManual || row.chietKhauMode === 'by_percent') }"
                  />
                  <button
                    v-if="row.chietKhauEdited && (!row.isManual || row.chietKhauMode === 'by_percent')"
                    type="button"
                    class="ck-reset-override"
                    :title="row.chietKhauMode === 'by_percent' ? 'Khôi phục tự tính theo % đơn' : 'Khôi phục chiết khấu theo từng món'"
                    @click="resetRowChietKhau(row)"
                  >
                    ↺
                  </button>
                </div>
                <div class="ck-row-ck-bar">
                  <div class="ck-row-seg" title="Chọn cách tính Chiết khấu dòng này">
                    <button
                      type="button"
                      :class="{ active: (row.chietKhauMode || 'by_item') === 'by_item' }"
                      @click="setRowDiscountMode(row, 'by_item')"
                    >
                      Món
                    </button>
                    <button
                      type="button"
                      :class="{ active: row.chietKhauMode === 'by_percent' }"
                      @click="setRowDiscountMode(row, 'by_percent')"
                    >
                      % đơn
                    </button>
                  </div>
                  <div v-if="row.chietKhauMode === 'by_percent'" class="ck-row-pct-wrap">
                    <input
                      type="text"
                      inputmode="decimal"
                      :value="getNumericCellDisplay(`d_${row.uid}_pct`, row.chietKhauPercent ?? 10)"
                      @focus="onNumericCellFocus(`d_${row.uid}_pct`, row.chietKhauPercent ?? 10, $event)"
                      @input="onRowDiscountPercentInput(row, $event.target.value)"
                      @keydown.enter="onNumericCellEnter"
                      @blur="onNumericCellBlur"
                      class="ck-row-pct-inp"
                    />
                    <span>%</span>
                  </div>
                </div>
              </div>
            </td>
            <td>
              <div class="ck-override-wrap">
                <input
                  type="text"
                  inputmode="decimal"
                  :value="getNumericCellDisplay(`d_${row.uid}_G`, row.tienThuHo)"
                  @focus="onNumericCellFocus(`d_${row.uid}_G`, row.tienThuHo, $event)"
                  @input="onRowNumFieldInput(row, 'tienThuHo', $event.target.value)"
                  @keydown.enter="onNumericCellEnter"
                  @blur="onNumericCellBlur"
                  class="ck-cell-input is-num"
                  :class="{ 'is-overridden': !row.isManual && row.tienThuHoEdited }"
                />
                <button
                  v-if="!row.isManual && row.tienThuHoEdited"
                  type="button"
                  class="ck-reset-override"
                  title="Khôi phục tự tính Tiền thu hộ"
                  @click="resetRowTienThuHo(row)"
                >
                  ↺
                </button>
              </div>
            </td>
            <td>
              <input
                type="text"
                inputmode="decimal"
                :value="getNumericCellDisplay(`d_${row.uid}_H`, row.traShipHo)"
                @focus="onNumericCellFocus(`d_${row.uid}_H`, row.traShipHo, $event)"
                @input="onRowNumFieldInput(row, 'traShipHo', $event.target.value)"
                @keydown.enter="onNumericCellEnter"
                @blur="onNumericCellBlur"
                class="ck-cell-input is-num is-red"
              />
            </td>
            <td>
              <div class="ck-override-wrap">
                <input
                  type="text"
                  inputmode="decimal"
                  :value="getNumericCellDisplay(`d_${row.uid}_I`, row.chenhLech)"
                  @focus="onNumericCellFocus(`d_${row.uid}_I`, row.chenhLech, $event)"
                  @input="onRowNumFieldInput(row, 'chenhLech', $event.target.value)"
                  @keydown.enter="onNumericCellEnter"
                  @blur="onNumericCellBlur"
                  class="ck-cell-input is-num is-sky"
                  :class="{ 'is-overridden': !row.isManual && row.chenhLechEdited }"
                />
                <button
                  v-if="!row.isManual && row.chenhLechEdited"
                  type="button"
                  class="ck-reset-override"
                  title="Khôi phục tự tính Giá bán - Doanh thu gốc"
                  @click="resetRowChenhLech(row)"
                >
                  ↺
                </button>
              </div>
            </td>
            <td>
              <div class="ck-override-wrap">
                <input
                  type="text"
                  inputmode="decimal"
                  :value="getNumericCellDisplay(`d_${row.uid}_J`, getEffectiveRowTongCong(row))"
                  @focus="onNumericCellFocus(`d_${row.uid}_J`, getEffectiveRowTongCong(row), $event)"
                  @input="onRowTongCongInput(row, $event.target.value)"
                  @keydown.enter="onNumericCellEnter"
                  @blur="onNumericCellBlur"
                  class="ck-cell-input is-num is-bold is-green"
                  :class="{ 'is-overridden': row.tongCongOverride !== null && row.tongCongOverride !== '' }"
                />
                <button
                  v-if="row.tongCongOverride !== null && row.tongCongOverride !== ''"
                  type="button"
                  class="ck-reset-override"
                  title="Khôi phục tự tính F + I - H"
                  @click="resetRowTongCong(row)"
                >
                  ↺
                </button>
              </div>
            </td>
            <td>
              <div class="ck-override-wrap">
                <input
                  type="text"
                  inputmode="decimal"
                  :value="getNumericCellDisplay(`d_${row.uid}_K`, getEffectiveRowVnd(row))"
                  @focus="onNumericCellFocus(`d_${row.uid}_K`, getEffectiveRowVnd(row), $event)"
                  @input="onRowVndInput(row, $event.target.value)"
                  @keydown.enter="onNumericCellEnter"
                  @blur="onNumericCellBlur"
                  class="ck-cell-input is-num is-bold"
                  :class="{ 'is-overridden': row.tongCuoiVndOverride !== null && row.tongCuoiVndOverride !== '' }"
                />
                <button
                  v-if="row.tongCuoiVndOverride !== null && row.tongCuoiVndOverride !== ''"
                  type="button"
                  class="ck-reset-override"
                  title="Khôi phục tự nhân tỉ giá"
                  @click="resetRowVnd(row)"
                >
                  ↺
                </button>
              </div>
            </td>
            <td class="col-act">
              <button type="button" class="ck-row-del" title="Xóa dòng" @click="removeRow(row.uid)">
                <i class="ri-delete-bin-line"></i>
              </button>
            </td>
          </tr>
        </tbody>
        <tfoot>
          <tr>
            <td colspan="4" class="ck-foot-label">TỔNG CỘNG ({{ totals.count }} đơn)</td>
            <td class="is-num">{{ formatNum(totals.doanhThuGoc) }}</td>
            <td class="is-num is-green">{{ formatNum(totals.chietKhauGoc) }}</td>
            <td class="is-num">{{ formatNum(totals.tienThuHo) }}</td>
            <td class="is-num is-red">{{ formatNum(totals.traShipHo) }}</td>
            <td class="is-num is-sky">{{ formatNum(totals.chenhLech) }}</td>
            <td class="is-num is-green">{{ formatNum(totals.tongCong) }}</td>
            <td class="is-num is-vnd-foot">
              <div>{{ formatNum(totals.tongCuoiVnd) }} đ</div>
              <small>≈ {{ totals.tongCuoiRoundedK }}</small>
            </td>
            <td></td>
          </tr>
        </tfoot>
      </table>
      <datalist id="ck-pay-options">
        <option value="CK" />
        <option value="COD" />
      </datalist>
    </div>

    <!-- MOBILE EDITABLE CARDS -->
    <div v-if="!loading && filteredRows.length > 0" class="ck-mobile-cards">
      <div v-for="row in filteredRows" :key="`m_${row.uid}`" class="ck-m-card">
        <div class="ck-m-head">
          <div class="ck-m-id-group">
            <span class="ck-m-stt-lbl">#</span>
            <input v-model="row.stt" class="ck-m-stt-inp" />
            <input v-model="row.thoiGian" class="ck-m-date-inp" placeholder="d/m/yyyy" />
            <input
              v-model="row.hinhThucTT"
              list="ck-pay-options"
              @input="onRowPaymentMethodChange(row)"
              class="ck-m-pay-inp"
            />
          </div>
          <button type="button" class="ck-row-del" @click="removeRow(row.uid)">
            <i class="ri-delete-bin-line"></i>
          </button>
        </div>

        <div class="ck-m-field">
          <div class="ck-m-field-row">
            <label>Nội dung đơn hàng</label>
            <span v-if="row.maHoaDon" class="ck-order-tag">#{{ row.maHoaDon }}</span>
          </div>
          <textarea
            v-model="row.noiDung"
            rows="4"
            class="ck-cell-textarea"
            @input="row.noiDungEdited = true"
          ></textarea>
        </div>

        <div class="ck-m-nums">
          <div class="ck-m-num-item">
            <label>Doanh thu gốc (E)</label>
            <input
              type="text"
              inputmode="decimal"
              :value="getNumericCellDisplay(`m_${row.uid}_E`, row.doanhThuGoc)"
              @focus="onNumericCellFocus(`m_${row.uid}_E`, row.doanhThuGoc, $event)"
              @input="onRowNumFieldInput(row, 'doanhThuGoc', $event.target.value)"
              @keydown.enter="onNumericCellEnter"
              @blur="onNumericCellBlur"
              class="ck-cell-input is-num"
            />
          </div>
          <div class="ck-m-num-item">
            <label>Chiết khấu gốc (F)</label>
            <div class="ck-f-cell">
              <div class="ck-override-wrap">
                <input
                  type="text"
                  inputmode="decimal"
                  :value="getNumericCellDisplay(`m_${row.uid}_F`, row.chietKhauGoc)"
                  @focus="onNumericCellFocus(`m_${row.uid}_F`, row.chietKhauGoc, $event)"
                  @input="onRowNumFieldInput(row, 'chietKhauGoc', $event.target.value)"
                  @keydown.enter="onNumericCellEnter"
                  @blur="onNumericCellBlur"
                  class="ck-cell-input is-num is-green"
                  :class="{ 'is-overridden': row.chietKhauEdited && (!row.isManual || row.chietKhauMode === 'by_percent') }"
                />
                <button
                  v-if="row.chietKhauEdited && (!row.isManual || row.chietKhauMode === 'by_percent')"
                  type="button"
                  class="ck-reset-override"
                  @click="resetRowChietKhau(row)"
                >
                  ↺
                </button>
              </div>
              <div class="ck-row-ck-bar">
                <div class="ck-row-seg">
                  <button
                    type="button"
                    :class="{ active: (row.chietKhauMode || 'by_item') === 'by_item' }"
                    @click="setRowDiscountMode(row, 'by_item')"
                  >
                    Món
                  </button>
                  <button
                    type="button"
                    :class="{ active: row.chietKhauMode === 'by_percent' }"
                    @click="setRowDiscountMode(row, 'by_percent')"
                  >
                    % đơn
                  </button>
                </div>
                <div v-if="row.chietKhauMode === 'by_percent'" class="ck-row-pct-wrap">
                  <input
                    type="text"
                    inputmode="decimal"
                    :value="getNumericCellDisplay(`m_${row.uid}_pct`, row.chietKhauPercent ?? 10)"
                    @focus="onNumericCellFocus(`m_${row.uid}_pct`, row.chietKhauPercent ?? 10, $event)"
                    @input="onRowDiscountPercentInput(row, $event.target.value)"
                    @keydown.enter="onNumericCellEnter"
                    @blur="onNumericCellBlur"
                    class="ck-row-pct-inp"
                  />
                  <span>%</span>
                </div>
              </div>
            </div>
          </div>
          <div class="ck-m-num-item">
            <label>Tiền thu hộ (G)</label>
            <div class="ck-override-wrap">
              <input
                type="text"
                inputmode="decimal"
                :value="getNumericCellDisplay(`m_${row.uid}_G`, row.tienThuHo)"
                @focus="onNumericCellFocus(`m_${row.uid}_G`, row.tienThuHo, $event)"
                @input="onRowNumFieldInput(row, 'tienThuHo', $event.target.value)"
                @keydown.enter="onNumericCellEnter"
                @blur="onNumericCellBlur"
                class="ck-cell-input is-num"
                :class="{ 'is-overridden': !row.isManual && row.tienThuHoEdited }"
              />
              <button
                v-if="!row.isManual && row.tienThuHoEdited"
                type="button"
                class="ck-reset-override"
                @click="resetRowTienThuHo(row)"
              >
                ↺
              </button>
            </div>
          </div>
          <div class="ck-m-num-item">
            <label>Trả ship hộ (H)</label>
            <input
              type="text"
              inputmode="decimal"
              :value="getNumericCellDisplay(`m_${row.uid}_H`, row.traShipHo)"
              @focus="onNumericCellFocus(`m_${row.uid}_H`, row.traShipHo, $event)"
              @input="onRowNumFieldInput(row, 'traShipHo', $event.target.value)"
              @keydown.enter="onNumericCellEnter"
              @blur="onNumericCellBlur"
              class="ck-cell-input is-num is-red"
            />
          </div>
          <div class="ck-m-num-item">
            <label>Chênh lệch (I)</label>
            <div class="ck-override-wrap">
              <input
                type="text"
                inputmode="decimal"
                :value="getNumericCellDisplay(`m_${row.uid}_I`, row.chenhLech)"
                @focus="onNumericCellFocus(`m_${row.uid}_I`, row.chenhLech, $event)"
                @input="onRowNumFieldInput(row, 'chenhLech', $event.target.value)"
                @keydown.enter="onNumericCellEnter"
                @blur="onNumericCellBlur"
                class="ck-cell-input is-num is-sky"
                :class="{ 'is-overridden': !row.isManual && row.chenhLechEdited }"
              />
              <button
                v-if="!row.isManual && row.chenhLechEdited"
                type="button"
                class="ck-reset-override"
                @click="resetRowChenhLech(row)"
              >
                ↺
              </button>
            </div>
          </div>
          <div class="ck-m-num-item">
            <label>Tổng cộng (J)</label>
            <div class="ck-override-wrap">
              <input
                type="text"
                inputmode="decimal"
                :value="getNumericCellDisplay(`m_${row.uid}_J`, getEffectiveRowTongCong(row))"
                @focus="onNumericCellFocus(`m_${row.uid}_J`, getEffectiveRowTongCong(row), $event)"
                @input="onRowTongCongInput(row, $event.target.value)"
                @keydown.enter="onNumericCellEnter"
                @blur="onNumericCellBlur"
                class="ck-cell-input is-num is-bold is-green"
                :class="{ 'is-overridden': row.tongCongOverride !== null && row.tongCongOverride !== '' }"
              />
              <button
                v-if="row.tongCongOverride !== null && row.tongCongOverride !== ''"
                type="button"
                class="ck-reset-override"
                @click="resetRowTongCong(row)"
              >
                ↺
              </button>
            </div>
          </div>
          <div class="ck-m-num-item span-2">
            <label>Tổng cuối VND (K · ×{{ exchangeRate || 0 }})</label>
            <div class="ck-override-wrap">
              <input
                type="text"
                inputmode="decimal"
                :value="getNumericCellDisplay(`m_${row.uid}_K`, getEffectiveRowVnd(row))"
                @focus="onNumericCellFocus(`m_${row.uid}_K`, getEffectiveRowVnd(row), $event)"
                @input="onRowVndInput(row, $event.target.value)"
                @keydown.enter="onNumericCellEnter"
                @blur="onNumericCellBlur"
                class="ck-cell-input is-num is-bold"
                :class="{ 'is-overridden': row.tongCuoiVndOverride !== null && row.tongCuoiVndOverride !== '' }"
              />
              <button
                v-if="row.tongCuoiVndOverride !== null && row.tongCuoiVndOverride !== ''"
                type="button"
                class="ck-reset-override"
                @click="resetRowVnd(row)"
              >
                ↺
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- MODAL EXPANDED CONTENT EDITOR -->
    <div v-if="editingContentRowId" class="ck-modal-overlay" @click.self="editingContentRowId = ''">
      <div class="ck-modal">
        <div class="ck-modal-head">
          <h3><i class="ri-file-edit-line"></i> Chỉnh sửa nội dung đơn hàng</h3>
          <button type="button" class="ck-modal-close" @click="editingContentRowId = ''">✕</button>
        </div>
        <textarea v-model="editingContentDraft" rows="12" class="ck-modal-textarea"></textarea>
        <div class="ck-modal-foot">
          <button type="button" class="ck-btn ck-btn-ghost" @click="editingContentRowId = ''">Hủy</button>
          <button type="button" class="ck-btn ck-btn-export" @click="saveContentModal">Áp dụng</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.ck-page {
  min-height: 100vh;
  background: rgb(15, 23, 42);
  color: #e2e8f0;
  padding: 20px 22px 48px;
  font-family: 'Be Vietnam Pro', -apple-system, BlinkMacSystemFont, sans-serif;
  box-sizing: border-box;
}

.ck-toast {
  position: fixed;
  top: 18px;
  right: 18px;
  z-index: 9999;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 11px 16px;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 700;
  color: #f8fafc;
  background: rgba(15, 23, 42, 0.96);
  border: 1px solid rgba(34, 197, 94, 0.55);
  box-shadow: 0 14px 30px rgba(0, 0, 0, 0.45);
}

.ck-toast.is-error {
  border-color: rgba(239, 68, 68, 0.65);
  color: #fecaca;
}

.ck-toast.is-warn {
  border-color: rgba(245, 158, 11, 0.65);
  color: #fde68a;
}

.ck-toast-enter-active,
.ck-toast-leave-active {
  transition: all 0.2s ease;
}

.ck-toast-enter-from,
.ck-toast-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

.ck-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 14px;
  margin-bottom: 16px;
}

.ck-title-wrap {
  display: flex;
  align-items: center;
  gap: 12px;
}

.ck-title-ico {
  width: 46px;
  height: 46px;
  border-radius: 12px;
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.25), rgba(5, 150, 105, 0.35));
  border: 1px solid rgba(52, 211, 153, 0.45);
  color: #4ade80;
  font-size: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.ck-title-wrap h1 {
  margin: 0;
  font-size: 21px;
  font-weight: 800;
  color: #f8fafc;
}

.ck-title-wrap p {
  margin: 4px 0 0;
  font-size: 12.5px;
  color: #94a3b8;
}

.ck-title-wrap code {
  color: #86efac;
  background: rgba(34, 197, 94, 0.14);
  padding: 1px 6px;
  border-radius: 5px;
}

.ck-header-actions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.ck-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 38px;
  padding: 0 14px;
  border-radius: 10px;
  border: 1px solid transparent;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.16s ease;
}

.ck-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.ck-btn-sm {
  height: 32px;
  padding: 0 10px;
  font-size: 12px;
}

.ck-btn-ghost {
  background: rgba(30, 41, 59, 0.85);
  border-color: rgba(148, 163, 184, 0.26);
  color: #cbd5e1;
}

.ck-btn-ghost:hover:not(:disabled) {
  border-color: rgba(148, 163, 184, 0.5);
  color: #f8fafc;
}

.ck-btn-save {
  background: rgba(56, 189, 248, 0.16);
  border-color: rgba(56, 189, 248, 0.45);
  color: #7dd3fc;
}

.ck-btn-save:hover:not(:disabled) {
  background: rgba(56, 189, 248, 0.25);
}

.ck-btn-export {
  background: linear-gradient(135deg, #10b981, #059669);
  color: #ffffff;
  box-shadow: 0 6px 16px rgba(16, 185, 129, 0.28);
}

.ck-btn-export:hover:not(:disabled) {
  filter: brightness(1.06);
}

/* TOOLBAR */
.ck-toolbar-card {
  background: rgba(30, 41, 59, 0.65);
  border: 1px solid rgba(148, 163, 184, 0.16);
  border-radius: 14px;
  padding: 14px;
  margin-bottom: 14px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.ck-preset-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.ck-preset-lbl {
  font-size: 12px;
  font-weight: 700;
  color: #94a3b8;
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.ck-preset-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.ck-chip {
  height: 28px;
  padding: 0 10px;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.25);
  background: rgba(15, 23, 42, 0.72);
  color: #cbd5e1;
  font-size: 11.5px;
  font-weight: 700;
  cursor: pointer;
}

.ck-chip:hover {
  border-color: rgba(52, 211, 153, 0.55);
  color: #6ee7b7;
}

.ck-controls-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
}

.ck-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.ck-field label {
  font-size: 11px;
  font-weight: 700;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.35px;
}

.ck-field input,
.ck-field select {
  height: 36px;
  padding: 0 10px;
  border-radius: 8px;
  border: 1px solid rgba(148, 163, 184, 0.24);
  background: rgba(15, 23, 42, 0.85);
  color: #f8fafc;
  font-size: 13px;
  font-weight: 600;
  min-width: 0;
}

.ck-field input:focus,
.ck-field select:focus {
  outline: none;
  border-color: #22c55e;
}

.ck-seg {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4px;
  padding: 3px;
  height: 36px;
  border-radius: 8px;
  background: rgba(15, 23, 42, 0.85);
  border: 1px solid rgba(148, 163, 184, 0.24);
}

.ck-seg button {
  border: none;
  border-radius: 6px;
  background: transparent;
  color: #94a3b8;
  font-size: 11.5px;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
}

.ck-seg button.active {
  background: rgba(16, 185, 129, 0.25);
  color: #6ee7b7;
}

.ck-sub-actions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  padding-top: 4px;
  border-top: 1px dashed rgba(148, 163, 184, 0.16);
}

.ck-mini-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  height: 32px;
  padding: 0 11px;
  border-radius: 8px;
  border: 1px solid rgba(148, 163, 184, 0.24);
  background: rgba(15, 23, 42, 0.72);
  color: #cbd5e1;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
}

.ck-mini-btn.is-primary {
  background: rgba(16, 185, 129, 0.18);
  border-color: rgba(52, 211, 153, 0.45);
  color: #6ee7b7;
}

.ck-mini-btn.is-warn {
  background: rgba(245, 158, 11, 0.15);
  border-color: rgba(251, 191, 36, 0.4);
  color: #fcd34d;
}

/* KPI GRID */
.ck-kpi-grid {
  display: grid;
  grid-template-columns: repeat(8, minmax(0, 1fr));
  gap: 8px;
  margin-bottom: 14px;
}

.ck-kpi {
  background: rgba(30, 41, 59, 0.6);
  border: 1px solid rgba(148, 163, 184, 0.14);
  border-radius: 10px;
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}

.ck-kpi.is-highlight {
  border-color: rgba(34, 197, 94, 0.42);
  background: rgba(16, 185, 129, 0.12);
}

.ck-kpi.is-highlight-vnd {
  border-color: rgba(56, 189, 248, 0.45);
  background: rgba(14, 165, 233, 0.14);
}

.ck-kpi-lbl {
  font-size: 10.5px;
  color: #94a3b8;
  font-weight: 600;
}

.ck-kpi-val {
  font-size: 15px;
  font-weight: 800;
  color: #f8fafc;
  font-variant-numeric: tabular-nums;
}

.ck-kpi-sub {
  font-size: 11px;
  font-weight: 700;
  color: #7dd3fc;
}

.is-green { color: #4ade80 !important; }
.is-red { color: #f87171 !important; }
.is-sky { color: #38bdf8 !important; }

/* SAVED PERIODS */
.ck-saved-box {
  background: rgba(30, 41, 59, 0.55);
  border: 1px solid rgba(148, 163, 184, 0.16);
  border-radius: 12px;
  padding: 10px 12px;
  margin-bottom: 14px;
}

.ck-saved-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 8px;
}

.ck-saved-title {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12.5px;
  font-weight: 700;
  color: #cbd5e1;
}

.ck-saved-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.ck-saved-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  border-radius: 9px;
  border: 1px solid rgba(148, 163, 184, 0.22);
  background: rgba(15, 23, 42, 0.8);
}

.ck-saved-pill.active {
  border-color: rgba(56, 189, 248, 0.65);
  background: rgba(14, 165, 233, 0.16);
}

.ck-saved-open {
  border: none;
  background: transparent;
  color: #e2e8f0;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  cursor: pointer;
  padding: 2px 4px;
}

.ck-saved-open strong {
  font-size: 12.5px;
  color: #f8fafc;
}

.ck-saved-open span {
  font-size: 10.5px;
  color: #94a3b8;
}

.ck-saved-del {
  border: none;
  background: rgba(239, 68, 68, 0.15);
  color: #fca5a5;
  width: 22px;
  height: 22px;
  border-radius: 6px;
  cursor: pointer;
}

/* TABLE */
.ck-table-wrap {
  background: rgba(30, 41, 59, 0.55);
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 14px;
  overflow-x: auto;
}

.ck-table {
  width: 100%;
  min-width: 1260px;
  border-collapse: collapse;
}

.ck-table th {
  background: rgba(2, 6, 23, 0.72);
  color: #cbd5e1;
  font-size: 11.5px;
  font-weight: 800;
  text-transform: uppercase;
  padding: 10px 8px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.2);
  text-align: center;
  white-space: nowrap;
}

.ck-table td {
  padding: 7px 6px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.1);
  vertical-align: top;
}

.ck-table tr.is-manual-row {
  background: rgba(56, 189, 248, 0.05);
}

.col-stt { width: 54px; }
.col-date { width: 104px; }
.col-content { width: 320px; min-width: 280px; }
.col-pay { width: 74px; }
.col-num { width: 100px; }
.col-ck { width: 128px; min-width: 124px; }
.col-vnd { width: 120px; }
.col-act { width: 40px; text-align: center; }

.ck-cell-input {
  width: 100%;
  height: 34px;
  padding: 0 7px;
  border-radius: 7px;
  border: 1px solid rgba(148, 163, 184, 0.2);
  background: rgba(15, 23, 42, 0.75);
  color: #f8fafc;
  font-size: 12.5px;
  font-weight: 600;
  box-sizing: border-box;
}

.ck-cell-input:focus,
.ck-cell-textarea:focus {
  outline: none;
  border-color: #22c55e;
  background: rgba(15, 23, 42, 0.96);
}

.ck-cell-input.is-center { text-align: center; }
.ck-cell-input.is-num { text-align: right; font-variant-numeric: tabular-nums; }
.ck-cell-input.is-bold { font-weight: 800; }
.ck-cell-input.is-overridden {
  border-color: rgba(251, 191, 36, 0.65);
  background: rgba(245, 158, 11, 0.1);
}

.ck-content-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.ck-cell-textarea {
  width: 100%;
  min-height: 76px;
  padding: 6px 8px;
  border-radius: 7px;
  border: 1px solid rgba(148, 163, 184, 0.2);
  background: rgba(15, 23, 42, 0.75);
  color: #f1f5f9;
  font-size: 12px;
  line-height: 1.4;
  font-family: inherit;
  resize: vertical;
  box-sizing: border-box;
}

.ck-content-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
}

.ck-order-tag {
  font-size: 10.5px;
  font-weight: 700;
  color: #94a3b8;
  background: rgba(15, 23, 42, 0.6);
  padding: 1px 6px;
  border-radius: 5px;
}

.ck-order-tag.is-manual {
  color: #7dd3fc;
  background: rgba(14, 165, 233, 0.16);
}

.ck-expand-btn {
  border: none;
  background: transparent;
  color: #7dd3fc;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 3px;
}

.ck-override-wrap {
  position: relative;
  display: flex;
  align-items: center;
}

.ck-reset-override {
  position: absolute;
  left: 3px;
  top: 50%;
  transform: translateY(-50%);
  width: 18px;
  height: 18px;
  border-radius: 5px;
  border: none;
  background: rgba(245, 158, 11, 0.25);
  color: #fde68a;
  font-size: 11px;
  cursor: pointer;
  padding: 0;
}

.ck-override-wrap .ck-cell-input.is-overridden {
  padding-left: 24px;
}

.ck-f-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.ck-row-ck-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 4px;
  flex-wrap: wrap;
}

.ck-row-seg {
  display: inline-flex;
  background: rgba(15, 23, 42, 0.9);
  border: 1px solid rgba(148, 163, 184, 0.22);
  border-radius: 6px;
  padding: 1px;
  gap: 1px;
}

.ck-row-seg button {
  border: none;
  background: transparent;
  color: #94a3b8;
  font-size: 10px;
  font-weight: 700;
  line-height: 1.2;
  padding: 2px 5px;
  border-radius: 4px;
  cursor: pointer;
  white-space: nowrap;
}

.ck-row-seg button.active {
  background: rgba(34, 197, 94, 0.22);
  color: #86efac;
}

.ck-row-pct-wrap {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  background: rgba(15, 23, 42, 0.85);
  border: 1px solid rgba(34, 197, 94, 0.35);
  border-radius: 6px;
  padding: 1px 4px 1px 2px;
}

.ck-row-pct-wrap span {
  font-size: 10.5px;
  font-weight: 800;
  color: #86efac;
}

.ck-row-pct-inp {
  width: 34px;
  height: 18px;
  padding: 0 2px;
  border: none;
  background: transparent;
  color: #f8fafc;
  font-size: 11px;
  font-weight: 700;
  text-align: right;
  font-variant-numeric: tabular-nums;
}

.ck-row-pct-inp:focus {
  outline: none;
}

.ck-row-del {
  width: 30px;
  height: 30px;
  border-radius: 7px;
  border: 1px solid rgba(239, 68, 68, 0.3);
  background: rgba(239, 68, 68, 0.12);
  color: #fca5a5;
  cursor: pointer;
}

.ck-table tfoot td {
  background: rgba(2, 6, 23, 0.85);
  padding: 11px 8px;
  font-weight: 800;
  font-size: 13px;
  border-top: 2px solid rgba(34, 197, 94, 0.35);
}

.ck-foot-label {
  color: #cbd5e1;
  text-align: right;
  padding-right: 12px !important;
}

.ck-table tfoot .is-num {
  text-align: right;
  font-variant-numeric: tabular-nums;
}

.is-vnd-foot {
  color: #7dd3fc;
}

.is-vnd-foot small {
  display: block;
  font-size: 10.5px;
  color: #94a3b8;
}

/* STATE BOXES */
.ck-state-box {
  background: rgba(30, 41, 59, 0.55);
  border: 1px dashed rgba(148, 163, 184, 0.25);
  border-radius: 14px;
  padding: 40px 16px;
  text-align: center;
  color: #94a3b8;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.ck-state-box i {
  font-size: 32px;
  color: #64748b;
}

.ck-spinner {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 3px solid rgba(34, 197, 94, 0.2);
  border-top-color: #22c55e;
  animation: ckSpin 0.8s linear infinite;
}

@keyframes ckSpin {
  to { transform: rotate(360deg); }
}

/* MOBILE CARDS */
.ck-mobile-cards {
  display: none;
}

/* MODAL */
.ck-modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 9998;
  background: rgba(2, 6, 23, 0.78);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}

.ck-modal {
  width: 100%;
  max-width: 640px;
  background: #0f172a;
  border: 1px solid rgba(148, 163, 184, 0.28);
  border-radius: 16px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.ck-modal-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.ck-modal-head h3 {
  margin: 0;
  font-size: 16px;
  color: #f8fafc;
  display: flex;
  align-items: center;
  gap: 8px;
}

.ck-modal-close {
  width: 32px;
  height: 32px;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.25);
  background: rgba(30, 41, 59, 0.8);
  color: #cbd5e1;
  cursor: pointer;
}

.ck-modal-textarea {
  width: 100%;
  min-height: 260px;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid rgba(148, 163, 184, 0.25);
  background: rgba(2, 6, 23, 0.85);
  color: #f8fafc;
  font-family: inherit;
  font-size: 13.5px;
  line-height: 1.5;
  box-sizing: border-box;
}

.ck-modal-foot {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

@media (max-width: 1200px) {
  .ck-controls-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .ck-kpi-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

@media (max-width: 768px) {
  .ck-page {
    padding: 14px 12px;
  }

  .ck-controls-grid {
    grid-template-columns: 1fr;
  }

  .ck-kpi-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .ck-table-wrap {
    display: none;
  }

  .ck-mobile-cards {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .ck-m-card {
    background: rgba(30, 41, 59, 0.65);
    border: 1px solid rgba(148, 163, 184, 0.18);
    border-radius: 14px;
    padding: 12px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .ck-m-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }

  .ck-m-id-group {
    display: flex;
    align-items: center;
    gap: 6px;
    flex: 1;
    min-width: 0;
  }

  .ck-m-stt-lbl {
    font-size: 12px;
    font-weight: 800;
    color: #94a3b8;
  }

  .ck-m-stt-inp,
  .ck-m-date-inp,
  .ck-m-pay-inp {
    height: 34px;
    padding: 0 7px;
    border-radius: 8px;
    border: 1px solid rgba(148, 163, 184, 0.22);
    background: rgba(15, 23, 42, 0.85);
    color: #f8fafc;
    font-size: 13px;
    font-weight: 700;
    min-width: 0;
  }

  .ck-m-stt-inp { width: 46px; text-align: center; }
  .ck-m-date-inp { flex: 1; }
  .ck-m-pay-inp { width: 66px; text-align: center; }

  .ck-m-field {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .ck-m-field-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .ck-m-field label,
  .ck-m-num-item label {
    font-size: 11px;
    font-weight: 700;
    color: #94a3b8;
  }

  .ck-m-nums {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px;
  }

  .ck-m-num-item {
    display: flex;
    flex-direction: column;
    gap: 3px;
  }

  .ck-m-num-item.span-2 {
    grid-column: span 2;
  }

  .ck-row-seg button {
    font-size: 11px;
    padding: 3px 6px;
  }

  .ck-row-pct-inp {
    width: 48px;
    height: 24px;
  }
}
</style>
