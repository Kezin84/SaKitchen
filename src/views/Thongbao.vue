<script setup>
import { ref, onMounted, computed } from 'vue'
import { getOneSheet, dispatchAction } from '@/config/api'
import { uploadImageToImgBB } from '@/utils/imageUpload.js'
import {
  SUPPORTED_DATA_LANGS,
  createEmptyNoticeI18n,
  normalizeNoticeI18n,
  resolveNoticeText,
  getNoticeTranslatedLangs,
} from '@/utils/i18nData'

/* ======================
   STATE
====================== */
const thongBao = ref([])
const activeAddLang = ref('vi')
const addType = ref('marquee') // 'marquee' | 'popup'
const addI18n = ref(createEmptyNoticeI18n())
const addPopupImgUrl = ref('')
const addPopupImgFile = ref(null)
const addPopupImgPreview = ref('')
const addPopupImgInput = ref(null)
const addPopupLink = ref('')
const addPopupActive = ref(true)

const previewLang = ref('vi')
const loading = ref(false)
const tableLoading = ref(true)
const togglingId = ref('')

/* ===== EDIT MODAL ===== */
const showEditModal = ref(false)
const editingItem = ref(null)
const editType = ref('marquee')
const activeEditLang = ref('vi')
const editI18n = ref(createEmptyNoticeI18n())
const editPopupImgUrl = ref('')
const editPopupImgFile = ref(null)
const editPopupImgPreview = ref('')
const editPopupImgInput = ref(null)
const editPopupLink = ref('')
const editPopupActive = ref(true)

const hasAnyAddText = computed(() =>
  SUPPORTED_DATA_LANGS.some((l) => addI18n.value[l.code]?.Noi_dung?.trim()),
)

const hasAddPopupImg = computed(() =>
  Boolean(addPopupImgFile.value || String(addPopupImgUrl.value || '').trim()),
)

const canSubmitAdd = computed(() =>
  addType.value === 'popup' ? hasAddPopupImg.value || hasAnyAddText.value : hasAnyAddText.value,
)

const hasAnyEditText = computed(() =>
  SUPPORTED_DATA_LANGS.some((l) => editI18n.value[l.code]?.Noi_dung?.trim()),
)

const hasEditPopupImg = computed(() =>
  Boolean(editPopupImgFile.value || String(editPopupImgUrl.value || '').trim()),
)

const canSubmitEdit = computed(() =>
  editType.value === 'popup' ? hasEditPopupImg.value || hasAnyEditText.value : hasAnyEditText.value,
)

function onSelectAddPopupImg(e) {
  const f = e.target.files?.[0]
  if (!f) return
  if (!f.type.startsWith('image/')) {
    alert('Vui lòng chọn file ảnh')
    return
  }
  addPopupImgFile.value = f
  addPopupImgPreview.value = URL.createObjectURL(f)
}

function clearAddPopupImg() {
  addPopupImgFile.value = null
  addPopupImgPreview.value = ''
  addPopupImgUrl.value = ''
  if (addPopupImgInput.value) addPopupImgInput.value.value = ''
}

function onSelectEditPopupImg(e) {
  const f = e.target.files?.[0]
  if (!f) return
  if (!f.type.startsWith('image/')) {
    alert('Vui lòng chọn file ảnh')
    return
  }
  editPopupImgFile.value = f
  editPopupImgPreview.value = URL.createObjectURL(f)
}

function clearEditPopupImg() {
  editPopupImgFile.value = null
  editPopupImgPreview.value = ''
  editPopupImgUrl.value = ''
  if (editPopupImgInput.value) editPopupImgInput.value.value = ''
}

async function uploadPopupImage(file) {
  return uploadImageToImgBB(file, {
    targetKB: 180,
    maxWidth: 1200,
    maxHeight: 1600,
  })
}

/* ======================
   HELPERS
====================== */
function genNotiId() {
  const d = new Date()
  const p = (n) => String(n).padStart(2, '0')
  return (
    'NOTI_' +
    d.getFullYear() +
    p(d.getMonth() + 1) +
    p(d.getDate()) +
    '_' +
    p(d.getHours()) +
    p(d.getMinutes()) +
    p(d.getSeconds())
  )
}

/* ======================
   LOAD DATA
====================== */
function getNoticeType(item) {
  return item?.Loai_thong_bao === 'popup' ? 'popup' : 'marquee'
}

function isNoticeActive(item) {
  return item?.Kich_hoat !== false && String(item?.Kich_hoat) !== 'false'
}

