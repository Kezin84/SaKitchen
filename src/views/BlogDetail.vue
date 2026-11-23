<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { getOneSheet } from '@/config/api'
import { getAuthorizedAdminUser } from '@/config/adminAuth'
import { resolveBrandAssets } from '@/utils/brandAssets.js'
import {
  normalizeThemeConfig,
  buildStorefrontThemeVars,
} from '@/utils/storefrontTheme.js'

const SA_THEME_MODE_KEY = 'SA_THEME_MODE'
import {
  normalizeBlogPost,
  isPostPubliclyVisible,
  renderBlogArticleHtml,
  estimateReadingMinutes,
  buildAutoExcerpt,
  buildBlogJsonLd,
} from '@/utils/blogSeo.js'

const route = useRoute()

const loading = ref(true)
const allPosts = ref([])
const post = ref(null)
const isAdminPreview = ref(false)
const brand = ref(resolveBrandAssets(null, 'SA KITCHEN'))
const themeConfig = ref(normalizeThemeConfig(null))
const themeMode = ref('light')

const tocOpen = ref(true)
const activeTocId = ref('')
const copiedToast = ref(false)

const CHECK_SCAM_NAV_ITEMS = [
  {
    key: 'verify',
    url: 'https://checkscam8888.vercel.app/',
    title: 'Check STK, shop giả mạo',
    sub: 'Tra cứu STK & xác thực shop',
    icon: 'ri-shield-check-fill',
    variant: 'is-verify',
  },
  {
    key: 'shops',
    url: 'https://checkscam8888.vercel.app/shops',
    title: 'Xem quán ngon',
    sub: 'Danh sách quán uy tín, chất lượng',
    icon: 'ri-store-2-fill',
    variant: 'is-shops',
  },
  {
    key: 'alerts',
    url: 'https://checkscam8888.vercel.app/alerts',
    title: 'Thông tin lừa đảo',
    sub: 'Cảnh báo chiêu trò lừa đảo mới',
    icon: 'ri-alarm-warning-fill',
    variant: 'is-alerts',
  },
]

const themeVars = computed(() => buildStorefrontThemeVars(themeConfig.value, themeMode.value))

function initThemeMode() {
  try {
    const saved = localStorage.getItem(SA_THEME_MODE_KEY)
    if (saved === 'dark' || saved === 'light') {
      themeMode.value = saved
      return
    }
  } catch {}
  themeMode.value = themeConfig.value.defaultColorScheme || 'light'
}

function toggleThemeMode() {
  themeMode.value = themeMode.value === 'dark' ? 'light' : 'dark'
  try {
    localStorage.setItem(SA_THEME_MODE_KEY, themeMode.value)
  } catch {}
}

const renderedArticle = computed(() => {
  if (!post.value) return { html: '', tocItems: [] }
  return renderBlogArticleHtml(post.value.Content_HTML || '', {
    maxLevel: post.value.TOC_Max_Level,
  })
})

const readingMinutes = computed(() =>
  post.value ? estimateReadingMinutes(post.value.Content_HTML) : 1,
)

const relatedPosts = computed(() => {
  if (!post.value) return []
  const pub = allPosts.value.filter(
    (p) => isPostPubliclyVisible(p) && p.Slug !== post.value.Slug,
  )
  const sameCat = post.value.Category_Slug
    ? pub.filter((p) => p.Category_Slug === post.value.Category_Slug)
    : []
  const others = pub.filter((p) => !sameCat.some((s) => s.Slug === p.Slug))
  return [...sameCat, ...others].slice(0, 3)
})

function applySeoHead(currentPost) {
  if (!currentPost) {
    document.title = `Không tìm thấy bài viết - ${brand.value.siteName}`
    return
  }
  const origin = window.location.origin
  const title = currentPost.SEO_Title || `${currentPost.Title} - ${brand.value.siteName}`
  const desc =
    currentPost.SEO_Description ||
    currentPost.Excerpt ||
    buildAutoExcerpt(currentPost.Content_HTML, 160) ||
    brand.value.seoDescription
  const canonicalUrl = currentPost.Canonical_URL || `${origin}/blog/${currentPost.Slug}`

  document.title = title
  const setMeta = (selector, attr, val) => {
    const el = document.querySelector(selector)
    if (el && val) el.setAttribute(attr, val)
  }
  setMeta('meta[name="description"]', 'content', desc)
  setMeta('meta[name="robots"]', 'content', currentPost.Robots || 'index, follow')
  setMeta('link[rel="canonical"]', 'href', canonicalUrl)
  setMeta('meta[property="og:title"]', 'content', title)
  setMeta('meta[property="og:description"]', 'content', desc)
  setMeta('meta[property="og:url"]', 'content', canonicalUrl)
  if (currentPost.Featured_Image) {
    setMeta('meta[property="og:image"]', 'content', currentPost.Featured_Image)
    setMeta('meta[name="twitter:image"]', 'content', currentPost.Featured_Image)
  }

  const jsonLdEl = document.getElementById('sa-seo-jsonld')
  if (jsonLdEl) {
    jsonLdEl.textContent = JSON.stringify(buildBlogJsonLd(currentPost, brand.value, origin))
  }
}

