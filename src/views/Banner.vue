<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getOneSheet, dispatchAction } from '@/config/api'
import { uploadImageToCloudinary } from '@/utils/imageUpload.js'
import {
  BANNER_CLICK_ACTIONS,
  BANNER_PLACEMENTS,
  VERTICAL_BANNER_TARGETS,
  isBannerActive,
  normalizeBannerPlacement,
  normalizeVerticalBannerTarget,
  normalizeBannerAction,
  normalizeBannerLink,
  isValidBannerLink,
  formatBannerLinkShort,
  openBannerLinkInNewTab,
} from '@/utils/bannerLink'

const route = useRoute()
const router = useRouter()

/* ======================
   STATE
====================== */
const allBanners = ref([])
const activePlacement = ref(
  route.query.tab === 'vertical' ? BANNER_PLACEMENTS.FEED_VERTICAL : BANNER_PLACEMENTS.HOME,
)
const statusFilter = ref('all') // 'all' | 'active' | 'hidden'

const file = ref(null)
const fileInput = ref(null)
const previewUrl = ref('')
const bannerTitle = ref('')
const bannerTargetPages = ref(VERTICAL_BANNER_TARGETS.BOTH)
const bannerInitOrder = ref(1)
const bannerInitActive = ref(true)
const bannerClickAction = ref(
  activePlacement.value === BANNER_PLACEMENTS.FEED_VERTICAL
    ? BANNER_CLICK_ACTIONS.LINK
    : BANNER_CLICK_ACTIONS.POPUP,
)
const bannerLinkUrl = ref('')
const addLinkError = ref('')

const editingBanner = ref(null)
const loading = ref(false)
const tableLoading = ref(true)
const togglingId = ref('')
const showEditBannerModal = ref(false)
const editBannerFile = ref(null)
const editBannerPreview = ref('')
const editBannerTitle = ref('')
const originalEditTitle = ref('')
const editBannerTargetPages = ref(VERTICAL_BANNER_TARGETS.BOTH)
const originalEditTargetPages = ref(VERTICAL_BANNER_TARGETS.BOTH)
const editBannerOrder = ref(1)
const originalEditOrder = ref(1)
const editBannerActive = ref(true)
const originalEditActive = ref(true)
const editBannerAction = ref(BANNER_CLICK_ACTIONS.POPUP)
const editBannerLink = ref('')
const originalEditAction = ref(BANNER_CLICK_ACTIONS.POPUP)
const originalEditLink = ref('')
const editLinkError = ref('')

const isMobile = ref(typeof window !== 'undefined' ? window.innerWidth <= 768 : false)
const dragIndex = ref(-1)
const dragOverIndex = ref(-1)
const reordering = ref(false)

const isVerticalMode = computed(() => activePlacement.value === BANNER_PLACEMENTS.FEED_VERTICAL)

function clearStorefrontCache() {
  try {
    localStorage.removeItem('MENU_CACHE_SA_UNIFIED')
  } catch {
    // ignore storage errors
  }
}

function parseBannerOrder(item) {
  const n = Number(item?.Thu_tu)
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : Number.MAX_SAFE_INTEGER
}

function sortBanners(list) {
  return [...(list || [])].sort((a, b) => {
    const orderDiff = parseBannerOrder(a) - parseBannerOrder(b)
    if (orderDiff !== 0) return orderDiff
    return String(b.ID).localeCompare(String(a.ID))
  })
}

const homeBanners = computed(() =>
  sortBanners(
    allBanners.value.filter(
      (b) => normalizeBannerPlacement(b?.Placement) === BANNER_PLACEMENTS.HOME,
    ),
  ),
)

const verticalBanners = computed(() =>
  sortBanners(
    allBanners.value.filter(
      (b) => normalizeBannerPlacement(b?.Placement) === BANNER_PLACEMENTS.FEED_VERTICAL,
    ),
  ),
)

const banners = computed(() => (isVerticalMode.value ? verticalBanners.value : homeBanners.value))

const homeActiveCount = computed(() => homeBanners.value.filter((b) => isBannerActive(b)).length)
const verticalActiveCount = computed(
  () => verticalBanners.value.filter((b) => isBannerActive(b)).length,
)

const activeCount = computed(() => banners.value.filter((b) => isBannerActive(b)).length)
const hiddenCount = computed(() => Math.max(0, banners.value.length - activeCount.value))

// Map banner ID -> real index in current placement list + live slide # on storefront/sidebar
const bannerIndexMeta = computed(() => {
  const map = new Map()
  let liveSlideCounter = 0
  banners.value.forEach((b, idx) => {
    const active = isBannerActive(b)
    if (active) liveSlideCounter += 1
    map.set(b.ID, {
      realIndex: idx,
      position: idx + 1,
      active,
      liveSlide: active ? liveSlideCounter : 0,
    })
  })
  return map
})

const filteredBanners = computed(() => {
  if (statusFilter.value === 'active') {
    return banners.value.filter((b) => isBannerActive(b))
  }
  if (statusFilter.value === 'hidden') {
    return banners.value.filter((b) => !isBannerActive(b))
  }
  return banners.value
})

const canDragReorder = computed(
  () =>
    !isMobile.value &&
    !reordering.value &&
    statusFilter.value === 'all' &&
    banners.value.length > 1,
)

const addPositionOptions = computed(() => {
  const totalNext = banners.value.length + 1
  const list = []
  for (let p = 1; p <= totalNext; p += 1) {
    let suffix = ''
    if (p === 1) suffix = ' (Hiển thị đầu tiên)'
    else if (p === totalNext) suffix = ' (Cuối danh sách)'
    list.push({ value: p, label: `#${p}${suffix}` })
  }
  return list
})

const hasEditChanges = computed(() => {
  if (!editingBanner.value) return false
  const trimmedLink = String(editBannerLink.value || '').trim()
  const normalizedLink = trimmedLink ? normalizeBannerLink(trimmedLink) || trimmedLink : ''
  const trimmedTitle = String(editBannerTitle.value || '').trim()
  return (
    Boolean(editBannerFile.value) ||
    trimmedTitle !== originalEditTitle.value ||
    editBannerTargetPages.value !== originalEditTargetPages.value ||
    editBannerOrder.value !== originalEditOrder.value ||
    editBannerActive.value !== originalEditActive.value ||
    editBannerAction.value !== originalEditAction.value ||
    normalizedLink !== originalEditLink.value
  )
})

function formatVerticalTargetLabel(b) {
  const t = normalizeVerticalBannerTarget(b?.Target_pages)
  if (t === VERTICAL_BANNER_TARGETS.ORDER) return 'Chỉ Trang Order PC'
  if (t === VERTICAL_BANNER_TARGETS.FEED) return 'Chỉ Bảng tin'
  return 'Trang Order + Bảng tin'
}

function switchPlacementTab(nextPlacement) {
  if (activePlacement.value === nextPlacement) return
  activePlacement.value = nextPlacement
  statusFilter.value = 'all'
  resetForm()
  const query = nextPlacement === BANNER_PLACEMENTS.FEED_VERTICAL ? { tab: 'vertical' } : {}
  router.replace({ path: route.path, query })
}

watch(
  () => route.query.tab,
  (tabVal) => {
    const target =
      tabVal === 'vertical' ? BANNER_PLACEMENTS.FEED_VERTICAL : BANNER_PLACEMENTS.HOME
    if (activePlacement.value !== target) {
      activePlacement.value = target
      statusFilter.value = 'all'
      resetForm()
    }
  },
)

function validateBannerLinkConfig(action, rawLink) {
  const normalizedAction = normalizeBannerAction(action)
  const trimmed = String(rawLink || '').trim()

  if (normalizedAction === BANNER_CLICK_ACTIONS.LINK) {
    if (!trimmed) {
      return {
        ok: false,
        error: 'Vui lòng nhập đường dẫn khi chọn chế độ Mở link',
        url: '',
      }
    }
    if (!isValidBannerLink(trimmed)) {
      return {
        ok: false,
        error: 'Đường dẫn chưa hợp lệ (VD: https://t.me/... hoặc https://sakitchen.shop)',
        url: '',
      }
    }
    return { ok: true, error: '', url: normalizeBannerLink(trimmed) }
  }

  if (!trimmed) {
    return { ok: true, error: '', url: '' }
  }
  if (!isValidBannerLink(trimmed)) {
    return {
      ok: false,
      error: 'Đường dẫn kèm theo chưa hợp lệ (để trống nếu không cần gắn link)',
      url: '',
    }
  }
  return { ok: true, error: '', url: normalizeBannerLink(trimmed) }
}

function getBannerAction(b) {
  return normalizeBannerAction(b?.Click_action)
}

function getBannerLink(b) {
  return normalizeBannerLink(b?.Link_url)
}

function getRealIndex(b) {
  return bannerIndexMeta.value.get(b?.ID)?.realIndex ?? 0
}

function getLiveSlideNumber(b) {
  return bannerIndexMeta.value.get(b?.ID)?.liveSlide ?? 0
}

function testBannerLink(raw) {
  if (!isValidBannerLink(raw)) return
  openBannerLinkInNewTab(raw)
}

function updateIsMobile() {
  if (typeof window !== 'undefined') {
    isMobile.value = window.innerWidth <= 768
  }
}

/* ======================
   HELPERS
====================== */
function genBannerId() {
  const d = new Date()
  const p = (n) => String(n).padStart(2, '0')
  const prefix = isVerticalMode.value ? 'BNV_' : 'BN_'
  return (
    prefix +
    d.getFullYear() +
    p(d.getMonth() + 1) +
    p(d.getDate()) +
    '_' +
    p(d.getHours()) +
    p(d.getMinutes()) +
    p(d.getSeconds())
  )
}

