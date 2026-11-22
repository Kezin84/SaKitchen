<script setup>
import { ref, computed, onMounted, onActivated, onUnmounted } from 'vue'
import { getOneSheet, dispatchAction } from '@/config/api'
import { uploadImageToCloudinary } from '@/utils/imageUpload.js'
import { DEFAULT_SEO_CONFIG, resolveBrandAssets } from '@/utils/brandAssets.js'

const loading = ref(true)
const saving = ref(false)
const logoRow = ref(null)

// Saved baseline for dirty-checking
const savedState = ref({
  name: '',
  shortName: '',
  shopAddress: '',
  mapUrl: '',
  logoUrl: '',
  faviconUrl: '',
  mobileIconUrl: '',
  shareImageUrl: '',
  seoTitle: '',
  seoDescription: '',
  seoH1: '',
  seoIntro: '',
  seoKeywords: '',
})

// Editable text & SEO fields
const nameInput = ref('')
const shortNameInput = ref('')
const shopAddressInput = ref('')
const mapUrlInput = ref('')
const seoTitleInput = ref('')
const seoDescInput = ref('')
const seoH1Input = ref('')
const seoIntroInput = ref('')
const seoKeywordsInput = ref('')

// Editable image slots (URL + pending local File + local blob preview)
const slots = ref({
  main: { url: '', file: null, preview: '' },
  favicon: { url: '', file: null, preview: '' },
  mobile: { url: '', file: null, preview: '' },
  share: { url: '', file: null, preview: '' },
})

const mainInputRef = ref(null)
const faviconInputRef = ref(null)
const mobileInputRef = ref(null)
const shareInputRef = ref(null)

const toast = ref({ message: '', type: 'success' })
let toastTimer = null

function showToast(message, type = 'success', duration = 3400) {
  toast.value = { message, type }
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => {
    toast.value = { message: '', type: 'success' }
  }, duration)
}

function genLogoId() {
  const d = new Date()
  const p = (n) => String(n).padStart(2, '0')
  return `LG-${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}`
}

function revokeSlotPreview(key) {
  const cur = slots.value[key]?.preview
  if (cur && cur.startsWith('blob:')) {
    try {
      URL.revokeObjectURL(cur)
    } catch {}
  }
}

function triggerFilePick(key) {
  const map = {
    main: mainInputRef.value,
    favicon: faviconInputRef.value,
    mobile: mobileInputRef.value,
    share: shareInputRef.value,
  }
  map[key]?.click?.()
}

function onSelectSlotFile(key, e) {
  const f = e.target?.files?.[0]
  if (e.target) e.target.value = ''
  if (!f) return
  if (!f.type.startsWith('image/')) {
    showToast('Vui lòng chọn file hình ảnh hợp lệ (PNG, JPG, WebP, SVG)', 'error')
    return
  }
  if (f.size > 25 * 1024 * 1024) {
    showToast('Kích thước ảnh tối đa 25MB', 'error')
    return
  }
  revokeSlotPreview(key)
  slots.value[key].file = f
  slots.value[key].preview = URL.createObjectURL(f)
}

function clearCustomSlot(key) {
  if (key === 'main') return
  revokeSlotPreview(key)
  slots.value[key].file = null
  slots.value[key].preview = ''
  slots.value[key].url = ''
}

function resetDraft() {
  for (const k of Object.keys(slots.value)) {
    revokeSlotPreview(k)
  }
  nameInput.value = savedState.value.name
  shortNameInput.value = savedState.value.shortName
  shopAddressInput.value = savedState.value.shopAddress
  mapUrlInput.value = savedState.value.mapUrl
  seoTitleInput.value = savedState.value.seoTitle
  seoDescInput.value = savedState.value.seoDescription
  seoH1Input.value = savedState.value.seoH1
  seoIntroInput.value = savedState.value.seoIntro
  seoKeywordsInput.value = savedState.value.seoKeywords
  slots.value = {
    main: { url: savedState.value.logoUrl, file: null, preview: '' },
    favicon: { url: savedState.value.faviconUrl, file: null, preview: '' },
    mobile: { url: savedState.value.mobileIconUrl, file: null, preview: '' },
    share: { url: savedState.value.shareImageUrl, file: null, preview: '' },
  }
}

function applyDefaultSeoTemplate() {
  const shop = nameInput.value.trim() || 'SA KITCHEN'
  seoTitleInput.value =
    shop === 'SA KITCHEN'
      ? DEFAULT_SEO_CONFIG.seoTitle
      : `${shop} - Ẩm Thực Việt Tại Philippines`
  seoDescInput.value = DEFAULT_SEO_CONFIG.seoDescription
  seoH1Input.value = DEFAULT_SEO_CONFIG.seoH1
  seoIntroInput.value = DEFAULT_SEO_CONFIG.seoIntro
  seoKeywordsInput.value = DEFAULT_SEO_CONFIG.seoKeywords
  showToast('Đã điền mẫu SEO chuẩn Google. Nhấn "Lưu & Áp dụng" để kích hoạt!', 'success')
}

function getSeoMeter(len, minGood, maxGood, maxSoft) {
  if (len === 0) return { state: 'warn', label: 'Đang dùng mặc định', pct: 0 }
  if (len < minGood) {
    return {
      state: 'warn',
      label: 'Hơi ngắn',
      pct: Math.min(100, Math.round((len / maxGood) * 100)),
    }
  }
  if (len <= maxGood) {
    return {
      state: 'good',
      label: 'Độ dài chuẩn SEO',
      pct: Math.min(100, Math.round((len / maxGood) * 100)),
    }
  }
  if (len <= maxSoft) {
    return { state: 'warn', label: 'Hơi dài (dễ bị cắt ...)', pct: 100 }
  }
  return { state: 'bad', label: 'Quá dài (Google sẽ cắt)', pct: 100 }
}

// Effective previews (respecting fallback to Main Logo when optional slot is empty)
const mainPreviewUrl = computed(
  () => slots.value.main.preview || slots.value.main.url || '/logo-sa.jpg',
)
const hasMainImage = computed(() => Boolean(slots.value.main.preview || slots.value.main.url))

const faviconDisplayUrl = computed(
  () => slots.value.favicon.preview || slots.value.favicon.url || '',
)
const mobileDisplayUrl = computed(
  () => slots.value.mobile.preview || slots.value.mobile.url || '',
)
const shareDisplayUrl = computed(
  () => slots.value.share.preview || slots.value.share.url || '',
)

const effectiveFaviconPreview = computed(() => faviconDisplayUrl.value || mainPreviewUrl.value)
const effectiveMobilePreview = computed(() => mobileDisplayUrl.value || mainPreviewUrl.value)
const effectiveSharePreview = computed(() => shareDisplayUrl.value || mainPreviewUrl.value)

