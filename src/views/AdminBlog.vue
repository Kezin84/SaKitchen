<script setup>
import { ref, computed, onMounted, onActivated, onUnmounted } from 'vue'
import BlogTipTapEditor from '@/components/BlogTipTapEditor.vue'
import { getOneSheet, dispatchAction } from '@/config/api'
import { uploadImageToCloudinary } from '@/utils/imageUpload.js'
import { resolveBrandAssets } from '@/utils/brandAssets.js'
import {
  DEFAULT_TOC_TITLE,
  slugifyVi,
  normalizeBlogPost,
  normalizeBlogCategory,
  extractTocAndInjectHeadingIds,
  analyzePostSeo,
  buildAutoExcerpt,
  parseTags,
} from '@/utils/blogSeo.js'

const loading = ref(true)
const saving = ref(false)
const posts = ref([])
const categories = ref([])
const brand = ref(resolveBrandAssets(null, 'SA KITCHEN'))

// View mode: 'list' | 'categories' | 'editor'
const activeTab = ref('list')
const statusFilter = ref('all') // 'all' | 'published' | 'draft' | 'hidden'
const categoryFilter = ref('')
const searchQuery = ref('')

// Toast
const toast = ref({ message: '', type: 'success' })
let toastTimer = null
function showToast(message, type = 'success', duration = 3200) {
  toast.value = { message, type }
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => {
    toast.value = { message: '', type: 'success' }
  }, duration)
}

// Editor form state
function createEmptyForm() {
  return {
    ID: '',
    Title: '',
    Slug: '',
    Category_ID: '',
    Category_Name: '',
    Category_Slug: '',
    Tags: '',
    Excerpt: '',
    Content_HTML: '',
    Featured_Image: '',
    Featured_Alt: '',
    Status: 'draft',
    Author: brand.value.siteName || 'SA KITCHEN',
    Focus_Keyword: '',
    SEO_Title: '',
    SEO_Description: '',
    Canonical_URL: '',
    Robots: 'index, follow',
    TOC_Enabled: true,
    TOC_Max_Level: 3,
    TOC_Default_Open: true,
    TOC_Title: DEFAULT_TOC_TITLE,
    Created_at: 0,
    Updated_at: 0,
    Published_at: 0,
  }
}

const form = ref(createEmptyForm())
const editorBaselineJson = ref('')
const autoSlugEnabled = ref(true)
const serpPreviewMode = ref('desktop') // 'desktop' | 'mobile'
const showAdvancedSeo = ref(false)
const featuredUploading = ref(false)
const featuredInputRef = ref(null)

function snapshotFormState(f) {
  return JSON.stringify({
    Title: f.Title,
    Slug: f.Slug,
    Category_ID: f.Category_ID,
    Tags: f.Tags,
    Excerpt: f.Excerpt,
    Content_HTML: String(f.Content_HTML || '').replace(/^<p>\s*<\/p>$/i, ''),
    Featured_Image: f.Featured_Image,
    Featured_Alt: f.Featured_Alt,
    Status: f.Status,
    Author: f.Author,
    Focus_Keyword: f.Focus_Keyword,
    SEO_Title: f.SEO_Title,
    SEO_Description: f.SEO_Description,
    Canonical_URL: f.Canonical_URL,
    Robots: f.Robots,
    TOC_Enabled: f.TOC_Enabled,
    TOC_Max_Level: f.TOC_Max_Level,
    TOC_Default_Open: f.TOC_Default_Open,
    TOC_Title: f.TOC_Title,
  })
}

const hasUnsavedEditorChanges = computed(
  () =>
    activeTab.value === 'editor' &&
    Boolean(editorBaselineJson.value) &&
    snapshotFormState(form.value) !== editorBaselineJson.value,
)

function scrollAdminTop() {
  if (typeof document !== 'undefined') {
    const mainEl = document.querySelector('.crm-main')
    if (mainEl) mainEl.scrollTo({ top: 0, behavior: 'smooth' })
  }
  if (typeof window !== 'undefined') {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

// Quick inline add category inside Editor sidebar
const quickCatName = ref('')
const quickCatSaving = ref(false)

// Tags chip input inside Editor sidebar
const tagInput = ref('')

// Category manager tab state
const catForm = ref({ ID: '', Name: '', Slug: '', Description: '', Order: 0 })
const catAutoSlug = ref(true)
const catSaving = ref(false)

/* =========================================================
 * DATA LOADING
 * ========================================================= */
async function loadBlogCmsData() {
  loading.value = true
  try {
    const [postsRes, catsRes, logoRes] = await Promise.all([
      getOneSheet('blog_posts'),
      getOneSheet('blog_categories'),
      getOneSheet('logo'),
    ])
    posts.value = (postsRes?.data || [])
      .map((row) => normalizeBlogPost(row))
      .sort((a, b) => (b.Updated_at || b.Created_at || 0) - (a.Updated_at || a.Created_at || 0))
    categories.value = (catsRes?.data || [])
      .map((row) => normalizeBlogCategory(row))
      .sort((a, b) => a.Order - b.Order || a.Name.localeCompare(b.Name))
    const logoRow = logoRes?.data?.[0] || null
    brand.value = resolveBrandAssets(logoRow, 'SA KITCHEN')
  } catch (err) {
    console.error('loadBlogCmsData error:', err)
    showToast('Không tải được dữ liệu bài viết. Kiểm tra kết nối Firebase Rules!', 'error', 4500)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadBlogCmsData()
})

let hasMountedOnce = false
onActivated(() => {
  if (!hasMountedOnce) {
    hasMountedOnce = true
    return
  }
  if (activeTab.value !== 'editor') {
    loadBlogCmsData()
  }
})

onUnmounted(() => {
  if (toastTimer) clearTimeout(toastTimer)
})

/* =========================================================
 * COMPUTEDS: COUNTS, FILTERS, LIVE TOC, LIVE SEO
 * ========================================================= */
const statusCounts = computed(() => {
  const all = posts.value.length
  let published = 0
  let draft = 0
  let hidden = 0
  for (const p of posts.value) {
    if (p.Status === 'published') published++
    else if (p.Status === 'hidden') hidden++
    else draft++
  }
  return { all, published, draft, hidden }
})

const categoryPostCountMap = computed(() => {
  const map = new Map()
  for (const p of posts.value) {
    const key = p.Category_ID || p.Category_Slug
    if (!key) continue
    map.set(key, (map.get(key) || 0) + 1)
  }
  return map
})

function getCategoryPostCount(cat) {
  return categoryPostCountMap.value.get(cat.ID) || categoryPostCountMap.value.get(cat.Slug) || 0
}

const filteredPosts = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  return posts.value.filter((p) => {
    if (statusFilter.value !== 'all' && p.Status !== statusFilter.value) return false
    if (categoryFilter.value) {
      if (p.Category_ID !== categoryFilter.value && p.Category_Slug !== categoryFilter.value) {
        return false
      }
    }
    if (q) {
      const hay = `${p.Title} ${p.Slug} ${p.Focus_Keyword} ${p.Category_Name} ${p.Tags}`.toLowerCase()
      if (!hay.includes(q)) return false
    }
    return true
  })
})

// Live Auto TOC Preview for current editor content
const liveTocResult = computed(() =>
  extractTocAndInjectHeadingIds(form.value.Content_HTML || '', {
    maxLevel: form.value.TOC_Max_Level,
  }),
)
const liveTocItems = computed(() => liveTocResult.value.tocItems)

// Live Yoast / Rank Math SEO analysis
const liveSeo = computed(() => analyzePostSeo(form.value))

const liveEffectiveSeoTitle = computed(
  () => form.value.SEO_Title.trim() || form.value.Title.trim() || `Tiêu đề bài viết - ${brand.value.siteName}`,
)
const liveEffectiveSeoDesc = computed(
  () =>
    form.value.SEO_Description.trim() ||
    form.value.Excerpt.trim() ||
    buildAutoExcerpt(form.value.Content_HTML, 155) ||
    'Mô tả ngắn (Meta Description) sẽ hiển thị dưới tiêu đề bài viết trên kết quả tìm kiếm Google...',
)
const livePermalinkPath = computed(() => `/blog/${slugifyVi(form.value.Slug || form.value.Title) || 'duong-dan-bai-viet'}`)

const seoTitleMeter = computed(() => {
  const len = liveEffectiveSeoTitle.value.length
  const pct = Math.min(100, Math.round((len / 65) * 100))
  const state = len >= 30 && len <= 60 ? 'good' : len >= 15 && len <= 72 ? 'warn' : 'bad'
  return { len, pct, state }
})

const seoDescMeter = computed(() => {
  const len = form.value.SEO_Description.trim().length
  const pct = Math.min(100, Math.round((len / 165) * 100))
  const state = len >= 110 && len <= 160 ? 'good' : len >= 60 && len <= 180 ? 'warn' : 'bad'
  return { len, pct, state }
})

const tagChips = computed(() => parseTags(form.value.Tags))

