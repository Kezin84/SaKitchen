<script setup>
import { ref, onMounted, computed } from 'vue'
import { getOneSheet, dispatchAction } from '@/config/api'
import {
  SUPPORTED_DATA_LANGS,
  createEmptyNoticeI18n,
  normalizeNoticeI18n,
  resolveNoticeText,
  getNoticeTranslatedLangs,
} from '@/utils/i18nData'

const FREESHIP_DEFAULT_BY_LANG = {
  vi: 'Freeship',
  en: 'Free Shipping',
  'zh-CN': '免配送费',
  fil: 'Libreng Shipping',
  ko: '무료 배달',
}

/* ================= STATE ================= */
const list = ref([])
const loading = ref(false)
const milestoneSaving = ref(false)
const togglingId = ref('')
const tableLoading = ref(true)

/* --- MILESTONE ADD STATE --- */
const addMilestoneType = ref('FREESHIP') // 'FREESHIP' | 'GIFT'
const addMilestoneAmount = ref('')
const activeAddMilestoneLang = ref('vi')
const addMilestoneI18n = ref(createEmptyNoticeI18n())
const previewMilestoneLang = ref('vi')

/* --- MILESTONE EDIT MODAL STATE --- */
const showEditMilestoneModal = ref(false)
const editingMilestone = ref(null)
const editMilestoneType = ref('FREESHIP')
const editMilestoneAmount = ref('')
const editMilestoneActive = ref(true)
const activeEditMilestoneLang = ref('vi')
const editMilestoneI18n = ref(createEmptyNoticeI18n())

/* --- TEXT PROMO STATE (EXISTING) --- */
const activeAddLang = ref('vi')
const addI18n = ref(createEmptyNoticeI18n())
const previewLang = ref('vi')

const showEditModal = ref(false)
const editingItem = ref(null)
const activeEditLang = ref('vi')
const editI18n = ref(createEmptyNoticeI18n())

/* ================= COMPUTED ================= */
const milestoneList = computed(() =>
  list.value
    .filter((k) => k && k.Loai_km === 'MILESTONE')
    .slice()
    .sort((a, b) => Number(a.Moc_tien || 0) - Number(b.Moc_tien || 0)),
)

const textList = computed(() =>
  list.value.filter((k) => k && k.Loai_km !== 'MILESTONE'),
)

const hasAnyAddMilestoneText = computed(() =>
  SUPPORTED_DATA_LANGS.some((l) => addMilestoneI18n.value[l.code]?.Noi_dung?.trim()),
)

const canSubmitAddMilestone = computed(() => {
  const amt = Number(addMilestoneAmount.value)
  if (!Number.isFinite(amt) || amt <= 0) return false
  if (addMilestoneType.value === 'GIFT' && !hasAnyAddMilestoneText.value) return false
  return true
})

const hasAnyEditMilestoneText = computed(() =>
  SUPPORTED_DATA_LANGS.some((l) => editMilestoneI18n.value[l.code]?.Noi_dung?.trim()),
)

const canSubmitEditMilestone = computed(() => {
  const amt = Number(editMilestoneAmount.value)
  if (!Number.isFinite(amt) || amt <= 0) return false
  if (editMilestoneType.value === 'GIFT' && !hasAnyEditMilestoneText.value) return false
  return true
})

const hasAnyAddText = computed(() =>
  SUPPORTED_DATA_LANGS.some((l) => addI18n.value[l.code]?.Noi_dung?.trim()),
)

const hasAnyEditText = computed(() =>
  SUPPORTED_DATA_LANGS.some((l) => editI18n.value[l.code]?.Noi_dung?.trim()),
)

