// src/utils/searchUtils.js
// Unified multi-language, accent-insensitive, multi-token, acronym, synonym & typo-tolerant search utilities.

const TRAD_TO_SIMP_MAP = {
  飯: '饭',
  麵: '面',
  麪: '面',
  雞: '鸡',
  豬: '猪',
  魚: '鱼',
  蝦: '虾',
  湯: '汤',
  燒: '烧',
  燉: '炖',
  鍋: '锅',
  餅: '饼',
  餃: '饺',
  點: '点',
  飲: '饮',
  鮮: '鲜',
  鹹: '咸',
  蔥: '葱',
  薑: '姜',
  鴨: '鸭',
  鵝: '鹅',
  貝: '贝',
  蠔: '蚝',
  魷: '鱿',
  鰻: '鳗',
  鮑: '鲍',
  腸: '肠',
  絲: '丝',
  條: '条',
  塊: '块',
  滷: '卤',
  醬: '酱',
  鹽: '盐',
  糰: '团',
  壽: '寿',
  凍: '冻',
  熱: '热',
  燙: '烫',
  涼: '凉',
  乾: '干',
  濕: '湿',
  紅: '红',
  綠: '绿',
  黃: '黄',
  藍: '蓝',
  銀: '银',
  葉: '叶',
  蘿: '萝',
  蔔: '卜',
  筍: '笋',
  蓮: '莲',
  蘆: '芦',
  雜: '杂',
  雙: '双',
  單: '单',
  個: '个',
  盤: '盘',
  壺: '壶',
  隻: '只',
  頭: '头',
  號: '号',
  碼: '码',
  價: '价',
  優: '优',
  買: '买',
  贈: '赠',
  滿: '满',
  減: '减',
  檸: '柠',
  檬: '檬',
  橘: '橘',
  蘋: '苹',
  芒: '芒',
  鳳: '凤',
  梨: '梨',
  桃: '桃',
  莓: '莓',
  龍: '龙',
  眼: '眼',
  荔: '荔',
  蘇: '苏',
  椒: '椒',
  臘: '腊',
  燻: '熏',
  醃: '腌',
  脆: '脆',
  滑: '滑',
  濃: '浓',
  清: '清',
  甜: '甜',
  苦: '苦',
  無: '无',
  加: '加',
  別: '别',
  特: '特',
  餐: '餐',
  菜: '菜',
}

const TRAD_REGEX = new RegExp(`[${Object.keys(TRAD_TO_SIMP_MAP).join('')}]`, 'g')

export function convertTraditionalToSimplified(str) {
  const s = String(str ?? '')
  if (!s) return ''
  return s.replace(TRAD_REGEX, (ch) => TRAD_TO_SIMP_MAP[ch] || ch)
}

/**
 * Normalize text for accent-insensitive, punctuation-tolerant, multi-script search.
 * Preserves CJK / Hangul letters via Unicode properties while stripping Latin diacritics & đ->d.
 */
