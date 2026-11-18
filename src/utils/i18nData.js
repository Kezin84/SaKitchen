// src/utils/i18nData.js

export const SUPPORTED_DATA_LANGS = [
  {
    code: 'vi',
    label: 'Tiếng Việt',
    short: 'VI',
    flagImg: 'https://flagcdn.com/w40/vn.png',
  },
  {
    code: 'en',
    label: 'English',
    short: 'EN',
    flagImg: 'https://flagcdn.com/w40/us.png',
  },
  {
    code: 'zh-CN',
    label: '中文',
    short: 'ZH',
    flagImg: 'https://flagcdn.com/w40/cn.png',
  },
  {
    code: 'fil',
    label: 'Filipino',
    short: 'FIL',
    flagImg: 'https://flagcdn.com/w40/ph.png',
  },
  {
    code: 'ko',
    label: '한국어',
    short: 'KO',
    flagImg: 'https://flagcdn.com/w40/kr.png',
  },
]

export const DATA_LANG_CODES = SUPPORTED_DATA_LANGS.map((l) => l.code)

function str(v) {
  if (v === undefined || v === null) return ''
  return String(v).trim()
}

/* =========================================================
 * PRODUCT (HANG_HOA) MULTI-LANGUAGE HELPERS
 * ========================================================= */
export function createEmptyProductI18n() {
  return {
    vi: { Ten_hang: '', Danh_muc_cha: '', Danh_muc: '', Dvt: '', Mo_ta: '' },
    en: { Ten_hang: '', Danh_muc_cha: '', Danh_muc: '', Dvt: '', Mo_ta: '' },
    'zh-CN': { Ten_hang: '', Danh_muc_cha: '', Danh_muc: '', Dvt: '', Mo_ta: '' },
    fil: { Ten_hang: '', Danh_muc_cha: '', Danh_muc: '', Dvt: '', Mo_ta: '' },
    ko: { Ten_hang: '', Danh_muc_cha: '', Danh_muc: '', Dvt: '', Mo_ta: '' },
  }
}

export function normalizeProductI18n(item = {}) {
  const raw = item?.i18n && typeof item.i18n === 'object' ? item.i18n : {}
  const base = createEmptyProductI18n()

  // Support optional flat columns (e.g. from Excel import: Ten_hang_en, Ten_hang_zh, etc.)
  const flatAliases = {
    vi: ['vi'],
    en: ['en'],
    'zh-CN': ['zh-CN', 'zh', 'cn'],
    fil: ['fil', 'ph', 'tl'],
    ko: ['ko', 'kr'],
  }

  for (const code of DATA_LANG_CODES) {
    const langObj = raw[code] && typeof raw[code] === 'object' ? raw[code] : {}
    const suffixes = flatAliases[code] || [code]

    const pickFlat = (field) => {
      for (const sfx of suffixes) {
        const candidate = item[`${field}_${sfx}`]
        if (str(candidate)) return str(candidate)
      }
      return ''
    }

    base[code] = {
      Ten_hang: str(langObj.Ten_hang) || pickFlat('Ten_hang'),
      Danh_muc_cha: str(langObj.Danh_muc_cha) || pickFlat('Danh_muc_cha'),
      Danh_muc: str(langObj.Danh_muc) || pickFlat('Danh_muc'),
      Dvt: str(langObj.Dvt) || pickFlat('Dvt'),
      Mo_ta: str(langObj.Mo_ta) || pickFlat('Mo_ta'),
    }
  }

  // Fallback root fields into 'vi' when i18n.vi is empty
  if (!base.vi.Ten_hang && str(item.Ten_hang)) base.vi.Ten_hang = str(item.Ten_hang)
  if (!base.vi.Danh_muc_cha && str(item.Danh_muc_cha)) {
    base.vi.Danh_muc_cha = str(item.Danh_muc_cha)
  }
  if (!base.vi.Danh_muc && str(item.Danh_muc)) base.vi.Danh_muc = str(item.Danh_muc)
  if (!base.vi.Dvt && str(item.Dvt)) base.vi.Dvt = str(item.Dvt)
  if (!base.vi.Mo_ta && str(item.Mo_ta)) base.vi.Mo_ta = str(item.Mo_ta)

  // If even 'vi' Ten_hang is empty, borrow first non-empty language
  if (!base.vi.Ten_hang) {
    for (const code of ['en', 'zh-CN', 'fil', 'ko']) {
      if (base[code].Ten_hang) {
        base.vi.Ten_hang = base[code].Ten_hang
        break
      }
    }
  }

  return base
}

