// src/utils/productExcel.js
import * as XLSXRaw from 'xlsx-js-style'
import { normalizeProductI18n } from '@/utils/i18nData'
import {
  normalizeNccDiscountType,
  normalizeNccDiscountValue,
} from '@/utils/nccDiscount'

const XLSX = XLSXRaw?.utils ? XLSXRaw : XLSXRaw?.default || XLSXRaw

export const PRODUCT_EXCEL_HEADERS = [
  'Ma_hang',
  'Ten_hang',
  'Danh_muc_cha',
  'Danh_muc',
  'Dvt',
  'Size',
  'Gia_goc',
  'Gia_ban',
  'Gia_Giam',
  'ncc_%_ck',
  'ncc_tien_giam',
  'Don_vi_tien_te',
  'Trang_thai',
  'Main_img',
  'img_1',
  'img_2',
  'img_3',
  'img_4',
  'img_5',
  'img_6',
  'Mo_ta',
  'Ten_hang_en',
  'Danh_muc_cha_en',
  'Danh_muc_en',
  'Dvt_en',
  'Mo_ta_en',
  'Ten_hang_zh',
  'Danh_muc_cha_zh',
  'Danh_muc_zh',
  'Dvt_zh',
  'Mo_ta_zh',
  'Ten_hang_fil',
  'Danh_muc_cha_fil',
  'Danh_muc_fil',
  'Dvt_fil',
  'Mo_ta_fil',
  'Ten_hang_ko',
  'Danh_muc_cha_ko',
  'Danh_muc_ko',
  'Dvt_ko',
  'Mo_ta_ko',
]

function str(v) {
  if (v === undefined || v === null) return ''
  return String(v).trim()
}

function parseExcelMoneyValue(v) {
  if (typeof v === 'number') return Number.isFinite(v) ? v : ''
  const s = str(v)
  if (!s) return ''
  const cleaned = s.replace(/[^\d.-]/g, '')
  if (!cleaned) return ''
  const num = Number(cleaned)
  return Number.isFinite(num) ? num : ''
}

function pickFirst(row, keys = []) {
  for (const k of keys) {
    if (row[k] !== undefined && row[k] !== null && String(row[k]).trim() !== '') {
      return String(row[k]).trim()
    }
  }
  return ''
}

function getRowValueCaseInsensitive(row, candidates = []) {
  if (!row || typeof row !== 'object') return undefined
  const lowerMap = new Map()
  for (const [k, v] of Object.entries(row)) {
    lowerMap.set(String(k).trim().toLowerCase(), v)
  }
  for (const key of candidates) {
    const found = lowerMap.get(String(key).trim().toLowerCase())
    if (found !== undefined) return found
  }
  return undefined
}

