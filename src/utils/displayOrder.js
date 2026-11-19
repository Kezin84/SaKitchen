// Shared helpers for Display Order (categories + products + MenuOnline modes)
import { normalizeThemeConfig } from './storefrontTheme'

export const DISPLAY_MODE_FLAT = 'flat' // Kiểu A: Top lên đầu -> theo thứ tự từng món
export const DISPLAY_MODE_BY_CATEGORY = 'by_category' // Kiểu B: Gom nhóm theo thứ tự Danh mục

function normalizeLocaleKey(locale = 'vi') {
  const clean = String(locale || 'vi').trim().toLowerCase()
  if (clean === 'zh' || clean === 'cn' || clean === 'zh-cn') return 'zh-CN'
  if (clean === 'ph' || clean === 'tl' || clean === 'fil') return 'fil'
  if (clean === 'kr' || clean === 'ko') return 'ko'
  if (clean === 'en') return 'en'
  return 'vi'
}

function normalizeParentMapObj(rawMap) {
  if (!rawMap || typeof rawMap !== 'object') return {}
  const out = {}
  for (const [subKey, parentVal] of Object.entries(rawMap)) {
    const cleanSub = String(subKey || '').trim()
    const cleanParent = String(parentVal || '').trim()
    if (!cleanSub || !cleanParent || cleanSub === cleanParent) continue
    out[cleanSub] = cleanParent
  }
  return out
}

function normalizeParentI18nObj(rawI18n) {
  if (!rawI18n || typeof rawI18n !== 'object') return {}
  const out = {}
  for (const [parentKey, langMap] of Object.entries(rawI18n)) {
    const cleanParent = String(parentKey || '').trim()
    if (!cleanParent || !langMap || typeof langMap !== 'object') continue
    out[cleanParent] = { ...langMap, vi: cleanParent }
  }
  return out
}

export function normalizeProductGroupsList(rawGroups) {
  if (!Array.isArray(rawGroups)) return []
  const out = []
  for (const raw of rawGroups) {
    if (!raw || typeof raw !== 'object') continue
    const items = Array.isArray(raw.items) ? raw.items : []
    const cleanItems = []
    const seen = new Set()
    for (const it of items) {
      const maHang = String(typeof it === 'string' ? it : it?.maHang || '').trim()
      if (!maHang || seen.has(maHang)) continue
      seen.add(maHang)
      cleanItems.push({
        maHang,
        shortLabel: String(typeof it === 'object' ? it?.shortLabel || '' : '').trim(),
      })
    }
    if (cleanItems.length < 2) continue
    out.push({
      id: String(raw.id || `pg_${out.length + 1}`).trim(),
      name: String(raw.name || '').trim(),
      items: cleanItems,
    })
  }
  return out
}

export function normalizeDisplayConfig(rows) {
  const list = Array.isArray(rows) ? rows : rows && typeof rows === 'object' ? [rows] : []
  const mainRow = list.find((r) => String(r?.ID || '') === 'main') || list[0] || {}
  const categoryOrder = Array.isArray(mainRow.categoryOrder)
    ? [...new Set(mainRow.categoryOrder.map((c) => String(c || '').trim()).filter(Boolean))]
    : []
  const parentMap = normalizeParentMapObj(mainRow.parentMap)
  const parentI18n = normalizeParentI18nObj(mainRow.parentI18n)
  const productGroups = normalizeProductGroupsList(mainRow.productGroups)
  const productSortMode =
    mainRow.productSortMode === DISPLAY_MODE_BY_CATEGORY
      ? DISPLAY_MODE_BY_CATEGORY
      : DISPLAY_MODE_FLAT
  const themeConfig = normalizeThemeConfig(mainRow.themeConfig)

  return {
    categoryOrder,
    parentMap,
    parentI18n,
    productGroups,
    productSortMode,
    themeConfig,
  }
}