/* =========================================================
 * EDITOR ACTIONS
 * ========================================================= */
function startNewPost() {
  form.value = createEmptyForm()
  editorBaselineJson.value = snapshotFormState(form.value)
  autoSlugEnabled.value = true
  showAdvancedSeo.value = false
  tagInput.value = ''
  activeTab.value = 'editor'
  scrollAdminTop()
}

function backToPostList() {
  if (
    hasUnsavedEditorChanges.value &&
    !window.confirm('Bài viết đang có thay đổi chưa lưu. Bạn có chắc muốn quay lại danh sách?')
  ) {
    return
  }
  activeTab.value = 'list'
  scrollAdminTop()
}

function editPost(post) {
  const norm = normalizeBlogPost(post)
  form.value = {
    ID: norm.ID,
    Title: norm.Title,
    Slug: norm.Slug,
    Category_ID: norm.Category_ID,
    Category_Name: norm.Category_Name,
    Category_Slug: norm.Category_Slug,
    Tags: norm.Tags,
    Excerpt: norm.Excerpt,
    Content_HTML: norm.Content_HTML,
    Featured_Image: norm.Featured_Image,
    Featured_Alt: norm.Featured_Alt,
    Status: norm.Status,
    Author: norm.Author,
    Focus_Keyword: norm.Focus_Keyword,
    SEO_Title: norm.SEO_Title,
    SEO_Description: norm.SEO_Description,
    Canonical_URL: norm.Canonical_URL,
    Robots: norm.Robots,
    TOC_Enabled: norm.TOC_Enabled,
    TOC_Max_Level: norm.TOC_Max_Level,
    TOC_Default_Open: norm.TOC_Default_Open,
    TOC_Title: norm.TOC_Title,
    Created_at: norm.Created_at,
    Updated_at: norm.Updated_at,
    Published_at: norm.Published_at,
  }
  editorBaselineJson.value = snapshotFormState(form.value)
  // Keep existing slug locked so editing a published post doesn't accidentally break its Google URL
  autoSlugEnabled.value = !norm.ID
  showAdvancedSeo.value = Boolean(norm.Canonical_URL || norm.Robots.includes('noindex'))
  tagInput.value = ''
  activeTab.value = 'editor'
  scrollAdminTop()
}

function duplicatePost(post) {
  const norm = normalizeBlogPost(post)
  form.value = {
    ...createEmptyForm(),
    ...norm,
    ID: '',
    Title: `${norm.Title} (Bản sao)`,
    Slug: slugifyVi(`${norm.Slug || norm.Title}-copy`),
    Status: 'draft',
    Created_at: 0,
    Updated_at: 0,
    Published_at: 0,
  }
  editorBaselineJson.value = ''
  autoSlugEnabled.value = true
  tagInput.value = ''
  activeTab.value = 'editor'
  scrollAdminTop()
  showToast('Đã tạo bản sao ở chế độ Bản nháp — chỉnh sửa rồi bấm lưu nhé!')
}

function onTitleInput() {
  if (autoSlugEnabled.value) {
    form.value.Slug = slugifyVi(form.value.Title)
  }
}

function onSlugManualInput() {
  autoSlugEnabled.value = false
}

function regenerateSlugFromTitle() {
  form.value.Slug = slugifyVi(form.value.Title)
}

function onSelectCategory(catId) {
  form.value.Category_ID = catId
  const found = categories.value.find((c) => c.ID === catId)
  form.value.Category_Name = found ? found.Name : ''
  form.value.Category_Slug = found ? found.Slug : ''
}

function fillSeoTitleFromPost() {
  const base = form.value.Title.trim()
  if (!base) return
  const suffix = ` | ${brand.value.siteName}`
  form.value.SEO_Title = base.length + suffix.length <= 60 ? `${base}${suffix}` : base.slice(0, 60)
}

function fillSeoDescFromContent() {
  const auto = form.value.Excerpt.trim() || buildAutoExcerpt(form.value.Content_HTML, 155)
  if (auto) form.value.SEO_Description = auto
}

function addTagFromInput() {
  const raw = tagInput.value.trim()
  if (!raw) return
  const merged = parseTags([...tagChips.value, ...parseTags(raw)])
  form.value.Tags = merged.join(', ')
  tagInput.value = ''
}

function removeTag(tag) {
  const next = tagChips.value.filter((t) => t !== tag)
  form.value.Tags = next.join(', ')
}

function triggerFeaturedPick() {
  featuredInputRef.value?.click?.()
}

async function onSelectFeaturedFile(e) {
  const file = e.target?.files?.[0]
  if (e.target) e.target.value = ''
  if (!file) return
  if (!file.type.startsWith('image/')) {
    showToast('Vui lòng chọn file hình ảnh hợp lệ', 'error')
    return
  }
  featuredUploading.value = true
  try {
    const url = await uploadImageToCloudinary(file, {
      folder: 'sakitchen/blog',
      maxWidth: 1200,
      maxHeight: 1200,
      targetKB: 180,
    })
    form.value.Featured_Image = url
    if (!form.value.Featured_Alt.trim() && form.value.Title.trim()) {
      form.value.Featured_Alt = form.value.Title.trim()
    }
    showToast('Tải ảnh đại diện thành công!')
  } catch (err) {
    showToast(err?.message || 'Upload ảnh đại diện thất bại', 'error')
  } finally {
    featuredUploading.value = false
  }
}

function onTagKeyup(e) {
  if (e.key === ',' && tagInput.value.includes(',')) {
    addTagFromInput()
  }
}

async function savePost(targetStatus = null) {
  const title = form.value.Title.trim()
  if (!title) {
    showToast('Vui lòng nhập Tiêu đề bài viết trước khi lưu!', 'error')
    return
  }

  // Auto-commit any pending tag typed in the tag input box before saving
  if (tagInput.value.trim()) {
    addTagFromInput()
  }

  saving.value = true
  try {
    const nextStatus = targetStatus || form.value.Status || 'draft'
    const payload = {
      ...form.value,
      Title: title,
      Slug: slugifyVi(form.value.Slug || title),
      Status: nextStatus,
    }
    const res = await dispatchAction({
      action: 'upsertBlogPost',
      data: payload,
    })
    if (!res?.success) {
      throw new Error(res?.message || 'Lưu bài viết thất bại')
    }
    const saved = normalizeBlogPost(res.data || payload)
    form.value = {
      ...form.value,
      ...saved,
    }
    editorBaselineJson.value = snapshotFormState(form.value)
    autoSlugEnabled.value = false

    // Update local list without full reload flicker
    const idx = posts.value.findIndex((p) => p.ID === saved.ID)
    if (idx >= 0) {
      posts.value.splice(idx, 1, saved)
    } else {
      posts.value.unshift(saved)
    }
    posts.value.sort((a, b) => (b.Updated_at || b.Created_at || 0) - (a.Updated_at || a.Created_at || 0))

    showToast(
      nextStatus === 'published'
        ? `Đã xuất bản bài viết tại /blog/${saved.Slug}!`
        : 'Đã lưu bài viết thành công!',
    )
  } catch (err) {
    console.error('savePost error:', err)
    showToast(err?.message || 'Lưu bài viết thất bại', 'error', 4200)
  } finally {
    saving.value = false
  }
}

async function confirmDeletePost(post) {
  const ok = window.confirm(`Xóa vĩnh viễn bài viết "${post.Title}"? Thao tác này không thể hoàn tác.`)
  if (!ok) return
  try {
    const res = await dispatchAction({ action: 'deleteBlogPost', ID: post.ID })
    if (!res?.success) throw new Error(res?.message || 'Xóa bài viết thất bại')
    posts.value = posts.value.filter((p) => p.ID !== post.ID)
    showToast('Đã xóa bài viết!')
  } catch (err) {
    showToast(err?.message || 'Xóa bài viết thất bại', 'error')
  }
}

/* =========================================================
 * CATEGORY MANAGEMENT (QUICK INLINE + FULL TAB)
 * ========================================================= */
async function handleQuickAddCategory() {
  const name = quickCatName.value.trim()
  if (!name) return
  quickCatSaving.value = true
  try {
    const res = await dispatchAction({
      action: 'upsertBlogCategory',
      data: { Name: name, Slug: slugifyVi(name) },
    })
    if (!res?.success) throw new Error(res?.message || 'Không tạo được chuyên mục')
    const created = normalizeBlogCategory(res.data)
    categories.value.push(created)
    categories.value.sort((a, b) => a.Order - b.Order || a.Name.localeCompare(b.Name))
    onSelectCategory(created.ID)
    quickCatName.value = ''
    showToast(`Đã tạo chuyên mục "${created.Name}" (/${created.Slug})`)
  } catch (err) {
    showToast(err?.message || 'Lỗi tạo chuyên mục', 'error')
  } finally {
    quickCatSaving.value = false
  }
}

function resetCatForm() {
  catForm.value = { ID: '', Name: '', Slug: '', Description: '', Order: categories.value.length }
  catAutoSlug.value = true
}