/* ================= HELPERS ================= */
function genId(prefix = 'KM_') {
  const d = new Date()
  const p = (n) => String(n).padStart(2, '0')
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

function formatThreshold(val) {
  return Number(val || 0).toLocaleString('vi-VN')
}

function resolveMilestoneDisplayText(item, langCode) {
  const custom = resolveNoticeText(item, langCode)
  if (custom) return custom
  if (item?.Kieu_uu_dai !== 'GIFT') {
    return FREESHIP_DEFAULT_BY_LANG[langCode] || 'Freeship'
  }
  return 'Chưa nhập tên quà tặng'
}

/* ================= LOAD ================= */
async function loadData() {
  tableLoading.value = true
  try {
    const json = await getOneSheet('khuyenmai_info')
    list.value = (json.data || []).reverse()
  } finally {
    tableLoading.value = false
  }
}

/* ================= MILESTONE CRUD ================= */
async function addMilestone() {
  const amt = Number(addMilestoneAmount.value)
  if (!Number.isFinite(amt) || amt <= 0) {
    alert('Vui lòng nhập mốc tiền lớn hơn 0')
    return
  }
  if (addMilestoneType.value === 'GIFT' && !hasAnyAddMilestoneText.value) {
    alert('Vui lòng nhập tên món / quà tặng cho mốc này')
    return
  }

  milestoneSaving.value = true
  try {
    const viDefault =
      addMilestoneI18n.value.vi.Noi_dung.trim() ||
      SUPPORTED_DATA_LANGS.map((l) => addMilestoneI18n.value[l.code].Noi_dung.trim()).find(
        Boolean,
      ) ||
      ''

    await dispatchAction({
      action: 'addKhuyenMai',
      data: {
        ID: genId('KMM_'),
        Loai_km: 'MILESTONE',
        Kieu_uu_dai: addMilestoneType.value,
        Moc_tien: amt,
        Kich_hoat: true,
        Noi_dung: viDefault,
        i18n: addMilestoneI18n.value,
      },
    })

    addMilestoneAmount.value = ''
    addMilestoneI18n.value = createEmptyNoticeI18n()
    activeAddMilestoneLang.value = 'vi'
    await loadData()
  } catch (e) {
    console.error(e)
    alert('Lỗi thêm mốc ưu đãi')
  } finally {
    milestoneSaving.value = false
  }
}

async function toggleMilestoneActive(item) {
  if (!item?.ID || togglingId.value) return
  const nextActive = item.Kich_hoat === false
  togglingId.value = item.ID
  try {
    await dispatchAction({
      action: 'updateKhuyenMai',
      data: {
        ID: item.ID,
        Loai_km: 'MILESTONE',
        Kich_hoat: nextActive,
      },
    })
    item.Kich_hoat = nextActive
  } catch (e) {
    console.error(e)
    alert('Lỗi cập nhật trạng thái mốc ưu đãi')
  } finally {
    togglingId.value = ''
  }
}

function openEditMilestone(item) {
  editingMilestone.value = item
  editMilestoneType.value = item.Kieu_uu_dai === 'GIFT' ? 'GIFT' : 'FREESHIP'
  editMilestoneAmount.value = Number(item.Moc_tien || 0) || ''
  editMilestoneActive.value = item.Kich_hoat !== false
  editMilestoneI18n.value = normalizeNoticeI18n(item)
  activeEditMilestoneLang.value = previewMilestoneLang.value || 'vi'
  showEditMilestoneModal.value = true
}

function closeEditMilestoneModal() {
  showEditMilestoneModal.value = false
  editingMilestone.value = null
  editMilestoneI18n.value = createEmptyNoticeI18n()
}

async function saveEditMilestone() {
  if (!editingMilestone.value) return
  const amt = Number(editMilestoneAmount.value)
  if (!Number.isFinite(amt) || amt <= 0) {
    alert('Vui lòng nhập mốc tiền lớn hơn 0')
    return
  }
  if (editMilestoneType.value === 'GIFT' && !hasAnyEditMilestoneText.value) {
    alert('Vui lòng nhập tên món / quà tặng')
    return
  }

  milestoneSaving.value = true
  try {
    const viDefault =
      editMilestoneI18n.value.vi.Noi_dung.trim() ||
      SUPPORTED_DATA_LANGS.map((l) => editMilestoneI18n.value[l.code].Noi_dung.trim()).find(
        Boolean,
      ) ||
      ''

    await dispatchAction({
      action: 'updateKhuyenMai',
      data: {
        ID: editingMilestone.value.ID,
        Loai_km: 'MILESTONE',
        Kieu_uu_dai: editMilestoneType.value,
        Moc_tien: amt,
        Kich_hoat: editMilestoneActive.value,
        Noi_dung: viDefault,
        i18n: editMilestoneI18n.value,
      },
    })

    closeEditMilestoneModal()
    await loadData()
  } catch (e) {
    console.error(e)
    alert('Lỗi lưu mốc ưu đãi')
  } finally {
    milestoneSaving.value = false
  }
}

/* ================= TEXT PROMO CRUD (EXISTING) ================= */
async function addKhuyenMai() {
  if (!hasAnyAddText.value) {
    alert('Vui lòng nhập nội dung khuyến mãi')
    return
  }

  loading.value = true
  try {
    const viDefault =
      addI18n.value.vi.Noi_dung.trim() ||
      SUPPORTED_DATA_LANGS.map((l) => addI18n.value[l.code].Noi_dung.trim()).find(Boolean) ||
      ''

    await dispatchAction({
      action: 'addKhuyenMai',
      data: {
        ID: genId('KM_'),
        Loai_km: 'TEXT',
        Noi_dung: viDefault,
        i18n: addI18n.value,
      },
    })

    addI18n.value = createEmptyNoticeI18n()
    activeAddLang.value = 'vi'
    await loadData()
  } catch (e) {
    console.error(e)
    alert('Lỗi thêm khuyến mãi')
  } finally {
    loading.value = false
  }
}

function openEdit(item) {
  editingItem.value = item
  editI18n.value = normalizeNoticeI18n(item)
  activeEditLang.value = previewLang.value || 'vi'
  showEditModal.value = true
}

function closeEditModal() {
  showEditModal.value = false
  editingItem.value = null
  editI18n.value = createEmptyNoticeI18n()
}

async function saveEdit() {
  if (!editingItem.value || !hasAnyEditText.value) {
    alert('Nội dung trống')
    return
  }

  loading.value = true
  try {
    const viDefault =
      editI18n.value.vi.Noi_dung.trim() ||
      SUPPORTED_DATA_LANGS.map((l) => editI18n.value[l.code].Noi_dung.trim()).find(Boolean) ||
      ''

    await dispatchAction({
      action: 'updateKhuyenMai',
      data: {
        ID: editingItem.value.ID,
        Loai_km: 'TEXT',
        Noi_dung: viDefault,
        i18n: editI18n.value,
      },
    })

    closeEditModal()
    await loadData()
  } catch (e) {
    console.error(e)
    alert('Lỗi cập nhật khuyến mãi')
  } finally {
    loading.value = false
  }
}

/* ================= DELETE ================= */
async function deleteItem(id) {
  if (!confirm('Xóa mục khuyến mãi này?')) return

  try {
    await dispatchAction({
      action: 'deleteKhuyenMai',
      ID: id,
    })
    await loadData()
  } catch (e) {
    console.error(e)
    alert('Lỗi xóa khuyến mãi')
  }
}

/* ================= INIT ================= */
onMounted(loadData)
</script>

<template>
  <div class="admin-page">
    <!-- HEADER -->
    <div class="page-header">
      <div class="header-content">
        <div>
          <h1
            class="page-title"
            style="color: rgb(134, 239, 172); text-shadow: 0 0 10px rgba(34, 197, 94, 0.5)"
          >
            QUẢN LÝ KHUYẾN MÃI &amp; MỐC FREESHIP
          </h1>
          <p class="page-subtitle">
            Cấu hình mốc Freeship, quà tặng tự động theo đơn hàng và ghi chú khuyến mãi đa ngôn ngữ (VI · EN · ZH · FIL · KO)
          </p>
        </div>
      </div>
    </div>

    <!-- ============================================================ -->
    <!-- SECTION 1: MỐC FREESHIP & QUÀ TẶNG TỰ ĐỘNG THEO ĐƠN HÀNG     -->
    <!-- ============================================================ -->
    <div class="card milestone-config-card">
      <div class="card-header list-header-wrap">
        <div>
          <h3 class="card-title">
            <i class="ri-truck-fill accent-emerald"></i>
            <span>Cấu hình Mốc Freeship &amp; Tặng Món Tự Động</span>
          </h3>
          <p class="card-sub-hint">
            Khách đặt món sẽ thấy thanh tiến độ còn thiếu bao nhiêu tiền để đạt mốc, và ưu đãi đạt được sẽ tự động gắn vào đơn gửi Shop.
          </p>
        </div>

        <div class="lang-tabs">
          <button
            v-for="l in SUPPORTED_DATA_LANGS"
            :key="'add-ms-' + l.code"
            type="button"
            class="lang-tab-btn"
            :class="{
              active: activeAddMilestoneLang === l.code,
              filled: Boolean(addMilestoneI18n[l.code]?.Noi_dung?.trim()),
            }"
            @click="activeAddMilestoneLang = l.code"
          >
            <img :src="l.flagImg" :alt="l.short" class="lang-flag" />
            <span>{{ l.short }}</span>
            <span v-if="addMilestoneI18n[l.code]?.Noi_dung?.trim()" class="lang-dot"></span>
          </button>
        </div>
      </div>

      <div class="card-body">
        <div class="milestone-form-grid">
          <!-- LOẠI ƯU ĐÃI -->
          <div class="ms-field">
            <label class="ms-label">Loại ưu đãi</label>
            <div class="ms-type-switch">
              <button
                type="button"
                class="ms-type-btn"
                :class="{ active: addMilestoneType === 'FREESHIP' }"
                @click="addMilestoneType = 'FREESHIP'"
              >
                <i class="ri-truck-line"></i>
                <span>Freeship</span>
              </button>
              <button
                type="button"
                class="ms-type-btn gift"
                :class="{ active: addMilestoneType === 'GIFT' }"
                @click="addMilestoneType = 'GIFT'"
              >
                <i class="ri-gift-line"></i>
                <span>Tặng thêm món</span>
              </button>
            </div>
          </div>

          <!-- CON SỐ ĐẠT MỐC -->
          <div class="ms-field">
            <label class="ms-label">Mốc đơn tối thiểu đạt ưu đãi</label>
            <input
              v-model.number="addMilestoneAmount"
              type="number"
              min="1"
              step="any"
              placeholder="VD: 500, 800, 1000..."
              class="input-field ms-amount-input"
              @keypress.enter="addMilestone"
            />
          </div>

          <!-- TÊN QUÀ / GHI CHÚ ĐA NGÔN NGỮ -->
          <div class="ms-field ms-field-wide">
            <label class="ms-label">
              <template v-if="addMilestoneType === 'FREESHIP'">
                Ghi chú Freeship ({{ SUPPORTED_DATA_LANGS.find((x) => x.code === activeAddMilestoneLang)?.label }} - tùy chọn, bỏ trống sẽ tự hiện "Freeship")
              </template>
              <template v-else>
                Tên món / quà tặng ({{ SUPPORTED_DATA_LANGS.find((x) => x.code === activeAddMilestoneLang)?.label }} - bắt buộc ít nhất 1 ngôn ngữ)
              </template>
            </label>
            <div class="add-area">
              <input
                v-model="addMilestoneI18n[activeAddMilestoneLang].Noi_dung"
                type="text"
                :placeholder="
                  addMilestoneType === 'FREESHIP'
                    ? 'Bỏ trống = tự động dịch Freeship, hoặc nhập VD: Freeship bán kính 5km...'
                    : 'VD: Tặng 1 Trà đào / Tặng 1 Phần kim chi...'
                "
                class="input-field"
                @keypress.enter="addMilestone"
              />
              <button
                type="button"
                class="btn btn-success"
                :disabled="milestoneSaving || !canSubmitAddMilestone"
                @click="addMilestone"
              >
                <span v-if="milestoneSaving" class="btn-loading">
                  <span class="spinner"></span>
                  Đang lưu...
                </span>
                <span v-else>
                  <i class="ri-add-line"></i> Thêm Mốc Ưu Đãi
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- DANH SÁCH CÁC MỐC ĐANG ÁP DỤNG -->
      <div class="milestone-list-divider">
        <div class="mld-left">
          <i class="ri-award-fill accent-emerald"></i>
          <span>Danh sách các mốc đang cấu hình (tự động cộng dồn từ thấp lên cao)</span>
        </div>
        <div class="header-right-tools">
          <div class="lang-tabs mini">
            <button
              v-for="l in SUPPORTED_DATA_LANGS"
              :key="'prev-ms-' + l.code"
              type="button"
              class="lang-tab-btn"
              :class="{ active: previewMilestoneLang === l.code }"
              :title="`Xem bản ${l.label}`"
              @click="previewMilestoneLang = l.code"
            >
              <img :src="l.flagImg" :alt="l.short" class="lang-flag" />
              <span>{{ l.short }}</span>
            </button>
          </div>
          <div class="badge badge-emerald">{{ milestoneList.length }} mốc ưu đãi</div>
        </div>
      </div>

      <div v-if="tableLoading" class="card-body">
        <div class="table-loading compact">
          <div class="table-loading-spinner"></div>
          <div class="table-loading-text">Đang tải cấu hình mốc ưu đãi...</div>
        </div>
      </div>

      <div v-else-if="milestoneList.length" class="card-body no-padding">
        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th class="th-ms-amount">Mốc đơn hàng</th>
                <th class="th-ms-type">Loại ưu đãi</th>
                <th class="th-content">
                  Hiển thị trên Web ({{ SUPPORTED_DATA_LANGS.find((x) => x.code === previewMilestoneLang)?.label }})
                </th>
                <th class="th-ms-status">Trạng thái</th>
                <th class="th-action">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="m in milestoneList"
                :key="m.ID"
                class="table-row"
                :class="{ 'row-muted': m.Kich_hoat === false }"
              >
                <td class="td-index" data-label="Mốc đơn hàng">
                  <div class="ms-threshold-pill">
                    <span>Đơn &gt;= {{ formatThreshold(m.Moc_tien) }}</span>
                  </div>
                </td>

                <td class="td-ms-type" data-label="Loại ưu đãi">
                  <span
                    class="ms-kind-badge"
                    :class="m.Kieu_uu_dai === 'GIFT' ? 'gift' : 'freeship'"
                  >
                    <i :class="m.Kieu_uu_dai === 'GIFT' ? 'ri-gift-fill' : 'ri-truck-fill'"></i>
                    <span>{{ m.Kieu_uu_dai === 'GIFT' ? 'Tặng món' : 'Freeship' }}</span>
                  </span>
                </td>

                <td class="td-content td-left" data-label="Hiển thị trên Web">
                  <div class="content-text">{{ resolveMilestoneDisplayText(m, previewMilestoneLang) }}</div>
                  <div class="lang-badges-row">
                    <template v-if="getNoticeTranslatedLangs(m).length === 0 && m.Kieu_uu_dai !== 'GIFT'">
                      <span class="lang-mini-pill ok">Tự động dịch 5 ngôn ngữ</span>
                    </template>
                    <template v-else>
                      <span
                        v-for="l in SUPPORTED_DATA_LANGS"
                        :key="'ms-pill-' + m.ID + '-' + l.code"
                        class="lang-mini-pill"
                        :class="{ ok: getNoticeTranslatedLangs(m).includes(l.code) }"
                      >
                        {{ l.short }}
                      </span>
                    </template>
                  </div>
                </td>

                <td class="td-ms-status" data-label="Trạng thái">
                  <button
                    type="button"
                    class="ms-toggle-pill"
                    :class="{ on: m.Kich_hoat !== false }"
                    :disabled="togglingId === m.ID"
                    @click="toggleMilestoneActive(m)"
                  >
                    <span class="ms-toggle-dot"></span>
                    <span>{{ m.Kich_hoat !== false ? 'Đang bật' : 'Đang tắt' }}</span>
                  </button>
                </td>

                <td class="td-action" data-label="Thao tác">
                  <div class="action-group">
                    <button
                      type="button"
                      class="btn-icon-action btn-edit"
                      title="Chỉnh sửa mốc"
                      @click="openEditMilestone(m)"
                    >
                      <span class="text">Sửa</span>
                    </button>
                    <button
                      type="button"
                      class="btn-icon-action btn-delete"
                      title="Xóa mốc"
                      @click="deleteItem(m.ID)"
                    >
                      <span class="text">Xóa</span>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div v-else class="card-body">
        <div class="empty-state compact">
          <div class="empty-icon"><i class="ri-truck-line"></i></div>
          <h3 class="empty-title">Chưa đặt mốc Freeship / Tặng món nào</h3>
          <p class="empty-text">
            Nhập con số mốc đơn hàng ở trên (VD: 500 = Freeship, 800 = Tặng 1 Trà đào) để kích hoạt thanh tiến độ trên menu.
          </p>
        </div>
      </div>
    </div>

    <!-- ============================================================ -->
    <!-- SECTION 2: GHI CHÚ KHUYẾN MÃI CHỮ (HIỂN THỊ DƯỚI GIỎ HÀNG)   -->
    <!-- ============================================================ -->
    <div class="card add-card">
      <div class="card-header list-header-wrap">
        <h3 class="card-title">
          <span>Thêm Dòng Ghi Chú Khuyến Mãi (Chân Giỏ Hàng)</span>
          <i class="ri-add-circle-fill"></i>
        </h3>
        <div class="lang-tabs">
          <button
            v-for="l in SUPPORTED_DATA_LANGS"
            :key="l.code"
            type="button"
            class="lang-tab-btn"
            :class="{
              active: activeAddLang === l.code,
              filled: Boolean(addI18n[l.code]?.Noi_dung?.trim()),
            }"
            @click="activeAddLang = l.code"
          >
            <img :src="l.flagImg" :alt="l.short" class="lang-flag" />
            <span>{{ l.short }}</span>
            <span v-if="addI18n[l.code]?.Noi_dung?.trim()" class="lang-dot"></span>
          </button>
        </div>
      </div>
      <div class="card-body">
        <div class="add-area">
          <input
            v-model="addI18n[activeAddLang].Noi_dung"
            :placeholder="`Nhập nội dung khuyến mãi (${SUPPORTED_DATA_LANGS.find((x) => x.code === activeAddLang)?.label})...`"
            class="input-field"
            @keypress.enter="addKhuyenMai"
          />
          <button
            :disabled="loading || !hasAnyAddText"
            class="btn btn-primary"
            @click="addKhuyenMai"
          >
            <span v-if="loading" class="btn-loading">
              <span class="spinner"></span>
              Đang thêm...
            </span>
            <span v-else>Thêm Khuyến mãi</span>
          </button>
        </div>
      </div>
    </div>

    <!-- TEXT PROMO LIST -->
    <div class="card list-card">
      <div class="card-header list-header-wrap">
        <h3 class="card-title">
          <i class="ri-layout-grid-fill"></i>
          <span>Danh sách Ghi chú Khuyến mãi</span>
        </h3>
        <div class="header-right-tools">
          <div class="lang-tabs mini">
            <button
              v-for="l in SUPPORTED_DATA_LANGS"
              :key="l.code"
              type="button"
              class="lang-tab-btn"
              :class="{ active: previewLang === l.code }"
              :title="`Xem bản ${l.label}`"
              @click="previewLang = l.code"
            >
              <img :src="l.flagImg" :alt="l.short" class="lang-flag" />
              <span>{{ l.short }}</span>
            </button>
          </div>
          <div class="badge">{{ textList.length }} dòng ghi chú</div>
        </div>
      </div>

      <div v-if="tableLoading" class="card-body">
        <div class="table-loading compact">
          <div class="table-loading-spinner"></div>
          <div class="table-loading-text">Đang tải danh sách khuyến mãi...</div>
        </div>
      </div>

      <div v-else-if="textList.length" class="card-body no-padding">
        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th class="th-index">Vị trí hiển thị</th>
                <th class="th-content">
                  Nội dung ({{ SUPPORTED_DATA_LANGS.find((x) => x.code === previewLang)?.label }})
                </th>
                <th class="th-action">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(k, i) in textList" :key="k.ID" class="table-row">
                <td class="td-index" data-label="Vị trí hiển thị">
                  <div class="index-badge">#{{ i + 1 }}</div>
                </td>
                <td class="td-content td-left" data-label="Nội dung">
                  <div class="content-text">{{ resolveNoticeText(k, previewLang) }}</div>
                  <div class="lang-badges-row">
                    <span
                      v-for="l in SUPPORTED_DATA_LANGS"
                      :key="l.code"
                      class="lang-mini-pill"
                      :class="{ ok: getNoticeTranslatedLangs(k).includes(l.code) }"
                    >
                      {{ l.short }}
                    </span>
                  </div>
                </td>
                <td class="td-action" data-label="Thao tác">
                  <div class="action-group">
                    <button
                      class="btn-icon-action btn-edit"
                      title="Chỉnh sửa"
                      @click="openEdit(k)"
                    >
                      <span class="text">Sửa</span>
                    </button>
                    <button
                      class="btn-icon-action btn-delete"
                      title="Xóa"
                      @click="deleteItem(k.ID)"
                    >
                      <span class="text">Xóa</span>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div v-else class="card-body">
        <div class="empty-state compact">
          <div class="empty-icon"><i class="ri-add-circle-fill"></i></div>
          <h3 class="empty-title">Chưa có dòng ghi chú khuyến mãi nào</h3>
          <p class="empty-text">Các dòng khuyến mãi dạng chữ sẽ hiển thị thêm ở cuối giỏ hàng</p>
        </div>
      </div>
    </div>
  </div>

  <!-- ============================================================ -->
  <!-- EDIT MILESTONE MODAL                                         -->
  <!-- ============================================================ -->
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="showEditMilestoneModal"
        class="modal-overlay"
        @click.self="closeEditMilestoneModal"
      >
        <div class="modal-container">
          <div class="modal-header">
            <div class="modal-title-group">
              <h3 class="modal-title">Chỉnh sửa Mốc Ưu Đãi</h3>
            </div>
            <button type="button" class="modal-close" @click="closeEditMilestoneModal">
              <i class="ri-close-line"></i>
            </button>
          </div>

          <div class="modal-body">
            <div class="modal-row-2col">
              <div class="modal-field">
                <label class="modal-label">Loại ưu đãi</label>
                <div class="ms-type-switch">
                  <button
                    type="button"
                    class="ms-type-btn"
                    :class="{ active: editMilestoneType === 'FREESHIP' }"
                    @click="editMilestoneType = 'FREESHIP'"
                  >
                    <i class="ri-truck-line"></i>
                    <span>Freeship</span>
                  </button>
                  <button
                    type="button"
                    class="ms-type-btn gift"
                    :class="{ active: editMilestoneType === 'GIFT' }"
                    @click="editMilestoneType = 'GIFT'"
                  >
                    <i class="ri-gift-line"></i>
                    <span>Tặng thêm món</span>
                  </button>
                </div>
              </div>

              <div class="modal-field">
                <label class="modal-label">Mốc tiền tối thiểu</label>
                <input
                  v-model.number="editMilestoneAmount"
                  type="number"
                  min="1"
                  step="any"
                  class="input-field"
                  placeholder="VD: 500"
                />
              </div>
            </div>

            <div class="modal-field">
              <label class="modal-label">Trạng thái hiển thị</label>
              <button
                type="button"
                class="ms-toggle-pill"
                :class="{ on: editMilestoneActive }"
                @click="editMilestoneActive = !editMilestoneActive"
              >
                <span class="ms-toggle-dot"></span>
                <span>{{ editMilestoneActive ? 'Đang bật áp dụng' : 'Đang tạm tắt' }}</span>
              </button>
            </div>

            <div class="lang-tabs modal-lang-tabs">
              <button
                v-for="l in SUPPORTED_DATA_LANGS"
                :key="'edit-ms-' + l.code"
                type="button"
                class="lang-tab-btn"
                :class="{
                  active: activeEditMilestoneLang === l.code,
                  filled: Boolean(editMilestoneI18n[l.code]?.Noi_dung?.trim()),
                }"
                @click="activeEditMilestoneLang = l.code"
              >
                <img :src="l.flagImg" :alt="l.short" class="lang-flag" />
                <span>{{ l.label }}</span>
                <span v-if="editMilestoneI18n[l.code]?.Noi_dung?.trim()" class="lang-dot"></span>
              </button>
            </div>

            <div class="modal-field" style="margin-bottom: 0">
              <label class="modal-label">
                <template v-if="editMilestoneType === 'FREESHIP'">
                  Ghi chú Freeship ({{ SUPPORTED_DATA_LANGS.find((x) => x.code === activeEditMilestoneLang)?.label }} - tùy chọn)
                </template>
                <template v-else>
                  Tên món / quà tặng ({{ SUPPORTED_DATA_LANGS.find((x) => x.code === activeEditMilestoneLang)?.label }})
                </template>
              </label>
              <textarea
                v-model="editMilestoneI18n[activeEditMilestoneLang].Noi_dung"
                rows="3"
                class="modal-textarea"
                :placeholder="
                  editMilestoneType === 'FREESHIP'
                    ? 'Bỏ trống sẽ tự hiện Freeship theo ngôn ngữ khách...'
                    : 'Nhập tên quà tặng (VD: Tặng 1 Trà đào)...'
                "
              ></textarea>
            </div>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="closeEditMilestoneModal">
              <i class="ri-close-line btn-icon"></i>
              <span>Hủy</span>
            </button>
            <button
              type="button"
              class="btn btn-success"
              :disabled="milestoneSaving || !canSubmitEditMilestone"
              @click="saveEditMilestone"
            >
              <span v-if="milestoneSaving" class="btn-loading">
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

  <!-- ============================================================ -->
  <!-- EDIT TEXT PROMO MODAL (EXISTING)                             -->
  <!-- ============================================================ -->
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="showEditModal" class="modal-overlay" @click.self="closeEditModal">
        <div class="modal-container">
          <div class="modal-header">
            <div class="modal-title-group">
              <h3 class="modal-title">Chỉnh sửa Ghi chú Khuyến mãi</h3>
            </div>
            <button type="button" class="modal-close" @click="closeEditModal">
              <i class="ri-close-line"></i>
            </button>
          </div>

          <div class="modal-body">
            <div class="lang-tabs modal-lang-tabs">
              <button
                v-for="l in SUPPORTED_DATA_LANGS"
                :key="l.code"
                type="button"
                class="lang-tab-btn"
                :class="{
                  active: activeEditLang === l.code,
                  filled: Boolean(editI18n[l.code]?.Noi_dung?.trim()),
                }"
                @click="activeEditLang = l.code"
              >
                <img :src="l.flagImg" :alt="l.short" class="lang-flag" />
                <span>{{ l.label }}</span>
                <span v-if="editI18n[l.code]?.Noi_dung?.trim()" class="lang-dot"></span>
              </button>
            </div>

            <div class="modal-field" style="margin-bottom: 0">
              <label class="modal-label">
                Nội dung ({{ SUPPORTED_DATA_LANGS.find((x) => x.code === activeEditLang)?.label }})
              </label>
              <textarea
                v-model="editI18n[activeEditLang].Noi_dung"
                rows="5"
                class="modal-textarea"
                :placeholder="`Nhập nội dung khuyến mãi tiếng ${SUPPORTED_DATA_LANGS.find((x) => x.code === activeEditLang)?.label}...`"
              ></textarea>
            </div>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="closeEditModal">
              <i class="ri-close-line btn-icon"></i>
              <span>Hủy</span>
            </button>
            <button
              type="button"
              :disabled="loading || !hasAnyEditText"
              class="btn btn-success"
              @click="saveEdit"
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