export function productToExcelRow(prod = {}) {
  const i18n = normalizeProductI18n(prod)
  const giaGocNum = Number(prod.Gia_goc ?? 0)
  const giaBanNum = Number(prod.Gia_ban ?? 0)
  const hasGiaGiam =
    prod.Gia_Giam !== undefined && prod.Gia_Giam !== null && String(prod.Gia_Giam).trim() !== ''
  const giaGiamNum = hasGiaGiam ? Number(prod.Gia_Giam) : ''
  const nccType = normalizeNccDiscountType(prod.Ncc_loai_giam)
  const nccVal = normalizeNccDiscountValue(prod.Ncc_gia_tri_giam)

  return {
    Ma_hang: str(prod.Ma_hang),
    Ten_hang: i18n.vi.Ten_hang || str(prod.Ten_hang),
    Danh_muc_cha: i18n.vi.Danh_muc_cha || str(prod.Danh_muc_cha),
    Danh_muc: i18n.vi.Danh_muc || str(prod.Danh_muc),
    Dvt: i18n.vi.Dvt || str(prod.Dvt),
    Size: str(prod.Size),
    Gia_goc: Number.isFinite(giaGocNum) ? giaGocNum : 0,
    Gia_ban: Number.isFinite(giaBanNum) ? giaBanNum : 0,
    Gia_Giam: hasGiaGiam && Number.isFinite(giaGiamNum) ? giaGiamNum : '',
    'ncc_%_ck': nccType === 'percent' && nccVal > 0 ? nccVal : '',
    ncc_tien_giam: nccType === 'money' && nccVal > 0 ? nccVal : '',
    Don_vi_tien_te: str(prod.Don_vi_tien_te || 'P') || 'P',
    Trang_thai: str(prod.Trang_thai) === 'Hết hàng' ? 'Hết hàng' : 'Còn hàng',
    Main_img: str(prod.Main_img),
    img_1: str(prod.img_1),
    img_2: str(prod.img_2),
    img_3: str(prod.img_3),
    img_4: str(prod.img_4),
    img_5: str(prod.img_5),
    img_6: str(prod.img_6),
    Mo_ta: i18n.vi.Mo_ta || str(prod.Mo_ta),
    Ten_hang_en: i18n.en.Ten_hang,
    Danh_muc_cha_en: i18n.en.Danh_muc_cha,
    Danh_muc_en: i18n.en.Danh_muc,
    Dvt_en: i18n.en.Dvt,
    Mo_ta_en: i18n.en.Mo_ta,
    Ten_hang_zh: i18n['zh-CN'].Ten_hang,
    Danh_muc_cha_zh: i18n['zh-CN'].Danh_muc_cha,
    Danh_muc_zh: i18n['zh-CN'].Danh_muc,
    Dvt_zh: i18n['zh-CN'].Dvt,
    Mo_ta_zh: i18n['zh-CN'].Mo_ta,
    Ten_hang_fil: i18n.fil.Ten_hang,
    Danh_muc_cha_fil: i18n.fil.Danh_muc_cha,
    Danh_muc_fil: i18n.fil.Danh_muc,
    Dvt_fil: i18n.fil.Dvt,
    Mo_ta_fil: i18n.fil.Mo_ta,
    Ten_hang_ko: i18n.ko.Ten_hang,
    Danh_muc_cha_ko: i18n.ko.Danh_muc_cha,
    Danh_muc_ko: i18n.ko.Danh_muc,
    Dvt_ko: i18n.ko.Dvt,
    Mo_ta_ko: i18n.ko.Mo_ta,
  }
}

