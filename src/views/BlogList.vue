<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getOneSheet } from '@/config/api'
import { resolveBrandAssets } from '@/utils/brandAssets.js'
import {
  normalizeThemeConfig,
  buildStorefrontThemeVars,
} from '@/utils/storefrontTheme.js'

const SA_THEME_MODE_KEY = 'SA_THEME_MODE'
import {
  normalizeBlogPost,
  normalizeBlogCategory,
  compareBlogPosts,
  isPostPubliclyVisible,
  estimateReadingMinutes,
  buildAutoExcerpt,
  buildBlogListJsonLd,
} from '@/utils/blogSeo.js'

const route = useRoute()
const router = useRouter()

const loading = ref(true)
const posts = ref([])
const categories = ref([])
const brand = ref(resolveBrandAssets(null, 'SA KITCHEN'))
const themeConfig = ref(normalizeThemeConfig(null))
const themeMode = ref('light')

const selectedCategorySlug = ref(String(route.query.cat || '').trim())
const searchQuery = ref(String(route.query.q || '').trim())
const currentPage = ref(1)
const PAGE_SIZE = 9

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

function updateDocumentMeta() {
  const activeCat = allCategoryTabs.value.find((c) => c.Slug === selectedCategorySlug.value)
  const title = activeCat
    ? `${activeCat.Name} - Blog ${brand.value.siteName}`
    : `Blog & Cẩm Nang Ẩm Thực - ${brand.value.siteName}`
  const desc = activeCat?.Description
    ? activeCat.Description
    : `Tổng hợp bài viết, cẩm nang ẩm thực Việt tại Manila và tin tức mới nhất từ ${brand.value.siteName}.`

  document.title = title
  const metaDesc = document.querySelector('meta[name="description"]')
  if (metaDesc) metaDesc.setAttribute('content', desc)
  const canonical = document.querySelector('link[rel="canonical"]')
  if (canonical) canonical.setAttribute('href', `${window.location.origin}/blog`)
  const jsonLdEl = document.getElementById('sa-seo-jsonld')
  if (jsonLdEl) {
    jsonLdEl.textContent = JSON.stringify(buildBlogListJsonLd(brand.value, window.location.origin))
  }
}

async function loadData() {
  loading.value = true
  try {
    const [postsRes, catsRes, logoRes, displayRes] = await Promise.all([
      getOneSheet('blog_posts'),
      getOneSheet('blog_categories'),
      getOneSheet('logo'),
      getOneSheet('display_config'),
    ])

    posts.value = (postsRes?.data || [])
      .map((r) => normalizeBlogPost(r))
      .filter((p) => isPostPubliclyVisible(p))
      .sort(compareBlogPosts)

    categories.value = (catsRes?.data || [])
      .map((r) => normalizeBlogCategory(r))
      .filter((c) => c.Name && c.Slug)
      .sort((a, b) => a.Order - b.Order || a.Name.localeCompare(b.Name))

    brand.value = resolveBrandAssets(logoRes?.data?.[0] || null, 'SA KITCHEN')
    const displayRow =
      (displayRes?.data || []).find((r) => r.ID === 'DEFAULT') || displayRes?.data?.[0] || null
    themeConfig.value = normalizeThemeConfig(displayRow?.Theme_config || displayRow?.themeConfig)
    initThemeMode()
    updateDocumentMeta()
  } catch (err) {
    console.error('BlogList loadData error:', err)
  } finally {
    loading.value = false
  }
}

onMounted(loadData)

watch(
  () => route.query.cat,
  (val) => {
    selectedCategorySlug.value = String(val || '').trim()
    currentPage.value = 1
    updateDocumentMeta()
  },
)