const effectiveShopName = computed(() => nameInput.value.trim() || 'SA KITCHEN')
const effectiveShortName = computed(
  () => shortNameInput.value.trim() || nameInput.value.trim() || 'SA KITCHEN',
)
const effectiveSeoTitle = computed(
  () =>
    seoTitleInput.value.trim() ||
    (effectiveShopName.value === 'SA KITCHEN'
      ? DEFAULT_SEO_CONFIG.seoTitle
      : `${effectiveShopName.value} - Ẩm Thực Việt Tại Philippines`),
)
const effectiveSeoDesc = computed(
  () => seoDescInput.value.trim() || DEFAULT_SEO_CONFIG.seoDescription,
)
const effectiveSeoH1 = computed(
  () => seoH1Input.value.trim() || DEFAULT_SEO_CONFIG.seoH1,
)
const seoTitleMeter = computed(() => getSeoMeter(seoTitleInput.value.trim().length, 30, 60, 70))
const seoDescMeter = computed(() => getSeoMeter(seoDescInput.value.trim().length, 100, 160, 180))
const seoH1Meter = computed(() => getSeoMeter(seoH1Input.value.trim().length, 20, 70, 90))

const hasChanges = computed(() => {
  if (
    slots.value.main.file ||
    slots.value.favicon.file ||
    slots.value.mobile.file ||
    slots.value.share.file
  ) {
    return true
  }
  return (
    nameInput.value.trim() !== savedState.value.name ||
    shortNameInput.value.trim() !== savedState.value.shortName ||
    shopAddressInput.value.trim() !== savedState.value.shopAddress ||
    mapUrlInput.value.trim() !== savedState.value.mapUrl ||
    seoTitleInput.value.trim() !== savedState.value.seoTitle ||
    seoDescInput.value.trim() !== savedState.value.seoDescription ||
    seoH1Input.value.trim() !== savedState.value.seoH1 ||
    seoIntroInput.value.trim() !== savedState.value.seoIntro ||
    seoKeywordsInput.value.trim() !== savedState.value.seoKeywords ||
    slots.value.main.url !== savedState.value.logoUrl ||
    slots.value.favicon.url !== savedState.value.faviconUrl ||
    slots.value.mobile.url !== savedState.value.mobileIconUrl ||
    slots.value.share.url !== savedState.value.shareImageUrl
  )
})

const canSave = computed(
  () => Boolean(nameInput.value.trim()) && hasMainImage.value && hasChanges.value && !saving.value,
)

async function loadData() {
  loading.value = true
  try {
    const json = await getOneSheet('logo')
    const row = json?.data?.[0] || null
    logoRow.value = row

    const resolved = resolveBrandAssets(row, '')
    savedState.value = {
      name: String(row?.Name || '').trim(),
      shortName: String(row?.Short_Name || '').trim(),
      shopAddress:
        row?.Shop_Address !== undefined && row?.Shop_Address !== null
          ? String(row.Shop_Address).trim()
          : DEFAULT_SEO_CONFIG.shopAddress,
      mapUrl: String(row?.Map_URL || '').trim(),
      logoUrl: String(row?.URL || '').trim(),
      faviconUrl: String(row?.Favicon_URL || '').trim(),
      mobileIconUrl: String(row?.Mobile_Icon_URL || '').trim(),
      shareImageUrl: String(row?.Share_Image_URL || '').trim(),
      seoTitle: String(row?.SEO_Title || '').trim(),
      seoDescription: String(row?.SEO_Description || '').trim(),
      seoH1: String(row?.SEO_H1 || '').trim(),
      seoIntro:
        row?.SEO_Intro !== undefined && row?.SEO_Intro !== null
          ? String(row.SEO_Intro).trim()
          : DEFAULT_SEO_CONFIG.seoIntro,
      seoKeywords: String(row?.SEO_Keywords || '').trim(),
    }
    resetDraft()

    if (resolved.logoUrl) {
      try {
        localStorage.setItem('NCC_LOGO', resolved.logoUrl)
        if (resolved.name) localStorage.setItem('NCC_NAME', resolved.name)
      } catch {}
    }
  } catch (e) {
    console.error('Lỗi tải dữ liệu logo:', e)
    showToast('Không tải được cấu hình Logo & Biểu tượng', 'error')
  } finally {
    loading.value = false
  }
}

async function uploadSlotIfNeeded(key, options) {
  const slot = slots.value[key]
  if (!slot.file) return slot.url
  const uploadedUrl = await uploadImageToCloudinary(slot.file, options)
  if (!uploadedUrl) {
    throw new Error(`Upload ảnh (${key}) thất bại`)
  }
  return uploadedUrl
}

async function saveAll() {
  if (!nameInput.value.trim()) {
    showToast('Vui lòng nhập Tên Shop', 'error')
    return
  }
  if (!hasMainImage.value) {
    showToast('Vui lòng chọn Ảnh Logo chính', 'error')
    return
  }
  if (!hasChanges.value || saving.value) return

  saving.value = true
  try {
    const [mainUrl, faviconUrl, mobileIconUrl, shareImageUrl] = await Promise.all([
      uploadSlotIfNeeded('main', {
        targetKB: 120,
        maxWidth: 1000,
        maxHeight: 1000,
        folder: 'sakitchen/logo',
        preserveTransparency: true,
      }),
      uploadSlotIfNeeded('favicon', {
        targetKB: 80,
        maxWidth: 512,
        maxHeight: 512,
        folder: 'sakitchen/logo',
        preserveTransparency: true,
      }),
      uploadSlotIfNeeded('mobile', {
        targetKB: 120,
        maxWidth: 512,
        maxHeight: 512,
        folder: 'sakitchen/logo',
        preserveTransparency: false,
      }),
      uploadSlotIfNeeded('share', {
        targetKB: 160,
        maxWidth: 1200,
        maxHeight: 630,
        folder: 'sakitchen/logo',
        preserveTransparency: false,
      }),
    ])

    const res = await dispatchAction({
      action: 'upsertLogo',
      data: {
        ID: logoRow.value?.ID || genLogoId(),
        URL: mainUrl,
        Name: nameInput.value.trim(),
        Short_Name: shortNameInput.value.trim(),
        Shop_Address: shopAddressInput.value.trim(),
        Map_URL: mapUrlInput.value.trim(),
        Favicon_URL: faviconUrl,
        Mobile_Icon_URL: mobileIconUrl,
        Share_Image_URL: shareImageUrl,
        SEO_Title: seoTitleInput.value.trim(),
        SEO_Description: seoDescInput.value.trim(),
        SEO_H1: seoH1Input.value.trim(),
        SEO_Intro: seoIntroInput.value.trim(),
        SEO_Keywords: seoKeywordsInput.value.trim(),
      },
    })

    if (!res?.success) {
      throw new Error(res?.message || 'Không thể lưu cấu hình thương hiệu')
    }

    await loadData()
    showToast('Đã lưu & đồng bộ Thương hiệu, Biểu tượng và SEO Google!', 'success')
  } catch (e) {
    console.error('Lỗi lưu logo & biểu tượng:', e)
    showToast('Lỗi lưu cấu hình: ' + (e?.message || 'Vui lòng thử lại'), 'error')
  } finally {
    saving.value = false
  }
}

