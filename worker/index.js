import { onRequest as handleTelegramOrder } from '../functions/api/telegram-order.js'
import { onRequest as handleCloudinarySign } from '../functions/api/cloudinary-sign.js'
import {
  resolveBrandAssets,
  buildSeoJsonLdGraph,
  toFaviconAssetUrl,
  toMobileIconAssetUrl,
  toShareImageAssetUrl,
} from '../src/utils/brandAssets.js'
import {
  normalizeBlogPost,
  normalizeBlogCategory,
  isPostPubliclyVisible,
  renderBlogArticleHtml,
  escapeHtml,
  buildAutoExcerpt,
  buildBlogJsonLd,
  buildBlogListJsonLd,
} from '../src/utils/blogSeo.js'

const FIREBASE_RTDB_BASE =
  'https://sakitchen-default-rtdb.asia-southeast1.firebasedatabase.app'
const BRAND_CACHE_TTL_MS = 60 * 1000
const BLOG_CACHE_TTL_MS = 60 * 1000

let cachedBrand = null
let cachedBrandAt = 0
let cachedBlog = null
let cachedBlogAt = 0

function pickFirstRow(rawObj) {
  if (!rawObj || typeof rawObj !== 'object') return null
  if (Array.isArray(rawObj)) {
    return rawObj.find((x) => x && typeof x === 'object') || null
  }
  const values = Object.values(rawObj)
  return values.find((x) => x && typeof x === 'object') || null
}