async function uploadBannerImage(f, placement = activePlacement.value) {
  if (placement === BANNER_PLACEMENTS.FEED_VERTICAL) {
    return uploadImageToCloudinary(f, {
      targetKB: 140,
      maxWidth: 1000,
      maxHeight: 1600,
      folder: 'sakitchen/banner-vertical',
    })
  }
  return uploadImageToCloudinary(f, {
    targetKB: 100,
    maxWidth: 1600,
    maxHeight: 1000,
    folder: 'sakitchen/banner',
  })
}

function onSelectFile(e) {
  const f = e.target.files?.[0]
  if (!f) return
  if (!f.type.startsWith('image/')) {
    alert('Vui lòng chọn file ảnh')
    return
  }

  file.value = f
  previewUrl.value = URL.createObjectURL(f)
}

/* ======================
   LOAD DATA
====================== */
async function loadBanners() {
  tableLoading.value = true
  try {
    const json = await getOneSheet('banner')
    allBanners.value = Array.isArray(json?.data) ? json.data : []
    if (bannerInitOrder.value > banners.value.length + 1) {
      bannerInitOrder.value = 1
    }
  } finally {
    tableLoading.value = false
  }
}

/* ======================
   REORDER (BUTTONS, SELECT & DRAG-AND-DROP)
====================== */
async function commitReorderFromIndexToIndex(fromIndex, targetIndex) {
  if (reordering.value) return
  const currentGroup = [...banners.value]
  if (
    fromIndex < 0 ||
    targetIndex < 0 ||
    fromIndex === targetIndex ||
    fromIndex >= currentGroup.length ||
    targetIndex >= currentGroup.length
  ) {
    return
  }

  const prevSnapshot = [...allBanners.value]
  const [moved] = currentGroup.splice(fromIndex, 1)
  currentGroup.splice(targetIndex, 0, moved)
  const renumberedGroup = currentGroup.map((item, idx) => ({ ...item, Thu_tu: idx + 1 }))
  const renumberedMap = new Map(renumberedGroup.map((it) => [it.ID, it]))

  allBanners.value = allBanners.value.map((item) => renumberedMap.get(item.ID) || item)

  reordering.value = true
  try {
    const res = await dispatchAction({
      action: 'reorderBanners',
      placement: activePlacement.value,
      ids: renumberedGroup.map((item) => item.ID),
    })
    if (!res?.success) throw new Error(res?.message || 'Lỗi sắp xếp banner')
    clearStorefrontCache()
  } catch (e) {
    console.error(e)
    allBanners.value = prevSnapshot
    alert('Lỗi cập nhật thứ tự banner')
    await loadBanners()
  } finally {
    reordering.value = false
  }
}

async function moveBannerByDelta(banner, delta) {
  const fromIdx = getRealIndex(banner)
  const targetIdx = fromIdx + delta
  await commitReorderFromIndexToIndex(fromIdx, targetIdx)
}

async function jumpBannerToPosition(banner, nextPosRaw) {
  const fromIdx = getRealIndex(banner)
  const parsed = Math.floor(Number(nextPosRaw))
  if (!Number.isFinite(parsed)) return
  const targetIdx = Math.min(Math.max(parsed - 1, 0), banners.value.length - 1)
  await commitReorderFromIndexToIndex(fromIdx, targetIdx)
}

function onDragStartBanner(index, event) {
  if (!canDragReorder.value) {
    event?.preventDefault?.()
    return
  }
  dragIndex.value = index
  dragOverIndex.value = index
  if (event?.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', String(index))
  }
}

function onDragOverBanner(index, event) {
  if (!canDragReorder.value || dragIndex.value < 0) return
  event?.preventDefault?.()
  if (event?.dataTransfer) {
    event.dataTransfer.dropEffect = 'move'
  }
  dragOverIndex.value = index
}

async function onDropBanner(targetIndex) {
  if (!canDragReorder.value) return
  const fromIndex = dragIndex.value
  dragIndex.value = -1
  dragOverIndex.value = -1
  await commitReorderFromIndexToIndex(fromIndex, targetIndex)
}

function onDragEndBanner() {
  dragIndex.value = -1
  dragOverIndex.value = -1
}

/* ======================
   VISIBILITY TOGGLE (ẨN / HIỆN)
====================== */
async function toggleBannerVisibility(banner) {
  if (!banner?.ID || togglingId.value || reordering.value) return
  const prevActive = isBannerActive(banner)
  const nextActive = !prevActive

  allBanners.value = allBanners.value.map((item) =>
    item.ID === banner.ID ? { ...item, Active: nextActive } : item,
  )
  togglingId.value = banner.ID

  try {
    const res = await dispatchAction({
      action: 'updateBanner',
      data: {
        ID: banner.ID,
        Active: nextActive,
      },
    })
    if (!res?.success) throw new Error('Lỗi đổi trạng thái banner')
    clearStorefrontCache()
  } catch (e) {
    console.error(e)
    allBanners.value = allBanners.value.map((item) =>
      item.ID === banner.ID ? { ...item, Active: prevActive } : item,
    )
    alert('Lỗi cập nhật trạng thái ẩn/hiện banner')
  } finally {
    togglingId.value = ''
  }
}

/* ======================
   ADD
====================== */
async function addBanner() {
  if (!file.value || !previewUrl.value) {
    alert('Chưa chọn ảnh')
    return
  }

  const check = validateBannerLinkConfig(bannerClickAction.value, bannerLinkUrl.value)
  addLinkError.value = check.error
  if (!check.ok) {
    return
  }

  loading.value = true
  try {
    const imgUrl = await uploadBannerImage(file.value, activePlacement.value)

    const res = await dispatchAction({
      action: 'addBanner',
      data: {
        ID: genBannerId(),
        URL: imgUrl,
        Title: bannerTitle.value.trim(),
        Placement: activePlacement.value,
        Target_pages: normalizeVerticalBannerTarget(bannerTargetPages.value),
        Thu_tu: Number(bannerInitOrder.value) || 1,
        Active: Boolean(bannerInitActive.value),
        Click_action: normalizeBannerAction(bannerClickAction.value),
        Link_url: check.url,
      },
    })
    if (!res?.success) throw new Error('Lỗi thêm banner')

    clearStorefrontCache()
    resetForm()
    await loadBanners()
  } catch (e) {
    console.error(e)
    alert('Lỗi thêm banner')
    loading.value = false
  }
}

function onSelectEditFile(e) {
  const f = e.target.files?.[0]
  if (!f) return
  if (!f.type.startsWith('image/')) {
    alert('Vui lòng chọn file ảnh')
    return
  }

  editBannerFile.value = f
  editBannerPreview.value = URL.createObjectURL(f)
}

/* ======================
   EDIT
====================== */
function startEdit(banner) {
  const realIdx = getRealIndex(banner)
  editingBanner.value = banner
  editBannerFile.value = null
  editBannerPreview.value = banner.URL
  const titleStr = String(banner.Title || '').trim()
  editBannerTitle.value = titleStr
  originalEditTitle.value = titleStr
  const targetPages = normalizeVerticalBannerTarget(banner.Target_pages)
  editBannerTargetPages.value = targetPages
  originalEditTargetPages.value = targetPages
  const pos = realIdx >= 0 ? realIdx + 1 : 1
  editBannerOrder.value = pos
  originalEditOrder.value = pos
  const active = isBannerActive(banner)
  editBannerActive.value = active
  originalEditActive.value = active
  const action = normalizeBannerAction(banner.Click_action)
  const link = normalizeBannerLink(banner.Link_url)
  editBannerAction.value = action
  originalEditAction.value = action
  editBannerLink.value = link
  originalEditLink.value = link
  editLinkError.value = ''
  showEditBannerModal.value = true
}

async function saveEdit() {
  if (!hasEditChanges.value) {
    alert('Chưa có thay đổi nào để lưu')
    return
  }

  const check = validateBannerLinkConfig(editBannerAction.value, editBannerLink.value)
  editLinkError.value = check.error
  if (!check.ok) {
    return
  }

  loading.value = true
  try {
    const targetPlacement = normalizeBannerPlacement(editingBanner.value.Placement)
    const imgUrl = editBannerFile.value
      ? await uploadBannerImage(editBannerFile.value, targetPlacement)
      : editingBanner.value.URL

    const res = await dispatchAction({
      action: 'updateBanner',
      data: {
        ID: editingBanner.value.ID,
        URL: imgUrl,
        Title: editBannerTitle.value.trim(),
        Placement: targetPlacement,
        Target_pages: normalizeVerticalBannerTarget(editBannerTargetPages.value),
        Thu_tu: editBannerOrder.value,
        Active: Boolean(editBannerActive.value),
        Click_action: normalizeBannerAction(editBannerAction.value),
        Link_url: check.url,
      },
    })
    if (!res?.success) throw new Error('Lỗi cập nhật banner')

    clearStorefrontCache()
    closeEditBannerModal()
    await loadBanners()
  } catch (e) {
    console.error(e)
    alert('Lỗi cập nhật banner')
    loading.value = false
  }
}

function closeEditBannerModal() {
  showEditBannerModal.value = false
  editingBanner.value = null
  editBannerFile.value = null
  editBannerPreview.value = ''
  editBannerTitle.value = ''
  originalEditTitle.value = ''
  editBannerTargetPages.value = VERTICAL_BANNER_TARGETS.BOTH
  originalEditTargetPages.value = VERTICAL_BANNER_TARGETS.BOTH
  editBannerOrder.value = 1
  originalEditOrder.value = 1
  editBannerActive.value = true
  originalEditActive.value = true
  editBannerAction.value = BANNER_CLICK_ACTIONS.POPUP
  originalEditAction.value = BANNER_CLICK_ACTIONS.POPUP
  editBannerLink.value = ''
  originalEditLink.value = ''
  editLinkError.value = ''
  loading.value = false
}