/* LAYOUT */
.admin-page {
  min-height: 100vh;
  background: rgb(15, 23, 42);
  padding: 24px;
}

/* PAGE HEADER */
.page-header {
  margin-bottom: 28px;
}

.header-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.page-title {
  font-size: 28px;
  font-weight: 700;
  color: #ffffff;
  margin-bottom: 4px;
}

.page-subtitle {
  font-size: 14px;
  color: #e2e8f0;
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

.milestone-config-card {
  border-color: rgba(34, 197, 94, 0.35);
  box-shadow: 0 8px 30px rgba(16, 185, 129, 0.12);
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
  font-weight: 600;
  color: #ffffff;
  display: flex;
  align-items: center;
  gap: 8px;
}

.accent-emerald {
  color: #4ade80;
}

.card-sub-hint {
  margin-top: 4px;
  font-size: 13px;
  color: #94a3b8;
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

.badge-emerald {
  background: rgba(16, 185, 129, 0.2);
  border-color: rgba(16, 185, 129, 0.4);
  color: #86efac;
}

.card-body {
  padding: 24px;
}

.card-body.no-padding {
  padding: 0;
}

/* MILESTONE FORM */
.milestone-form-grid {
  display: grid;
  grid-template-columns: 270px 230px 1fr;
  gap: 16px;
  align-items: end;
}

.ms-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.ms-field-wide {
  min-width: 0;
}

.ms-label {
  font-size: 12px;
  font-weight: 700;
  color: #cbd5e1;
  text-transform: uppercase;
  letter-spacing: 0.4px;
}

.ms-type-switch {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.ms-type-btn {
  height: 44px;
  padding: 0 12px;
  border-radius: 10px;
  border: 1px solid rgba(148, 163, 184, 0.25);
  background: rgba(15, 23, 42, 0.6);
  color: #cbd5e1;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.ms-type-btn:hover {
  border-color: rgba(34, 197, 94, 0.45);
  color: #ffffff;
}

.ms-type-btn.active {
  background: rgba(16, 185, 129, 0.22);
  border-color: #10b981;
  color: #86efac;
  box-shadow: 0 0 0 1px rgba(16, 185, 129, 0.25);
}

.ms-type-btn.gift.active {
  background: rgba(245, 158, 11, 0.2);
  border-color: #f59e0b;
  color: #fde68a;
  box-shadow: 0 0 0 1px rgba(245, 158, 11, 0.25);
}

.ms-amount-input {
  font-weight: 700;
  font-size: 15px;
}

.milestone-list-divider {
  padding: 14px 24px;
  background: rgba(15, 23, 42, 0.55);
  border-top: 1px solid rgba(148, 163, 184, 0.12);
  border-bottom: 1px solid rgba(148, 163, 184, 0.12);
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
}

.mld-left {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: #e2e8f0;
}

/* ADD AREA */
.add-area {
  display: flex;
  gap: 12px;
  align-items: center;
}

.input-field {
  flex: 1;
  width: 100%;
  height: 44px;
  padding: 10px 16px;
  background: rgba(51, 65, 85, 0.5);
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 10px;
  color: #ffffff;
  font-size: 14px;
  transition: all 0.3s ease;
}

.input-field::placeholder {
  color: #94a3b8;
}

.input-field:focus {
  outline: none;
  border-color: rgba(16, 185, 129, 0.6);
  background: rgba(51, 65, 85, 0.75);
}

/* BUTTONS */
.btn {
  padding: 12px 22px;
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
  white-space: nowrap;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background: #16a34a;
  color: white;
  box-shadow: 0 4px 16px rgba(22, 163, 74, 0.3);
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 24px rgba(22, 163, 74, 0.4);
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
  border: 1px solid rgba(148, 163, 184, 0.2);
}

.btn-secondary:hover {
  background: rgba(51, 65, 85, 0.8);
  transform: translateY(-2px);
}

.btn-icon {
  font-size: 16px;
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

/* TABLE LOADING */
.table-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 64px 20px;
  gap: 16px;
}

.table-loading.compact {
  padding: 40px 20px;
}

.table-loading-spinner {
  width: 44px;
  height: 44px;
  border: 4px solid rgba(16, 185, 129, 0.2);
  border-top-color: #10b981;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.table-loading-text {
  font-size: 14px;
  font-weight: 600;
  color: #e2e8f0;
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
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
  padding: 14px 20px;
  text-align: center;
  font-size: 12px;
  font-weight: 700;
  color: #cbd5e1;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.data-table td {
  padding: 16px 20px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.06);
  vertical-align: middle;
}

.table-row {
  transition: all 0.2s ease;
}

.table-row:hover {
  background: rgba(51, 65, 85, 0.3);
}

.table-row.row-muted {
  opacity: 0.58;
}

.th-index {
  width: 140px;
}

.th-ms-amount {
  width: 170px;
}

.th-ms-type {
  width: 150px;
}

.th-ms-status {
  width: 150px;
}

.th-content {
  width: auto;
  text-align: left !important;
}

.th-action {
  width: 180px;
}

.td-index,
.td-ms-type,
.td-ms-status,
.td-action {
  text-align: center;
}

.td-content.td-left {
  text-align: left;
}

.index-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 50px;
  height: 36px;
  background: rgba(59, 130, 246, 0.2);
  color: #ffffff;
  border-radius: 8px;
  font-weight: 700;
  font-size: 14px;
  border: 1px solid rgba(59, 130, 246, 0.3);
  padding: 0 12px;
}

.ms-threshold-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 36px;
  padding: 0 14px;
  border-radius: 999px;
  background: rgba(16, 185, 129, 0.18);
  border: 1px solid rgba(16, 185, 129, 0.42);
  color: #86efac;
  font-weight: 700;
  font-size: 13px;
  white-space: nowrap;
}

