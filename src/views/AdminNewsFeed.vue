<script setup>
import { ref, computed, onMounted, onActivated } from 'vue'
import { getOneSheet, dispatchAction } from '@/config/api'
import { uploadImageToCloudinary } from '@/utils/imageUpload.js'
import {
  sanitizeFeedCaptionHtml,
  stripFeedCaptionToPlainText,
  compareFeedPosts,
} from '@/utils/feedCaption.js'
import FeedCaptionEditor from '@/components/FeedCaptionEditor.vue'

const POST_TYPES = [
  { key: 'feedback', label: 'Khách phản hồi', icon: 'ri-chat-smile-3-fill', tone: 'is-feedback' },
  { key: 'kitchen', label: 'Bếp hôm nay', icon: 'ri-restaurant-2-fill', tone: 'is-kitchen' },
  { key: 'promo', label: 'Thông báo & Ưu đãi', icon: 'ri-megaphone-fill', tone: 'is-promo' },
]

const posts = ref([])
const products = ref([])
const tableLoading = ref(true)
const submitting = ref(false)
const togglingId = ref('')
const reordering = ref(false)
const dragSourceId = ref('')
const dragOverId = ref('')
const filterType = ref('all')
const searchQuery = ref('')

const toast = ref({ message: '', type: 'success' })
let toastTimer = null
function showToast(message, type = 'success') {
  toast.value = { message, type }
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => {
    toast.value = { message: '', type: 'success' }
  }, 3000)
}

/* COMPOSER FORM */
const dishSearch = ref('')
const showDishDropdown = ref(false)
const form = ref({
  Post_type: 'feedback',
  Content: '',
  mediaQueue: [], // [{ id, url, file, preview }]
  Product_codes: [],
  Pinned: false,
  Active: true,
  Base_views: 0,
  Base_hearts: 0,
})

/* EDIT MODAL */
const showEdit = ref(false)
const editing = ref(null)
const editDishSearch = ref('')

function genPostId() {
  const d = new Date()
  const p = (n) => String(n).padStart(2, '0')
  return (
    'FP' +
    p(d.getDate()) +
    p(d.getMonth() + 1) +
    d.getFullYear() +
    p(d.getHours()) +
    p(d.getMinutes()) +
    p(d.getSeconds()) +
    Math.random().toString(36).slice(2, 5).toUpperCase()
  )
}

function isPostActive(p) {
  if (!p) return false
  const v = p.Active
  if (v === false || v === 0 || v === '0' || String(v).toLowerCase() === 'false') return false
  return true
}

function getPostTypeMeta(typeKey) {
  return POST_TYPES.find((t) => t.key === typeKey) || POST_TYPES[0]
}

async function uploadFeedImage(file) {
  return uploadImageToCloudinary(file, {
    targetKB: 220,
    maxWidth: 1440,
    maxHeight: 1600,
    folder: 'sakitchen/feed',
  })
}

async function loadData() {
  tableLoading.value = true
  try {
    const [feedRes, prodRes] = await Promise.all([
      getOneSheet('feed_posts'),
      getOneSheet('hang_hoa'),
    ])
    posts.value = Array.isArray(feedRes?.data) ? feedRes.data : []
    products.value = Array.isArray(prodRes?.data) ? prodRes.data : []
  } finally {
    tableLoading.value = false
  }
}

const productMap = computed(() => {
  const map = new Map()
  for (const p of products.value) {
    if (p?.Ma_hang) map.set(String(p.Ma_hang).trim(), p)
  }
  return map
})

function filterProductsByKeyword(kw, excludedCodes = []) {
  const q = String(kw || '').trim().toLowerCase()
  const excluded = new Set(excludedCodes)
  return products.value
    .filter((p) => {
      const code = String(p?.Ma_hang || '').trim()
      if (!code || excluded.has(code)) return false
      if (!q) return true
      const name = String(p.Ten_hang || '').toLowerCase()
      return name.includes(q) || code.toLowerCase().includes(q)
    })
    .slice(0, 12)
}

const composerDishOptions = computed(() =>
  filterProductsByKeyword(dishSearch.value, form.value.Product_codes),
)

const editDishOptions = computed(() =>
  editing.value ? filterProductsByKeyword(editDishSearch.value, editing.value.Product_codes) : [],
)

function formatDishPrice(p) {
  if (!p) return ''
  const sale = Number(p.Gia_Giam || 0)
  const base = Number(p.Gia_ban || 0)
  const effective = sale > 0 && sale < base ? sale : base
  const cur = String(p.Don_vi_tien_te || 'P').trim()
  return `${effective.toLocaleString('en-US')} ${cur}`
}

function appendFilesToQueue(targetList, fileList) {
  const files = Array.from(fileList || []).filter((f) => f && f.type.startsWith('image/'))
  if (!files.length) return

  const remaining = Math.max(0, 10 - targetList.length)
  if (remaining <= 0) {
    showToast('Mỗi bài đăng tối đa 10 hình ảnh', 'error')
    return
  }

  files.slice(0, remaining).forEach((file) => {
    if (file.size > 25 * 1024 * 1024) return
    targetList.push({
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      file,
      url: '',
      preview: URL.createObjectURL(file),
    })
  })
}

function onComposerFiles(e) {
  appendFilesToQueue(form.value.mediaQueue, e.target.files)
  e.target.value = ''
}

function onComposerPasteImages(imageFiles) {
  if (imageFiles?.length) {
    appendFilesToQueue(form.value.mediaQueue, imageFiles)
    showToast(`Đã dán ${imageFiles.length} ảnh từ bộ nhớ tạm`)
  }
}

function onEditPasteImages(imageFiles) {
  if (editing.value && imageFiles?.length) {
    appendFilesToQueue(editing.value.mediaQueue, imageFiles)
    showToast(`Đã dán ${imageFiles.length} ảnh vào bài sửa`)
  }
}

function onEditFiles(e) {
  if (!editing.value) return
  appendFilesToQueue(editing.value.mediaQueue, e.target.files)
  e.target.value = ''
}

function onEditPaste(e) {
  if (!editing.value) return
  const items = Array.from(e.clipboardData?.items || [])
  const imageFiles = items
    .filter((it) => it.type && it.type.startsWith('image/'))
    .map((it) => it.getAsFile())
    .filter(Boolean)
  if (imageFiles.length) {
    appendFilesToQueue(editing.value.mediaQueue, imageFiles)
    showToast(`Đã dán ${imageFiles.length} ảnh vào bài sửa`)
  }
}

function moveQueueItem(list, idx, delta) {
  const nextIdx = idx + delta
  if (nextIdx < 0 || nextIdx >= list.length) return
  const temp = list[idx]
  list[idx] = list[nextIdx]
  list[nextIdx] = temp
}

function removeQueueItem(list, idx) {
  const removed = list[idx]
  if (removed?.preview && removed.file) {
    try {
      URL.revokeObjectURL(removed.preview)
    } catch {}
  }
  list.splice(idx, 1)
}

function addDishTag(targetCodes, code) {
  if (!code || targetCodes.includes(code)) return
  if (targetCodes.length >= 6) {
    showToast('Gắn tối đa 6 món cho mỗi bài đăng', 'error')
    return
  }
  targetCodes.push(code)
}

function removeDishTag(targetCodes, code) {
  const idx = targetCodes.indexOf(code)
  if (idx !== -1) targetCodes.splice(idx, 1)
}

