// src/utils/productCode.js

export function normalizeProductNameKey(rawName) {
  return String(rawName ?? '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase()
}

export function genBaseProductCode(tenHang) {
  const clean = String(tenHang || '').trim()
  if (!clean) return ''
  const ascii = clean
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
  const code = ascii
    .split(/\s+/)
    .map((w) => w.replace(/[^a-zA-Z0-9]/g, '')[0]?.toUpperCase())
    .filter(Boolean)
    .join('')
  return code || 'SP'
}

export function buildUniqueProductCode(
  baseOrName,
  existingCodesIterable = [],
  { treatInputAsBase = false } = {},
) {
  const rawBase = treatInputAsBase
    ? String(baseOrName || '').trim() || 'SP'
    : genBaseProductCode(baseOrName) || 'SP'
  const base = rawBase.replace(/_\d+$/, '') || rawBase

  const usedSet = new Set()
  for (const code of existingCodesIterable || []) {
    const clean = String(code ?? '').trim()
    if (clean) usedSet.add(clean)
  }

  if (!usedSet.has(rawBase)) return rawBase

  let suffix = 1
  while (usedSet.has(`${base}_${suffix}`)) {
    suffix += 1
  }
  return `${base}_${suffix}`
}

function collectProductNameKeys(item) {
  const keys = new Set()
  const add = (val) => {
    const k = normalizeProductNameKey(val)
    if (k) keys.add(k)
  }
  add(item?.Ten_hang)
  add(item?._tenVi)
  const i18n = item?.i18n
  if (i18n && typeof i18n === 'object') {
    for (const langObj of Object.values(i18n)) {
      if (langObj && typeof langObj === 'object') {
        add(langObj.Ten_hang)
      }
    }
  }
  return keys
}

export function findDuplicateProductMatch({
  tenHang = '',
  maHang = '',
  catalog = [],
  pending = [],
} = {}) {
  const cleanCode = String(maHang ?? '').trim()
  const targetNameKey = normalizeProductNameKey(tenHang)

  const checkList = (items, source) => {
    if (!Array.isArray(items) || !items.length) return null

    if (cleanCode) {
      const codeHit = items.find((p) => String(p?.Ma_hang ?? '').trim() === cleanCode)
      if (codeHit) {
        return { matched: codeHit, matchSource: source, matchReason: 'code' }
      }
    }

    if (targetNameKey) {
      const nameHit = items.find((p) => collectProductNameKeys(p).has(targetNameKey))
      if (nameHit) {
        return { matched: nameHit, matchSource: source, matchReason: 'name' }
      }
    }

    return null
  }

  return checkList(pending, 'pending') || checkList(catalog, 'db')
}