onMounted(loadData)

let hasMountedLogoOnce = false
onActivated(() => {
  if (!hasMountedLogoOnce) {
    hasMountedLogoOnce = true
    return
  }
  if (!hasChanges.value && !saving.value) {
    loadData()
  }
})

onUnmounted(() => {
  if (toastTimer) clearTimeout(toastTimer)
  for (const k of Object.keys(slots.value)) {
    revokeSlotPreview(k)
  }
})
</script>

<template>
  <div class="admin-page">
    <!-- TOAST -->
    <Transition name="toast-fade">
      <div v-if="toast.message" class="brand-toast" :class="`is-${toast.type}`">
        <i :class="toast.type === 'error' ? 'ri-error-warning-fill' : 'ri-checkbox-circle-fill'"></i>
        <span>{{ toast.message }}</span>
      </div>
    </Transition>

    <!-- HEADER -->
    <div class="page-header">
      <div class="header-content">
        <div>
          <h1 class="brand-page-title">QUẢN LÝ THƯƠNG HIỆU &amp; SEO WEB</h1>
          <p class="page-subtitle">
            Cấu hình Logo, Favicon, Icon điện thoại, Ảnh chia sẻ link và SEO On-Page (Title, Thẻ H1, Meta Description) chuẩn Google
          </p>
        </div>

        <div class="header-actions">
          <button
            v-if="hasChanges"
            type="button"
            class="btn btn-secondary"
            :disabled="saving"
            @click="resetDraft"
          >
            <i class="ri-arrow-go-back-line"></i>
            <span>Hoàn tác</span>
          </button>

          <button
            type="button"
            class="btn btn-success"
            :disabled="!canSave"
            @click="saveAll"
          >
            <span v-if="saving" class="btn-loading">
              <span class="spinner"></span>
              <span>Đang tải &amp; lưu...</span>
            </span>
            <template v-else>
              <i class="ri-save-3-line"></i>
              <span>Lưu &amp; Áp dụng</span>
            </template>
          </button>
        </div>
      </div>
    </div>

    <!-- UNSAVED BAR -->
    <div v-if="hasChanges && !loading" class="unsaved-banner">
      <div class="unsaved-left">
        <i class="ri-sparkling-line"></i>
        <span>Bạn có thay đổi chưa lưu. Kiểm tra khung Xem trước bên dưới rồi bấm <strong>Lưu &amp; Áp dụng</strong>.</span>
      </div>
      <button type="button" class="btn-mini-save" :disabled="!canSave" @click="saveAll">
        {{ saving ? 'Đang lưu...' : 'Lưu ngay' }}
      </button>
    </div>

    <!-- LOADING -->
    <div v-if="loading" class="card">
      <div class="card-body">
        <div class="table-loading">
          <div class="table-loading-spinner"></div>
          <div class="table-loading-text">Đang tải cấu hình nhận diện thương hiệu...</div>
        </div>
      </div>
    </div>

    <template v-else>
      <!-- CARD 1: THÔNG TIN THƯƠNG HIỆU -->
      <div class="card">
        <div class="card-header">
          <h3 class="card-title"><i class="ri-store-2-line"></i> Thông tin tên thương hiệu</h3>
          <span v-if="logoRow" class="badge-active">Đang hoạt động</span>
        </div>
        <div class="card-body">
          <div class="name-grid">
            <div class="form-group no-margin">
              <label class="form-label" for="brand-shop-name">Tên Shop (Header &amp; Tiêu đề tab) *</label>
              <input
                id="brand-shop-name"
                v-model="nameInput"
                type="text"
                class="form-input"
                placeholder="VD: SA KITCHEN"
                maxlength="100"
              />
            </div>

            <div class="form-group no-margin">
              <label class="form-label" for="brand-short-name">Tên ngắn dưới Icon điện thoại (không bắt buộc)</label>
              <input
                id="brand-short-name"
                v-model="shortNameInput"
                type="text"
                class="form-input"
                placeholder="VD: SA KITCHEN (để trống tự lấy Tên Shop)"
                maxlength="32"
              />
            </div>

            <div class="form-group no-margin">
              <label class="form-label" for="brand-shop-address">Vị trí / Khu vực phục vụ (Footer PC &amp; Local SEO)</label>
              <input
                id="brand-shop-address"
                v-model="shopAddressInput"
                type="text"
                class="form-input"
                placeholder="VD: Manila · Pasay · Makati, Philippines"
                maxlength="200"
              />
            </div>

            <div class="form-group no-margin">
              <label class="form-label" for="brand-map-url">Link Google Maps (không bắt buộc)</label>
              <input
                id="brand-map-url"
                v-model="mapUrlInput"
                type="url"
                class="form-input"
                placeholder="VD: https://maps.app.goo.gl/..."
                maxlength="300"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- CARD 2: 4 BỘ ẢNH NHẬN DIỆN -->
      <div class="card">
        <div class="card-header">
          <div>
            <h3 class="card-title"><i class="ri-image-2-line"></i> 4 Ảnh nhận diện Web &amp; Điện thoại</h3>
            <p class="card-sub">
              Chỉ bắt buộc tải <strong>Logo chính</strong>. 3 mục còn lại nếu để trống sẽ tự động dùng theo Logo chính.
            </p>
          </div>
        </div>
        <div class="card-body">
          <div class="assets-grid">
            <!-- 1. MAIN LOGO -->
            <div class="asset-box">
              <div class="asset-head">
                <div class="asset-title-wrap">
                  <span class="asset-ico is-main"><i class="ri-award-fill"></i></span>
                  <div>
                    <div class="asset-title">1. Logo Chính (Header &amp; Intro)</div>
                    <div class="asset-sub">Hiển thị trên thanh tiêu đề &amp; màn hình chào</div>
                  </div>
                </div>
                <span class="asset-tag is-required">Bắt buộc</span>
              </div>

              <div class="asset-dropzone is-checker" @click="triggerFilePick('main')">
                <img
                  v-if="hasMainImage"
                  :src="slots.main.preview || slots.main.url"
                  alt="Logo chính"
                  class="asset-preview is-square"
                />
                <div v-else class="asset-empty">
                  <i class="ri-image-add-line"></i>
                  <span>Bấm để tải Logo chính</span>
                </div>
                <div class="asset-hover-mask">
                  <i class="ri-upload-2-line"></i>
                  <span>{{ hasMainImage ? 'Đổi ảnh Logo' : 'Chọn ảnh Logo' }}</span>
                </div>
                <input
                  ref="mainInputRef"
                  type="file"
                  accept="image/*"
                  hidden
                  @change="onSelectSlotFile('main', $event)"
                />
              </div>

              <div class="asset-hint">
                Chuẩn: <strong>500×500 – 1000×1000 px</strong> (vuông 1:1) · Hỗ trợ PNG nền trong suốt.
              </div>
              <div class="asset-footer">
                <button type="button" class="btn-slot-pick" @click="triggerFilePick('main')">
                  <i class="ri-upload-cloud-2-line"></i>
                  <span>{{ hasMainImage ? 'Đổi ảnh' : 'Chọn ảnh' }}</span>
                </button>
              </div>
            </div>

            <!-- 2. FAVICON -->
            <div class="asset-box">
              <div class="asset-head">
                <div class="asset-title-wrap">
                  <span class="asset-ico is-favicon"><i class="ri-window-fill"></i></span>
                  <div>
                    <div class="asset-title">2. Ảnh Favicon (Tab trình duyệt)</div>
                    <div class="asset-sub">Biểu tượng nhỏ trên tab Chrome, Safari &amp; Google</div>
                  </div>
                </div>
                <span class="asset-tag" :class="faviconDisplayUrl ? 'is-custom' : 'is-fallback'">
                  {{ faviconDisplayUrl ? 'Ảnh riêng' : 'Theo Logo chính' }}
                </span>
              </div>

              <div class="asset-dropzone is-checker" @click="triggerFilePick('favicon')">
                <img
                  v-if="faviconDisplayUrl"
                  :src="faviconDisplayUrl"
                  alt="Favicon"
                  class="asset-preview is-square"
                />
                <div v-else class="asset-fallback-box">
                  <img :src="mainPreviewUrl" alt="Fallback favicon" class="asset-preview-dim is-square" />
                  <span class="fallback-pill">Đang dùng ảnh Logo chính</span>
                </div>
                <div class="asset-hover-mask">
                  <i class="ri-upload-2-line"></i>
                  <span>Chọn ảnh Favicon riêng</span>
                </div>
                <input
                  ref="faviconInputRef"
                  type="file"
                  accept="image/*"
                  hidden
                  @change="onSelectSlotFile('favicon', $event)"
                />
              </div>

              <div class="asset-hint">
                Chuẩn: <strong>192×192 – 512×512 px</strong> (vuông 1:1) · Giữ nền trong suốt PNG, dễ nhìn khi thu nhỏ.
              </div>
              <div class="asset-footer">
                <button type="button" class="btn-slot-pick" @click="triggerFilePick('favicon')">
                  <i class="ri-upload-cloud-2-line"></i>
                  <span>{{ faviconDisplayUrl ? 'Đổi Favicon' : 'Tải Favicon riêng' }}</span>
                </button>
                <button
                  v-if="faviconDisplayUrl"
                  type="button"
                  class="btn-slot-reset"
                  @click="clearCustomSlot('favicon')"
                >
                  Dùng Logo chính
                </button>
              </div>
            </div>

            <!-- 3. MOBILE APP ICON -->
            <div class="asset-box">
              <div class="asset-head">
                <div class="asset-title-wrap">
                  <span class="asset-ico is-mobile"><i class="ri-smartphone-fill"></i></span>
                  <div>
                    <div class="asset-title">3. Logo Điện Thoại (iOS &amp; Android)</div>
                    <div class="asset-sub">Icon khi khách bấm "Thêm vào Màn hình chính"</div>
                  </div>
                </div>
                <span class="asset-tag" :class="mobileDisplayUrl ? 'is-custom' : 'is-fallback'">
                  {{ mobileDisplayUrl ? 'Ảnh riêng' : 'Theo Logo chính' }}
                </span>
              </div>

              <div class="asset-dropzone" @click="triggerFilePick('mobile')">
                <img
                  v-if="mobileDisplayUrl"
                  :src="mobileDisplayUrl"
                  alt="Logo điện thoại"
                  class="asset-preview is-squircle"
                />
                <div v-else class="asset-fallback-box">
                  <img :src="mainPreviewUrl" alt="Fallback mobile icon" class="asset-preview-dim is-squircle" />
                  <span class="fallback-pill">Đang dùng ảnh Logo chính</span>
                </div>
                <div class="asset-hover-mask">
                  <i class="ri-upload-2-line"></i>
                  <span>Chọn Logo điện thoại riêng</span>
                </div>
                <input
                  ref="mobileInputRef"
                  type="file"
                  accept="image/*"
                  hidden
                  @change="onSelectSlotFile('mobile', $event)"
                />
              </div>

              <div class="asset-hint">
                Chuẩn: <strong>512×512 px</strong> (vuông 1:1, <strong>nên có nền màu đặc kín khung</strong> để iPhone không tô đen viền). Tự xuất 180 / 192 / 512 px.
              </div>
              <div class="asset-footer">
                <button type="button" class="btn-slot-pick" @click="triggerFilePick('mobile')">
                  <i class="ri-upload-cloud-2-line"></i>
                  <span>{{ mobileDisplayUrl ? 'Đổi Icon ĐT' : 'Tải Icon ĐT riêng' }}</span>
                </button>
                <button
                  v-if="mobileDisplayUrl"
                  type="button"
                  class="btn-slot-reset"
                  @click="clearCustomSlot('mobile')"
                >
                  Dùng Logo chính
                </button>
              </div>
            </div>

            <!-- 4. SOCIAL SHARE IMAGE (OG:IMAGE) -->
            <div class="asset-box">
              <div class="asset-head">
                <div class="asset-title-wrap">
                  <span class="asset-ico is-share"><i class="ri-share-forward-fill"></i></span>
                  <div>
                    <div class="asset-title">4. Ảnh Chia Sẻ Link (Telegram / FB / Zalo)</div>
                    <div class="asset-sub">Ảnh thumbnail hiện ra khi gửi link sakitchen.shop</div>
                  </div>
                </div>
                <span class="asset-tag" :class="shareDisplayUrl ? 'is-custom' : 'is-fallback'">
                  {{ shareDisplayUrl ? 'Ảnh riêng' : 'Theo Logo chính' }}
                </span>
              </div>

              <div class="asset-dropzone" @click="triggerFilePick('share')">
                <img
                  v-if="shareDisplayUrl"
                  :src="shareDisplayUrl"
                  alt="Ảnh chia sẻ link"
                  class="asset-preview is-wide"
                />
                <div v-else class="asset-fallback-box">
                  <img :src="mainPreviewUrl" alt="Fallback share image" class="asset-preview-dim is-wide" />
                  <span class="fallback-pill">Đang dùng ảnh Logo chính</span>
                </div>
                <div class="asset-hover-mask">
                  <i class="ri-upload-2-line"></i>
                  <span>Chọn ảnh chia sẻ ngang 1200×630</span>
                </div>
                <input
                  ref="shareInputRef"
                  type="file"
                  accept="image/*"
                  hidden
                  @change="onSelectSlotFile('share', $event)"
                />
              </div>

              <div class="asset-hint">
                Chuẩn: <strong>1200×630 px</strong> (ảnh ngang tỉ lệ 1.91:1) · Hiện sắc nét khi gửi link qua Telegram, Facebook, Zalo.
              </div>
              <div class="asset-footer">
                <button type="button" class="btn-slot-pick" @click="triggerFilePick('share')">
                  <i class="ri-upload-cloud-2-line"></i>
                  <span>{{ shareDisplayUrl ? 'Đổi ảnh share' : 'Tải ảnh share riêng' }}</span>
                </button>
                <button
                  v-if="shareDisplayUrl"
                  type="button"
                  class="btn-slot-reset"
                  @click="clearCustomSlot('share')"
                >
                  Dùng Logo chính
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- CARD 3: CẤU HÌNH SEO ON-PAGE (GOOGLE & MẠNG XÃ HỘI) -->
      <div class="card">
        <div class="card-header">
          <div>
            <h3 class="card-title"><i class="ri-search-eye-line"></i> Cấu hình SEO On-Page (Google &amp; Mạng xã hội)</h3>
            <p class="card-sub">
              Đồng bộ trực tiếp từ Server HTML (Cloudflare Worker) giúp Google Search, Telegram, Facebook &amp; Zalo đọc chuẩn 100%.
            </p>
          </div>
          <button type="button" class="btn-slot-reset" @click="applyDefaultSeoTemplate">
            <i class="ri-magic-line"></i> Điền mẫu chuẩn SEO
          </button>
        </div>

        <div class="card-body">
          <div class="seo-fields-stack">
            <!-- SEO TITLE -->
            <div class="seo-field">
              <div class="seo-label-row">
                <label class="form-label no-mb" for="seo-title-input">
                  Tiêu đề SEO (Thẻ &lt;title&gt; &amp; og:title)
                </label>
                <span class="seo-meter-pill" :class="`is-${seoTitleMeter.state}`">
                  {{ seoTitleInput.trim().length }}/60 ký tự · {{ seoTitleMeter.label }}
                </span>
              </div>
              <input
                id="seo-title-input"
                v-model="seoTitleInput"
                type="text"
                class="form-input"
                :placeholder="DEFAULT_SEO_CONFIG.seoTitle"
                maxlength="120"
              />
              <div class="seo-bar">
                <div
                  class="seo-bar-fill"
                  :class="`is-${seoTitleMeter.state}`"
                  :style="{ width: `${seoTitleMeter.pct}%` }"
                ></div>
              </div>
              <div class="seo-field-hint">
                Chuẩn Google: <strong>30 – 60 ký tự</strong>. Chứa tên thương hiệu + từ khóa chính.
              </div>
            </div>

            <!-- META DESCRIPTION -->
            <div class="seo-field">
              <div class="seo-label-row">
                <label class="form-label no-mb" for="seo-desc-input">
                  Mô tả Meta Description (&lt;meta name="description"&gt;)
                </label>
                <span class="seo-meter-pill" :class="`is-${seoDescMeter.state}`">
                  {{ seoDescInput.trim().length }}/160 ký tự · {{ seoDescMeter.label }}
                </span>
              </div>
              <textarea
                id="seo-desc-input"
                v-model="seoDescInput"
                rows="3"
                class="form-input form-textarea"
                :placeholder="DEFAULT_SEO_CONFIG.seoDescription"
                maxlength="260"
              ></textarea>
              <div class="seo-bar">
                <div
                  class="seo-bar-fill"
                  :class="`is-${seoDescMeter.state}`"
                  :style="{ width: `${seoDescMeter.pct}%` }"
                ></div>
              </div>
              <div class="seo-field-hint">
                Chuẩn Google: <strong>100 – 160 ký tự</strong>. Hiện ngay bên dưới tiêu đề trên kết quả tìm kiếm Google &amp; thẻ gửi link Telegram/Zalo.
              </div>
            </div>

            <!-- H1 + INTRO GRID -->
            <div class="name-grid">
              <div class="seo-field">
                <div class="seo-label-row">
                  <label class="form-label no-mb" for="seo-h1-input">
                    Thẻ &lt;h1&gt; trang chủ (1 thẻ duy nhất)
                  </label>
                  <span class="seo-meter-pill" :class="`is-${seoH1Meter.state}`">
                    {{ seoH1Input.trim().length }}/70
                  </span>
                </div>
                <input
                  id="seo-h1-input"
                  v-model="seoH1Input"
                  type="text"
                  class="form-input"
                  :placeholder="DEFAULT_SEO_CONFIG.seoH1"
                  maxlength="140"
                />
                <div class="seo-field-hint">
                  Hiển thị tinh gọn ở hộp giới thiệu cuối trang Order để không chiếm diện tích màn hình đầu nhưng vẫn chuẩn SEO 100%.
                </div>
              </div>

              <div class="seo-field">
                <div class="seo-label-row">
                  <label class="form-label no-mb" for="seo-keywords-input">
                    Từ khóa SEO (Meta Keywords)
                  </label>
                </div>
                <input
                  id="seo-keywords-input"
                  v-model="seoKeywordsInput"
                  type="text"
                  class="form-input"
                  :placeholder="DEFAULT_SEO_CONFIG.seoKeywords"
                  maxlength="300"
                />
                <div class="seo-field-hint">
                  Phân tách bằng dấu phẩy (VD: <em>đồ ăn việt manila, cơm văn phòng, món nhậu manila</em>).
                </div>
              </div>
            </div>

            <!-- SHORT SEO INTRO BELOW H1 -->
            <div class="seo-field">
              <div class="seo-label-row">
                <label class="form-label no-mb" for="seo-intro-input">
                  Đoạn giới thiệu ngắn dưới thẻ &lt;h1&gt; cuối trang (không bắt buộc)
                </label>
              </div>
              <textarea
                id="seo-intro-input"
                v-model="seoIntroInput"
                rows="2"
                class="form-input form-textarea"
                :placeholder="DEFAULT_SEO_CONFIG.seoIntro"
                maxlength="320"
              ></textarea>
              <div class="seo-field-hint">
                Giúp Google hiểu rõ sản phẩm &amp; khu vực giao hàng (Manila, Pasay, Makati...). Để trống nếu chỉ muốn hiện mỗi dòng &lt;h1&gt;.
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- CARD 4: LIVE PREVIEW STRIP -->
      <div class="card">
        <div class="card-header">
          <h3 class="card-title"><i class="ri-eye-line"></i> Xem trước hiển thị thực tế</h3>
        </div>
        <div class="card-body">
          <div class="preview-strip is-4">
            <!-- 1. Google Search SERP Preview -->
            <div class="preview-tile">
              <div class="pt-label"><i class="ri-google-fill"></i> Kết quả tìm kiếm Google (SERP)</div>
              <div class="mock-serp">
                <div class="ms-head">
                  <div class="ms-fav-circle">
                    <img :src="effectiveFaviconPreview" alt="" class="ms-fav-img" />
                  </div>
                  <div class="ms-site-meta">
                    <div class="ms-site-name">{{ effectiveShopName }}</div>
                    <div class="ms-site-url">https://sakitchen.shop</div>
                  </div>
                </div>
                <div class="ms-title">{{ effectiveSeoTitle }}</div>
                <div class="ms-desc">{{ effectiveSeoDesc }}</div>
              </div>
            </div>

            <!-- 2. Browser Tab Preview -->
            <div class="preview-tile">
              <div class="pt-label"><i class="ri-chrome-line"></i> Tab trình duyệt (Favicon)</div>
              <div class="mock-browser">
                <div class="mb-tab-bar">
                  <div class="mb-tab-active">
                    <img :src="effectiveFaviconPreview" alt="" class="mb-tab-fav" />
                    <span class="mb-tab-text">{{ effectiveSeoTitle }}</span>
                    <span class="mb-tab-x">×</span>
                  </div>
                  <div class="mb-tab-plus">+</div>
                </div>
                <div class="mb-url-bar">
                  <i class="ri-lock-2-fill"></i>
                  <span>https://sakitchen.shop</span>
                </div>
              </div>
            </div>

            <!-- 3. Phone Home Screen Preview -->
            <div class="preview-tile">
              <div class="pt-label"><i class="ri-apple-fill"></i> Màn hình chính điện thoại</div>
              <div class="mock-phone-wall">
                <div class="mp-app-slot">
                  <div class="mp-app-icon-wrap">
                    <img :src="effectiveMobilePreview" alt="" class="mp-app-icon" />
                  </div>
                  <span class="mp-app-name">{{ effectiveShortName }}</span>
                </div>
              </div>
            </div>

            <!-- 4. Telegram / Social Link Preview -->
            <div class="preview-tile">
              <div class="pt-label"><i class="ri-telegram-fill"></i> Thẻ gửi link Telegram / Zalo</div>
              <div class="mock-tg-card">
                <div class="mtg-site">sakitchen.shop</div>
                <div class="mtg-title">{{ effectiveSeoTitle }}</div>
                <div class="mtg-desc">{{ effectiveSeoDesc }}</div>
                <div class="mtg-img-wrap">
                  <img :src="effectiveSharePreview" alt="" class="mtg-img" />
                </div>
              </div>
            </div>
          </div>

          <!-- 5. Homepage Bottom H1 + Intro Preview -->
          <div class="mock-h1-box">
            <div class="pt-label"><i class="ri-h-1"></i> Hộp thẻ &lt;h1&gt; chuẩn SEO cuối trang chủ</div>
            <div class="mh1-title">{{ effectiveSeoH1 }}</div>
            <div v-if="seoIntroInput.trim()" class="mh1-intro">{{ seoIntroInput.trim() }}</div>
          </div>

          <div class="cache-tip">
            <i class="ri-information-line"></i>
            <span>
              <strong>Mẹo thực tế:</strong> Thay đổi đồng bộ qua Cloudflare Worker trong ~1 phút. Đã tích hợp sẵn <code>/robots.txt</code>, <code>/sitemap.xml</code>, <code>/favicon-192.png</code> và tự chuyển <code>http → https</code> (301). Sau khi lưu, bạn có thể vào <strong>Google Search Console → Kiểm tra URL → Yêu cầu lập chỉ mục</strong> để Google cập nhật nhanh nhất; còn Telegram gửi link qua <code>@WebpageBot</code> để làm mới thumbnail ngay.
            </span>
          </div>
        </div>
      </div>
    </template>
  </div>
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
  color: #f8fafc;
}