async function resolveCurrentPost() {
  const slug = String(route.params.slug || '').trim()
  const wantPreview = String(route.query.preview || '') === '1'
  isAdminPreview.value = false

  const found = allPosts.value.find((p) => p.Slug === slug) || null
  if (!found) {
    post.value = null
    applySeoHead(null)
    return
  }

  if (isPostPubliclyVisible(found)) {
    post.value = found
    tocOpen.value = Boolean(found.TOC_Default_Open)
    applySeoHead(found)
    return
  }

  if (wantPreview) {
    const adminUser = await getAuthorizedAdminUser().catch(() => null)
    if (adminUser) {
      isAdminPreview.value = true
      post.value = found
      tocOpen.value = Boolean(found.TOC_Default_Open)
      applySeoHead(found)
      return
    }
  }

  post.value = null
  applySeoHead(null)
}

async function loadData() {
  loading.value = true
  try {
    const [postsRes, logoRes, displayRes] = await Promise.all([
      getOneSheet('blog_posts'),
      getOneSheet('logo'),
      getOneSheet('display_config'),
    ])
    allPosts.value = (postsRes?.data || [])
      .map((r) => normalizeBlogPost(r))
      .sort((a, b) => (b.Published_at || b.Updated_at || 0) - (a.Published_at || a.Updated_at || 0))
    brand.value = resolveBrandAssets(logoRes?.data?.[0] || null, 'SA KITCHEN')
    const displayRow =
      (displayRes?.data || []).find((r) => r.ID === 'DEFAULT') || displayRes?.data?.[0] || null
    themeConfig.value = normalizeThemeConfig(displayRow?.Theme_config || displayRow?.themeConfig)
    initThemeMode()
    await resolveCurrentPost()
  } catch (err) {
    console.error('BlogDetail loadData error:', err)
  } finally {
    loading.value = false
  }
}

onMounted(loadData)

watch(
  () => [route.params.slug, route.query.preview],
  async () => {
    if (!allPosts.value.length) return
    await resolveCurrentPost()
    window.scrollTo({ top: 0, behavior: 'smooth' })
  },
)

function scrollToHeading(id) {
  activeTocId.value = id
  const el = document.getElementById(id)
  if (!el) return
  const y = el.getBoundingClientRect().top + window.scrollY - 82
  window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' })
  try {
    history.replaceState(null, '', `#${id}`)
  } catch {}
}

async function copyArticleLink() {
  const url = window.location.href
  try {
    await navigator.clipboard.writeText(url)
    copiedToast.value = true
    setTimeout(() => {
      copiedToast.value = false
    }, 2400)
  } catch {
    window.prompt('Sao chép liên kết bài viết:', url)
  }
}

function shareTelegramUrl() {
  const url = encodeURIComponent(window.location.href)
  const text = encodeURIComponent(post.value?.Title || brand.value.siteName)
  return `https://t.me/share/url?url=${url}&text=${text}`
}

function shareFacebookUrl() {
  return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`
}

function formatDate(ts) {
  if (!ts) return ''
  const d = new Date(ts)
  if (Number.isNaN(d.getTime())) return ''
  const p = (v) => String(v).padStart(2, '0')
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()}`
}
</script>