export function normalizeSearchText(raw) {
  const s = convertTraditionalToSimplified(raw)
  if (!s) return ''
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function compactSearchText(raw) {
  return normalizeSearchText(raw).replace(/\s+/g, '')
}

export function tokenizeSearchText(raw) {
  const norm = normalizeSearchText(raw)
  return norm ? norm.split(' ').filter(Boolean) : []
}

/**
 * Extract acronym/initials from normalized words.
 * E.g. "Cơm ba chỉ cháy cạnh" -> "cbccc"
 */
export function toAcronym(raw) {
  const tokens = tokenizeSearchText(raw)
  if (tokens.length < 2) return ''
  return tokens.map((t) => t[0] || '').join('')
}

/**
 * Normalize phone numbers into searchable digit variants (+84/+63/0 tolerant).
 */
export function getPhoneDigitVariants(raw) {
  const digits = String(raw ?? '').replace(/\D+/g, '')
  if (!digits) return []
  const variants = new Set([digits])
  if (digits.startsWith('84') && digits.length >= 9) {
    variants.add(`0${digits.slice(2)}`)
    variants.add(digits.slice(2))
  }
  if (digits.startsWith('63') && digits.length >= 10) {
    variants.add(`0${digits.slice(2)}`)
    variants.add(digits.slice(2))
  }
  if (digits.startsWith('0') && digits.length >= 8) {
    variants.add(digits.slice(1))
  }
  return Array.from(variants)
}

export function normalizeTelegramHandle(raw) {
  return String(raw ?? '')
    .trim()
    .replace(/^@+/, '')
    .toLowerCase()
}

/**
 * Bidirectional food & POS shorthand synonyms (matched on full query or whole token only).
 */
const SYNONYM_GROUPS = [
  ['cf', 'cafe', 'coffee', 'ca phe'],
  ['ts', 'tra sua', 'milk tea', 'milktea'],
  ['bm', 'banh mi', 'banh my'],
  ['bt', 'banh trang'],
  ['com', 'rice', 'kanin'],
  ['pho', 'noodle', 'mi', 'my'],
  ['bun', 'vermicelli'],
  ['lau', 'hotpot', 'hot pot'],
  ['bia', 'beer'],
  ['nuoc ngot', 'soda', 'soft drink', 'softdrink'],
  ['ga', 'chicken', 'manok'],
  ['bo', 'beef', 'baka'],
  ['heo', 'lon', 'pork', 'baboy', 'liempo'],
  ['tom', 'shrimp', 'prawn', 'hipon'],
  ['ca', 'fish', 'isda'],
  ['muc', 'squid', 'pusit'],
  ['trung', 'egg', 'itlog'],
  ['chay', 'vegetarian', 'vegan'],
  ['goi cuon', 'spring roll', 'springroll'],
  ['cha gio', 'nem ran', 'lumpia'],
  ['nhau', 'pulutan'],
  ['ko', 'khong'],
]

const SYNONYM_LOOKUP = new Map()
for (const group of SYNONYM_GROUPS) {
  const normGroup = group.map((term) => normalizeSearchText(term)).filter(Boolean)
  for (const term of normGroup) {
    const existing = SYNONYM_LOOKUP.get(term) || new Set()
    for (const alias of normGroup) {
      if (alias !== term) existing.add(alias)
    }
    SYNONYM_LOOKUP.set(term, existing)
  }
}

export function getSynonymsForTerm(normalizedTerm) {
  const set = SYNONYM_LOOKUP.get(normalizedTerm)
  return set ? Array.from(set) : []
}

/**
 * Parse explicit POS quick-quantity syntax from a search query:
 *   "2x com suon", "2* com suon", "com suon x2", "com suon *3"
 * Does NOT hijack normal queries like "7 up" or price "270".
 */
export function parseQuickQtyQuery(rawQuery) {
  const text = String(rawQuery ?? '').trim()
  if (!text) return { qty: null, cleanQuery: '' }

  // Leading: "2x com suon" or "2* com suon"
  const lead = text.match(/^(\d{1,3})\s*[xX*×]\s+(.+)$/)
  if (lead) {
    const qty = Math.max(1, Number(lead[1]) || 1)
    const cleanQuery = lead[2].trim()
    if (cleanQuery) return { qty, cleanQuery }
  }

  // Trailing: "com suon x2" or "com suon *2"
  const trail = text.match(/^(.+?)\s+[xX*×]\s*(\d{1,3})$/)
  if (trail) {
    const qty = Math.max(1, Number(trail[2]) || 1)
    const cleanQuery = trail[1].trim()
    if (cleanQuery) return { qty, cleanQuery }
  }

  return { qty: null, cleanQuery: text }
}

/**
 * Bounded Levenshtein edit distance with fast early exit (default maxDist = 1).
 */
export function boundedLevenshtein(a, b, maxDist = 1) {
  if (a === b) return 0
  const la = a.length
  const lb = b.length
  if (Math.abs(la - lb) > maxDist) return maxDist + 1
  if (la === 0) return lb
  if (lb === 0) return la

  let prev = new Array(lb + 1)
  let curr = new Array(lb + 1)
  for (let j = 0; j <= lb; j += 1) prev[j] = j

  for (let i = 1; i <= la; i += 1) {
    curr[0] = i
    let rowMin = curr[0]
    const ca = a[i - 1]
    for (let j = 1; j <= lb; j += 1) {
      const cost = ca === b[j - 1] ? 0 : 1
      const v = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost)
      curr[j] = v
      if (v < rowMin) rowMin = v
    }
    if (rowMin > maxDist) return maxDist + 1
    const tmp = prev
    prev = curr
    curr = tmp
  }
  return prev[lb]
}

const DATA_LANGS = ['vi', 'en', 'zh-CN', 'fil', 'ko']