export function normalizeImportedExcelRow(raw = {}) {
  const maHang = pickFirst(raw, ['Ma_hang', 'Mã hàng', 'Mã món', 'Mã sản phẩm'])
  const tenHang = pickFirst(raw, ['Ten_hang', 'Tên hàng', 'Tên món'])
  const danhMucCha = pickFirst(raw, ['Danh_muc_cha', 'Danh mục cha'])
  const danhMuc = pickFirst(raw, ['Danh_muc', 'Danh mục con', 'Danh mục'])
  const dvt = pickFirst(raw, ['Dvt', 'ĐVT', 'Đơn vị tính'])
  const size = pickFirst(raw, ['Size', 'Kích cỡ'])
  const mainImg = pickFirst(raw, ['Main_img', 'Main_img_url'])
  const moTa = pickFirst(raw, ['Mo_ta', 'Motahanghoa', 'Mô tả'])

  const rawCur = pickFirst(raw, ['Don_vi_tien_te', 'Tiền tệ'])
  const currency = rawCur === '₱' ? 'P' : rawCur || 'P'

  const rawGiaGoc = parseExcelMoneyValue(raw.Gia_goc ?? raw['Giá gốc'] ?? raw['Giá vốn'])
  const rawGiaBan = parseExcelMoneyValue(raw.Gia_ban ?? raw['Giá bán'])
  const rawGiaGiam = parseExcelMoneyValue(raw.Gia_Giam ?? raw['Giá giảm'])

  const pctRaw = getRowValueCaseInsensitive(raw, ['ncc_%_ck', 'ncc_phan_tram_ck'])
  const moneyRaw = getRowValueCaseInsensitive(raw, ['ncc_tien_giam'])
  const hasSplitNccCols = pctRaw !== undefined || moneyRaw !== undefined

  const pctVal = normalizeNccDiscountValue(parseExcelMoneyValue(pctRaw) || 0)
  const moneyVal = normalizeNccDiscountValue(parseExcelMoneyValue(moneyRaw) || 0)
  const hasNccConflict = pctVal > 0 && moneyVal > 0

  let nccLoaiGiam = 'percent'
  let nccGiaTriGiam = 0

  if (hasSplitNccCols) {
    if (moneyVal > 0 && pctVal <= 0) {
      nccLoaiGiam = 'money'
      nccGiaTriGiam = moneyVal
    } else if (pctVal > 0) {
      nccLoaiGiam = 'percent'
      nccGiaTriGiam = pctVal
    }
  } else {
    const legacyTypeRaw = getRowValueCaseInsensitive(raw, ['Ncc_loai_giam', 'Loại giảm NCC'])
    const legacyValRaw = getRowValueCaseInsensitive(raw, ['Ncc_gia_tri_giam', 'Giá trị giảm NCC'])
    const legacyTypeLower = str(legacyTypeRaw).toLowerCase()
    const isMoneyLegacy = ['money', 'tien', 'tiền', 'amount'].includes(legacyTypeLower)
    nccLoaiGiam = isMoneyLegacy ? 'money' : normalizeNccDiscountType(legacyTypeRaw)
    nccGiaTriGiam = normalizeNccDiscountValue(parseExcelMoneyValue(legacyValRaw) || 0)
  }

  return {
    ...raw,
    Ma_hang: maHang,
    _hasExplicitMaHang: Boolean(maHang),
    _nccConflict: hasNccConflict,
    Ten_hang: tenHang,
    Danh_muc_cha: danhMucCha,
    Danh_muc: danhMuc,
    Dvt: dvt,
    Size: size,
    Gia_goc: rawGiaGoc === '' ? 0 : rawGiaGoc,
    Gia_ban: rawGiaBan === '' ? 0 : rawGiaBan,
    Gia_Giam: rawGiaGiam === '' ? '' : rawGiaGiam,
    Ncc_loai_giam: nccLoaiGiam,
    Ncc_gia_tri_giam: nccGiaTriGiam,
    Don_vi_tien_te: currency,
    Trang_thai: pickFirst(raw, ['Trang_thai', 'Trạng thái']) === 'Hết hàng' ? 'Hết hàng' : 'Còn hàng',
    Main_img: mainImg,
    img_1: pickFirst(raw, ['img_1', 'img1_url']),
    img_2: pickFirst(raw, ['img_2', 'img2_url']),
    img_3: pickFirst(raw, ['img_3', 'img3_url']),
    img_4: pickFirst(raw, ['img_4', 'img4_url']),
    img_5: pickFirst(raw, ['img_5', 'img5_url']),
    img_6: pickFirst(raw, ['img_6', 'img6_url']),
    Mo_ta: moTa,
  }
}

export function createSampleTemplateProductRows() {
  return [
    productToExcelRow({
      Ma_hang: 'CSNMO',
      Ten_hang: 'Cơm sườn nướng mật ong',
      Danh_muc_cha: 'Đồ ăn',
      Danh_muc: 'Cơm',
      Dvt: 'Phần',
      Size: '',
      Gia_goc: 200,
      Gia_ban: 270,
      Gia_Giam: '',
      Ncc_loai_giam: 'percent',
      Ncc_gia_tri_giam: 10,
      Don_vi_tien_te: 'P',
      Trang_thai: 'Còn hàng',
      Main_img: '',
      Mo_ta: 'Sườn nướng thơm mềm ăn kèm cơm nóng',
      i18n: {
        vi: {
          Ten_hang: 'Cơm sườn nướng mật ong',
          Danh_muc_cha: 'Đồ ăn',
          Danh_muc: 'Cơm',
          Dvt: 'Phần',
          Mo_ta: 'Sườn nướng thơm mềm ăn kèm cơm nóng',
        },
        en: {
          Ten_hang: 'Honey Grilled Pork Chop Rice',
          Danh_muc_cha: 'Food',
          Danh_muc: 'Rice',
          Dvt: 'Portion',
          Mo_ta: 'Tender honey-glazed pork chop with steamed rice',
        },
        'zh-CN': {
          Ten_hang: '蜜汁烤猪排饭',
          Danh_muc_cha: '美食',
          Danh_muc: '米饭',
          Dvt: '份',
          Mo_ta: '',
        },
        fil: {
          Ten_hang: 'Kanin na may Inihaw na Pork Chop sa Pulot',
          Danh_muc_cha: 'Pagkain',
          Danh_muc: 'Kanin (Rice Meals)',
          Dvt: 'Order',
          Mo_ta: '',
        },
        ko: {
          Ten_hang: '허니 그릴 폭찹 덮밥',
          Danh_muc_cha: '식사류',
          Danh_muc: '덮밥 · 밥류',
          Dvt: '인분',
          Mo_ta: '',
        },
      },
    }),
  ]
}