export function getLinkedProductVariants(productCode, productGroups = [], menuItems = []) {
  const cleanCode = String(productCode || '').trim()
  if (!cleanCode || !Array.isArray(productGroups) || !productGroups.length) return []

  const matchedGroup = productGroups.find(
    (g) =>
      Array.isArray(g?.items) &&
      g.items.some((it) => String(it?.maHang || '').trim() === cleanCode),
  )
  if (!matchedGroup) return []

  const itemByCode = new Map()
  for (const item of menuItems || []) {
    const code = String(item?.Ma_hang || '').trim()
    if (code && !itemByCode.has(code)) {
      itemByCode.set(code, item)
    }
  }

  const resolved = []
  for (const entry of matchedGroup.items) {
    const code = String(entry?.maHang || '').trim()
    const item = itemByCode.get(code)
    if (!item) continue
    resolved.push({
      maHang: code,
      label: String(entry.shortLabel || '').trim() || String(item.Ten_hang || '').trim() || code,
      fullName: String(item.Ten_hang || '').trim() || code,
      item,
    })
  }

  return resolved.length >= 2 ? resolved : []
}

export function parseProductTopAt(item) {
  const val = Number(item?.Top_at || 0)
  return Number.isFinite(val) && val > 0 ? val : 0
}

export function parseProductOrder(item) {
  const val = Number(item?.Thu_tu || 0)
  return Number.isFinite(val) && val > 0 ? Math.floor(val) : Number.MAX_SAFE_INTEGER
}

export function getCanonicalCategoryName(item) {
  return String(item?._danhMucVi || item?.i18n?.vi?.Danh_muc || item?.Danh_muc || '').trim()
}

export function getCanonicalParentCategoryName(item, displayConfig = null) {
  const viSub = getCanonicalCategoryName(item)
  if (viSub && displayConfig?.parentMap && displayConfig.parentMap[viSub]) {
    return String(displayConfig.parentMap[viSub] || '').trim()
  }
  return String(
    item?._danhMucChaVi ||
      item?.i18n?.vi?.Danh_muc_cha ||
      item?.Danh_muc_cha ||
      viSub,
  ).trim()
}

export function getEffectiveParentCategory(item, displayConfig = null, locale = 'vi') {
  const viSub = getCanonicalCategoryName(item)
  const mappedParentVi =
    viSub && displayConfig?.parentMap ? String(displayConfig.parentMap[viSub] || '').trim() : ''

  if (mappedParentVi) {
    const langKey = normalizeLocaleKey(locale)
    const configuredTranslation = String(
      displayConfig?.parentI18n?.[mappedParentVi]?.[langKey] || '',
    ).trim()
    if (configuredTranslation) return configuredTranslation

    const itemParentVi = String(
      item?._danhMucChaVi || item?.i18n?.vi?.Danh_muc_cha || item?.Danh_muc_cha || '',
    ).trim()
    if (itemParentVi === mappedParentVi && String(item?.Danh_muc_cha || '').trim()) {
      return String(item.Danh_muc_cha).trim()
    }
    return mappedParentVi
  }

  return String(item?.Danh_muc_cha || item?.Danh_muc || '').trim()
}

export function sortProductsFlat(items) {
  return (items || [])
    .map((item, idx) => ({
      item,
      idx,
      topAt: parseProductTopAt(item),
      order: parseProductOrder(item),
    }))
    .sort((a, b) => {
      if (a.topAt !== b.topAt) return b.topAt - a.topAt
      if (a.order !== b.order) return a.order - b.order
      return a.idx - b.idx
    })
    .map((entry) => entry.item)
}

export function sortProductsByRankOnly(items) {
  return (items || [])
    .map((item, idx) => ({
      item,
      idx,
      order: parseProductOrder(item),
    }))
    .sort((a, b) => {
      if (a.order !== b.order) return a.order - b.order
      return a.idx - b.idx
    })
    .map((entry) => entry.item)
}

