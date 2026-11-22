import { onRequest as handleTelegramOrder } from '../functions/api/telegram-order.js'
import { onRequest as handleCloudinarySign } from '../functions/api/cloudinary-sign.js'
import {
  resolveBrandAssets,
  buildSeoJsonLdGraph,
  toFaviconAssetUrl,
  toMobileIconAssetUrl,
  toShareImageAssetUrl,
} from '../src/utils/brandAssets.js'

const FIREBASE_RTDB_BASE =
  'https://sakitchen-default-rtdb.asia-southeast1.firebasedatabase.app'
const BRAND_CACHE_TTL_MS = 60 * 1000

let cachedBrand = null
let cachedBrandAt = 0

function pickFirstRow(rawObj) {
  if (!rawObj || typeof rawObj !== 'object') return null
  if (Array.isArray(rawObj)) {
    return rawObj.find((x) => x && typeof x === 'object') || null
  }
  const values = Object.values(rawObj)
  return values.find((x) => x && typeof x === 'object') || null
}

async function fetchJsonWithTimeout(url, timeoutMs = 2200) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    })
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}

async function getLiveBrandConfig(env, forceRefresh = false) {
  const now = Date.now()
  if (!forceRefresh && cachedBrand && now - cachedBrandAt < BRAND_CACHE_TTL_MS) {
    return cachedBrand
  }

  const dbBase = String(env?.FIREBASE_DATABASE_URL || FIREBASE_RTDB_BASE).replace(/\/+$/, '')
  const [logoRaw, displayRaw] = await Promise.all([
    fetchJsonWithTimeout(`${dbBase}/logo.json`),
    fetchJsonWithTimeout(`${dbBase}/display_config.json`),
  ])

  const logoRow = pickFirstRow(logoRaw)
  const brand = resolveBrandAssets(logoRow, 'SA KITCHEN')

  let themeColor = '#059669'
  const displayRow =
    (displayRaw && typeof displayRaw === 'object' && displayRaw.main) || pickFirstRow(displayRaw)
  const rawPrimary = String(displayRow?.themeConfig?.primaryColor || '').trim()
  if (/^#[0-9a-fA-F]{6}$/.test(rawPrimary)) {
    themeColor = rawPrimary.toLowerCase()
  }

  const version = String(
    brand.updatedAt ||
      (brand.faviconUrl + brand.mobileIconUrl + brand.shareImageUrl + brand.seoTitle).length ||
      1,
  )

  const resolved = {
    ...brand,
    themeColor,
    version,
  }

  if (logoRow) {
    cachedBrand = resolved
    cachedBrandAt = now
  }

  return resolved
}

async function proxyRemoteBrandImage(targetUrl, fallbackContentType, request, env) {
  if (targetUrl) {
    try {
      const upstream = await fetch(targetUrl, {
        cf: { cacheTtl: 300, cacheEverything: true },
      })
      if (upstream.ok) {
        const headers = new Headers()
        headers.set('Content-Type', upstream.headers.get('Content-Type') || fallbackContentType)
        headers.set('Cache-Control', 'public, max-age=300, stale-while-revalidate=3600')
        headers.set('Access-Control-Allow-Origin', '*')
        return new Response(upstream.body, { status: 200, headers })
      }
    } catch {
      // Fall back to static asset below
    }
  }

  if (env?.ASSETS) {
    const direct = await env.ASSETS.fetch(request)
    if (direct.ok && !String(direct.headers.get('Content-Type') || '').includes('text/html')) {
      return direct
    }
    const url = new URL(request.url)
    const fallbackPath =
      url.pathname === '/og-share.jpg'
        ? '/logo-sa.jpg'
        : url.pathname === '/favicon.ico' || url.pathname === '/favicon-192.png'
          ? '/icon-192.png'
          : '/apple-touch-icon.png'
    return env.ASSETS.fetch(new Request(new URL(fallbackPath, url.origin), request))
  }

  return new Response('Not Found', { status: 404 })
}

function buildDynamicManifestResponse(brand) {
  const v = encodeURIComponent(brand.version)
  const manifest = {
    name: brand.seoTitle || `${brand.name} - Ẩm Thực Việt Tại Philippines`,
    short_name: brand.shortName,
    start_url: '/vi',
    scope: '/',
    display: 'standalone',
    background_color: '#f6f8fa',
    theme_color: brand.themeColor,
    icons: [
      {
        src: `/icon-192.png?v=${v}`,
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any maskable',
      },
      {
        src: `/icon-512.png?v=${v}`,
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any maskable',
      },
    ],
  }

  return new Response(JSON.stringify(manifest, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/manifest+json; charset=utf-8',
      'Cache-Control': 'public, max-age=120, stale-while-revalidate=600',
    },
  })
}

