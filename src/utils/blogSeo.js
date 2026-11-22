// Shared WordPress-style Blog SEO, Auto-TOC, HTML Sanitizer & JSON-LD helpers
// Zero browser-only dependencies — safe for both Vue frontend & Cloudflare Worker!

export const DEFAULT_TOC_TITLE = 'Mục lục bài viết'

export function slugifyVi(raw = '') {
  return String(raw || '')
    .trim()
    .replace(/Đ/g, 'D')
    .replace(/đ/g, 'd')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function normalizeCompareVi(raw = '') {
  return String(raw || '')
    .trim()
    .replace(/Đ/g, 'D')
    .replace(/đ/g, 'd')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
}

export function escapeHtml(raw = '') {
  return String(raw || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export function decodeBasicHtmlEntities(raw = '') {
  return String(raw || '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&#(\d+);/g, (_, code) => {
      const n = Number(code)
      return Number.isFinite(n) ? String.fromCharCode(n) : ''
    })
}

export function stripHtmlToText(html = '') {
  const withoutBlocks = String(html || '')
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<\/(p|div|li|h[1-6]|tr|blockquote|br|figure|figcaption)>/gi, ' ')
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
  return decodeBasicHtmlEntities(withoutBlocks).replace(/\s+/g, ' ').trim()
}

export function countWords(html = '') {
  const text = stripHtmlToText(html)
  if (!text) return 0
  return text.split(/\s+/).filter(Boolean).length
}

export function estimateReadingMinutes(html = '') {
  const words = countWords(html)
  return Math.max(1, Math.ceil(words / 220))
}

export function sanitizeBlogHtml(html = '') {
  let clean = String(html || '')
  // Remove dangerous elements completely
  clean = clean.replace(/<(script|style|iframe|object|embed|form|textarea|select|button)\b[^>]*>[\s\S]*?<\/\1>/gi, '')
  clean = clean.replace(/<(script|style|iframe|object|embed|input|meta|link|base)\b[^>]*\/?>/gi, '')
  // Strip inline event handlers (onclick, onerror, onload, etc.)
  clean = clean.replace(/\s+on[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
  // Neutralize javascript: / vbscript: / data:text/html links & sources
  clean = clean.replace(
    /\b(href|src)\s*=\s*(["'])\s*(?:javascript|vbscript|data:text\/html)[^"']*\2/gi,
    '$1="#"',
  )
  clean = clean.replace(
    /\b(href|src)\s*=\s*(?:javascript|vbscript):[^\s>]+/gi,
    '$1="#"',
  )
  return clean.trim()
}

/**
 * Easy Table of Contents (WordPress-style) processor:
 * Scans <h2>, <h3>, <h4> tags, injects unique clean Vietnamese slug `id="..."`
 * anchors, and builds a hierarchical numbered TOC (`1.`, `1.1.`, `2.`).
 *
 * @param {string} html
 * @param {{ maxLevel?: number }} [options]
 * @returns {{ htmlWithIds: string, tocItems: Array<{ id: string, level: number, text: string, number: string }> }}
 */
export function extractTocAndInjectHeadingIds(html = '', options = {}) {
  const rawMax = Number(options.maxLevel)
  const maxLevel = rawMax === 2 || rawMax === 3 || rawMax === 4 ? rawMax : 3
  const usedIds = new Map()
  const tocItems = []

  let c2 = 0
  let c3 = 0
  let c4 = 0
  let fallbackIndex = 0

  const htmlWithIds = String(html || '').replace(
    /<h([2-4])(\b[^>]*)>([\s\S]*?)<\/h\1>/gi,
    (fullMatch, levelStr, rawAttrs, innerHtml) => {
      const level = Number(levelStr)
      const plainText = stripHtmlToText(innerHtml)
      if (!plainText) return fullMatch

      fallbackIndex += 1
      const baseSlug = slugifyVi(plainText) || `muc-${fallbackIndex}`
      const seenCount = usedIds.get(baseSlug) || 0
      usedIds.set(baseSlug, seenCount + 1)
      const uniqueId = seenCount === 0 ? baseSlug : `${baseSlug}-${seenCount + 1}`

      // Strip any existing id attribute before injecting clean id
      const attrsWithoutId = String(rawAttrs || '').replace(
        /\s+id\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi,
        '',
      )

      if (level <= maxLevel) {
        let number = ''
        if (level === 2) {
          c2 += 1
          c3 = 0
          c4 = 0
          number = `${c2}`
        } else if (level === 3) {
          if (c2 === 0) c2 = 1
          c3 += 1
          c4 = 0
          number = `${c2}.${c3}`
        } else {
          if (c2 === 0) c2 = 1
          if (c3 === 0) c3 = 1
          c4 += 1
          number = `${c2}.${c3}.${c4}`
        }

        tocItems.push({
          id: uniqueId,
          level,
          text: plainText,
          number,
        })
      }

      return `<h${level} id="${uniqueId}"${attrsWithoutId}>${innerHtml}</h${level}>`
    },
  )

  return { htmlWithIds, tocItems }
}

/**
 * Full render pipeline for BlogDetail & SSR:
 * 1) Sanitize unsafe HTML
 * 2) Inject heading slug IDs & extract numbered Auto TOC
 * 3) Upgrade <img ... data-caption="..."> into semantic <figure><img ...><figcaption>...</figcaption></figure>
 */
export function renderBlogArticleHtml(rawHtml = '', options = {}) {
  const safeHtml = sanitizeBlogHtml(rawHtml)
  const { htmlWithIds, tocItems } = extractTocAndInjectHeadingIds(safeHtml, options)

  const html = htmlWithIds.replace(/<img\b([^>]*?)>/gi, (fullTag, rawAttrs) => {
    const capMatch = rawAttrs.match(/\bdata-caption\s*=\s*(?:"([^"]*)"|'([^']*)')/i)
    const caption = decodeBasicHtmlEntities((capMatch?.[1] ?? capMatch?.[2] ?? '').trim())
    const hasLazy = /\bloading\s*=/i.test(rawAttrs)
    const imgTag = hasLazy ? fullTag : `<img loading="lazy"${rawAttrs}>`
    if (!caption) return imgTag
    return `<figure class="blog-figure">${imgTag}<figcaption class="blog-figcaption">${escapeHtml(caption)}</figcaption></figure>`
  })

  return { html, tocItems }
}

export function parseTags(raw) {
  const list = Array.isArray(raw)
    ? raw
    : String(raw || '')
        .split(',')
        .map((x) => x.trim())
  const seen = new Set()
  const result = []
  for (const item of list) {
    const clean = String(item || '').trim()
    if (!clean) continue
    const key = clean.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    result.push(clean)
  }
  return result
}

export function normalizeBlogStatus(val) {
  const s = String(val || '').trim().toLowerCase()
  if (s === 'published' || s === 'draft' || s === 'hidden') return s
  return 'draft'
}

export function normalizeRobots(val) {
  const s = String(val || '').trim().toLowerCase()
  if (s.includes('noindex')) return 'noindex, nofollow'
  return 'index, follow'
}

export function normalizeTocMaxLevel(val) {
  const num = Number(val)
  if (num === 2 || num === 3 || num === 4) return num
  return 3
}

function toBool(val, fallback = true) {
  if (val === undefined || val === null || val === '') return fallback
  if (typeof val === 'boolean') return val
  const s = String(val).trim().toLowerCase()
  if (s === 'false' || s === '0' || s === 'no' || s === 'off') return false
  if (s === 'true' || s === '1' || s === 'yes' || s === 'on') return true
  return fallback
}

export function normalizeBlogCategory(raw = {}) {
  const name = String(raw?.Name || '').trim()
  const slug = slugifyVi(raw?.Slug || name)
  return {
    ID: String(raw?.ID || '').trim(),
    Name: name,
    Slug: slug,
    Description: String(raw?.Description || '').trim(),
    Order: Number.isFinite(Number(raw?.Order)) ? Number(raw.Order) : 0,
    Updated_at: Number(raw?.Updated_at || 0) || 0,
  }
}

export function normalizeBlogPost(raw = {}) {
  const title = String(raw?.Title || '').trim()
  const slug = slugifyVi(raw?.Slug || title)
  const categoryName = String(raw?.Category_Name || '').trim()
  const categorySlug = slugifyVi(raw?.Category_Slug || categoryName)
  const tagsList = parseTags(raw?.Tags)
  const contentHtml = String(raw?.Content_HTML || '')
  const excerpt = String(raw?.Excerpt || '').trim()

  return {
    ID: String(raw?.ID || '').trim(),
    Title: title,
    Slug: slug,
    Category_ID: String(raw?.Category_ID || '').trim(),
    Category_Name: categoryName,
    Category_Slug: categorySlug,
    Tags: tagsList.join(', '),
    tagsList,
    Excerpt: excerpt,
    Content_HTML: contentHtml,
    Featured_Image: String(raw?.Featured_Image || '').trim(),
    Featured_Alt: String(raw?.Featured_Alt || '').trim(),
    Status: normalizeBlogStatus(raw?.Status),
    Author: String(raw?.Author || '').trim() || 'SA KITCHEN',
    Focus_Keyword: String(raw?.Focus_Keyword || '').trim(),
    SEO_Title: String(raw?.SEO_Title || '').trim(),
    SEO_Description: String(raw?.SEO_Description || '').trim(),
    Canonical_URL: String(raw?.Canonical_URL || '').trim(),
    Robots: normalizeRobots(raw?.Robots),
    TOC_Enabled: toBool(raw?.TOC_Enabled, true),
    TOC_Max_Level: normalizeTocMaxLevel(raw?.TOC_Max_Level),
    TOC_Default_Open: toBool(raw?.TOC_Default_Open, true),
    TOC_Title: String(raw?.TOC_Title || '').trim() || DEFAULT_TOC_TITLE,
    SEO_Score: Number(raw?.SEO_Score || 0) || 0,
    Created_at: Number(raw?.Created_at || 0) || 0,
    Updated_at: Number(raw?.Updated_at || 0) || 0,
    Published_at: Number(raw?.Published_at || 0) || 0,
  }
}

export function buildAutoExcerpt(html = '', maxChars = 160) {
  const text = stripHtmlToText(html)
  if (!text) return ''
  if (text.length <= maxChars) return text
  const cut = text.slice(0, maxChars)
  const lastSpace = cut.lastIndexOf(' ')
  return `${(lastSpace > 80 ? cut.slice(0, lastSpace) : cut).trim()}...`
}

export function isPostPubliclyVisible(post) {
  return normalizeBlogStatus(post?.Status) === 'published' && Boolean(slugifyVi(post?.Slug || post?.Title))
}

/**
 * Yoast / Rank Math-style realtime On-Page SEO analyzer (0..100 score + 10 checks)
 */
export function analyzePostSeo(rawPost = {}) {
  const post = normalizeBlogPost(rawPost)
  const focusKw = post.Focus_Keyword.trim()
  const focusKwNorm = normalizeCompareVi(focusKw)
  const focusKwSlug = slugifyVi(focusKw)

  const effectiveTitle = post.SEO_Title || post.Title
  const explicitDesc = post.SEO_Description || post.Excerpt
  const titleNorm = normalizeCompareVi(effectiveTitle)
  const explicitDescNorm = normalizeCompareVi(explicitDesc)
  const slugVal = post.Slug

  const contentHtml = post.Content_HTML || ''
  const plainText = stripHtmlToText(contentHtml)
  const plainNorm = normalizeCompareVi(plainText)
  const words = plainText ? plainText.split(/\s+/).filter(Boolean) : []
  const wordCount = words.length
  const readingMinutes = Math.max(1, Math.ceil(wordCount / 220))

  // Count headings
  const h2Matches = contentHtml.match(/<h2\b[^>]*>[\s\S]*?<\/h2>/gi) || []
  const h3Matches = contentHtml.match(/<h3\b[^>]*>[\s\S]*?<\/h3>/gi) || []
  const h4Matches = contentHtml.match(/<h4\b[^>]*>[\s\S]*?<\/h4>/gi) || []
  const h2Count = h2Matches.length
  const h3Count = h3Matches.length
  const headingCount = h2Count + h3Count + h4Matches.length

  // Inspect images & alt attributes
  const imgTags = contentHtml.match(/<img\b[^>]*>/gi) || []
  const imageCount = imgTags.length
  const missingAltImgs = imgTags.filter((tag) => {
    const m = tag.match(/\balt\s*=\s*(?:"([^"]*)"|'([^']*)')/i)
    const val = (m?.[1] ?? m?.[2] ?? '').trim()
    return !val
  }).length

  // Inspect internal links
  const hrefMatches = [...contentHtml.matchAll(/\bhref\s*=\s*(?:"([^"]+)"|'([^']+)')/gi)]
  const internalLinkCount = hrefMatches.filter((m) => {
    const href = String(m[1] || m[2] || '').trim().toLowerCase()
    return (
      href.startsWith('/') ||
      href.includes('sakitchen.shop')
    )
  }).length

  // Keyword density & first-paragraph appearance
  let keywordOccurrences = 0
  let keywordDensity = 0
  let kwInIntro = false
  if (focusKwNorm && wordCount > 0) {
    const introText = normalizeCompareVi(words.slice(0, Math.max(80, Math.ceil(wordCount * 0.15))).join(' '))
    kwInIntro = introText.includes(focusKwNorm)

    const escaped = focusKwNorm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const re = new RegExp(escaped, 'g')
    const kwWordCount = focusKwNorm.split(/\s+/).filter(Boolean).length || 1
    keywordOccurrences = (plainNorm.match(re) || []).length
    keywordDensity = Number((((keywordOccurrences * kwWordCount) / wordCount) * 100).toFixed(2))
  }

  const checks = []
  let score = 0

  // 1. Focus keyword in SEO Title (12 pts)
  if (!focusKwNorm) {
    checks.push({
      id: 'kw_title',
      status: 'bad',
      label: 'Từ khóa chính (Focus Keyword)',
      detail: 'Chưa nhập Focus Keyword để chấm điểm chuẩn SEO.',
    })
  } else if (titleNorm.includes(focusKwNorm)) {
    score += 12
    checks.push({
      id: 'kw_title',
      status: 'good',
      label: 'Từ khóa trong Tiêu đề SEO',
      detail: `Tiêu đề đã chứa từ khóa "${focusKw}".`,
    })
  } else {
    checks.push({
      id: 'kw_title',
      status: 'bad',
      label: 'Từ khóa trong Tiêu đề SEO',
      detail: `Nên thêm từ khóa "${focusKw}" vào Tiêu đề SEO.`,
    })
  }

  // 2. Focus keyword in Meta Description (10 pts)
  if (!focusKwNorm) {
    checks.push({
      id: 'kw_desc',
      status: 'warn',
      label: 'Từ khóa trong Meta Description',
      detail: 'Nhập Focus Keyword để kiểm tra mô tả SEO.',
    })
  } else if (!explicitDescNorm) {
    checks.push({
      id: 'kw_desc',
      status: 'bad',
      label: 'Từ khóa trong Meta Description',
      detail: 'Chưa viết Meta Description riêng cho bài viết.',
    })
  } else if (explicitDescNorm.includes(focusKwNorm)) {
    score += 10
    checks.push({
      id: 'kw_desc',
      status: 'good',
      label: 'Từ khóa trong Meta Description',
      detail: 'Meta Description đã chứa từ khóa chính tự nhiên.',
    })
  } else {
    checks.push({
      id: 'kw_desc',
      status: 'bad',
      label: 'Từ khóa trong Meta Description',
      detail: `Nên lồng từ khóa "${focusKw}" vào Meta Description để Google bôi đậm.`,
    })
  }

  // 3. Focus keyword in URL Slug (10 pts)
  if (!slugVal) {
    checks.push({
      id: 'kw_slug',
      status: 'bad',
      label: 'Đường dẫn URL (Slug)',
      detail: 'Chưa có đường dẫn bài viết (/blog/...).',
    })
  } else if (!focusKwSlug) {
    score += 5
    checks.push({
      id: 'kw_slug',
      status: 'warn',
      label: 'Đường dẫn URL (Slug)',
      detail: `URL sạch: /blog/${slugVal} (chưa có từ khóa chính để đối chiếu).`,
    })
  } else if (slugVal.includes(focusKwSlug)) {
    score += 10
    checks.push({
      id: 'kw_slug',
      status: 'good',
      label: 'Từ khóa trong URL Slug',
      detail: `URL /blog/${slugVal} chứa từ khóa chính.`,
    })
  } else {
    score += 3
    checks.push({
      id: 'kw_slug',
      status: 'warn',
      label: 'Từ khóa trong URL Slug',
      detail: `Slug /blog/${slugVal} nên chứa "${focusKwSlug}".`,
    })
  }

  // 4. Focus keyword in Intro (10 pts)
  if (!focusKwNorm) {
    checks.push({
      id: 'kw_intro',
      status: 'warn',
      label: 'Từ khóa ở đoạn mở đầu',
      detail: 'Nhập Focus Keyword để kiểm tra đoạn mở bài.',
    })
  } else if (kwInIntro) {
    score += 10
    checks.push({
      id: 'kw_intro',
      status: 'good',
      label: 'Từ khóa xuất hiện ở đoạn mở đầu',
      detail: 'Rất tốt! Từ khóa đã xuất hiện trong 15% đầu bài viết.',
    })
  } else {
    checks.push({
      id: 'kw_intro',
      status: 'bad',
      label: 'Từ khóa ở đoạn mở đầu',
      detail: `Chưa thấy "${focusKw}" trong đoạn mở đầu bài viết.`,
    })
  }

  // 5. SEO Title length (10 pts)
  const titleLen = effectiveTitle.length
  if (titleLen >= 30 && titleLen <= 60) {
    score += 10
    checks.push({
      id: 'title_len',
      status: 'good',
      label: `Độ dài Tiêu đề SEO (${titleLen}/60 ký tự)`,
      detail: 'Chuẩn đẹp trên kết quả tìm kiếm Google, không bị cắt chữ.',
    })
  } else if (titleLen >= 15 && titleLen <= 72) {
    score += 6
    checks.push({
      id: 'title_len',
      status: 'warn',
      label: `Độ dài Tiêu đề SEO (${titleLen}/60 ký tự)`,
      detail: titleLen < 30 ? 'Hơi ngắn — khuyến nghị 30–60 ký tự.' : 'Hơi dài — Google có thể cắt đuôi sau 60 ký tự.',
    })
  } else {
    checks.push({
      id: 'title_len',
      status: 'bad',
      label: `Độ dài Tiêu đề SEO (${titleLen}/60 ký tự)`,
      detail: 'Quá ngắn hoặc quá dài. Khuyến nghị 30–60 ký tự.',
    })
  }

  // 6. Meta Description length (10 pts)
  const descLen = (post.SEO_Description || '').length
  if (descLen >= 110 && descLen <= 160) {
    score += 10
    checks.push({
      id: 'desc_len',
      status: 'good',
      label: `Độ dài Meta Description (${descLen}/160 ký tự)`,
      detail: 'Độ dài chuẩn SEO, hiển thị trọn vẹn 2–3 dòng trên Google.',
    })
  } else if (descLen >= 60 && descLen <= 180) {
    score += 6
    checks.push({
      id: 'desc_len',
      status: 'warn',
      label: `Độ dài Meta Description (${descLen}/160 ký tự)`,
      detail: descLen < 110 ? 'Hơi ngắn — khuyến nghị 110–160 ký tự.' : 'Hơi dài — khuyến nghị ≤ 160 ký tự.',
    })
  } else {
    checks.push({
      id: 'desc_len',
      status: 'bad',
      label: `Độ dài Meta Description (${descLen}/160 ký tự)`,
      detail: 'Chưa viết hoặc quá ngắn/dài. Khuyến nghị 110–160 ký tự.',
    })
  }

  // 7. Content length (12 pts)
  if (wordCount >= 600) {
    score += 12
    checks.push({
      id: 'content_len',
      status: 'good',
      label: `Độ dài bài viết (${wordCount} từ)`,
      detail: `Bài viết chuyên sâu (~${readingMinutes} phút đọc), rất tốt cho SEO.`,
    })
  } else if (wordCount >= 300) {
    score += 7
    checks.push({
      id: 'content_len',
      status: 'warn',
      label: `Độ dài bài viết (${wordCount} từ)`,
      detail: 'Đạt mức cơ bản (≥ 300 từ). Nên viết ≥ 600 từ để cạnh tranh top Google.',
    })
  } else {
    checks.push({
      id: 'content_len',
      status: 'bad',
      label: `Độ dài bài viết (${wordCount} từ)`,
      detail: 'Nội dung còn mỏng (< 300 từ). Nên bổ sung thêm thông tin hữu ích.',
    })
  }

  // 8. Headings H2/H3 & Auto TOC readiness (10 pts)
  if (h2Count >= 2) {
    score += 10
    checks.push({
      id: 'headings_toc',
      status: 'good',
      label: `Cấu trúc Heading & Mục lục (${h2Count} H2, ${h3Count} H3)`,
      detail: 'Cấu trúc rõ ràng, Mục lục tự động (Auto TOC) sẽ hiển thị rất đẹp.',
    })
  } else if (headingCount >= 1) {
    score += 5
    checks.push({
      id: 'headings_toc',
      status: 'warn',
      label: `Cấu trúc Heading & Mục lục (${h2Count} H2, ${h3Count} H3)`,
      detail: 'Nên chia tối thiểu 2 thẻ H2 để bài viết dễ đọc và Mục lục tự động phát huy hiệu quả.',
    })
  } else {
    checks.push({
      id: 'headings_toc',
      status: 'bad',
      label: 'Cấu trúc Heading & Mục lục (0 thẻ H2/H3)',
      detail: 'Chưa có thẻ H2/H3 nào. Hãy thêm H2/H3 để tạo Mục lục tự động chuẩn WP.',
    })
  }

  // 9. Featured image & Alt attributes (8 pts)
  const hasFeatured = Boolean(post.Featured_Image)
  const hasFeaturedAlt = Boolean(post.Featured_Alt)
  if (hasFeatured && hasFeaturedAlt && missingAltImgs === 0) {
    score += 8
    checks.push({
      id: 'images_alt',
      status: 'good',
      label: `Hình ảnh & thẻ Alt (${imageCount} ảnh trong bài)`,
      detail: 'Đã có ảnh đại diện + đầy đủ thẻ Alt chuẩn Google Images.',
    })
  } else if (hasFeatured && missingAltImgs === 0) {
    score += 5
    checks.push({
      id: 'images_alt',
      status: 'warn',
      label: 'Hình ảnh & thẻ Alt',
      detail: 'Đã có ảnh đại diện nhưng thiếu mô tả Alt cho ảnh đại diện.',
    })
  } else {
    score += hasFeatured ? 3 : 0
    checks.push({
      id: 'images_alt',
      status: 'bad',
      label: 'Hình ảnh & thẻ Alt',
      detail: !hasFeatured
        ? 'Chưa chọn Ảnh đại diện (Featured Image 1200×630) cho bài viết.'
        : `Có ${missingAltImgs} ảnh trong bài viết đang thiếu thẻ Alt.`,
    })
  }

  // 10. Internal links & keyword density (8 pts)
  const densityTooHigh = focusKwNorm && keywordDensity > 3.2
  if (internalLinkCount >= 1 && !densityTooHigh) {
    score += 8
    checks.push({
      id: 'links_density',
      status: 'good',
      label: `Liên kết nội bộ (${internalLinkCount}) & Mật độ từ khóa (${keywordDensity}%)`,
      detail: 'Đã có internal link về Menu/Blog và mật độ từ khóa tự nhiên.',
    })
  } else if (densityTooHigh) {
    score += 3
    checks.push({
      id: 'links_density',
      status: 'warn',
      label: `Mật độ từ khóa hơi cao (${keywordDensity}%)`,
      detail: 'Tránh nhồi nhét từ khóa (> 3%). Giữ tự nhiên trong khoảng 0.5% – 2.5%.',
    })
  } else {
    score += 3
    checks.push({
      id: 'links_density',
      status: 'warn',
      label: 'Liên kết nội bộ (Internal Link)',
      detail: 'Nên chèn ít nhất 1 link dẫn về trang thực đơn (/vi) hoặc bài viết khác của SA KITCHEN.',
    })
  }

  const finalScore = Math.max(0, Math.min(100, Math.round(score)))
  const grade = finalScore >= 80 ? 'good' : finalScore >= 50 ? 'warn' : 'bad'

  return {
    score: finalScore,
    grade,
    wordCount,
    readingMinutes,
    headingCount,
    h2Count,
    h3Count,
    imageCount,
    internalLinkCount,
    keywordOccurrences,
    keywordDensity,
    checks,
  }
}

export function buildBlogJsonLd(rawPost = {}, brand = {}, origin = 'https://sakitchen.shop') {
  const post = normalizeBlogPost(rawPost)
  const cleanOrigin = String(origin || 'https://sakitchen.shop').replace(/\/+$/, '')
  const siteName = brand?.siteName || brand?.name || 'SA KITCHEN'
  const canonicalUrl = post.Canonical_URL || `${cleanOrigin}/blog/${post.Slug}`
  const headline = post.SEO_Title || post.Title || siteName
  const description =
    post.SEO_Description || post.Excerpt || buildAutoExcerpt(post.Content_HTML, 160) || brand?.seoDescription || ''
  const image = post.Featured_Image || `${cleanOrigin}/og-share.jpg`
  const publishedIso = new Date(post.Published_at || post.Created_at || Date.now()).toISOString()
  const modifiedIso = new Date(post.Updated_at || post.Published_at || post.Created_at || Date.now()).toISOString()

  const breadcrumbItems = [
    {
      '@type': 'ListItem',
      position: 1,
      name: 'Trang chủ',
      item: `${cleanOrigin}/`,
    },
    {
      '@type': 'ListItem',
      position: 2,
      name: 'Blog',
      item: `${cleanOrigin}/blog`,
    },
  ]

  if (post.Category_Name && post.Category_Slug) {
    breadcrumbItems.push({
      '@type': 'ListItem',
      position: 3,
      name: post.Category_Name,
      item: `${cleanOrigin}/blog?cat=${encodeURIComponent(post.Category_Slug)}`,
    })
    breadcrumbItems.push({
      '@type': 'ListItem',
      position: 4,
      name: post.Title || headline,
      item: canonicalUrl,
    })
  } else {
    breadcrumbItems.push({
      '@type': 'ListItem',
      position: 3,
      name: post.Title || headline,
      item: canonicalUrl,
    })
  }

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BlogPosting',
        '@id': `${canonicalUrl}#article`,
        mainEntityOfPage: {
          '@type': 'WebPage',
          '@id': canonicalUrl,
        },
        headline,
        description,
        image: [image],
        datePublished: publishedIso,
        dateModified: modifiedIso,
        inLanguage: 'vi',
        wordCount: countWords(post.Content_HTML),
        ...(post.Category_Name ? { articleSection: post.Category_Name } : {}),
        ...(post.tagsList.length ? { keywords: post.tagsList.join(', ') } : {}),
        author: {
          '@type': 'Organization',
          name: post.Author || siteName,
          url: `${cleanOrigin}/`,
        },
        publisher: {
          '@type': 'Organization',
          name: siteName,
          url: `${cleanOrigin}/`,
          logo: {
            '@type': 'ImageObject',
            url: `${cleanOrigin}/favicon-192.png`,
          },
        },
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${canonicalUrl}#breadcrumb`,
        itemListElement: breadcrumbItems,
      },
    ],
  }
}

export function buildBlogListJsonLd(brand = {}, origin = 'https://sakitchen.shop') {
  const cleanOrigin = String(origin || 'https://sakitchen.shop').replace(/\/+$/, '')
  const siteName = brand?.siteName || brand?.name || 'SA KITCHEN'
  const blogUrl = `${cleanOrigin}/blog`

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Blog',
        '@id': `${blogUrl}#blog`,
        url: blogUrl,
        name: `Blog & Tin Tức - ${siteName}`,
        description: `Cẩm nang ẩm thực Việt tại Manila, kinh nghiệm ăn uống và tin tức mới nhất từ ${siteName}.`,
        inLanguage: 'vi',
        publisher: {
          '@type': 'Organization',
          name: siteName,
          url: `${cleanOrigin}/`,
          logo: {
            '@type': 'ImageObject',
            url: `${cleanOrigin}/favicon-192.png`,
          },
        },
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${blogUrl}#breadcrumb`,
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Trang chủ',
            item: `${cleanOrigin}/`,
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'Blog',
            item: blogUrl,
          },
        ],
      },
    ],
  }
}