/* TOAST */
.brand-toast {
  position: fixed;
  top: 20px;
  right: 24px;
  z-index: 9999;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 18px;
  border-radius: 12px;
  font-size: 13.5px;
  font-weight: 600;
  color: #ffffff;
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.35);
  max-width: min(460px, calc(100vw - 32px));
}
.brand-toast.is-success {
  background: #065f46;
  border: 1px solid rgba(52, 211, 153, 0.45);
}
.brand-toast.is-error {
  background: #991b1b;
  border: 1px solid rgba(248, 113, 113, 0.45);
}
.toast-fade-enter-active,
.toast-fade-leave-active {
  transition: opacity 0.22s ease, transform 0.22s ease;
}
.toast-fade-enter-from,
.toast-fade-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

/* HEADER */
.page-header {
  margin-bottom: 22px;
}

.header-content {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.brand-page-title {
  color: rgb(134, 239, 172);
  text-shadow: 0 0 10px rgba(34, 197, 94, 0.45);
  font-weight: 800;
  font-size: 24px;
  margin-bottom: 6px;
}

.page-subtitle {
  font-size: 13.5px;
  color: #cbd5e1;
  line-height: 1.45;
  max-width: 720px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

/* UNSAVED BAR */
.unsaved-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 16px;
  margin-bottom: 18px;
  border-radius: 12px;
  background: rgba(245, 158, 11, 0.14);
  border: 1px solid rgba(251, 191, 36, 0.35);
  color: #fef3c7;
  font-size: 13px;
}

.unsaved-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn-mini-save {
  padding: 7px 14px;
  border: none;
  border-radius: 8px;
  background: #10b981;
  color: #052e16;
  font-size: 12.5px;
  font-weight: 800;
  cursor: pointer;
  white-space: nowrap;
}

.btn-mini-save:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* CARD */
.card {
  background: rgba(30, 41, 59, 0.65);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(148, 163, 184, 0.14);
  border-radius: 16px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.22);
  overflow: hidden;
  margin-bottom: 20px;
}

