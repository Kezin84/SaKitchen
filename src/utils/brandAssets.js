// Shared brand asset & SEO helpers (safe for both Browser & Cloudflare Worker)

export const DEFAULT_SEO_CONFIG = {
  seoTitle: 'SA KITCHEN - Ẩm Thực Việt Tại Philippines',
  seoDescription:
    'SA KITCHEN chuyên cung cấp ẩm thực chuẩn vị Việt Nam, cơm văn phòng, món nhậu và dịch vụ đi chợ hộ giao nhanh 24/24 tại Manila, Philippines.',
  seoH1: 'SA KITCHEN - Ẩm Thực Việt Chuẩn Vị Giao 24/24 Tại Manila',
  seoIntro:
    'Thực đơn đa dạng từ cơm văn phòng, lẩu, món nhậu bình dân đến dịch vụ đi chợ hộ — giao hàng nhanh 24/24 khu vực Manila, Pasay, Makati, Philippines.',
  seoKeywords:
    'sakitchen, sa kitchen, sa kitchen manila, đồ ăn việt manila, ẩm thực việt tại philippines, quán ăn việt philippines, ship đồ ăn manila, món nhậu manila',
  shopAddress: 'Manila · Pasay · Makati, Philippines',
}

export function toCloudinaryTransform(rawUrl, transform) {
  const url = String(rawUrl || '').trim()
  if (!url) return ''
  const marker = '/upload/'
  if (url.includes('res.cloudinary.com') && url.includes(marker)) {
    const idx = url.indexOf(marker)
    const after = url.slice(idx + marker.length)
    const firstSeg = after.split('/')[0] || ''
    if (
      /^v\d+$/.test(firstSeg) ||
      !/^(?:[a-z]{1,3}_[^/,]+)(?:,[a-z]{1,3}_[^/,]+)*$/i.test(firstSeg)
    ) {
      return `${url.slice(0, idx + marker.length)}${transform}/${after}`
    }
  }
  return url
}

export function isBrokenImageUrl(rawUrl) {
  const url = String(rawUrl || '').trim()
  if (!url) return true
  if (/\.mm\.bing\.net\/th\b/i.test(url)) {
    try {
      const parsed = new URL(url)
      if (!String(parsed.searchParams.get('q') || '').trim()) return true
    } catch {
      return true
    }
  }
  return false
}

export function toOptimizedImageUrl(
  rawUrl,
  { width = 400, height = 0, crop = 'limit', quality = 'auto' } = {},
) {
  const url = String(rawUrl || '').trim()
  if (!url || isBrokenImageUrl(url)) return ''

  if (url.includes('res.cloudinary.com') && url.includes('/upload/')) {
    const parts = ['f_auto', `q_${quality}`]
    if (crop) parts.push(`c_${crop}`)
    if (width > 0) parts.push(`w_${Math.round(width)}`)
    if (height > 0) parts.push(`h_${Math.round(height)}`)
    return toCloudinaryTransform(url, parts.join(','))
  }

  if (/\.mm\.bing\.net\/th\b/i.test(url) && width > 0) {
    try {
      const parsed = new URL(url)
      const targetW = Math.round(width)
      const targetH = Math.round(height > 0 ? height : width)
      parsed.searchParams.set('w', String(targetW))
      parsed.searchParams.set('h', String(targetH))
      return parsed.toString()
    } catch {
      return url
    }
  }

  return url
}

export function toFaviconAssetUrl(rawUrl, size = 192) {
  const url = String(rawUrl || '').trim()
  if (!url) return ''
  return toCloudinaryTransform(url, `c_fit,w_${size},h_${size},f_png`)
}

export function toMobileIconAssetUrl(rawUrl, size = 180) {
  const url = String(rawUrl || '').trim()
  if (!url) return ''
  return toCloudinaryTransform(url, `c_fill,g_auto,w_${size},h_${size},f_png`)
}