/* ======================
   DELETE
====================== */
async function deleteBanner(id) {
  if (!confirm('Xóa banner này?')) return

  try {
    const res = await dispatchAction({
      action: 'deleteBanner',
      ID: id,
    })
    if (!res?.success) throw new Error('Lỗi xóa banner')
    clearStorefrontCache()
    await loadBanners()
  } catch (e) {
    console.error(e)
    alert('Lỗi xóa banner')
  }
}

/* ======================
   RESET
====================== */
function resetForm() {
  editingBanner.value = null
  file.value = null
  previewUrl.value = ''
  bannerTitle.value = ''
  bannerTargetPages.value = VERTICAL_BANNER_TARGETS.BOTH
  bannerInitOrder.value = 1
  bannerInitActive.value = true
  bannerClickAction.value = isVerticalMode.value
    ? BANNER_CLICK_ACTIONS.LINK
    : BANNER_CLICK_ACTIONS.POPUP
  bannerLinkUrl.value = ''
  addLinkError.value = ''
  if (fileInput.value) fileInput.value.value = ''
  loading.value = false
}

/* ======================
   INIT
====================== */
onMounted(async () => {
  updateIsMobile()
  window.addEventListener('resize', updateIsMobile)
  await loadBanners()
})

onUnmounted(() => {
  window.removeEventListener('resize', updateIsMobile)
})
</script>

