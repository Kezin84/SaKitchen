<script setup>
import { ref, computed, onMounted, onActivated } from 'vue'
import { getOneSheet, dispatchAction } from '@/config/api'
import { uploadImageToCloudinary } from '@/utils/imageUpload.js'
import { DEFAULT_SEO_CONFIG } from '@/utils/brandAssets.js'

/* ================= CONFIG ================= */


/* ================= STATE ================= */
const contacts = ref([])
const loading = ref(false)
const tableLoading = ref(true)
const togglingId = ref('')

/* SHOP LOCATION / ADDRESS (SYNCED WITH FOOTER & LOCAL SEO) */
const logoRowRef = ref(null)
const locationAddress = ref('')
const locationMapUrl = ref('')
const savedLocation = ref({ address: '', mapUrl: '' })
const savingLocation = ref(false)
const locationSavedMsg = ref('')

const hasLocationChanges = computed(
  () =>
    locationAddress.value.trim() !== savedLocation.value.address ||
    locationMapUrl.value.trim() !== savedLocation.value.mapUrl,
)

/* ADD FORM */
const form = ref({
  PLATFORM_name: '',
  INFO: '',
  Direct_link: '',
  Allow_message: false,
  file: null,
  preview: '',
})

/* EDIT MODAL */
const showEdit = ref(false)
const editing = ref(null)

function isAllowMessage(c) {
  if (!c) return false
  const v = c.Allow_message
  return v === true || v === 1 || v === '1' || String(v).toLowerCase() === 'true'
}

const activeMessageContact = computed(() =>
  contacts.value.find((c) => isAllowMessage(c)) || null
)

function clearStorefrontCache() {
  try {
    localStorage.removeItem('MENU_CACHE_SA_UNIFIED')
  } catch {
    // ignore storage errors
  }
}

/* ================= HELPERS ================= */
function genId() {
  const d = new Date()
  const p = (n) => String(n).padStart(2, '0')
  return (
    'CT' +
    p(d.getDate()) +
    p(d.getMonth() + 1) +
    d.getFullYear() +
    p(d.getMinutes()) +
    p(d.getSeconds())
  )
}

async function uploadContactImage(file) {
  return uploadImageToCloudinary(file, {
    targetKB: 100,
    maxWidth: 1000,
    maxHeight: 1000,
    folder: 'sakitchen/contact',
  })
}

/* ================= LOAD ================= */
async function loadData() {
  tableLoading.value = true
  try {
    const [json, logoJson] = await Promise.all([
      getOneSheet('shop_contact'),
      getOneSheet('logo'),
    ])
    contacts.value = [...(json.data || [])]
    const lRow = logoJson?.data?.[0] || null
    logoRowRef.value = lRow
    const addr =
      lRow?.Shop_Address !== undefined && lRow?.Shop_Address !== null
        ? String(lRow.Shop_Address).trim()
        : DEFAULT_SEO_CONFIG.shopAddress
    const mUrl = String(lRow?.Map_URL || '').trim()
    savedLocation.value = { address: addr, mapUrl: mUrl }
    locationAddress.value = addr
    locationMapUrl.value = mUrl
  } finally {
    tableLoading.value = false
  }
}

async function saveShopLocation() {
  if (savingLocation.value) return
  savingLocation.value = true
  locationSavedMsg.value = ''
  try {
    const res = await dispatchAction({
      action: 'upsertLogo',
      data: {
        ID: logoRowRef.value?.ID || '',
        Shop_Address: locationAddress.value.trim(),
        Map_URL: locationMapUrl.value.trim(),
      },
    })
    if (!res?.success) throw new Error(res?.message || 'Lỗi lưu vị trí')
    clearStorefrontCache()
    savedLocation.value = {
      address: locationAddress.value.trim(),
      mapUrl: locationMapUrl.value.trim(),
    }
    locationSavedMsg.value = 'Đã lưu vị trí hiển thị ở Footer!'
    setTimeout(() => {
      locationSavedMsg.value = ''
    }, 3000)
  } catch {
    alert('Lỗi lưu vị trí quán')
  } finally {
    savingLocation.value = false
  }
}