function getNumericQueryValue(rawQuery) {
  const cleaned = String(rawQuery ?? '')
    .trim()
    .replace(/[pPđĐ₫,.\s]+$/g, '')
    .replace(/[,.\s]/g, '')
  if (!/^\d{2,9}$/.test(cleaned)) return null
  const num = Number(cleaned)
  return Number.isFinite(num) && num > 0 ? num : null
}

function tokenMatchesFieldList(token, fieldNorms, fieldCompacts, wordSets) {
  const candidates = [token, ...getSynonymsForTerm(token)]
  for (const cand of candidates) {
    const isMultiWord = cand.includes(' ')
    const candCompact = cand.replace(/\s+/g, '')
    for (let i = 0; i < fieldNorms.length; i += 1) {
      const norm = fieldNorms[i]
      if (!norm) continue
      if (isMultiWord) {
        if (norm.includes(cand)) return true
      } else if (cand.length <= 2) {
        // Short synonyms (e.g. "ga", "bo", "ca", "ts") must match a word prefix/exact or original token
        if (cand === token) {
          if (norm.includes(cand)) return true
        } else if (wordSets[i]?.has(cand)) {
          return true
        }
      } else {
        if (norm.includes(cand) || (candCompact.length >= 3 && fieldCompacts[i].includes(candCompact))) {
          return true
        }
      }
    }
  }
  return false
}

/**
 * Score how well a product matches a search keyword.
 * Returns > 0 if matched (higher = more relevant), 0 if not matched.
 */