function editCategory(cat) {
  catForm.value = {
    ID: cat.ID,
    Name: cat.Name,
    Slug: cat.Slug,
    Description: cat.Description,
    Order: cat.Order,
  }
  catAutoSlug.value = false
}

function onCatNameInput() {
  if (catAutoSlug.value) {
    catForm.value.Slug = slugifyVi(catForm.value.Name)
  }
}

async function saveCategoryForm() {
  const name = catForm.value.Name.trim()
  if (!name) {
    showToast('Vui lòng nhập tên chuyên mục', 'error')
    return
  }
  catSaving.value = true
  try {
    const res = await dispatchAction({
      action: 'upsertBlogCategory',
      data: {
        ...catForm.value,
        Name: name,
        Slug: slugifyVi(catForm.value.Slug || name),
      },
    })
    if (!res?.success) throw new Error(res?.message || 'Lưu chuyên mục thất bại')
    await loadBlogCmsData()
    resetCatForm()
    showToast('Đã lưu chuyên mục thành công!')
  } catch (err) {
    showToast(err?.message || 'Lưu chuyên mục thất bại', 'error')
  } finally {
    catSaving.value = false
  }
}

async function confirmDeleteCategory(cat) {
  const count = getCategoryPostCount(cat)
  const msg = count
    ? `Xóa chuyên mục "${cat.Name}"? ${count} bài viết thuộc chuyên mục này sẽ chuyển sang Chưa phân loại.`
    : `Xóa chuyên mục "${cat.Name}"?`
  if (!window.confirm(msg)) return
  try {
    const res = await dispatchAction({ action: 'deleteBlogCategory', ID: cat.ID })
    if (!res?.success) throw new Error(res?.message || 'Xóa chuyên mục thất bại')
    await loadBlogCmsData()
    if (catForm.value.ID === cat.ID) resetCatForm()
    showToast('Đã xóa chuyên mục!')
  } catch (err) {
    showToast(err?.message || 'Xóa chuyên mục thất bại', 'error')
  }
}

/* =========================================================
 * DISPLAY FORMATTERS
 * ========================================================= */