.card-header {
  padding: 18px 22px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.12);
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
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

.card-sub {
  margin-top: 4px;
  font-size: 12.5px;
  color: #94a3b8;
}

.badge-active {
  background: rgba(16, 185, 129, 0.2);
  color: #34d399;
  padding: 4px 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
  border: 1px solid rgba(52, 211, 153, 0.35);
}

.card-body {
  padding: 22px;
}

/* FORM */
.name-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.form-group.no-margin {
  margin-bottom: 0;
}

.form-label {
  display: block;
  margin-bottom: 8px;
  font-weight: 700;
  color: #e2e8f0;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.45px;
}

.form-input {
  width: 100%;
  padding: 11px 14px;
  background: rgba(15, 23, 42, 0.65);
  border: 1px solid rgba(148, 163, 184, 0.25);
  border-radius: 10px;
  color: #ffffff;
  font-size: 14px;
  font-family: inherit;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.form-input::placeholder {
  color: #64748b;
}

.form-input:focus {
  outline: none;
  border-color: #34d399;
  box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.2);
}

/* 4 ASSET CARDS */
.assets-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
}

.asset-box {
  background: rgba(15, 23, 42, 0.55);
  border: 1px solid rgba(148, 163, 184, 0.16);
  border-radius: 14px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.asset-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
}