function rewriteStorefrontHtml(response, brand, origin) {
  if (typeof HTMLRewriter === 'undefined') return response
  const v = encodeURIComponent(brand.version)
  const shareUrl = `${origin}/og-share.jpg?v=${v}`
  const appleHref = `/apple-touch-icon.png?v=${v}`
  const manifestHref = `/manifest.webmanifest?v=${v}`
  const jsonLdStr = JSON.stringify(buildSeoJsonLdGraph(brand, origin))

  return new HTMLRewriter()
    .on('title#page-title', {
      element(el) {
        el.setInnerContent(brand.seoTitle)
      },
    })
    .on('meta[name="description"]', {
      element(el) {
        el.setAttribute('content', brand.seoDescription)
      },
    })
    .on('meta[name="keywords"]', {
      element(el) {
        el.setAttribute('content', brand.seoKeywords)
      },
    })
    .on('meta[property="og:title"]', {
      element(el) {
        el.setAttribute('content', brand.seoTitle)
      },
    })
    .on('meta[property="og:description"]', {
      element(el) {
        el.setAttribute('content', brand.seoDescription)
      },
    })
    .on('meta[property="og:site_name"]', {
      element(el) {
        el.setAttribute('content', brand.siteName)
      },
    })
    .on('meta[property="og:image"]', {
      element(el) {
        el.setAttribute('content', shareUrl)
      },
    })
    .on('meta[name="twitter:title"]', {
      element(el) {
        el.setAttribute('content', brand.seoTitle)
      },
    })
    .on('meta[name="twitter:description"]', {
      element(el) {
        el.setAttribute('content', brand.seoDescription)
      },
    })
    .on('meta[name="twitter:image"]', {
      element(el) {
        el.setAttribute('content', shareUrl)
      },
    })
    .on('link[rel="apple-touch-icon"]', {
      element(el) {
        el.setAttribute('href', appleHref)
      },
    })
    .on('link[rel="manifest"]', {
      element(el) {
        el.setAttribute('href', manifestHref)
      },
    })
    .on('meta[name="apple-mobile-web-app-title"]', {
      element(el) {
        el.setAttribute('content', brand.shortName)
      },
    })
    .on('meta[name="theme-color"]', {
      element(el) {
        el.setAttribute('content', brand.themeColor)
      },
    })
    .on('script#sa-seo-jsonld', {
      element(el) {
        el.setInnerContent(jsonLdStr)
      },
    })
    .transform(response)
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url)

    // Enforce HTTPS + root domain for production requests so Google consolidates on https://sakitchen.shop
    if (
      (url.hostname === 'sakitchen.shop' || url.hostname === 'www.sakitchen.shop') &&
      (url.protocol === 'http:' || url.hostname === 'www.sakitchen.shop')
    ) {
      const target = new URL(url.pathname + url.search, 'https://sakitchen.shop')
      return Response.redirect(target.toString(), 301)
    }

    const pathname = url.pathname.replace(/\/+$/, '') || '/'

    if (pathname === '/api/telegram-order') {
      return handleTelegramOrder({ request, env, ctx })
    }

    if (pathname === '/api/cloudinary-sign') {
      return handleCloudinarySign({ request, env, ctx })
    }

    if (pathname.startsWith('/api/')) {
      return new Response(
        JSON.stringify({ success: false, message: 'API endpoint not found' }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json; charset=utf-8' },
        },
      )
    }

    // Dynamic PWA Manifest & Brand Icons
    if (pathname === '/manifest.webmanifest') {
      const brand = await getLiveBrandConfig(env, url.searchParams.has('v'))
      return buildDynamicManifestResponse(brand)
    }

    if (pathname === '/favicon.ico') {
      const brand = await getLiveBrandConfig(env, url.searchParams.has('v'))
      const target = toFaviconAssetUrl(brand.faviconUrl, 48)
      return proxyRemoteBrandImage(target, 'image/png', request, env)
    }

    if (pathname === '/favicon-192.png') {
      const brand = await getLiveBrandConfig(env, url.searchParams.has('v'))
      const target = toFaviconAssetUrl(brand.faviconUrl, 192)
      return proxyRemoteBrandImage(target, 'image/png', request, env)
    }

    if (pathname === '/apple-touch-icon.png') {
      const brand = await getLiveBrandConfig(env, url.searchParams.has('v'))
      const target = toMobileIconAssetUrl(brand.mobileIconUrl, 180)
      return proxyRemoteBrandImage(target, 'image/png', request, env)
    }

    if (pathname === '/icon-192.png') {
      const brand = await getLiveBrandConfig(env, url.searchParams.has('v'))
      const target = toMobileIconAssetUrl(brand.mobileIconUrl, 192)
      return proxyRemoteBrandImage(target, 'image/png', request, env)
    }

    if (pathname === '/icon-512.png') {
      const brand = await getLiveBrandConfig(env, url.searchParams.has('v'))
      const target = toMobileIconAssetUrl(brand.mobileIconUrl, 512)
      return proxyRemoteBrandImage(target, 'image/png', request, env)
    }

    if (pathname === '/og-share.jpg') {
      const brand = await getLiveBrandConfig(env, url.searchParams.has('v'))
      const target = toShareImageAssetUrl(brand.shareImageUrl)
      return proxyRemoteBrandImage(target, 'image/jpeg', request, env)
    }

    if (env.ASSETS) {
      const assetRes = await env.ASSETS.fetch(request)
      const contentType = String(assetRes.headers.get('Content-Type') || '')
      if (request.method === 'GET' && contentType.includes('text/html')) {
        const brand = await getLiveBrandConfig(env)
        return rewriteStorefrontHtml(assetRes, brand, url.origin)
      }
      return assetRes
    }

    return new Response('Not Found', { status: 404 })
  },
}