.ms-kind-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;
}

.ms-kind-badge.freeship {
  background: rgba(59, 130, 246, 0.18);
  border: 1px solid rgba(59, 130, 246, 0.38);
  color: #93c5fd;
}

.ms-kind-badge.gift {
  background: rgba(245, 158, 11, 0.18);
  border: 1px solid rgba(245, 158, 11, 0.38);
  color: #fde68a;
}

.ms-toggle-pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.3);
  background: rgba(51, 65, 85, 0.55);
  color: #94a3b8;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
}

.ms-toggle-pill .ms-toggle-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #64748b;
}

.ms-toggle-pill.on {
  background: rgba(16, 185, 129, 0.18);
  border-color: rgba(16, 185, 129, 0.45);
  color: #86efac;
}

.ms-toggle-pill.on .ms-toggle-dot {
  background: #22c55e;
  box-shadow: 0 0 8px rgba(34, 197, 94, 0.8);
}

.content-text {
  color: #ffffff;
  font-size: 14px;
  font-weight: 500;
  line-height: 1.5;
}

.action-group {
  display: flex;
  justify-content: center;
  gap: 8px;
}

.btn-icon-action {
  padding: 8px 16px;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.25s ease;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.btn-edit {
  background: #16a34a;
  color: white;
  box-shadow: 0 3px 12px rgba(22, 163, 74, 0.28);
  font-weight: 700;
}

.btn-edit:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 16px rgba(22, 163, 74, 0.4);
}

