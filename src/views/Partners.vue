<script setup>
import { ref, computed, onMounted, onActivated } from 'vue'
import { getOneSheet, dispatchAction } from '@/config/api'
import { uploadImageToCloudinary } from '@/utils/imageUpload.js'
import { normalizeBannerLink, formatBannerLinkShort } from '@/utils/bannerLink.js'
import {
  PARTNER_COLOR_PRESETS,
  normalizePartnerHexColor,
  resolvePartnerBaseColor,
  getPartnerCardStyle,
} from '@/utils/partnerColor.js'

/* ================= STATE ================= */
const partners = ref([])
const loading = ref(false)
const tableLoading = ref(true)
const togglingId = ref('')
const reordering = ref(false)
const previewDevice = ref('pc') // 'pc' | 'mobile'

const BADGE_PRESETS = ['24/7', 'HOT', 'MỚI', 'Cùng hệ thống', 'Freeship']

/* ADD FORM */
const form = ref({
  Name: '',
  Subtitle: '',
  Direct_link: '',
  Badge: '',
  Bg_color: '',
  Active: true,
  file: null,
  preview: '',
})

/* EDIT MODAL */
const showEdit = ref(false)
const editing = ref(null)

function isPartnerActive(p) {
  if (!p) return false
  if (p.Active === undefined || p.Active === null || p.Active === '') return true
  const v = p.Active
  if (v === false || v === 0 || v === '0' || String(v).toLowerCase() === 'false') return false
  return true
}

function clearStorefrontCache() {
  try {
    localStorage.removeItem('MENU_CACHE_SA_UNIFIED')
  } catch {
    // ignore storage errors
  }
}

function genId() {
  const d = new Date()
  const p = (n) => String(n).padStart(2, '0')
  return (
    'PT' +
    p(d.getDate()) +
    p(d.getMonth() + 1) +
    d.getFullYear() +
    p(d.getMinutes()) +
    p(d.getSeconds()) +
    Math.random().toString(36).slice(2, 5).toUpperCase()
  )
}

async function uploadPartnerImage(file) {
  return uploadImageToCloudinary(file, {
    targetKB: 90,
    maxWidth: 512,
    maxHeight: 512,
    folder: 'sakitchen/partners',
  })
}

const sortedPartners = computed(() => {
  return [...(partners.value || [])]
    .map((item, idx) => ({ item, idx }))
    .sort((a, b) => {
      const oa = Number.isFinite(Number(a.item.Sort_order)) ? Number(a.item.Sort_order) : 9999 + a.idx
      const ob = Number.isFinite(Number(b.item.Sort_order)) ? Number(b.item.Sort_order) : 9999 + b.idx
      if (oa !== ob) return oa - ob
      return a.idx - b.idx
    })
    .map((entry) => entry.item)
})

const activeCount = computed(() => sortedPartners.value.filter((p) => isPartnerActive(p)).length)

const livePreviewItems = computed(() => {
  const activeExisting = sortedPartners.value
    .filter((p) => isPartnerActive(p) && normalizeBannerLink(p.Direct_link))
    .map((p) => ({
      id: p.ID,
      name: p.Name,
      sub: p.Subtitle,
      badge: p.Badge,
      color: p.Bg_color,
      img: p.URL_img,
      isDraft: false,
    }))

  const hasDraft =
    form.value.Active &&
    (form.value.Name.trim() || form.value.preview || form.value.Subtitle.trim() || form.value.Bg_color)

  if (hasDraft) {
    activeExisting.push({
      id: '__draft__',
      name: form.value.Name.trim() || 'Tên đối tác mới',
      sub: form.value.Subtitle.trim() || 'Mô tả ngắn hiển thị trên PC',
      badge: form.value.Badge.trim(),
      color: form.value.Bg_color,
      img: form.value.preview,
      isDraft: true,
    })
  }

  return activeExisting
})

/* ================= LOAD ================= */
async function loadData() {
  tableLoading.value = true
  try {
    const json = await getOneSheet('partners')
    partners.value = [...(json.data || [])]
  } finally {
    tableLoading.value = false
  }
}

/* ================= FORM ================= */
function onFileChange(e) {
  const f = e.target.files?.[0]
  if (!f) return

  if (!f.type.startsWith('image/')) {
    alert('Vui lòng chọn file ảnh')
    return
  }

  if (f.size > 25 * 1024 * 1024) {
    alert('Kích thước ảnh tối đa 25MB')
    return
  }

  form.value.file = f
  form.value.preview = URL.createObjectURL(f)
}

function resetForm() {
  form.value = {
    Name: '',
    Subtitle: '',
    Direct_link: '',
    Badge: '',
    Bg_color: '',
    Active: true,
    file: null,
    preview: '',
  }
}

/* ================= CRUD ================= */
async function addPartner() {
  const name = form.value.Name.trim()
  const normalizedUrl = normalizeBannerLink(form.value.Direct_link)

  if (!name) {
    alert('Vui lòng nhập tên đối tác / website')
    return
  }

  if (!normalizedUrl) {
    alert('Đường dẫn không hợp lệ. Vui lòng nhập link website hoặc trang cá nhân (VD: https://... hoặc t.me/...)')
    return
  }

  if (!form.value.file) {
    alert('Vui lòng chọn ảnh / logo đối tác')
    return
  }

  loading.value = true
  try {
    const img = await uploadPartnerImage(form.value.file)

    const res = await dispatchAction({
      action: 'addPartner',
      data: {
        ID: genId(),
        Name: name,
        Subtitle: form.value.Subtitle.trim(),
        Badge: form.value.Badge.trim(),
        Bg_color: normalizePartnerHexColor(form.value.Bg_color),
        URL_img: img,
        Direct_link: normalizedUrl,
        Active: Boolean(form.value.Active),
        Sort_order: sortedPartners.value.length + 1,
      },
    })

    if (!res?.success) throw new Error(res?.message || 'Lỗi thêm đối tác')

    clearStorefrontCache()
    resetForm()
    await loadData()
  } catch {
    alert('Lỗi thêm đối tác')
  } finally {
    loading.value = false
  }
}

function openEdit(p) {
  editing.value = {
    ...p,
    Name: String(p.Name || ''),
    Subtitle: String(p.Subtitle || ''),
    Badge: String(p.Badge || ''),
    Bg_color: normalizePartnerHexColor(p.Bg_color),
    Direct_link: String(p.Direct_link || ''),
    Active: isPartnerActive(p),
    file: null,
    preview: p.URL_img || '',
  }
  showEdit.value = true
}