.asset-title-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.asset-ico {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  flex-shrink: 0;
}
.asset-ico.is-main {
  background: rgba(16, 185, 129, 0.2);
  color: #34d399;
}
.asset-ico.is-favicon {
  background: rgba(59, 130, 246, 0.2);
  color: #60a5fa;
}
.asset-ico.is-mobile {
  background: rgba(168, 85, 247, 0.2);
  color: #c084fc;
}
.asset-ico.is-share {
  background: rgba(245, 158, 11, 0.2);
  color: #fbbf24;
}

.asset-title {
  font-size: 14px;
  font-weight: 700;
  color: #ffffff;
}

.asset-sub {
  font-size: 12px;
  color: #94a3b8;
  margin-top: 2px;
}

.asset-tag {
  padding: 3px 9px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
  white-space: nowrap;
  flex-shrink: 0;
}
.asset-tag.is-required {
  background: rgba(16, 185, 129, 0.18);
  border: 1px solid rgba(52, 211, 153, 0.4);
  color: #6ee7b7;
}
.asset-tag.is-custom {
  background: rgba(59, 130, 246, 0.2);
  border: 1px solid rgba(96, 165, 250, 0.45);
  color: #93c5fd;
}
.asset-tag.is-fallback {
  background: rgba(148, 163, 184, 0.16);
  border: 1px solid rgba(148, 163, 184, 0.28);
  color: #cbd5e1;
}