// Auto-merge defined categories + any category referenced by published posts
const allCategoryTabs = computed(() => {
  const countBySlug = new Map()
  const extraBySlug = new Map()
  for (const p of posts.value) {
    if (!p.Category_Slug) continue
    countBySlug.set(p.Category_Slug, (countBySlug.get(p.Category_Slug) || 0) + 1)
    if (!extraBySlug.has(p.Category_Slug)) {
      extraBySlug.set(p.Category_Slug, {
        Name: p.Category_Name || p.Category_Slug,
        Slug: p.Category_Slug,
        Description: '',
      })
    }
  }

  const list = []
  const seen = new Set()
  for (const cat of categories.value) {
    const count = countBySlug.get(cat.Slug) || 0
    if (count > 0 || selectedCategorySlug.value === cat.Slug) {
      list.push({ ...cat, count })
      seen.add(cat.Slug)
    }
  }
  for (const [slug, extra] of extraBySlug.entries()) {
    if (!seen.has(slug)) {
      list.push({ ...extra, count: countBySlug.get(slug) || 0 })
    }
  }
  return list
})

const filteredPosts = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  const cat = selectedCategorySlug.value
  return posts.value.filter((p) => {
    if (cat && p.Category_Slug !== cat) return false
    if (q) {
      const hay = `${p.Title} ${p.Excerpt} ${p.Category_Name} ${p.Tags} ${p.Focus_Keyword}`.toLowerCase()
      if (!hay.includes(q)) return false
    }
    return true
  })
})

const featuredPost = computed(() => {
  if (currentPage.value !== 1 || searchQuery.value.trim() || selectedCategorySlug.value) return null
  return filteredPosts.value[0] || null
})

const gridPostsSource = computed(() =>
  featuredPost.value ? filteredPosts.value.slice(1) : filteredPosts.value,
)

const totalPages = computed(() => Math.max(1, Math.ceil(gridPostsSource.value.length / PAGE_SIZE)))

const pagedPosts = computed(() => {
  const start = (currentPage.value - 1) * PAGE_SIZE
  return gridPostsSource.value.slice(start, start + PAGE_SIZE)
})

function selectCategory(slug) {
  selectedCategorySlug.value = slug
  currentPage.value = 1
  router.replace({ path: '/blog', query: slug ? { cat: slug } : {} })
}