function resetComposer() {
  form.value.mediaQueue.forEach((item) => {
    if (item.file && item.preview) {
      try {
        URL.revokeObjectURL(item.preview)
      } catch {}
    }
  })
  form.value = {
    Post_type: 'feedback',
    Content: '',
    mediaQueue: [],
    Product_codes: [],
    Pinned: false,
    Active: true,
    Base_views: 0,
    Base_hearts: 0,
  }
  dishSearch.value = ''
  showDishDropdown.value = false
}

async function resolveUploadedUrls(queue) {
  const urls = []
  for (const item of queue) {
    if (item.url) {
      urls.push(item.url)
    } else if (item.file) {
      const uploaded = await uploadFeedImage(item.file)
      if (uploaded) urls.push(uploaded)
    }
  }
  return urls
}

async function submitPost() {
  const plainText = stripFeedCaptionToPlainText(form.value.Content)
  if (!plainText && !form.value.mediaQueue.length) {
    showToast('Vui lòng nhập nội dung hoặc tải lên ít nhất 1 hình ảnh', 'error')
    return
  }

  submitting.value = true
  try {
    const uploadedImages = await resolveUploadedUrls(form.value.mediaQueue)
    const res = await dispatchAction({
      action: 'addFeedPost',
      data: {
        ID: genPostId(),
        Post_type: form.value.Post_type,
        Content: sanitizeFeedCaptionHtml(form.value.Content),
        Images: uploadedImages,
        Product_codes: [...form.value.Product_codes],
        Pinned: Boolean(form.value.Pinned),
        Active: Boolean(form.value.Active),
        Base_views: Math.max(0, Number(form.value.Base_views || 0)),
        Base_hearts: Math.max(0, Number(form.value.Base_hearts || 0)),
        Created_at: Date.now(),
      },
    })

    if (!res?.success) throw new Error('Lỗi đăng bài')
    resetComposer()
    await loadData()
    showToast('Đã đăng bài mới lên Bảng tin')
  } catch {
    showToast('Không thể đăng bài, vui lòng thử lại', 'error')
  } finally {
    submitting.value = false
  }
}

const allOrderedPosts = computed(() => [...posts.value].filter(Boolean).sort(compareFeedPosts))

const pinnedFeedCount = computed(
  () => allOrderedPosts.value.filter((p) => Boolean(p.Pinned)).length,
)

const canReorderFeed = computed(
  () => filterType.value === 'all' && !searchQuery.value.trim() && !reordering.value,
)

const postOrderIndexMap = computed(
  () => new Map(allOrderedPosts.value.map((p, idx) => [p.ID, idx])),
)

function getPostGlobalPos(p) {
  return (postOrderIndexMap.value.get(p?.ID) ?? 0) + 1
}

function getAllowedFeedPositions(p) {
  const total = allOrderedPosts.value.length
  if (!total) return [1]
  const pinnedTotal = pinnedFeedCount.value
  if (p?.Pinned) {
    return Array.from({ length: Math.max(1, pinnedTotal) }, (_, i) => i + 1)
  }
  const start = pinnedTotal + 1
  const count = Math.max(1, total - pinnedTotal)
  return Array.from({ length: count }, (_, i) => start + i)
}

function canMoveFeedPost(p, delta) {
  if (!canReorderFeed.value || !p?.ID) return false
  const curIdx = postOrderIndexMap.value.get(p.ID)
  if (curIdx === undefined) return false
  const nextIdx = curIdx + delta
  const pinnedTotal = pinnedFeedCount.value
  const minIdx = p.Pinned ? 0 : pinnedTotal
  const maxIdx = p.Pinned ? pinnedTotal - 1 : allOrderedPosts.value.length - 1
  return nextIdx >= minIdx && nextIdx <= maxIdx
}

async function commitFeedOrder(nextOrdered, successMessage = 'Đã cập nhật vị trí bài đăng') {
  if (reordering.value) return
  reordering.value = true
  const prevSnapshot = posts.value.map((item) => ({ ...item }))
  posts.value = nextOrdered.map((item, idx) => ({
    ...item,
    Sort_order: idx + 1,
  }))
  try {
    const res = await dispatchAction({
      action: 'reorderFeedPosts',
      ids: nextOrdered.map((item) => item.ID),
    })
    if (!res?.success) throw new Error(res?.message || 'Lỗi sắp xếp')
    showToast(successMessage)
  } catch {
    posts.value = prevSnapshot
    showToast('Không thể đổi vị trí bài đăng', 'error')
  } finally {
    reordering.value = false
  }
}

async function moveFeedPostByDelta(p, delta) {
  if (!canMoveFeedPost(p, delta)) return
  const list = [...allOrderedPosts.value]
  const curIdx = list.findIndex((item) => item.ID === p.ID)
  if (curIdx < 0) return
  const targetIdx = curIdx + delta
  const [moved] = list.splice(curIdx, 1)
  list.splice(targetIdx, 0, moved)
  await commitFeedOrder(list, `Đã chuyển bài đăng sang vị trí #${targetIdx + 1}`)
}

async function jumpFeedPostToPosition(p, targetOneBased) {
  if (!canReorderFeed.value || !p?.ID) return
  const list = [...allOrderedPosts.value]
  const curIdx = list.findIndex((item) => item.ID === p.ID)
  if (curIdx < 0) return
  const pinnedTotal = pinnedFeedCount.value
  const minIdx = p.Pinned ? 0 : pinnedTotal
  const maxIdx = p.Pinned ? Math.max(0, pinnedTotal - 1) : list.length - 1
  const clampedIdx = Math.min(maxIdx, Math.max(minIdx, Number(targetOneBased || 1) - 1))
  if (clampedIdx === curIdx) return
  const [moved] = list.splice(curIdx, 1)
  list.splice(clampedIdx, 0, moved)
  await commitFeedOrder(list, `Đã chuyển bài đăng sang vị trí #${clampedIdx + 1}`)
}

function onFeedDragStart(e, p) {
  if (!canReorderFeed.value || !p?.ID) {
    e.preventDefault()
    return
  }
  dragSourceId.value = p.ID
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', p.ID)
  }
}

function onFeedDragOver(e, p) {
  if (!dragSourceId.value || !p?.ID || dragSourceId.value === p.ID) return
  e.preventDefault()
  dragOverId.value = p.ID
}

async function onFeedDrop(e, targetPost) {
  e.preventDefault()
  const srcId = dragSourceId.value
  dragSourceId.value = ''
  dragOverId.value = ''
  if (!srcId || !targetPost?.ID || srcId === targetPost.ID || !canReorderFeed.value) return

  const list = [...allOrderedPosts.value]
  const srcIdx = list.findIndex((item) => item.ID === srcId)
  const rawTargetIdx = list.findIndex((item) => item.ID === targetPost.ID)
  if (srcIdx < 0 || rawTargetIdx < 0) return

  const srcPost = list[srcIdx]
  const pinnedTotal = pinnedFeedCount.value
  const minIdx = srcPost.Pinned ? 0 : pinnedTotal
  const maxIdx = srcPost.Pinned ? Math.max(0, pinnedTotal - 1) : list.length - 1
  const clampedIdx = Math.min(maxIdx, Math.max(minIdx, rawTargetIdx))
  if (clampedIdx === srcIdx) return

  const [moved] = list.splice(srcIdx, 1)
  list.splice(clampedIdx, 0, moved)
  await commitFeedOrder(list, `Đã chuyển bài đăng sang vị trí #${clampedIdx + 1}`)
}