/* ================= FORM ================= */
function onFileChange(e) {
  const f = e.target.files[0]
  if (!f) return
  
  // Validate file type
  if (!f.type.startsWith('image/')) {
    alert('Vui lòng chọn file ảnh')
    return
  }
  
  // Validate file size (max 25MB before compression)
  if (f.size > 25 * 1024 * 1024) {
    alert('Kích thước ảnh tối đa 25MB')
    return
  }
  
  form.value.file = f
  form.value.preview = URL.createObjectURL(f)
}

function resetForm() {
  form.value = {
    PLATFORM_name: '',
    INFO: '',
    Direct_link: '',
    Allow_message: false,
    file: null,
    preview: '',
  }
}

/* ================= CRUD ================= */
async function addContact() {
  if (!form.value.PLATFORM_name || !form.value.file) {
    alert('Thiếu tên nền tảng hoặc ảnh')
    return
  }

  if (form.value.Allow_message && !String(form.value.Direct_link || '').trim()) {
    alert('Vui lòng nhập đường dẫn nền tảng để bật cho phép nhắn tin')
    return
  }

  loading.value = true
  try {
    const img = await uploadContactImage(form.value.file)

    await dispatchAction({
      action: 'addShopContact',
      data: {
        ID: genId(),
        PLATFORM_name: form.value.PLATFORM_name,
        URL_img: img,
        INFO: form.value.INFO,
        Direct_link: form.value.Direct_link,
        Allow_message: Boolean(form.value.Allow_message),
      },
    })

    clearStorefrontCache()
    resetForm()
    await loadData()
  } catch {
    alert('Lỗi thêm contact')
  }
  loading.value = false
}

function openEdit(c) {
  editing.value = {
    ...c,
    Allow_message: isAllowMessage(c),
    file: null,
    preview: c.URL_img,
  }
  showEdit.value = true
}

function closeEdit() {
  showEdit.value = false
  editing.value = null
}

function onEditFile(e) {
  const f = e.target.files[0]
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
  if (!editing.value.PLATFORM_name) {
    alert('Thiếu tên nền tảng')
    return
  }

  if (editing.value.Allow_message && !String(editing.value.Direct_link || '').trim()) {
    alert('Vui lòng nhập đường dẫn nền tảng để bật cho phép nhắn tin')
    return
  }

  loading.value = true
  try {
    let img = editing.value.URL_img
    if (editing.value.file) {
      img = await uploadContactImage(editing.value.file)
    }

    await dispatchAction({
      action: 'updateShopContact',
      data: {
        ID: editing.value.ID,
        PLATFORM_name: editing.value.PLATFORM_name,
        URL_img: img,
        INFO: editing.value.INFO,
        Direct_link: editing.value.Direct_link,
        Allow_message: Boolean(editing.value.Allow_message),
      },
    })

    clearStorefrontCache()
    closeEdit()
    await loadData()
  } catch {
    alert('Lỗi cập nhật')
  }
  loading.value = false
}

async function toggleAllowMessage(c) {
  if (!c?.ID || togglingId.value) return
  const nextVal = !isAllowMessage(c)

  if (nextVal && !String(c.Direct_link || '').trim()) {
    alert('Liên hệ này chưa có đường dẫn nền tảng. Vui lòng bổ sung đường dẫn để cho phép nhắn tin.')
    openEdit({ ...c, Allow_message: true })
    return
  }

  togglingId.value = c.ID
  try {
    await dispatchAction({
      action: 'updateShopContact',
      data: {
        ID: c.ID,
        Allow_message: nextVal,
      },
    })
    clearStorefrontCache()
    await loadData()
  } catch {
    alert('Lỗi cập nhật trạng thái nhắn tin')
  } finally {
    togglingId.value = ''
  }
}

async function deleteContact(id) {
  if (!confirm('Xóa contact này?')) return

  try {
    await dispatchAction({
      action: 'deleteShopContact',
      ID: id,
    })
    clearStorefrontCache()
    await loadData()
  } catch {
    alert('Lỗi xóa contact')
  }
}