<template>
  <div
    class="blog-detail-page"
    :class="themeMode === 'dark' ? 'theme-dark' : 'theme-light'"
    :style="themeVars"
  >
    <!-- STICKY HEADER (EMERALD BRAND BAR SYNCED WITH ORDER HEADER) -->
    <header class="blog-header">
      <div class="bh-inner">
        <div class="bh-brand-cluster">
          <RouterLink to="/vi" class="bh-brand">
            <img v-if="brand.logoUrl" :src="brand.logoUrl" :alt="brand.siteName" class="bh-logo" />
            <div class="bh-brand-text">
              <strong>{{ brand.siteName }}</strong>
              <span>Blog &amp; Cẩm nang ẩm thực</span>
            </div>
          </RouterLink>

          <nav class="bh-nav-links" aria-label="Điều hướng chính">
            <RouterLink to="/vi" class="bh-nav-link">Thực đơn</RouterLink>
            <RouterLink to="/bang-tin" class="bh-nav-link">Bảng tin</RouterLink>
            <RouterLink to="/blog" class="bh-nav-link active">Blog</RouterLink>

            <div class="bh-nav-dropdown">
              <button
                type="button"
                class="bh-nav-link bh-nav-dropdown-trigger"
                aria-haspopup="true"
              >
                <span>Check Scam</span>
                <i class="ri-arrow-down-s-line bh-nav-chevron"></i>
              </button>
              <div class="bh-nav-dropdown-menu" role="menu">
                <a
                  v-for="item in CHECK_SCAM_NAV_ITEMS"
                  :key="'bd-scam-' + item.key"
                  :href="item.url"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="bh-scam-dd-item"
                  :class="item.variant"
                  role="menuitem"
                  @click="$event.currentTarget.blur()"
                >
                  <i :class="item.icon" class="bh-scam-dd-ico"></i>
                  <span class="bh-scam-dd-body">
                    <span class="bh-scam-dd-title">{{ item.title }}</span>
                    <span class="bh-scam-dd-sub">{{ item.sub }}</span>
                  </span>
                  <i class="ri-arrow-right-up-line bh-scam-dd-ext"></i>
                </a>
              </div>
            </div>
          </nav>
        </div>

        <div class="bh-nav">
          <button
            type="button"
            class="bh-icon-btn"
            :title="themeMode === 'dark' ? 'Chế độ sáng' : 'Chế độ tối'"
            @click="toggleThemeMode"
          >
            <i :class="themeMode === 'dark' ? 'ri-sun-fill' : 'ri-moon-clear-line'"></i>
          </button>
          <RouterLink to="/vi" class="bh-order-cta">
            <i class="ri-restaurant-2-line"></i>
            <span>Đặt món 24/24</span>
          </RouterLink>
        </div>
      </div>
    </header>

    <main class="article-shell">
      <!-- LOADING -->
      <div v-if="loading" class="article-skeleton">
        <div class="ask-line short"></div>
        <div class="ask-title"></div>
        <div class="ask-img"></div>
        <div class="ask-line"></div>
        <div class="ask-line"></div>
        <div class="ask-line short"></div>
      </div>

      <!-- NOT FOUND -->
      <div v-else-if="!post" class="not-found-card">
        <i class="ri-file-search-line"></i>
        <h1>Không tìm thấy bài viết</h1>
        <p>Bài viết bạn đang truy cập có thể đã bị gỡ hoặc đổi đường dẫn.</p>
        <div class="nf-actions">
          <RouterLink to="/blog" class="btn-outline">Quay lại trang Blog</RouterLink>
          <RouterLink to="/vi" class="btn-primary">Xem thực đơn SA KITCHEN</RouterLink>
        </div>
      </div>

      <!-- ARTICLE -->
      <article v-else class="article-card">
        <div v-if="isAdminPreview" class="preview-banner">
          <i class="ri-eye-2-line"></i>
          <span>Chế độ xem trước của Admin (Bài đang ở trạng thái <strong>{{ post.Status }}</strong>, khách chưa nhìn thấy).</span>
        </div>

        <!-- BREADCRUMB -->
        <nav class="art-breadcrumb" aria-label="Breadcrumb">
          <RouterLink to="/vi">Trang chủ</RouterLink>
          <i class="ri-arrow-right-s-line"></i>
          <RouterLink to="/blog">Blog</RouterLink>
          <template v-if="post.Category_Name && post.Category_Slug">
            <i class="ri-arrow-right-s-line"></i>
            <RouterLink :to="`/blog?cat=${encodeURIComponent(post.Category_Slug)}`">
              {{ post.Category_Name }}
            </RouterLink>
          </template>
        </nav>

        <!-- CATEGORY + H1 + META -->
        <header class="art-header">
          <RouterLink
            v-if="post.Category_Name && post.Category_Slug"
            :to="`/blog?cat=${encodeURIComponent(post.Category_Slug)}`"
            class="art-cat-pill"
          >
            {{ post.Category_Name }}
          </RouterLink>

          <h1 class="art-h1">{{ post.Title }}</h1>

          <div class="art-meta-bar">
            <span><i class="ri-user-smile-line"></i> {{ post.Author }}</span>
            <span v-if="post.Published_at || post.Updated_at">
              <i class="ri-calendar-line"></i>
              {{ formatDate(post.Published_at || post.Updated_at) }}
            </span>
            <span><i class="ri-time-line"></i> {{ readingMinutes }} phút đọc</span>
          </div>
        </header>

        <!-- FEATURED IMAGE -->
        <figure v-if="post.Featured_Image" class="art-cover">
          <img :src="post.Featured_Image" :alt="post.Featured_Alt || post.Title" />
          <figcaption v-if="post.Featured_Alt && post.Featured_Alt !== post.Title">
            {{ post.Featured_Alt }}
          </figcaption>
        </figure>

        <!-- AUTO TABLE OF CONTENTS (EASY TOC PLUGIN STYLE) -->
        <nav
          v-if="post.TOC_Enabled && renderedArticle.tocItems.length > 0"
          class="auto-toc-box"
          :aria-label="post.TOC_Title"
        >
          <div class="toc-header" @click="tocOpen = !tocOpen">
            <div class="toc-header-left">
              <i class="ri-list-ordered-2"></i>
              <strong>{{ post.TOC_Title }}</strong>
              <span class="toc-count">{{ renderedArticle.tocItems.length }} mục</span>
            </div>
            <button type="button" class="toc-toggle-btn" :aria-expanded="tocOpen">
              <span>{{ tocOpen ? 'Thu gọn' : 'Mở rộng' }}</span>
              <i :class="tocOpen ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line'"></i>
            </button>
          </div>

          <ol v-show="tocOpen" class="toc-list">
            <li
              v-for="item in renderedArticle.tocItems"
              :key="item.id"
              :class="[`lvl-${item.level}`, { active: activeTocId === item.id }]"
            >
              <a :href="`#${item.id}`" @click.prevent="scrollToHeading(item.id)">
                <span class="toc-num">{{ item.number }}.</span>
                <span class="toc-text">{{ item.text }}</span>
              </a>
            </li>
          </ol>
        </nav>

        <!-- ARTICLE CONTENT -->
        <div class="art-prose" v-html="renderedArticle.html"></div>

        <!-- TAGS + SHARE -->
        <div class="art-footer-bar">
          <div v-if="post.tagsList.length" class="art-tags">
            <span class="tags-label"><i class="ri-price-tag-3-line"></i> Thẻ:</span>
            <span v-for="t in post.tagsList" :key="t" class="art-tag-chip">#{{ t }}</span>
          </div>

          <div class="art-share">
            <span class="share-label">Chia sẻ:</span>
            <button type="button" class="share-btn" @click="copyArticleLink">
              <i :class="copiedToast ? 'ri-check-line' : 'ri-link'"></i>
              <span>{{ copiedToast ? 'Đã chép link!' : 'Sao chép link' }}</span>
            </button>
            <a
              :href="shareTelegramUrl()"
              target="_blank"
              rel="noopener noreferrer"
              class="share-btn tg"
              title="Chia sẻ lên Telegram"
            >
              <i class="ri-telegram-fill"></i>
            </a>
            <a
              :href="shareFacebookUrl()"
              target="_blank"
              rel="noopener noreferrer"
              class="share-btn fb"
              title="Chia sẻ lên Facebook"
            >
              <i class="ri-facebook-circle-fill"></i>
            </a>
          </div>
        </div>

        <!-- ORDER CTA BANNER -->
        <div class="art-order-banner">
          <div class="aob-text">
            <strong>Thèm món Việt chuẩn vị ngay lúc này?</strong>
            <p>
              {{ brand.siteName }} phục vụ cơm văn phòng, lẩu, món nhậu &amp; đi chợ hộ giao nhanh 24/24 tại Manila!
            </p>
          </div>
          <RouterLink to="/vi" class="bh-order-cta">
            <i class="ri-shopping-basket-2-fill"></i>
            <span>Đặt món ngay</span>
          </RouterLink>
        </div>
      </article>

      <!-- RELATED POSTS -->
      <section v-if="post && relatedPosts.length" class="related-section">
        <h2 class="rel-heading">Bài viết liên quan</h2>
        <div class="rel-grid">
          <RouterLink
            v-for="rel in relatedPosts"
            :key="rel.ID || rel.Slug"
            :to="`/blog/${rel.Slug}`"
            class="rel-card"
          >
            <div class="rel-media">
              <img
                v-if="rel.Featured_Image"
                :src="rel.Featured_Image"
                :alt="rel.Featured_Alt || rel.Title"
                loading="lazy"
              />
              <div v-else class="rel-placeholder">
                <i class="ri-article-line"></i>
              </div>
            </div>
            <div class="rel-body">
              <span v-if="rel.Category_Name" class="rel-cat">{{ rel.Category_Name }}</span>
              <h3>{{ rel.Title }}</h3>
              <span class="rel-date">{{ formatDate(rel.Published_at || rel.Updated_at) }}</span>
            </div>
          </RouterLink>
        </div>
      </section>
    </main>
  </div>