function closeEdit() {
  showEdit.value = false
  editing.value = null
}

function onEditFile(e) {
  const f = e.target.files?.[0]
  if (!f) return

  if (!f.type.startsWith('image/')) {
    alert('Vui lòng chọn file ảnh')
    return
  }

  if (f.size > 25 * 1024 * 1024) {
    alert('Kích thước ảnh tối đa 25MB')
    return
  }

  editing.value.file = f
  editing.value.preview = URL.createObjectURL(f)
}

async function saveEdit() {
  if (!editing.value) return
  const name = String(editing.value.Name || '').trim()
  const normalizedUrl = normalizeBannerLink(editing.value.Direct_link)

  if (!name) {
    alert('Vui lòng nhập tên đối tác / website')
    return
  }

  if (!normalizedUrl) {
    alert('Đường dẫn không hợp lệ. Vui lòng kiểm tra lại link (VD: https://... hoặc t.me/...)')
    return
  }

  loading.value = true
  try {
    let img = editing.value.URL_img || ''
    if (editing.value.file) {
      img = await uploadPartnerImage(editing.value.file)
    }

    const res = await dispatchAction({
      action: 'updatePartner',
      data: {
        ID: editing.value.ID,
        Name: name,
        Subtitle: String(editing.value.Subtitle || '').trim(),
        Badge: String(editing.value.Badge || '').trim(),
        Bg_color: normalizePartnerHexColor(editing.value.Bg_color),
        URL_img: img,
        Direct_link: normalizedUrl,
        Active: Boolean(editing.value.Active),
      },
    })

    if (!res?.success) throw new Error(res?.message || 'Lỗi cập nhật')

    clearStorefrontCache()
    closeEdit()
    await loadData()
  } catch {
    alert('Lỗi cập nhật đối tác')
  } finally {
    loading.value = false
  }
}

async function toggleActive(p) {
  if (!p?.ID || togglingId.value) return
  const nextVal = !isPartnerActive(p)

  if (nextVal && !normalizeBannerLink(p.Direct_link)) {
    alert('Đối tác này chưa có đường dẫn hợp lệ. Vui lòng cập nhật đường dẫn trước khi bật.')
    openEdit({ ...p, Active: true })
    return
  }

  togglingId.value = p.ID
  try {
    await dispatchAction({
      action: 'updatePartner',
      data: {
        ID: p.ID,
        Active: nextVal,
      },
    })
    clearStorefrontCache()
    await loadData()
  } catch {
    alert('Lỗi cập nhật trạng thái hiển thị')
  } finally {
    togglingId.value = ''
  }
}

async function movePartner(index, delta) {
  const list = [...sortedPartners.value]
  const targetIdx = index + delta
  if (reordering.value || targetIdx < 0 || targetIdx >= list.length) return

  const temp = list[index]
  list[index] = list[targetIdx]
  list[targetIdx] = temp

  // Optimistic update
  partners.value = list.map((item, idx) => ({
    ...item,
    Sort_order: idx + 1,
  }))

  reordering.value = true
  try {
    await dispatchAction({
      action: 'reorderPartners',
      ids: list.map((item) => item.ID),
    })
    clearStorefrontCache()
  } catch {
    alert('Lỗi sắp xếp vị trí đối tác')
    await loadData()
  } finally {
    reordering.value = false
  }
}

async function deletePartner(id) {
  if (!confirm('Xóa đối tác này khỏi danh sách?')) return

  try {
    await dispatchAction({
      action: 'deletePartner',
      ID: id,
    })
    clearStorefrontCache()
    await loadData()
  } catch {
    alert('Lỗi xóa đối tác')
  }
}

/* ================= INIT ================= */
onMounted(loadData)

let hasMountedOnce = false
onActivated(() => {
  if (!hasMountedOnce) {
    hasMountedOnce = true
    return
  }
  loadData()
})
</script>