.asset-dropzone {
  position: relative;
  height: 170px;
  border-radius: 12px;
  border: 1.5px dashed rgba(148, 163, 184, 0.3);
  background: rgba(30, 41, 59, 0.65);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  cursor: pointer;
  transition: border-color 0.2s ease, background 0.2s ease;
}

.asset-dropzone.is-checker {
  background-image:
    linear-gradient(45deg, rgba(148, 163, 184, 0.08) 25%, transparent 25%),
    linear-gradient(-45deg, rgba(148, 163, 184, 0.08) 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, rgba(148, 163, 184, 0.08) 75%),
    linear-gradient(-45deg, transparent 75%, rgba(148, 163, 184, 0.08) 75%);
  background-size: 18px 18px;
  background-position: 0 0, 0 9px, 9px -9px, -9px 0;
}

.asset-dropzone:hover {
  border-color: #34d399;
}

.asset-preview {
  max-width: 88%;
  max-height: 136px;
  object-fit: contain;
}
.asset-preview.is-square {
  width: 118px;
  height: 118px;
  border-radius: 12px;
}
.asset-preview.is-squircle {
  width: 114px;
  height: 114px;
  object-fit: cover;
  border-radius: 26px;
  box-shadow: 0 8px 22px rgba(0, 0, 0, 0.45);
}
.asset-preview.is-wide {
  width: 240px;
  height: 126px;
  object-fit: cover;
  border-radius: 10px;
  box-shadow: 0 8px 22px rgba(0, 0, 0, 0.4);
}

.asset-fallback-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.asset-preview-dim {
  opacity: 0.55;
  object-fit: cover;
}
.asset-preview-dim.is-square {
  width: 84px;
  height: 84px;
  border-radius: 12px;
}
.asset-preview-dim.is-squircle {
  width: 84px;
  height: 84px;
  border-radius: 20px;
}
.asset-preview-dim.is-wide {
  width: 170px;
  height: 90px;
  border-radius: 8px;
}

.fallback-pill {
  font-size: 11.5px;
  color: #cbd5e1;
  background: rgba(15, 23, 42, 0.78);
  padding: 3px 10px;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.25);
}

.asset-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  color: #94a3b8;
  font-size: 13px;
}
.asset-empty i {
  font-size: 32px;
}

.asset-hover-mask {
  position: absolute;
  inset: 0;
  background: rgba(15, 23, 42, 0.76);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  color: #ffffff;
  font-size: 13px;
  font-weight: 700;
  opacity: 0;
  transition: opacity 0.2s ease;
}
.asset-hover-mask i {
  font-size: 22px;
}
.asset-dropzone:hover .asset-hover-mask {
  opacity: 1;
}

.asset-hint {
  font-size: 12px;
  color: #93c5fd;
  line-height: 1.45;
  flex: 1;
}

