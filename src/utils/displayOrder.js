// Shared helpers for Display Order (categories + products + MenuOnline modes)

export const DISPLAY_MODE_FLAT = 'flat' // Kiểu A: Top lên đầu -> theo thứ tự từng món
export const DISPLAY_MODE_BY_CATEGORY = 'by_category' // Kiểu B: Gom nhóm theo thứ tự Danh mục

export function normalizeDisplayConfig(rows) {
  const list = Array.isArray(rows) ? rows : rows && typeof rows === 'object' ? [rows] : []
  const mainRow = list.find((r) => String(r?.ID || '') === 'main') || list[0] || {}
  const categoryOrder = Array.isArray(mainRow.categoryOrder)
    ? [...new Set(mainRow.categoryOrder.map((c) => String(c || '').trim()).filter(Boolean))]
    : []
  const productSortMode =
    mainRow.productSortMode === DISPLAY_MODE_BY_CATEGORY
      ? DISPLAY_MODE_BY_CATEGORY
      : DISPLAY_MODE_FLAT

  return {
    categoryOrder,
    productSortMode,
  }
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

export function sortLocalizedCategories(
  menuItems,
  locale = 'vi',
  categoryOrder = [],
  hasSale = false,
) {
  const activeLocale = String(locale || 'vi').trim() || 'vi'
  const rankMap = buildCategoryRankMap(categoryOrder)
  const hasCustomOrder = rankMap.size > 0

  // Map localized category display name -> canonical Vietnamese key
  const catMap = new Map()
  for (const item of menuItems || []) {
    const display = String(item?.Danh_muc || '').trim()
    if (!display || display === 'Tất cả' || display === 'Sale') continue
    if (!catMap.has(display)) {
      const viKey = getCanonicalCategoryName(item) || display
      catMap.set(display, viKey)
    }
  }

  const entries = [...catMap.entries()].map(([display, viKey]) => ({
    display,
    viKey,
  }))

  if (hasSale) {
    entries.push({ display: 'Sale', viKey: 'Sale' })
  }

  entries.sort((a, b) => {
    const rankA = rankMap.has(a.viKey) ? rankMap.get(a.viKey) : Number.MAX_SAFE_INTEGER
    const rankB = rankMap.has(b.viKey) ? rankMap.get(b.viKey) : Number.MAX_SAFE_INTEGER

    // If no custom order has been configured yet, keep 'Sale' right after 'Tất cả'
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

    return a.display.localeCompare(b.display, activeLocale, {
      sensitivity: 'base',
      numeric: true,
    })
  })

  return ['Tất cả', ...entries.map((e) => e.display)]
}

export function sortProductsByCategoryOrder(items, categoryOrder = [], locale = 'vi') {
  const activeLocale = String(locale || 'vi').trim() || 'vi'
  const rankMap = buildCategoryRankMap(categoryOrder)

  return (items || [])
    .map((item, idx) => {
      const viCat = getCanonicalCategoryName(item)
      const displayCat = String(item?.Danh_muc || '').trim()
      const catRank = !viCat
        ? Number.MAX_SAFE_INTEGER
        : rankMap.has(viCat)
          ? rankMap.get(viCat)
          : Number.MAX_SAFE_INTEGER - 1
      return {
        item,
        idx,
        viCat,
        displayCat,
        catRank,
        topAt: parseProductTopAt(item),
        order: parseProductOrder(item),
      }
    })
    .sort((a, b) => {
      if (a.catRank !== b.catRank) return a.catRank - b.catRank
      if (a.viCat !== b.viCat) {
        const cmp = (a.displayCat || a.viCat).localeCompare(b.displayCat || b.viCat, activeLocale, {
          sensitivity: 'base',
          numeric: true,
        })
        if (cmp !== 0) return cmp
      }
      if (a.topAt !== b.topAt) return b.topAt - a.topAt
      if (a.order !== b.order) return a.order - b.order
      return a.idx - b.idx
    })
    .map((entry) => entry.item)
}
