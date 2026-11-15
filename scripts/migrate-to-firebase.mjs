// scripts/migrate-to-firebase.mjs
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import XLSX from 'xlsx'
import { initializeApp } from 'firebase/app'
import { getDatabase, ref, set, get } from 'firebase/database'
import {
  CATEGORY_TRANSLATIONS,
  UNIT_TRANSLATIONS,
  DISH_TRANSLATIONS_BY_MA,
  NOTICE_TRANSLATIONS,
  PROMO_TRANSLATIONS,
} from './translations-5lang.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT_DIR = path.resolve(__dirname, '..')
const EXCEL_PATH = path.join(ROOT_DIR, 'SA KITCHEN.xlsx')
const SEED_JSON_PATH = path.join(ROOT_DIR, 'firebase-seed.json')

const firebaseConfig = {
  apiKey: 'AIzaSyCh88YjlsGOawKWPi6Uj63b9gBxIX4iME0',
  authDomain: 'sakitchen.firebaseapp.com',
  databaseURL: 'https://sakitchen-default-rtdb.asia-southeast1.firebasedatabase.app',
  projectId: 'sakitchen',
  storageBucket: 'sakitchen.firebasestorage.app',
  messagingSenderId: '204680614901',
  appId: '1:204680614901:web:ff4d0a1c972e764fab06bc',
  measurementId: 'G-G23RNKHGRC',
}

const LEGACY_DROPPED_SHEETS = new Set([
  'nha_cung_cap',
  'bao_cao_rieng',
  'ghi_chu',
  'footer',
])

const STRIPPED_COLUMNS = new Set(['Ma_nha_cung_cap', 'Ten_nha_cung_cap', 'So_luong_kho'])

const STRING_FIELDS = new Set([
  'So_dien_thoai',
  'PASSWORD',
  'USERNAME',
  'Expired',
  'Ma_hang',
  'Ma_khach_hang',
  'Ma_hoa_don',
  'So_hoa_don',
  'Ma_dich_vu',
  'ID',
  'Ngay_tao_duong_lich',
  'Thoi_gian_nhan_hang',
  'Thoi_gian_tao_duong_lich',
])

const NUMERIC_FIELDS = new Set([
  'Gia_goc',
  'Gia_ban',
  'So_luong',
  'Giam_gia',
  'Tien_chiet_khau',
  'Thanh_tien',
  'Loi_nhuan',
  'Tra_tien',
  'Tam_tinh',
  'Tong_giam_gia',
  'Tong_tien_chiet_khau',
  'Tong_cong',
  'Tong_loi_nhuan',
  'Cong_no_hien_tai',
  'Tong_chi_tieu',
  'so_tien',
  'loi_nhuan',
  'Tong_gia_goc',
  'Tong_gia_ban',
])

function normalizeCell(key, val) {
  if (val === undefined || val === null) return ''
  if (STRING_FIELDS.has(key)) {
    return String(val).trim()
  }
  if (NUMERIC_FIELDS.has(key)) {
    if (val === '') return 0
    const num = Number(val)
    return Number.isFinite(num) ? num : 0
  }
  if (key === 'Gia_Giam' || key === 'Ti_gia' || key === 'So_tien') {
    if (String(val).trim() === '') return ''
    const num = Number(val)
    return Number.isFinite(num) ? num : String(val)
  }
  if (typeof val === 'number') {
    return Number.isFinite(val) ? val : 0
  }
  return String(val)
}