.asset-footer {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.btn-slot-pick {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 13px;
  border-radius: 9px;
  border: 1px solid rgba(52, 211, 153, 0.42);
  background: rgba(16, 185, 129, 0.16);
  color: #a7f3d0;
  font-size: 12.5px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.18s ease;
}
.btn-slot-pick:hover {
  background: rgba(16, 185, 129, 0.3);
  color: #ffffff;
}

.btn-slot-reset {
  padding: 8px 11px;
  border-radius: 9px;
  border: 1px solid rgba(148, 163, 184, 0.26);
  background: rgba(51, 65, 85, 0.55);
  color: #cbd5e1;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.18s ease;
}
.btn-slot-reset:hover {
  background: rgba(239, 68, 68, 0.2);
  border-color: rgba(248, 113, 113, 0.45);
  color: #fecaca;
}

/* SEO ON-PAGE FORM */
.seo-fields-stack {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.seo-field {
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.seo-label-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
}

.form-label.no-mb {
  margin-bottom: 0;
}

.form-textarea {
  resize: vertical;
  min-height: 70px;
  line-height: 1.5;
}

.seo-meter-pill {
  padding: 2px 9px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
  white-space: nowrap;
}
.seo-meter-pill.is-good {
  background: rgba(16, 185, 129, 0.2);
  border: 1px solid rgba(52, 211, 153, 0.45);
  color: #6ee7b7;
}
.seo-meter-pill.is-warn {
  background: rgba(245, 158, 11, 0.18);
  border: 1px solid rgba(251, 191, 36, 0.4);
  color: #fde68a;
}
.seo-meter-pill.is-bad {
  background: rgba(239, 68, 68, 0.2);
  border: 1px solid rgba(248, 113, 113, 0.45);
  color: #fca5a5;
}

.seo-bar {
  width: 100%;
  height: 4px;
  border-radius: 999px;
  background: rgba(148, 163, 184, 0.18);
  overflow: hidden;
}

.seo-bar-fill {
  height: 100%;
  border-radius: 999px;
  transition: width 0.2s ease, background-color 0.2s ease;
}
.seo-bar-fill.is-good {
  background: #10b981;
}
.seo-bar-fill.is-warn {
  background: #f59e0b;
}
.seo-bar-fill.is-bad {
  background: #ef4444;
}

.seo-field-hint {
  font-size: 12px;
  color: #94a3b8;
  line-height: 1.45;
}

/* LIVE PREVIEW STRIP */
.preview-strip {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}

.preview-strip.is-4 {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

/* Mock Google Search SERP */
.mock-serp {
  background: #202124;
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 10px;
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.ms-head {
  display: flex;
  align-items: center;
  gap: 10px;
}

.ms-fav-circle {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #ffffff;
  border: 1px solid rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  flex-shrink: 0;
}

.ms-fav-img {
  width: 22px;
  height: 22px;
  object-fit: contain;
}

.ms-site-meta {
  min-width: 0;
  line-height: 1.25;
}

.ms-site-name {
  font-size: 12.5px;
  font-weight: 600;
  color: #e8eaed;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.ms-site-url {
  font-size: 11px;
  color: #bdc1c6;
}

.ms-title {
  font-size: 15px;
  font-weight: 500;
  color: #8ab4f8;
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.ms-desc {
  font-size: 12px;
  color: #bdc1c6;
  line-height: 1.45;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.mtg-desc {
  font-size: 11px;
  color: #cbd5e1;
  line-height: 1.35;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.preview-tile {
  background: rgba(15, 23, 42, 0.65);
  border: 1px solid rgba(148, 163, 184, 0.15);
  border-radius: 12px;
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.pt-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 700;
  color: #93c5fd;
  text-transform: uppercase;
  letter-spacing: 0.4px;
}

/* Mock Browser Tab */
.mock-browser {
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid rgba(148, 163, 184, 0.2);
  background: #1e293b;
}

.mb-tab-bar {
  display: flex;
  align-items: flex-end;
  gap: 6px;
  padding: 8px 8px 0;
  background: #0f172a;
}

.mb-tab-active {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 6px 10px;
  background: #1e293b;
  border-radius: 8px 8px 0 0;
  max-width: 190px;
  min-width: 0;
}

.mb-tab-fav {
  width: 16px;
  height: 16px;
  border-radius: 3px;
  object-fit: contain;
  flex-shrink: 0;
}

.mb-tab-text {
  font-size: 11.5px;
  font-weight: 600;
  color: #f8fafc;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.mb-tab-x,
.mb-tab-plus {
  font-size: 12px;
  color: #94a3b8;
  padding-bottom: 4px;
}

.mb-url-bar {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 10px;
  font-size: 11.5px;
  color: #cbd5e1;
  background: #1e293b;
}

/* Mock Phone Wallpaper */
.mock-phone-wall {
  flex: 1;
  min-height: 128px;
  border-radius: 12px;
  background: linear-gradient(145deg, #1e3a8a 0%, #0f172a 55%, #064e3b 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}

.mp-app-slot {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.mp-app-icon-wrap {
  width: 62px;
  height: 62px;
  border-radius: 15px;
  overflow: hidden;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.45);
  background: #ffffff;
}

.mp-app-icon {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.mp-app-name {
  font-size: 11.5px;
  font-weight: 600;
  color: #ffffff;
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.7);
  max-width: 96px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Mock Telegram Card */
.mock-tg-card {
  border-left: 3px solid #38bdf8;
  background: rgba(56, 189, 248, 0.08);
  border-radius: 0 10px 10px 0;
  padding: 9px 10px;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.mtg-site {
  font-size: 11px;
  font-weight: 700;
  color: #38bdf8;
}

.mtg-title {
  font-size: 12px;
  font-weight: 700;
  color: #f8fafc;
  line-height: 1.3;
}

.mtg-img-wrap {
  width: 100%;
  aspect-ratio: 1.91 / 1;
  border-radius: 7px;
  overflow: hidden;
  background: #0f172a;
  margin-top: 2px;
}

.mtg-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.mock-h1-box {
  margin-top: 16px;
  padding: 14px 18px;
  border-radius: 12px;
  background: rgba(15, 23, 42, 0.65);
  border: 1px solid rgba(148, 163, 184, 0.16);
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.mh1-title {
  font-size: 14.5px;
  font-weight: 800;
  color: #f8fafc;
}

.mh1-intro {
  max-width: 680px;
  font-size: 12.5px;
  color: #94a3b8;
  line-height: 1.5;
}

.cache-tip {
  margin-top: 16px;
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 11px 14px;
  border-radius: 10px;
  background: rgba(59, 130, 246, 0.12);
  border: 1px solid rgba(96, 165, 250, 0.25);
  font-size: 12.5px;
  color: #cbd5e1;
  line-height: 1.5;
}
.cache-tip i {
  color: #60a5fa;
  font-size: 16px;
  margin-top: 1px;
  flex-shrink: 0;
}
.cache-tip code {
  background: rgba(15, 23, 42, 0.7);
  color: #93c5fd;
  padding: 1px 5px;
  border-radius: 4px;
}

/* BUTTONS & LOADING */
.btn {
  padding: 11px 20px;
  border: none;
  border-radius: 10px;
  font-weight: 700;
  font-size: 13.5px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  min-height: 42px;
}
.btn:disabled {
  opacity: 0.48;
  cursor: not-allowed;
}
.btn-success {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: #ffffff;
  box-shadow: 0 4px 16px rgba(16, 185, 129, 0.3);
}
.btn-success:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 6px 22px rgba(16, 185, 129, 0.42);
}
.btn-secondary {
  background: rgba(51, 65, 85, 0.7);
  color: #ffffff;
  border: 1px solid rgba(148, 163, 184, 0.25);
}
.btn-secondary:hover:not(:disabled) {
  background: rgba(51, 65, 85, 0.92);
}
.btn-loading {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
.spinner {
  width: 15px;
  height: 15px;
  border: 2px solid rgba(255, 255, 255, 0.35);
  border-top-color: #ffffff;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

.table-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 64px 20px;
  gap: 16px;
}
.table-loading-spinner {
  width: 44px;
  height: 44px;
  border: 4px solid rgba(59, 130, 246, 0.2);
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
.table-loading-text {
  font-size: 14px;
  font-weight: 600;
  color: #cbd5e1;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* RESPONSIVE */
@media (max-width: 1024px) {
  .preview-strip,
  .preview-strip.is-4 {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .admin-page {
    padding: 16px 16px calc(96px + env(safe-area-inset-bottom));
  }
  .brand-page-title {
    font-size: 20px;
  }
  .header-actions {
    width: 100%;
  }
  .header-actions .btn {
    flex: 1;
  }
  .name-grid,
  .assets-grid {
    grid-template-columns: 1fr;
  }
  .card-header,
  .card-body {
    padding: 16px;
  }
  .unsaved-banner {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