function formatDate(ts) {
  if (!ts) return '—'
  const d = new Date(ts)
  if (Number.isNaN(d.getTime())) return '—'
  const p = (v) => String(v).padStart(2, '0')
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`
}

function scoreGradeClass(score) {
  const num = Number(score || 0)
  if (num >= 80) return 'is-good'
  if (num >= 50) return 'is-warn'
  return 'is-bad'
}

function statusMeta(status) {
  if (status === 'published') return { label: 'Đã xuất bản', cls: 'is-pub' }
  if (status === 'hidden') return { label: 'Đang ẩn', cls: 'is-hidden' }
  return { label: 'Bản nháp', cls: 'is-draft' }
}

function getPreviewUrl(post) {
  if (!post?.Slug) return '/blog'
  return post.Status === 'published'
    ? `/blog/${encodeURIComponent(post.Slug)}`
    : `/blog/${encodeURIComponent(post.Slug)}?preview=1`
}
</script>

<template>
  <div class="blog-cms-shell">
  <div class="blog-cms-page">
    <!-- TOAST -->
    <Transition name="toast-pop">
      <div v-if="toast.message" class="cms-toast" :class="`is-${toast.type}`">
        <i :class="toast.type === 'error' ? 'ri-error-warning-fill' : 'ri-checkbox-circle-fill'"></i>
        <span>{{ toast.message }}</span>
      </div>
    </Transition>

    <!-- =========================================================
         TOP HEADER (LIST / CATEGORIES MODE)
         ========================================================= -->
    <template v-if="activeTab !== 'editor'">
      <div class="cms-header">
        <div class="cms-header-left">
          <h1><i class="ri-article-line"></i> Quản lý Bài viết SEO (Blog)</h1>
          <p class="cms-subtitle">
            Soạn bài chuẩn SEO giống WordPress (Yoast/Rank Math), tự động sinh Mục lục (Auto TOC) &amp; Chuyên mục, tự cập nhật Sitemap.
          </p>
        </div>
        <div class="cms-header-actions">
          <a href="/blog" target="_blank" rel="noopener" class="cms-btn ghost">
            <i class="ri-external-link-line"></i>
            <span>Xem trang Blog</span>
          </a>
          <button type="button" class="cms-btn primary" @click="startNewPost">
            <i class="ri-add-line"></i>
            <span>Viết bài mới</span>
          </button>
        </div>
      </div>

      <!-- MAIN TABS -->
      <div class="cms-tabs">
        <button
          type="button"
          class="cms-tab"
          :class="{ active: activeTab === 'list' }"
          @click="activeTab = 'list'"
        >
          <i class="ri-file-list-3-line"></i>
          <span>Tất cả bài viết</span>
          <span class="tab-count">{{ posts.length }}</span>
        </button>
        <button
          type="button"
          class="cms-tab"
          :class="{ active: activeTab === 'categories' }"
          @click="activeTab = 'categories'"
        >
          <i class="ri-folder-3-line"></i>
          <span>Chuyên mục bài viết</span>
          <span class="tab-count">{{ categories.length }}</span>
        </button>
      </div>

      <!-- ==================== TAB 1: POSTS LIST ==================== -->
      <div v-if="activeTab === 'list'" class="cms-card">
        <div class="list-toolbar">
          <div class="status-pills">
            <button
              type="button"
              class="sp-btn"
              :class="{ active: statusFilter === 'all' }"
              @click="statusFilter = 'all'"
            >
              Tất cả ({{ statusCounts.all }})
            </button>
            <button
              type="button"
              class="sp-btn"
              :class="{ active: statusFilter === 'published' }"
              @click="statusFilter = 'published'"
            >
              Đã xuất bản ({{ statusCounts.published }})
            </button>
            <button
              type="button"
              class="sp-btn"
              :class="{ active: statusFilter === 'draft' }"
              @click="statusFilter = 'draft'"
            >
              Bản nháp ({{ statusCounts.draft }})
            </button>
            <button
              type="button"
              class="sp-btn"
              :class="{ active: statusFilter === 'hidden' }"
              @click="statusFilter = 'hidden'"
            >
              Đang ẩn ({{ statusCounts.hidden }})
            </button>
          </div>

          <div class="list-filters">
            <select v-model="categoryFilter" class="cms-select">
              <option value="">Tất cả chuyên mục</option>
              <option v-for="cat in categories" :key="cat.ID" :value="cat.ID">
                {{ cat.Name }} ({{ getCategoryPostCount(cat) }})
              </option>
            </select>
            <div class="search-box">
              <i class="ri-search-line"></i>
              <input
                v-model="searchQuery"
                type="text"
                placeholder="Tìm tiêu đề, từ khóa, slug..."
              />
            </div>
          </div>
        </div>

        <div v-if="loading" class="cms-empty">
          <i class="ri-loader-4-line spin"></i>
          <p>Đang tải danh sách bài viết...</p>
        </div>

        <div v-else-if="!filteredPosts.length" class="cms-empty">
          <i class="ri-quill-pen-line"></i>
          <h3>Chưa có bài viết nào</h3>
          <p>Bấm "Viết bài mới" để bắt đầu tạo bài viết chuẩn SEO lên Google cho SA KITCHEN!</p>
          <button type="button" class="cms-btn primary" @click="startNewPost">
            <i class="ri-add-line"></i> Viết bài đầu tiên
          </button>
        </div>

        <div v-else class="posts-table-wrap">
          <table class="posts-table">
            <thead>
              <tr>
                <th>Bài viết</th>
                <th>Chuyên mục</th>
                <th>Trạng thái</th>
                <th>Điểm SEO</th>
                <th>Cập nhật</th>
                <th class="th-actions">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="post in filteredPosts" :key="post.ID">
                <td>
                  <div class="post-cell">
                    <div class="post-thumb">
                      <img
                        v-if="post.Featured_Image"
                        :src="post.Featured_Image"
                        :alt="post.Featured_Alt || post.Title"
                      />
                      <div v-else class="post-thumb-placeholder">
                        <i class="ri-image-line"></i>
                      </div>
                    </div>
                    <div class="post-info">
                      <button type="button" class="post-title-link" @click="editPost(post)">
                        {{ post.Title }}
                      </button>
                      <div class="post-meta-sub">
                        <span class="post-slug">/blog/{{ post.Slug }}</span>
                        <span v-if="post.TOC_Enabled" class="toc-mini-badge" title="Mục lục tự động đang bật">
                          <i class="ri-list-ordered"></i> Auto TOC
                        </span>
                        <span v-if="post.Focus_Keyword" class="kw-mini-badge">
                          <i class="ri-key-2-line"></i> {{ post.Focus_Keyword }}
                        </span>
                      </div>
                    </div>
                  </div>
                </td>
                <td>
                  <span v-if="post.Category_Name" class="cat-badge">{{ post.Category_Name }}</span>
                  <span v-else class="muted-text">Chưa phân loại</span>
                </td>
                <td>
                  <span class="status-badge" :class="statusMeta(post.Status).cls">
                    {{ statusMeta(post.Status).label }}
                  </span>
                </td>
                <td>
                  <span class="seo-pill" :class="scoreGradeClass(post.SEO_Score)">
                    <span class="seo-dot"></span>
                    {{ post.SEO_Score || 0 }}/100
                  </span>
                </td>
                <td class="date-cell">
                  {{ formatDate(post.Updated_at || post.Published_at || post.Created_at) }}
                </td>
                <td>
                  <div class="row-actions">
                    <button type="button" class="act-btn" title="Chỉnh sửa" @click="editPost(post)">
                      <i class="ri-edit-line"></i>
                    </button>
                    <a
                      :href="getPreviewUrl(post)"
                      target="_blank"
                      rel="noopener"
                      class="act-btn"
                      :title="post.Status === 'published' ? 'Xem bài trên web' : 'Xem trước bản nháp'"
                    >
                      <i class="ri-eye-line"></i>
                    </a>
                    <button type="button" class="act-btn" title="Nhân bản" @click="duplicatePost(post)">
                      <i class="ri-file-copy-line"></i>
                    </button>
                    <button
                      type="button"
                      class="act-btn danger"
                      title="Xóa bài viết"
                      @click="confirmDeletePost(post)"
                    >
                      <i class="ri-delete-bin-line"></i>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- ==================== TAB 2: CATEGORIES MANAGER ==================== -->
      <div v-else-if="activeTab === 'categories'" class="cat-manager-grid">
        <div class="cms-card cat-form-card">
          <h3>
            <i :class="catForm.ID ? 'ri-edit-box-line' : 'ri-folder-add-line'"></i>
            {{ catForm.ID ? 'Chỉnh sửa chuyên mục' : 'Thêm chuyên mục mới' }}
          </h3>
          <p class="field-hint">
            Đường dẫn URL (Slug) được tạo tự động không dấu giống WordPress.
          </p>

          <div class="field-group">
            <label>Tên chuyên mục <span class="req">*</span></label>
            <input
              v-model="catForm.Name"
              type="text"
              class="cms-input"
              placeholder="Ví dụ: Cẩm nang ẩm thực Manila"
              @input="onCatNameInput"
            />
          </div>

          <div class="field-group">
            <label>Đường dẫn (Slug tự động)</label>
            <div class="slug-input-wrap">
              <span class="slug-prefix">/blog?cat=</span>
              <input
                v-model="catForm.Slug"
                type="text"
                class="cms-input"
                placeholder="cam-nang-am-thuc-manila"
                @input="catAutoSlug = false"
              />
            </div>
          </div>

          <div class="field-group">
            <label>Mô tả chuyên mục (tuỳ chọn)</label>
            <textarea
              v-model="catForm.Description"
              rows="3"
              class="cms-textarea"
              placeholder="Mô tả ngắn hiển thị khi khách lọc theo chuyên mục này..."
            ></textarea>
          </div>

          <div class="field-group">
            <label>Thứ tự hiển thị</label>
            <input v-model.number="catForm.Order" type="number" min="0" class="cms-input" />
          </div>

          <div class="cat-form-actions">
            <button
              type="button"
              class="cms-btn primary"
              :disabled="catSaving"
              @click="saveCategoryForm"
            >
              <i :class="catSaving ? 'ri-loader-4-line spin' : 'ri-save-line'"></i>
              <span>{{ catForm.ID ? 'Cập nhật chuyên mục' : 'Thêm chuyên mục' }}</span>
            </button>
            <button v-if="catForm.ID" type="button" class="cms-btn ghost" @click="resetCatForm">
              Hủy sửa
            </button>
          </div>
        </div>

        <div class="cms-card cat-list-card">
          <h3><i class="ri-folders-line"></i> Danh sách chuyên mục ({{ categories.length }})</h3>
          <div v-if="!categories.length" class="cms-empty compact">
            <p>Chưa có chuyên mục nào. Tạo chuyên mục bên trái để phân loại bài viết SEO!</p>
          </div>
          <div v-else class="posts-table-wrap">
            <table class="posts-table">
              <thead>
                <tr>
                  <th>Tên chuyên mục</th>
                  <th>Slug</th>
                  <th>Số bài</th>
                  <th class="th-actions">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="cat in categories" :key="cat.ID">
                  <td>
                    <div class="cat-name-strong">{{ cat.Name }}</div>
                    <div v-if="cat.Description" class="cat-desc-sub">{{ cat.Description }}</div>
                  </td>
                  <td><code class="slug-code">{{ cat.Slug }}</code></td>
                  <td>
                    <span class="count-pill">{{ getCategoryPostCount(cat) }} bài</span>
                  </td>
                  <td>
                    <div class="row-actions">
                      <button type="button" class="act-btn" title="Sửa" @click="editCategory(cat)">
                        <i class="ri-edit-line"></i>
                      </button>
                      <button
                        type="button"
                        class="act-btn danger"
                        title="Xóa"
                        @click="confirmDeleteCategory(cat)"
                      >
                        <i class="ri-delete-bin-line"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </template>

    <!-- =========================================================
         WORDPRESS-STYLE 2-COLUMN POST EDITOR
         ========================================================= -->
    <template v-else>
      <div class="editor-topbar">
        <div class="etb-left">
          <button type="button" class="cms-btn ghost" @click="backToPostList">
            <i class="ri-arrow-left-line"></i>
            <span>Danh sách bài</span>
          </button>
          <span class="seo-pill big" :class="scoreGradeClass(liveSeo.score)">
            <span class="seo-dot"></span>
            SEO: {{ liveSeo.score }}/100
          </span>
          <span v-if="hasUnsavedEditorChanges" class="unsaved-dot-badge">
            Chưa lưu thay đổi
          </span>
        </div>

        <div class="etb-right">
          <a
            v-if="form.ID && form.Slug"
            :href="getPreviewUrl(form)"
            target="_blank"
            rel="noopener"
            class="cms-btn ghost"
          >
            <i class="ri-eye-line"></i>
            <span>{{ form.Status === 'published' ? 'Xem bài viết' : 'Xem trước' }}</span>
          </a>
          <button
            type="button"
            class="cms-btn ghost"
            :disabled="saving"
            @click="savePost('draft')"
          >
            <i class="ri-draft-line"></i>
            <span>Lưu nháp</span>
          </button>
          <button
            type="button"
            class="cms-btn primary"
            :disabled="saving"
            @click="savePost('published')"
          >
            <i :class="saving ? 'ri-loader-4-line spin' : 'ri-send-plane-fill'"></i>
            <span>{{ form.Status === 'published' && form.ID ? 'Cập nhật bài' : 'Xuất bản ngay' }}</span>
          </button>
        </div>
      </div>

      <div class="wp-editor-grid">
        <!-- ==================== LEFT MAIN COLUMN ==================== -->
        <div class="wp-main-col">
          <!-- TITLE & PERMALINK -->
          <div class="cms-card title-card">
            <input
              v-model="form.Title"
              type="text"
              class="wp-title-input"
              placeholder="Nhập tiêu đề bài viết (Thẻ H1 chuẩn SEO)..."
              @input="onTitleInput"
            />
            <div class="permalink-row">
              <span class="pm-label"><i class="ri-link-m"></i> Đường dẫn tĩnh:</span>
              <span class="pm-base">https://sakitchen.shop/blog/</span>
              <input
                v-model="form.Slug"
                type="text"
                class="pm-slug-input"
                placeholder="tu-dong-tao-tu-tieu-de"
                @input="onSlugManualInput"
              />
              <button
                type="button"
                class="pm-auto-btn"
                :class="{ active: autoSlugEnabled }"
                :title="autoSlugEnabled ? 'Đang tự động cập nhật slug theo tiêu đề' : 'Bấm để tạo lại slug theo tiêu đề'"
                @click="regenerateSlugFromTitle"
              >
                <i class="ri-magic-line"></i> Tạo tự động
              </button>
            </div>
          </div>

          <!-- TIPTAP RICH TEXT EDITOR -->
          <div class="cms-card editor-card">
            <BlogTipTapEditor
              v-model="form.Content_HTML"
              @toast="(t) => showToast(t.message, t.type)"
            />
            <div class="editor-stats-bar">
              <span><i class="ri-file-word-line"></i> <strong>{{ liveSeo.wordCount }}</strong> từ</span>
              <span><i class="ri-time-line"></i> ~<strong>{{ liveSeo.readingMinutes }}</strong> phút đọc</span>
              <span><i class="ri-h-2"></i> <strong>{{ liveSeo.h2Count }}</strong> H2, <strong>{{ liveSeo.h3Count }}</strong> H3</span>
              <span><i class="ri-image-line"></i> <strong>{{ liveSeo.imageCount }}</strong> ảnh</span>
              <span><i class="ri-links-line"></i> <strong>{{ liveSeo.internalLinkCount }}</strong> link nội bộ</span>
            </div>
          </div>

          <!-- AUTO TABLE OF CONTENTS (EASY TOC PLUGIN STYLE) -->
          <div class="cms-card toc-box-card">
            <div class="box-head">
              <div class="box-head-title">
                <i class="ri-list-ordered-2"></i>
                <div>
                  <h3>Mục lục tự động (Auto Table of Contents)</h3>
                  <p>Giống plugin Easy Table of Contents bên WordPress — tự quét thẻ H2/H3/H4 để tạo mục lục đánh số &amp; nhảy nhanh.</p>
                </div>
              </div>
              <label class="toggle-switch">
                <input v-model="form.TOC_Enabled" type="checkbox" />
                <span class="ts-slider"></span>
                <span class="ts-text">{{ form.TOC_Enabled ? 'Đang bật' : 'Đang tắt' }}</span>
              </label>
            </div>

            <div v-if="form.TOC_Enabled" class="toc-settings-body">
              <div class="toc-controls-grid">
                <div class="field-group">
                  <label>Tiêu đề hộp mục lục</label>
                  <input
                    v-model="form.TOC_Title"
                    type="text"
                    class="cms-input"
                    placeholder="Mục lục bài viết"
                  />
                </div>
                <div class="field-group">
                  <label>Cấp tiêu đề quét tự động</label>
                  <select v-model.number="form.TOC_Max_Level" class="cms-select full">
                    <option :value="2">Chỉ lấy thẻ H2</option>
                    <option :value="3">Lấy H2 + H3 (Khuyên dùng)</option>
                    <option :value="4">Lấy đầy đủ H2 + H3 + H4</option>
                  </select>
                </div>
                <div class="field-group">
                  <label>Trạng thái hiển thị ban đầu</label>
                  <select v-model="form.TOC_Default_Open" class="cms-select full">
                    <option :value="true">Mở sẵn mục lục</option>
                    <option :value="false">Thu gọn (bấm mới mở)</option>
                  </select>
                </div>
              </div>

              <!-- LIVE GENERATED TOC PREVIEW -->
              <div class="toc-live-preview">
                <div class="tlp-header">
                  <span><i class="ri-list-check-2"></i> Xem trước Mục lục tự động ({{ liveTocItems.length }} mục)</span>
                </div>
                <div v-if="!liveTocItems.length" class="tlp-empty">
                  Chưa phát hiện thẻ <strong>H2 / H3</strong> nào trong bài viết. Chọn tiêu đề mục rồi bấm nút <strong>H2</strong> hoặc <strong>H3</strong> trên thanh công cụ — mục lục sẽ tự động sinh tại đây!
                </div>
                <ol v-else class="tlp-list">
                  <li
                    v-for="item in liveTocItems"
                    :key="item.id"
                    :class="`lvl-${item.level}`"
                  >
                    <span class="tlp-num">{{ item.number }}.</span>
                    <span class="tlp-text">{{ item.text }}</span>
                    <code class="tlp-anchor">#{{ item.id }}</code>
                  </li>
                </ol>
              </div>
            </div>
          </div>

          <!-- YOAST / RANK MATH SEO BOX -->
          <div class="cms-card seo-box-card">
            <div class="box-head">
              <div class="box-head-title">
                <i class="ri-line-chart-line"></i>
                <div>
                  <h3>Tối ưu SEO On-Page (Yoast / Rank Math)</h3>
                  <p>Cấu hình thẻ Title, Meta Description, Focus Keyword &amp; xem trước hiển thị trên Google.</p>
                </div>
              </div>
              <div class="seo-score-badge" :class="scoreGradeClass(liveSeo.score)">
                <strong>{{ liveSeo.score }}</strong><span>/100</span>
              </div>
            </div>

            <!-- FOCUS KEYWORD -->
            <div class="field-group">
              <label>Từ khóa chính (Focus Keyword)</label>
              <input
                v-model="form.Focus_Keyword"
                type="text"
                class="cms-input"
                placeholder="Ví dụ: đồ ăn việt tại manila, lẩu bò manila..."
              />
            </div>

            <!-- GOOGLE SERP LIVE PREVIEW -->
            <div class="serp-preview-wrap">
              <div class="serp-bar">
                <span class="serp-bar-label"><i class="ri-google-fill"></i> Xem trước trên Google Search</span>
                <div class="serp-toggle">
                  <button
                    type="button"
                    :class="{ active: serpPreviewMode === 'desktop' }"
                    @click="serpPreviewMode = 'desktop'"
                  >
                    <i class="ri-computer-line"></i> PC
                  </button>
                  <button
                    type="button"
                    :class="{ active: serpPreviewMode === 'mobile' }"
                    @click="serpPreviewMode = 'mobile'"
                  >
                    <i class="ri-smartphone-line"></i> Điện thoại
                  </button>
                </div>
              </div>

              <div class="serp-card" :class="`is-${serpPreviewMode}`">
                <div class="serp-site-row">
                  <div class="serp-fav">
                    <img
                      v-if="brand.faviconUrl || brand.logoUrl"
                      :src="brand.faviconUrl || brand.logoUrl"
                      alt=""
                    />
                    <i v-else class="ri-global-line"></i>
                  </div>
                  <div class="serp-site-meta">
                    <div class="serp-site-name">{{ brand.siteName }}</div>
                    <div class="serp-url">https://sakitchen.shop{{ livePermalinkPath }}</div>
                  </div>
                </div>
                <div class="serp-title">{{ liveEffectiveSeoTitle }}</div>
                <div class="serp-desc">{{ liveEffectiveSeoDesc }}</div>
              </div>
            </div>

            <!-- SEO TITLE & DESCRIPTION INPUTS -->
            <div class="field-group">
              <div class="label-row">
                <label>Tiêu đề SEO (SEO Title)</label>
                <div class="label-right">
                  <button type="button" class="mini-link-btn" @click="fillSeoTitleFromPost">
                    Lấy từ tiêu đề bài
                  </button>
                  <span class="char-counter" :class="`is-${seoTitleMeter.state}`">
                    {{ seoTitleMeter.len }}/60 ký tự
                  </span>
                </div>
              </div>
              <input
                v-model="form.SEO_Title"
                type="text"
                class="cms-input"
                placeholder="Để trống sẽ tự lấy tiêu đề bài viết (khuyên dùng 30–60 ký tự)"
              />
              <div class="meter-track">
                <div
                  class="meter-fill"
                  :class="`is-${seoTitleMeter.state}`"
                  :style="{ width: seoTitleMeter.pct + '%' }"
                ></div>
              </div>
            </div>

            <div class="field-group">
              <div class="label-row">
                <label>Thẻ mô tả SEO (Meta Description)</label>
                <div class="label-right">
                  <button type="button" class="mini-link-btn" @click="fillSeoDescFromContent">
                    Tự trích từ nội dung
                  </button>
                  <span class="char-counter" :class="`is-${seoDescMeter.state}`">
                    {{ seoDescMeter.len }}/160 ký tự
                  </span>
                </div>
              </div>
              <textarea
                v-model="form.SEO_Description"
                rows="3"
                class="cms-textarea"
                placeholder="Viết đoạn mô tả hấp dẫn chứa từ khóa chính (khuyên dùng 110–160 ký tự)..."
              ></textarea>
              <div class="meter-track">
                <div
                  class="meter-fill"
                  :class="`is-${seoDescMeter.state}`"
                  :style="{ width: seoDescMeter.pct + '%' }"
                ></div>
              </div>
            </div>

            <!-- ADVANCED SEO COLLAPSIBLE -->
            <button
              type="button"
              class="adv-seo-toggle"
              @click="showAdvancedSeo = !showAdvancedSeo"
            >
              <i :class="showAdvancedSeo ? 'ri-arrow-down-s-line' : 'ri-arrow-right-s-line'"></i>
              <span>Cài đặt SEO nâng cao (Canonical URL, Robots Index)</span>
            </button>

            <div v-if="showAdvancedSeo" class="adv-seo-grid">
              <div class="field-group">
                <label>Canonical URL (tuỳ chọn)</label>
                <input
                  v-model="form.Canonical_URL"
                  type="text"
                  class="cms-input"
                  :placeholder="`Mặc định: https://sakitchen.shop${livePermalinkPath}`"
                />
              </div>
              <div class="field-group">
                <label>Chỉ mục Google (Meta Robots)</label>
                <select v-model="form.Robots" class="cms-select full">
                  <option value="index, follow">index, follow (Cho phép Google lập chỉ mục)</option>
                  <option value="noindex, nofollow">noindex, nofollow (Chặn Google lập chỉ mục)</option>
                </select>
              </div>
            </div>

            <!-- 10-POINT REALTIME SEO CHECKLIST -->
            <div class="seo-checklist">
              <div class="sc-title">Phân tích SEO chi tiết ({{ liveSeo.checks.filter(c => c.status === 'good').length }}/{{ liveSeo.checks.length }} tiêu chí đạt chuẩn)</div>
              <div
                v-for="chk in liveSeo.checks"
                :key="chk.id"
                class="sc-item"
                :class="`is-${chk.status}`"
              >
                <span class="sc-dot"></span>
                <div class="sc-content">
                  <div class="sc-label">{{ chk.label }}</div>
                  <div class="sc-detail">{{ chk.detail }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- ==================== RIGHT SIDEBAR (WORDPRESS META BOXES) ==================== -->
        <aside class="wp-side-col">
          <!-- PUBLISH BOX -->
          <div class="cms-card side-card">
            <h4 class="side-title"><i class="ri-rocket-2-line"></i> Đăng bài</h4>
            <div class="field-group">
              <label>Trạng thái hiển thị</label>
              <select v-model="form.Status" class="cms-select full">
                <option value="published">Đã xuất bản (Công khai)</option>
                <option value="draft">Bản nháp (Chưa hiện)</option>
                <option value="hidden">Đang ẩn (Tạm gỡ)</option>
              </select>
            </div>
            <div class="field-group">
              <label>Tác giả hiển thị</label>
              <input v-model="form.Author" type="text" class="cms-input" placeholder="SA KITCHEN" />
            </div>
            <div v-if="form.Published_at || form.Updated_at" class="side-meta-dates">
              <div v-if="form.Published_at">
                <span>Xuất bản:</span> <strong>{{ formatDate(form.Published_at) }}</strong>
              </div>
              <div v-if="form.Updated_at">
                <span>Cập nhật:</span> <strong>{{ formatDate(form.Updated_at) }}</strong>
              </div>
            </div>
            <div class="side-publish-btns">
              <button
                type="button"
                class="cms-btn primary full"
                :disabled="saving"
                @click="savePost(form.Status)"
              >
                <i :class="saving ? 'ri-loader-4-line spin' : 'ri-save-3-line'"></i>
                <span>{{ form.ID ? 'Lưu thay đổi' : 'Lưu bài viết' }}</span>
              </button>
            </div>
          </div>

          <!-- CATEGORIES BOX -->
          <div class="cms-card side-card">
            <h4 class="side-title"><i class="ri-folder-3-line"></i> Chuyên mục</h4>
            <div class="cat-radio-list">
              <label class="cat-radio-item">
                <input
                  type="radio"
                  name="post-category"
                  :checked="!form.Category_ID"
                  @change="onSelectCategory('')"
                />
                <span>Chưa phân loại</span>
              </label>
              <label
                v-for="cat in categories"
                :key="cat.ID"
                class="cat-radio-item"
              >
                <input
                  type="radio"
                  name="post-category"
                  :checked="form.Category_ID === cat.ID"
                  @change="onSelectCategory(cat.ID)"
                />
                <span>{{ cat.Name }}</span>
                <small>/{{ cat.Slug }}</small>
              </label>
            </div>

            <div class="quick-cat-box">
              <input
                v-model="quickCatName"
                type="text"
                class="cms-input"
                placeholder="+ Thêm chuyên mục mới..."
                @keyup.enter="handleQuickAddCategory"
              />
              <button
                type="button"
                class="cms-btn ghost small"
                :disabled="quickCatSaving || !quickCatName.trim()"
                @click="handleQuickAddCategory"
              >
                {{ quickCatSaving ? '...' : 'Thêm' }}
              </button>
            </div>
          </div>

          <!-- FEATURED IMAGE BOX -->
          <div class="cms-card side-card">
            <h4 class="side-title"><i class="ri-image-2-line"></i> Ảnh đại diện (1200×630)</h4>
            <input
              ref="featuredInputRef"
              type="file"
              accept="image/*"
              class="hidden-file"
              @change="onSelectFeaturedFile"
            />
            <div v-if="form.Featured_Image" class="featured-preview-box">
              <img :src="form.Featured_Image" :alt="form.Featured_Alt || form.Title" />
              <div class="fp-actions">
                <button
                  type="button"
                  class="cms-btn ghost small"
                  :disabled="featuredUploading"
                  @click="triggerFeaturedPick"
                >
                  Đổi ảnh
                </button>
                <button
                  type="button"
                  class="cms-btn danger-ghost small"
                  @click="form.Featured_Image = ''"
                >
                  Gỡ ảnh
                </button>
              </div>
            </div>
            <button
              v-else
              type="button"
              class="featured-upload-drop"
              :disabled="featuredUploading"
              @click="triggerFeaturedPick"
            >
              <i :class="featuredUploading ? 'ri-loader-4-line spin' : 'ri-upload-cloud-2-line'"></i>
              <span>{{ featuredUploading ? 'Đang tải ảnh lên Cloudinary...' : 'Chọn ảnh đại diện bài viết' }}</span>
              <small>Khuyên dùng tỷ lệ ngang 16:9 (1200×630px)</small>
            </button>

            <div class="field-group" style="margin-top: 10px;">
              <label>Thẻ Alt ảnh đại diện (SEO)</label>
              <input
                v-model="form.Featured_Alt"
                type="text"
                class="cms-input"
                placeholder="Mô tả nội dung ảnh đại diện..."
              />
            </div>
          </div>

          <!-- TAGS BOX -->
          <div class="cms-card side-card">
            <h4 class="side-title"><i class="ri-price-tag-3-line"></i> Thẻ (Tags)</h4>
            <div class="quick-cat-box">
              <input
                v-model="tagInput"
                type="text"
                class="cms-input"
                placeholder="Nhập tag rồi Enter hoặc dấu phẩy..."
                @keydown.enter.prevent="addTagFromInput"
                @keyup="onTagKeyup"
              />
              <button type="button" class="cms-btn ghost small" @click="addTagFromInput">Thêm</button>
            </div>
            <div v-if="tagChips.length" class="tag-chips-wrap">
              <span v-for="t in tagChips" :key="t" class="tag-chip">
                #{{ t }}
                <button type="button" @click="removeTag(t)" aria-label="Remove tag">
                  <i class="ri-close-line"></i>
                </button>
              </span>
            </div>
          </div>

          <!-- EXCERPT BOX -->
          <div class="cms-card side-card">
            <h4 class="side-title"><i class="ri-text"></i> Tóm tắt ngắn (Excerpt)</h4>
            <textarea
              v-model="form.Excerpt"
              rows="3"
              class="cms-textarea"
              placeholder="Đoạn sapo ngắn hiển thị trên thẻ bài viết ở trang /blog (để trống sẽ tự trích từ nội dung)..."
            ></textarea>
          </div>
        </aside>
      </div>
    </template>
  </div>
  </div>
</template>

<style scoped>
.blog-cms-shell {
  min-height: 100%;
  background: #f1f5f9;
  color: #0f172a;
}

.blog-cms-page {
  padding: 20px 24px 56px;
  max-width: 1440px;
  margin: 0 auto;
  color: #0f172a;
}

.unsaved-dot-badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 999px;
  background: #fef3c7;
  border: 1px solid #fde68a;
  color: #b45309;
  font-size: 12px;
  font-weight: 700;
}

.hidden-file {
  display: none;
}

/* TOAST */
.cms-toast {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 9999;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 11px 16px;
  border-radius: 10px;
  font-size: 13.5px;
  font-weight: 600;
  color: #ffffff;
  box-shadow: 0 12px 28px rgba(15, 23, 42, 0.22);
}
.cms-toast.is-success {
  background: #059669;
}
.cms-toast.is-error {
  background: #dc2626;
}
.toast-pop-enter-active,
.toast-pop-leave-active {
  transition: all 0.22s ease;
}
.toast-pop-enter-from,
.toast-pop-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* HEADER */
.cms-header {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
  margin-bottom: 18px;
}
.cms-header h1 {
  margin: 0;
  font-size: 22px;
  font-weight: 800;
  display: flex;
  align-items: center;
  gap: 8px;
  color: #0f172a;
}
.cms-header h1 i {
  color: #059669;
}
.cms-subtitle {
  margin: 4px 0 0;
  font-size: 13.5px;
  color: #64748b;
}
.cms-header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

/* BUTTONS */
.cms-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 9px 15px;
  border-radius: 9px;
  font-size: 13.5px;
  font-weight: 700;
  text-decoration: none;
  cursor: pointer;
  border: 1px solid transparent;
  transition: all 0.15s ease;
}
.cms-btn.primary {
  background: #059669;
  color: #ffffff;
}
.cms-btn.primary:hover:not(:disabled) {
  background: #047857;
}
.cms-btn.ghost {
  background: #ffffff;
  border-color: #cbd5e1;
  color: #334155;
}
.cms-btn.ghost:hover:not(:disabled) {
  background: #f8fafc;
  border-color: #94a3b8;
}
.cms-btn.danger-ghost {
  background: #fef2f2;
  border-color: #fecaca;
  color: #dc2626;
}
.cms-btn.small {
  padding: 7px 11px;
  font-size: 12.5px;
}
.cms-btn.full {
  width: 100%;
}
.cms-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