function onFeedDragEnd() {
  dragSourceId.value = ''
  dragOverId.value = ''
}

const sortedPosts = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  return allOrderedPosts.value.filter((p) => {
    if (filterType.value !== 'all' && p.Post_type !== filterType.value) return false
    if (!q) return true
    const text = stripFeedCaptionToPlainText(p.Content).toLowerCase()
    const dishNames = (Array.isArray(p.Product_codes) ? p.Product_codes : [])
      .map((c) => String(productMap.value.get(c)?.Ten_hang || '').toLowerCase())
      .join(' ')
    return text.includes(q) || dishNames.includes(q)
  })
})

const totalActiveCount = computed(() => posts.value.filter((p) => isPostActive(p)).length)

function totalPostViews(p) {
  return Math.max(0, Number(p?.Base_views || 0)) + Math.max(0, Number(p?.Views || 0))
}

function totalPostLikes(p) {
  return Math.max(0, Number(p?.Like_count || 0)) + Math.max(0, Number(p?.Trust_count || 0))
}

function totalPostHearts(p) {
  return Math.max(0, Number(p?.Base_hearts || 0)) + Math.max(0, Number(p?.Heart_count || 0))
}

function totalPostReactions(p) {
  return (
    totalPostLikes(p) +
    totalPostHearts(p) +
    Math.max(0, Number(p?.Haha_count || 0)) +
    Math.max(0, Number(p?.Wow_count || 0)) +
    Math.max(0, Number(p?.Yummy_count || 0))
  )
}

function formatDateTime(ts) {
  const num = Number(ts || 0)
  if (!num) return '—'
  const d = new Date(num)
  return d.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

async function quickToggleField(p, field) {
  if (!p?.ID || togglingId.value) return
  const nextVal = field === 'Active' ? !isPostActive(p) : !Boolean(p.Pinned)
  togglingId.value = `${p.ID}_${field}`
  try {
    await dispatchAction({
      action: 'updateFeedPost',
      data: {
        ID: p.ID,
        [field]: nextVal,
      },
    })
    await loadData()
  } catch {
    showToast('Không thể cập nhật trạng thái', 'error')
  } finally {
    togglingId.value = ''
  }
}

function openEdit(p) {
  const imgs = Array.isArray(p.Images) ? p.Images : []
  editing.value = {
    ID: p.ID,
    Post_type: p.Post_type || 'feedback',
    Content: String(p.Content || ''),
    mediaQueue: imgs.map((url, idx) => ({
      id: `existing_${idx}_${Date.now()}`,
      file: null,
      url,
      preview: url,
    })),
    Product_codes: Array.isArray(p.Product_codes) ? [...p.Product_codes] : [],
    Pinned: Boolean(p.Pinned),
    Active: isPostActive(p),
    Base_views: Math.max(0, Number(p.Base_views || 0)),
    Base_hearts: Math.max(0, Number(p.Base_hearts || 0)),
  }
  editDishSearch.value = ''
  showEdit.value = true
}

function closeEdit() {
  showEdit.value = false
  editing.value = null
}

async function saveEdit() {
  if (!editing.value) return
  const plainText = stripFeedCaptionToPlainText(editing.value.Content)
  if (!plainText && !editing.value.mediaQueue.length) {
    showToast('Bài đăng cần có nội dung chữ hoặc ít nhất 1 hình ảnh', 'error')
    return
  }

  submitting.value = true
  try {
    const uploadedImages = await resolveUploadedUrls(editing.value.mediaQueue)
    const res = await dispatchAction({
      action: 'updateFeedPost',
      data: {
        ID: editing.value.ID,
        Post_type: editing.value.Post_type,
        Content: sanitizeFeedCaptionHtml(editing.value.Content),
        Images: uploadedImages,
        Product_codes: [...editing.value.Product_codes],
        Pinned: Boolean(editing.value.Pinned),
        Active: Boolean(editing.value.Active),
        Base_views: Math.max(0, Number(editing.value.Base_views || 0)),
        Base_hearts: Math.max(0, Number(editing.value.Base_hearts || 0)),
      },
    })
    if (!res?.success) throw new Error('Lỗi lưu bài')
    closeEdit()
    await loadData()
    showToast('Đã lưu thay đổi bài đăng')
  } catch {
    showToast('Lỗi cập nhật bài đăng', 'error')
  } finally {
    submitting.value = false
  }
}

async function removePost(id) {
  if (!confirm('Xóa vĩnh viễn bài đăng này khỏi Bảng tin?')) return
  try {
    await dispatchAction({
      action: 'deleteFeedPost',
      ID: id,
    })
    await loadData()
    showToast('Đã xóa bài đăng')
  } catch {
    showToast('Không thể xóa bài đăng', 'error')
  }
}

async function copyPostPublicLink(id) {
  if (!id) return
  const link = `${window.location.origin}/bang-tin/${encodeURIComponent(id)}`
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(link)
      showToast('Đã sao chép link bài đăng: ' + link)
    }
  } catch {
    showToast('Không thể sao chép liên kết', 'error')
  }
}

onMounted(loadData)

let mountedOnce = false
onActivated(() => {
  if (!mountedOnce) {
    mountedOnce = true
    return
  }
  loadData()
})
</script>