<template>
  <div class="admin-page">
    <!-- HEADER -->
    <div class="page-header">
      <div class="header-content">
        <div>
          <h1 class="hero-admin-title">QUẢN LÝ ĐỐI TÁC &amp; HỆ SINH THÁI WEB</h1>
          <p class="page-subtitle">
            Thêm link website hoặc trang cá nhân của các dịch vụ cùng hệ thống (Tạp hóa, Đi chợ hộ...) hiển thị căn giữa ngay phía trên 3 thẻ Check Scam, đồng thời hiện trong Sidebar trái &amp; Cột 1 Footer trên PC
          </p>
        </div>
      </div>
    </div>

    <!-- LIVE CENTERED VIBRANT STOREFRONT PREVIEW -->
    <div v-if="livePreviewItems.length" class="card preview-showcase-card">
      <div class="card-header">
        <h3 class="card-title">
          <i class="ri-eye-fill" style="color: #34d399;"></i>
          Xem trước trên trang Order ({{ livePreviewItems.length }} thẻ)
        </h3>
        <div class="device-switch">
          <button
            type="button"
            class="device-btn"
            :class="{ active: previewDevice === 'pc' }"
            @click="previewDevice = 'pc'"
          >
            <i class="ri-computer-line"></i> PC
          </button>
          <button
            type="button"
            class="device-btn"
            :class="{ active: previewDevice === 'mobile' }"
            @click="previewDevice = 'mobile'"
          >
            <i class="ri-smartphone-line"></i> Mobile
          </button>
        </div>
      </div>

      <div class="card-body">
        <div class="mock-storefront-frame" :class="{ 'is-mobile-mock': previewDevice === 'mobile' }">
          <!-- Centered Vibrant Partner Cards (ABOVE 3 Check Scam Cards) -->
          <div
            class="mock-partner-row"
            :class="{
              'is-mobile': previewDevice === 'mobile',
              'is-count-1': previewDevice === 'mobile' && livePreviewItems.length === 1,
              'is-count-2': previewDevice === 'mobile' && livePreviewItems.length === 2,
              'is-compact-tiles': previewDevice === 'mobile' && livePreviewItems.length >= 3,
              'is-scrollable': livePreviewItems.length > 4,
            }"
            :style="{ '--preview-cols': Math.min(Math.max(livePreviewItems.length, 1), 4) }"
          >
            <div
              v-for="(item, idx) in livePreviewItems"
              :key="item.id"
              class="mock-partner-card"
              :class="{ 'is-draft': item.isDraft }"
              :style="getPartnerCardStyle(item.color, idx)"
            >
              <span
                v-if="item.badge && previewDevice === 'mobile' && livePreviewItems.length >= 2"
                class="mock-corner-badge"
              >
                {{ item.badge }}
              </span>
              <div class="mock-avatar">
                <img v-if="item.img" :src="item.img" alt="" />
                <i v-else class="ri-store-3-fill"></i>
              </div>
              <div class="mock-meta">
                <div class="mock-name-row">
                  <span class="mock-name">{{ item.name }}</span>
                  <span
                    v-if="item.badge && !(previewDevice === 'mobile' && livePreviewItems.length >= 2)"
                    class="mock-inline-badge"
                  >
                    {{ item.badge }}
                  </span>
                </div>
                <div
                  v-if="item.sub && !(previewDevice === 'mobile' && livePreviewItems.length >= 2)"
                  class="mock-sub"
                >
                  {{ item.sub }}
                </div>
              </div>
              <span
                v-if="!(previewDevice === 'mobile' && livePreviewItems.length >= 2)"
                class="mock-ext-box"
              >
                <i class="ri-arrow-right-up-line mock-ext"></i>
              </span>
            </div>
          </div>

          <!-- Clean 3 Check Scam Cards (BELOW Partner Cards) -->
          <div class="mock-scam-row">
            <div class="mock-scam-pill is-green">
              <i class="ri-shield-check-fill"></i>
              <span>Check STK</span>
            </div>
            <div class="mock-scam-pill is-amber">
              <i class="ri-store-2-fill"></i>
              <span>Xem quán ngon</span>
            </div>
            <div class="mock-scam-pill is-red">
              <i class="ri-alarm-warning-fill"></i>
              <span>Thông tin lừa đảo</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ADD PARTNER CARD -->
    <div class="card add-card">
      <div class="card-header">
        <h3 class="card-title">
          Thêm Đối tác / Web mới
          <i class="ri-links-fill" style="color: #4ade80;"></i>
        </h3>
      </div>

      <div class="card-body">
        <div class="form-grid">
          <div class="form-field">
            <label class="form-label">Tên đối tác / Dịch vụ *</label>
            <input
              v-model="form.Name"
              placeholder="VD: Tạp Hóa SA / Đi Chợ Hộ..."
              class="form-input"
              maxlength="40"
            />
            <div class="field-hint">Nên đặt ngắn gọn (2–4 chữ) để hiển thị 4 ô trên Mobile đẹp nhất</div>
          </div>

          <div class="form-field">
            <label class="form-label">Link Web hoặc Profile *</label>
            <input
              v-model="form.Direct_link"
              placeholder="VD: https://taphoasa.com hoặc t.me/..."
              class="form-input"
            />
            <div class="field-hint">Hỗ trợ link Website, Telegram, Facebook Page/Profile... (tự mở tab mới)</div>
          </div>

          <div class="form-field">
            <label class="form-label">Mô tả ngắn (hiển thị trên PC)</label>
            <input
              v-model="form.Subtitle"
              placeholder="VD: Đồ khô · Gia vị Việt · Giao nhanh"
              class="form-input"
              maxlength="60"
            />
          </div>

          <div class="form-field">
            <label class="form-label">Nhãn góc nhỏ (tùy chọn)</label>
            <input
              v-model="form.Badge"
              placeholder="VD: HOT, 24/7, MỚI... (để trống nếu không cần)"
              class="form-input"
              maxlength="16"
            />
            <div class="preset-chips">
              <button
                v-for="tag in BADGE_PRESETS"
                :key="tag"
                type="button"
                class="preset-chip"
                :class="{ active: form.Badge === tag }"
                @click="form.Badge = form.Badge === tag ? '' : tag"
              >
                {{ tag }}
              </button>
            </div>
          </div>

          <div class="form-field form-field-full">
            <label class="form-label">Màu nền thẻ Đối tác</label>
            <div class="color-picker-panel">
              <div class="color-swatches">
                <button
                  type="button"
                  class="auto-color-chip"
                  :class="{ active: !normalizePartnerHexColor(form.Bg_color) }"
                  title="Tự động phối màu theo vị trí"
                  @click="form.Bg_color = ''"
                >
                  <i class="ri-magic-line"></i>
                  <span>Tự động</span>
                </button>
                <button
                  v-for="preset in PARTNER_COLOR_PRESETS"
                  :key="preset.hex"
                  type="button"
                  class="color-swatch-btn"
                  :class="{ active: normalizePartnerHexColor(form.Bg_color) === preset.hex }"
                  :style="{ background: preset.hex }"
                  :title="`${preset.label} (${preset.hex})`"
                  @click="form.Bg_color = preset.hex"
                >
                  <i v-if="normalizePartnerHexColor(form.Bg_color) === preset.hex" class="ri-check-line"></i>
                </button>
              </div>
              <div class="custom-color-row">
                <label class="native-color-wrap" title="Chọn màu bất kỳ">
                  <input
                    type="color"
                    :value="resolvePartnerBaseColor(form.Bg_color, sortedPartners.length)"
                    class="native-color-input"
                    @input="form.Bg_color = $event.target.value"
                  />
                  <span class="native-color-label">
                    <i class="ri-palette-line"></i> Chọn màu tùy ý
                  </span>
                </label>
                <input
                  v-model="form.Bg_color"
                  placeholder="#0d9488 (để trống = Tự động)"
                  class="form-input hex-code-input"
                  maxlength="9"
                />
              </div>
            </div>
          </div>

          <div class="form-field form-field-full">
            <label class="form-label">Logo / Ảnh đại diện *</label>
            <input
              type="file"
              accept="image/*"
              @change="onFileChange"
              class="form-input"
            />
            <div class="upload-size-hint">
              Kích thước chuẩn: <strong>256 × 256 px – 512 × 512 px</strong> (ảnh vuông 1:1 tự bo góc) · Tự động nén nhẹ lên Cloudinary
            </div>
          </div>
        </div>

        <div
          class="allow-msg-toggle-box"
          :class="{ active: form.Active }"
          @click="form.Active = !form.Active"
        >
          <div class="allow-msg-meta">
            <div class="allow-msg-title">
              <i class="ri-eye-fill"></i>
              <span>Hiển thị ngay trên trang Order</span>
            </div>
            <div class="allow-msg-desc">
              Bật để khách thấy ngay phía trên 3 thẻ Check Scam. Có thể tạm ẩn bất cứ lúc nào ở bảng bên dưới.
            </div>
          </div>
          <button
            type="button"
            class="switch-pill"
            :class="{ active: form.Active }"
            :aria-pressed="form.Active"
            @click.stop="form.Active = !form.Active"
          >
            <span class="switch-knob"></span>
          </button>
        </div>

        <button
          @click="addPartner"
          :disabled="loading || !form.Name.trim() || !form.Direct_link.trim() || !form.file"
          class="btn btn-primary"
        >
          <span v-if="loading" class="btn-loading">
            <span class="spinner"></span>
            Đang thêm...
          </span>
          <span v-else>
            <i class="ri-add-circle-line"></i>
            Thêm Đối tác
          </span>
        </button>
      </div>
    </div>

    <!-- LIST -->
    <div class="card list-card">
      <div class="card-header">
        <h3 class="card-title">
          <i class="ri-list-ordered"></i>
          Danh sách Đối tác
        </h3>
        <div class="header-badges">
          <div v-if="activeCount > 0" class="msg-active-pill">
            <i class="ri-checkbox-circle-fill"></i>
            <span>Đang hiển thị: {{ activeCount }}/{{ sortedPartners.length }}</span>
          </div>
          <div v-else-if="sortedPartners.length" class="msg-empty-pill">
            <span>Đang ẩn tất cả</span>
          </div>
          <div class="badge">{{ sortedPartners.length }} đối tác</div>
        </div>
      </div>

      <!-- TABLE LOADING -->
      <div v-if="tableLoading" class="card-body">
        <div class="table-loading">
          <div class="table-loading-spinner"></div>
          <div class="table-loading-text">Đang tải danh sách đối tác...</div>
        </div>
      </div>

      <!-- TABLE CONTENT -->
      <div v-else-if="sortedPartners.length" class="card-body no-padding">
        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th class="th-index">Thứ tự</th>
                <th class="th-image">Logo</th>
                <th class="th-partner">Đối tác / Dịch vụ</th>
                <th class="th-link">Đường dẫn đích</th>
                <th class="th-status">Trạng thái</th>
                <th class="th-action">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(p, i) in sortedPartners"
                :key="p.ID"
                class="table-row"
                :class="{ 'is-row-active': isPartnerActive(p), 'is-row-muted': !isPartnerActive(p) }"
              >
                <td class="td-index" data-label="Thứ tự">
                  <div class="order-cell">
                    <div class="index-badge">#{{ i + 1 }}</div>
                    <div v-if="sortedPartners.length > 1" class="order-arrows">
                      <button
                        type="button"
                        class="order-btn"
                        :disabled="i === 0 || reordering"
                        title="Đẩy sang trái / lên trước"
                        @click="movePartner(i, -1)"
                      >
                        ▲
                      </button>
                      <button
                        type="button"
                        class="order-btn"
                        :disabled="i === sortedPartners.length - 1 || reordering"
                        title="Đẩy sang phải / xuống sau"
                        @click="movePartner(i, 1)"
                      >
                        ▼
                      </button>
                    </div>
                  </div>
                </td>

                <td class="td-image" data-label="Logo">
                  <div class="image-wrapper">
                    <img v-if="p.URL_img" :src="p.URL_img" :alt="p.Name" />
                    <i v-else class="ri-store-3-fill fallback-ico"></i>
                  </div>
                </td>

                <td class="td-partner" data-label="Đối tác / Dịch vụ">
                  <div class="partner-meta-cell">
                    <div class="partner-name-line">
                      <span class="platform-name">{{ p.Name }}</span>
                      <span v-if="p.Badge" class="row-badge">{{ p.Badge }}</span>
                      <span
                        class="row-color-tag"
                        :title="normalizePartnerHexColor(p.Bg_color) ? `Màu riêng: ${normalizePartnerHexColor(p.Bg_color)}` : 'Màu tự động'"
                        @click="openEdit(p)"
                      >
                        <span
                          class="row-color-dot"
                          :style="{ background: resolvePartnerBaseColor(p.Bg_color, i) }"
                        ></span>
                        <span>{{ normalizePartnerHexColor(p.Bg_color) || 'Tự động' }}</span>
                      </span>
                    </div>
                    <div class="partner-sub-line">{{ p.Subtitle || '—' }}</div>
                  </div>
                </td>

                <td class="td-link" data-label="Đường dẫn đích">
                  <a
                    v-if="p.Direct_link"
                    :href="normalizeBannerLink(p.Direct_link) || p.Direct_link"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="link-text"
                    :title="p.Direct_link"
                  >
                    <span>{{ formatBannerLinkShort(p.Direct_link, 38) || p.Direct_link }}</span>
                    <i class="ri-external-link-line"></i>
                  </a>
                  <span v-else class="no-link">—</span>
                </td>

                <td class="td-status" data-label="Trạng thái">
                  <button
                    type="button"
                    class="msg-status-btn"
                    :class="{ active: isPartnerActive(p) }"
                    :disabled="togglingId === p.ID"
                    @click="toggleActive(p)"
                  >
                    <i :class="isPartnerActive(p) ? 'ri-eye-fill' : 'ri-eye-off-line'"></i>
                    <span>
                      {{
                        togglingId === p.ID
                          ? 'Đang lưu...'
                          : isPartnerActive(p)
                            ? 'Đang hiện'
                            : 'Đang ẩn'
                      }}
                    </span>
                  </button>
                </td>

                <td class="td-action" data-label="Thao tác">
                  <div class="action-group">
                    <button @click="openEdit(p)" class="btn-icon-action btn-edit" title="Chỉnh sửa">
                      <span class="text">Sửa</span>
                    </button>
                    <button @click="deletePartner(p.ID)" class="btn-icon-action btn-delete" title="Xóa">
                      <span class="text">Xóa</span>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- EMPTY STATE -->
      <div v-else class="card-body">
        <div class="empty-state">
          <div class="empty-icon"><i class="ri-links-line"></i></div>
          <h3 class="empty-title">Chưa có đối tác / web phụ nào</h3>
          <p class="empty-text">Thêm link Tạp hóa, Đi chợ hộ hoặc các trang đối tác ở khung phía trên</p>
        </div>
      </div>
    </div>
  </div>

  <!-- EDIT MODAL -->
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="showEdit && editing" class="modal-overlay" @click.self="closeEdit">
        <div class="modal-container">
          <div class="modal-header">
            <div class="modal-title-group">
              <h3 class="modal-title">Chỉnh sửa Đối tác</h3>
            </div>
            <button @click="closeEdit" class="modal-close">
              <span>✖</span>
            </button>
          </div>

          <div class="modal-body">
            <div class="modal-field">
              <label class="modal-label">Tên đối tác / Dịch vụ *</label>
              <input
                v-model="editing.Name"
                class="modal-input"
                placeholder="VD: Tạp Hóa SA / Đi Chợ Hộ..."
                maxlength="40"
              />
            </div>

            <div class="modal-field">
              <label class="modal-label">Link Web hoặc Profile *</label>
              <input
                v-model="editing.Direct_link"
                class="modal-input"
                placeholder="https://..."
              />
            </div>

            <div class="modal-field">
              <label class="modal-label">Mô tả ngắn (hiển thị trên PC)</label>
              <input
                v-model="editing.Subtitle"
                class="modal-input"
                placeholder="VD: Đồ khô · Gia vị Việt · Giao nhanh"
                maxlength="60"
              />
            </div>

            <div class="modal-field">
              <label class="modal-label">Nhãn góc nhỏ (tùy chọn)</label>
              <input
                v-model="editing.Badge"
                class="modal-input"
                placeholder="VD: HOT, 24/7, MỚI..."
                maxlength="16"
              />
              <div class="preset-chips">
                <button
                  v-for="tag in BADGE_PRESETS"
                  :key="'edit-' + tag"
                  type="button"
                  class="preset-chip"
                  :class="{ active: editing.Badge === tag }"
                  @click="editing.Badge = editing.Badge === tag ? '' : tag"
                >
                  {{ tag }}
                </button>
              </div>
            </div>

            <div class="modal-field">
              <label class="modal-label">Màu nền thẻ Đối tác</label>
              <div class="color-picker-panel">
                <div class="color-swatches">
                  <button
                    type="button"
                    class="auto-color-chip"
                    :class="{ active: !normalizePartnerHexColor(editing.Bg_color) }"
                    @click="editing.Bg_color = ''"
                  >
                    <i class="ri-magic-line"></i>
                    <span>Tự động</span>
                  </button>
                  <button
                    v-for="preset in PARTNER_COLOR_PRESETS"
                    :key="'edit-color-' + preset.hex"
                    type="button"
                    class="color-swatch-btn"
                    :class="{ active: normalizePartnerHexColor(editing.Bg_color) === preset.hex }"
                    :style="{ background: preset.hex }"
                    :title="`${preset.label} (${preset.hex})`"
                    @click="editing.Bg_color = preset.hex"
                  >
                    <i v-if="normalizePartnerHexColor(editing.Bg_color) === preset.hex" class="ri-check-line"></i>
                  </button>
                </div>
                <div class="custom-color-row">
                  <label class="native-color-wrap" title="Chọn màu bất kỳ">
                    <input
                      type="color"
                      :value="resolvePartnerBaseColor(editing.Bg_color, 0)"
                      class="native-color-input"
                      @input="editing.Bg_color = $event.target.value"
                    />
                    <span class="native-color-label">
                      <i class="ri-palette-line"></i> Chọn màu tùy ý
                    </span>
                  </label>
                  <input
                    v-model="editing.Bg_color"
                    placeholder="#0d9488 (để trống = Tự động)"
                    class="modal-input hex-code-input"
                    maxlength="9"
                  />
                </div>

                <!-- MINI LIVE CARD PREVIEW IN MODAL -->
                <div class="modal-card-preview-wrap">
                  <div
                    class="mock-partner-card is-modal-sample"
                    :style="getPartnerCardStyle(editing.Bg_color, 0)"
                  >
                    <div class="mock-avatar">
                      <img v-if="editing.preview" :src="editing.preview" alt="" />
                      <i v-else class="ri-store-3-fill"></i>
                    </div>
                    <div class="mock-meta">
                      <div class="mock-name-row">
                        <span class="mock-name">{{ editing.Name || 'Tên đối tác' }}</span>
                        <span v-if="editing.Badge" class="mock-inline-badge">{{ editing.Badge }}</span>
                      </div>
                      <div v-if="editing.Subtitle" class="mock-sub">{{ editing.Subtitle }}</div>
                    </div>
                    <span class="mock-ext-box">
                      <i class="ri-arrow-right-up-line mock-ext"></i>
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div class="modal-field">
              <label class="modal-label">Đổi Logo / Ảnh đại diện</label>
              <input
                type="file"
                accept="image/*"
                @change="onEditFile"
                class="modal-input"
              />
              <div class="upload-size-hint">
                Kích thước chuẩn: <strong>256 × 256 px – 512 × 512 px</strong> (vuông 1:1)
              </div>
            </div>

            <div
              class="allow-msg-toggle-box in-modal"
              :class="{ active: editing.Active }"
              @click="editing.Active = !editing.Active"
            >
              <div class="allow-msg-meta">
                <div class="allow-msg-title">
                  <i class="ri-eye-fill"></i>
                  <span>Hiển thị trên trang Order</span>
                </div>
                <div class="allow-msg-desc">
                  Tắt công tắc này nếu muốn tạm ẩn thẻ đối tác khỏi giao diện khách hàng.
                </div>
              </div>
              <button
                type="button"
                class="switch-pill"
                :class="{ active: editing.Active }"
                :aria-pressed="editing.Active"
                @click.stop="editing.Active = !editing.Active"
              >
                <span class="switch-knob"></span>
              </button>
            </div>

            <div v-if="editing.preview" class="modal-preview">
              <img :src="editing.preview" alt="Preview" />
            </div>
          </div>

          <div class="modal-footer">
            <button @click="closeEdit" class="btn btn-secondary">
              <span class="btn-icon">✖</span>
              Hủy
            </button>
            <button
              @click="saveEdit"
              :disabled="loading || !editing.Name.trim() || !editing.Direct_link.trim()"
              class="btn btn-success"
            >
              <span v-if="loading" class="btn-loading">
                <span class="spinner"></span>
                Đang lưu...
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
}