/* TABS */
.cms-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}
.cms-tab {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 9px 15px;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  background: #ffffff;
  color: #475569;
  font-size: 13.5px;
  font-weight: 700;
  cursor: pointer;
}
.cms-tab.active {
  background: #059669;
  border-color: #059669;
  color: #ffffff;
}
.tab-count {
  padding: 2px 7px;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.08);
  font-size: 12px;
}
.cms-tab.active .tab-count {
  background: rgba(255, 255, 255, 0.22);
}

/* CARD */
.cms-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  padding: 18px;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04);
}

/* LIST TOOLBAR */
.list-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
}
.status-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.sp-btn {
  padding: 6px 12px;
  border-radius: 999px;
  border: 1px solid #e2e8f0;
  background: #f8fafc;
  color: #475569;
  font-size: 12.5px;
  font-weight: 600;
  cursor: pointer;
}
.sp-btn.active {
  background: #0f172a;
  border-color: #0f172a;
  color: #ffffff;
}
.list-filters {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}
.search-box {
  position: relative;
  display: flex;
  align-items: center;
}
.search-box i {
  position: absolute;
  left: 10px;
  color: #94a3b8;
}
.search-box input {
  padding: 8px 12px 8px 32px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  font-size: 13.5px;
  min-width: 220px;
}