<template>
  <div class="admin-page">
    <!-- TOAST -->
    <Transition name="fade">
      <div v-if="toast.message" class="admin-toast" :class="toast.type">
        <i :class="toast.type === 'error' ? 'ri-error-warning-fill' : 'ri-checkbox-circle-fill'"></i>
        <span>{{ toast.message }}</span>
      </div>
    </Transition>

    <!-- HEADER -->
    <div class="page-header">
      <div class="header-content">
        <div>
          <h1 class="hero-admin-title">QUẢN LÝ BẢNG TIN &amp; FEEDBACK</h1>
          <p class="page-subtitle">
            Đăng nhanh hình ảnh món ăn thực tế và phản hồi khách hàng theo dạng dòng thời gian. Hỗ trợ dán trực tiếp ảnh chụp màn hình (Ctrl + V) và gắn món đặt ngay.
          </p>
        </div>
        <div class="header-actions-group">
          <RouterLink to="/admin/banner?tab=vertical" class="btn btn-outline-ad">
            <i class="ri-advertisement-line"></i>
            <span>Banner dọc Sidebar trái</span>
          </RouterLink>
          <RouterLink to="/bang-tin" target="_blank" class="btn btn-outline-preview">
            <i class="ri-external-link-line"></i>
            <span>Mở trang Bảng tin</span>
          </RouterLink>
        </div>
      </div>
    </div>

    <!-- QUICK COMPOSER CARD -->
    <div class="card composer-card">
      <div class="card-header">
        <h3 class="card-title">
          <i class="ri-edit-box-fill" style="color: #4ade80;"></i>
          <span>Tạo bài đăng mới</span>
        </h3>
        <div class="type-selector">
          <button
            v-for="t in POST_TYPES"
            :key="t.key"
            type="button"
            class="type-pill"
            :class="[t.tone, { active: form.Post_type === t.key }]"
            @click="form.Post_type = t.key"
          >
            <i :class="t.icon"></i>
            <span>{{ t.label }}</span>
          </button>
        </div>
      </div>

      <div class="card-body">
        <div class="composer-box">
          <FeedCaptionEditor
            v-model="form.Content"
            placeholder="Nhập nội dung chia sẻ hôm nay, phản hồi của khách hoặc thông tin mẻ món mới... (Bôi đen chữ để gắn link hoặc bấm Ctrl + V dán ảnh chụp màn hình)"
            @paste-images="onComposerPasteImages"
          />

          <!-- MEDIA PREVIEW GRID -->
          <div v-if="form.mediaQueue.length" class="media-queue-grid">
            <div
              v-for="(m, idx) in form.mediaQueue"
              :key="m.id"
              class="media-queue-item"
            >
              <img :src="m.preview" alt="" />
              <span v-if="idx === 0" class="cover-tag">Ảnh đầu</span>
              <div class="media-item-controls">
                <button
                  type="button"
                  class="mq-btn"
                  :disabled="idx === 0"
                  title="Đưa lên trước"
                  @click="moveQueueItem(form.mediaQueue, idx, -1)"
                >
                  <i class="ri-arrow-left-s-line"></i>
                </button>
                <button
                  type="button"
                  class="mq-btn"
                  :disabled="idx === form.mediaQueue.length - 1"
                  title="Đưa ra sau"
                  @click="moveQueueItem(form.mediaQueue, idx, 1)"
                >
                  <i class="ri-arrow-right-s-line"></i>
                </button>
                <button
                  type="button"
                  class="mq-btn is-danger"
                  title="Gỡ ảnh"
                  @click="removeQueueItem(form.mediaQueue, idx)"
                >
                  <i class="ri-close-line"></i>
                </button>
              </div>
            </div>
          </div>

          <!-- SELECTED DISH CHIPS -->
          <div v-if="form.Product_codes.length" class="selected-dishes-bar">
            <span class="sdb-label">
              <i class="ri-shopping-bag-3-fill"></i>
              <span>Món gắn kèm:</span>
            </span>
            <div class="sdb-chips">
              <div
                v-for="code in form.Product_codes"
                :key="code"
                class="dish-chip"
              >
                <img
                  v-if="productMap.get(code)?.Main_img"
                  :src="productMap.get(code).Main_img"
                  alt=""
                />
                <span>{{ productMap.get(code)?.Ten_hang || code }}</span>
                <button type="button" @click="removeDishTag(form.Product_codes, code)">
                  <i class="ri-close-line"></i>
                </button>
              </div>
            </div>
          </div>

          <!-- COMPOSER TOOLBAR -->
          <div class="composer-toolbar">
            <label class="tool-upload-btn">
              <input
                type="file"
                accept="image/*"
                multiple
                hidden
                @change="onComposerFiles"
              />
              <i class="ri-image-add-fill"></i>
              <span>Thêm ảnh ({{ form.mediaQueue.length }}/10)</span>
            </label>

            <div class="dish-picker-wrap">
              <button
                type="button"
                class="tool-action-btn"
                :class="{ active: showDishDropdown }"
                @click="showDishDropdown = !showDishDropdown"
              >
                <i class="ri-restaurant-line"></i>
                <span>Gắn món ăn ({{ form.Product_codes.length }})</span>
                <i :class="showDishDropdown ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line'"></i>
              </button>

              <div v-if="showDishDropdown" class="dish-dropdown">
                <div class="dd-search">
                  <i class="ri-search-line"></i>
                  <input
                    v-model="dishSearch"
                    type="text"
                    placeholder="Tìm tên món hoặc mã hàng..."
                  />
                  <button type="button" class="dd-close" @click="showDishDropdown = false">
                    <i class="ri-close-line"></i>
                  </button>
                </div>
                <div class="dd-list">
                  <button
                    v-for="prod in composerDishOptions"
                    :key="prod.Ma_hang"
                    type="button"
                    class="dd-item"
                    @click="addDishTag(form.Product_codes, prod.Ma_hang)"
                  >
                    <img v-if="prod.Main_img" :src="prod.Main_img" alt="" />
                    <div class="dd-meta">
                      <strong>{{ prod.Ten_hang }}</strong>
                      <span>{{ formatDishPrice(prod) }}</span>
                    </div>
                    <i class="ri-add-circle-fill dd-add-ico"></i>
                  </button>
                  <div v-if="!composerDishOptions.length" class="dd-empty">
                    Không tìm thấy món phù hợp
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- OPTIONS ROW: SEED METRICS + PIN + ACTIVE -->
        <div class="composer-options-grid">
          <div class="seed-field">
            <label class="form-label">
              <i class="ri-eye-line"></i>
              <span>Lượt xem khởi điểm (tùy chọn)</span>
            </label>
            <input
              v-model.number="form.Base_views"
              type="number"
              min="0"
              class="form-input"
              placeholder="0"
            />
          </div>

          <div class="seed-field">
            <label class="form-label">
              <i class="ri-heart-3-line"></i>
              <span>Lượt yêu thích khởi điểm (tùy chọn)</span>
            </label>
            <input
              v-model.number="form.Base_hearts"
              type="number"
              min="0"
              class="form-input"
              placeholder="0"
            />
          </div>

          <div
            class="toggle-card"
            :class="{ active: form.Pinned }"
            @click="form.Pinned = !form.Pinned"
          >
            <div class="tc-info">
              <i class="ri-pushpin-2-fill"></i>
              <div>
                <strong>Ghim lên đầu Bảng tin</strong>
                <span>Bài ghim luôn hiển thị trên cùng</span>
              </div>
            </div>
            <button
              type="button"
              class="switch-pill"
              :class="{ active: form.Pinned }"
              @click.stop="form.Pinned = !form.Pinned"
            >
              <span class="switch-knob"></span>
            </button>
          </div>

          <div
            class="toggle-card"
            :class="{ active: form.Active }"
            @click="form.Active = !form.Active"
          >
            <div class="tc-info">
              <i class="ri-eye-fill"></i>
              <div>
                <strong>Hiển thị công khai</strong>
                <span>Khách truy cập thấy ngay sau khi đăng</span>
              </div>
            </div>
            <button
              type="button"
              class="switch-pill"
              :class="{ active: form.Active }"
              @click.stop="form.Active = !form.Active"
            >
              <span class="switch-knob"></span>
            </button>
          </div>
        </div>

        <button
          type="button"
          class="btn btn-primary submit-post-btn"
          :disabled="submitting || (!stripFeedCaptionToPlainText(form.Content) && !form.mediaQueue.length)"
          @click="submitPost"
        >
          <span v-if="submitting" class="btn-loading">
            <span class="spinner"></span>
            <span>Đang tải ảnh &amp; đăng bài...</span>
          </span>
          <span v-else class="btn-loading">
            <i class="ri-send-plane-fill"></i>
            <span>Đăng lên Bảng tin</span>
          </span>
        </button>
      </div>
    </div>

    <!-- POSTS LIST CARD -->
    <div class="card list-card">
      <div class="card-header">
        <div class="list-header-left">
          <h3 class="card-title">
            <i class="ri-newspaper-line"></i>
            <span>Danh sách bài đã đăng</span>
          </h3>
          <span class="badge-pill">Đang hiện: {{ totalActiveCount }}/{{ posts.length }}</span>
          <span v-if="!canReorderFeed && !reordering" class="reorder-hint-pill">
            <i class="ri-information-line"></i>
            <span>Chọn "Tất cả" &amp; xóa tìm kiếm để kéo thả / đổi vị trí</span>
          </span>
        </div>

        <div class="list-filters">
          <div class="filter-tabs">
            <button
              type="button"
              class="ft-btn"
              :class="{ active: filterType === 'all' }"
              @click="filterType = 'all'"
            >
              Tất cả
            </button>
            <button
              v-for="t in POST_TYPES"
              :key="'flt-' + t.key"
              type="button"
              class="ft-btn"
              :class="{ active: filterType === t.key }"
              @click="filterType = t.key"
            >
              <i :class="t.icon"></i>
              <span>{{ t.label }}</span>
            </button>
          </div>

          <div class="search-mini">
            <i class="ri-search-line"></i>
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Tìm bài đăng..."
            />
          </div>
        </div>
      </div>

      <div v-if="tableLoading" class="card-body">
        <div class="table-loading">
          <div class="table-loading-spinner"></div>
          <div class="table-loading-text">Đang tải danh sách bài đăng...</div>
        </div>
      </div>

      <div v-else-if="sortedPosts.length" class="card-body">
        <div class="admin-feed-list">
          <div
            v-for="p in sortedPosts"
            :key="p.ID"
            class="admin-post-row"
            :class="{
              'is-muted': !isPostActive(p),
              'is-pinned': p.Pinned,
              'is-dragging': dragSourceId === p.ID,
              'is-drag-over': dragOverId === p.ID && dragSourceId !== p.ID,
            }"
            :draggable="canReorderFeed"
            @dragstart="onFeedDragStart($event, p)"
            @dragover="onFeedDragOver($event, p)"
            @drop="onFeedDrop($event, p)"
            @dragend="onFeedDragEnd"
          >
            <div class="apr-main">
              <div class="apr-top-meta">
                <div
                  class="apr-pos-box"
                  :title="
                    canReorderFeed
                      ? 'Kéo thả hoặc chọn số thứ tự / mũi tên để đổi vị trí hiển thị'
                      : 'Chọn Tất cả & xóa tìm kiếm để đổi vị trí'
                  "
                >
                  <i class="ri-draggable apr-drag-ico"></i>
                  <select
                    class="apr-pos-select"
                    :value="getPostGlobalPos(p)"
                    :disabled="!canReorderFeed || getAllowedFeedPositions(p).length <= 1"
                    @change="jumpFeedPostToPosition(p, Number($event.target.value))"
                  >
                    <option
                      v-for="pos in getAllowedFeedPositions(p)"
                      :key="'fpos-' + p.ID + '-' + pos"
                      :value="pos"
                    >
                      #{{ pos }}
                    </option>
                  </select>
                  <button
                    type="button"
                    class="apr-move-btn"
                    title="Đưa lên 1 bậc"
                    :disabled="!canMoveFeedPost(p, -1)"
                    @click="moveFeedPostByDelta(p, -1)"
                  >
                    <i class="ri-arrow-up-s-line"></i>
                  </button>
                  <button
                    type="button"
                    class="apr-move-btn"
                    title="Đưa xuống 1 bậc"
                    :disabled="!canMoveFeedPost(p, 1)"
                    @click="moveFeedPostByDelta(p, 1)"
                  >
                    <i class="ri-arrow-down-s-line"></i>
                  </button>
                </div>

                <span class="apr-type-tag" :class="getPostTypeMeta(p.Post_type).tone">
                  <i :class="getPostTypeMeta(p.Post_type).icon"></i>
                  <span>{{ getPostTypeMeta(p.Post_type).label }}</span>
                </span>
                <span v-if="p.Pinned" class="apr-pin-tag">
                  <i class="ri-pushpin-2-fill"></i>
                  <span>Đã ghim</span>
                </span>
                <span class="apr-time">
                  <i class="ri-time-line"></i>
                  <span>{{ formatDateTime(p.Created_at) }}</span>
                </span>
              </div>

              <div
                v-if="stripFeedCaptionToPlainText(p.Content)"
                class="apr-caption"
                v-html="sanitizeFeedCaptionHtml(p.Content)"
              ></div>

              <div v-if="Array.isArray(p.Images) && p.Images.length" class="apr-thumbs">
                <div
                  v-for="(img, idx) in p.Images.slice(0, 5)"
                  :key="idx"
                  class="apr-thumb-box"
                >
                  <img :src="img" alt="" loading="lazy" />
                  <span v-if="idx === 4 && p.Images.length > 5" class="apr-more-count">
                    +{{ p.Images.length - 5 }}
                  </span>
                </div>
              </div>

              <div v-if="Array.isArray(p.Product_codes) && p.Product_codes.length" class="apr-dishes">
                <span
                  v-for="code in p.Product_codes"
                  :key="code"
                  class="apr-dish-pill"
                >
                  <i class="ri-restaurant-2-line"></i>
                  <span>{{ productMap.get(code)?.Ten_hang || code }}</span>
                </span>
              </div>

              <div class="apr-metrics">
                <span class="metric-item">
                  <i class="ri-eye-line"></i>
                  <strong>{{ totalPostViews(p).toLocaleString('en-US') }}</strong>
                  <span>lượt xem</span>
                </span>
                <span class="metric-item is-trust">
                  <i class="ri-thumb-up-line"></i>
                  <strong>{{ totalPostReactions(p).toLocaleString('en-US') }}</strong>
                  <span>cảm xúc</span>
                </span>
              </div>
            </div>

            <div class="apr-actions">
              <button type="button" class="apr-btn is-copy" @click="copyPostPublicLink(p.ID)">
                <i class="ri-links-line"></i>
                <span>Copy link</span>
              </button>

              <button
                type="button"
                class="apr-btn"
                :class="{ 'is-pin-on': p.Pinned }"
                :disabled="togglingId === `${p.ID}_Pinned`"
                @click="quickToggleField(p, 'Pinned')"
              >
                <i class="ri-pushpin-2-fill"></i>
                <span>{{ p.Pinned ? 'Bỏ ghim' : 'Ghim đầu' }}</span>
              </button>

              <button
                type="button"
                class="apr-btn"
                :class="{ 'is-vis-on': isPostActive(p) }"
                :disabled="togglingId === `${p.ID}_Active`"
                @click="quickToggleField(p, 'Active')"
              >
                <i :class="isPostActive(p) ? 'ri-eye-fill' : 'ri-eye-off-line'"></i>
                <span>{{ isPostActive(p) ? 'Đang hiện' : 'Đang ẩn' }}</span>
              </button>

              <button type="button" class="apr-btn is-edit" @click="openEdit(p)">
                <i class="ri-edit-line"></i>
                <span>Sửa</span>
              </button>

              <button type="button" class="apr-btn is-delete" @click="removePost(p.ID)">
                <i class="ri-delete-bin-line"></i>
                <span>Xóa</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="card-body">
        <div class="empty-state">
          <div class="empty-icon"><i class="ri-newspaper-line"></i></div>
          <h3 class="empty-title">Chưa có bài đăng nào</h3>
          <p class="empty-text">Sử dụng khung tạo bài phía trên để đăng ảnh món ăn hoặc phản hồi khách hàng</p>
        </div>
      </div>
    </div>
  </div>

  <!-- EDIT MODAL -->
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="showEdit && editing" class="modal-overlay" @click.self="closeEdit">
        <div class="modal-container" @paste="onEditPaste">
          <div class="modal-header">
            <h3 class="modal-title">Chỉnh sửa bài đăng</h3>
            <button type="button" class="modal-close" @click="closeEdit">
              <i class="ri-close-line"></i>
            </button>
          </div>

          <div class="modal-body">
            <div class="modal-field">
              <label class="form-label">Phân loại bài đăng</label>
              <div class="type-selector">
                <button
                  v-for="t in POST_TYPES"
                  :key="'ed-' + t.key"
                  type="button"
                  class="type-pill"
                  :class="[t.tone, { active: editing.Post_type === t.key }]"
                  @click="editing.Post_type = t.key"
                >
                  <i :class="t.icon"></i>
                  <span>{{ t.label }}</span>
                </button>
              </div>
            </div>

            <div class="modal-field">
              <label class="form-label">Nội dung bài đăng</label>
              <FeedCaptionEditor
                v-model="editing.Content"
                in-modal
                placeholder="Nhập nội dung bài đăng..."
                @paste-images="onEditPasteImages"
              />
            </div>

            <div class="modal-field">
              <label class="form-label">Hình ảnh ({{ editing.mediaQueue.length }}/10)</label>
              <div v-if="editing.mediaQueue.length" class="media-queue-grid">
                <div
                  v-for="(m, idx) in editing.mediaQueue"
                  :key="m.id"
                  class="media-queue-item"
                >
                  <img :src="m.preview" alt="" />
                  <div class="media-item-controls">
                    <button
                      type="button"
                      class="mq-btn"
                      :disabled="idx === 0"
                      @click="moveQueueItem(editing.mediaQueue, idx, -1)"
                    >
                      <i class="ri-arrow-left-s-line"></i>
                    </button>
                    <button
                      type="button"
                      class="mq-btn"
                      :disabled="idx === editing.mediaQueue.length - 1"
                      @click="moveQueueItem(editing.mediaQueue, idx, 1)"
                    >
                      <i class="ri-arrow-right-s-line"></i>
                    </button>
                    <button
                      type="button"
                      class="mq-btn is-danger"
                      @click="removeQueueItem(editing.mediaQueue, idx)"
                    >
                      <i class="ri-close-line"></i>
                    </button>
                  </div>
                </div>
              </div>
              <label class="tool-upload-btn" style="margin-top: 8px;">
                <input type="file" accept="image/*" multiple hidden @change="onEditFiles" />
                <i class="ri-image-add-fill"></i>
                <span>Thêm ảnh hoặc dán Ctrl + V</span>
              </label>
            </div>

            <div class="modal-field">
              <label class="form-label">Món ăn gắn kèm</label>
              <div v-if="editing.Product_codes.length" class="sdb-chips" style="margin-bottom: 8px;">
                <div
                  v-for="code in editing.Product_codes"
                  :key="'ed-code-' + code"
                  class="dish-chip"
                >
                  <span>{{ productMap.get(code)?.Ten_hang || code }}</span>
                  <button type="button" @click="removeDishTag(editing.Product_codes, code)">
                    <i class="ri-close-line"></i>
                  </button>
                </div>
              </div>
              <input
                v-model="editDishSearch"
                type="text"
                class="form-input"
                placeholder="Tìm tên món để gắn thêm..."
              />
              <div v-if="editDishSearch.trim()" class="dd-list in-modal-list">
                <button
                  v-for="prod in editDishOptions"
                  :key="'ed-opt-' + prod.Ma_hang"
                  type="button"
                  class="dd-item"
                  @click="addDishTag(editing.Product_codes, prod.Ma_hang)"
                >
                  <img v-if="prod.Main_img" :src="prod.Main_img" alt="" />
                  <div class="dd-meta">
                    <strong>{{ prod.Ten_hang }}</strong>
                    <span>{{ formatDishPrice(prod) }}</span>
                  </div>
                  <i class="ri-add-circle-fill dd-add-ico"></i>
                </button>
              </div>
            </div>

            <div class="modal-seed-grid">
              <div>
                <label class="form-label">Lượt xem khởi điểm</label>
                <input v-model.number="editing.Base_views" type="number" min="0" class="form-input" />
              </div>
              <div>
                <label class="form-label">Lượt yêu thích khởi điểm</label>
                <input v-model.number="editing.Base_hearts" type="number" min="0" class="form-input" />
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="closeEdit">Hủy</button>
            <button
              type="button"
              class="btn btn-primary"
              :disabled="submitting"
              @click="saveEdit"
            >
              <span v-if="submitting" class="btn-loading">
                <span class="spinner"></span>
                <span>Đang lưu...</span>
              </span>
              <span v-else>Lưu thay đổi</span>
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