export function syncProductWithI18n(item = {}) {
  const i18n = normalizeProductI18n(item)
  const copy = { ...item }
  delete copy.Lang
  delete copy.Ma_nha_cung_cap
  delete copy.Ten_nha_cung_cap
  delete copy.So_luong_kho
  delete copy._tenVi
  delete copy._danhMucVi
  delete copy._danhMucChaVi
  delete copy._hasExplicitMaHang
  delete copy._forceCreateNew
  delete copy._fromExisting
  delete copy._nccConflict
  for (const key of Object.keys(copy)) {
    if (/^ncc_(?:%|phan_tram)_ck$|^ncc_tien_giam$/i.test(key)) {
      delete copy[key]
    }
  }

  // Clean up any temporary flat Excel suffixes
  for (const field of ['Ten_hang', 'Danh_muc_cha', 'Danh_muc', 'Dvt', 'Mo_ta']) {
    for (const sfx of ['vi', 'en', 'zh-CN', 'zh', 'cn', 'fil', 'ph', 'tl', 'ko', 'kr']) {
      delete copy[`${field}_${sfx}`]
    }
  }

  copy.Ten_hang = i18n.vi.Ten_hang || str(item.Ten_hang)
  copy.Danh_muc_cha = i18n.vi.Danh_muc_cha || str(item.Danh_muc_cha)
  copy.Danh_muc = i18n.vi.Danh_muc || str(item.Danh_muc)
  copy.Dvt = i18n.vi.Dvt || str(item.Dvt)
  copy.Mo_ta = i18n.vi.Mo_ta || str(item.Mo_ta)
  copy.i18n = i18n
  return copy
}

export function resolveProductField(item, field, lang = 'vi') {
  const i18n = item?.i18n
  if (i18n && typeof i18n === 'object') {
    const direct = str(i18n[lang]?.[field])
    if (direct) return direct
    if (lang !== 'vi') {
      const enVal = str(i18n.en?.[field])
      if (enVal) return enVal
    }
    const viVal = str(i18n.vi?.[field])
    if (viVal) return viVal
  }
  return str(item?.[field])
}

export function localizeProduct(item, lang = 'vi') {
  if (!item) return item
  const i18n = normalizeProductI18n(item)
  const normalizedItem = { ...item, i18n }
  return {
    ...normalizedItem,
    Ten_hang: resolveProductField(normalizedItem, 'Ten_hang', lang),
    Danh_muc_cha: resolveProductField(normalizedItem, 'Danh_muc_cha', lang),
    Danh_muc: resolveProductField(normalizedItem, 'Danh_muc', lang),
    Dvt: resolveProductField(normalizedItem, 'Dvt', lang),
    Mo_ta: resolveProductField(normalizedItem, 'Mo_ta', lang),
    _tenVi: i18n.vi.Ten_hang || str(item.Ten_hang),
    _danhMucChaVi: i18n.vi.Danh_muc_cha || str(item.Danh_muc_cha),
    _danhMucVi: i18n.vi.Danh_muc || str(item.Danh_muc),
  }
}

export function getProductTranslatedLangs(item) {
  const i18n = normalizeProductI18n(item)
  return DATA_LANG_CODES.filter((code) => Boolean(str(i18n[code]?.Ten_hang)))
}