async function loadThongBao() {
  tableLoading.value = true
  try {
    const json = await getOneSheet('thong_bao')
    const rows = (json.data || []).reverse()
    const seenActiveByType = { marquee: false, popup: false }
    const duplicateIds = []

    for (const row of rows) {
      const type = getNoticeType(row)
      if (isNoticeActive(row)) {
        if (!seenActiveByType[type]) {
          seenActiveByType[type] = true
        } else {
          row.Kich_hoat = false
          if (row.ID) duplicateIds.push(row.ID)
        }
      }
    }

    thongBao.value = rows

    if (duplicateIds.length) {
      Promise.all(
        duplicateIds.map((id) =>
          dispatchAction({
            action: 'updateThongBao',
            data: { ID: id, Kich_hoat: false },
          }),
        ),
      ).catch((e) => console.error('Normalize single active notice error:', e))
    }
  } finally {
    tableLoading.value = false
  }
}

/* ======================
   ADD
====================== */
async function addThongBao() {
  if (!canSubmitAdd.value) {
    alert(
      addType.value === 'popup'
        ? 'Vui lòng chọn ảnh popup hoặc nhập nội dung thông báo'
        : 'Chưa nhập nội dung thông báo',
    )
    return
  }

  loading.value = true
  try {
    const viDefault =
      addI18n.value.vi.Noi_dung.trim() ||
      SUPPORTED_DATA_LANGS.map((l) => addI18n.value[l.code].Noi_dung.trim()).find(Boolean) ||
      ''

    let finalPopupImg = String(addPopupImgUrl.value || '').trim()
    if (addType.value === 'popup' && addPopupImgFile.value) {
      finalPopupImg = await uploadPopupImage(addPopupImgFile.value)
    }

    await dispatchAction({
      action: 'addThongBao',
      data: {
        ID: genNotiId(),
        Noi_dung: viDefault,
        i18n: addI18n.value,
        Loai_thong_bao: addType.value,
        Popup_img: addType.value === 'popup' ? finalPopupImg : '',
        Popup_link: addType.value === 'popup' ? String(addPopupLink.value || '').trim() : '',
        Kich_hoat: Boolean(addPopupActive.value),
      },
    })

    addI18n.value = createEmptyNoticeI18n()
    activeAddLang.value = 'vi'
    clearAddPopupImg()
    addPopupLink.value = ''
    addPopupActive.value = true
    await loadThongBao()
  } catch (e) {
    console.error(e)
    alert('Lỗi thêm thông báo')
  } finally {
    loading.value = false
  }
}

/* ======================
   EDIT
====================== */
function openEditModal(item) {
  editingItem.value = item
  editType.value = item?.Loai_thong_bao === 'popup' ? 'popup' : 'marquee'
  editI18n.value = normalizeNoticeI18n(item)
  editPopupImgUrl.value = String(item?.Popup_img || '').trim()
  editPopupImgFile.value = null
  editPopupImgPreview.value = ''
  editPopupLink.value = String(item?.Popup_link || '').trim()
  editPopupActive.value = isNoticeActive(item)
  activeEditLang.value = previewLang.value || 'vi'
  showEditModal.value = true
}

async function saveEdit() {
  if (!canSubmitEdit.value) {
    alert(
      editType.value === 'popup'
        ? 'Vui lòng chọn ảnh popup hoặc nhập nội dung'
        : 'Nội dung trống',
    )
    return
  }

  loading.value = true
  try {
    const viDefault =
      editI18n.value.vi.Noi_dung.trim() ||
      SUPPORTED_DATA_LANGS.map((l) => editI18n.value[l.code].Noi_dung.trim()).find(Boolean) ||
      ''

    let finalPopupImg = String(editPopupImgUrl.value || '').trim()
    if (editType.value === 'popup' && editPopupImgFile.value) {
      finalPopupImg = await uploadPopupImage(editPopupImgFile.value)
    }

    await dispatchAction({
      action: 'updateThongBao',
      data: {
        ID: editingItem.value.ID,
        Noi_dung: viDefault,
        i18n: editI18n.value,
        Loai_thong_bao: editType.value,
        Popup_img: editType.value === 'popup' ? finalPopupImg : '',
        Popup_link: editType.value === 'popup' ? String(editPopupLink.value || '').trim() : '',
        Kich_hoat: Boolean(editPopupActive.value),
      },
    })

    closeEditModal()
    await loadThongBao()
  } catch (e) {
    console.error(e)
    alert('Lỗi cập nhật thông báo')
    loading.value = false
  }
}