function goToPage(nextPage) {
  const clamped = Math.max(1, Math.min(totalPages.value, nextPage))
  currentPage.value = clamped
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function getExcerpt(post) {
  return post.Excerpt || post.SEO_Description || buildAutoExcerpt(post.Content_HTML, 145)
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
    class="blog-public-page"
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
                  :key="'bl-scam-' + item.key"
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

    <main class="blog-container">
      <!-- HERO + SEARCH + CATEGORIES -->
      <section class="blog-hero">
        <div class="blog-breadcrumb">
          <RouterLink to="/vi">Trang chủ</RouterLink>
          <i class="ri-arrow-right-s-line"></i>
          <span>Blog</span>
        </div>
        <h1 class="blog-h1">Blog &amp; Cẩm Nang Ẩm Thực {{ brand.siteName }}</h1>
        <p class="blog-hero-desc">
          Khám phá bí quyết ẩm thực Việt chuẩn vị, gợi ý món ngon mỗi ngày và kinh nghiệm ăn uống tại Manila, Philippines.
        </p>

        <div class="blog-search-row">
          <div class="blog-search-box">
            <i class="ri-search-line"></i>
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Tìm bài viết, món ngon, kinh nghiệm..."
              @input="currentPage = 1"
            />
            <button
              v-if="searchQuery"
              type="button"
              class="bs-clear"
              @click="searchQuery = ''; currentPage = 1"
            >
              <i class="ri-close-line"></i>
            </button>
          </div>
        </div>

        <!-- AUTO CATEGORY FILTER PILLS -->
        <div class="cat-pills-row">
          <button
            type="button"
            class="cat-pill"
            :class="{ active: !selectedCategorySlug }"
            @click="selectCategory('')"
          >
            Tất cả <span>{{ posts.length }}</span>
          </button>
          <button
            v-for="cat in allCategoryTabs"
            :key="cat.Slug"
            type="button"
            class="cat-pill"
            :class="{ active: selectedCategorySlug === cat.Slug }"
            @click="selectCategory(cat.Slug)"
          >
            {{ cat.Name }} <span>{{ cat.count }}</span>
          </button>
        </div>
      </section>

      <!-- LOADING SKELETON -->
      <div v-if="loading" class="blog-grid">
        <div v-for="n in 6" :key="n" class="blog-skeleton-card">
          <div class="sk-img"></div>
          <div class="sk-line"></div>
          <div class="sk-line short"></div>
        </div>
      </div>

      <!-- EMPTY STATE -->
      <div v-else-if="!filteredPosts.length" class="blog-empty">
        <i class="ri-article-line"></i>
        <h2>Chưa có bài viết phù hợp</h2>
        <p v-if="searchQuery || selectedCategorySlug">
          Thử xóa bộ lọc hoặc quay lại xem tất cả bài viết trên {{ brand.siteName }}.
        </p>
        <p v-else>
          Các bài viết cẩm nang ẩm thực sẽ sớm được cập nhật! Trong lúc chờ đợi, mời bạn xem thực đơn nhé.
        </p>
        <div class="empty-actions">
          <button
            v-if="searchQuery || selectedCategorySlug"
            type="button"
            class="btn-outline"
            @click="searchQuery = ''; selectCategory('')"
          >
            Xem tất cả bài viết
          </button>
          <RouterLink to="/vi" class="btn-primary">
            <i class="ri-restaurant-2-line"></i> Xem thực đơn đặt món
          </RouterLink>
        </div>
      </div>

      <template v-else>
        <!-- FEATURED HERO POST -->
        <RouterLink
          v-if="featuredPost"
          :to="`/blog/${featuredPost.Slug}`"
          class="featured-card"
        >
          <div class="fc-media">
            <img
              v-if="featuredPost.Featured_Image"
              :src="featuredPost.Featured_Image"
              :alt="featuredPost.Featured_Alt || featuredPost.Title"
            />
            <div v-else class="fc-placeholder">
              <i class="ri-restaurant-line"></i>
            </div>
            <span class="fc-new-badge" :class="{ 'is-pinned': featuredPost.Pinned }">
              <i v-if="featuredPost.Pinned" class="ri-pushpin-2-fill"></i>
              <span>{{ featuredPost.Pinned ? 'Bài ghim nổi bật' : 'Bài mới nhất' }}</span>
            </span>
          </div>
          <div class="fc-body">
            <div class="post-meta-top">
              <span v-if="featuredPost.Category_Name" class="post-cat-tag">
                {{ featuredPost.Category_Name }}
              </span>
              <span class="post-meta-item">
                <i class="ri-calendar-line"></i>
                {{ formatDate(featuredPost.Published_at || featuredPost.Updated_at) }}
              </span>
              <span class="post-meta-item">
                <i class="ri-time-line"></i>
                {{ estimateReadingMinutes(featuredPost.Content_HTML) }} phút đọc
              </span>
            </div>
            <h2 class="fc-title">{{ featuredPost.Title }}</h2>
            <p class="fc-excerpt">{{ getExcerpt(featuredPost) }}</p>
            <span class="fc-readmore">
              Đọc chi tiết <i class="ri-arrow-right-line"></i>
            </span>
          </div>
        </RouterLink>

        <!-- POSTS GRID -->
        <div v-if="pagedPosts.length" class="blog-grid">
          <RouterLink
            v-for="post in pagedPosts"
            :key="post.ID || post.Slug"
            :to="`/blog/${post.Slug}`"
            class="blog-card"
          >
            <div class="bc-media">
              <img
                v-if="post.Featured_Image"
                :src="post.Featured_Image"
                :alt="post.Featured_Alt || post.Title"
                loading="lazy"
              />
              <div v-else class="bc-placeholder">
                <i class="ri-article-line"></i>
              </div>
              <span v-if="post.Pinned" class="bc-pin-badge">
                <i class="ri-pushpin-2-fill"></i>
                <span>Đã ghim</span>
              </span>
            </div>
            <div class="bc-body">
              <div class="post-meta-top">
                <span v-if="post.Category_Name" class="post-cat-tag">{{ post.Category_Name }}</span>
                <span class="post-meta-item">
                  {{ formatDate(post.Published_at || post.Updated_at) }}
                </span>
                <span class="post-meta-item">
                  • {{ estimateReadingMinutes(post.Content_HTML) }} phút đọc
                </span>
              </div>
              <h2 class="bc-title">{{ post.Title }}</h2>
              <p class="bc-excerpt">{{ getExcerpt(post) }}</p>
            </div>
          </RouterLink>
        </div>

        <!-- PAGINATION -->
        <div v-if="totalPages > 1" class="blog-pagination">
          <button
            type="button"
            class="pg-btn"
            :disabled="currentPage <= 1"
            @click="goToPage(currentPage - 1)"
          >
            <i class="ri-arrow-left-s-line"></i> Trang trước
          </button>
          <span class="pg-info">Trang {{ currentPage }} / {{ totalPages }}</span>
          <button
            type="button"
            class="pg-btn"
            :disabled="currentPage >= totalPages"
            @click="goToPage(currentPage + 1)"
          >
            Trang sau <i class="ri-arrow-right-s-line"></i>
          </button>
        </div>
      </template>
    </main>

    <!-- CLEAN FOOTER CTA -->
    <footer class="blog-footer">
      <div class="bf-inner">
        <div>
          <strong>{{ brand.siteName }}</strong>
          <p>Ẩm thực Việt chuẩn vị giao nhanh 24/24 tại Manila, Philippines.</p>
        </div>
        <RouterLink to="/vi" class="bh-order-cta">
          <i class="ri-shopping-basket-2-fill"></i>
          <span>Mở Menu đặt món ngay</span>
        </RouterLink>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.blog-public-page {
  min-height: 100vh;
  background: var(--sa-bg, #f6f8fa);
  color: var(--sa-text, #111827);
  display: flex;
  flex-direction: column;
}
.blog-public-page.theme-light {
  --sa-text: #111827;
  --sa-text-muted: #64748b;
  --sa-border: #e2e8f0;
  --sa-accent-soft: var(--sa-primary-soft, rgba(5, 150, 105, 0.12));
}
.blog-public-page.theme-dark {
  --sa-text: #f1f5f9;
  --sa-text-muted: #94a3b8;
  --sa-border: rgba(148, 163, 184, 0.22);
  --sa-accent-soft: var(--sa-primary-soft, rgba(16, 185, 129, 0.16));
}

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
  background: transparent;
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
  box-shadow: 0 4px 12px rgba(5, 150, 105, 0.22);
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

.blog-container {
  max-width: 1140px;
  width: 100%;
  margin: 0 auto;
  padding: 28px 20px 56px;
  box-sizing: border-box;
  flex: 1;
}

.blog-hero {
  text-align: center;
  max-width: 780px;
  margin: 0 auto 30px;
}
.blog-breadcrumb {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: var(--sa-text-muted, #6b7280);
  margin-bottom: 10px;
}
.blog-breadcrumb a {
  color: var(--sa-accent, #059669);
  text-decoration: none;
  font-weight: 600;
}
.blog-h1 {
  margin: 0 0 10px;
  font-size: clamp(24px, 4vw, 34px);
  font-weight: 800;
  line-height: 1.25;
}
.blog-hero-desc {
  margin: 0 0 20px;
  font-size: 15px;
  line-height: 1.6;
  color: var(--sa-text-muted, #6b7280);
}

.blog-search-row {
  display: flex;
  justify-content: center;
  margin-bottom: 18px;
}
.blog-search-box {
  position: relative;
  width: 100%;
  max-width: 480px;
  display: flex;
  align-items: center;
}
.blog-search-box > i {
  position: absolute;
  left: 14px;
  color: var(--sa-text-muted, #6b7280);
  font-size: 17px;
}
.blog-search-box input {
  width: 100%;
  padding: 11px 38px 11px 40px;
  border-radius: 999px;
  border: 1px solid var(--sa-border, #e5e7eb);
  background: var(--sa-surface, #ffffff);
  color: var(--sa-text, #111827);
  font-size: 14.5px;
  box-sizing: border-box;
}
.blog-search-box input:focus {
  outline: none;
  border-color: var(--sa-accent, #059669);
}
.bs-clear {
  position: absolute;
  right: 10px;
  border: none;
  background: none;
  color: var(--sa-text-muted, #6b7280);
  font-size: 18px;
  cursor: pointer;
}

.cat-pills-row {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
}
.cat-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  border-radius: 999px;
  border: 1px solid var(--sa-border, #e5e7eb);
  background: var(--sa-surface, #ffffff);
  color: var(--sa-text, #111827);
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s ease;
}
.cat-pill span {
  font-size: 11.5px;
  padding: 1px 6px;
  border-radius: 999px;
  background: var(--sa-surface-2, #f3f4f6);
  color: var(--sa-text-muted, #6b7280);
}
.cat-pill.active {
  background: var(--sa-accent, #059669);
  border-color: var(--sa-accent, #059669);
  color: var(--sa-on-accent, #ffffff);
}
.cat-pill.active span {
  background: rgba(255, 255, 255, 0.22);
  color: inherit;
}

/* FEATURED POST */
.featured-card {
  display: grid;
  grid-template-columns: 1.15fr 1fr;
  gap: 24px;
  background: var(--sa-surface, #ffffff);
  border: 1px solid var(--sa-border, #e5e7eb);
  border-radius: 18px;
  overflow: hidden;
  text-decoration: none;
  color: inherit;
  margin-bottom: 28px;
  box-shadow: 0 6px 24px rgba(15, 23, 42, 0.06);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.featured-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 30px rgba(15, 23, 42, 0.1);
}
.fc-media {
  position: relative;
  aspect-ratio: 16 / 10;
  background: var(--sa-surface-2, #f3f4f6);
  overflow: hidden;
}
.fc-media img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.fc-placeholder,
.bc-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40px;
  color: var(--sa-text-muted, #9ca3af);
}
.fc-new-badge {
  position: absolute;
  top: 14px;
  left: 14px;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 11px;
  border-radius: 999px;
  background: var(--sa-accent, #059669);
  color: var(--sa-on-accent, #ffffff);
  font-size: 12px;
  font-weight: 800;
}
.fc-new-badge.is-pinned {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  color: #ffffff;
  box-shadow: 0 4px 12px rgba(217, 119, 6, 0.35);
}
.fc-body {
  padding: 24px 26px 24px 4px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}
.fc-title {
  margin: 10px 0 10px;
  font-size: 23px;
  font-weight: 800;
  line-height: 1.32;
}
.fc-excerpt {
  margin: 0 0 16px;
  font-size: 14.5px;
  line-height: 1.65;
  color: var(--sa-text-muted, #6b7280);
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.fc-readmore {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 14px;
  font-weight: 800;
  color: var(--sa-accent, #059669);
}

/* GRID */
.blog-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 20px;
}
.blog-card {
  display: flex;
  flex-direction: column;
  background: var(--sa-surface, #ffffff);
  border: 1px solid var(--sa-border, #e5e7eb);
  border-radius: 16px;
  overflow: hidden;
  text-decoration: none;
  color: inherit;
  transition: transform 0.18s ease, box-shadow 0.18s ease;
}
.blog-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 26px rgba(15, 23, 42, 0.08);
}
.bc-media {
  position: relative;
  aspect-ratio: 16 / 9;
  background: var(--sa-surface-2, #f3f4f6);
  overflow: hidden;
}
.bc-pin-badge {
  position: absolute;
  top: 10px;
  left: 10px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 9px;
  border-radius: 999px;
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  color: #ffffff;
  font-size: 11px;
  font-weight: 800;
  box-shadow: 0 3px 10px rgba(217, 119, 6, 0.32);
}
.bc-media img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.bc-body {
  padding: 16px 18px 20px;
  display: flex;
  flex-direction: column;
  flex: 1;
}
.post-meta-top {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: var(--sa-text-muted, #6b7280);
}
.post-cat-tag {
  padding: 3px 9px;
  border-radius: 999px;
  background: var(--sa-accent-soft, rgba(5, 150, 105, 0.12));
  color: var(--sa-accent, #059669);
  font-weight: 700;
}
.post-meta-item {
  display: inline-flex;
  align-items: center;
  gap: 3px;
}
.bc-title {
  margin: 10px 0 8px;
  font-size: 17px;
  font-weight: 800;
  line-height: 1.38;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.bc-excerpt {
  margin: 0;
  font-size: 13.5px;
  line-height: 1.6;
  color: var(--sa-text-muted, #6b7280);
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* SKELETON */
.blog-skeleton-card {
  background: var(--sa-surface, #ffffff);
  border: 1px solid var(--sa-border, #e5e7eb);
  border-radius: 16px;
  padding: 14px;
}
.sk-img {
  aspect-ratio: 16 / 9;
  border-radius: 10px;
  background: var(--sa-surface-2, #e5e7eb);
  margin-bottom: 12px;
}
.sk-line {
  height: 14px;
  border-radius: 6px;
  background: var(--sa-surface-2, #e5e7eb);
  margin-bottom: 8px;
}
.sk-line.short {
  width: 60%;
}

/* EMPTY */
.blog-empty {
  text-align: center;
  padding: 56px 20px;
  background: var(--sa-surface, #ffffff);
  border: 1px solid var(--sa-border, #e5e7eb);
  border-radius: 18px;
}
.blog-empty > i {
  font-size: 44px;
  color: var(--sa-text-muted, #9ca3af);
}
.blog-empty h2 {
  margin: 10px 0 6px;
  font-size: 20px;
}
.blog-empty p {
  margin: 0 0 18px;
  color: var(--sa-text-muted, #6b7280);
}
.empty-actions {
  display: flex;
  justify-content: center;
  gap: 10px;
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
  cursor: pointer;
}
.btn-primary {
  background: var(--sa-accent, #059669);
  color: var(--sa-on-accent, #ffffff);
  border: none;
}
.btn-outline {
  background: transparent;
  color: var(--sa-text, #111827);
  border: 1px solid var(--sa-border, #d1d5db);
}

/* PAGINATION */
.blog-pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 14px;
  margin-top: 32px;
}
.pg-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 8px 14px;
  border-radius: 10px;
  border: 1px solid var(--sa-border, #e5e7eb);
  background: var(--sa-surface, #ffffff);
  color: var(--sa-text, #111827);
  font-weight: 700;
  font-size: 13.5px;
  cursor: pointer;
}
.pg-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}
.pg-info {
  font-size: 13.5px;
  font-weight: 600;
  color: var(--sa-text-muted, #6b7280);
}

/* FOOTER */
.blog-footer {
  margin-top: auto;
  background: var(--sa-surface, #ffffff);
  border-top: 1px solid var(--sa-border, #e5e7eb);
}
.bf-inner {
  max-width: 1140px;
  margin: 0 auto;
  padding: 22px 20px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
}
.bf-inner p {
  margin: 4px 0 0;
  font-size: 13px;
  color: var(--sa-text-muted, #6b7280);
}

@media (max-width: 960px) {
  .featured-card {
    grid-template-columns: 1fr;
    gap: 0;
  }
  .fc-body {
    padding: 18px 20px 22px;
  }
  .blog-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .bh-inner {
    padding: 10px 14px;
  }
  .bh-brand-text span,
  .bh-nav-links {
    display: none;
  }
  .blog-container {
    padding: 20px 14px 44px;
  }
  .blog-grid {
    grid-template-columns: 1fr;
  }
  .fc-title {
    font-size: 19px;
  }
}
</style>