<template>
  <div class="admin-page">
    <!-- HEADER -->
    <div class="page-header">
      <div class="header-content">
        <div>
          <h1
            style="
              color: rgb(134, 239, 172);
              text-shadow: 0 0 10px rgba(34, 197, 94, 0.5);
              font-weight: bold;
            "
          >
            QUẢN LÝ BANNER WEB
          </h1>
          <p class="page-subtitle">
            Quản lý Banner ngang đầu trang và Banner quảng cáo dọc ở Sidebar bên trái (Trang Order
            PC &amp; Bảng tin) · Sắp xếp vị trí và bật/tắt ẩn hiện
          </p>
        </div>

        <div v-if="isVerticalMode" class="header-preview-links">
          <RouterLink to="/" target="_blank" class="btn-preview-feed">
            <i class="ri-store-2-line"></i>
            <span>Xem Trang Order</span>
          </RouterLink>
          <RouterLink to="/bang-tin" target="_blank" class="btn-preview-feed">
            <i class="ri-external-link-line"></i>
            <span>Xem Bảng tin</span>
          </RouterLink>
        </div>
      </div>

      <!-- PLACEMENT MODE TABS -->
      <div class="placement-tabs" role="tablist">
        <button
          type="button"
          class="placement-tab-btn"
          :class="{ active: !isVerticalMode }"
          @click="switchPlacementTab(BANNER_PLACEMENTS.HOME)"
        >
          <i class="ri-panorama-line"></i>
          <div class="ptb-text">
            <strong>Banner Trang chủ (Ngang 16:10)</strong>
            <span>Vòng xoay đầu trang đặt món</span>
          </div>
          <span class="ptb-count">{{ homeActiveCount }}/{{ homeBanners.length }}</span>
        </button>

        <button
          type="button"
          class="placement-tab-btn is-vertical"
          :class="{ active: isVerticalMode }"
          @click="switchPlacementTab(BANNER_PLACEMENTS.FEED_VERTICAL)"
        >
          <i class="ri-advertisement-line"></i>
          <div class="ptb-text">
            <strong>Banner Quảng cáo dọc (Order &amp; Bảng tin)</strong>
            <span>Sidebar bên trái dưới Hệ sinh thái &amp; Đối tác</span>
          </div>
          <span class="ptb-count">{{ verticalActiveCount }}/{{ verticalBanners.length }}</span>
        </button>
      </div>
    </div>

    <!-- UPLOAD SECTION -->
    <div class="card upload-card">
      <div class="card-header">
        <h3 class="card-title">
          <i :class="isVerticalMode ? 'ri-advertisement-fill' : 'ri-image-add-line'"></i>
          <span>
            {{
              isVerticalMode
                ? 'Tải lên Banner Quảng cáo dọc mới (Sidebar trái)'
                : 'Tải lên Banner Trang chủ mới'
            }}
          </span>
        </h3>
      </div>
      <div class="card-body">
        <div class="upload-area">
          <label class="file-upload-label">
            <input
              ref="fileInput"
              type="file"
              accept="image/*"
              @change="onSelectFile"
              class="file-input-hidden"
            />
            <div class="file-upload-content">
              <div class="upload-icon"><i class="ri-image-add-fill" style="color: white"></i></div>
              <div class="upload-text">
                <span class="upload-primary">
                  {{ isVerticalMode ? 'Chọn ảnh banner dọc' : 'Chọn ảnh banner ngang' }}
                </span>
                <span v-if="isVerticalMode" class="upload-secondary">
                  Kích thước chuẩn: <strong>800 × 1200 px</strong> hoặc
                  <strong>720 × 1280 px</strong> (tỉ lệ dọc 2:3 hoặc 9:16) · PNG, JPG, WebP · Tự nén
                  ≤ 140KB
                </span>
                <span v-else class="upload-secondary">
                  Kích thước chuẩn: <strong>1600 × 1000 px</strong> (tỉ lệ ngang 16:10) · PNG, JPG,
                  WebP · Tự nén ≤ 100KB
                </span>
              </div>
            </div>
          </label>

          <div v-if="previewUrl" class="preview-section">
            <div class="preview-label">Xem trước</div>
            <div class="preview-container">
              <img
                :src="previewUrl"
                alt="Preview"
                class="preview-image"
                :class="{ 'is-vertical-preview': isVerticalMode }"
              />
            </div>
          </div>

          <!-- OPTIONAL CAPTION & TARGET PAGES FOR VERTICAL AD BANNER -->
          <div v-if="isVerticalMode" class="add-placement-grid">
            <div class="placement-field">
              <label class="behavior-label" for="add-banner-title-input">
                Tiêu đề / Nhãn ngắn dưới banner (không bắt buộc)
              </label>
              <input
                id="add-banner-title-input"
                v-model="bannerTitle"
                type="text"
                maxlength="80"
                placeholder="VD: Ưu đãi đối tác độc quyền · Đặt tiệc giảm 10%"
                class="title-text-input"
              />
            </div>

            <div class="placement-field">
              <label class="behavior-label" for="add-banner-target-select">
                Nơi hiển thị Banner dọc
              </label>
              <select
                id="add-banner-target-select"
                v-model="bannerTargetPages"
                class="modal-order-select"
              >
                <option :value="VERTICAL_BANNER_TARGETS.BOTH">
                  Cả Trang Order PC &amp; Bảng tin (Mặc định)
                </option>
                <option :value="VERTICAL_BANNER_TARGETS.ORDER">Chỉ Trang Order PC</option>
                <option :value="VERTICAL_BANNER_TARGETS.FEED">Chỉ Trang Bảng tin</option>
              </select>
            </div>
          </div>

          <!-- POSITION & VISIBILITY ON ADD -->
          <div class="add-placement-grid">
            <div class="placement-field">
              <label class="behavior-label" for="add-banner-order-select">
                Vị trí hiển thị ưu tiên
              </label>
              <select
                id="add-banner-order-select"
                v-model.number="bannerInitOrder"
                class="modal-order-select"
              >
                <option v-for="opt in addPositionOptions" :key="opt.value" :value="opt.value">
                  {{ opt.label }}
                </option>
              </select>
            </div>

            <div class="placement-field">
              <span class="behavior-label">Trạng thái sau khi tải lên</span>
              <div
                class="visibility-toggle-card"
                :class="{ active: bannerInitActive }"
                @click="bannerInitActive = !bannerInitActive"
              >
                <div class="vtc-info">
                  <div class="vtc-title">
                    <i :class="bannerInitActive ? 'ri-eye-fill' : 'ri-eye-off-line'"></i>
                    <span>
                      {{
                        bannerInitActive
                          ? isVerticalMode
                            ? 'Đang hiện ở Sidebar trái Bảng tin'
                            : 'Đang hiện trên trang Order'
                          : 'Tạm ẩn (lưu sẵn chưa hiển thị)'
                      }}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  class="switch-pill"
                  :class="{ active: bannerInitActive }"
                  :aria-pressed="bannerInitActive"
                  @click.stop="bannerInitActive = !bannerInitActive"
                >
                  <span class="switch-knob"></span>
                </button>
              </div>
            </div>
          </div>

          <!-- CLICK BEHAVIOR & LINK CONFIG -->
          <div class="banner-behavior-box">
            <div class="behavior-field">
              <label class="behavior-label">Hành động khi khách bấm vào banner</label>
              <div class="behavior-segment" role="radiogroup" aria-label="Hành động khi bấm banner">
                <button
                  type="button"
                  class="segment-btn"
                  :class="{ active: bannerClickAction === BANNER_CLICK_ACTIONS.POPUP }"
                  @click="bannerClickAction = BANNER_CLICK_ACTIONS.POPUP; addLinkError = ''"
                >
                  <i class="ri-image-2-line"></i>
                  <span>Mở popup ảnh</span>
                </button>
                <button
                  type="button"
                  class="segment-btn is-link-mode"
                  :class="{ active: bannerClickAction === BANNER_CLICK_ACTIONS.LINK }"
                  @click="bannerClickAction = BANNER_CLICK_ACTIONS.LINK; addLinkError = ''"
                >
                  <i class="ri-external-link-line"></i>
                  <span>Mở link (tab mới)</span>
                </button>
              </div>
            </div>

            <div class="behavior-field">
              <label class="behavior-label" for="add-banner-link-input">
                {{
                  bannerClickAction === BANNER_CLICK_ACTIONS.LINK
                    ? 'Đường dẫn mở khi bấm *'
                    : 'Đường dẫn gắn kèm (không bắt buộc)'
                }}
              </label>
              <div class="link-input-row">
                <div class="link-input-wrap" :class="{ 'has-error': Boolean(addLinkError) }">
                  <i class="ri-link link-input-icon"></i>
                  <input
                    id="add-banner-link-input"
                    v-model="bannerLinkUrl"
                    type="url"
                    placeholder="VD: https://t.me/sakitchen hoặc https://..."
                    class="link-input"
                    @input="addLinkError = ''"
                  />
                  <button
                    v-if="bannerLinkUrl"
                    type="button"
                    class="link-clear-btn"
                    title="Xóa link"
                    @click="bannerLinkUrl = ''; addLinkError = ''"
                  >
                    <i class="ri-close-line"></i>
                  </button>
                </div>
                <button
                  type="button"
                  class="btn-test-link"
                  :disabled="!isValidBannerLink(bannerLinkUrl)"
                  title="Mở thử đường dẫn ở tab mới"
                  @click="testBannerLink(bannerLinkUrl)"
                >
                  <i class="ri-external-link-line"></i>
                  <span>Mở thử</span>
                </button>
              </div>
              <p v-if="addLinkError" class="behavior-error">
                <i class="ri-error-warning-line"></i>
                <span>{{ addLinkError }}</span>
              </p>
              <p v-else class="behavior-hint">
                {{
                  bannerClickAction === BANNER_CLICK_ACTIONS.LINK
                    ? 'Khi khách bấm vào banner, đường dẫn này sẽ tự động mở ở tab mới.'
                    : 'Nếu có nhập link, popup phóng to ảnh sẽ hiển thị thêm nút "Mở liên kết" ở bên dưới.'
                }}
              </p>
            </div>
          </div>

          <div class="action-buttons">
            <button @click="addBanner" :disabled="loading || !previewUrl" class="btn btn-primary">
              <span v-if="loading" class="btn-loading">
                <span class="spinner"></span>
                Đang tải lên...
              </span>
              <span v-else class="btn-inline-content">
                <i class="ri-upload-cloud-2-line"></i>
                <span>{{ isVerticalMode ? 'THÊM BANNER DỌC' : 'THÊM BANNER' }}</span>
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- BANNER LIST -->
    <div class="card list-card">
      <div class="card-header list-header-wrap">
        <div>
          <h3 class="card-title">
            <i :class="isVerticalMode ? 'ri-layout-left-2-line' : 'ri-layout-grid-fill'"></i>
            <span>
              {{
                isVerticalMode
                  ? 'Danh sách Banner Quảng cáo dọc (Bảng tin)'
                  : 'Danh sách Banner Trang chủ'
              }}
            </span>
          </h3>
          <p v-if="banners.length > 1" class="drag-hint">
            {{
              statusFilter !== 'all'
                ? 'Chuyển về bộ lọc "Tất cả" để kéo thả hàng; bạn vẫn có thể chọn nhanh vị trí # hoặc bật/tắt ẩn hiện ngay bên dưới'
                : isMobile
                  ? 'Dùng nút Lên/Xuống hoặc chọn số # để đổi thứ tự hiển thị ngay lập tức'
                  : 'Kéo thả hàng, bấm mũi tên Lên/Xuống hoặc chọn trực tiếp số # để đổi thứ tự ưu tiên'
            }}
          </p>
        </div>

        <div class="list-header-right">
          <div v-if="banners.length && activeCount > 0" class="status-summary-pill is-active">
            <i class="ri-checkbox-circle-fill"></i>
            <span>Đang hiển thị: {{ activeCount }}/{{ banners.length }}</span>
          </div>
          <div v-else-if="banners.length" class="status-summary-pill is-muted">
            <i class="ri-eye-off-line"></i>
            <span>Đang ẩn tất cả</span>
          </div>

          <div v-if="banners.length > 0" class="filter-pills" role="tablist">
            <button
              type="button"
              class="filter-pill-btn"
              :class="{ active: statusFilter === 'all' }"
              @click="statusFilter = 'all'"
            >
              Tất cả ({{ banners.length }})
            </button>
            <button
              type="button"
              class="filter-pill-btn"
              :class="{ active: statusFilter === 'active' }"
              @click="statusFilter = 'active'"
            >
              Đang hiện ({{ activeCount }})
            </button>
            <button
              type="button"
              class="filter-pill-btn"
              :class="{ active: statusFilter === 'hidden' }"
              @click="statusFilter = 'hidden'"
            >
              Đang ẩn ({{ hiddenCount }})
            </button>
          </div>
        </div>
      </div>

      <!-- TABLE LOADING -->
      <div v-if="tableLoading" class="card-body">
        <div class="table-loading">
          <div class="table-loading-spinner"></div>
          <div class="table-loading-text">Đang tải danh sách banner...</div>
        </div>
      </div>

      <!-- TABLE CONTENT -->
      <div v-else-if="filteredBanners.length" class="card-body no-padding">
        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th class="th-index">Vị trí ưu tiên</th>
                <th class="th-image">Hình ảnh Banner</th>
                <th class="th-behavior">Khi bấm vào</th>
                <th class="th-status">Trạng thái</th>
                <th class="th-action">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="b in filteredBanners"
                :key="b.ID"
                class="table-row"
                :class="{
                  'is-draggable': canDragReorder,
                  'is-dragging': dragIndex === getRealIndex(b),
                  'is-drag-over':
                    dragOverIndex === getRealIndex(b) && dragIndex !== getRealIndex(b),
                  'is-row-active': isBannerActive(b),
                  'is-row-hidden': !isBannerActive(b),
                }"
                :draggable="canDragReorder"
                @dragstart="onDragStartBanner(getRealIndex(b), $event)"
                @dragover="onDragOverBanner(getRealIndex(b), $event)"
                @drop.prevent="onDropBanner(getRealIndex(b))"
                @dragend="onDragEndBanner"
              >
                <!-- POSITION & REORDER CONTROLS -->
                <td class="td-index" data-label="Vị trí ưu tiên">
                  <div class="order-control-stack">
                    <div class="index-cell-wrap">
                      <span
                        v-if="canDragReorder"
                        class="drag-grip"
                        title="Giữ và kéo thả để đổi thứ tự"
                        aria-hidden="true"
                      >
                        <i class="ri-draggable"></i>
                      </span>

                      <div class="position-select-wrap" title="Chọn nhanh vị trí hiển thị">
                        <select
                          class="inline-pos-select"
                          :value="getRealIndex(b) + 1"
                          :disabled="reordering || banners.length <= 1"
                          @change="jumpBannerToPosition(b, $event.target.value)"
                        >
                          <option v-for="pos in banners.length" :key="pos" :value="pos">
                            #{{ pos }}
                          </option>
                        </select>
                        <i class="ri-expand-up-down-line pos-select-caret"></i>
                      </div>

                      <div v-if="banners.length > 1" class="order-arrows">
                        <button
                          type="button"
                          class="order-btn"
                          :disabled="getRealIndex(b) === 0 || reordering"
                          title="Đẩy lên trước 1 bậc"
                          @click="moveBannerByDelta(b, -1)"
                        >
                          <i class="ri-arrow-up-s-line"></i>
                        </button>
                        <button
                          type="button"
                          class="order-btn"
                          :disabled="getRealIndex(b) === banners.length - 1 || reordering"
                          title="Đẩy xuống sau 1 bậc"
                          @click="moveBannerByDelta(b, 1)"
                        >
                          <i class="ri-arrow-down-s-line"></i>
                        </button>
                      </div>

                      <button
                        v-if="getRealIndex(b) > 0 && banners.length > 1"
                        type="button"
                        class="move-top-btn"
                        :disabled="reordering"
                        title="Đưa lên vị trí đầu tiên (#1)"
                        @click="jumpBannerToPosition(b, 1)"
                      >
                        <i class="ri-skip-up-line"></i>
                        <span>Đầu</span>
                      </button>
                    </div>

                    <span v-if="isBannerActive(b)" class="live-slide-tag">
                      {{
                        isVerticalMode
                          ? `Vị trí ${getLiveSlideNumber(b)} ở Sidebar`
                          : `Slide ${getLiveSlideNumber(b)} ngoài web`
                      }}
                    </span>
                    <span v-else class="live-slide-tag is-off">Không chiếu ngoài web</span>
                  </div>
                </td>

                <!-- THUMBNAIL -->
                <td class="td-image" data-label="Hình ảnh Banner">
                  <div class="image-wrapper" :class="{ 'is-vertical-col': isVerticalMode }">
                    <div
                      class="thumb-frame"
                      :class="{
                        'is-muted': !isBannerActive(b),
                        'is-vertical-frame': isVerticalMode,
                      }"
                    >
                      <img :src="b.URL" alt="Banner" class="banner-thumb" draggable="false" />
                      <span v-if="!isBannerActive(b)" class="thumb-hidden-badge">
                        <i class="ri-eye-off-line"></i>
                        <span>Đang ẩn</span>
                      </span>
                    </div>
                    <div v-if="b.Title" class="banner-row-caption">{{ b.Title }}</div>
                    <span v-if="isVerticalMode" class="vertical-target-pill">
                      <i class="ri-layout-left-2-line"></i>
                      <span>{{ formatVerticalTargetLabel(b) }}</span>
                    </span>
                  </div>
                </td>

                <!-- CLICK BEHAVIOR -->
                <td class="td-behavior" data-label="Khi bấm vào">
                  <div class="behavior-cell">
                    <span
                      class="behavior-badge"
                      :class="{
                        'is-link':
                          getBannerAction(b) === BANNER_CLICK_ACTIONS.LINK && getBannerLink(b),
                        'is-popup-link':
                          getBannerAction(b) === BANNER_CLICK_ACTIONS.POPUP && getBannerLink(b),
                      }"
                    >
                      <i
                        :class="
                          getBannerAction(b) === BANNER_CLICK_ACTIONS.LINK && getBannerLink(b)
                            ? 'ri-external-link-line'
                            : 'ri-image-2-line'
                        "
                      ></i>
                      <span>
                        {{
                          getBannerAction(b) === BANNER_CLICK_ACTIONS.LINK && getBannerLink(b)
                            ? 'Mở link (tab mới)'
                            : getBannerLink(b)
                              ? 'Popup + nút mở link'
                              : 'Mở popup ảnh'
                        }}
                      </span>
                    </span>
                    <a
                      v-if="getBannerLink(b)"
                      :href="getBannerLink(b)"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="behavior-link-preview"
                      :title="getBannerLink(b)"
                      @click.stop
                    >
                      <i class="ri-link"></i>
                      <span>{{ formatBannerLinkShort(getBannerLink(b), 34) }}</span>
                    </a>
                  </div>
                </td>

                <!-- VISIBILITY STATUS TOGGLE -->
                <td class="td-status" data-label="Trạng thái">
                  <button
                    type="button"
                    class="status-toggle-btn"
                    :class="{ active: isBannerActive(b) }"
                    :disabled="togglingId === b.ID || reordering"
                    :title="
                      isBannerActive(b)
                        ? 'Nhấn để tạm ẩn banner này'
                        : 'Nhấn để bật hiển thị lại banner này'
                    "
                    @click="toggleBannerVisibility(b)"
                  >
                    <i :class="isBannerActive(b) ? 'ri-eye-fill' : 'ri-eye-off-line'"></i>
                    <span>
                      {{
                        togglingId === b.ID
                          ? 'Đang lưu...'
                          : isBannerActive(b)
                            ? 'Đang hiện'
                            : 'Đang ẩn'
                      }}
                    </span>
                  </button>
                </td>

                <!-- ACTIONS -->
                <td class="td-action" data-label="Thao tác">
                  <div class="action-group">
                    <button
                      @click="startEdit(b)"
                      class="btn-icon-action btn-edit"
                      title="Chỉnh sửa"
                    >
                      <i class="ri-edit-line"></i>
                      <span class="text">Sửa</span>
                    </button>
                    <button
                      @click="deleteBanner(b.ID)"
                      class="btn-icon-action btn-delete"
                      title="Xóa"
                    >
                      <i class="ri-delete-bin-line"></i>
                      <span class="text">Xóa</span>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- FILTER EMPTY STATE -->
      <div v-else-if="banners.length" class="card-body">
        <div class="empty-state">
          <div class="empty-icon"><i class="ri-filter-off-line" style="color: white"></i></div>
          <h3 class="empty-title">
            {{
              statusFilter === 'active'
                ? 'Hiện chưa có banner nào đang bật hiển thị'
                : 'Không có banner nào đang ẩn'
            }}
          </h3>
          <p class="empty-text">
            <button type="button" class="reset-filter-link" @click="statusFilter = 'all'">
              Xem lại toàn bộ {{ banners.length }} banner
            </button>
          </p>
        </div>
      </div>

      <!-- EMPTY STATE -->
      <div v-else class="card-body">
        <div class="empty-state">
          <div class="empty-icon">
            <i
              :class="isVerticalMode ? 'ri-advertisement-line' : 'ri-image-add-fill'"
              style="color: white"
            ></i>
          </div>
          <h3 class="empty-title">
            {{
              isVerticalMode
                ? 'Chưa có banner quảng cáo dọc nào cho Bảng tin'
                : 'Chưa có banner trang chủ nào'
            }}
          </h3>
          <p class="empty-text">
            {{
              isVerticalMode
                ? 'Tải lên poster dọc ở khung phía trên để hiển thị ở Sidebar bên trái trang Bảng tin'
                : 'Bắt đầu bằng cách tải lên banner đầu tiên của bạn'
            }}
          </p>
        </div>
      </div>
    </div>
  </div>

  <!-- EDIT MODAL -->
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="showEditBannerModal" class="modal-overlay" @click.self="closeEditBannerModal">
        <div class="modal-container">
          <div class="modal-header">
            <div class="modal-title-group">
              <h3 class="modal-title">
                {{ isVerticalMode ? 'Chỉnh sửa Banner Quảng cáo dọc' : 'Chỉnh sửa Banner' }}
              </h3>
            </div>
            <button @click="closeEditBannerModal" class="modal-close" aria-label="Đóng">
              <i class="ri-close-line"></i>
            </button>
          </div>

          <div class="modal-body">
            <div class="modal-preview">
              <div class="modal-preview-label">Xem trước</div>
              <div class="modal-preview-container">
                <img
                  :src="editBannerPreview"
                  alt="Preview"
                  class="modal-preview-image"
                  :class="{ 'is-vertical-preview': isVerticalMode }"
                />
              </div>
            </div>

            <div v-if="isVerticalMode" class="modal-title-field">
              <label class="modal-order-label" for="edit-banner-title-input">
                Tiêu đề / Nhãn ngắn dưới banner (không bắt buộc)
              </label>
              <input
                id="edit-banner-title-input"
                v-model="editBannerTitle"
                type="text"
                maxlength="80"
                placeholder="VD: Ưu đãi đối tác độc quyền"
                class="title-text-input"
              />
            </div>

            <div v-if="isVerticalMode" class="modal-title-field">
              <label class="modal-order-label" for="edit-banner-target-select">
                Nơi hiển thị Banner dọc
              </label>
              <select
                id="edit-banner-target-select"
                v-model="editBannerTargetPages"
                class="modal-order-select"
              >
                <option :value="VERTICAL_BANNER_TARGETS.BOTH">
                  Cả Trang Order PC &amp; Bảng tin
                </option>
                <option :value="VERTICAL_BANNER_TARGETS.ORDER">Chỉ Trang Order PC</option>
                <option :value="VERTICAL_BANNER_TARGETS.FEED">Chỉ Trang Bảng tin</option>
              </select>
            </div>

            <div class="modal-order-visibility-grid">
              <div class="modal-field-order">
                <label class="modal-order-label" for="banner-order-select">
                  Vị trí hiển thị ưu tiên
                </label>
                <select
                  id="banner-order-select"
                  v-model.number="editBannerOrder"
                  class="modal-order-select"
                >
                  <option v-for="pos in Math.max(banners.length, 1)" :key="pos" :value="pos">
                    #{{ pos }}{{ pos === 1 ? ' (Hiển thị đầu tiên)' : '' }}
                  </option>
                </select>
              </div>

              <div class="modal-field-order">
                <span class="modal-order-label">Trạng thái hiển thị</span>
                <div
                  class="visibility-toggle-card"
                  :class="{ active: editBannerActive }"
                  @click="editBannerActive = !editBannerActive"
                >
                  <div class="vtc-info">
                    <div class="vtc-title">
                      <i :class="editBannerActive ? 'ri-eye-fill' : 'ri-eye-off-line'"></i>
                      <span>{{ editBannerActive ? 'Đang hiện' : 'Đang ẩn' }}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    class="switch-pill"
                    :class="{ active: editBannerActive }"
                    :aria-pressed="editBannerActive"
                    @click.stop="editBannerActive = !editBannerActive"
                  >
                    <span class="switch-knob"></span>
                  </button>
                </div>
              </div>
            </div>

            <div class="banner-behavior-box is-modal">
              <div class="behavior-field">
                <label class="behavior-label">Hành động khi khách bấm vào banner</label>
                <div
                  class="behavior-segment"
                  role="radiogroup"
                  aria-label="Chỉnh sửa hành động banner"
                >
                  <button
                    type="button"
                    class="segment-btn"
                    :class="{ active: editBannerAction === BANNER_CLICK_ACTIONS.POPUP }"
                    @click="editBannerAction = BANNER_CLICK_ACTIONS.POPUP; editLinkError = ''"
                  >
                    <i class="ri-image-2-line"></i>
                    <span>Mở popup ảnh</span>
                  </button>
                  <button
                    type="button"
                    class="segment-btn is-link-mode"
                    :class="{ active: editBannerAction === BANNER_CLICK_ACTIONS.LINK }"
                    @click="editBannerAction = BANNER_CLICK_ACTIONS.LINK; editLinkError = ''"
                  >
                    <i class="ri-external-link-line"></i>
                    <span>Mở link (tab mới)</span>
                  </button>
                </div>
              </div>

              <div class="behavior-field">
                <label class="behavior-label" for="edit-banner-link-input">
                  {{
                    editBannerAction === BANNER_CLICK_ACTIONS.LINK
                      ? 'Đường dẫn mở khi bấm *'
                      : 'Đường dẫn gắn kèm (không bắt buộc)'
                  }}
                </label>
                <div class="link-input-row">
                  <div class="link-input-wrap" :class="{ 'has-error': Boolean(editLinkError) }">
                    <i class="ri-link link-input-icon"></i>
                    <input
                      id="edit-banner-link-input"
                      v-model="editBannerLink"
                      type="url"
                      placeholder="VD: https://t.me/sakitchen hoặc https://..."
                      class="link-input"
                      @input="editLinkError = ''"
                    />
                    <button
                      v-if="editBannerLink"
                      type="button"
                      class="link-clear-btn"
                      title="Xóa link"
                      @click="editBannerLink = ''; editLinkError = ''"
                    >
                      <i class="ri-close-line"></i>
                    </button>
                  </div>
                  <button
                    type="button"
                    class="btn-test-link"
                    :disabled="!isValidBannerLink(editBannerLink)"
                    title="Mở thử đường dẫn ở tab mới"
                    @click="testBannerLink(editBannerLink)"
                  >
                    <i class="ri-external-link-line"></i>
                    <span>Mở thử</span>
                  </button>
                </div>
                <p v-if="editLinkError" class="behavior-error">
                  <i class="ri-error-warning-line"></i>
                  <span>{{ editLinkError }}</span>
                </p>
                <p v-else class="behavior-hint">
                  {{
                    editBannerAction === BANNER_CLICK_ACTIONS.LINK
                      ? 'Bấm banner sẽ mở thẳng đường dẫn này ở tab mới.'
                      : 'Nếu có điền link, popup ảnh sẽ có thêm nút "Mở liên kết" bên dưới ảnh.'
                  }}
                </p>
              </div>
            </div>

            <label class="modal-file-upload">
              <input
                type="file"
                accept="image/*"
                @change="onSelectEditFile"
                class="file-input-hidden"
              />
              <div class="modal-upload-content">
                <span class="modal-upload-icon">
                  <i class="ri-image-add-fill" style="color: white"></i>
                </span>
                <div class="modal-upload-text-wrap">
                  <span class="modal-upload-text">Chọn ảnh mới</span>
                  <span class="upload-size-hint">
                    {{
                      isVerticalMode
                        ? 'Kích thước chuẩn: 800 × 1200 px (dọc 2:3 / 9:16) · Tự nén ≤ 140KB'
                        : 'Kích thước chuẩn: 1600 × 1000 px (ngang 16:10) · Tự nén ≤ 100KB'
                    }}
                  </span>
                </div>
              </div>
            </label>
          </div>

          <div class="modal-footer">
            <button @click="closeEditBannerModal" class="btn btn-secondary">
              <i class="ri-close-line"></i>
              <span>Hủy</span>
            </button>
            <button
              @click="saveEdit"
              :disabled="loading || !hasEditChanges"
              class="btn btn-success"
            >
              <span v-if="loading" class="btn-loading">
                <span class="spinner"></span>
                Đang lưu...
              </span>
              <span v-else class="btn-inline-content">
                <i class="ri-check-line"></i>
                <span>Lưu thay đổi</span>
              </span>
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