/* ================= INIT ================= */
onMounted(loadData)

let hasMountedContactOnce = false
onActivated(() => {
  if (!hasMountedContactOnce) {
    hasMountedContactOnce = true
    return
  }
  if (!hasLocationChanges.value && !savingLocation.value) {
    loadData()
  }
})
</script>

<template>
  <div class="admin-page">
    <!-- HEADER -->
    <div class="page-header">
      <div class="header-content">
        
        <div>
          <h1 style="color: rgb(134, 239, 172); text-shadow: 0 0 10px rgba(34, 197, 94, 0.5);font-weight: bold;">QUẢN LÝ THÔNG TIN LIÊN HỆ &amp; VỊ TRÍ SHOP</h1>
          <p class="page-subtitle">Cài đặt vị trí quán (Footer PC &amp; Google Maps) và các kênh liên hệ đặt món</p>
        </div>
      </div>
    </div>

    <!-- LOCATION / ADDRESS CARD -->
    <div class="card add-card" style="margin-bottom: 22px;">
      <div class="card-header">
        <h3 class="card-title"><i class="ri-map-pin-2-fill" style="color: #34d399;"></i> Vị trí / Địa chỉ Quán (Hiển thị ở Footer Web)</h3>
        <span v-if="locationSavedMsg" class="msg-active-pill">
          <i class="ri-checkbox-circle-fill"></i>
          <span>{{ locationSavedMsg }}</span>
        </span>
      </div>
      <div class="card-body">
        <div class="form-grid">
          <div class="form-field">
            <label class="form-label">Địa chỉ / Khu vực phục vụ</label>
            <input
              v-model="locationAddress"
              placeholder="VD: Manila · Pasay · Makati, Philippines (để trống nếu muốn ẩn)"
              class="form-input"
            />
          </div>
          <div class="form-field">
            <label class="form-label">Link Google Maps (không bắt buộc)</label>
            <input
              v-model="locationMapUrl"
              placeholder="VD: https://maps.app.goo.gl/..."
              class="form-input"
            />
          </div>
        </div>
        <button
          type="button"
          class="btn btn-primary"
          :disabled="savingLocation || !hasLocationChanges"
          @click="saveShopLocation"
        >
          <span v-if="savingLocation" class="btn-loading">
            <span class="spinner"></span>
            Đang lưu...
          </span>
          <span v-else>
            <i class="ri-save-3-line"></i> Lưu vị trí quán
          </span>
        </button>
      </div>
    </div>

    <!-- ADD SECTION -->
    <div class="card add-card">
      <div class="card-header">
        <h3 class="card-title"> Thêm Contact mới <i class="ri-contacts-book-upload-fill"></i></h3>
      </div>
      <div class="card-body">
        <div class="form-grid">
          <div class="form-field">
            <label class="form-label">Tên nền tảng *</label>
            <input
              v-model="form.PLATFORM_name"
              placeholder="Facebook / Telegram / Zalo..."
              class="form-input"
            />
          </div>

          <div class="form-field">
            <label class="form-label">Thông tin nền tảng</label>
            <input
              v-model="form.INFO"
              placeholder="@username / hotline..."
              class="form-input"
            />
          </div>

          <div class="form-field">
            <label class="form-label">Đường dẫn nền tảng</label>
            <input
              v-model="form.Direct_link"
              placeholder="https://..."
              class="form-input"
            />
          </div>

          <div class="form-field">
            <label class="form-label">Ảnh nền tảng *</label>
            <input
              type="file"
              accept="image/*"
              @change="onFileChange"
              class="form-input"
            />
            <div class="upload-size-hint">
              Kích thước chuẩn: <strong>256 × 256 px – 512 × 512 px</strong> (vuông 1:1) · Tối đa 1000 × 1000 px (~100KB)
            </div>
          </div>
        </div>

        <div
          class="allow-msg-toggle-box"
          :class="{ active: form.Allow_message }"
          @click="form.Allow_message = !form.Allow_message"
        >
          <div class="allow-msg-meta">
            <div class="allow-msg-title">
              <i class="ri-message-3-fill"></i>
              <span>Cho phép nhắn tin nhận đơn qua MXH</span>
            </div>
            <div class="allow-msg-desc">
              Chỉ 1 liên hệ được bật tại một thời điểm. Khi khách gửi thông tin đơn qua MXH sẽ chỉ nhắn qua kênh này.
            </div>
          </div>
          <button
            type="button"
            class="switch-pill"
            :class="{ active: form.Allow_message }"
            :aria-pressed="form.Allow_message"
            @click.stop="form.Allow_message = !form.Allow_message"
          >
            <span class="switch-knob"></span>
          </button>
        </div>

        <!-- LIVE PREVIEW -->
        <div
          v-if="form.PLATFORM_name || form.preview || form.INFO"
          class="preview-section"
        >
          <div class="preview-label">bản hiển thị web ( Xem trước)</div>
          <div class="contact-preview">
            <div class="preview-img">
              <img v-if="form.preview" :src="form.preview" />
              <div v-else class="img-placeholder">IMG</div>
            </div>
            <div class="preview-content">
              <div class="preview-title-row">
                <div class="preview-title">
                  {{ form.PLATFORM_name || 'Tên nền tảng' }}
                </div>
                <span v-if="form.Allow_message" class="preview-msg-badge">
                  <i class="ri-chat-3-fill"></i> Cho phép nhắn tin
                </span>
              </div>
              <div class="preview-info">
                {{ form.INFO || 'Thông tin nền tảng' }}
              </div>
            </div>
          </div>
        </div>

        <button
          @click="addContact"
          :disabled="loading || !form.PLATFORM_name || !form.file"
          class="btn btn-primary"
        >
          <span v-if="loading" class="btn-loading">
            <span class="spinner"></span>
            Đang thêm...
          </span>
          <span v-else>
            
            Thêm Contact
          </span>
        </button>
      </div>
    </div>

    <!-- LIST -->
    <div class="card list-card">
      <div class="card-header">
        <h3 class="card-title"><i class="ri-list-check"></i>Danh sách Contact</h3>
        <div class="header-badges">
          <div v-if="activeMessageContact" class="msg-active-pill">
            <i class="ri-message-3-fill"></i>
            <span>Kênh nhắn tin: {{ activeMessageContact.PLATFORM_name }}</span>
          </div>
          <div v-else-if="contacts.length" class="msg-empty-pill">
            <span>Chưa chọn kênh nhắn tin</span>
          </div>
          <div class="badge">{{ contacts.length }} contact</div>
        </div>
      </div>

      <!-- TABLE LOADING -->
      <div v-if="tableLoading" class="card-body">
        <div class="table-loading">
          <div class="table-loading-spinner"></div>
          <div class="table-loading-text">Đang tải danh sách contact...</div>
        </div>
      </div>

      <!-- TABLE CONTENT -->
      <div v-else-if="contacts.length" class="card-body no-padding">
        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th class="th-index">Vị trí</th>
                <th class="th-platform">Nền tảng</th>
                <th class="th-image">Ảnh</th>
                <th class="th-info">Thông tin</th>
                <th class="th-link">Đường dẫn</th>
                <th class="th-message">Nhắn tin MXH</th>
                <th class="th-action">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(c, i) in contacts"
                :key="c.ID"
                class="table-row"
                :class="{ 'is-msg-enabled': isAllowMessage(c) }"
              >
                <td class="td-index" data-label="Vị trí">
                  <div class="index-badge">#{{ i + 1 }}</div>
                </td>
                <td class="td-platform" data-label="Nền tảng">
                  <div class="platform-name">{{ c.PLATFORM_name }}</div>
                </td>
                <td class="td-image" data-label="Ảnh">
                  <div class="image-wrapper">
                    <img :src="c.URL_img" :alt="c.PLATFORM_name" />
                  </div>
                </td>
                <td class="td-info" data-label="Thông tin">
                  <div class="info-text">{{ c.INFO || '—' }}</div>
                </td>
                <td class="td-link" data-label="Đường dẫn">
                  <a 
                    v-if="c.Direct_link"
                    :href="c.Direct_link"
                    target="_blank"
                    rel="noopener"
                    class="link-text"
                  >
                    {{ c.Direct_link }}
                  </a>
                  <span v-else class="no-link">—</span>
                </td>
                <td class="td-message" data-label="Nhắn tin MXH">
                  <button
                    type="button"
                    class="msg-status-btn"
                    :class="{ active: isAllowMessage(c) }"
                    :disabled="togglingId === c.ID"
                    @click="toggleAllowMessage(c)"
                  >
                    <i :class="isAllowMessage(c) ? 'ri-checkbox-circle-fill' : 'ri-chat-3-line'"></i>
                    <span>
                      {{
                        togglingId === c.ID
                          ? 'Đang lưu...'
                          : isAllowMessage(c)
                            ? 'Đang cho phép'
                            : 'Chọn nhắn tin'
                      }}
                    </span>
                  </button>
                </td>
                <td class="td-action" data-label="Thao tác">
                  <div class="action-group">
                    <button @click="openEdit(c)" class="btn-icon-action btn-edit" title="Chỉnh sửa">
                   
                      <span class="text">Sửa</span>
                    </button>
                    <button @click="deleteContact(c.ID)" class="btn-icon-action btn-delete" title="Xóa">
            
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
          <h3 class="empty-title">Chưa có contact nào</h3>
          <p class="empty-text">Bắt đầu bằng cách thêm contact đầu tiên của bạn</p>
        </div>
      </div>
    </div>
  </div>

  <!-- EDIT MODAL -->
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="showEdit" class="modal-overlay" @click.self="closeEdit">
        <div class="modal-container">
          <div class="modal-header">
            <div class="modal-title-group">
              
              <h3 class="modal-title">Chỉnh sửa Contact</h3>
            </div>
            <button @click="closeEdit" class="modal-close">
              <span>✖</span>
            </button>
          </div>

          <div class="modal-body">
            <div class="modal-field">
              <label class="modal-label">Tên nền tảng *</label>
              <input
                v-model="editing.PLATFORM_name"
                class="modal-input"
                placeholder="Facebook / Telegram..."
              />
            </div>

            <div class="modal-field">
              <label class="modal-label">Thông tin nền tảng</label>
              <input
                v-model="editing.INFO"
                class="modal-input"
                placeholder="@username / hotline..."
              />
            </div>

            <div class="modal-field">
              <label class="modal-label">Đường dẫn</label>
              <input
                v-model="editing.Direct_link"
                class="modal-input"
                placeholder="https://..."
              />
            </div>

            <div class="modal-field">
              <label class="modal-label">Ảnh nền tảng</label>
              <input
                type="file"
                accept="image/*"
                @change="onEditFile"
                class="modal-input"
              />
              <div class="upload-size-hint">
                Kích thước chuẩn: <strong>256 × 256 px – 512 × 512 px</strong> (vuông 1:1) · Tối đa 1000 × 1000 px (~100KB)
              </div>
            </div>

            <div
              class="allow-msg-toggle-box in-modal"
              :class="{ active: editing.Allow_message }"
              @click="editing.Allow_message = !editing.Allow_message"
            >
              <div class="allow-msg-meta">
                <div class="allow-msg-title">
                  <i class="ri-message-3-fill"></i>
                  <span>Cho phép nhắn tin nhận đơn qua MXH</span>
                </div>
                <div class="allow-msg-desc">
                  Chỉ 1 liên hệ được bật. Nếu bật ở đây, liên hệ đang bật trước đó sẽ tự tắt.
                </div>
              </div>
              <button
                type="button"
                class="switch-pill"
                :class="{ active: editing.Allow_message }"
                :aria-pressed="editing.Allow_message"
                @click.stop="editing.Allow_message = !editing.Allow_message"
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
              :disabled="loading || !editing.PLATFORM_name"
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
  transition: all 0.3s ease;
}