function rawObjectToList(rawObj) {
  if (!rawObj || typeof rawObj !== 'object') return []
  const values = Array.isArray(rawObj) ? rawObj : Object.values(rawObj)
  return values.filter((x) => x && typeof x === 'object')
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

async function getLiveBlogData(env, forceRefresh = false) {
  const now = Date.now()
  if (!forceRefresh && cachedBlog && now - cachedBlogAt < BLOG_CACHE_TTL_MS) {
    return cachedBlog
  }

  const dbBase = String(env?.FIREBASE_DATABASE_URL || FIREBASE_RTDB_BASE).replace(/\/+$/, '')
  const [postsRaw, catsRaw] = await Promise.all([
    fetchJsonWithTimeout(`${dbBase}/blog_posts.json`, 2500),
    fetchJsonWithTimeout(`${dbBase}/blog_categories.json`, 2500),
  ])

  const posts = rawObjectToList(postsRaw)
    .map((row) => normalizeBlogPost(row))
    .filter((p) => isPostPubliclyVisible(p))
    .sort((a, b) => (b.Published_at || b.Updated_at || 0) - (a.Published_at || a.Updated_at || 0))

  const categories = rawObjectToList(catsRaw)
    .map((row) => normalizeBlogCategory(row))
    .filter((c) => c.Name && c.Slug)
    .sort((a, b) => a.Order - b.Order || a.Name.localeCompare(b.Name))

  const resolved = { posts, categories }
  if (postsRaw !== null || catsRaw !== null) {
    cachedBlog = resolved
    cachedBlogAt = now
  }
  return resolved
}

async function proxyRemoteBrandImage(targetUrl, fallbackContentType, request, env) {
  const cleanTarget = String(targetUrl || '').trim()
  if (cleanTarget && /^https?:\/\//i.test(cleanTarget)) {
    try {
      const upstream = await fetch(cleanTarget, {
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
  } else if (cleanTarget.startsWith('/') && env?.ASSETS) {
    try {
      const url = new URL(request.url)
      const localAsset = await env.ASSETS.fetch(new Request(new URL(cleanTarget, url.origin), request))
      if (
        localAsset.ok &&
        !String(localAsset.headers.get('Content-Type') || '').includes('text/html')
      ) {
        return localAsset
      }
    } catch {
      // Fall back below
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

function formatXmlDate(ts) {
  const d = ts ? new Date(ts) : new Date()
  if (Number.isNaN(d.getTime())) return new Date().toISOString().slice(0, 10)
  return d.toISOString().slice(0, 10)
}

function escapeXml(str = '') {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function buildDynamicSitemapResponse(blogData, origin = 'https://sakitchen.shop') {
  const cleanOrigin = String(origin || 'https://sakitchen.shop').replace(/\/+$/, '')
  const today = formatXmlDate(Date.now())
  const staticUrls = [
    { loc: `${cleanOrigin}/`, changefreq: 'daily', priority: '1.0', lastmod: today },
    { loc: `${cleanOrigin}/vi`, changefreq: 'daily', priority: '1.0', lastmod: today },
    { loc: `${cleanOrigin}/en`, changefreq: 'daily', priority: '0.8', lastmod: today },
    { loc: `${cleanOrigin}/zh-CN`, changefreq: 'daily', priority: '0.8', lastmod: today },
    { loc: `${cleanOrigin}/fil`, changefreq: 'daily', priority: '0.8', lastmod: today },
    { loc: `${cleanOrigin}/ko`, changefreq: 'daily', priority: '0.8', lastmod: today },
    { loc: `${cleanOrigin}/welcome`, changefreq: 'weekly', priority: '0.7', lastmod: today },
    { loc: `${cleanOrigin}/blog`, changefreq: 'daily', priority: '0.9', lastmod: today },
  ]

  const postUrls = (blogData?.posts || [])
    .filter((post) => !String(post.Robots || '').toLowerCase().includes('noindex'))
    .map((post) => ({
      loc: `${cleanOrigin}/blog/${encodeURIComponent(post.Slug)}`,
      changefreq: 'weekly',
      priority: '0.8',
      lastmod: formatXmlDate(post.Updated_at || post.Published_at || post.Created_at),
    }))

  const allUrls = [...staticUrls, ...postUrls]
  const body = allUrls
    .map(
      (u) =>
        `  <url>\n` +
        `    <loc>${escapeXml(u.loc)}</loc>\n` +
        `    <lastmod>${u.lastmod}</lastmod>\n` +
        `    <changefreq>${u.changefreq}</changefreq>\n` +
        `    <priority>${u.priority}</priority>\n` +
        `  </url>`,
    )
    .join('\n')

  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    `${body}\n` +
    `</urlset>\n`

  return new Response(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=180, stale-while-revalidate=600',
    },
  })
}

function buildNoscriptBlogListHtml(brand, blogData, origin) {
  const cleanOrigin = String(origin || 'https://sakitchen.shop').replace(/\/+$/, '')
  const itemsHtml = (blogData?.posts || [])
    .slice(0, 50)
    .map((p) => {
      const href = `${cleanOrigin}/blog/${encodeURIComponent(p.Slug)}`
      const desc = p.Excerpt || p.SEO_Description || buildAutoExcerpt(p.Content_HTML, 140)
      return `<li><a href="${escapeHtml(href)}"><strong>${escapeHtml(p.Title)}</strong></a>${desc ? `<p>${escapeHtml(desc)}</p>` : ''}</li>`
    })
    .join('')

  return (
    `<noscript id="sa-ssr-blog-list">` +
    `<main>` +
    `<h1>Blog &amp; Cẩm Nang Ẩm Thực - ${escapeHtml(brand.siteName)}</h1>` +
    `<p><a href="${escapeHtml(cleanOrigin)}/vi">Xem thực đơn đặt món 24/24</a></p>` +
    `<ul>${itemsHtml}</ul>` +
    `</main>` +
    `</noscript>`
  )
}

function buildNoscriptBlogPostHtml(post, brand, origin) {
  const cleanOrigin = String(origin || 'https://sakitchen.shop').replace(/\/+$/, '')
  const { html, tocItems } = renderBlogArticleHtml(post.Content_HTML || '', {
    maxLevel: post.TOC_Max_Level,
  })
  const tocHtml =
    post.TOC_Enabled && tocItems.length > 0
      ? `<nav aria-label="${escapeHtml(post.TOC_Title)}"><h2>${escapeHtml(post.TOC_Title)}</h2><ol>${tocItems
          .map((item) => `<li><a href="#${escapeHtml(item.id)}">${escapeHtml(item.number)}. ${escapeHtml(item.text)}</a></li>`)
          .join('')}</ol></nav>`
      : ''

  return (
    `<noscript id="sa-ssr-blog-post">` +
    `<article>` +
    `<nav><a href="${escapeHtml(cleanOrigin)}/">${escapeHtml(brand.siteName)}</a> / <a href="${escapeHtml(cleanOrigin)}/blog">Blog</a></nav>` +
    `<h1>${escapeHtml(post.Title)}</h1>` +
    (post.Excerpt ? `<p>${escapeHtml(post.Excerpt)}</p>` : '') +
    (post.Featured_Image
      ? `<img src="${escapeHtml(post.Featured_Image)}" alt="${escapeHtml(post.Featured_Alt || post.Title)}" />`
      : '') +
    tocHtml +
    `<div>${html}</div>` +
    `</article>` +
    `</noscript>`
  )
}

function shouldForceBrandRefresh(url) {
  const reqV = url.searchParams.get('v')
  if (!reqV || !cachedBrand) return false
  return reqV !== cachedBrand.version
}

function rewritePageHtml(response, brand, origin, seoOverride = null) {
  if (typeof HTMLRewriter === 'undefined') return response
  const v = encodeURIComponent(brand.version)
  const defaultShareUrl = `${origin}/og-share.jpg?v=${v}`
  const faviconIcoHref = `/favicon.ico?v=${v}`
  const faviconPngHref = `/favicon-192.png?v=${v}`
  const appleHref = `/apple-touch-icon.png?v=${v}`
  const manifestHref = `/manifest.webmanifest?v=${v}`

  const seoTitle = seoOverride?.title || brand.seoTitle
  const seoDescription = seoOverride?.description || brand.seoDescription
  const seoKeywords = seoOverride?.keywords || brand.seoKeywords
  const seoRobots = seoOverride?.robots || 'index, follow'
  const canonicalUrl = seoOverride?.canonical || `${origin}/`
  const ogType = seoOverride?.ogType || 'restaurant'
  const shareUrl = seoOverride?.image || defaultShareUrl
  const jsonLdObj = seoOverride?.jsonLd || buildSeoJsonLdGraph(brand, origin)
  const jsonLdStr = JSON.stringify(jsonLdObj)
  const noscriptHtml = seoOverride?.noscriptHtml || ''

  let rewriter = new HTMLRewriter()
    .on('title#page-title', {
      element(el) {
        el.setInnerContent(seoTitle)
      },
    })
    .on('meta[name="description"]', {
      element(el) {
        el.setAttribute('content', seoDescription)
      },
    })
    .on('meta[name="keywords"]', {
      element(el) {
        el.setAttribute('content', seoKeywords)
      },
    })
    .on('meta[name="robots"]', {
      element(el) {
        el.setAttribute('content', seoRobots)
      },
    })
    .on('link[rel="canonical"]', {
      element(el) {
        el.setAttribute('href', canonicalUrl)
      },
    })
    .on('meta[property="og:type"]', {
      element(el) {
        el.setAttribute('content', ogType)
      },
    })
    .on('meta[property="og:url"]', {
      element(el) {
        el.setAttribute('content', canonicalUrl)
      },
    })
    .on('meta[property="og:title"]', {
      element(el) {
        el.setAttribute('content', seoTitle)
      },
    })
    .on('meta[property="og:description"]', {
      element(el) {
        el.setAttribute('content', seoDescription)
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
        el.setAttribute('content', seoTitle)
      },
    })
    .on('meta[name="twitter:description"]', {
      element(el) {
        el.setAttribute('content', seoDescription)
      },
    })
    .on('meta[name="twitter:image"]', {
      element(el) {
        el.setAttribute('content', shareUrl)
      },
    })
    .on('link[rel="icon"]', {
      element(el) {
        const sizes = String(el.getAttribute('sizes') || '')
        const href = String(el.getAttribute('href') || '')
        if (sizes.includes('192') || href.includes('favicon-192')) {
          el.setAttribute('href', faviconPngHref)
        } else {
          el.setAttribute('href', faviconIcoHref)
        }
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

  if (noscriptHtml) {
    rewriter = rewriter.on('div#app', {
      element(el) {
        el.after(noscriptHtml, { html: true })
      },
    })
  }

  return rewriter.transform(response)
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

    // Dynamic XML Sitemap (Storefront + All Published Blog Posts)
    if (pathname === '/sitemap.xml') {
      const blogData = await getLiveBlogData(env, url.searchParams.has('refresh'))
      return buildDynamicSitemapResponse(blogData, url.origin)
    }

    // Dynamic PWA Manifest & Brand Icons
    if (pathname === '/manifest.webmanifest') {
      const brand = await getLiveBrandConfig(env, shouldForceBrandRefresh(url))
      return buildDynamicManifestResponse(brand)
    }

    if (pathname === '/favicon.ico') {
      const brand = await getLiveBrandConfig(env, shouldForceBrandRefresh(url))
      const target = toFaviconAssetUrl(brand.faviconUrl, 48)
      return proxyRemoteBrandImage(target, 'image/png', request, env)
    }

    if (pathname === '/favicon-192.png') {
      const brand = await getLiveBrandConfig(env, shouldForceBrandRefresh(url))
      const target = toFaviconAssetUrl(brand.faviconUrl, 192)
      return proxyRemoteBrandImage(target, 'image/png', request, env)
    }

    if (pathname === '/apple-touch-icon.png') {
      const brand = await getLiveBrandConfig(env, shouldForceBrandRefresh(url))
      const target = toMobileIconAssetUrl(brand.mobileIconUrl, 180)
      return proxyRemoteBrandImage(target, 'image/png', request, env)
    }

    if (pathname === '/icon-192.png') {
      const brand = await getLiveBrandConfig(env, shouldForceBrandRefresh(url))
      const target = toMobileIconAssetUrl(brand.mobileIconUrl, 192)
      return proxyRemoteBrandImage(target, 'image/png', request, env)
    }

    if (pathname === '/icon-512.png') {
      const brand = await getLiveBrandConfig(env, shouldForceBrandRefresh(url))
      const target = toMobileIconAssetUrl(brand.mobileIconUrl, 512)
      return proxyRemoteBrandImage(target, 'image/png', request, env)
    }

    if (pathname === '/og-share.jpg') {
      const brand = await getLiveBrandConfig(env, shouldForceBrandRefresh(url))
      const target = toShareImageAssetUrl(brand.shareImageUrl)
      return proxyRemoteBrandImage(target, 'image/jpeg', request, env)
    }

    if (env.ASSETS) {
      const assetRes = await env.ASSETS.fetch(request)
      const contentType = String(assetRes.headers.get('Content-Type') || '')
      if (request.method === 'GET' && contentType.includes('text/html')) {
        // Blog List SSR SEO
        if (pathname === '/blog') {
          const [brand, blogData] = await Promise.all([
            getLiveBrandConfig(env),
            getLiveBlogData(env),
          ])
          return rewritePageHtml(assetRes, brand, url.origin, {
            title: `Blog & Cẩm Nang Ẩm Thực - ${brand.siteName}`,
            description: `Tổng hợp bài viết, cẩm nang ẩm thực Việt tại Manila, mẹo ăn ngon và tin tức mới nhất từ ${brand.siteName}.`,
            canonical: `${url.origin}/blog`,
            ogType: 'website',
            jsonLd: buildBlogListJsonLd(brand, url.origin),
            noscriptHtml: buildNoscriptBlogListHtml(brand, blogData, url.origin),
          })
        }

        // Blog Article Detail SSR SEO
        if (pathname.startsWith('/blog/')) {
          const rawSlug = decodeURIComponent(pathname.slice('/blog/'.length)).split('/')[0]
          const [brand, blogData] = await Promise.all([
            getLiveBrandConfig(env),
            getLiveBlogData(env),
          ])
          const post = (blogData.posts || []).find((p) => p.Slug === rawSlug)
          if (post) {
            const postTitle = post.SEO_Title || `${post.Title} - ${brand.siteName}`
            const postDesc =
              post.SEO_Description ||
              post.Excerpt ||
              buildAutoExcerpt(post.Content_HTML, 160) ||
              brand.seoDescription
            const postKeywords =
              [post.Focus_Keyword, ...post.tagsList].filter(Boolean).join(', ') || brand.seoKeywords
            const postCanonical = post.Canonical_URL || `${url.origin}/blog/${post.Slug}`
            return rewritePageHtml(assetRes, brand, url.origin, {
              title: postTitle,
              description: postDesc,
              keywords: postKeywords,
              robots: post.Robots || 'index, follow',
              canonical: postCanonical,
              ogType: 'article',
              image: post.Featured_Image ? toShareImageAssetUrl(post.Featured_Image) : '',
              jsonLd: buildBlogJsonLd(post, brand, url.origin),
              noscriptHtml: buildNoscriptBlogPostHtml(post, brand, url.origin),
            })
          }

          // Unknown blog slug -> soft-404 protection (HTTP 404 + noindex) while letting Vue render friendly 404 UI
          const notFoundRes = new Response(assetRes.body, {
            status: 404,
            headers: assetRes.headers,
          })
          return rewritePageHtml(notFoundRes, brand, url.origin, {
            title: `Không tìm thấy bài viết - ${brand.siteName}`,
            description: `Bài viết bạn đang tìm không tồn tại hoặc đã bị gỡ trên ${brand.siteName}.`,
            robots: 'noindex, nofollow',
            canonical: `${url.origin}/blog`,
            ogType: 'website',
          })
        }

        // Default Storefront HTML Rewrite (preserve clean route canonical so sitemap URLs self-canonicalize)
        const brand = await getLiveBrandConfig(env)
        const storefrontCanonical = pathname === '/' ? `${url.origin}/` : `${url.origin}${pathname}`
        return rewritePageHtml(assetRes, brand, url.origin, {
          canonical: storefrontCanonical,
        })
      }
      return assetRes
    }

    return new Response('Not Found', { status: 404 })
  },
}