export function productMatchesKeyword(item, rawKeyword) {
  const kw = str(rawKeyword).toLowerCase()
  if (!kw) return true
  if (str(item?.Ma_hang).toLowerCase().includes(kw)) return true
  if (str(item?.Ten_hang).toLowerCase().includes(kw)) return true
  if (str(item?.Danh_muc_cha).toLowerCase().includes(kw)) return true
  if (str(item?.Danh_muc).toLowerCase().includes(kw)) return true

  const i18n = item?.i18n
  if (i18n && typeof i18n === 'object') {
    for (const code of DATA_LANG_CODES) {
      const entry = i18n[code]
      if (!entry) continue
      if (str(entry.Ten_hang).toLowerCase().includes(kw)) return true
      if (str(entry.Danh_muc_cha).toLowerCase().includes(kw)) return true
      if (str(entry.Danh_muc).toLowerCase().includes(kw)) return true
    }
  }
  return false
}

const DEFAULT_SLUG_BY_LANG = {
  vi: { parent: 'danh-muc', sub: 'mon' },
  en: { parent: 'category', sub: 'item' },
  'zh-CN': { parent: '分类', sub: '菜品' },
  fil: { parent: 'kategorya', sub: 'pagkain' },
  ko: { parent: '카테고리', sub: '메뉴' },
}

export function toUrlSlug(rawText, fallback = '') {
  const text = str(rawText)
  if (!text) return fallback
  const slug = text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
  return slug || fallback
}

function safeDecodeParam(val) {
  const raw = str(val)
  if (!raw) return ''
  try {
    return decodeURIComponent(raw)
  } catch {
    return raw
  }
}

export function getProductUrlParams(item, lang = 'vi') {
  const activeLang = DATA_LANG_CODES.includes(lang) ? lang : 'vi'
  const normalized = item?.i18n ? item : { ...item, i18n: normalizeProductI18n(item) }

  const rawName =
    resolveProductField(normalized, 'Ten_hang', activeLang) ||
    str(item?.Ten_hang) ||
    str(item?.Ma_hang)
  const productId = str(item?.Ma_hang) || toUrlSlug(rawName, 'sp')
  const productSlug = toUrlSlug(rawName, toUrlSlug(productId, 'san-pham'))

  return {
    productSlug,
    productId,
  }
}

export function getProductUrlSlugs(item, lang = 'vi') {
  const activeLang = DATA_LANG_CODES.includes(lang) ? lang : 'vi'
  const defaults = DEFAULT_SLUG_BY_LANG[activeLang] || DEFAULT_SLUG_BY_LANG.vi
  const normalized = item?.i18n ? item : { ...item, i18n: normalizeProductI18n(item) }
  const { productSlug, productId } = getProductUrlParams(normalized, activeLang)

  const rawParent =
    resolveProductField(normalized, 'Danh_muc_cha', activeLang) ||
    str(item?.Danh_muc_cha)
  const rawSub =
    resolveProductField(normalized, 'Danh_muc', activeLang) ||
    str(item?.Danh_muc)

  return {
    parentSlug: toUrlSlug(rawParent || rawSub, defaults.parent),
    subSlug: toUrlSlug(rawSub || rawParent, defaults.sub),
    productSlug,
    productId,
  }
}