async function toggleNoticeActive(item) {
  if (!item?.ID || togglingId.value) return
  const targetType = getNoticeType(item)
  const nextActive = !isNoticeActive(item)
  togglingId.value = item.ID
  try {
    await dispatchAction({
      action: 'updateThongBao',
      data: {
        ID: item.ID,
        Kich_hoat: nextActive,
      },
    })

    if (nextActive) {
      for (const row of thongBao.value) {
        if (getNoticeType(row) === targetType) {
          row.Kich_hoat = row.ID === item.ID
        }
      }
    } else {
      item.Kich_hoat = false
    }
  } catch (e) {
    console.error(e)
    alert('Lỗi đổi trạng thái thông báo')
  } finally {
    togglingId.value = ''
  }
}

function closeEditModal() {
  showEditModal.value = false
  editingItem.value = null
  editType.value = 'marquee'
  editI18n.value = createEmptyNoticeI18n()
  clearEditPopupImg()
  editPopupLink.value = ''
  editPopupActive.value = true
  loading.value = false
}

/* ======================
   DELETE
====================== */
async function deleteThongBao(id) {
  if (!confirm('Xóa thông báo này?')) return

  try {
    await dispatchAction({
      action: 'deleteThongBao',
      ID: id,
    })
    await loadThongBao()
  } catch (e) {
    console.error(e)
    alert('Lỗi xóa thông báo')
  }
}

/* ======================
   INIT
====================== */
onMounted(async () => {
  await loadThongBao()
})
</script>