/* LAYOUT */
.admin-page {
  min-height: 100vh;
  background: rgb(15, 23, 42);
  padding: 24px;
}

/* PAGE HEADER */
.page-header {
  margin-bottom: 24px;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.header-content {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.page-subtitle {
  font-size: 14px;
  color: #cbd5e1;
  margin-top: 4px;
}

.btn-preview-feed {
  padding: 10px 15px;
  border-radius: 10px;
  border: 1px solid rgba(74, 222, 128, 0.45);
  background: rgba(22, 163, 74, 0.16);
  color: #86efac;
  text-decoration: none;
  font-size: 13.5px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  transition: all 0.18s ease;
}

.btn-preview-feed:hover {
  background: #16a34a;
  color: #ffffff;
}

/* PLACEMENT MODE TABS */
.placement-tabs {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.placement-tab-btn {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border-radius: 14px;
  border: 1px solid rgba(148, 163, 184, 0.22);
  background: rgba(30, 41, 59, 0.65);
  color: #cbd5e1;
  text-align: left;
  cursor: pointer;
  transition: all 0.2s ease;
}

.placement-tab-btn > i {
  width: 40px;
  height: 40px;
  border-radius: 11px;
  background: rgba(51, 65, 85, 0.75);
  color: #94a3b8;
  font-size: 20px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.ptb-text {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.ptb-text strong {
  font-size: 14.5px;
  font-weight: 700;
  color: #f8fafc;
}

.ptb-text span {
  font-size: 12px;
  color: #94a3b8;
}

.ptb-count {
  padding: 4px 10px;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(148, 163, 184, 0.25);
  color: #cbd5e1;
  font-size: 12px;
  font-weight: 700;
  flex-shrink: 0;
}

.placement-tab-btn:hover {
  border-color: rgba(74, 222, 128, 0.45);
  background: rgba(30, 41, 59, 0.85);
}

.placement-tab-btn.active {
  background: rgba(22, 163, 74, 0.16);
  border-color: rgba(52, 211, 153, 0.7);
  box-shadow: 0 4px 18px rgba(16, 185, 129, 0.15);
}

.placement-tab-btn.active > i {
  background: linear-gradient(135deg, #16a34a 0%, #059669 100%);
  color: #ffffff;
}

.placement-tab-btn.active .ptb-count {
  background: rgba(22, 163, 74, 0.25);
  border-color: rgba(74, 222, 128, 0.5);
  color: #86efac;
}

.placement-tab-btn.is-vertical.active {
  background: rgba(37, 99, 235, 0.16);
  border-color: rgba(96, 165, 250, 0.75);
  box-shadow: 0 4px 18px rgba(37, 99, 235, 0.16);
}

.placement-tab-btn.is-vertical.active > i {
  background: linear-gradient(135deg, #2563eb 0%, #4f46e5 100%);
  color: #ffffff;
}

.placement-tab-btn.is-vertical.active .ptb-count {
  background: rgba(37, 99, 235, 0.28);
  border-color: rgba(96, 165, 250, 0.55);
  color: #bfdbfe;
}

/* CARD */
.card {
  background: rgba(30, 41, 59, 0.6);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(148, 163, 184, 0.12);
  border-radius: 16px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.2);
  margin-bottom: 24px;
  overflow: hidden;
}

.card-header {
  padding: 20px 24px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-title {
  font-size: 18px;
  font-weight: 700;
  color: #ffffff;
  display: flex;
  align-items: center;
  gap: 8px;
}

.card-body {
  padding: 24px;
}

.card-body.no-padding {
  padding: 0;
}

/* UPLOAD AREA */
.upload-area {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.file-upload-label {
  cursor: pointer;
  display: block;
}

.file-input-hidden {
  display: none;
}

.file-upload-content {
  background: rgba(51, 65, 85, 0.5);
  border: 2px dashed rgba(148, 163, 184, 0.3);
  border-radius: 12px;
  padding: 28px;
  display: flex;
  align-items: center;
  gap: 16px;
  transition: all 0.25s ease;
}

.file-upload-content:hover {
  border-color: rgba(52, 211, 153, 0.55);
  background: rgba(51, 65, 85, 0.7);
}

.upload-icon {
  font-size: 44px;
  opacity: 0.85;
}

.upload-text {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.upload-primary {
  font-size: 16px;
  font-weight: 700;
  color: #ffffff;
}

.upload-secondary {
  font-size: 13px;
  color: #cbd5e1;
}

.title-text-input {
  width: 100%;
  min-height: 44px;
  padding: 10px 14px;
  border-radius: 10px;
  border: 1px solid rgba(148, 163, 184, 0.3);
  background: rgba(51, 65, 85, 0.65);
  color: #ffffff;
  font-size: 13.5px;
  outline: none;
  transition: border-color 0.2s ease;
}

.title-text-input:focus {
  border-color: #60a5fa;
}

.title-text-input::placeholder {
  color: #94a3b8;
}

.modal-title-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
}

.header-preview-links {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.vertical-target-pill {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border-radius: 999px;
  background: rgba(37, 99, 235, 0.16);
  border: 1px solid rgba(96, 165, 250, 0.35);
  color: #93c5fd;
  font-size: 11px;
  font-weight: 700;
}

/* ADD PLACEMENT & VISIBILITY GRID */
.add-placement-grid,
.modal-order-visibility-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.modal-order-visibility-grid {
  margin-bottom: 16px;
}

.placement-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.visibility-toggle-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-height: 44px;
  padding: 8px 14px;
  border-radius: 10px;
  background: rgba(51, 65, 85, 0.55);
  border: 1px solid rgba(148, 163, 184, 0.28);
  cursor: pointer;
  transition: all 0.2s ease;
}

.visibility-toggle-card.active {
  background: rgba(22, 163, 74, 0.18);
  border-color: rgba(52, 211, 153, 0.6);
}

.vtc-title {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 13.5px;
  font-weight: 600;
  color: #e2e8f0;
}

.visibility-toggle-card.active .vtc-title {
  color: #ecfdf5;
}

.visibility-toggle-card.active .vtc-title i {
  color: #4ade80;
}

.switch-pill {
  position: relative;
  width: 44px;
  height: 24px;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.35);
  background: rgba(15, 23, 42, 0.65);
  cursor: pointer;
  padding: 2px;
  flex-shrink: 0;
  transition: all 0.2s ease;
}

.switch-pill.active {
  background: linear-gradient(135deg, #16a34a 0%, #059669 100%);
  border-color: rgba(74, 222, 128, 0.65);
}

.switch-knob {
  display: block;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #ffffff;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
  transition: transform 0.2s ease;
}

.switch-pill.active .switch-knob {
  transform: translateX(20px);
}

/* PREVIEW */
.preview-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.preview-label {
  font-size: 13px;
  font-weight: 700;
  color: #ffffff;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.preview-container {
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(148, 163, 184, 0.12);
  border-radius: 12px;
  padding: 16px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.preview-image {
  max-width: 100%;
  max-height: 360px;
  border-radius: 8px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.preview-image.is-vertical-preview,
.modal-preview-image.is-vertical-preview {
  max-width: 240px;
  max-height: 380px;
}

/* BUTTONS */
.action-buttons {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.btn {
  padding: 12px 28px;
  border: none;
  border-radius: 10px;
  font-weight: 700;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.25s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 44px;
  min-width: 170px;
}

.btn-inline-content {
  display: inline-flex;
  align-items: center;
  gap: 7px;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background: linear-gradient(135deg, #16a34a 0%, #059669 100%);
  color: white;
  box-shadow: 0 4px 16px rgba(22, 163, 74, 0.32);
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 22px rgba(22, 163, 74, 0.45);
}

.btn-success {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  box-shadow: 0 4px 16px rgba(16, 185, 129, 0.3);
}

.btn-success:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 24px rgba(16, 185, 129, 0.4);
}

.btn-secondary {
  background: rgba(51, 65, 85, 0.6);
  color: #ffffff;
  border: 1px solid rgba(148, 163, 184, 0.22);
}

.btn-secondary:hover {
  background: rgba(51, 65, 85, 0.85);
}

.btn-loading {
  display: flex;
  align-items: center;
  gap: 8px;
}

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* LIST HEADER SUMMARY & FILTERS */
.list-header-wrap {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  flex-wrap: wrap;
}

.drag-hint {
  margin-top: 4px;
  font-size: 12.5px;
  color: #93c5fd;
}

.list-header-right {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.status-summary-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 12px;
  border-radius: 999px;
  font-size: 12.5px;
  font-weight: 700;
}

.status-summary-pill.is-active {
  background: rgba(22, 163, 74, 0.2);
  border: 1px solid rgba(74, 222, 128, 0.45);
  color: #86efac;
}

.status-summary-pill.is-muted {
  background: rgba(148, 163, 184, 0.16);
  border: 1px solid rgba(148, 163, 184, 0.3);
  color: #cbd5e1;
}

.filter-pills {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px;
  border-radius: 10px;
  background: rgba(15, 23, 42, 0.65);
  border: 1px solid rgba(148, 163, 184, 0.2);
}

.filter-pill-btn {
  padding: 5px 11px;
  border: none;
  border-radius: 7px;
  background: transparent;
  color: #94a3b8;
  font-size: 12.5px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.18s ease;
}

.filter-pill-btn:hover {
  color: #ffffff;
}

.filter-pill-btn.active {
  background: rgba(59, 130, 246, 0.26);
  color: #ffffff;
  box-shadow: inset 0 0 0 1px rgba(96, 165, 250, 0.45);
}

/* TABLE LOADING */
.table-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  gap: 20px;
}

.table-loading-spinner {
  width: 46px;
  height: 46px;
  border: 4px solid rgba(59, 130, 246, 0.2);
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.table-loading-text {
  font-size: 14.5px;
  font-weight: 600;
  color: #e2e8f0;
}

/* TABLE */
.table-container {
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table thead {
  background: rgba(15, 23, 42, 0.6);
  border-bottom: 2px solid rgba(148, 163, 184, 0.1);
}

.data-table th {
  padding: 14px 16px;
  text-align: center;
  font-size: 12.5px;
  font-weight: 700;
  color: #ffffff;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.data-table td {
  padding: 16px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.06);
  vertical-align: middle;
}

.table-row {
  transition:
    background 0.2s ease,
    opacity 0.2s ease;
}

.table-row:hover {
  background: rgba(51, 65, 85, 0.32);
}

.table-row.is-row-active {
  background: rgba(22, 163, 74, 0.04);
}

.table-row.is-row-hidden {
  background: rgba(15, 23, 42, 0.35);
}

.th-index {
  width: 210px;
}
.th-image {
  width: auto;
}
.th-behavior {
  width: 220px;
}
.th-status {
  width: 155px;
}
.th-action {
  width: 175px;
}

.td-index,
.td-image,
.td-behavior,
.td-status,
.td-action {
  text-align: center;
}

/* ORDER & REORDER CONTROLS */
.order-control-stack {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.index-cell-wrap {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.drag-grip {
  font-size: 18px;
  line-height: 1;
  color: #94a3b8;
  user-select: none;
  padding: 4px 2px;
  display: inline-flex;
  align-items: center;
}

.position-select-wrap {
  position: relative;
  display: inline-flex;
  align-items: center;
}

.inline-pos-select {
  appearance: none;
  -webkit-appearance: none;
  min-width: 64px;
  height: 36px;
  padding: 0 24px 0 11px;
  border-radius: 8px;
  background: rgba(59, 130, 246, 0.2);
  border: 1px solid rgba(96, 165, 250, 0.4);
  color: #ffffff;
  font-weight: 700;
  font-size: 13.5px;
  cursor: pointer;
  outline: none;
  transition:
    border-color 0.18s ease,
    background 0.18s ease;
}

.inline-pos-select:hover:not(:disabled) {
  background: rgba(59, 130, 246, 0.32);
  border-color: rgba(96, 165, 250, 0.75);
}

.inline-pos-select:disabled {
  opacity: 0.6;
  cursor: default;
}

.inline-pos-select option {
  background: #1e293b;
  color: #ffffff;
}

.pos-select-caret {
  position: absolute;
  right: 6px;
  font-size: 13px;
  color: #93c5fd;
  pointer-events: none;
}

.order-arrows {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.order-btn {
  width: 26px;
  height: 19px;
  border: 1px solid rgba(148, 163, 184, 0.28);
  border-radius: 5px;
  background: rgba(51, 65, 85, 0.7);
  color: #e2e8f0;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.16s ease;
}

.order-btn:hover:not(:disabled) {
  background: #16a34a;
  border-color: #4ade80;
  color: #ffffff;
}

.order-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.move-top-btn {
  height: 36px;
  padding: 0 9px;
  border-radius: 8px;
  border: 1px solid rgba(148, 163, 184, 0.26);
  background: rgba(51, 65, 85, 0.55);
  color: #cbd5e1;
  font-size: 11.5px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  gap: 3px;
  cursor: pointer;
  transition: all 0.18s ease;
}

.move-top-btn:hover:not(:disabled) {
  background: rgba(16, 185, 129, 0.22);
  border-color: rgba(52, 211, 153, 0.6);
  color: #ecfdf5;
}

.move-top-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.live-slide-tag {
  font-size: 11px;
  font-weight: 600;
  color: #6ee7b7;
  background: rgba(16, 185, 129, 0.12);
  border: 1px solid rgba(52, 211, 153, 0.25);
  padding: 2px 8px;
  border-radius: 999px;
  white-space: nowrap;
}

.live-slide-tag.is-off {
  color: #94a3b8;
  background: rgba(148, 163, 184, 0.12);
  border-color: rgba(148, 163, 184, 0.22);
}

/* THUMBNAIL & HIDDEN OVERLAY */
.image-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 4px 0;
}

.thumb-frame {
  position: relative;
  display: inline-flex;
  max-width: 440px;
  width: 100%;
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid rgba(148, 163, 184, 0.16);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.22);
}

.thumb-frame.is-vertical-frame {
  max-width: 156px;
}

.thumb-frame.is-muted .banner-thumb {
  filter: grayscale(45%) brightness(0.62);
}

.banner-thumb {
  width: 100%;
  height: auto;
  display: block;
  transition: filter 0.2s ease;
}

.banner-row-caption {
  font-size: 12.5px;
  font-weight: 600;
  color: #cbd5e1;
  max-width: 260px;
  text-align: center;
}

.thumb-hidden-badge {
  position: absolute;
  top: 8px;
  left: 8px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 9px;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.86);
  border: 1px solid rgba(248, 113, 113, 0.5);
  color: #fecaca;
  font-size: 11px;
  font-weight: 700;
  backdrop-filter: blur(6px);
}

/* STATUS TOGGLE BUTTON */
.status-toggle-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-width: 118px;
  padding: 8px 13px;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.32);
  background: rgba(51, 65, 85, 0.55);
  color: #cbd5e1;
  font-size: 12.5px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
}

.status-toggle-btn:hover:not(:disabled) {
  border-color: rgba(148, 163, 184, 0.6);
  color: #ffffff;
}

.status-toggle-btn.active {
  background: rgba(22, 163, 74, 0.2);
  border-color: rgba(74, 222, 128, 0.55);
  color: #86efac;
}

.status-toggle-btn.active:hover:not(:disabled) {
  background: rgba(22, 163, 74, 0.32);
  color: #ecfdf5;
}

.status-toggle-btn:disabled {
  opacity: 0.55;
  cursor: wait;
}

/* ROW ACTIONS */
.action-group {
  display: flex;
  justify-content: center;
  gap: 8px;
}

.btn-icon-action {
  padding: 8px 14px;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.22s ease;
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.btn-edit {
  background: #16a34a;
  color: white;
}

.btn-edit:hover {
  transform: translateY(-2px);
  filter: brightness(1.08);
}

.btn-delete {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: white;
}

.btn-delete:hover {
  transform: translateY(-2px);
  filter: brightness(1.08);
}

/* DRAG STATES */
.table-row.is-draggable {
  cursor: grab;
}

.table-row.is-draggable:active {
  cursor: grabbing;
}

.table-row.is-dragging {
  opacity: 0.48;
  background: rgba(59, 130, 246, 0.14);
}

.table-row.is-drag-over {
  background: rgba(16, 185, 129, 0.14);
  box-shadow:
    inset 0 2px 0 #10b981,
    inset 0 -2px 0 #10b981;
}

/* EMPTY STATE */
.empty-state {
  text-align: center;
  padding: 56px 20px;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 14px;
  opacity: 0.35;
}

.empty-title {
  font-size: 18px;
  font-weight: 700;
  color: #ffffff;
  margin-bottom: 8px;
}

.empty-text {
  font-size: 14px;
  color: #cbd5e1;
}

.reset-filter-link {
  background: none;
  border: none;
  color: #60a5fa;
  font-size: 14px;
  font-weight: 600;
  text-decoration: underline;
  cursor: pointer;
}

/* MODAL */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal-container {
  background: rgba(30, 41, 59, 0.96);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(148, 163, 184, 0.14);
  border-radius: 16px;
  width: 100%;
  max-width: 620px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-header {
  padding: 20px 24px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-title-group {
  display: flex;
  align-items: center;
  gap: 12px;
}

.modal-title {
  font-size: 19px;
  font-weight: 700;
  color: #ffffff;
}

.modal-close {
  width: 36px;
  height: 36px;
  border: none;
  background: rgba(51, 65, 85, 0.55);
  color: #e2e8f0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.25s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
}

.modal-close:hover {
  background: rgba(239, 68, 68, 0.22);
  color: #f87171;
}

.modal-body {
  padding: 22px 24px;
  overflow-y: auto;
  flex: 1;
}

.modal-preview {
  margin-bottom: 20px;
}

.modal-preview-label {
  font-size: 12.5px;
  font-weight: 700;
  color: #ffffff;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 10px;
}

.modal-preview-container {
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(148, 163, 184, 0.12);
  border-radius: 12px;
  padding: 14px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.modal-preview-image {
  max-width: 100%;
  max-height: 260px;
  border-radius: 8px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.modal-field-order {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.modal-order-label {
  display: block;
  font-size: 12.5px;
  font-weight: 700;
  color: #e2e8f0;
  text-transform: uppercase;
  letter-spacing: 0.4px;
}

.modal-order-select {
  width: 100%;
  min-height: 44px;
  padding: 10px 14px;
  border-radius: 10px;
  border: 1px solid rgba(148, 163, 184, 0.3);
  background: rgba(51, 65, 85, 0.65);
  color: #ffffff;
  font-size: 13.5px;
  font-weight: 600;
  outline: none;
  cursor: pointer;
}

.modal-order-select:focus {
  border-color: #3b82f6;
}

.modal-order-select option {
  background: #1e293b;
  color: #ffffff;
}

.modal-file-upload {
  cursor: pointer;
  display: block;
}

.modal-upload-content {
  background: rgba(51, 65, 85, 0.5);
  border: 2px dashed rgba(148, 163, 184, 0.3);
  border-radius: 12px;
  padding: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  transition: all 0.25s ease;
}

.modal-upload-content:hover {
  border-color: rgba(59, 130, 246, 0.5);
  background: rgba(51, 65, 85, 0.7);
}

.modal-upload-icon {
  font-size: 24px;
}

.modal-upload-text-wrap {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.modal-upload-text {
  font-size: 14.5px;
  font-weight: 700;
  color: #ffffff;
}

.upload-size-hint {
  font-size: 12px;
  color: #93c5fd;
  line-height: 1.4;
}

.modal-footer {
  padding: 18px 24px;
  border-top: 1px solid rgba(148, 163, 184, 0.1);
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

/* MODAL ANIMATION */
.modal-enter-active,
.modal-leave-active {
  transition: all 0.25s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .modal-container,
.modal-leave-to .modal-container {
  transform: scale(0.94) translateY(-14px);
}

/* BANNER CLICK BEHAVIOR & LINK CONTROLS */
.banner-behavior-box {
  background: rgba(15, 23, 42, 0.55);
  border: 1px solid rgba(148, 163, 184, 0.16);
  border-radius: 12px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.banner-behavior-box.is-modal {
  margin-bottom: 16px;
  padding: 14px;
}

.behavior-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.behavior-label {
  display: block;
  font-size: 12.5px;
  font-weight: 700;
  color: #e2e8f0;
  text-transform: uppercase;
  letter-spacing: 0.4px;
}

.behavior-segment {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.segment-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid rgba(148, 163, 184, 0.24);
  background: rgba(51, 65, 85, 0.45);
  color: #cbd5e1;
  font-size: 13.5px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.segment-btn:hover {
  background: rgba(51, 65, 85, 0.72);
  color: #ffffff;
}

.segment-btn.active {
  background: rgba(59, 130, 246, 0.24);
  border-color: rgba(96, 165, 250, 0.75);
  color: #ffffff;
  box-shadow: 0 0 0 1px rgba(96, 165, 250, 0.25);
}

.segment-btn.is-link-mode.active {
  background: rgba(16, 185, 129, 0.24);
  border-color: rgba(52, 211, 153, 0.78);
  color: #ecfdf5;
  box-shadow: 0 0 0 1px rgba(52, 211, 153, 0.25);
}

.link-input-row {
  display: flex;
  align-items: stretch;
  gap: 8px;
}

.link-input-wrap {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 10px 0 12px;
  border-radius: 10px;
  border: 1px solid rgba(148, 163, 184, 0.28);
  background: rgba(51, 65, 85, 0.65);
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}

.link-input-wrap:focus-within {
  border-color: #34d399;
  box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.18);
}

.link-input-wrap.has-error {
  border-color: #f87171;
  box-shadow: 0 0 0 2px rgba(248, 113, 113, 0.18);
}

.link-input-icon {
  font-size: 16px;
  color: #94a3b8;
  flex-shrink: 0;
}

.link-input {
  flex: 1;
  min-width: 0;
  width: 100%;
  padding: 10px 0;
  border: none;
  background: transparent;
  color: #ffffff;
  font-size: 13.5px;
  outline: none;
}

.link-input::placeholder {
  color: #94a3b8;
}

.link-clear-btn {
  width: 24px;
  height: 24px;
  border-radius: 6px;
  border: none;
  background: rgba(148, 163, 184, 0.18);
  color: #e2e8f0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
  transition: background 0.15s ease;
}

.link-clear-btn:hover {
  background: rgba(239, 68, 68, 0.35);
  color: #ffffff;
}

.btn-test-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  padding: 0 12px;
  border-radius: 10px;
  border: 1px solid rgba(52, 211, 153, 0.4);
  background: rgba(16, 185, 129, 0.16);
  color: #a7f3d0;
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-test-link:hover:not(:disabled) {
  background: rgba(16, 185, 129, 0.3);
  color: #ffffff;
}

.btn-test-link:disabled {
  opacity: 0.42;
  cursor: not-allowed;
}

.behavior-hint {
  font-size: 12px;
  color: #93c5fd;
  line-height: 1.45;
}

.behavior-error {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12.5px;
  font-weight: 600;
  color: #fca5a5;
  line-height: 1.4;
}

.behavior-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 7px;
}

.behavior-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 11px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
  background: rgba(148, 163, 184, 0.16);
  border: 1px solid rgba(148, 163, 184, 0.32);
  color: #e2e8f0;
  white-space: nowrap;
}

.behavior-badge.is-link {
  background: rgba(16, 185, 129, 0.2);
  border-color: rgba(52, 211, 153, 0.5);
  color: #6ee7b7;
}

.behavior-badge.is-popup-link {
  background: rgba(59, 130, 246, 0.2);
  border-color: rgba(96, 165, 250, 0.5);
  color: #93c5fd;
}

.behavior-link-preview {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  max-width: 210px;
  padding: 4px 9px;
  border-radius: 8px;
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(148, 163, 184, 0.18);
  color: #93c5fd;
  font-size: 12px;
  text-decoration: none;
  overflow: hidden;
  transition:
    border-color 0.2s ease,
    color 0.2s ease;
}

.behavior-link-preview span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.behavior-link-preview:hover {
  border-color: rgba(96, 165, 250, 0.55);
  color: #ffffff;
}

/* RESPONSIVE */
@media (max-width: 768px) {
  .admin-page {
    padding: 16px;
  }

  .placement-tabs {
    grid-template-columns: 1fr;
  }

  .card-header,
  .card-body {
    padding: 16px;
  }

  .file-upload-content {
    flex-direction: column;
    text-align: center;
    padding: 22px;
  }

  .add-placement-grid,
  .modal-order-visibility-grid,
  .behavior-segment {
    grid-template-columns: 1fr;
  }

  .link-input-row {
    flex-direction: column;
  }

  .btn-test-link {
    min-height: 38px;
  }

  .action-buttons {
    flex-direction: column;
  }

  .btn {
    width: 100%;
  }

  /* TABLE MOBILE CARDS */
  .data-table thead {
    display: none;
  }

  .data-table tbody {
    display: block;
    padding: 12px;
  }

  .table-row {
    display: block;
    margin-bottom: 14px;
    background: rgba(51, 65, 85, 0.32);
    border-radius: 12px;
    padding: 14px;
    border: 1px solid rgba(148, 163, 184, 0.14);
  }

  .data-table td {
    display: block;
    padding: 10px 0;
    border: none;
    text-align: left;
  }

  .data-table td::before {
    content: attr(data-label);
    display: block;
    font-size: 11px;
    font-weight: 700;
    color: #94a3b8;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 6px;
  }

  .order-control-stack {
    width: 100%;
    flex-direction: row;
    justify-content: space-between;
    flex-wrap: wrap;
  }

  .thumb-frame {
    max-width: 100%;
  }

  .thumb-frame.is-vertical-frame {
    max-width: 190px;
  }

  .behavior-cell {
    align-items: flex-start;
  }

  .behavior-link-preview {
    max-width: 100%;
  }

  .status-toggle-btn {
    width: 100%;
  }

  .action-group {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px;
  }

  .btn-icon-action {
    width: 100%;
    justify-content: center;
  }

  .modal-container {
    max-height: 95vh;
  }

  .modal-footer {
    padding: 16px 20px;
    flex-direction: column-reverse;
  }

  .modal-footer .btn {
    width: 100%;
  }
}
</style>