export function buildCategoryRankMap(categoryOrder = []) {
  const map = new Map()
  categoryOrder.forEach((name, idx) => {
    const clean = String(name || '').trim()
    if (clean && !map.has(clean)) {
      map.set(clean, idx)
    }
  })
  return map
}

export function buildCategoryHierarchy(
  menuItems,
  locale = 'vi',
  displayConfig = {},
  hasSale = false,
) {
  const activeLocale = String(locale || 'vi').trim() || 'vi'
  const categoryOrder = Array.isArray(displayConfig)
    ? displayConfig
    : Array.isArray(displayConfig?.categoryOrder)
      ? displayConfig.categoryOrder
      : []
  const cfgObj = Array.isArray(displayConfig) ? null : displayConfig
  const rankMap = buildCategoryRankMap(categoryOrder)
  const hasCustomOrder = rankMap.size > 0

  // Group items by localized parent display name
  const parentMap = new Map()
  for (const item of menuItems || []) {
    const parentDisplay = getEffectiveParentCategory(item, cfgObj, activeLocale)
    if (!parentDisplay || parentDisplay === 'Tất cả' || parentDisplay === 'Sale') continue
    const parentViKey = getCanonicalParentCategoryName(item, cfgObj) || parentDisplay

    if (!parentMap.has(parentDisplay)) {
      parentMap.set(parentDisplay, {
        key: parentDisplay,
        label: parentDisplay,
        viKey: parentViKey,
        isSale: false,
        count: 0,
        subMap: new Map(),
      })
    }
    const parentEntry = parentMap.get(parentDisplay)
    parentEntry.count += 1

    const subDisplay = String(item?.Danh_muc || '').trim()
    const subViKey = getCanonicalCategoryName(item) || subDisplay
    const hasExplicitParent = Boolean(
      (cfgObj?.parentMap && subViKey && cfgObj.parentMap[subViKey]) ||
        String(item?.Danh_muc_cha || '').trim(),
    )
    if (subDisplay && (hasExplicitParent || subDisplay !== parentDisplay)) {
      if (!parentEntry.subMap.has(subDisplay)) {
        parentEntry.subMap.set(subDisplay, {
          key: subDisplay,
          label: subDisplay,
          viKey: subViKey,
          count: 0,
        })
      }
      parentEntry.subMap.get(subDisplay).count += 1
    }
  }

  const entries = [...parentMap.values()].map((p) => {
    const subs = [...p.subMap.values()].sort((a, b) => {
      const rankA = rankMap.has(a.viKey) ? rankMap.get(a.viKey) : Number.MAX_SAFE_INTEGER
      const rankB = rankMap.has(b.viKey) ? rankMap.get(b.viKey) : Number.MAX_SAFE_INTEGER
      if (rankA !== rankB) return rankA - rankB
      return a.label.localeCompare(b.label, activeLocale, {
        sensitivity: 'base',
        numeric: true,
      })
    })
    return {
      key: p.key,
      label: p.label,
      viKey: p.viKey,
      isSale: false,
      count: p.count,
      subCategories: subs,
    }
  })

  if (hasSale) {
    entries.push({
      key: 'Sale',
      label: 'Sale',
      viKey: 'Sale',
      isSale: true,
      count: (menuItems || []).filter((m) => Number(m?.Gia_Giam || 0) > 0).length,
      subCategories: [],
    })
  }

  entries.sort((a, b) => {
    const rankA = rankMap.has(a.viKey) ? rankMap.get(a.viKey) : Number.MAX_SAFE_INTEGER
    const rankB = rankMap.has(b.viKey) ? rankMap.get(b.viKey) : Number.MAX_SAFE_INTEGER

    if (!hasCustomOrder) {
      if (a.viKey === 'Sale' && b.viKey !== 'Sale') return -1
      if (b.viKey === 'Sale' && a.viKey !== 'Sale') return 1
    } else if (rankA !== rankB) {
      return rankA - rankB
    } else if (a.viKey === 'Sale' && b.viKey !== 'Sale' && rankA === Number.MAX_SAFE_INTEGER) {
      return -1
    } else if (b.viKey === 'Sale' && a.viKey !== 'Sale' && rankB === Number.MAX_SAFE_INTEGER) {
      return 1
    }

    return a.label.localeCompare(b.label, activeLocale, {
      sensitivity: 'base',
      numeric: true,
    })
  })

  return entries
}