.form-input::placeholder {
  color: #94a3b8;
}

.form-input:focus {
  outline: none;
  border-color: rgba(59, 130, 246, 0.5);
  background: rgba(51, 65, 85, 0.7);
}

/* PREVIEW */
.preview-section {
  margin: 20px 0;
}

.preview-label {
  font-size: 13px;
  font-weight: 600;
  color: #ffffff;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 12px;
}

.contact-preview {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  border-radius: 12px;
  background: linear-gradient(135deg, #16a34a, #22c55e);
  box-shadow: 0 12px 30px rgba(34, 197, 94, 0.35);
}

.preview-img {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  flex-shrink: 0;
}

.preview-img img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.img-placeholder {
  font-size: 12px;
  font-weight: 700;
  color: #16a34a;
}

.preview-content {
  flex: 1;
}

.preview-title {
  font-weight: 700;
  font-size: 16px;
  color: #ffffff;
  margin-bottom: 4px;
}

.preview-info {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.9);
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

.btn-secondary:hover:not(:disabled) {
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

.th-index { width: 100px; }
.th-platform { width: 150px; }
.th-image { width: 100px; }
.th-info { width: auto; }
.th-link { width: 200px; }
.th-action { width: 180px; }

.td-index,
.td-image,
.td-action {
  text-align: center;
}

.td-platform,
.td-info {
  text-align: center;
}

.td-link {
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

.platform-name,
.info-text {
  color: #ffffff;
  font-size: 14px;
  font-weight: 600;
}

.image-wrapper {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  overflow: hidden;
  background: rgba(51, 65, 85, 0.5);
  margin: 0 auto;
  border: 2px solid rgba(148, 163, 184, 0.2);
}

.image-wrapper img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.link-text {
  color: #60a5fa;
  font-size: 13px;
  text-decoration: none;
  word-break: break-all;
  transition: color 0.2s ease;
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
  background: green;
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

.modal-input {
  width: 100%;
  padding: 12px;
  background: rgba(51, 65, 85, 0.5);
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 10px;
  color: #ffffff;
  font-size: 14px;
  font-family: inherit;
  transition: all 0.3s ease;
}

.modal-input::placeholder {
  color: #94a3b8;
}

.modal-input:focus {
  outline: none;
  border-color: rgba(59, 130, 246, 0.5);
  background: rgba(51, 65, 85, 0.7);
}

.modal-preview {
  margin-top: 16px;
  text-align: center;
}

.modal-preview img {
  max-width: 200px;
  max-height: 200px;
  border-radius: 12px;
  border: 2px solid rgba(148, 163, 184, 0.2);
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

  .form-grid {
    grid-template-columns: 1fr;
    gap: 12px;
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

  .image-wrapper {
    margin: 8px 0;
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

/* ALLOW MESSAGE TOGGLE & TABLE STATUS */
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

.allow-msg-toggle-box:hover {
  border-color: rgba(34, 197, 94, 0.45);
  background: rgba(51, 65, 85, 0.65);
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

.preview-title-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 4px;
}

.preview-title-row .preview-title {
  margin-bottom: 0;
}

.preview-msg-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 9px;
  border-radius: 999px;
  background: #ffffff;
  color: #15803d;
  font-size: 11.5px;
  font-weight: 700;
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

.th-message {
  width: 170px;
}

.td-message {
  text-align: center;
}

.table-row.is-msg-enabled {
  background: rgba(22, 163, 74, 0.08);
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

.msg-status-btn:hover:not(:disabled) {
  border-color: #4ade80;
  color: #ffffff;
  background: rgba(22, 163, 74, 0.25);
}

.msg-status-btn.active {
  background: linear-gradient(135deg, #16a34a 0%, #22c55e 100%);
  border-color: #4ade80;
  color: #ffffff;
  box-shadow: 0 4px 14px rgba(34, 197, 94, 0.32);
}

.msg-status-btn:disabled {
  opacity: 0.6;
  cursor: wait;
}

@media (max-width: 768px) {
  .td-message {
    text-align: left;
  }

  .card-header {
    flex-wrap: wrap;
    gap: 10px;
  }
}

.upload-size-hint {
  margin-top: 6px;
  font-size: 12px;
  color: #93c5fd;
  line-height: 1.4;
}
</style>