.admin-page {
  min-height: 100vh;
  background: rgb(15, 23, 42);
  padding: 24px;
  color: #e2e8f0;
}

.admin-toast {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 1200;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 11px 16px;
  border-radius: 12px;
  background: #059669;
  color: #ffffff;
  font-size: 13.5px;
  font-weight: 700;
  box-shadow: 0 10px 28px rgba(0, 0, 0, 0.35);
}

.admin-toast.error {
  background: #e11d48;
}

.page-header {
  margin-bottom: 24px;
}

.header-content {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.hero-admin-title {
  color: rgb(134, 239, 172);
  text-shadow: 0 0 10px rgba(34, 197, 94, 0.5);
  font-weight: 800;
  font-size: 26px;
  margin-bottom: 6px;
}

.page-subtitle {
  font-size: 14px;
  color: #cbd5e1;
  line-height: 1.5;
  max-width: 780px;
}

.header-actions-group {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.btn-outline-ad {
  padding: 10px 15px;
  border-radius: 10px;
  border: 1px solid rgba(96, 165, 250, 0.45);
  background: rgba(37, 99, 235, 0.16);
  color: #93c5fd;
  text-decoration: none;
  font-size: 13.5px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  transition: all 0.18s ease;
}

.btn-outline-ad:hover {
  background: #2563eb;
  border-color: #60a5fa;
  color: #ffffff;
}

.btn-outline-preview {
  padding: 10px 16px;
  border-radius: 10px;
  border: 1px solid rgba(74, 222, 128, 0.45);
  background: rgba(22, 163, 74, 0.14);
  color: #86efac;
  text-decoration: none;
  font-size: 13.5px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  transition: all 0.18s ease;
}

.btn-outline-preview:hover {
  background: #16a34a;
  color: #ffffff;
}

.card {
  background: rgba(30, 41, 59, 0.6);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(148, 163, 184, 0.12);
  border-radius: 16px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.22);
  margin-bottom: 24px;
}

.card-header {
  padding: 18px 24px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
}

.card-title {
  font-size: 17px;
  font-weight: 700;
  color: #ffffff;
  display: flex;
  align-items: center;
  gap: 8px;
}

.card-body {
  padding: 24px;
}

.type-selector {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.type-pill {
  padding: 7px 13px;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.25);
  background: rgba(15, 23, 42, 0.6);
  color: #cbd5e1;
  font-size: 12.5px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  transition: all 0.18s ease;
}

.type-pill.active.is-feedback {
  background: linear-gradient(135deg, #059669 0%, #0d9488 100%);
  border-color: #34d399;
  color: #ffffff;
}

.type-pill.active.is-kitchen {
  background: linear-gradient(135deg, #ea580c 0%, #d97706 100%);
  border-color: #fbbf24;
  color: #ffffff;
}

.type-pill.active.is-promo {
  background: linear-gradient(135deg, #2563eb 0%, #4f46e5 100%);
  border-color: #93c5fd;
  color: #ffffff;
}

.composer-box {
  background: rgba(15, 23, 42, 0.55);
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 14px;
  padding: 16px;
  margin-bottom: 18px;
}

.composer-textarea {
  width: 100%;
  background: transparent;
  border: none;
  outline: none;
  color: #f8fafc;
  font-size: 15px;
  line-height: 1.55;
  resize: vertical;
  font-family: inherit;
}

.composer-textarea.in-modal {
  background: rgba(15, 23, 42, 0.65);
  border: 1px solid rgba(148, 163, 184, 0.22);
  border-radius: 10px;
  padding: 12px;
}

.composer-textarea::placeholder {
  color: #94a3b8;
}

.media-queue-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(112px, 1fr));
  gap: 10px;
  margin-top: 12px;
}

.media-queue-item {
  position: relative;
  aspect-ratio: 1 / 1;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid rgba(148, 163, 184, 0.25);
  background: #0f172a;
}

.media-queue-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.cover-tag {
  position: absolute;
  top: 6px;
  left: 6px;
  padding: 2px 7px;
  border-radius: 6px;
  background: rgba(5, 150, 105, 0.92);
  color: #ffffff;
  font-size: 10px;
  font-weight: 800;
}

.media-item-controls {
  position: absolute;
  left: 4px;
  right: 4px;
  bottom: 4px;
  display: flex;
  justify-content: center;
  gap: 4px;
}

.mq-btn {
  width: 26px;
  height: 26px;
  border-radius: 7px;
  border: none;
  background: rgba(15, 23, 42, 0.85);
  color: #ffffff;
  font-size: 14px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.mq-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.mq-btn.is-danger {
  background: rgba(225, 29, 72, 0.9);
}

.selected-dishes-bar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px dashed rgba(148, 163, 184, 0.18);
}

.sdb-label {
  font-size: 12px;
  font-weight: 700;
  color: #86efac;
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.sdb-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.dish-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px 4px 5px;
  border-radius: 999px;
  background: rgba(30, 41, 59, 0.9);
  border: 1px solid rgba(74, 222, 128, 0.35);
  color: #f8fafc;
  font-size: 12px;
  font-weight: 600;
}

.dish-chip img {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  object-fit: cover;
}

.dish-chip button {
  border: none;
  background: transparent;
  color: #94a3b8;
  cursor: pointer;
  display: inline-flex;
  font-size: 14px;
}

.dish-chip button:hover {
  color: #fb7185;
}

.composer-toolbar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px solid rgba(148, 163, 184, 0.14);
}

.tool-upload-btn,
.tool-action-btn {
  height: 38px;
  padding: 0 14px;
  border-radius: 10px;
  border: 1px solid rgba(148, 163, 184, 0.25);
  background: rgba(30, 41, 59, 0.85);
  color: #f8fafc;
  font-size: 13px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  cursor: pointer;
  transition: all 0.16s ease;
}

.tool-upload-btn i {
  color: #4ade80;
  font-size: 16px;
}

.tool-action-btn i {
  color: #fbbf24;
  font-size: 16px;
}

.tool-upload-btn:hover,
.tool-action-btn:hover,
.tool-action-btn.active {
  border-color: #4ade80;
  background: rgba(51, 65, 85, 0.9);
}

.dish-picker-wrap {
  position: relative;
}

.dish-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  width: min(360px, 86vw);
  background: #1e293b;
  border: 1px solid rgba(148, 163, 184, 0.28);
  border-radius: 14px;
  box-shadow: 0 18px 42px rgba(0, 0, 0, 0.45);
  z-index: 40;
  overflow: hidden;
}