/* TABLE */
.posts-table-wrap {
  overflow-x: auto;
}
.posts-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13.5px;
}
.posts-table th {
  text-align: left;
  padding: 10px 12px;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
  color: #475569;
  font-weight: 700;
  font-size: 12.5px;
  white-space: nowrap;
}
.posts-table td {
  padding: 12px;
  border-bottom: 1px solid #f1f5f9;
  vertical-align: middle;
}
.th-actions {
  text-align: right !important;
}

.post-cell {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 260px;
}
.post-thumb {
  width: 68px;
  height: 44px;
  border-radius: 8px;
  overflow: hidden;
  flex-shrink: 0;
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
}
.post-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.post-thumb-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #94a3b8;
  font-size: 18px;
}
.post-title-link {
  border: none;
  background: none;
  padding: 0;
  text-align: left;
  font-size: 14px;
  font-weight: 700;
  color: #0f172a;
  cursor: pointer;
}
.post-title-link:hover {
  color: #059669;
  text-decoration: underline;
}
.post-meta-sub {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  margin-top: 4px;
  font-size: 12px;
}
.post-slug {
  color: #64748b;
  font-family: ui-monospace, monospace;
}
.toc-mini-badge {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 1px 6px;
  border-radius: 5px;
  background: #eff6ff;
  color: #1d4ed8;
  font-weight: 600;
  font-size: 11px;
}
.kw-mini-badge {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 1px 6px;
  border-radius: 5px;
  background: #f1f5f9;
  color: #475569;
  font-size: 11px;
}