function mergeHangHoaMultiLang(rawRows) {
  const viRows = rawRows.filter((r) => (r.Lang || 'vi') === 'vi')
  const enRows = rawRows.filter((r) => r.Lang === 'en')
  const zhRows = rawRows.filter((r) => r.Lang === 'zh-CN')

  const mergedObj = {}

  viRows.forEach((vi, idx) => {
    const en = enRows[idx] || {}
    const zh = zhRows[idx] || {}
    const ma = vi.Ma_hang

    const dishExtra = DISH_TRANSLATIONS_BY_MA[ma] || {}
    const catExtra = CATEGORY_TRANSLATIONS[vi.Danh_muc] || {}
    const unitExtra = UNIT_TRANSLATIONS[vi.Dvt] || {}

    const i18n = {
      vi: {
        Ten_hang: String(vi.Ten_hang || '').trim(),
        Danh_muc: String(vi.Danh_muc || '').trim(),
        Dvt: String(vi.Dvt || '').trim(),
        Mo_ta: String(vi.Mo_ta || '').trim(),
      },
      en: {
        Ten_hang: String(en.Ten_hang || vi.Ten_hang || '').trim(),
        Danh_muc: String(en.Danh_muc || vi.Danh_muc || '').trim(),
        Dvt: String(en.Dvt || vi.Dvt || '').trim(),
        Mo_ta: String(en.Mo_ta || vi.Mo_ta || '').trim(),
      },
      'zh-CN': {
        Ten_hang: String(zh.Ten_hang || en.Ten_hang || vi.Ten_hang || '').trim(),
        Danh_muc: String(zh.Danh_muc || en.Danh_muc || vi.Danh_muc || '').trim(),
        Dvt: String(zh.Dvt || en.Dvt || vi.Dvt || '').trim(),
        Mo_ta: String(zh.Mo_ta || vi.Mo_ta || '').trim(),
      },
      fil: {
        Ten_hang: String(dishExtra.fil || en.Ten_hang || vi.Ten_hang || '').trim(),
        Danh_muc: String(catExtra.fil || en.Danh_muc || vi.Danh_muc || '').trim(),
        Dvt: String(unitExtra.fil || en.Dvt || vi.Dvt || '').trim(),
        Mo_ta: String(dishExtra.moTaFil || en.Mo_ta || vi.Mo_ta || '').trim(),
      },
      ko: {
        Ten_hang: String(dishExtra.ko || en.Ten_hang || vi.Ten_hang || '').trim(),
        Danh_muc: String(catExtra.ko || en.Danh_muc || vi.Danh_muc || '').trim(),
        Dvt: String(unitExtra.ko || en.Dvt || vi.Dvt || '').trim(),
        Mo_ta: String(dishExtra.moTaKo || en.Mo_ta || vi.Mo_ta || '').trim(),
      },
    }

    const rowKey = `r_0000000000001_${String(idx + 1).padStart(6, '0')}`
    mergedObj[rowKey] = {
      Ma_hang: ma,
      Ten_hang: i18n.vi.Ten_hang,
      Main_img: vi.Main_img || '',
      Mo_ta: i18n.vi.Mo_ta,
      Danh_muc: i18n.vi.Danh_muc,
      Size: vi.Size || '',
      Dvt: i18n.vi.Dvt,
      Gia_goc: vi.Gia_goc ?? 0,
      Gia_ban: vi.Gia_ban ?? 0,
      Trang_thai: vi.Trang_thai || 'Còn hàng',
      Don_vi_tien_te: vi.Don_vi_tien_te || 'P',
      Gia_Giam: vi.Gia_Giam ?? '',
      img_1: vi.img_1 || '',
      img_2: vi.img_2 || '',
      img_3: vi.img_3 || '',
      img_4: vi.img_4 || '',
      img_5: vi.img_5 || '',
      img_6: vi.img_6 || '',
      i18n,
    }
  })

  return mergedObj
}

function enrichNoticeMultiLang(collectionObj, dict) {
  for (const row of Object.values(collectionObj)) {
    const baseText = String(row.Noi_dung || '').trim()
    const preset = dict[row.ID] || {}
    row.i18n = {
      vi: { Noi_dung: preset.vi || baseText },
      en: { Noi_dung: preset.en || baseText },
      'zh-CN': { Noi_dung: preset['zh-CN'] || baseText },
      fil: { Noi_dung: preset.fil || preset.en || baseText },
      ko: { Noi_dung: preset.ko || preset.en || baseText },
    }
    row.Noi_dung = row.i18n.vi.Noi_dung
  }
}