export function sortLocalizedCategories(
  menuItems,
  locale = 'vi',
  categoryOrderOrConfig = [],
  hasSale = false,
) {
  const entries = buildCategoryHierarchy(menuItems, locale, categoryOrderOrConfig, hasSale)
  return ['Tất cả', ...entries.map((e) => e.label)]
}

export function getSubCategoriesForParent(
  menuItems,
  parentCategory,
  locale = 'vi',
  categoryOrderOrConfig = [],
) {
  const cleanParent = String(parentCategory || '').trim()
  if (!cleanParent || cleanParent === 'Tất cả' || cleanParent === 'Sale') return []
  const entries = buildCategoryHierarchy(menuItems, locale, categoryOrderOrConfig, false)
  const found = entries.find((e) => e.label === cleanParent)
  return found ? found.subCategories.map((s) => s.label) : []
}

export function sortProductsByCategoryOrder(
  items,
  categoryOrderOrConfig = [],
  locale = 'vi',
) {
  const activeLocale = String(locale || 'vi').trim() || 'vi'
  const categoryOrder = Array.isArray(categoryOrderOrConfig)
    ? categoryOrderOrConfig
    : Array.isArray(categoryOrderOrConfig?.categoryOrder)
      ? categoryOrderOrConfig.categoryOrder
      : []
  const cfgObj = Array.isArray(categoryOrderOrConfig) ? null : categoryOrderOrConfig
  const rankMap = buildCategoryRankMap(categoryOrder)

  return (items || [])
    .map((item, idx) => {
      const viParent = getCanonicalParentCategoryName(item, cfgObj)
      const displayParent = getEffectiveParentCategory(item, cfgObj, activeLocale)
      const viSub = getCanonicalCategoryName(item)
      const displaySub = String(item?.Danh_muc || '').trim()

      const parentRank = !viParent
        ? Number.MAX_SAFE_INTEGER
        : rankMap.has(viParent)
          ? rankMap.get(viParent)
          : Number.MAX_SAFE_INTEGER - 1
      const subRank = !viSub
        ? Number.MAX_SAFE_INTEGER
        : rankMap.has(viSub)
          ? rankMap.get(viSub)
          : Number.MAX_SAFE_INTEGER - 1

      return {
        item,
        idx,
        viParent,
        displayParent,
        parentRank,
        viSub,
        displaySub,
        subRank,
        topAt: parseProductTopAt(item),
        order: parseProductOrder(item),
      }
    })
    .sort((a, b) => {
      if (a.parentRank !== b.parentRank) return a.parentRank - b.parentRank
      if (a.viParent !== b.viParent) {
        const cmpParent = (a.displayParent || a.viParent).localeCompare(
          b.displayParent || b.viParent,
          activeLocale,
          { sensitivity: 'base', numeric: true },
        )
        if (cmpParent !== 0) return cmpParent
      }
      if (a.subRank !== b.subRank) return a.subRank - b.subRank
      if (a.viSub !== b.viSub) {
        const cmpSub = (a.displaySub || a.viSub).localeCompare(
          b.displaySub || b.viSub,
          activeLocale,
          { sensitivity: 'base', numeric: true },
        )
        if (cmpSub !== 0) return cmpSub
      }
      if (a.topAt !== b.topAt) return b.topAt - a.topAt
      if (a.order !== b.order) return a.order - b.order
      return a.idx - b.idx
    })
    .map((entry) => entry.item)
}