.page-header {
  margin-bottom: 24px;
}

.header-content {
  display: flex;
  align-items: center;
  gap: 16px;
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
}

/* CARD */
.card {
  background: rgba(30, 41, 59, 0.6);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(148, 163, 184, 0.12);
  border-radius: 16px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.22);
  margin-bottom: 24px;
  overflow: hidden;
}

.card-header {
  padding: 18px 24px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.1);
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

.badge {
  background: rgba(59, 130, 246, 0.2);
  color: #ffffff;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 600;
  border: 1px solid rgba(59, 130, 246, 0.3);
}

.card-body {
  padding: 24px;
}

.card-body.no-padding {
  padding: 0;
}

/* LIVE PREVIEW SHOWCASE */
.device-switch {
  display: inline-flex;
  background: rgba(15, 23, 42, 0.65);
  padding: 3px;
  border-radius: 10px;
  border: 1px solid rgba(148, 163, 184, 0.2);
  gap: 4px;
}

.device-btn {
  padding: 6px 12px;
  border: none;
  border-radius: 7px;
  background: transparent;
  color: #94a3b8;
  font-size: 12.5px;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  transition: all 0.2s ease;
}

.device-btn.active {
  background: linear-gradient(135deg, #16a34a 0%, #059669 100%);
  color: #ffffff;
}

.mock-storefront-frame {
  background: #f8fafc;
  border-radius: 14px;
  padding: 14px 16px;
  border: 1px solid rgba(148, 163, 184, 0.25);
  transition: max-width 0.25s ease;
}

.mock-storefront-frame.is-mobile-mock {
  max-width: 375px;
  margin: 0 auto;
  padding: 10px 12px;
}

.mock-scam-row {
  display: flex;
  justify-content: center;
  gap: 10px;
}

.mock-storefront-frame.is-mobile-mock .mock-scam-row {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 6px;
}

.mock-scam-pill {
  flex: 0 1 350px;
  height: 56px;
  padding: 0 14px;
  border-radius: 13px;
  background: #ffffff;
  color: #0f172a;
  font-size: 13px;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.04);
}