.cat-badge {
  display: inline-block;
  padding: 3px 9px;
  border-radius: 999px;
  background: #ecfdf5;
  color: #047857;
  font-size: 12px;
  font-weight: 700;
}
.muted-text {
  color: #94a3b8;
  font-size: 12.5px;
}

.status-badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;
}
.status-badge.is-pub {
  background: #dcfce7;
  color: #15803d;
}
.status-badge.is-draft {
  background: #fef3c7;
  color: #b45309;
}
.status-badge.is-hidden {
  background: #f1f5f9;
  color: #64748b;
}

.seo-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 12.5px;
  font-weight: 800;
  white-space: nowrap;
}
.seo-pill.big {
  padding: 6px 12px;
  font-size: 13px;
}
.seo-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}
.seo-pill.is-good {
  background: #dcfce7;
  color: #15803d;
}
.seo-pill.is-good .seo-dot {
  background: #16a34a;
}
.seo-pill.is-warn {
  background: #fef3c7;
  color: #b45309;
}
.seo-pill.is-warn .seo-dot {
  background: #d97706;
}
.seo-pill.is-bad {
  background: #fee2e2;
  color: #b91c1c;
}
.seo-pill.is-bad .seo-dot {
  background: #dc2626;
}

.date-cell {
  color: #64748b;
  font-size: 12.5px;
  white-space: nowrap;
}

.row-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 5px;
}
.act-btn {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  background: #ffffff;
  color: #334155;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
  cursor: pointer;
}
.act-btn:hover {
  background: #f1f5f9;
  color: #059669;
}
.act-btn.danger:hover {
  background: #fef2f2;
  border-color: #fecaca;
  color: #dc2626;
}

.cms-empty {
  text-align: center;
  padding: 46px 16px;
  color: #64748b;
}
.cms-empty.compact {
  padding: 24px 12px;
}
.cms-empty i {
  font-size: 36px;
  color: #94a3b8;
}
.cms-empty h3 {
  margin: 10px 0 6px;
  color: #0f172a;
}

/* CATEGORY MANAGER */
.cat-manager-grid {
  display: grid;
  grid-template-columns: 380px 1fr;
  gap: 18px;
  align-items: start;
}
.cat-form-card h3,
.cat-list-card h3 {
  margin: 0 0 8px;
  font-size: 16px;
  font-weight: 800;
  display: flex;
  align-items: center;
  gap: 7px;
}
.field-hint {
  margin: 0 0 14px;
  font-size: 12.5px;
  color: #64748b;
}
.field-group {
  display: flex;
  flex-direction: column;
  gap: 5px;
  margin-bottom: 12px;
}
.field-group label {
  font-size: 12.5px;
  font-weight: 700;
  color: #334155;
}
.req {
  color: #dc2626;
}
.cms-input,
.cms-textarea,
.cms-select {
  padding: 9px 11px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  font-size: 13.5px;
  background: #ffffff;
  color: #0f172a;
  box-sizing: border-box;
}
.cms-select.full {
  width: 100%;
}
.cms-input:focus,
.cms-textarea:focus,
.cms-select:focus {
  outline: none;
  border-color: #059669;
  box-shadow: 0 0 0 3px rgba(5, 150, 105, 0.13);
}
.slug-input-wrap {
  display: flex;
  align-items: center;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  overflow: hidden;
  background: #f8fafc;
}
.slug-prefix {
  padding: 0 8px;
  font-size: 12px;
  color: #64748b;
  font-family: ui-monospace, monospace;
  white-space: nowrap;
}
.slug-input-wrap .cms-input {
  border: none;
  border-radius: 0;
  width: 100%;
}
.cat-form-actions {
  display: flex;
  gap: 8px;
  margin-top: 6px;
}
.cat-name-strong {
  font-weight: 700;
  color: #0f172a;
}
.cat-desc-sub {
  font-size: 12px;
  color: #64748b;
  margin-top: 2px;
}
.slug-code {
  padding: 2px 7px;
  border-radius: 6px;
  background: #f1f5f9;
  font-size: 12px;
  color: #334155;
}
.count-pill {
  padding: 3px 9px;
  border-radius: 999px;
  background: #eff6ff;
  color: #1d4ed8;
  font-size: 12px;
  font-weight: 700;
}

/* =========================================================
   WORDPRESS 2-COLUMN EDITOR
   ========================================================= */
.editor-topbar {
  position: sticky;
  top: 0;
  z-index: 30;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 12px 16px;
  margin-bottom: 16px;
  background: rgba(255, 255, 255, 0.96);
  backdrop-filter: blur(8px);
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(15, 23, 42, 0.06);
}
.etb-left,
.etb-right {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.wp-editor-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 330px;
  gap: 18px;
  align-items: start;
}
.wp-main-col,
.wp-side-col {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* TITLE & PERMALINK */
.wp-title-input {
  width: 100%;
  border: none;
  outline: none;
  font-size: 22px;
  font-weight: 800;
  color: #0f172a;
  padding: 4px 0 10px;
  border-bottom: 1px solid #e2e8f0;
  box-sizing: border-box;
}
.permalink-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  margin-top: 10px;
  font-size: 12.5px;
  color: #475569;
}
.pm-label {
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
.pm-base {
  color: #64748b;
  font-family: ui-monospace, monospace;
}
.pm-slug-input {
  flex: 1;
  min-width: 180px;
  padding: 5px 8px;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  font-family: ui-monospace, monospace;
  font-size: 12.5px;
  color: #047857;
  font-weight: 600;
}
.pm-auto-btn {
  padding: 5px 9px;
  border-radius: 6px;
  border: 1px solid #cbd5e1;
  background: #f8fafc;
  color: #334155;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}
.pm-auto-btn.active {
  background: #ecfdf5;
  border-color: #a7f3d0;
  color: #047857;
}

.editor-card {
  padding: 0;
  overflow: visible;
}
.editor-stats-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  padding: 9px 16px;
  border-top: 1px solid #e2e8f0;
  background: #f8fafc;
  border-radius: 0 0 14px 14px;
  font-size: 12.5px;
  color: #475569;
}
.editor-stats-bar span {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

/* BOX HEADERS (TOC + SEO) */
.box-head {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding-bottom: 14px;
  margin-bottom: 14px;
  border-bottom: 1px solid #e2e8f0;
}
.box-head-title {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}
.box-head-title > i {
  font-size: 22px;
  color: #059669;
  margin-top: 2px;
}
.box-head-title h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 800;
}
.box-head-title p {
  margin: 3px 0 0;
  font-size: 12.5px;
  color: #64748b;
}

/* TOGGLE SWITCH */
.toggle-switch {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  user-select: none;
}
.toggle-switch input {
  display: none;
}
.ts-slider {
  width: 42px;
  height: 24px;
  background: #cbd5e1;
  border-radius: 999px;
  position: relative;
  transition: background 0.18s;
}
.ts-slider::after {
  content: '';
  position: absolute;
  top: 3px;
  left: 3px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #ffffff;
  transition: transform 0.18s;
}
.toggle-switch input:checked + .ts-slider {
  background: #059669;
}
.toggle-switch input:checked + .ts-slider::after {
  transform: translateX(18px);
}
.ts-text {
  font-size: 12.5px;
  font-weight: 700;
  color: #334155;
}

/* TOC SETTINGS + PREVIEW */
.toc-controls-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}
.toc-live-preview {
  margin-top: 8px;
  border: 1px solid #d1fae5;
  background: #f0fdf4;
  border-radius: 10px;
  padding: 12px 14px;
}
.tlp-header {
  font-size: 13px;
  font-weight: 800;
  color: #065f46;
  margin-bottom: 8px;
}
.tlp-empty {
  font-size: 13px;
  color: #475569;
  line-height: 1.5;
}
.tlp-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 5px;
}
.tlp-list li {
  display: flex;
  align-items: baseline;
  gap: 6px;
  font-size: 13px;
  color: #0f172a;
}
.tlp-list li.lvl-2 {
  font-weight: 700;
}
.tlp-list li.lvl-3 {
  padding-left: 18px;
}
.tlp-list li.lvl-4 {
  padding-left: 36px;
  font-size: 12.5px;
  color: #475569;
}
.tlp-num {
  color: #059669;
  font-weight: 800;
}
.tlp-anchor {
  margin-left: auto;
  font-size: 11px;
  color: #64748b;
  background: rgba(255, 255, 255, 0.75);
  padding: 1px 6px;
  border-radius: 4px;
}