export function scoreProductMatch(item, rawKeyword, options = {}) {
  if (!item) return 0
  const raw = String(rawKeyword ?? '').trim()
  if (!raw) return 1

  const { activeLang = 'vi', allowFuzzy = false, preferInStock = true } = options
  const rawLower = convertTraditionalToSimplified(raw).toLowerCase()
  const normQuery = normalizeSearchText(raw)
  const compactQuery = normQuery.replace(/\s+/g, '')
  const queryTokens = normQuery ? normQuery.split(' ').filter(Boolean) : []

  if (!normQuery && !rawLower) return 0

  const codeRaw = String(item.Ma_hang || '').trim().toLowerCase()
  const codeNorm = normalizeSearchText(codeRaw)
  const codeCompact = codeNorm.replace(/\s+/g, '')

  const primaryNameRaw = convertTraditionalToSimplified(item.Ten_hang || '').toLowerCase()
  const primaryNameNorm = normalizeSearchText(item.Ten_hang)
  const primaryNameCompact = primaryNameNorm.replace(/\s+/g, '')
  const primaryAcronym = toAcronym(item.Ten_hang)

  // Collect all names across 5 languages + root
  const allNameRaws = [primaryNameRaw]
  const allNameNorms = [primaryNameNorm]
  const allNameCompacts = [primaryNameCompact]
  const allAcronyms = [primaryAcronym]

  const catNorms = [
    normalizeSearchText(item.Danh_muc_cha),
    normalizeSearchText(item.Danh_muc),
    normalizeSearchText(item._danhMucChaVi),
    normalizeSearchText(item._danhMucVi),
  ]
  const extraNorms = [
    normalizeSearchText(item.Dvt),
    normalizeSearchText(item.Size),
    normalizeSearchText(item.Mo_ta),
  ]

  const i18n = item.i18n
  if (i18n && typeof i18n === 'object') {
    const orderedLangs = [activeLang, ...DATA_LANGS.filter((c) => c !== activeLang)]
    for (const code of orderedLangs) {
      const entry = i18n[code]
      if (!entry || typeof entry !== 'object') continue
      if (entry.Ten_hang) {
        const nr = convertTraditionalToSimplified(entry.Ten_hang).toLowerCase()
        const nn = normalizeSearchText(entry.Ten_hang)
        if (nr && !allNameRaws.includes(nr)) allNameRaws.push(nr)
        if (nn && !allNameNorms.includes(nn)) {
          allNameNorms.push(nn)
          allNameCompacts.push(nn.replace(/\s+/g, ''))
          const ac = toAcronym(entry.Ten_hang)
          if (ac) allAcronyms.push(ac)
        }
      }
      if (entry.Danh_muc_cha) catNorms.push(normalizeSearchText(entry.Danh_muc_cha))
      if (entry.Danh_muc) catNorms.push(normalizeSearchText(entry.Danh_muc))
      if (entry.Dvt) extraNorms.push(normalizeSearchText(entry.Dvt))
      if (entry.Mo_ta) extraNorms.push(normalizeSearchText(entry.Mo_ta))
    }
  }

  let bestScore = 0
  const bump = (score) => {
    if (score > bestScore) bestScore = score
  }

  // 1. Product code (Ma_hang) match
  if (codeRaw) {
    if (codeRaw === rawLower || (codeCompact && codeCompact === compactQuery)) bump(1000)
    else if (codeRaw.startsWith(rawLower) || (compactQuery && codeCompact.startsWith(compactQuery))) bump(860)
    else if (codeRaw.includes(rawLower) || (compactQuery && codeCompact.includes(compactQuery))) bump(720)
  }

  // 2. Active/Primary product name direct matches
  if (primaryNameRaw) {
    if (primaryNameRaw === rawLower) bump(980)
    else if (primaryNameNorm === normQuery) bump(950)
    else if (primaryNameRaw.startsWith(rawLower)) bump(910)
    else if (normQuery && primaryNameNorm.startsWith(normQuery)) bump(870)
    else if (primaryNameRaw.includes(rawLower)) bump(800)
    else if (normQuery && primaryNameNorm.includes(normQuery)) bump(750)
    else if (compactQuery.length >= 2 && primaryNameCompact.includes(compactQuery)) bump(690)
  }

  // 3. Other languages name direct matches
  for (let i = 1; i < allNameNorms.length; i += 1) {
    const r = allNameRaws[i] || ''
    const n = allNameNorms[i] || ''
    const c = allNameCompacts[i] || ''
    if (!n) continue
    if (r === rawLower || n === normQuery) bump(840)
    else if (r.startsWith(rawLower) || (normQuery && n.startsWith(normQuery))) bump(760)
    else if (r.includes(rawLower) || (normQuery && n.includes(normQuery))) bump(680)
    else if (compactQuery.length >= 2 && c.includes(compactQuery)) bump(630)
  }

  // 4. Acronym / Initials match (e.g., "cbccc" -> "Cơm ba chỉ cháy cạnh")
  if (compactQuery.length >= 2 && !/\s/.test(raw) && /^[a-z0-9]+$/.test(compactQuery)) {
    for (let i = 0; i < allAcronyms.length; i += 1) {
      const ac = allAcronyms[i]
      if (!ac) continue
      if (ac === compactQuery) bump(i === 0 ? 670 : 610)
      else if (ac.startsWith(compactQuery)) bump(i === 0 ? 600 : 550)
    }
  }

  // 5. Full-query synonym expansion (e.g., "cf" -> "ca phe", "tra sua" <-> "milk tea")
  const fullQuerySyns = getSynonymsForTerm(normQuery)
  if (fullQuerySyns.length) {
    for (const syn of fullQuerySyns) {
      const synCompact = syn.replace(/\s+/g, '')
      for (let i = 0; i < allNameNorms.length; i += 1) {
        const n = allNameNorms[i]
        if (!n) continue
        if (n.includes(syn) || (synCompact.length >= 3 && allNameCompacts[i].includes(synCompact))) {
          bump(i === 0 ? 650 : 580)
        }
      }
      for (const cn of catNorms) {
        if (cn && cn.includes(syn)) bump(460)
      }
    }
  }

  // 6. Category / Size / Dvt / Description phrase match
  if (normQuery) {
    for (const cn of catNorms) {
      if (!cn) continue
      if (cn === normQuery) bump(560)
      else if (cn.startsWith(normQuery)) bump(510)
      else if (cn.includes(normQuery)) bump(450)
    }
    for (const en of extraNorms) {
      if (!en) continue
      if (en.includes(normQuery)) bump(380)
    }
  }

  // 7. Multi-token AND match (out-of-order words, e.g., "com chay" or "ba chi com" or "lau lon")
  if (bestScore === 0 && queryTokens.length >= 1) {
    const nameWordSets = allNameNorms.map((n) => new Set(n ? n.split(' ') : []))
    if (queryTokens.every((tk) => tokenMatchesFieldList(tk, allNameNorms, allNameCompacts, nameWordSets))) {
      bump(640)
    } else {
      const combinedNorms = [codeNorm, ...allNameNorms, ...catNorms, ...extraNorms].filter(Boolean)
      const combinedCompacts = combinedNorms.map((n) => n.replace(/\s+/g, ''))
      const combinedWordSets = combinedNorms.map((n) => new Set(n.split(' ')))
      if (queryTokens.every((tk) => tokenMatchesFieldList(tk, combinedNorms, combinedCompacts, combinedWordSets))) {
        bump(480)
      }
    }
  }

  // 8. Exact price match (e.g., typing "270" or "270p" finds 270P items)
  if (bestScore === 0) {
    const numVal = getNumericQueryValue(raw)
    if (numVal !== null) {
      const price = Number(item.Gia_ban || 0)
      const salePrice = Number(item.Gia_Giam || 0)
      if ((price > 0 && price === numVal) || (salePrice > 0 && salePrice === numVal)) {
        bump(340)
      }
    }
  }

  // 9. Typo / Fuzzy fallback (1 edit distance per token >= 3 chars)
  if (bestScore === 0 && allowFuzzy && queryTokens.length > 0) {
    const candidateWords = []
    for (const n of [...allNameNorms, ...catNorms]) {
      if (!n) continue
      for (const w of n.split(' ')) {
        if (w.length >= 2) candidateWords.push(w)
      }
    }
    if (candidateWords.length > 0) {
      let fuzzyMatchedAll = true
      for (const tk of queryTokens) {
        if (tk.length < 3) {
          if (!candidateWords.some((w) => w.startsWith(tk))) {
            fuzzyMatchedAll = false
            break
          }
          continue
        }
        const maxDist = tk.length >= 5 ? 2 : 1
        const hit = candidateWords.some(
          (w) => w.includes(tk) || boundedLevenshtein(tk, w, maxDist) <= maxDist,
        )
        if (!hit) {
          fuzzyMatchedAll = false
          break
        }
      }
      if (fuzzyMatchedAll) bump(160)
    }
  }

  if (bestScore <= 0) return 0

  // Small tie-breaker bonus for in-stock products
  if (preferInStock && String(item.Trang_thai || '').trim() !== 'Hết hàng') {
    bestScore += 25
  }

  return bestScore
}