.btn-delete {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: white;
  box-shadow: 0 3px 12px rgba(239, 68, 68, 0.3);
}

.btn-delete:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 16px rgba(239, 68, 68, 0.4);
}

/* EMPTY STATE */
.empty-state {
  text-align: center;
  padding: 56px 20px;
}

.empty-state.compact {
  padding: 36px 20px;
}

.empty-icon {
  font-size: 52px;
  margin-bottom: 12px;
  color: #64748b;
  opacity: 0.5;
}

.empty-title {
  font-size: 17px;
  font-weight: 600;
  color: #ffffff;
  margin-bottom: 6px;
}

.empty-text {
  font-size: 13px;
  color: #cbd5e1;
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
  border: 1px solid rgba(148, 163, 184, 0.15);
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
  background: rgba(51, 65, 85, 0.5);
  color: #e2e8f0;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.25s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
}

.modal-close:hover {
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
}

.modal-body {
  padding: 24px;
  overflow-y: auto;
  flex: 1;
}

.modal-row-2col {
  display: grid;
  grid-template-columns: 1.2fr 1fr;
  gap: 14px;
}

.modal-field {
  margin-bottom: 18px;
}

.modal-label {
  display: block;
  font-size: 12px;
  font-weight: 700;
  color: #cbd5e1;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  margin-bottom: 8px;
}