/* SEO SCORE & SERP */
.seo-score-badge {
  display: inline-flex;
  align-items: baseline;
  gap: 2px;
  padding: 6px 14px;
  border-radius: 12px;
  font-weight: 800;
}
.seo-score-badge strong {
  font-size: 20px;
}
.seo-score-badge span {
  font-size: 12px;
  opacity: 0.8;
}
.seo-score-badge.is-good {
  background: #dcfce7;
  color: #15803d;
}
.seo-score-badge.is-warn {
  background: #fef3c7;
  color: #b45309;
}
.seo-score-badge.is-bad {
  background: #fee2e2;
  color: #b91c1c;
}

.serp-preview-wrap {
  margin: 12px 0 16px;
  padding: 14px;
  border-radius: 12px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
}
.serp-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}
.serp-bar-label {
  font-size: 12.5px;
  font-weight: 700;
  color: #475569;
  display: inline-flex;
  align-items: center;
  gap: 5px;
}
.serp-toggle {
  display: inline-flex;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  overflow: hidden;
}
.serp-toggle button {
  padding: 4px 10px;
  border: none;
  background: #ffffff;
  font-size: 12px;
  font-weight: 600;
  color: #475569;
  cursor: pointer;
}
.serp-toggle button.active {
  background: #0f172a;
  color: #ffffff;
}
.serp-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 14px 16px;
  font-family: Arial, sans-serif;
}
.serp-card.is-mobile {
  max-width: 380px;
}
.serp-site-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 6px;
}
.serp-fav {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.serp-fav img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.serp-site-name {
  font-size: 13px;
  color: #202124;
  font-weight: 600;
}
.serp-url {
  font-size: 12px;
  color: #4d5156;
  word-break: break-all;
}
.serp-title {
  font-size: 19px;
  line-height: 1.3;
  color: #1a0dab;
  margin-bottom: 4px;
  font-weight: 400;
}
.serp-card.is-mobile .serp-title {
  font-size: 17px;
}
.serp-desc {
  font-size: 13.5px;
  line-height: 1.5;
  color: #4d5156;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.label-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.label-right {
  display: flex;
  align-items: center;
  gap: 8px;
}
.mini-link-btn {
  border: none;
  background: none;
  color: #059669;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  padding: 0;
}
.mini-link-btn:hover {
  text-decoration: underline;
}
.char-counter {
  font-size: 12px;
  font-weight: 700;
}
.char-counter.is-good {
  color: #16a34a;
}
.char-counter.is-warn {
  color: #d97706;
}
.char-counter.is-bad {
  color: #dc2626;
}
.meter-track {
  height: 5px;
  border-radius: 999px;
  background: #e2e8f0;
  overflow: hidden;
  margin-top: 3px;
}
.meter-fill {
  height: 100%;
  transition: width 0.18s ease;
}
.meter-fill.is-good {
  background: #16a34a;
}
.meter-fill.is-warn {
  background: #f59e0b;
}
.meter-fill.is-bad {
  background: #ef4444;
}

.adv-seo-toggle {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  border: none;
  background: none;
  padding: 6px 0;
  font-size: 13px;
  font-weight: 700;
  color: #475569;
  cursor: pointer;
}
.adv-seo-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  padding: 12px;
  background: #f8fafc;
  border-radius: 10px;
  margin-bottom: 14px;
}

/* SEO CHECKLIST */
.seo-checklist {
  margin-top: 14px;
  border-top: 1px solid #e2e8f0;
  padding-top: 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.sc-title {
  font-size: 13.5px;
  font-weight: 800;
  color: #0f172a;
  margin-bottom: 4px;
}
.sc-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 8px;
  background: #f8fafc;
}
.sc-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  margin-top: 5px;
  flex-shrink: 0;
}
.sc-item.is-good .sc-dot {
  background: #16a34a;
}
.sc-item.is-warn .sc-dot {
  background: #f59e0b;
}
.sc-item.is-bad .sc-dot {
  background: #ef4444;
}
.sc-label {
  font-size: 13px;
  font-weight: 700;
  color: #0f172a;
}
.sc-detail {
  font-size: 12px;
  color: #64748b;
  margin-top: 2px;
}

/* RIGHT SIDEBAR */
.side-card {
  padding: 15px 16px;
}
.side-title {
  margin: 0 0 12px;
  font-size: 14px;
  font-weight: 800;
  color: #0f172a;
  display: flex;
  align-items: center;
  gap: 6px;
  padding-bottom: 8px;
  border-bottom: 1px solid #f1f5f9;
}
.side-title i {
  color: #059669;
}
.side-meta-dates {
  font-size: 12px;
  color: #64748b;
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 12px;
  padding: 8px 10px;
  background: #f8fafc;
  border-radius: 8px;
}
.cat-radio-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-height: 190px;
  overflow-y: auto;
  margin-bottom: 10px;
}
.cat-radio-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #1e293b;
  cursor: pointer;
}
.cat-radio-item small {
  margin-left: auto;
  color: #94a3b8;
  font-family: ui-monospace, monospace;
  font-size: 11px;
}
.quick-cat-box {
  display: flex;
  gap: 6px;
}
.quick-cat-box .cms-input {
  flex: 1;
  min-width: 0;
}

.featured-upload-drop {
  width: 100%;
  padding: 22px 12px;
  border: 1.5px dashed #10b981;
  border-radius: 10px;
  background: #ecfdf5;
  color: #047857;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  cursor: pointer;
  font-weight: 700;
  font-size: 13px;
}
.featured-upload-drop i {
  font-size: 24px;
}
.featured-upload-drop small {
  font-weight: 500;
  color: #64748b;
}
.featured-preview-box img {
  width: 100%;
  aspect-ratio: 16 / 9;
  object-fit: cover;
  border-radius: 9px;
  border: 1px solid #e2e8f0;
  display: block;
}
.fp-actions {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}

.tag-chips-wrap {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 10px;
}
.tag-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 9px;
  border-radius: 999px;
  background: #f1f5f9;
  color: #334155;
  font-size: 12px;
  font-weight: 600;
}
.tag-chip button {
  border: none;
  background: none;
  padding: 0;
  color: #64748b;
  cursor: pointer;
  display: inline-flex;
}

.spin {
  animation: spinAnim 0.8s linear infinite;
}
@keyframes spinAnim {
  to {
    transform: rotate(360deg);
  }
}

/* RESPONSIVE */
@media (max-width: 1080px) {
  .wp-editor-grid {
    grid-template-columns: 1fr;
  }
  .cat-manager-grid {
    grid-template-columns: 1fr;
  }
  .toc-controls-grid {
    grid-template-columns: 1fr;
  }
}
@media (max-width: 768px) {
  .blog-cms-page {
    padding: 14px 12px calc(96px + env(safe-area-inset-bottom));
  }
}
@media (max-width: 640px) {
  .adv-seo-grid {
    grid-template-columns: 1fr;
  }
  .wp-title-input {
    font-size: 18px;
  }
}
</style>