/**
 * Filter & rank a list of products by relevance, with optional typo/fuzzy fallback when strict match is empty.
 */
export function rankProductsWithMeta(items = [], rawKeyword = '', options = {}) {
  const list = Array.isArray(items) ? items : []
  const kw = String(rawKeyword ?? '').trim()
  if (!kw) return { items: list, usedFuzzy: false }

  const { activeLang = 'vi', preferInStock = true, fuzzyFallback = true } = options

  const scorePass = (allowFuzzy) => {
    const scored = []
    for (let idx = 0; idx < list.length; idx += 1) {
      const item = list[idx]
      const score = scoreProductMatch(item, kw, { activeLang, allowFuzzy, preferInStock })
      if (score > 0) {
        scored.push({ item, score, idx })
      }
    }
    scored.sort((a, b) => (b.score !== a.score ? b.score - a.score : a.idx - b.idx))
    return scored.map((entry) => entry.item)
  }

  const strict = scorePass(false)
  if (strict.length > 0 || !fuzzyFallback) {
    return { items: strict, usedFuzzy: false }
  }

  // Only invoke fuzzy fallback for non-numeric queries with at least 3 normalized chars
  const norm = normalizeSearchText(kw)
  if (norm.replace(/\s+/g, '').length < 3 || /^\d+$/.test(norm.replace(/\s+/g, ''))) {
    return { items: [], usedFuzzy: false }
  }

  const fuzzy = scorePass(true)
  return { items: fuzzy, usedFuzzy: fuzzy.length > 0 }
}

/**
 * Accent-insensitive, multi-token text highlight splitter.
 * Safely maps normalized match spans back to the original string indices (preserving accents & case).
 */