const NUMERIC_COLUMNS = new Set([
  'Gia_goc',
  'Gia_ban',
  'Gia_Giam',
  'ncc_%_ck',
  'ncc_tien_giam',
])

function getHeaderFillRgb(colName) {
  if (colName.endsWith('_en')) return 'DBEAFE'
  if (colName.endsWith('_zh')) return 'FEF3C7'
  if (colName.endsWith('_fil')) return 'E0E7FF'
  if (colName.endsWith('_ko')) return 'F3E8FF'
  return 'DCFCE7'
}

export function exportProductsWorkbook({
  products = [],
  filename = 'HANG-HOA-SA-KITCHEN-5LANG.xlsx',
  sheetName = 'Hang_Hoa',
  rawRows = null,
} = {}) {
  const rows = Array.isArray(rawRows)
    ? rawRows
    : (products || []).map((p) => productToExcelRow(p))

  const ws = {}
  const encode = XLSX.utils.encode_cell
  const thinBorder = {
    top: { style: 'thin', color: { rgb: 'CBD5E1' } },
    bottom: { style: 'thin', color: { rgb: 'CBD5E1' } },
    left: { style: 'thin', color: { rgb: 'CBD5E1' } },
    right: { style: 'thin', color: { rgb: 'CBD5E1' } },
  }

  PRODUCT_EXCEL_HEADERS.forEach((col, cIdx) => {
    ws[encode({ r: 0, c: cIdx })] = {
      t: 's',
      v: col,
      s: {
        font: { name: 'Calibri', sz: 11, bold: true, color: { rgb: '0F172A' } },
        fill: { patternType: 'solid', fgColor: { rgb: getHeaderFillRgb(col) } },
        border: thinBorder,
        alignment: { horizontal: 'center', vertical: 'center' },
      },
    }
  })

  rows.forEach((rowObj, rIdx) => {
    const r = rIdx + 1
    PRODUCT_EXCEL_HEADERS.forEach((col, cIdx) => {
      const val = rowObj[col]
      if (NUMERIC_COLUMNS.has(col) && val !== '' && val !== null && val !== undefined && Number.isFinite(Number(val))) {
        ws[encode({ r, c: cIdx })] = {
          t: 'n',
          v: Number(val),
          z: '#,##0.##',
          s: {
            font: { name: 'Calibri', sz: 11, color: { rgb: '0F172A' } },
            border: thinBorder,
            numFmt: '#,##0.##',
            alignment: { horizontal: 'right', vertical: 'center' },
          },
        }
      } else {
        ws[encode({ r, c: cIdx })] = {
          t: 's',
          v: val === undefined || val === null ? '' : String(val),
          s: {
            font: { name: 'Calibri', sz: 11, color: { rgb: '0F172A' } },
            border: thinBorder,
            alignment: {
              horizontal: ['Ma_hang', 'Size', 'Don_vi_tien_te', 'Trang_thai'].includes(col)
                ? 'center'
                : 'left',
              vertical: 'center',
            },
          },
        }
      }
    })
  })

  ws['!ref'] = XLSX.utils.encode_range({
    s: { r: 0, c: 0 },
    e: { r: Math.max(0, rows.length), c: PRODUCT_EXCEL_HEADERS.length - 1 },
  })

  ws['!rows'] = [{ hpt: 28 }]
  ws['!cols'] = PRODUCT_EXCEL_HEADERS.map((col) => {
    if (
      col === 'Ma_hang' ||
      col === 'Size' ||
      col === 'Don_vi_tien_te' ||
      col === 'ncc_%_ck' ||
      col === 'ncc_tien_giam'
    ) {
      return { wch: 14 }
    }
    if (col.startsWith('Mo_ta')) return { wch: 28 }
    if (col.startsWith('Ten_hang')) return { wch: 26 }
    if (col.includes('img') || col === 'Main_img') return { wch: 24 }
    return { wch: 16 }
  })

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, sheetName)
  XLSX.writeFile(wb, filename)
}