.modal-textarea {
  width: 100%;
  padding: 12px;
  background: rgba(51, 65, 85, 0.5);
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 10px;
  color: #ffffff;
  font-size: 14px;
  font-family: inherit;
  resize: vertical;
  transition: all 0.3s ease;
}

.modal-textarea::placeholder {
  color: #94a3b8;
}

.modal-textarea:focus {
  outline: none;
  border-color: rgba(16, 185, 129, 0.55);
  background: rgba(51, 65, 85, 0.75);
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
  transform: scale(0.94) translateY(-12px);
}

/* MULTI-LANGUAGE TABS & BADGES */
.list-header-wrap {
  flex-wrap: wrap;
  gap: 12px;
}

.header-right-tools {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.lang-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.modal-lang-tabs {
  margin-bottom: 14px;
}

.lang-tab-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border-radius: 8px;
  border: 1px solid rgba(148, 163, 184, 0.25);
  background: rgba(15, 23, 42, 0.55);
  color: #cbd5e1;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.lang-tab-btn:hover {
  border-color: rgba(34, 197, 94, 0.5);
  color: #ffffff;
}

.lang-tab-btn.active {
  background: rgba(34, 197, 94, 0.2);
  border-color: #22c55e;
  color: #86efac;
}

.lang-flag {
  width: 16px;
  height: 12px;
  object-fit: cover;
  border-radius: 2px;
}