export function getAccentInsensitiveHighlights(text, rawKeyword) {
  const raw = String(text ?? '')
  const kw = String(rawKeyword ?? '').trim()
  if (!raw || !kw) return [{ text: raw, match: false }]

  // Build normalized char array + original index map
  const normChars = []
  const origIndices = []

  for (let i = 0; i < raw.length; i += 1) {
    const simp = convertTraditionalToSimplified(raw[i])
    const base = simp
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D')
      .toLowerCase()
    for (let k = 0; k < base.length; k += 1) {
      normChars.push(base[k])
      origIndices.push(i)
    }
  }

  const normText = normChars.join('')
  const rawTokens = tokenizeSearchText(kw)
  if (!rawTokens.length) return [{ text: raw, match: false }]

  // Highlight full normalized phrase first + individual tokens
  const needles = new Set()
  const normPhrase = normalizeSearchText(kw)
  if (normPhrase) needles.add(normPhrase)
  for (const tk of rawTokens) {
    if (tk) needles.add(tk)
  }

  const matchedOrigMask = new Array(raw.length).fill(false)

  for (const needle of needles) {
    let startIdx = 0
    while (startIdx < normText.length) {
      const found = normText.indexOf(needle, startIdx)
      if (found === -1) break
      const endNorm = found + needle.length - 1
      const origStart = origIndices[found]
      const origEnd = origIndices[endNorm]
      if (origStart !== undefined && origEnd !== undefined) {
        for (let p = origStart; p <= origEnd; p += 1) {
          matchedOrigMask[p] = true
        }
      }
      startIdx = found + Math.max(1, needle.length)
    }
  }

  const segments = []
  let segStart = 0
  let curMatch = matchedOrigMask[0]
  for (let i = 1; i < raw.length; i += 1) {
    if (matchedOrigMask[i] !== curMatch) {
      segments.push({ text: raw.slice(segStart, i), match: curMatch })
      segStart = i
      curMatch = matchedOrigMask[i]
    }
  }
  segments.push({ text: raw.slice(segStart), match: curMatch })
  return segments
}

/**
 * Universal multi-token record matcher for Orders, Tabs, and Customers.
 * Every token in rawKeyword must match at least one text field, normalized phone, handle, or exact amount.
 */
export function matchesMultiTokenRecord(
  rawKeyword,
  { texts = [], phones = [], handles = [], amounts = [] } = {},
) {
  const raw = String(rawKeyword ?? '').trim()
  if (!raw) return true

  const normTexts = texts.map((t) => normalizeSearchText(t)).filter(Boolean)
  const compactTexts = normTexts.map((t) => t.replace(/\s+/g, ''))
  const phoneVariants = []
  for (const p of phones) {
    for (const v of getPhoneDigitVariants(p)) {
      if (v) phoneVariants.push(v)
    }
  }
  const cleanHandles = handles.map((h) => normalizeTelegramHandle(h)).filter(Boolean)
  const cleanAmounts = amounts
    .map((a) => Math.round(Number(a || 0)))
    .filter((a) => Number.isFinite(a) && a > 0)

  // Raw query split by whitespace (keeps @handle or phone tokens intact)
  const rawTokens = raw.split(/\s+/).filter(Boolean)
  if (!rawTokens.length) return true

  for (const rawTok of rawTokens) {
    let tokenMatched = false

    // 1. Check @handle match
    const handleTok = normalizeTelegramHandle(rawTok)
    if (handleTok && cleanHandles.some((h) => h.includes(handleTok))) {
      tokenMatched = true
    }

    // 2. Check normalized phone digits (for tokens that look numeric/phone-like)
    if (!tokenMatched) {
      const digitsTok = rawTok.replace(/\D+/g, '')
      if (digitsTok.length >= 3 && /^[\d+\-().\s]+$/.test(rawTok)) {
        const tokVariants = getPhoneDigitVariants(digitsTok)
        if (
          phoneVariants.some((pv) =>
            tokVariants.some((tv) => pv.includes(tv)),
          )
        ) {
          tokenMatched = true
        }
      }
    }

    // 3. Check exact amount match (e.g., "540" or "540p" or "1,250" matches order total 540 / 1250)
    if (!tokenMatched) {
      const numVal = getNumericQueryValue(rawTok)
      if (numVal !== null && cleanAmounts.some((amt) => amt === numVal)) {
        tokenMatched = true
      }
    }

    // 4. Check normalized text fields (accent-insensitive + compact)
    if (!tokenMatched) {
      const normTok = normalizeSearchText(rawTok)
      const compactTok = normTok.replace(/\s+/g, '')
      if (normTok) {
        const candidates = [normTok, ...getSynonymsForTerm(normTok)]
        for (const cand of candidates) {
          const candCompact = cand.replace(/\s+/g, '')
          if (
            normTexts.some((nt) => nt.includes(cand)) ||
            (candCompact.length >= 3 && compactTexts.some((ct) => ct.includes(candCompact)))
          ) {
            tokenMatched = true
            break
          }
        }
      } else if (compactTok && compactTexts.some((ct) => ct.includes(compactTok))) {
        tokenMatched = true
      }
    }

    if (!tokenMatched) return false
  }

  return true
}