.dd-search {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.16);
}

.dd-search input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  color: #ffffff;
  font-size: 13px;
}

.dd-close {
  border: none;
  background: transparent;
  color: #94a3b8;
  font-size: 16px;
  cursor: pointer;
}

.dd-list {
  max-height: 250px;
  overflow-y: auto;
  padding: 6px;
}

.in-modal-list {
  margin-top: 6px;
  background: rgba(15, 23, 42, 0.7);
  border-radius: 10px;
  border: 1px solid rgba(148, 163, 184, 0.2);
}

.dd-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 7px 9px;
  border-radius: 9px;
  border: none;
  background: transparent;
  color: #f8fafc;
  text-align: left;
  cursor: pointer;
}

.dd-item:hover {
  background: rgba(51, 65, 85, 0.75);
}

.dd-item img {
  width: 34px;
  height: 34px;
  border-radius: 8px;
  object-fit: cover;
  flex-shrink: 0;
}

.dd-meta {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.dd-meta strong {
  font-size: 13px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dd-meta span {
  font-size: 11.5px;
  color: #4ade80;
}

.dd-add-ico {
  color: #4ade80;
  font-size: 18px;
}

.dd-empty {
  padding: 16px;
  text-align: center;
  font-size: 12.5px;
  color: #94a3b8;
}

.composer-options-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
  margin-bottom: 18px;
}

.form-label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 700;
  color: #cbd5e1;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  margin-bottom: 7px;
}