export function toShareImageAssetUrl(rawUrl) {
  const url = String(rawUrl || '').trim()
  if (!url) return ''
  return toCloudinaryTransform(url, 'c_fill,g_auto,w_1200,h_630,f_jpg,q_auto:good')
}

export function resolveBrandAssets(logoRow = null, fallbackName = 'SA KITCHEN') {
  const row = logoRow && typeof logoRow === 'object' ? logoRow : {}
  const name = String(row.Name || row.Ten_shop || fallbackName).trim() || fallbackName
  const shortName = String(row.Short_Name || '').trim() || name
  const logoUrl = String(row.URL || '').trim()
  const faviconUrl = String(row.Favicon_URL || '').trim() || logoUrl
  const mobileIconUrl = String(row.Mobile_Icon_URL || '').trim() || logoUrl
  const shareImageUrl = String(row.Share_Image_URL || '').trim() || logoUrl
  const updatedAt = Number(row.Updated_at || 0) || 0

  const seoTitle =
    String(row.SEO_Title || '').trim() ||
    (name === 'SA KITCHEN'
      ? DEFAULT_SEO_CONFIG.seoTitle
      : `${name} - Ẩm Thực Việt Tại Philippines`)
  const seoDescription =
    String(row.SEO_Description || '').trim() || DEFAULT_SEO_CONFIG.seoDescription
  const seoH1 = String(row.SEO_H1 || '').trim() || DEFAULT_SEO_CONFIG.seoH1
  const seoIntro =
    row.SEO_Intro !== undefined && row.SEO_Intro !== null
      ? String(row.SEO_Intro).trim()
      : DEFAULT_SEO_CONFIG.seoIntro
  const seoKeywords =
    String(row.SEO_Keywords || '').trim() || DEFAULT_SEO_CONFIG.seoKeywords
  const shopAddress =
    row.Shop_Address !== undefined && row.Shop_Address !== null
      ? String(row.Shop_Address).trim()
      : DEFAULT_SEO_CONFIG.shopAddress
  const mapUrl = String(row.Map_URL || '').trim()

  return {
    name,
    shortName,
    siteName: name,
    logoUrl,
    faviconUrl,
    mobileIconUrl,
    shareImageUrl,
    seoTitle,
    seoDescription,
    seoH1,
    seoIntro,
    seoKeywords,
    shopAddress,
    mapUrl,
    updatedAt,
  }
}

export function buildSeoJsonLdGraph(brand, origin = 'https://sakitchen.shop') {
  const cleanOrigin = String(origin || 'https://sakitchen.shop').replace(/\/+$/, '')
  const siteName = brand?.siteName || brand?.name || 'SA KITCHEN'
  const verSuffix = brand?.updatedAt ? `?v=${encodeURIComponent(brand.updatedAt)}` : ''
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': `${cleanOrigin}/#website`,
        url: `${cleanOrigin}/`,
        name: siteName,
        alternateName: 'sakitchen.shop',
        description: brand?.seoDescription || DEFAULT_SEO_CONFIG.seoDescription,
        inLanguage: 'vi',
      },
      {
        '@type': 'Restaurant',
        '@id': `${cleanOrigin}/#restaurant`,
        name: brand?.seoTitle || DEFAULT_SEO_CONFIG.seoTitle,
        url: `${cleanOrigin}/`,
        logo: `${cleanOrigin}/favicon-192.png${verSuffix}`,
        image: `${cleanOrigin}/og-share.jpg${verSuffix}`,
        description: brand?.seoDescription || DEFAULT_SEO_CONFIG.seoDescription,
        address: {
          '@type': 'PostalAddress',
          ...(brand?.shopAddress ? { streetAddress: brand.shopAddress } : {}),
          addressLocality: 'Manila',
          addressCountry: 'PH',
        },
        ...(brand?.mapUrl ? { hasMap: brand.mapUrl } : {}),
        servesCuisine: 'Vietnamese',
        priceRange: '$$',
      },
    ],
  }
}