.mock-storefront-frame.is-mobile-mock .mock-scam-pill {
  flex: none;
  flex-direction: column;
  height: 52px;
  padding: 5px;
  gap: 3px;
  font-size: 10.5px;
  text-align: center;
}

.mock-scam-pill i {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  color: #ffffff;
  font-size: 13.5px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.mock-storefront-frame.is-mobile-mock .mock-scam-pill i {
  width: 22px;
  height: 22px;
  font-size: 12px;
}

.mock-scam-pill.is-green {
  border: 1px solid rgba(16, 185, 129, 0.32);
}
.mock-scam-pill.is-green i {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  box-shadow: 0 3px 8px rgba(16, 185, 129, 0.3);
}
.mock-scam-pill.is-amber {
  border: 1px solid rgba(245, 158, 11, 0.34);
}
.mock-scam-pill.is-amber i {
  background: linear-gradient(135deg, #f59e0b 0%, #ea580c 100%);
  box-shadow: 0 3px 8px rgba(245, 158, 11, 0.3);
}
.mock-scam-pill.is-red {
  border: 1px solid rgba(225, 29, 72, 0.3);
}
.mock-scam-pill.is-red i {
  background: linear-gradient(135deg, #f43f5e 0%, #e11d48 100%);
  box-shadow: 0 3px 8px rgba(225, 29, 72, 0.3);
}

.mock-partner-row {
  display: flex;
  flex-wrap: nowrap;
  justify-content: center;
  gap: 12px;
  margin-bottom: 10px;
}

.mock-partner-row.is-mobile {
  display: grid;
  grid-template-columns: repeat(var(--preview-cols, 3), minmax(0, 1fr));
  gap: 8px;
  margin-bottom: 8px;
}

.mock-partner-row.is-mobile.is-count-1 {
  display: flex;
  justify-content: center;
}

.mock-partner-row.is-mobile.is-count-1 .mock-partner-card {
  flex: 1 1 100%;
  max-width: 100%;
}

.mock-partner-row.is-scrollable {
  display: flex;
  justify-content: flex-start;
  overflow-x: auto;
}

.mock-partner-card {
  position: relative;
  flex: 1 1 0;
  max-width: 520px;
  display: flex;
  align-items: center;
  gap: 14px;
  min-height: 80px;
  padding: 14px 18px;
  border-radius: 18px;
  color: var(--pt-fg, #ffffff);
  border: 1px solid var(--pt-border, rgba(255, 255, 255, 0.28));
  min-width: 0;
}

.mock-partner-card.is-modal-sample {
  flex: 0 1 360px;
  width: 100%;
  max-width: 360px;
  margin: 0 auto;
}

.mock-partner-row.is-mobile:not(.is-count-1) .mock-partner-card {
  max-width: none;
}

.mock-partner-row.is-compact-tiles .mock-partner-card {
  flex-direction: column;
  justify-content: center;
  text-align: center;
  gap: 6px;
  padding: 9px 5px 8px;
  min-height: 76px;
}

.mock-partner-card.is-draft {
  outline: 2px dashed #fde047;
  outline-offset: 2px;
}

.mock-avatar {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  overflow: hidden;
  background: #ffffff;
  color: var(--pt-ico, #059669);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.mock-partner-row.is-compact-tiles .mock-avatar {
  width: 38px;
  height: 38px;
}

.mock-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.mock-meta {
  flex: 1;
  min-width: 0;
}

.mock-name-row {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}

.mock-partner-row.is-compact-tiles .mock-name-row {
  justify-content: center;
}

.mock-name {
  font-size: 15.5px;
  font-weight: 800;
  color: var(--pt-fg, #ffffff);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.mock-partner-row.is-compact-tiles .mock-name {
  font-size: 11px;
  line-height: 1.2;
  white-space: normal;
}

.mock-inline-badge {
  padding: 2px 7px;
  border-radius: 999px;
  background: linear-gradient(135deg, #fde047, #f59e0b);
  color: #78350f;
  font-size: 10px;
  font-weight: 900;
  flex-shrink: 0;
}

.mock-sub {
  font-size: 12px;
  color: var(--pt-sub, rgba(255, 255, 255, 0.88));
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-top: 2px;
}

.mock-ext-box {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: var(--pt-ext-bg, rgba(255, 255, 255, 0.22));
  border: 1px solid var(--pt-ext-border, rgba(255, 255, 255, 0.32));
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.mock-ext {
  color: var(--pt-fg, #ffffff);
  font-size: 14px;
}

.mock-corner-badge {
  position: absolute;
  top: -4px;
  right: -2px;
  padding: 1px 5px;
  border-radius: 6px;
  background: linear-gradient(135deg, #fde047, #f59e0b);
  color: #78350f;
  font-size: 8.5px;
  font-weight: 900;
  line-height: 1.3;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.25);
}

/* FORM */
.form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  margin-bottom: 20px;
}

.form-field {
  display: flex;
  flex-direction: column;
}

.form-field-full {
  grid-column: 1 / -1;
}

.form-label {
  font-size: 13px;
  font-weight: 600;
  color: #ffffff;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 8px;
}

.form-input {
  padding: 12px 16px;
  background: rgba(51, 65, 85, 0.5);
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 10px;
  color: #ffffff;
  font-size: 14px;
  transition: all 0.25s ease;
}

.form-input::placeholder {
  color: #94a3b8;
}

.form-input:focus {
  outline: none;
  border-color: rgba(52, 211, 153, 0.6);
  background: rgba(51, 65, 85, 0.75);
}

.field-hint {
  margin-top: 5px;
  font-size: 12px;
  color: #94a3b8;
}

.upload-size-hint {
  margin-top: 6px;
  font-size: 12px;
  color: #93c5fd;
  line-height: 1.4;
}

.preset-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 8px;
}

.preset-chip {
  padding: 4px 10px;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.28);
  background: rgba(15, 23, 42, 0.55);
  color: #cbd5e1;
  font-size: 11.5px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.18s ease;
}

.preset-chip:hover {
  border-color: #4ade80;
  color: #ffffff;
}

.preset-chip.active {
  background: linear-gradient(135deg, #f59e0b, #ea580c);
  border-color: #fbbf24;
  color: #ffffff;
}

/* COLOR PICKER PANEL */
.color-picker-panel {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px 14px;
  border-radius: 12px;
  background: rgba(15, 23, 42, 0.45);
  border: 1px solid rgba(148, 163, 184, 0.18);
}

.color-swatches {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.auto-color-chip {
  height: 30px;
  padding: 0 11px;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.35);
  background: rgba(30, 41, 59, 0.8);
  color: #cbd5e1;
  font-size: 12px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  cursor: pointer;
  transition: all 0.18s ease;
}

.auto-color-chip:hover {
  border-color: #4ade80;
  color: #ffffff;
}

.auto-color-chip.active {
  background: linear-gradient(135deg, #0d9488 0%, #0284c7 100%);
  border-color: #5eead4;
  color: #ffffff;
  box-shadow: 0 3px 10px rgba(13, 148, 136, 0.35);
}

.color-swatch-btn {
  width: 30px;
  height: 30px;
  border-radius: 9px;
  border: 2px solid rgba(255, 255, 255, 0.25);
  color: #ffffff;
  font-size: 15px;
  font-weight: 900;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: transform 0.16s ease, border-color 0.16s ease, box-shadow 0.16s ease;
}

.color-swatch-btn:hover {
  transform: scale(1.1);
  border-color: #ffffff;
}

.color-swatch-btn.active {
  border-color: #ffffff;
  box-shadow: 0 0 0 2px #0f172a, 0 0 0 4px #4ade80;
  transform: scale(1.08);
}

.custom-color-row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.native-color-wrap {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px 6px 8px;
  border-radius: 10px;
  background: rgba(51, 65, 85, 0.65);
  border: 1px solid rgba(148, 163, 184, 0.28);
  cursor: pointer;
  transition: border-color 0.18s ease;
}

.native-color-wrap:hover {
  border-color: #4ade80;
}

.native-color-input {
  width: 28px;
  height: 28px;
  padding: 0;
  border: none;
  border-radius: 6px;
  background: transparent;
  cursor: pointer;
}

.native-color-label {
  font-size: 12.5px;
  font-weight: 600;
  color: #e2e8f0;
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.hex-code-input {
  flex: 1;
  min-width: 170px;
  max-width: 240px;
  padding: 8px 12px !important;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 13px !important;
}

.modal-card-preview-wrap {
  margin-top: 4px;
  padding: 10px;
  border-radius: 10px;
  background: #f8fafc;
  border: 1px solid rgba(148, 163, 184, 0.25);
}

.row-color-tag {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 2px 8px 2px 5px;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.65);
  border: 1px solid rgba(148, 163, 184, 0.28);
  color: #cbd5e1;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  transition: border-color 0.16s ease;
}

.row-color-tag:hover {
  border-color: #4ade80;
  color: #ffffff;
}

.row-color-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 1.5px solid rgba(255, 255, 255, 0.7);
  flex-shrink: 0;
}

/* BUTTONS */
.btn {
  padding: 12px 24px;
  border: none;
  border-radius: 10px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.25s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 44px;
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

.btn-secondary {
  background: rgba(51, 65, 85, 0.6);
  color: #ffffff;
  border: 1px solid rgba(148, 163, 184, 0.2);
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

/* TABLE */
.table-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 70px 20px;
  gap: 16px;
}

.table-loading-spinner {
  width: 44px;
  height: 44px;
  border: 4px solid rgba(52, 211, 153, 0.2);
  border-top-color: #34d399;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.table-loading-text {
  font-size: 14px;
  font-weight: 600;
  color: #e2e8f0;
}

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
  padding: 14px 18px;
  text-align: center;
  font-size: 12.5px;
  font-weight: 700;
  color: #ffffff;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.data-table td {
  padding: 14px 18px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.06);
  vertical-align: middle;
}

.table-row {
  transition: background 0.2s ease, opacity 0.2s ease;
}

.table-row:hover {
  background: rgba(51, 65, 85, 0.3);
}

.table-row.is-row-active {
  background: rgba(22, 163, 74, 0.06);
}

.table-row.is-row-muted {
  opacity: 0.65;
}

.th-index { width: 120px; }
.th-image { width: 90px; }
.th-partner { width: auto; text-align: left !important; }
.th-link { width: 250px; text-align: left !important; }
.th-status { width: 155px; }
.th-action { width: 165px; }

.td-index,
.td-image,
.td-status,
.td-action {
  text-align: center;
}

.order-cell {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.index-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 42px;
  height: 34px;
  background: rgba(59, 130, 246, 0.2);
  color: #ffffff;
  border-radius: 8px;
  font-weight: 700;
  font-size: 13.5px;
  border: 1px solid rgba(59, 130, 246, 0.3);
  padding: 0 10px;
}

.order-arrows {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.order-btn {
  width: 24px;
  height: 19px;
  border: 1px solid rgba(148, 163, 184, 0.28);
  border-radius: 5px;
  background: rgba(51, 65, 85, 0.65);
  color: #e2e8f0;
  font-size: 9px;
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

.image-wrapper {
  width: 46px;
  height: 46px;
  border-radius: 12px;
  overflow: hidden;
  background: rgba(51, 65, 85, 0.55);
  margin: 0 auto;
  border: 2px solid rgba(148, 163, 184, 0.22);
  display: flex;
  align-items: center;
  justify-content: center;
}

.image-wrapper img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.fallback-ico {
  color: #94a3b8;
  font-size: 20px;
}

.partner-meta-cell {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.partner-name-line {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.platform-name {
  color: #ffffff;
  font-size: 14.5px;
  font-weight: 700;
}

.row-badge {
  padding: 2px 7px;
  border-radius: 999px;
  background: linear-gradient(135deg, #f59e0b, #ea580c);
  color: #ffffff;
  font-size: 10.5px;
  font-weight: 800;
}

.partner-sub-line {
  color: #94a3b8;
  font-size: 12.5px;
}

.link-text {
  color: #60a5fa;
  font-size: 13px;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  word-break: break-all;
}

.link-text:hover {
  color: #93c5fd;
  text-decoration: underline;
}

.no-link {
  color: #64748b;
  font-size: 13px;
}

.action-group {
  display: flex;
  justify-content: center;
  gap: 8px;
}

.btn-icon-action {
  padding: 8px 15px;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.22s ease;
  display: inline-flex;
  align-items: center;
  gap: 6px;
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

/* EMPTY STATE */
.empty-state {
  text-align: center;
  padding: 56px 20px;
}

.empty-icon {
  font-size: 64px;
  color: #64748b;
  margin-bottom: 12px;
  opacity: 0.45;
}

.empty-title {
  font-size: 18px;
  font-weight: 700;
  color: #ffffff;
  margin-bottom: 6px;
}

.empty-text {
  font-size: 14px;
  color: #cbd5e1;
}

/* TOGGLE SWITCH & PILLS */
.allow-msg-toggle-box {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 16px;
  margin-bottom: 20px;
  border-radius: 12px;
  background: rgba(51, 65, 85, 0.45);
  border: 1px solid rgba(148, 163, 184, 0.2);
  cursor: pointer;
  transition: all 0.2s ease;
}

.allow-msg-toggle-box.active {
  background: rgba(22, 163, 74, 0.16);
  border-color: rgba(34, 197, 94, 0.55);
}

.allow-msg-toggle-box.in-modal {
  margin-top: 4px;
  margin-bottom: 8px;
}

.allow-msg-meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.allow-msg-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 700;
  color: #ffffff;
}

.allow-msg-title i {
  color: #4ade80;
  font-size: 17px;
}

.allow-msg-desc {
  font-size: 12.5px;
  color: #cbd5e1;
  line-height: 1.4;
}

.switch-pill {
  width: 48px;
  height: 26px;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.35);
  background: rgba(15, 23, 42, 0.7);
  padding: 2px;
  cursor: pointer;
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  transition: all 0.22s ease;
}

.switch-pill.active {
  background: linear-gradient(135deg, #16a34a 0%, #22c55e 100%);
  border-color: #4ade80;
}

.switch-knob {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #ffffff;
  transition: transform 0.22s ease;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.25);
}

.switch-pill.active .switch-knob {
  transform: translateX(22px);
}

.header-badges {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.msg-active-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12.5px;
  font-weight: 600;
  background: rgba(34, 197, 94, 0.18);
  color: #86efac;
  border: 1px solid rgba(34, 197, 94, 0.4);
}

.msg-empty-pill {
  display: inline-flex;
  align-items: center;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12.5px;
  font-weight: 600;
  background: rgba(245, 158, 11, 0.14);
  color: #fcd34d;
  border: 1px solid rgba(245, 158, 11, 0.35);
}

.msg-status-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 7px 13px;
  border-radius: 999px;
  font-size: 12.5px;
  font-weight: 600;
  cursor: pointer;
  border: 1px solid rgba(148, 163, 184, 0.3);
  background: rgba(51, 65, 85, 0.55);
  color: #cbd5e1;
  transition: all 0.2s ease;
}

.msg-status-btn.active {
  background: linear-gradient(135deg, #16a34a 0%, #22c55e 100%);
  border-color: #4ade80;
  color: #ffffff;
  box-shadow: 0 4px 14px rgba(34, 197, 94, 0.28);
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
  border: 1px solid rgba(148, 163, 184, 0.15);
  border-radius: 16px;
  width: 100%;
  max-width: 580px;
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

.modal-title {
  font-size: 19px;
  font-weight: 700;
  color: #ffffff;
}

.modal-close {
  width: 36px;
  height: 36px;
  border: none;
  background: rgba(51, 65, 85, 0.5);
  color: #e2e8f0;
  border-radius: 8px;
  cursor: pointer;
  font-size: 17px;
}

.modal-body {
  padding: 22px 24px;
  overflow-y: auto;
  flex: 1;
}

.modal-field {
  margin-bottom: 16px;
}

.modal-label {
  display: block;
  font-size: 12.5px;
  font-weight: 600;
  color: #ffffff;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 7px;
}

.modal-input {
  width: 100%;
  padding: 11px 14px;
  background: rgba(51, 65, 85, 0.5);
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 10px;
  color: #ffffff;
  font-size: 14px;
}

.modal-preview {
  margin-top: 14px;
  text-align: center;
}

.modal-preview img {
  width: 88px;
  height: 88px;
  object-fit: cover;
  border-radius: 16px;
  border: 2px solid rgba(148, 163, 184, 0.25);
}

.modal-footer {
  padding: 18px 24px;
  border-top: 1px solid rgba(148, 163, 184, 0.1);
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

/* RESPONSIVE */
@media (max-width: 768px) {
  .admin-page {
    padding: 16px;
  }

  .hero-admin-title {
    font-size: 20px;
  }

  .card-header,
  .card-body {
    padding: 16px;
  }

  .form-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .data-table thead {
    display: none;
  }

  .data-table tbody {
    display: block;
  }

  .table-row {
    display: block;
    margin-bottom: 14px;
    background: rgba(51, 65, 85, 0.3);
    border-radius: 12px;
    padding: 14px;
    border: 1px solid rgba(148, 163, 184, 0.12);
  }

  .data-table td {
    display: block;
    padding: 8px 0;
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
    margin-bottom: 5px;
  }

  .td-index::before {
    display: none;
  }

  .order-arrows {
    flex-direction: row;
  }

  .order-btn {
    width: 30px;
    height: 28px;
    font-size: 11px;
  }

  .image-wrapper {
    margin: 4px 0;
  }

  .action-group {
    flex-direction: row;
  }

  .btn-icon-action {
    flex: 1;
    justify-content: center;
  }
}
</style>