.form-input {
  width: 100%;
  padding: 10px 14px;
  border-radius: 10px;
  border: 1px solid rgba(148, 163, 184, 0.22);
  background: rgba(51, 65, 85, 0.5);
  color: #ffffff;
  font-size: 14px;
}

.toggle-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 14px;
  border-radius: 12px;
  background: rgba(51, 65, 85, 0.42);
  border: 1px solid rgba(148, 163, 184, 0.2);
  cursor: pointer;
}

.toggle-card.active {
  background: rgba(22, 163, 74, 0.16);
  border-color: rgba(74, 222, 128, 0.5);
}

.tc-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.tc-info > i {
  font-size: 19px;
  color: #4ade80;
}

.tc-info div {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.tc-info strong {
  font-size: 13.5px;
  color: #ffffff;
}

.tc-info span {
  font-size: 11.5px;
  color: #94a3b8;
}

.switch-pill {
  width: 46px;
  height: 25px;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.35);
  background: rgba(15, 23, 42, 0.7);
  padding: 2px;
  cursor: pointer;
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
}

.switch-pill.active {
  background: linear-gradient(135deg, #16a34a 0%, #22c55e 100%);
  border-color: #4ade80;
}

.switch-knob {
  width: 19px;
  height: 19px;
  border-radius: 50%;
  background: #ffffff;
  transition: transform 0.2s ease;
}

.switch-pill.active .switch-knob {
  transform: translateX(21px);
}

.btn {
  padding: 11px 22px;
  border-radius: 10px;
  border: none;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.2s ease;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background: linear-gradient(135deg, #16a34a 0%, #059669 100%);
  color: #ffffff;
  box-shadow: 0 4px 16px rgba(22, 163, 74, 0.32);
}

.btn-secondary {
  background: rgba(51, 65, 85, 0.7);
  color: #ffffff;
}

.btn-loading {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #ffffff;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* LIST */
.list-header-left {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.badge-pill {
  padding: 4px 11px;
  border-radius: 999px;
  background: rgba(34, 197, 94, 0.16);
  border: 1px solid rgba(74, 222, 128, 0.35);
  color: #86efac;
  font-size: 12px;
  font-weight: 700;
}

.reorder-hint-pill {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 10px;
  border-radius: 999px;
  background: rgba(245, 158, 11, 0.14);
  border: 1px solid rgba(251, 191, 36, 0.35);
  color: #fde047;
  font-size: 11.5px;
  font-weight: 600;
}

.list-filters {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.filter-tabs {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.ft-btn {
  padding: 6px 11px;
  border-radius: 8px;
  border: 1px solid rgba(148, 163, 184, 0.22);
  background: rgba(15, 23, 42, 0.55);
  color: #cbd5e1;
  font-size: 12px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  cursor: pointer;
}

.ft-btn.active {
  background: #059669;
  border-color: #34d399;
  color: #ffffff;
}

.search-mini {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 11px;
  border-radius: 9px;
  background: rgba(15, 23, 42, 0.65);
  border: 1px solid rgba(148, 163, 184, 0.22);
}

.search-mini input {
  background: transparent;
  border: none;
  outline: none;
  color: #ffffff;
  font-size: 12.5px;
  width: 150px;
}

.admin-feed-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.admin-post-row {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  padding: 16px;
  border-radius: 14px;
  background: rgba(15, 23, 42, 0.5);
  border: 1px solid rgba(148, 163, 184, 0.16);
}

.admin-post-row.is-pinned {
  border-color: rgba(251, 191, 36, 0.45);
  background: rgba(15, 23, 42, 0.68);
}

.admin-post-row.is-dragging {
  opacity: 0.45;
  border-style: dashed;
}

.admin-post-row.is-drag-over {
  border-color: #34d399;
  box-shadow: 0 0 0 2px rgba(52, 211, 153, 0.28);
}

.apr-pos-box {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 6px 2px 4px;
  border-radius: 8px;
  background: rgba(30, 41, 59, 0.9);
  border: 1px solid rgba(148, 163, 184, 0.28);
}

.apr-drag-ico {
  font-size: 14px;
  color: #94a3b8;
  cursor: grab;
}

.apr-pos-select {
  background: rgba(15, 23, 42, 0.85);
  color: #f8fafc;
  border: 1px solid rgba(148, 163, 184, 0.25);
  border-radius: 6px;
  padding: 2px 5px;
  font-size: 11.5px;
  font-weight: 800;
  cursor: pointer;
  outline: none;
}

.apr-pos-select:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.apr-move-btn {
  width: 22px;
  height: 22px;
  padding: 0;
  border-radius: 6px;
  border: 1px solid rgba(148, 163, 184, 0.24);
  background: rgba(51, 65, 85, 0.65);
  color: #e2e8f0;
  font-size: 14px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.15s ease;
}

.apr-move-btn:hover:not(:disabled) {
  background: #059669;
  border-color: #34d399;
  color: #ffffff;
}

.apr-move-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.admin-post-row.is-muted {
  opacity: 0.6;
}

.apr-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.apr-top-meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.apr-type-tag {
  padding: 3px 9px;
  border-radius: 999px;
  font-size: 11.5px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.apr-type-tag.is-feedback {
  background: rgba(16, 185, 129, 0.18);
  color: #6ee7b7;
}

.apr-type-tag.is-kitchen {
  background: rgba(245, 158, 11, 0.18);
  color: #fcd34d;
}

.apr-type-tag.is-promo {
  background: rgba(59, 130, 246, 0.2);
  color: #93c5fd;
}

.apr-pin-tag {
  padding: 3px 8px;
  border-radius: 999px;
  background: rgba(245, 158, 11, 0.22);
  color: #fde047;
  font-size: 11px;
  font-weight: 800;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.apr-time {
  font-size: 12px;
  color: #94a3b8;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.apr-caption {
  font-size: 14px;
  color: #f1f5f9;
  line-height: 1.55;
  word-break: break-word;
}

.apr-caption :deep(a) {
  color: #38bdf8;
  font-weight: 700;
  text-decoration: underline;
  text-underline-offset: 2px;
}

.apr-thumbs {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.apr-thumb-box {
  position: relative;
  width: 68px;
  height: 68px;
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid rgba(148, 163, 184, 0.24);
}

.apr-thumb-box img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.apr-more-count {
  position: absolute;
  inset: 0;
  background: rgba(15, 23, 42, 0.72);
  color: #ffffff;
  font-size: 13px;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
}

.apr-dishes {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.apr-dish-pill {
  padding: 3px 9px;
  border-radius: 999px;
  background: rgba(30, 41, 59, 0.9);
  border: 1px solid rgba(148, 163, 184, 0.24);
  color: #cbd5e1;
  font-size: 11.5px;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.apr-metrics {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 14px;
  font-size: 12.5px;
  color: #94a3b8;
}

.metric-item {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.metric-item strong {
  color: #f8fafc;
}

.metric-item.is-heart i {
  color: #fb7185;
}

.metric-item.is-yummy i {
  color: #fbbf24;
}

.metric-item.is-trust i {
  color: #34d399;
}

.apr-actions {
  display: flex;
  flex-direction: column;
  gap: 7px;
  flex-shrink: 0;
  min-width: 118px;
}

.apr-btn {
  padding: 7px 11px;
  border-radius: 9px;
  border: 1px solid rgba(148, 163, 184, 0.25);
  background: rgba(51, 65, 85, 0.55);
  color: #e2e8f0;
  font-size: 12px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  cursor: pointer;
}

.apr-btn.is-copy {
  background: rgba(13, 148, 136, 0.24);
  border-color: rgba(45, 212, 191, 0.45);
  color: #5eead4;
}

.apr-btn.is-pin-on {
  background: rgba(245, 158, 11, 0.22);
  border-color: #fbbf24;
  color: #fde047;
}

.apr-btn.is-vis-on {
  background: rgba(22, 163, 74, 0.22);
  border-color: #4ade80;
  color: #86efac;
}

.apr-btn.is-edit {
  background: #0284c7;
  border-color: #38bdf8;
  color: #ffffff;
}

.apr-btn.is-delete {
  background: rgba(225, 29, 72, 0.22);
  border-color: rgba(251, 113, 133, 0.45);
  color: #fda4af;
}

.table-loading,
.empty-state {
  text-align: center;
  padding: 52px 20px;
}

.table-loading-spinner {
  width: 40px;
  height: 40px;
  margin: 0 auto 12px;
  border: 3px solid rgba(52, 211, 153, 0.2);
  border-top-color: #34d399;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.empty-icon {
  font-size: 54px;
  color: #64748b;
  margin-bottom: 10px;
}

.empty-title {
  font-size: 17px;
  color: #ffffff;
  margin-bottom: 5px;
}

.empty-text {
  font-size: 13.5px;
  color: #94a3b8;
}

/* MODAL */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 18px;
  z-index: 1100;
}

.modal-container {
  width: 100%;
  max-width: 640px;
  max-height: 90vh;
  background: #1e293b;
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal-header {
  padding: 18px 22px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.12);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-title {
  font-size: 18px;
  font-weight: 700;
  color: #ffffff;
}

.modal-close {
  width: 34px;
  height: 34px;
  border-radius: 8px;
  border: none;
  background: rgba(51, 65, 85, 0.6);
  color: #e2e8f0;
  font-size: 18px;
  cursor: pointer;
}

.modal-body {
  padding: 20px 22px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.modal-seed-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.modal-footer {
  padding: 16px 22px;
  border-top: 1px solid rgba(148, 163, 184, 0.12);
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

@media (max-width: 768px) {
  .admin-page {
    padding: 14px;
  }

  .card-header,
  .card-body {
    padding: 16px;
  }

  .composer-options-grid,
  .modal-seed-grid {
    grid-template-columns: 1fr;
  }

  .admin-post-row {
    flex-direction: column;
  }

  .apr-actions {
    flex-direction: row;
    flex-wrap: wrap;
  }

  .apr-btn {
    flex: 1 1 calc(50% - 4px);
  }
}
</style>