</template>

<style scoped>
.blog-detail-page {
  min-height: 100vh;
  background: var(--sa-bg, #f6f8fa);
  color: var(--sa-text, #111827);
}
.blog-detail-page.theme-light {
  --sa-text: #111827;
  --sa-text-muted: #64748b;
  --sa-border: #e2e8f0;
  --sa-accent-soft: var(--sa-primary-soft, rgba(5, 150, 105, 0.12));
}
.blog-detail-page.theme-dark {
  --sa-text: #f1f5f9;
  --sa-text-muted: #94a3b8;
  --sa-border: rgba(148, 163, 184, 0.22);
  --sa-accent-soft: var(--sa-primary-soft, rgba(16, 185, 129, 0.16));
}

/* SHARED HEADER (EMERALD BRAND BAR SYNCED WITH ORDER HEADER) */
.blog-header {
  position: sticky;
  top: 0;
  z-index: 60;
  min-height: 64px;
  background: var(
    --sa-top-header-bg,
    linear-gradient(135deg, #059669 0%, #047857 58%, #065f46 100%)
  );
  border-bottom: 1px solid rgba(255, 255, 255, 0.14);
  box-shadow: 0 4px 18px rgba(var(--sa-primary-dark-rgb, 4, 120, 87), 0.18);
}
.bh-inner {
  max-width: 1140px;
  min-height: 64px;
  margin: 0 auto;
  padding: 0 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.bh-brand-cluster {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}
.bh-brand {
  display: flex;
  align-items: center;
  gap: 11px;
  text-decoration: none;
  color: var(--sa-on-primary, #ffffff);
  min-width: 0;
}
.bh-logo {
  width: 40px;
  height: 40px;
  border-radius: 11px;
  object-fit: contain;
  background: #ffffff;
  border: 1px solid rgba(255, 255, 255, 0.4);
  padding: 2px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.14);
  flex-shrink: 0;
}
.bh-brand-text {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
}
.bh-brand-text strong {
  font-size: 15.5px;
  font-weight: 800;
  color: var(--sa-on-primary, #ffffff);
  line-height: 1.2;
}
.bh-brand-text span {
  font-size: 11.5px;
  font-weight: 500;
  color: var(--sa-on-primary-muted, rgba(255, 255, 255, 0.85));
}
.bh-nav {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}
.bh-nav-links {
  display: inline-flex;
  align-items: center;
  gap: 18px;
  margin-left: 6px;
  padding-left: 16px;
  border-left: 1px solid rgba(255, 255, 255, 0.24);
  flex-shrink: 0;
}
.bh-nav-link {
  position: relative;
  display: inline-flex;
  align-items: center;
  text-decoration: none;
  font-size: 14px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.82);
  padding: 6px 0;
  background: transparent;
  white-space: nowrap;
  transition: color 0.18s ease, opacity 0.18s ease;
}
.bh-nav-link::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 2px;
  border-radius: 999px;
  background: var(--sa-secondary-bright, #fde047);
  transform: scaleX(0);
  transform-origin: center;
  opacity: 0;
  transition: transform 0.2s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.18s ease;
}
.bh-nav-link:hover {
  color: #ffffff;
}
.bh-nav-link:hover::after {
  transform: scaleX(0.65);
  opacity: 0.75;
}
.bh-nav-link.active {
  color: #ffffff;
  font-weight: 800;
}
.bh-nav-link.active::after {
  transform: scaleX(1);
  opacity: 1;
}
.bh-nav-dropdown {
  position: relative;
  display: inline-flex;
  align-items: center;
}
.bh-nav-dropdown-trigger {
  border: none;
  font-family: inherit;
  cursor: pointer;
  gap: 3px;
}
.bh-nav-chevron {
  font-size: 15px;
  line-height: 1;
  opacity: 0.85;
  transition: transform 0.2s ease;
}
.bh-nav-dropdown:hover .bh-nav-dropdown-trigger,
.bh-nav-dropdown:focus-within .bh-nav-dropdown-trigger {
  color: #ffffff;
}
.bh-nav-dropdown:hover .bh-nav-dropdown-trigger::after,
.bh-nav-dropdown:focus-within .bh-nav-dropdown-trigger::after {
  transform: scaleX(0.65);
  opacity: 0.75;
}
.bh-nav-dropdown:hover .bh-nav-chevron,
.bh-nav-dropdown:focus-within .bh-nav-chevron {
  transform: rotate(180deg);
}
.bh-nav-dropdown-menu {
  position: absolute;
  top: calc(100% + 10px);
  left: 0;
  min-width: 268px;
  padding: 6px;
  border-radius: 14px;
  background: var(--sa-surface, #ffffff);
  border: 1px solid var(--sa-border, #e2e8f0);
  box-shadow:
    0 18px 42px rgba(15, 23, 42, 0.18),
    0 4px 12px rgba(15, 23, 42, 0.08);
  display: flex;
  flex-direction: column;
  gap: 2px;
  z-index: 120;
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
  transform: translateY(6px);
  transition:
    opacity 0.18s ease,
    transform 0.2s cubic-bezier(0.22, 1, 0.36, 1),
    visibility 0s linear 0.18s;
}
.bh-nav-dropdown-menu::before {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  top: -12px;
  height: 12px;
}
.theme-dark .bh-nav-dropdown-menu {
  box-shadow:
    0 20px 46px rgba(0, 0, 0, 0.5),
    0 4px 14px rgba(0, 0, 0, 0.32);
}
.bh-nav-dropdown:hover .bh-nav-dropdown-menu,
.bh-nav-dropdown:focus-within .bh-nav-dropdown-menu {
  opacity: 1;
  visibility: visible;
  pointer-events: auto;
  transform: translateY(0);
  transition-delay: 0s;
}
.bh-scam-dd-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 11px;
  border-radius: 10px;
  text-decoration: none;
  color: var(--sa-text, #111827);
  transition: background-color 0.15s ease;
}
.bh-scam-dd-item:hover {
  background: var(--sa-surface-2, #f1f5f9);
}
.bh-scam-dd-ico {
  font-size: 17px;
  flex-shrink: 0;
}
.bh-scam-dd-item.is-verify .bh-scam-dd-ico {
  color: #10b981;
}
.bh-scam-dd-item.is-shops .bh-scam-dd-ico {
  color: #f59e0b;
}
.bh-scam-dd-item.is-alerts .bh-scam-dd-ico {
  color: #f43f5e;
}
.bh-scam-dd-body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 1px;
}
.bh-scam-dd-title {
  font-size: 13px;
  font-weight: 700;
  color: var(--sa-text, #111827);
  line-height: 1.25;
}
.bh-scam-dd-sub {
  font-size: 11.5px;
  font-weight: 500;
  color: var(--sa-text-muted, #64748b);
  line-height: 1.25;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.bh-scam-dd-ext {
  font-size: 14px;
  color: var(--sa-text-muted, #64748b);
  opacity: 0.7;
  flex-shrink: 0;
  transition: transform 0.15s ease, opacity 0.15s ease, color 0.15s ease;
}
.bh-scam-dd-item:hover .bh-scam-dd-ext {
  opacity: 1;
  color: var(--sa-accent, #059669);
  transform: translate(1px, -1px);
}
.bh-icon-btn {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.24);
  background: rgba(255, 255, 255, 0.14);
  color: var(--sa-on-primary, #ffffff);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 17px;
  cursor: pointer;
  transition: all 0.16s ease;
}
.bh-icon-btn:hover {
  border-color: rgba(255, 255, 255, 0.42);
  background: rgba(255, 255, 255, 0.24);
  color: #ffffff;
}
.theme-dark .bh-icon-btn {
  color: var(--sa-secondary-light, #fef08a);
}
.bh-order-cta {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 9px 15px;
  border-radius: 999px;
  background: var(--sa-accent, #059669);
  color: var(--sa-on-accent, #ffffff);
  font-size: 13.5px;
  font-weight: 800;
  text-decoration: none;
  white-space: nowrap;
  transition: all 0.16s ease;
}
.blog-header .bh-order-cta {
  height: 38px;
  padding: 0 15px;
  background: #ffffff;
  border: 1px solid rgba(255, 255, 255, 0.92);
  color: var(--sa-primary-dark, #065f46);
  font-size: 13px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.14);
}
.blog-header .bh-order-cta:hover {
  background: var(--sa-secondary-bright, #fde047);
  border-color: var(--sa-secondary-bright, #fde047);
  color: #0f172a;
  transform: translateY(-1px);
}

.article-shell {
  max-width: 860px;
  margin: 0 auto;
  padding: 26px 20px 64px;
  box-sizing: border-box;
}

.article-card {
  background: var(--sa-surface, #ffffff);
  border: 1px solid var(--sa-border, #e5e7eb);
  border-radius: 20px;
  padding: 32px 36px;
  box-shadow: 0 6px 28px rgba(15, 23, 42, 0.05);
}

.preview-banner {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  margin-bottom: 18px;
  border-radius: 10px;
  background: #fef3c7;
  color: #92400e;
  font-size: 13px;
  border: 1px solid #fde68a;
}

.art-breadcrumb {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: var(--sa-text-muted, #6b7280);
  margin-bottom: 14px;
}
.art-breadcrumb a {
  color: var(--sa-accent, #059669);
  text-decoration: none;
  font-weight: 600;
}

.art-cat-pill {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 999px;
  background: var(--sa-accent-soft, rgba(5, 150, 105, 0.12));
  color: var(--sa-accent, #059669);
  font-size: 12.5px;
  font-weight: 800;
  text-decoration: none;
  margin-bottom: 12px;
}

.art-h1 {
  margin: 0 0 14px;
  font-size: clamp(24px, 4vw, 34px);
  font-weight: 800;
  line-height: 1.28;
  letter-spacing: -0.015em;
}

.art-meta-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 16px;
  font-size: 13.5px;
  color: var(--sa-text-muted, #6b7280);
  padding-bottom: 18px;
  border-bottom: 1px solid var(--sa-border, #e5e7eb);
}
.art-meta-bar span {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.art-cover {
  margin: 22px 0;
}
.art-cover img {
  width: 100%;
  border-radius: 14px;
  display: block;
  max-height: 480px;
  object-fit: cover;
}
.art-cover figcaption {
  margin-top: 8px;
  text-align: center;
  font-size: 13px;
  color: var(--sa-text-muted, #6b7280);
  font-style: italic;
}

/* AUTO TABLE OF CONTENTS (EASY TOC BOX) */
.auto-toc-box {
  margin: 22px 0 26px;
  border: 1px solid var(--sa-border, #d1d5db);
  border-left: 4px solid var(--sa-accent, #059669);
  border-radius: 12px;
  background: var(--sa-surface-2, #f8fafc);
  overflow: hidden;
}
.toc-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 13px 16px;
  cursor: pointer;
  user-select: none;
}
.toc-header-left {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
}
.toc-header-left i {
  color: var(--sa-accent, #059669);
  font-size: 18px;
}
.toc-count {
  font-size: 12px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 999px;
  background: var(--sa-accent-soft, rgba(5, 150, 105, 0.12));
  color: var(--sa-accent, #059669);
}
.toc-toggle-btn {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  border: 1px solid var(--sa-border, #cbd5e1);
  background: var(--sa-surface, #ffffff);
  color: var(--sa-text, #334155);
  border-radius: 8px;
  padding: 4px 10px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
}
.toc-list {
  list-style: none;
  margin: 0;
  padding: 4px 16px 14px;
  border-top: 1px solid var(--sa-border, #e5e7eb);
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.toc-list li a {
  display: flex;
  align-items: baseline;
  gap: 7px;
  padding: 5px 8px;
  border-radius: 7px;
  text-decoration: none;
  color: var(--sa-text, #1f2937);
  font-size: 14px;
  line-height: 1.45;
  transition: background 0.15s ease, color 0.15s ease;
}
.toc-list li a:hover,
.toc-list li.active a {
  background: var(--sa-accent-soft, rgba(5, 150, 105, 0.12));
  color: var(--sa-accent, #059669);
}
.toc-list li.lvl-2 a {
  font-weight: 700;
}
.toc-list li.lvl-3 {
  padding-left: 18px;
}
.toc-list li.lvl-4 {
  padding-left: 34px;
}
.toc-list li.lvl-4 a {
  font-size: 13.5px;
  color: var(--sa-text-muted, #6b7280);
}
.toc-num {
  color: var(--sa-accent, #059669);
  font-weight: 800;
  flex-shrink: 0;
}

/* PROSE CONTENT */
.art-prose {
  font-size: 16.5px;
  line-height: 1.82;
  color: var(--sa-text, #1f2937);
  word-break: break-word;
}
.art-prose :deep(h2) {
  font-size: 1.42em;
  font-weight: 800;
  margin: 1.6em 0 0.65em;
  padding-bottom: 8px;
  border-bottom: 2px solid var(--sa-border, #e5e7eb);
  scroll-margin-top: 84px;
  line-height: 1.35;
}
.art-prose :deep(h3) {
  font-size: 1.2em;
  font-weight: 700;
  margin: 1.35em 0 0.5em;
  scroll-margin-top: 84px;
  line-height: 1.4;
}
.art-prose :deep(h4) {
  font-size: 1.06em;
  font-weight: 700;
  margin: 1.15em 0 0.45em;
  scroll-margin-top: 84px;
}
.art-prose :deep(p) {
  margin: 0 0 1.05em;
}
.art-prose :deep(ul),
.art-prose :deep(ol) {
  padding-left: 24px;
  margin: 0 0 1.15em;
}
.art-prose :deep(li) {
  margin-bottom: 6px;
}
.art-prose :deep(a) {
  color: var(--sa-accent, #059669);
  font-weight: 600;
  text-decoration: underline;
  text-underline-offset: 3px;
}
.art-prose :deep(blockquote) {
  margin: 1.3em 0;
  padding: 14px 18px;
  border-left: 4px solid var(--sa-accent, #059669);
  background: var(--sa-surface-2, #f8fafc);
  border-radius: 0 10px 10px 0;
  font-style: italic;
}
.art-prose :deep(img) {
  display: block;
  max-width: 100%;
  height: auto;
  margin: 18px auto;
  border-radius: 12px;
}
.art-prose :deep(figure.blog-figure) {
  margin: 22px 0;
}
.art-prose :deep(figure.blog-figure img) {
  margin: 0 auto 8px;
}
.art-prose :deep(figcaption.blog-figcaption) {
  text-align: center;
  font-size: 13.5px;
  color: var(--sa-text-muted, #6b7280);
  font-style: italic;
}
.art-prose :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin: 1.4em 0;
  display: block;
  overflow-x: auto;
}
.art-prose :deep(th),
.art-prose :deep(td) {
  border: 1px solid var(--sa-border, #d1d5db);
  padding: 9px 12px;
  text-align: left;
}
.art-prose :deep(th) {
  background: var(--sa-surface-2, #f3f4f6);
  font-weight: 700;
}
.art-prose :deep(hr) {
  border: none;
  border-top: 1px solid var(--sa-border, #e5e7eb);
  margin: 1.8em 0;
}

/* TAGS & SHARE */
.art-footer-bar {
  margin-top: 28px;
  padding-top: 18px;
  border-top: 1px solid var(--sa-border, #e5e7eb);
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
}
.art-tags {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
}
.tags-label,
.share-label {
  font-size: 13px;
  font-weight: 700;
  color: var(--sa-text-muted, #6b7280);
}
.art-tag-chip {
  padding: 4px 10px;
  border-radius: 999px;
  background: var(--sa-surface-2, #f3f4f6);
  font-size: 12.5px;
  font-weight: 600;
}
.art-share {
  display: flex;
  align-items: center;
  gap: 7px;
}
.share-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 7px 11px;
  border-radius: 9px;
  border: 1px solid var(--sa-border, #e5e7eb);
  background: var(--sa-surface-2, #f9fafb);
  color: var(--sa-text, #111827);
  font-size: 13px;
  font-weight: 700;
  text-decoration: none;
  cursor: pointer;
}
.share-btn.tg {
  color: #0088cc;
}
.share-btn.fb {
  color: #1877f2;
}

/* CTA BANNER */
.art-order-banner {
  margin-top: 26px;
  padding: 20px 22px;
  border-radius: 14px;
  background: var(--sa-accent-soft, rgba(5, 150, 105, 0.1));
  border: 1px solid var(--sa-accent, #059669);
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
}
.aob-text strong {
  font-size: 16px;
  display: block;
}
.aob-text p {
  margin: 4px 0 0;
  font-size: 13.5px;
  color: var(--sa-text-muted, #4b5563);
}

/* RELATED POSTS */
.related-section {
  margin-top: 36px;
}
.rel-heading {
  margin: 0 0 16px;
  font-size: 20px;
  font-weight: 800;
}
.rel-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}
.rel-card {
  background: var(--sa-surface, #ffffff);
  border: 1px solid var(--sa-border, #e5e7eb);
  border-radius: 14px;
  overflow: hidden;
  text-decoration: none;
  color: inherit;
  transition: transform 0.16s ease;
}
.rel-card:hover {
  transform: translateY(-2px);
}
.rel-media {
  aspect-ratio: 16 / 9;
  background: var(--sa-surface-2, #f3f4f6);
}
.rel-media img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.rel-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--sa-text-muted, #9ca3af);
  font-size: 28px;
}
.rel-body {
  padding: 13px 14px 16px;
}
.rel-cat {
  font-size: 11.5px;
  font-weight: 700;
  color: var(--sa-accent, #059669);
}
.rel-body h3 {
  margin: 5px 0 6px;
  font-size: 15px;
  font-weight: 800;
  line-height: 1.38;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.rel-date {
  font-size: 12px;
  color: var(--sa-text-muted, #6b7280);
}

/* SKELETON + NOT FOUND */
.article-skeleton,
.not-found-card {
  background: var(--sa-surface, #ffffff);
  border: 1px solid var(--sa-border, #e5e7eb);
  border-radius: 20px;
  padding: 36px;
}
.ask-title {
  height: 34px;
  border-radius: 8px;
  background: var(--sa-surface-2, #e5e7eb);
  margin: 14px 0 20px;
}
.ask-img {
  aspect-ratio: 16 / 9;
  border-radius: 12px;
  background: var(--sa-surface-2, #e5e7eb);
  margin-bottom: 20px;
}
.ask-line {
  height: 14px;
  border-radius: 6px;
  background: var(--sa-surface-2, #e5e7eb);
  margin-bottom: 10px;
}
.ask-line.short {
  width: 45%;
}
.not-found-card {
  text-align: center;
}
.not-found-card > i {
  font-size: 46px;
  color: var(--sa-text-muted, #9ca3af);
}
.nf-actions {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-top: 18px;
  flex-wrap: wrap;
}
.btn-primary,
.btn-outline {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 10px 18px;
  border-radius: 999px;
  font-weight: 700;
  font-size: 14px;
  text-decoration: none;
}
.btn-primary {
  background: var(--sa-accent, #059669);
  color: var(--sa-on-accent, #ffffff);
}
.btn-outline {
  border: 1px solid var(--sa-border, #d1d5db);
  color: var(--sa-text, #111827);
}

@media (max-width: 720px) {
  .bh-inner {
    padding: 10px 14px;
  }
  .bh-brand-text span,
  .bh-nav-links {
    display: none;
  }
  .article-shell {
    padding: 14px 12px 48px;
  }
  .article-card {
    padding: 20px 16px;
    border-radius: 16px;
  }
  .art-prose {
    font-size: 15.5px;
  }
  .rel-grid {
    grid-template-columns: 1fr;
  }
}
</style>