<template>
  <div class="admin-page">
    <!-- HEADER -->
    <div class="page-header">
      <div class="header-content">
        <div>
          <h1 style="color: rgb(134, 239, 172); text-shadow: 0 0 10px rgba(34, 197, 94, 0.5);font-weight: bold;">QUẢN LÝ THÔNG BÁO WEB</h1>
          <p class="page-subtitle">Gom đa ngôn ngữ (VI · EN · ZH · FIL · KO) trên cùng 1 thông báo</p>
        </div>
      </div>
    </div>

    <!-- ADD SECTION -->
    <div class="card add-card">
      <div class="card-header list-header-wrap">
        <div class="add-title-with-type">
          <h3 class="card-title"><i class="ri-add-circle-fill"></i>Thêm thông báo mới</h3>
          <div class="noti-type-switch" role="tablist" aria-label="Chọn loại thông báo">
            <button
              type="button"
              class="type-switch-btn"
              :class="{ active: addType === 'marquee' }"
              @click="addType = 'marquee'"
            >
              <i class="ri-volume-up-line"></i> Chạy chữ (Marquee)
            </button>
            <button
              type="button"
              class="type-switch-btn is-popup"
              :class="{ active: addType === 'popup' }"
              @click="addType = 'popup'"
            >
              <i class="ri-window-line"></i> Thông báo Popup
            </button>
          </div>
        </div>
        <div class="lang-tabs">
          <button
            v-for="l in SUPPORTED_DATA_LANGS"
            :key="l.code"
            type="button"
            class="lang-tab-btn"
            :class="{ active: activeAddLang === l.code, filled: Boolean(addI18n[l.code]?.Noi_dung?.trim()) }"
            @click="activeAddLang = l.code"
          >
            <img :src="l.flagImg" :alt="l.short" class="lang-flag" />
            <span>{{ l.short }}</span>
            <span v-if="addI18n[l.code]?.Noi_dung?.trim()" class="lang-dot"></span>
          </button>
        </div>
      </div>
      <div class="card-body">
        <div v-if="addType === 'popup'" class="popup-config-grid">
          <div class="popup-img-col">
            <label class="popup-field-label">Ảnh Popup (hiện khi khách vào trang order)</label>
            <div class="popup-img-actions">
              <label class="btn-upload-popup">
                <i class="ri-image-add-line"></i>
                <span>{{ addPopupImgFile ? 'Đổi ảnh tải lên' : 'Chọn ảnh từ máy' }}</span>
                <input
                  ref="addPopupImgInput"
                  type="file"
                  accept="image/*"
                  hidden
                  @change="onSelectAddPopupImg"
                />
              </label>
              <button
                v-if="addPopupImgPreview || addPopupImgUrl"
                type="button"
                class="btn-clear-popup-img"
                @click="clearAddPopupImg"
              >
                <i class="ri-delete-bin-line"></i> Xóa ảnh
              </button>
            </div>
                <input
                  v-model="addPopupImgUrl"
                  :disabled="Boolean(addPopupImgFile)"
                  placeholder="Hoặc dán trực tiếp URL ảnh popup..."
                  class="input-field popup-sub-input"
                />
                <div class="upload-size-hint">
                  Kích thước chuẩn: <strong>800 × 1000 px</strong> hoặc <strong>900 × 1200 px</strong> (tỉ lệ dọc 4:5 / 3:4 hoặc vuông 1:1) · Tối đa 1200 × 1600 px (~180KB)
                </div>
            <div v-if="addPopupImgPreview || addPopupImgUrl" class="popup-img-preview-box">
              <img :src="addPopupImgPreview || addPopupImgUrl" alt="Preview popup" />
            </div>
          </div>

          <div class="popup-meta-col">
            <div>
              <label class="popup-field-label">Link khi khách click vào Popup (tùy chọn)</label>
              <input
                v-model="addPopupLink"
                placeholder="VD: https://... hoặc để trống nếu chỉ xem ảnh"
                class="input-field"
              />
            </div>
          </div>
        </div>

        <label class="popup-active-toggle notice-limit-toggle">
          <input type="checkbox" v-model="addPopupActive" />
          <span>Hiển thị ngay cho khách (tối đa 1 thông báo/loại — bật cái này sẽ tự ẩn cái cùng loại khác)</span>
        </label>

        <div class="add-area">
          <input
            v-model="addI18n[activeAddLang].Noi_dung"
            :placeholder="
              addType === 'popup'
                ? `Nhập chữ chú thích popup (${SUPPORTED_DATA_LANGS.find(x => x.code === activeAddLang)?.label}, tùy chọn nếu đã có ảnh)...`
                : `Nhập nội dung thông báo (${SUPPORTED_DATA_LANGS.find(x => x.code === activeAddLang)?.label})...`
            "
            class="input-field"
            @keypress.enter="addThongBao"
          />
          <button
            @click="addThongBao"
            :disabled="loading || !canSubmitAdd"
            class="btn btn-primary"
          >
            <span v-if="loading" class="btn-loading">
              <span class="spinner"></span>
              {{ addType === 'popup' && addPopupImgFile ? 'Đang tải ảnh & lưu...' : 'Đang thêm...' }}
            </span>
            <span v-else>
              {{ addType === 'popup' ? 'Thêm Thông báo Popup' : 'Thêm Thông báo' }}
            </span>
          </button>
        </div>
      </div>
    </div>

    <!-- LIST -->
    <div class="card list-card">
      <div class="card-header list-header-wrap">
        <h3 class="card-title"><i class="ri-notification-fill"></i> Danh sách Thông báo</h3>
        <div class="header-right-tools">
          <div class="lang-tabs mini">
            <button
              v-for="l in SUPPORTED_DATA_LANGS"
              :key="l.code"
              type="button"
              class="lang-tab-btn"
              :class="{ active: previewLang === l.code }"
              @click="previewLang = l.code"
              :title="`Xem bản ${l.label}`"
            >
              <img :src="l.flagImg" :alt="l.short" class="lang-flag" />
              <span>{{ l.short }}</span>
            </button>
          </div>
          <div class="badge">{{ thongBao.length }} thông báo</div>
        </div>
      </div>

      <!-- TABLE LOADING -->
      <div v-if="tableLoading" class="card-body">
        <div class="table-loading">
          <div class="table-loading-spinner"></div>
          <div class="table-loading-text">Đang tải danh sách thông báo...</div>
        </div>
      </div>

      <!-- TABLE CONTENT -->
      <div v-else-if="thongBao.length" class="card-body no-padding">
        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th class="th-index">Vị trí hiển thị</th>
                <th class="th-content">Nội dung ({{ SUPPORTED_DATA_LANGS.find(x => x.code === previewLang)?.label }})</th>
                <th class="th-action">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(t, i) in thongBao" :key="t.ID" class="table-row">
                <td class="td-index" data-label="Vị trí hiển thị">
                  <div class="index-badge">#{{ i + 1 }}</div>
                </td>
                <td class="td-content" data-label="Nội dung">
                  <div class="noti-row-top-badges">
                    <span
                      class="noti-type-badge"
                      :class="t.Loai_thong_bao === 'popup' ? 'is-popup' : 'is-marquee'"
                    >
                      <i :class="t.Loai_thong_bao === 'popup' ? 'ri-window-line' : 'ri-volume-up-line'"></i>
                      {{ t.Loai_thong_bao === 'popup' ? 'Popup' : 'Chạy chữ' }}
                    </span>
                    <span
                      class="noti-active-status-pill"
                      :class="{ 'is-off': !isNoticeActive(t) }"
                    >
                      {{ isNoticeActive(t) ? 'Đang hiển thị' : 'Tạm ẩn' }}
                    </span>
                  </div>

                  <div v-if="t.Loai_thong_bao === 'popup'" class="popup-row-preview-wrap">
                    <img
                      v-if="t.Popup_img"
                      :src="t.Popup_img"
                      alt="Popup"
                      class="popup-row-thumb"
                    />
                    <div class="popup-row-meta">
                      <div v-if="resolveNoticeText(t, previewLang)" class="content-text">
                        {{ resolveNoticeText(t, previewLang) }}
                      </div>
                      <div v-else class="content-text muted-italic">(Chỉ hiển thị ảnh popup)</div>
                      <a
                        v-if="t.Popup_link"
                        :href="t.Popup_link"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="popup-row-link"
                      >
                        <i class="ri-links-line"></i> {{ t.Popup_link }}
                      </a>
                    </div>
                  </div>
                  <div v-else class="content-text">{{ resolveNoticeText(t, previewLang) }}</div>

                  <div class="lang-badges-row">
                    <span
                      v-for="l in SUPPORTED_DATA_LANGS"
                      :key="l.code"
                      class="lang-mini-pill"
                      :class="{ ok: getNoticeTranslatedLangs(t).includes(l.code) }"
                    >
                      {{ l.short }}
                    </span>
                  </div>
                </td>
                <td class="td-action" data-label="Thao tác">
                  <div class="action-group">
                    <button
                      type="button"
                      role="checkbox"
                      :aria-checked="isNoticeActive(t)"
                      class="btn-display-tick"
                      :class="{ checked: isNoticeActive(t) }"
                      :disabled="togglingId === t.ID"
                      @click="toggleNoticeActive(t)"
                      :title="isNoticeActive(t) ? 'Đang hiển thị (bấm để ẩn)' : 'Tick để hiển thị (tối đa 1 thông báo/loại)'"
                    >
                      <span class="tick-box">
                        <span v-if="isNoticeActive(t)" class="tick-check">✓</span>
                      </span>
                      <span class="tick-label">{{ togglingId === t.ID ? 'Đang lưu...' : 'Hiển thị' }}</span>
                    </button>
                    <button @click="openEditModal(t)" class="btn-icon-action btn-edit" title="Chỉnh sửa">
                      <span class="text">Sửa</span>
                    </button>
                    <button @click="deleteThongBao(t.ID)" class="btn-icon-action btn-delete" title="Xóa">
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
          <div class="empty-icon"><i class="ri-add-circle-fill"></i></div>
          <h3 class="empty-title">Chưa có thông báo nào</h3>
          <p class="empty-text">Bắt đầu bằng cách thêm thông báo đầu tiên của bạn</p>
        </div>
      </div>
    </div>
  </div>

  <!-- EDIT MODAL -->
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="showEditModal" class="modal-overlay" @click.self="closeEditModal">
        <div class="modal-container">
          <div class="modal-header">
            <div class="modal-title-group">
              <h3 class="modal-title">Chỉnh sửa Thông báo</h3>
            </div>
            <button @click="closeEditModal" class="modal-close">
              <span>✖</span>
            </button>
          </div>

          <div class="modal-body">
            <div class="modal-type-row">
              <div class="noti-type-switch" role="tablist">
                <button
                  type="button"
                  class="type-switch-btn"
                  :class="{ active: editType === 'marquee' }"
                  @click="editType = 'marquee'"
                >
                  <i class="ri-volume-up-line"></i> Chạy chữ
                </button>
                <button
                  type="button"
                  class="type-switch-btn is-popup"
                  :class="{ active: editType === 'popup' }"
                  @click="editType = 'popup'"
                >
                  <i class="ri-window-line"></i> Popup
                </button>
              </div>
              <label v-if="editType === 'popup'" class="popup-active-toggle">
                <input type="checkbox" v-model="editPopupActive" />
                <span>Đang bật</span>
              </label>
            </div>

            <div v-if="editType === 'popup'" class="modal-popup-fields">
              <div class="modal-field">
                <label class="modal-label">Ảnh Popup</label>
                <div class="popup-img-actions">
                  <label class="btn-upload-popup">
                    <i class="ri-image-add-line"></i>
                    <span>{{ editPopupImgFile ? 'Đổi ảnh tải lên' : 'Tải ảnh mới' }}</span>
                    <input
                      ref="editPopupImgInput"
                      type="file"
                      accept="image/*"
                      hidden
                      @change="onSelectEditPopupImg"
                    />
                  </label>
                  <button
                    v-if="editPopupImgPreview || editPopupImgUrl"
                    type="button"
                    class="btn-clear-popup-img"
                    @click="clearEditPopupImg"
                  >
                    <i class="ri-delete-bin-line"></i> Xóa ảnh
                  </button>
                </div>
                <input
                  v-model="editPopupImgUrl"
                  :disabled="Boolean(editPopupImgFile)"
                  placeholder="Hoặc dán URL ảnh popup..."
                  class="input-field popup-sub-input"
                />
                <div class="upload-size-hint">
                  Kích thước chuẩn: <strong>800 × 1000 px</strong> hoặc <strong>900 × 1200 px</strong> (tỉ lệ dọc 4:5 / 3:4 hoặc vuông 1:1) · Tối đa 1200 × 1600 px (~180KB)
                </div>
                <div v-if="editPopupImgPreview || editPopupImgUrl" class="popup-img-preview-box">
                  <img :src="editPopupImgPreview || editPopupImgUrl" alt="Preview popup" />
                </div>
              </div>

              <div class="modal-field">
                <label class="modal-label">Link khi click vào Popup (tùy chọn)</label>
                <input
                  v-model="editPopupLink"
                  placeholder="https://..."
                  class="input-field"
                />
              </div>
            </div>

            <div class="modal-field">
              <label class="popup-active-toggle">
                <input type="checkbox" v-model="editPopupActive" />
                <span>Hiển thị cho khách (tối đa 1 thông báo/loại)</span>
              </label>
            </div>

            <div class="lang-tabs modal-lang-tabs">
              <button
                v-for="l in SUPPORTED_DATA_LANGS"
                :key="l.code"
                type="button"
                class="lang-tab-btn"
                :class="{ active: activeEditLang === l.code, filled: Boolean(editI18n[l.code]?.Noi_dung?.trim()) }"
                @click="activeEditLang = l.code"
              >
                <img :src="l.flagImg" :alt="l.short" class="lang-flag" />
                <span>{{ l.label }}</span>
                <span v-if="editI18n[l.code]?.Noi_dung?.trim()" class="lang-dot"></span>
              </button>
            </div>

            <div class="modal-field">
              <label class="modal-label">
                Nội dung ({{ SUPPORTED_DATA_LANGS.find(x => x.code === activeEditLang)?.label }})
              </label>
              <textarea
                v-model="editI18n[activeEditLang].Noi_dung"
                rows="4"
                class="modal-textarea"
                :placeholder="`Nhập nội dung thông báo tiếng ${SUPPORTED_DATA_LANGS.find(x => x.code === activeEditLang)?.label}...`"
              ></textarea>
            </div>
          </div>

          <div class="modal-footer">
            <button @click="closeEditModal" class="btn btn-secondary">
              <span class="btn-icon">✖</span>
              Hủy
            </button>
            <button
              @click="saveEdit"
              :disabled="loading || !canSubmitEdit"
              class="btn btn-success"
            >
              <span v-if="loading" class="btn-loading">
                <span class="spinner"></span>
                Đang lưu...
              </span>
              <span v-else>
                Lưu thay đổi
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
  margin-bottom: 32px;
}