function buildSeedFromExcel() {
  if (!fs.existsSync(EXCEL_PATH)) {
    throw new Error(`Không tìm thấy file Excel tại: ${EXCEL_PATH}`)
  }

  const wb = XLSX.readFile(EXCEL_PATH)
  const seed = {}
  const summary = []

  for (const sheetName of wb.SheetNames) {
    if (LEGACY_DROPPED_SHEETS.has(sheetName)) {
      continue
    }

    const ws = wb.Sheets[sheetName]
    const matrix = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '', raw: true })
    if (!matrix.length) {
      summary.push({ sheet: sheetName, count: 0 })
      continue
    }

    const rawHeaders = (matrix[0] || []).map((h) => String(h ?? '').trim())
    const rows = matrix
      .slice(1)
      .filter((r) =>
        r.slice(0, rawHeaders.length).some((cell) => String(cell ?? '').trim() !== ''),
      )

    if (!rows.length) {
      summary.push({ sheet: sheetName, count: 0 })
      continue
    }

    if (sheetName === 'hang_hoa') {
      const parsedRows = rows.map((rawRow) => {
        const obj = {}
        rawHeaders.forEach((h, cIdx) => {
          if (!h || /[.$#[\]/]/.test(h) || STRIPPED_COLUMNS.has(h)) return
          obj[h] = normalizeCell(h, rawRow[cIdx])
        })
        return obj
      })

      const mergedCollection = mergeHangHoaMultiLang(parsedRows)
      seed.hang_hoa = mergedCollection
      summary.push({
        sheet: 'hang_hoa (gộp 5 ngôn ngữ)',
        count: Object.keys(mergedCollection).length,
      })
      continue
    }

    const collectionObj = {}
    rows.forEach((rawRow, idx) => {
      const rowKey = `r_0000000000001_${String(idx + 1).padStart(6, '0')}`
      const obj = {}
      rawHeaders.forEach((h, cIdx) => {
        if (!h || /[.$#[\]/]/.test(h) || STRIPPED_COLUMNS.has(h)) return
        if (sheetName === 'bao_cao' && h === 'Cong_no_hien_tai') return
        obj[h] = normalizeCell(h, rawRow[cIdx])
      })
      collectionObj[rowKey] = obj
    })

    if (sheetName === 'thong_bao') {
      enrichNoticeMultiLang(collectionObj, NOTICE_TRANSLATIONS)
    } else if (sheetName === 'khuyenmai_info') {
      enrichNoticeMultiLang(collectionObj, PROMO_TRANSLATIONS)
    }

    seed[sheetName] = collectionObj
    summary.push({ sheet: sheetName, count: Object.keys(collectionObj).length })
  }

  return { seed, summary }
}

async function main() {
  console.log('📦 Đang đọc và chuẩn hóa dữ liệu từ SA KITCHEN.xlsx...')
  const { seed, summary } = buildSeedFromExcel()

  fs.writeFileSync(SEED_JSON_PATH, JSON.stringify(seed, null, 2), 'utf8')
  console.log(`✅ Đã xuất file JSON chuẩn Firebase tại: ${SEED_JSON_PATH}`)
  console.table(summary)

  console.log('\n🚀 Đang cập nhật dữ liệu lên Firebase Realtime Database...')
  const app = initializeApp(firebaseConfig)
  const db = getDatabase(app)

  try {
    // 1. Xóa sạch các bảng thừa từ kiến trúc cũ trên Firebase
    for (const legacySheet of LEGACY_DROPPED_SHEETS) {
      await set(ref(db, legacySheet), null)
      console.log(`  🗑️ Đã xóa bảng cũ [${legacySheet}]`)
    }

    // 2. Đồng bộ toàn bộ 15 bảng chuẩn mới
    for (const [sheetName, collectionData] of Object.entries(seed)) {
      await set(ref(db, sheetName), collectionData)
      console.log(
        `  ✔ Đã đồng bộ bảng [${sheetName}] (${Object.keys(collectionData).length} dòng)`,
      )
    }

    const checkSnap = await get(ref(db, 'hang_hoa'))
    const count = checkSnap.exists() ? Object.keys(checkSnap.val()).length : 0
    console.log(
      `\n🎉 HOÀN TẤT! Đã gộp đa ngôn ngữ & xóa sạch cột NCC trên Firebase (hang_hoa: ${count} món chuẩn 5 ngôn ngữ).`,
    )
    process.exit(0)
  } catch (err) {
    console.error(`\n⚠️ Lỗi khi ghi lên Firebase: ${err.message}`)
    process.exit(1)
  }
}

main()