.lang-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #4ade80;
}

.lang-badges-row {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 8px;
}

.lang-mini-pill {
  font-size: 10px;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 6px;
  background: rgba(148, 163, 184, 0.12);
  color: #64748b;
  border: 1px solid rgba(148, 163, 184, 0.18);
}

.lang-mini-pill.ok {
  background: rgba(34, 197, 94, 0.16);
  color: #86efac;
  border-color: rgba(34, 197, 94, 0.35);
}

/* RESPONSIVE */
@media (max-width: 1080px) {
  .milestone-form-grid {
    grid-template-columns: 1fr 1fr;
  }

  .ms-field-wide {
    grid-column: 1 / -1;
  }
}

@media (max-width: 768px) {
  .admin-page {
    padding: 16px;
  }

  .page-header {
    margin-bottom: 20px;
  }

  .page-title {
    font-size: 22px;
  }

  .page-subtitle {
    font-size: 13px;
  }

  .card-header,
  .card-body,
  .milestone-list-divider {
    padding: 16px;
  }

  .milestone-form-grid,
  .modal-row-2col {
    grid-template-columns: 1fr;
  }

  .add-area {
    flex-direction: column;
  }

  .input-field,
  .btn {
    width: 100%;
  }

  /* TABLE MOBILE */
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
    background: rgba(51, 65, 85, 0.3);
    border-radius: 12px;
    padding: 14px;
    border: 1px solid rgba(148, 163, 184, 0.12);
  }

  .data-table td {
    display: block;
    padding: 8px 0;
    border: none;
    text-align: left !important;
  }

  .data-table td::before {
    content: attr(data-label);
    display: block;
    font-size: 11px;
    font-weight: 700;
    color: #94a3b8;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 5px;
  }

  .action-group {
    flex-direction: row;
    gap: 8px;
  }

  .btn-icon-action {
    flex: 1;
    justify-content: center;
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