.header-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.icon-wrapper {
  width: 56px;
  height: 56px;
  background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  box-shadow: 0 4px 16px rgba(59, 130, 246, 0.3);
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
  border: 1px solid rgba(148, 163, 184, 0.1);
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
  font-weight: 600;
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

/* ADD AREA */
.add-area {
  display: flex;
  gap: 12px;
  align-items: center;
}

.input-field {
  flex: 1;
  padding: 12px 16px;
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
  border-color: rgba(59, 130, 246, 0.5);
  background: rgba(51, 65, 85, 0.7);
}

/* BUTTONS */
.btn {
  padding: 12px 24px;
  border: none;
  border-radius: 10px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
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
  background: green;
  color: white;
  box-shadow: 0 4px 16px rgba(59, 130, 246, 0.3);
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 24px rgba(59, 130, 246, 0.4);
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
  to { transform: rotate(360deg); }
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
  width: 50px;
  height: 50px;
  border: 4px solid rgba(59, 130, 246, 0.2);
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.table-loading-text {
  font-size: 15px;
  font-weight: 600;
  color: #e2e8f0;
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
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
  font-size: 13px;
  font-weight: 700;
  color: #ffffff;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.data-table td {
  padding: 16px 20px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.05);
  vertical-align: middle;
  
}

.table-row {
  transition: all 0.2s ease;
}

.table-row:hover {
  background: rgba(51, 65, 85, 0.3);
}

.th-index { 
  width: 140px;
}
.th-content { 
  width: auto;
  text-align: left;
}
.th-action { 
  width: 280px;
}

.td-index,
.td-action {
  text-align: center;
}

.td-content {
  text-align: center;
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

.content-text {
  color: #ffffff;
  font-size: 14px;
  line-height: 1.6;
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
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.btn-icon-action .icon {
  font-size: 14px;
}

.btn-edit {
  background: rgb(1, 139, 20);
  color: white;
  box-shadow: 0 3px 12px rgba(139, 92, 246, 0.3);
}

.btn-edit:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 16px rgba(139, 92, 246, 0.4);
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
  padding: 60px 20px;
}

.empty-icon {
  font-size: 72px;
  margin-bottom: 16px;
  opacity: 0.3;
}

.empty-title {
  font-size: 18px;
  font-weight: 600;
  color: #ffffff;
  margin-bottom: 8px;
}

.empty-text {
  font-size: 14px;
  color: #e2e8f0;
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
  background: rgba(30, 41, 59, 0.95);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(148, 163, 184, 0.1);
  border-radius: 16px;
  width: 100%;
  max-width: 600px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-header {
  padding: 24px;
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

.modal-icon {
  font-size: 24px;
}

.modal-title {
  font-size: 20px;
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
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
}

.modal-close:hover {
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
  transform: rotate(90deg);
}

.modal-body {
  padding: 24px;
  overflow-y: auto;
  flex: 1;
}

.modal-field {
  margin-bottom: 20px;
}

.modal-label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: #ffffff;
  text-transform: uppercase;
  letter-spacing: 0.5px;
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
  border-color: rgba(59, 130, 246, 0.5);
  background: rgba(51, 65, 85, 0.7);
}

.modal-footer {
  padding: 20px 24px;
  border-top: 1px solid rgba(148, 163, 184, 0.1);
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

/* MODAL ANIMATION */
.modal-enter-active,
.modal-leave-active {
  transition: all 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .modal-container,
.modal-leave-to .modal-container {
  transform: scale(0.9) translateY(-20px);
}

/* RESPONSIVE */
@media (max-width: 768px) {
  .admin-page {
    padding: 16px;
  }

  .page-header {
    margin-bottom: 24px;
  }

  .icon-wrapper {
    width: 48px;
    height: 48px;
    font-size: 24px;
  }

  .page-title {
    font-size: 22px;
  }

  .page-subtitle {
    font-size: 13px;
  }

  .card-header {
    padding: 16px;
  }

  .card-body {
    padding: 16px;
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
  }

  .table-row {
    display: block;
    margin-bottom: 16px;
    background: rgba(51, 65, 85, 0.3);
    border-radius: 12px;
    padding: 16px;
    border: 1px solid rgba(148, 163, 184, 0.1);
  }

  .data-table td {
    display: block;
    padding: 12px 0;
    border: none;
    text-align: left;
  }

  .data-table td::before {
    content: attr(data-label);
    display: block;
    font-size: 11px;
    font-weight: 700;
    color: #ffffff;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 6px;
  }

  .td-index::before {
    display: none;
  }

  .index-badge {
    margin-bottom: 8px;
  }

  .action-group {
    flex-direction: column;
    gap: 8px;
  }

  .btn-icon-action {
    width: 100%;
    justify-content: center;
  }

  .modal-container {
    max-height: 95vh;
  }

  .modal-header {
    padding: 20px;
  }

  .modal-body {
    padding: 20px;
  }

  .modal-footer {
    padding: 16px 20px;
    flex-direction: column-reverse;
  }

  .modal-footer .btn {
    width: 100%;
  }
}

@media (max-width: 480px) {
  .page-title {
    font-size: 20px;
  }

  .card-title {
    font-size: 16px;
  }

  .btn {
    font-size: 13px;
    padding: 10px 20px;
  }
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

/* POPUP NOTICE STYLES */
.add-title-with-type {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}

.noti-type-switch {
  display: inline-flex;
  gap: 6px;
  padding: 4px;
  border-radius: 10px;
  background: rgba(15, 23, 42, 0.7);
  border: 1px solid rgba(148, 163, 184, 0.2);
}

.type-switch-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 7px;
  border: none;
  background: transparent;
  color: #94a3b8;
  font-size: 12.5px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.16s ease;
}

.type-switch-btn.active {
  background: rgba(16, 185, 129, 0.22);
  color: #86efac;
}

.type-switch-btn.is-popup.active {
  background: rgba(168, 85, 247, 0.25);
  color: #e9d5ff;
}

.popup-config-grid {
  display: grid;
  grid-template-columns: 1.15fr 1fr;
  gap: 16px;
  margin-bottom: 14px;
  padding: 14px;
  border-radius: 12px;
  background: rgba(15, 23, 42, 0.55);
  border: 1px solid rgba(168, 85, 247, 0.28);
}

.popup-img-col,
.popup-meta-col {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.popup-field-label {
  display: block;
  font-size: 12px;
  font-weight: 700;
  color: #cbd5e1;
  margin-bottom: 4px;
}

.popup-img-actions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.btn-upload-popup {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border-radius: 8px;
  background: rgba(168, 85, 247, 0.22);
  border: 1px solid rgba(192, 132, 252, 0.45);
  color: #e9d5ff;
  font-size: 12.5px;
  font-weight: 700;
  cursor: pointer;
}

.btn-upload-popup:hover {
  background: rgba(168, 85, 247, 0.34);
}

.btn-clear-popup-img {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 8px 11px;
  border-radius: 8px;
  border: 1px solid rgba(239, 68, 68, 0.4);
  background: rgba(239, 68, 68, 0.14);
  color: #fca5a5;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
}

.popup-sub-input {
  width: 100%;
}

.popup-img-preview-box {
  width: 100%;
  max-width: 240px;
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid rgba(148, 163, 184, 0.25);
  background: rgba(2, 6, 23, 0.6);
}

.popup-img-preview-box img {
  display: block;
  width: 100%;
  max-height: 150px;
  object-fit: contain;
}

.popup-active-toggle {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 600;
  color: #e2e8f0;
  cursor: pointer;
  margin-top: 4px;
}

.popup-active-toggle input {
  width: 16px;
  height: 16px;
  accent-color: #10b981;
}

.noti-row-top-badges {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 6px;
}

.noti-type-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 800;
}

.noti-type-badge.is-marquee {
  background: rgba(16, 185, 129, 0.16);
  color: #6ee7b7;
  border: 1px solid rgba(16, 185, 129, 0.35);
}

.noti-type-badge.is-popup {
  background: rgba(168, 85, 247, 0.2);
  color: #e9d5ff;
  border: 1px solid rgba(192, 132, 252, 0.42);
}

.noti-active-status-pill {
  padding: 2px 9px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
  background: rgba(16, 185, 129, 0.2);
  color: #6ee7b7;
  border: 1px solid rgba(16, 185, 129, 0.45);
}

.noti-active-status-pill.is-off {
  background: rgba(148, 163, 184, 0.15);
  color: #94a3b8;
  border-color: rgba(148, 163, 184, 0.3);
}

.notice-limit-toggle {
  margin-bottom: 12px;
}

.btn-display-tick {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 7px 12px;
  border-radius: 8px;
  border: 1px solid rgba(148, 163, 184, 0.35);
  background: rgba(30, 41, 59, 0.7);
  color: #cbd5e1;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-display-tick:hover:not(:disabled) {
  border-color: rgba(16, 185, 129, 0.65);
  color: #ffffff;
}

.btn-display-tick.checked {
  background: rgba(16, 185, 129, 0.18);
  border-color: #10b981;
  color: #6ee7b7;
}

.btn-display-tick:disabled {
  opacity: 0.6;
  cursor: wait;
}

.btn-display-tick .tick-box {
  width: 17px;
  height: 17px;
  border-radius: 5px;
  border: 1.5px solid #94a3b8;
  background: rgba(15, 23, 42, 0.65);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.2s ease;
}

.btn-display-tick.checked .tick-box {
  background: #10b981;
  border-color: #10b981;
  color: #ffffff;
}

.btn-display-tick .tick-check {
  font-size: 12px;
  font-weight: 900;
  line-height: 1;
}

.popup-row-preview-wrap {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-top: 4px;
}

.popup-row-thumb {
  width: 68px;
  height: 68px;
  object-fit: cover;
  border-radius: 8px;
  border: 1px solid rgba(148, 163, 184, 0.28);
  flex-shrink: 0;
}

.popup-row-meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.content-text.muted-italic {
  color: #94a3b8;
  font-style: italic;
  font-size: 13px;
}

.popup-row-link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #38bdf8;
  text-decoration: none;
  word-break: break-all;
}

.popup-row-link:hover {
  text-decoration: underline;
}

.modal-type-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 14px;
}

.modal-popup-fields {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 14px;
  padding: 12px;
  border-radius: 10px;
  background: rgba(15, 23, 42, 0.55);
  border: 1px solid rgba(168, 85, 247, 0.28);
}

@media (max-width: 768px) {
  .popup-config-grid {
    grid-template-columns: 1fr;
  }
}

.upload-size-hint {
  margin-top: 6px;
  font-size: 12px;
  color: #93c5fd;
  line-height: 1.4;
}
</style>