export function findProductByUrlParams(items = [], params = {}, lang = 'vi') {
  const rawId = safeDecodeParam(params.productId)
  const rawSlugParam = safeDecodeParam(params.productSlug)

  // 1. Exact ID match first (guaranteed unique even when product names repeat)
  if (rawId) {
    const exact = (items || []).find((item) => str(item?.Ma_hang) === rawId)
    if (exact) return exact
    const ci = (items || []).find(
      (item) => str(item?.Ma_hang).toLowerCase() === rawId.toLowerCase(),
    )
    if (ci) return ci
  }

  // 2. Fallback: match by Ma_hang in single-param URL or by productSlug across languages
  const targetProductSlug = toUrlSlug(rawSlugParam || rawId, '')
  if (!targetProductSlug && !rawSlugParam) return null

  if (rawSlugParam) {
    const directByCode = (items || []).find(
      (item) => str(item?.Ma_hang).toLowerCase() === rawSlugParam.toLowerCase(),
    )
    if (directByCode) return directByCode
  }

  const targetSubSlug = toUrlSlug(safeDecodeParam(params.subSlug), '')
  const targetParentSlug = toUrlSlug(safeDecodeParam(params.parentSlug), '')
  const langPriority = [
    lang,
    ...DATA_LANG_CODES.filter((c) => c !== lang),
  ].filter((c) => DATA_LANG_CODES.includes(c))

  const candidates = []

  for (const item of items || []) {
    if (!item) continue
    const normalized = item.i18n ? item : { ...item, i18n: normalizeProductI18n(item) }
    const codeSlug = toUrlSlug(item.Ma_hang, '')

    let matchedName = codeSlug && codeSlug === targetProductSlug
    let matchedSub = false
    let matchedParent = false

    for (const l of langPriority) {
      const slugs = getProductUrlSlugs(normalized, l)
      if (slugs.productSlug === targetProductSlug) {
        matchedName = true
        if (targetSubSlug && slugs.subSlug === targetSubSlug) matchedSub = true
        if (targetParentSlug && slugs.parentSlug === targetParentSlug) matchedParent = true
      }
    }

    if (matchedName) {
      const score = (matchedParent ? 2 : 0) + (matchedSub ? 1 : 0)
      candidates.push({ item, score })
    }
  }

  if (!candidates.length) return null
  candidates.sort((a, b) => b.score - a.score)
  return candidates[0].item
}

export function findProductByUrlSlugs(items = [], params = {}, lang = 'vi') {
  return findProductByUrlParams(items, params, lang)
}

/* =========================================================
 * NOTICE & PROMOTION (THONG_BAO / KHUYENMAI_INFO) HELPERS
 * ========================================================= */
export function createEmptyNoticeI18n() {
  return {
    vi: { Noi_dung: '' },
    en: { Noi_dung: '' },
    'zh-CN': { Noi_dung: '' },
    fil: { Noi_dung: '' },
    ko: { Noi_dung: '' },
  }
}

export function normalizeNoticeI18n(item = {}) {
  const raw = item?.i18n && typeof item.i18n === 'object' ? item.i18n : {}
  const base = createEmptyNoticeI18n()

  for (const code of DATA_LANG_CODES) {
    const langObj = raw[code]
    if (typeof langObj === 'string') {
      base[code] = { Noi_dung: str(langObj) }
    } else if (langObj && typeof langObj === 'object') {
      base[code] = { Noi_dung: str(langObj.Noi_dung) }
    }
  }

  if (!base.vi.Noi_dung && str(item.Noi_dung)) {
    base.vi.Noi_dung = str(item.Noi_dung)
  }

  if (!base.vi.Noi_dung) {
    for (const code of ['en', 'zh-CN', 'fil', 'ko']) {
      if (base[code].Noi_dung) {
        base.vi.Noi_dung = base[code].Noi_dung
        break
      }
    }
  }

  return base
}

export function syncNoticeWithI18n(item = {}) {
  const i18n = normalizeNoticeI18n(item)
  const copy = { ...item }
  delete copy.Ma_nha_cung_cap
  delete copy.Ten_nha_cung_cap
  copy.Noi_dung = i18n.vi.Noi_dung || str(item.Noi_dung)
  copy.i18n = i18n
  return copy
}

export function resolveNoticeText(item, lang = 'vi') {
  if (!item) return ''
  const i18n = item.i18n
  if (i18n && typeof i18n === 'object') {
    const direct = str(
      typeof i18n[lang] === 'string' ? i18n[lang] : i18n[lang]?.Noi_dung,
    )
    if (direct) return direct
    if (lang !== 'vi') {
      const enVal = str(typeof i18n.en === 'string' ? i18n.en : i18n.en?.Noi_dung)
      if (enVal) return enVal
    }
    const viVal = str(typeof i18n.vi === 'string' ? i18n.vi : i18n.vi?.Noi_dung)
    if (viVal) return viVal
  }
  return str(item.Noi_dung)
}

export function getNoticeTranslatedLangs(item) {
  const i18n = normalizeNoticeI18n(item)
  return DATA_LANG_CODES.filter((code) => Boolean(str(i18n[code]?.Noi_dung)))
}
