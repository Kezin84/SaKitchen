<script setup>
import { ref, computed, onMounted } from 'vue'
import { getOneSheet, dispatchAction } from '@/config/api'
import { normalizeDisplayConfig } from '@/utils/displayOrder'
import {
  DEFAULT_STOREFRONT_THEME,
  STOREFRONT_THEME_PRESETS,
  SURFACE_STYLE_OPTIONS,
  CARD_RADIUS_OPTIONS,
  SEASONAL_EFFECT_OPTIONS,
  INTRO_SPLASH_MODE_OPTIONS,
  MENU_VIEW_MODE_OPTIONS,
  normalizeThemeConfig,
  buildStorefrontThemeVars,
  sanitizeHexColor,
  saveCachedStorefrontTheme,
} from '@/utils/storefrontTheme'
import SeasonalOverlay from '@/components/SeasonalOverlay.vue'
import CookingSplashIntro from '@/components/CookingSplashIntro.vue'
import {
  INTRO_BG_TEMPLATES,
  INTRO_EFFECT_TEMPLATES,
  INTRO_TRANSITION_TEMPLATES,
  INTRO_EVENT_TEMPLATES,
  getIntroEventTemplate,
  getIntroEffectTemplate,
  resolveIntroSplashPalette,
} from '@/utils/introSplashTemplates'

const QUICK_PRIMARY_COLORS = [
  '#059669',
  '#c81e1e',
  '#ea580c',
  '#d97706',
  '#0284c7',
  '#1d4ed8',
  '#7c3aed',
  '#e11d48',
  '#3f6212',
  '#1e293b',
]

const QUICK_SECONDARY_COLORS = [
  '#facc15',
  '#fde047',
  '#f59e0b',
  '#fb923c',
  '#38bdf8',
  '#34d399',
  '#f472b6',
  '#a78bfa',
]

const loading = ref(true)
const saving = ref(false)
const shopBrand = ref({
  name: localStorage.getItem('NCC_NAME') || 'SA KITCHEN',
  logo: localStorage.getItem('NCC_LOGO') || '/logo-sa.jpg',
})

const savedTheme = ref({ ...DEFAULT_STOREFRONT_THEME })
const draft = ref({ ...DEFAULT_STOREFRONT_THEME })

// Local preview toggles (so admin can test Light/Dark, Mobile/Desktop, and View Mode)
const previewDevice = ref('mobile') // 'desktop' | 'mobile'
const previewColorScheme = ref('light') // 'light' | 'dark'
const previewMenuViewMode = ref('card') // 'card' | 'board'
const showSplashPreview = ref(false)
const splashPreviewKey = ref(0)

const activeIntroEventMeta = computed(() => getIntroEventTemplate(draft.value.introEvent))
const activeIntroEffectMeta = computed(() => getIntroEffectTemplate(draft.value.introEffect))
const activeIntroTransitionMeta = computed(
  () =>
    INTRO_TRANSITION_TEMPLATES.find((t) => t.id === draft.value.introTransition) ||
    INTRO_TRANSITION_TEMPLATES[0],
)
const activeIntroPalette = computed(() =>
  resolveIntroSplashPalette(
    draft.value.introBg,
    draft.value.primaryColor,
    draft.value.secondaryColor,
  ),
)
const activeIntroPreviewTitle = computed(() => {
  const custom = String(draft.value.introCustomTitle || '').trim()
  if (custom) return custom
  const viCopy = activeIntroEventMeta.value.copy?.vi
  return [viCopy?.titleA, viCopy?.titleB].filter(Boolean).join(' ')
})
const activeIntroPreviewSub = computed(() => {
  const custom = String(draft.value.introCustomSubtitle || '').trim()
  return custom || activeIntroEventMeta.value.copy?.vi?.subtitle || ''
})

function previewCookingSplash() {
  splashPreviewKey.value += 1
  showSplashPreview.value = true
}

function selectIntroEvent(ev) {
  if (!ev) return
  draft.value = {
    ...draft.value,
    introEvent: ev.id,
    introBg: ev.bg,
    introEffect: ev.effect,
    introTransition: ev.transition,
    ...(draft.value.introSplashMode === 'off' ? { introSplashMode: 'once_session' } : {}),
  }
}

function syncStorefrontWithActiveIntroEvent() {
  const ev = getIntroEventTemplate(draft.value.introEvent)
  const preset =
    STOREFRONT_THEME_PRESETS.find((p) => p.id === ev.storefrontPresetId) ||
    STOREFRONT_THEME_PRESETS[0]
  draft.value = {
    ...draft.value,
    mode: 'preset',
    presetId: preset.id,
    primaryColor: preset.primaryColor,
    secondaryColor: preset.secondaryColor,
    surfaceStyle: preset.surfaceStyle || 'clean',
    defaultColorScheme: preset.defaultColorScheme || 'light',
    seasonalEffect: ev.storefrontSeasonalEffect || 'none',
  }
  previewColorScheme.value = preset.defaultColorScheme || 'light'
  showAlert(`Đã đồng bộ màu & hiệu ứng trang Order theo sự kiện "${ev.label}". Nhấn "Lưu & Áp dụng" để kích hoạt.`, 'info')
}

const alertState = ref({ message: '', type: 'success' })
let alertTimer = null

function showAlert(message, type = 'success', duration = 3200) {
  alertState.value = { message, type }
  if (alertTimer) clearTimeout(alertTimer)
  alertTimer = setTimeout(() => {
    alertState.value = { message: '', type: 'success' }
  }, duration)
}

const normalizedDraft = computed(() => normalizeThemeConfig(draft.value))
const normalizedSaved = computed(() => normalizeThemeConfig(savedTheme.value))

function themeComparableKey(cfg) {
  return JSON.stringify({
    mode: cfg.mode,
    presetId: cfg.presetId,
    primaryColor: cfg.primaryColor,
    secondaryColor: cfg.secondaryColor,
    defaultColorScheme: cfg.defaultColorScheme,
    defaultMenuViewMode: cfg.defaultMenuViewMode,
    surfaceStyle: cfg.surfaceStyle,
    cardRadius: cfg.cardRadius,
    seasonalEffect: cfg.seasonalEffect,
    introSplashMode: cfg.introSplashMode,
    introEvent: cfg.introEvent,
    introBg: cfg.introBg,
    introEffect: cfg.introEffect,
    introTransition: cfg.introTransition,
    introCustomTitle: cfg.introCustomTitle,
    introCustomSubtitle: cfg.introCustomSubtitle,
  })
}

const hasUnsavedChanges = computed(
  () => themeComparableKey(normalizedDraft.value) !== themeComparableKey(normalizedSaved.value),
)

const previewVars = computed(() =>
  buildStorefrontThemeVars(normalizedDraft.value, previewColorScheme.value),
)

const isDefaultDraft = computed(
  () => themeComparableKey(normalizedDraft.value) === themeComparableKey(DEFAULT_STOREFRONT_THEME),
)

function selectPreset(preset) {
  draft.value = {
    ...draft.value,
    mode: 'preset',
    presetId: preset.id,
    primaryColor: preset.primaryColor,
    secondaryColor: preset.secondaryColor,
    surfaceStyle: preset.surfaceStyle || 'clean',
    defaultColorScheme: preset.defaultColorScheme || 'light',
  }
  previewColorScheme.value = preset.defaultColorScheme || 'light'
}

function switchToCustomMode() {
  draft.value = {
    ...draft.value,
    mode: 'custom',
  }
}

function switchToPresetMode() {
  const matched =
    STOREFRONT_THEME_PRESETS.find((p) => p.id === draft.value.presetId) ||
    STOREFRONT_THEME_PRESETS[0]
  selectPreset(matched)
}

function onPrimaryHexInput(val) {
  const str = String(val || '').trim()
  draft.value.mode = 'custom'
  if (/^#[0-9a-fA-F]{6}$/.test(str)) {
    draft.value.primaryColor = str.toLowerCase()
  }
}

function onSecondaryHexInput(val) {
  const str = String(val || '').trim()
  draft.value.mode = 'custom'
  if (/^#[0-9a-fA-F]{6}$/.test(str)) {
    draft.value.secondaryColor = str.toLowerCase()
  }
}

function pickPrimaryColor(hex) {
  draft.value.mode = 'custom'
  draft.value.primaryColor = sanitizeHexColor(hex, '#059669')
}

function pickSecondaryColor(hex) {
  draft.value.mode = 'custom'
  draft.value.secondaryColor = sanitizeHexColor(hex, '#facc15')
}

function setDefaultScheme(scheme) {
  draft.value.defaultColorScheme = scheme === 'dark' ? 'dark' : 'light'
  previewColorScheme.value = draft.value.defaultColorScheme
}

function setDefaultMenuViewMode(mode) {
  draft.value.defaultMenuViewMode = mode === 'board' ? 'board' : 'card'
  previewMenuViewMode.value = draft.value.defaultMenuViewMode
}

function resetToDefault() {
  draft.value = { ...DEFAULT_STOREFRONT_THEME }
  previewColorScheme.value = DEFAULT_STOREFRONT_THEME.defaultColorScheme
  previewMenuViewMode.value = DEFAULT_STOREFRONT_THEME.defaultMenuViewMode
  showAlert('Đã đặt lại về giao diện mặc định (Xanh Ngọc – Vàng). Nhấn "Lưu & Áp dụng" để đồng bộ.', 'info')
}

function discardDraftChanges() {
  draft.value = { ...normalizedSaved.value }
  previewColorScheme.value = normalizedSaved.value.defaultColorScheme || 'light'
  previewMenuViewMode.value = normalizedSaved.value.defaultMenuViewMode || 'card'
}

async function loadConfig() {
  loading.value = true
  try {
    const [cfgRes, logoRes] = await Promise.all([
      getOneSheet('display_config'),
      getOneSheet('logo'),
    ])
    const cfg = normalizeDisplayConfig(cfgRes?.data || [])
    const theme = normalizeThemeConfig(cfg.themeConfig)
    savedTheme.value = { ...theme }
    draft.value = { ...theme }
    previewColorScheme.value = theme.defaultColorScheme || 'light'
    previewMenuViewMode.value = theme.defaultMenuViewMode || 'card'

    const logoRows = Array.isArray(logoRes?.data) ? logoRes.data : []
    const mainLogo = logoRows.find((r) => r?.URL) || logoRows[0]
    if (mainLogo) {
      shopBrand.value = {
        name: String(mainLogo.Name || shopBrand.value.name || 'SA KITCHEN').trim(),
        logo: String(mainLogo.URL || shopBrand.value.logo || '/logo-sa.jpg').trim(),
      }
    }
  } catch (err) {
    console.error('Load display theme config failed:', err)
    showAlert('Không tải được cấu hình hiển thị. Vui lòng thử lại.', 'error')
  } finally {
    loading.value = false
  }
}

async function saveThemeConfig() {
  if (saving.value) return
  saving.value = true
  try {
    const payloadTheme = normalizeThemeConfig({
      ...draft.value,
      updatedAt: Date.now(),
    })
    const res = await dispatchAction({
      action: 'saveDisplayConfig',
      data: {
        themeConfig: payloadTheme,
      },
    })
    if (!res?.success) {
      throw new Error(res?.message || 'Lưu cấu hình thất bại')
    }
    savedTheme.value = { ...payloadTheme }
    draft.value = { ...payloadTheme }
    saveCachedStorefrontTheme(payloadTheme)
    showAlert('Đã lưu & áp dụng giao diện mới sang trang Order của khách!', 'success')
  } catch (err) {
    console.error('Save theme config error:', err)
    showAlert(err?.message || 'Có lỗi khi lưu cấu hình giao diện.', 'error')
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  loadConfig()
})
</script>

<template>
  <div class="theme-page">
    <!-- Toast -->
    <transition name="toast-fade">
      <div v-if="alertState.message" class="theme-toast" :class="`is-${alertState.type}`">
        <i
          :class="
            alertState.type === 'error'
              ? 'ri-error-warning-fill'
              : alertState.type === 'info'
                ? 'ri-information-fill'
                : 'ri-checkbox-circle-fill'
          "
        ></i>
        <span>{{ alertState.message }}</span>
      </div>
    </transition>

    <!-- Page Header -->
    <header class="theme-header">
      <div class="theme-header-left">
        <h1 class="theme-title">
          <i class="ri-palette-fill"></i>
          <span>Cấu hình hiển thị & Giao diện</span>
        </h1>
        <p class="theme-subtitle">
          Chọn bộ màu phối sẵn hoặc tự phối màu riêng cho trang Order của khách — đồng bộ realtime ngay khi bấm <strong>Lưu & Áp dụng</strong>.
        </p>
      </div>

      <div class="theme-header-actions">
        <button
          type="button"
          class="btn-ghost"
          :disabled="loading || saving || isDefaultDraft"
          @click="resetToDefault"
          title="Đưa về giao diện mặc định Xanh Ngọc – Vàng"
        >
          <i class="ri-restart-line"></i>
          <span>Mặc định</span>
        </button>

        <a
          href="/vi"
          target="_blank"
          rel="noopener noreferrer"
          class="btn-outline"
        >
          <i class="ri-external-link-line"></i>
          <span>Mở trang Order</span>
        </a>

        <button
          type="button"
          class="btn-save"
          :disabled="saving || loading || !hasUnsavedChanges"
          @click="saveThemeConfig"
        >
          <i v-if="saving" class="ri-loader-4-line spinning"></i>
          <i v-else class="ri-save-3-line"></i>
          <span>{{ saving ? 'Đang lưu...' : 'Lưu & Áp dụng' }}</span>
        </button>
      </div>
    </header>

    <!-- Unsaved Banner -->
    <div v-if="hasUnsavedChanges && !loading" class="unsaved-bar">
      <div class="unsaved-bar-left">
        <i class="ri-sparkling-line"></i>
        <span>Bạn đang có thay đổi giao diện chưa lưu. Xem khung Xem trước rồi bấm <strong>Lưu & Áp dụng</strong>.</span>
      </div>
      <div class="unsaved-bar-actions">
        <button type="button" class="btn-link-cancel" @click="discardDraftChanges">Hoàn tác</button>
        <button type="button" class="btn-mini-save" :disabled="saving" @click="saveThemeConfig">
          Lưu ngay
        </button>
      </div>
    </div>

    <!-- Loading Skeleton -->
    <div v-if="loading" class="loading-box">
      <i class="ri-loader-4-line spinning"></i>
      <span>Đang tải cấu hình giao diện...</span>
    </div>

    <!-- Main 2-Column Workspace -->
    <div v-else class="theme-workspace">
      <!-- LEFT COLUMN: SETTINGS -->
      <div class="settings-col">
        <!-- 1. BẢNG MÀU GIAO DIỆN -->
        <section class="cfg-card">
          <div class="cfg-card-head">
            <div>
              <h2 class="cfg-card-title">
                <i class="ri-brush-fill"></i>
                <span>1. Bảng màu trang Order</span>
              </h2>
              <p class="cfg-card-desc">
                Dùng bộ màu phối chuẩn đẹp hoặc tự chọn 2 màu chủ đạo & màu nhấn theo phong cách quán.
              </p>
            </div>
            <div class="mode-tabs">
              <button
                type="button"
                class="mode-tab"
                :class="{ active: draft.mode === 'preset' }"
                @click="switchToPresetMode"
              >
                <i class="ri-layout-grid-fill"></i>
                Bộ màu sẵn ({{ STOREFRONT_THEME_PRESETS.length }})
              </button>
              <button
                type="button"
                class="mode-tab"
                :class="{ active: draft.mode === 'custom' }"
                @click="switchToCustomMode"
              >
                <i class="ri-contrast-drop-2-fill"></i>
                Tự phối màu
              </button>
            </div>
          </div>

          <!-- PRESETS GRID -->
          <div v-if="draft.mode === 'preset'" class="presets-grid">
            <button
              v-for="preset in STOREFRONT_THEME_PRESETS"
              :key="preset.id"
              type="button"
              class="preset-card"
              :class="{ active: draft.presetId === preset.id }"
              @click="selectPreset(preset)"
            >
              <div
                class="preset-swatch-bar"
                :style="{
                  background: `linear-gradient(135deg, ${preset.primaryColor} 0%, ${preset.primaryColor} 72%, ${preset.secondaryColor} 72%, ${preset.secondaryColor} 100%)`,
                }"
              >
                <span class="preset-tag">{{ preset.tag }}</span>
                <span v-if="draft.presetId === preset.id" class="preset-check">
                  <i class="ri-check-line"></i>
                </span>
              </div>
              <div class="preset-body">
                <div class="preset-name">{{ preset.name }}</div>
                <div class="preset-desc">{{ preset.desc }}</div>
                <div class="preset-dots">
                  <span class="dot-chip" :style="{ background: preset.primaryColor }" :title="preset.primaryColor"></span>
                  <span class="dot-chip" :style="{ background: preset.secondaryColor }" :title="preset.secondaryColor"></span>
                  <span class="preset-mode-hint">
                    <i :class="preset.defaultColorScheme === 'dark' ? 'ri-moon-fill' : 'ri-sun-fill'"></i>
                    {{ preset.defaultColorScheme === 'dark' ? 'Nền tối' : 'Nền sáng' }}
                  </span>
                </div>
              </div>
            </button>
          </div>

          <!-- CUSTOM COLOR PICKER -->
          <div v-else class="custom-panel">
            <div class="color-picker-grid">
              <!-- Primary Color -->
              <div class="color-box">
                <label class="color-label">
                  <span class="color-label-title">Màu chủ đạo (Primary)</span>
                  <span class="color-label-sub">Thanh Header, giá tiền, nút đặt món, tab đang chọn</span>
                </label>
                <div class="color-input-row">
                  <label class="native-swatch" :style="{ background: draft.primaryColor }">
                    <input
                      type="color"
                      :value="draft.primaryColor"
                      @input="pickPrimaryColor($event.target.value)"
                    />
                  </label>
                  <input
                    type="text"
                    class="hex-input"
                    :value="draft.primaryColor"
                    maxlength="7"
                    placeholder="#059669"
                    @input="onPrimaryHexInput($event.target.value)"
                  />
                </div>
                <div class="quick-swatches">
                  <button
                    v-for="hex in QUICK_PRIMARY_COLORS"
                    :key="hex"
                    type="button"
                    class="quick-swatch"
                    :class="{ active: draft.primaryColor.toLowerCase() === hex }"
                    :style="{ background: hex }"
                    :title="hex"
                    @click="pickPrimaryColor(hex)"
                  ></button>
                </div>
              </div>

              <!-- Secondary Color -->
              <div class="color-box">
                <label class="color-label">
                  <span class="color-label-title">Màu nhấn (Accent / Secondary)</span>
                  <span class="color-label-sub">Huy hiệu nổi bật, điểm nhấn thông báo, viền phụ</span>
                </label>
                <div class="color-input-row">
                  <label class="native-swatch" :style="{ background: draft.secondaryColor }">
                    <input
                      type="color"
                      :value="draft.secondaryColor"
                      @input="pickSecondaryColor($event.target.value)"
                    />
                  </label>
                  <input
                    type="text"
                    class="hex-input"
                    :value="draft.secondaryColor"
                    maxlength="7"
                    placeholder="#facc15"
                    @input="onSecondaryHexInput($event.target.value)"
                  />
                </div>
                <div class="quick-swatches">
                  <button
                    v-for="hex in QUICK_SECONDARY_COLORS"
                    :key="hex"
                    type="button"
                    class="quick-swatch"
                    :class="{ active: draft.secondaryColor.toLowerCase() === hex }"
                    :style="{ background: hex }"
                    :title="hex"
                    @click="pickSecondaryColor(hex)"
                  ></button>
                </div>
              </div>
            </div>

            <!-- Auto Generated Palette Strip -->
            <div class="auto-palette-strip">
              <div class="auto-palette-title">Dải màu phái sinh tự động (hệ thống tự cân chỉnh tương phản):</div>
              <div class="auto-palette-chips">
                <span class="ap-chip" :style="{ background: previewVars['--sa-top-header-bg'], color: previewVars['--sa-on-primary'] }">Header</span>
                <span class="ap-chip" :style="{ background: previewVars['--sa-primary'], color: previewVars['--sa-on-primary'] }">Chính</span>
                <span class="ap-chip" :style="{ background: previewVars['--sa-primary-hover'], color: previewVars['--sa-on-primary'] }">Hover</span>
                <span class="ap-chip" :style="{ background: previewVars['--sa-primary-soft'], color: previewVars['--sa-primary-deep'], border: '1px solid rgba(0,0,0,0.08)' }">Nền nhạt</span>
                <span class="ap-chip" :style="{ background: previewVars['--sa-secondary'], color: previewVars['--sa-on-secondary'] }">Nhấn</span>
              </div>
            </div>
          </div>
        </section>

        <!-- 2. CHẾ ĐỘ SÁNG / TỐI & KIỂU THỰC ĐƠN MẶC ĐỊNH -->
        <section class="cfg-card">
          <div class="cfg-card-head">
            <div>
              <h2 class="cfg-card-title">
                <i class="ri-contrast-2-fill"></i>
                <span>2. Chế độ Sáng / Tối & Kiểu thực đơn mặc định</span>
              </h2>
              <p class="cfg-card-desc">
                Áp dụng mặc định khi khách vào trang Order. Khách hàng vẫn luôn có thể tự chuyển đổi theo ý thích.
              </p>
            </div>
          </div>

          <div class="sub-group">
            <div class="sub-group-label">Chế độ màu mặc định</div>
            <div class="scheme-grid">
              <button
                type="button"
                class="option-card"
                :class="{ active: draft.defaultColorScheme === 'light' }"
                @click="setDefaultScheme('light')"
              >
                <div class="option-icon is-light"><i class="ri-sun-fill"></i></div>
                <div class="option-text">
                  <div class="option-title">Giao diện Sáng (Light)</div>
                  <div class="option-desc">Tươi sáng, rõ ảnh món ăn, phù hợp ban ngày</div>
                </div>
                <i
                  class="option-radio"
                  :class="
                    draft.defaultColorScheme === 'light'
                      ? 'ri-radio-button-fill'
                      : 'ri-checkbox-blank-circle-line'
                  "
                ></i>
              </button>

              <button
                type="button"
                class="option-card"
                :class="{ active: draft.defaultColorScheme === 'dark' }"
                @click="setDefaultScheme('dark')"
              >
                <div class="option-icon is-dark"><i class="ri-moon-clear-fill"></i></div>
                <div class="option-text">
                  <div class="option-title">Giao diện Tối (Dark)</div>
                  <div class="option-desc">Dịu mắt ban đêm, nổi bật tông màu sang trọng</div>
                </div>
                <i
                  class="option-radio"
                  :class="
                    draft.defaultColorScheme === 'dark'
                      ? 'ri-radio-button-fill'
                      : 'ri-checkbox-blank-circle-line'
                  "
                ></i>
              </button>
            </div>
          </div>

          <div class="sub-group">
            <div class="sub-group-label">Kiểu hiển thị thực đơn mặc định</div>
            <div class="scheme-grid">
              <button
                v-for="opt in MENU_VIEW_MODE_OPTIONS"
                :key="opt.id"
                type="button"
                class="option-card"
                :class="{ active: draft.defaultMenuViewMode === opt.id }"
                @click="setDefaultMenuViewMode(opt.id)"
              >
                <div
                  class="option-icon"
                  :class="opt.id === 'board' ? 'is-quick-mode' : 'is-detail-mode'"
                >
                  <i :class="opt.icon"></i>
                </div>
                <div class="option-text">
                  <div class="option-title">{{ opt.label }}</div>
                  <div class="option-desc">{{ opt.desc }}</div>
                </div>
                <i
                  class="option-radio"
                  :class="
                    draft.defaultMenuViewMode === opt.id
                      ? 'ri-radio-button-fill'
                      : 'ri-checkbox-blank-circle-line'
                  "
                ></i>
              </button>
            </div>
          </div>
        </section>

        <!-- 3. KIỂU NỀN & BO GÓC -->
        <section class="cfg-card">
          <div class="cfg-card-head">
            <div>
              <h2 class="cfg-card-title">
                <i class="ri-layout-masonry-fill"></i>
                <span>3. Kiểu nền trang & Bo góc thẻ món</span>
              </h2>
              <p class="cfg-card-desc">
                Tinh chỉnh cảm giác nền trang và độ bo tròn của thẻ sản phẩm, banner, nút bấm.
              </p>
            </div>
          </div>

          <div class="sub-group">
            <div class="sub-group-label">Phong cách nền trang</div>
            <div class="triple-grid">
              <button
                v-for="opt in SURFACE_STYLE_OPTIONS"
                :key="opt.id"
                type="button"
                class="mini-opt-card"
                :class="{ active: draft.surfaceStyle === opt.id }"
                @click="draft.surfaceStyle = opt.id"
              >
                <div class="surface-swatch" :class="`is-${opt.id}`" :style="opt.id === 'tinted' ? { background: previewVars['--sa-primary-soft'] } : {}">
                  <span></span>
                </div>
                <div class="mini-opt-title">{{ opt.label }}</div>
                <div class="mini-opt-desc">{{ opt.desc }}</div>
              </button>
            </div>
          </div>

          <div class="sub-group">
            <div class="sub-group-label">Độ bo góc thẻ & nút</div>
            <div class="triple-grid">
              <button
                v-for="opt in CARD_RADIUS_OPTIONS"
                :key="opt.id"
                type="button"
                class="mini-opt-card"
                :class="{ active: draft.cardRadius === opt.id }"
                @click="draft.cardRadius = opt.id"
              >
                <div class="radius-demo-box" :style="{ borderRadius: opt.card }"></div>
                <div class="mini-opt-title">{{ opt.label }}</div>
                <div class="mini-opt-desc">{{ opt.desc }}</div>
              </button>
            </div>
          </div>
        </section>

        <!-- 4. HIỆU ỨNG THEO MÙA / LỄ HỘI -->
        <section class="cfg-card">
          <div class="cfg-card-head">
            <div>
              <h2 class="cfg-card-title">
                <i class="ri-sparkling-2-fill"></i>
                <span>4. Hiệu ứng lễ hội / theo mùa</span>
              </h2>
              <p class="cfg-card-desc">
                Tạo không khí lễ hội nhẹ nhàng trên trang Order (không cản thao tác bấm, tối ưu mượt trên điện thoại).
              </p>
            </div>
          </div>

          <div class="effects-grid">
            <button
              v-for="ef in SEASONAL_EFFECT_OPTIONS"
              :key="ef.id"
              type="button"
              class="effect-card"
              :class="{ active: draft.seasonalEffect === ef.id }"
              @click="draft.seasonalEffect = ef.id"
            >
              <i :class="ef.icon" class="effect-ico"></i>
              <div class="effect-info">
                <div class="effect-name">{{ ef.label }}</div>
                <div class="effect-desc">{{ ef.desc }}</div>
              </div>
            </button>
          </div>
        </section>

        <!-- SECTION 5: MODULAR INTRO SPLASH STUDIO (EVENT + BACKGROUND + EFFECT + TRANSITION) -->
        <section class="cfg-card">
          <div class="cfg-card-head">
            <div>
              <h2 class="cfg-card-title">
                <i class="ri-fire-fill"></i>
                <span>5. Màn hình chào khi vào trang (Intro Studio)</span>
              </h2>
              <p class="cfg-card-desc">
                Tự chọn Template theo sự kiện, màu nền, hiệu ứng bếp và kiểu mở màn (tự bỏ qua ở link ghép đơn và trang Admin).
              </p>
            </div>
            <button
              type="button"
              class="btn-preview-splash"
              @click="previewCookingSplash"
            >
              <i class="ri-play-circle-fill"></i>
              <span>Xem thử hiệu ứng</span>
            </button>
          </div>

          <!-- LIVE MINI PREVIEW BANNER (SHOWS ACTIVE BACKGROUND + TITLE + COMBO AT A GLANCE) -->
          <div
            v-if="draft.introSplashMode !== 'off'"
            class="intro-mini-stage"
            :style="{ background: activeIntroPalette.loaderBg }"
            role="button"
            tabindex="0"
            @click="previewCookingSplash"
          >
            <div class="ims-left">
              <div
                class="ims-logo-ring"
                :style="{
                  borderColor: activeIntroPalette.accent,
                  boxShadow: `0 0 18px ${activeIntroPalette.glow}`,
                }"
              >
                <img :src="shopBrand.logo" :alt="shopBrand.name" />
              </div>
              <div class="ims-copy">
                <div class="ims-kicker" :style="{ color: activeIntroPalette.titleStart }">
                  {{ shopBrand.name }} · {{ activeIntroEventMeta.copy?.vi?.kickerSuffix }}
                </div>
                <div class="ims-title" :style="{ color: activeIntroPalette.accent }">
                  {{ activeIntroPreviewTitle }}
                </div>
                <div class="ims-sub">{{ activeIntroPreviewSub }}</div>
              </div>
            </div>
            <div class="ims-right">
              <div class="ims-badges">
                <span class="ims-pill">
                  <i :class="activeIntroEffectMeta.icon"></i> {{ activeIntroEffectMeta.label }}
                </span>
                <span class="ims-pill">
                  <i :class="activeIntroTransitionMeta.icon"></i> {{ activeIntroTransitionMeta.label }}
                </span>
              </div>
              <span class="ims-play-hint">
                <i class="ri-play-fill"></i> Bấm để chạy thử
              </span>
            </div>
          </div>

          <!-- 5.1 Frequency Mode -->
          <div class="intro-sub-block">
            <div class="intro-sub-label">
              <i class="ri-toggle-line"></i>
              <span>Chế độ hiển thị</span>
            </div>
            <div class="intro-mode-grid">
              <button
                v-for="opt in INTRO_SPLASH_MODE_OPTIONS"
                :key="opt.id"
                type="button"
                class="effect-card intro-mode-card"
                :class="{ active: draft.introSplashMode === opt.id }"
                @click="draft.introSplashMode = opt.id"
              >
                <i :class="opt.icon" class="effect-ico"></i>
                <div class="effect-info">
                  <div class="effect-name">{{ opt.label }}</div>
                  <div class="effect-desc">{{ opt.desc }}</div>
                </div>
                <i
                  v-if="draft.introSplashMode === opt.id"
                  class="ri-checkbox-circle-fill intro-chk-ico"
                ></i>
              </button>
            </div>
          </div>

          <template v-if="draft.introSplashMode !== 'off'">
            <!-- 5.2 Event Templates -->
            <div class="intro-sub-block">
              <div class="intro-sub-head-row">
                <div class="intro-sub-label">
                  <i class="ri-calendar-event-fill"></i>
                  <span>Template theo Event (1 chạm đổi trọn bộ)</span>
                </div>
                <button
                  type="button"
                  class="btn-sync-event-theme"
                  @click="syncStorefrontWithActiveIntroEvent"
                >
                  <i class="ri-magic-line"></i>
                  <span>Đồng bộ màu trang Order theo Event</span>
                </button>
              </div>
              <div class="intro-events-grid">
                <button
                  v-for="ev in INTRO_EVENT_TEMPLATES"
                  :key="ev.id"
                  type="button"
                  class="effect-card intro-event-card"
                  :class="{ active: draft.introEvent === ev.id }"
                  @click="selectIntroEvent(ev)"
                >
                  <i :class="ev.icon" class="effect-ico"></i>
                  <div class="effect-info">
                    <div class="effect-name">
                      <span>{{ ev.label }}</span>
                      <span class="intro-ev-tag">{{ ev.tag }}</span>
                    </div>
                    <div class="effect-desc">{{ ev.desc }}</div>
                  </div>
                  <i
                    v-if="draft.introEvent === ev.id"
                    class="ri-checkbox-circle-fill intro-chk-ico"
                  ></i>
                </button>
              </div>
            </div>

            <!-- 5.3 Background Color Templates -->
            <div class="intro-sub-block">
              <div class="intro-sub-label">
                <i class="ri-palette-fill"></i>
                <span>Template Màu nền & Cánh cửa</span>
              </div>
              <div class="intro-bg-grid">
                <button
                  v-for="bg in INTRO_BG_TEMPLATES"
                  :key="bg.id"
                  type="button"
                  class="intro-bg-card"
                  :class="{ active: draft.introBg === bg.id }"
                  @click="draft.introBg = bg.id"
                >
                  <span
                    class="intro-bg-swatch"
                    :style="{
                      background: bg.isAuto
                        ? `linear-gradient(135deg, ${draft.primaryColor}, #0f172a 65%, ${draft.secondaryColor})`
                        : `linear-gradient(135deg, ${bg.swatch[0]}, ${bg.swatch[1]} 68%, ${bg.swatch[2]})`,
                    }"
                  >
                    <i v-if="bg.isAuto" class="ri-links-line"></i>
                  </span>
                  <div class="intro-bg-meta">
                    <div class="intro-bg-name">{{ bg.label }}</div>
                    <div class="intro-bg-desc">{{ bg.desc }}</div>
                  </div>
                  <i
                    v-if="draft.introBg === bg.id"
                    class="ri-checkbox-circle-fill intro-chk-ico"
                  ></i>
                </button>
              </div>
            </div>

            <!-- 5.4 Animation Effect Stage Templates -->
            <div class="intro-sub-block">
              <div class="intro-sub-label">
                <i class="ri-sparkling-fill"></i>
                <span>Template Hiệu ứng sân khấu</span>
              </div>
              <div class="effects-grid">
                <button
                  v-for="fx in INTRO_EFFECT_TEMPLATES"
                  :key="fx.id"
                  type="button"
                  class="effect-card"
                  :class="{ active: draft.introEffect === fx.id }"
                  @click="draft.introEffect = fx.id"
                >
                  <i :class="fx.icon" class="effect-ico"></i>
                  <div class="effect-info">
                    <div class="effect-name">{{ fx.label }}</div>
                    <div class="effect-desc">{{ fx.desc }}</div>
                  </div>
                  <i
                    v-if="draft.introEffect === fx.id"
                    class="ri-checkbox-circle-fill intro-chk-ico"
                  ></i>
                </button>
              </div>
            </div>

            <!-- 5.5 Exit Transition Style -->
            <div class="intro-sub-block">
              <div class="intro-sub-label">
                <i class="ri-door-open-line"></i>
                <span>Kiểu mở màn vào thực đơn</span>
              </div>
              <div class="intro-trans-row">
                <button
                  v-for="tr in INTRO_TRANSITION_TEMPLATES"
                  :key="tr.id"
                  type="button"
                  class="intro-trans-btn"
                  :class="{ active: draft.introTransition === tr.id }"
                  @click="draft.introTransition = tr.id"
                >
                  <i :class="tr.icon"></i>
                  <span>{{ tr.label }}</span>
                </button>
              </div>
            </div>

            <!-- 5.6 Optional Custom Title / Subtitle Override -->
            <div class="intro-sub-block">
              <div class="intro-sub-label">
                <i class="ri-text"></i>
                <span>Tùy chỉnh tiêu đề riêng (để trống = tự dùng bộ chữ 5 ngôn ngữ của Event)</span>
              </div>
              <div class="intro-copy-inputs">
                <input
                  v-model="draft.introCustomTitle"
                  type="text"
                  maxlength="60"
                  class="intro-text-input"
                  placeholder="VD: KHAI TRƯƠNG GIẢM 20% (để trống dùng mặc định)"
                />
                <input
                  v-model="draft.introCustomSubtitle"
                  type="text"
                  maxlength="90"
                  class="intro-text-input"
                  placeholder="Phụ đề ngắn (VD: FREESHIP NỘI KHU MANILA HÔM NAY)"
                />
              </div>
            </div>
          </template>
        </section>

        <CookingSplashIntro
          v-if="showSplashPreview"
          :key="splashPreviewKey"
          :logo-url="shopBrand.logo"
          :shop-name="shopBrand.name"
          lang="vi"
          :event-id="draft.introEvent"
          :bg-id="draft.introBg"
          :effect-id="draft.introEffect"
          :transition-id="draft.introTransition"
          :primary-color="draft.primaryColor"
          :secondary-color="draft.secondaryColor"
          :custom-title="draft.introCustomTitle"
          :custom-subtitle="draft.introCustomSubtitle"
          @done="showSplashPreview = false"
        />
      </div>

      <!-- RIGHT COLUMN: LIVE PREVIEW -->
      <aside class="preview-col">
        <div class="preview-shell">
          <div class="preview-toolbar">
            <div class="preview-toolbar-title">
              <i class="ri-eye-fill"></i>
              <span>Xem trước trực tiếp</span>
            </div>

            <div class="preview-controls">
              <div class="seg-toggle">
                <button
                  type="button"
                  :class="{ active: previewDevice === 'mobile' }"
                  @click="previewDevice = 'mobile'"
                  title="Xem dạng điện thoại"
                >
                  <i class="ri-smartphone-line"></i>
                </button>
                <button
                  type="button"
                  :class="{ active: previewDevice === 'desktop' }"
                  @click="previewDevice = 'desktop'"
                  title="Xem dạng máy tính"
                >
                  <i class="ri-computer-line"></i>
                </button>
              </div>

              <div class="seg-toggle">
                <button
                  type="button"
                  :class="{ active: previewMenuViewMode === 'card' }"
                  @click="previewMenuViewMode = 'card'"
                  title="Xem thử Dạng Chi Tiết"
                >
                  <i class="ri-layout-grid-line"></i>
                </button>
                <button
                  type="button"
                  :class="{ active: previewMenuViewMode === 'board' }"
                  @click="previewMenuViewMode = 'board'"
                  title="Xem thử Dạng Chọn Nhanh"
                >
                  <i class="ri-flashlight-line"></i>
                </button>
              </div>

              <div class="seg-toggle">
                <button
                  type="button"
                  :class="{ active: previewColorScheme === 'light' }"
                  @click="previewColorScheme = 'light'"
                  title="Xem thử chế độ Sáng"
                >
                  <i class="ri-sun-fill"></i>
                </button>
                <button
                  type="button"
                  :class="{ active: previewColorScheme === 'dark' }"
                  @click="previewColorScheme = 'dark'"
                  title="Xem thử chế độ Tối"
                >
                  <i class="ri-moon-clear-fill"></i>
                </button>
              </div>
            </div>
          </div>

          <!-- MOCKUP STAGE -->
          <div class="preview-stage" :class="`is-${previewDevice}`">
            <div
              class="mock-storefront"
              :class="[previewColorScheme === 'dark' ? 'is-dark' : 'is-light', `is-${previewDevice}`]"
              :style="previewVars"
            >
              <SeasonalOverlay :effect="draft.seasonalEffect" :contained="true" />

              <!-- Mock Header -->
              <div class="mk-header">
                <div class="mk-brand">
                  <img :src="shopBrand.logo" alt="" class="mk-logo" />
                  <div class="mk-brand-text">
                    <div class="mk-name">{{ shopBrand.name }}</div>
                    <div class="mk-online">
                      <span class="mk-online-dot"></span>
                      <span>Mở cửa 24/24</span>
                    </div>
                  </div>
                </div>
                <div v-if="previewDevice === 'desktop'" class="mk-search">
                  <i class="ri-search-line"></i>
                  <span>Tìm món ăn, đồ uống...</span>
                </div>
                <div class="mk-actions">
                  <span class="mk-icon-btn">
                    <i :class="previewColorScheme === 'dark' ? 'ri-sun-fill' : 'ri-moon-clear-line'"></i>
                  </span>
                  <span class="mk-cart-pill">
                    <i class="ri-shopping-bag-3-fill"></i>
                    <span>3</span>
                  </span>
                </div>
              </div>

              <!-- Mock Body -->
              <div class="mk-body">
                <!-- Notice bar -->
                <div class="mk-notice">
                  <span class="mk-notice-ico"><i class="ri-megaphone-fill"></i></span>
                  <span class="mk-notice-txt">Freeship đơn từ 2.700₱ • Giao nhanh 24/24 tại Manila!</span>
                </div>

                <!-- Category Pills -->
                <div class="mk-cats">
                  <span class="mk-cat active">Tất cả</span>
                  <span class="mk-cat">Cơm Văn Phòng</span>
                  <span class="mk-cat">Món Nhậu</span>
                  <span class="mk-cat">Đồ Uống</span>
                </div>

                <!-- Centered View Switcher Preview -->
                <div class="mk-view-bar">
                  <div class="mk-view-switcher">
                    <span
                      class="mk-vs-pill"
                      :class="{ active: previewMenuViewMode === 'card' }"
                      @click="previewMenuViewMode = 'card'"
                    >
                      <i class="ri-layout-grid-line"></i>
                      <span>Dạng Chi Tiết</span>
                    </span>
                    <span
                      class="mk-vs-pill"
                      :class="{ active: previewMenuViewMode === 'board' }"
                      @click="previewMenuViewMode = 'board'"
                    >
                      <i class="ri-flashlight-line"></i>
                      <span>Dạng Chọn Nhanh</span>
                    </span>
                  </div>
                </div>

                <!-- Product Grid (Dạng Chi Tiết) -->
                <div
                  v-if="previewMenuViewMode === 'card'"
                  class="mk-grid"
                  :class="{ 'is-3col': previewDevice === 'desktop' }"
                >
                  <div class="mk-card">
                    <div class="mk-thumb">
                      <span class="mk-badge-sale">-15%</span>
                      <span class="mk-badge-top">TOP</span>
                      <i class="ri-restaurant-2-fill mk-thumb-ico"></i>
                    </div>
                    <div class="mk-card-body">
                      <div class="mk-dish">Cơm Sườn Bì Chả</div>
                      <div class="mk-price-row">
                        <span class="mk-price">260₱</span>
                        <span class="mk-old-price">300₱</span>
                      </div>
                      <button type="button" class="mk-add-btn">
                        <i class="ri-add-line"></i> Thêm vào giỏ
                      </button>
                    </div>
                  </div>

                  <div class="mk-card">
                    <div class="mk-thumb">
                      <span class="mk-badge-accent">Bán chạy</span>
                      <i class="ri-bowl-fill mk-thumb-ico"></i>
                    </div>
                    <div class="mk-card-body">
                      <div class="mk-dish">Lẩu Thái Hải Sản</div>
                      <div class="mk-price-row">
                        <span class="mk-price">850₱</span>
                      </div>
                      <button type="button" class="mk-add-btn">
                        <i class="ri-add-line"></i> Thêm vào giỏ
                      </button>
                    </div>
                  </div>

                  <div v-if="previewDevice === 'desktop'" class="mk-card">
                    <div class="mk-thumb">
                      <i class="ri-cup-fill mk-thumb-ico"></i>
                    </div>
                    <div class="mk-card-body">
                      <div class="mk-dish">Trà Đào Cam Sả</div>
                      <div class="mk-price-row">
                        <span class="mk-price">120₱</span>
                      </div>
                      <button type="button" class="mk-add-btn">
                        <i class="ri-add-line"></i> Thêm vào giỏ
                      </button>
                    </div>
                  </div>
                </div>

                <!-- Quick Pick Menu Board Preview (Dạng Chọn Nhanh) -->
                <div v-else class="mk-board">
                  <div class="mk-board-sec">
                    <div class="mk-board-head">
                      <span class="mk-board-title">LẨU &amp; MÓN NHẬU</span>
                      <span class="mk-board-cnt">4</span>
                    </div>
                    <div class="mk-board-grid" :class="{ 'is-2col': previewDevice === 'desktop' }">
                      <div class="mk-board-row">
                        <span class="mk-board-name">Lẩu Thái Hải Sản</span>
                        <span class="mk-board-dots"></span>
                        <strong class="mk-board-price">850₱<small>/Nồi</small></strong>
                        <span class="mk-board-plus"><i class="ri-add-line"></i></span>
                      </div>
                      <div class="mk-board-row">
                        <span class="mk-board-name">Dê Tái Chanh</span>
                        <span class="mk-board-dots"></span>
                        <strong class="mk-board-price">1.200₱<small>/Phần</small></strong>
                        <span class="mk-board-plus"><i class="ri-add-line"></i></span>
                      </div>
                      <div class="mk-board-row">
                        <span class="mk-board-name">Gà Ta Ủ Muối</span>
                        <span class="mk-board-dots"></span>
                        <strong class="mk-board-price">1.550₱<small>/Con</small></strong>
                        <span class="mk-board-plus"><i class="ri-add-line"></i></span>
                      </div>
                      <div class="mk-board-row">
                        <span class="mk-board-name">Ếch Chiên Mắm</span>
                        <span class="mk-board-dots"></span>
                        <strong class="mk-board-price">1.350₱<small>/Phần</small></strong>
                        <span class="mk-board-plus"><i class="ri-add-line"></i></span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Mock Bottom Cart Bar -->
              <div class="mk-bottom-bar">
                <div class="mk-bottom-info">
                  <span class="mk-bottom-count">3 món</span>
                  <span class="mk-bottom-total">1.230₱</span>
                </div>
                <button type="button" class="mk-checkout-btn">
                  Đặt hàng ngay <i class="ri-arrow-right-line"></i>
                </button>
              </div>
            </div>
          </div>

          <div class="preview-footnote">
            <i class="ri-information-line"></i>
            <span>Màu đỏ giảm giá & chấm xanh trạng thái Online luôn giữ nguyên để khách dễ phân biệt.</span>
          </div>
        </div>
      </aside>
    </div>
  </div>
</template>

<style scoped>
.theme-page {
  padding: 20px 24px 48px;
  max-width: 1440px;
  margin: 0 auto;
  color: #1e293b;
}

/* Toast */
.theme-toast {
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
  box-shadow: 0 12px 30px rgba(15, 23, 42, 0.18);
  max-width: min(460px, calc(100vw - 32px));
}
.theme-toast.is-success {
  background: #065f46;
  color: #ffffff;
}
.theme-toast.is-info {
  background: #1e40af;
  color: #ffffff;
}
.theme-toast.is-error {
  background: #b91c1c;
  color: #ffffff;
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

/* Header */
.theme-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 18px;
}
.theme-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 22px;
  font-weight: 800;
  color: #0f172a;
  margin: 0 0 6px;
}
.theme-title i {
  color: #059669;
  font-size: 24px;
}
.theme-subtitle {
  margin: 0;
  font-size: 13.5px;
  color: #64748b;
  line-height: 1.5;
}
.theme-header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
.btn-ghost,
.btn-outline,
.btn-save {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 9px 15px;
  border-radius: 10px;
  font-size: 13.5px;
  font-weight: 700;
  cursor: pointer;
  text-decoration: none;
  transition: all 0.18s ease;
  border: 1px solid transparent;
}
.btn-ghost {
  background: #f1f5f9;
  color: #475569;
  border-color: #e2e8f0;
}
.btn-ghost:hover:not(:disabled) {
  background: #e2e8f0;
  color: #0f172a;
}
.btn-outline {
  background: #ffffff;
  color: #0f172a;
  border-color: #cbd5e1;
}
.btn-outline:hover {
  border-color: #059669;
  color: #059669;
}
.btn-save {
  background: linear-gradient(135deg, #059669, #047857);
  color: #ffffff;
  box-shadow: 0 6px 16px rgba(5, 150, 105, 0.25);
}
.btn-save:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 8px 20px rgba(5, 150, 105, 0.34);
}
.btn-save:disabled,
.btn-ghost:disabled {
  opacity: 0.52;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.spinning {
  animation: spin 0.9s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Unsaved bar */
.unsaved-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  padding: 11px 16px;
  margin-bottom: 18px;
  border-radius: 12px;
  background: #fffbeb;
  border: 1px solid #fde68a;
  color: #92400e;
  font-size: 13px;
}
.unsaved-bar-left {
  display: flex;
  align-items: center;
  gap: 8px;
}
.unsaved-bar-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}
.btn-link-cancel {
  background: none;
  border: none;
  color: #92400e;
  font-weight: 700;
  cursor: pointer;
  text-decoration: underline;
  font-size: 13px;
}
.btn-mini-save {
  background: #d97706;
  color: #ffffff;
  border: none;
  padding: 6px 13px;
  border-radius: 8px;
  font-weight: 700;
  font-size: 12.5px;
  cursor: pointer;
}

/* Loading */
.loading-box {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 64px 20px;
  background: #ffffff;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  color: #64748b;
  font-weight: 600;
}

/* Workspace Layout */
.theme-workspace {
  display: grid;
  grid-template-columns: minmax(0, 1.35fr) minmax(340px, 0.95fr);
  gap: 22px;
  align-items: start;
}

.settings-col {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.cfg-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 2px 10px rgba(15, 23, 42, 0.04);
}
.cfg-card-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
  flex-wrap: wrap;
  margin-bottom: 16px;
}
.cfg-card-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 800;
  color: #0f172a;
  margin: 0 0 4px;
}
.cfg-card-title i {
  color: #059669;
}
.cfg-card-desc {
  margin: 0;
  font-size: 13px;
  color: #64748b;
}

/* Mode tabs */
.mode-tabs {
  display: inline-flex;
  background: #f1f5f9;
  padding: 4px;
  border-radius: 10px;
  gap: 4px;
}
.mode-tab {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 12px;
  border-radius: 8px;
  border: none;
  background: transparent;
  color: #475569;
  font-size: 12.5px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.16s ease;
}
.mode-tab.active {
  background: #ffffff;
  color: #0f172a;
  box-shadow: 0 2px 6px rgba(15, 23, 42, 0.08);
}

/* Presets Grid */
.presets-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}
.preset-card {
  text-align: left;
  background: #ffffff;
  border: 2px solid #e2e8f0;
  border-radius: 14px;
  overflow: hidden;
  padding: 0;
  cursor: pointer;
  transition: all 0.18s ease;
  display: flex;
  flex-direction: column;
}
.preset-card:hover {
  border-color: #94a3b8;
  transform: translateY(-2px);
  box-shadow: 0 8px 18px rgba(15, 23, 42, 0.08);
}
.preset-card.active {
  border-color: #059669;
  box-shadow: 0 0 0 3px rgba(5, 150, 105, 0.16);
}
.preset-swatch-bar {
  height: 52px;
  padding: 8px 10px;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  position: relative;
}
.preset-tag {
  font-size: 10.5px;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.42);
  color: #ffffff;
  backdrop-filter: blur(4px);
}
.preset-check {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #ffffff;
  color: #059669;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
  font-weight: 900;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.22);
}
.preset-body {
  padding: 10px 12px 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
}
.preset-name {
  font-size: 13.5px;
  font-weight: 800;
  color: #0f172a;
}
.preset-desc {
  font-size: 11.5px;
  color: #64748b;
  line-height: 1.4;
  flex: 1;
}
.preset-dots {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 6px;
}
.dot-chip {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 1px solid rgba(15, 23, 42, 0.16);
}
.preset-mode-hint {
  margin-left: auto;
  font-size: 11px;
  font-weight: 600;
  color: #64748b;
  display: inline-flex;
  align-items: center;
  gap: 3px;
}

/* Custom Picker */
.custom-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.color-picker-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}
.color-box {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.color-label {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.color-label-title {
  font-size: 13.5px;
  font-weight: 800;
  color: #0f172a;
}
.color-label-sub {
  font-size: 11.5px;
  color: #64748b;
}
.color-input-row {
  display: flex;
  align-items: center;
  gap: 10px;
}
.native-swatch {
  width: 44px;
  height: 40px;
  border-radius: 10px;
  border: 2px solid rgba(15, 23, 42, 0.14);
  cursor: pointer;
  overflow: hidden;
  flex-shrink: 0;
  position: relative;
}
.native-swatch input[type='color'] {
  opacity: 0;
  width: 100%;
  height: 100%;
  cursor: pointer;
  border: none;
  padding: 0;
}
.hex-input {
  flex: 1;
  height: 40px;
  border-radius: 10px;
  border: 1px solid #cbd5e1;
  padding: 0 12px;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 14px;
  font-weight: 700;
  color: #0f172a;
  background: #ffffff;
  text-transform: uppercase;
}
.hex-input:focus {
  outline: none;
  border-color: #059669;
  box-shadow: 0 0 0 3px rgba(5, 150, 105, 0.14);
}
.quick-swatches {
  display: flex;
  align-items: center;
  gap: 7px;
  flex-wrap: wrap;
}
.quick-swatch {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.9);
  box-shadow: 0 0 0 1px rgba(15, 23, 42, 0.18);
  cursor: pointer;
  transition: transform 0.15s ease;
}
.quick-swatch:hover {
  transform: scale(1.14);
}
.quick-swatch.active {
  box-shadow: 0 0 0 2px #0f172a;
  transform: scale(1.12);
}

.auto-palette-strip {
  background: #f8fafc;
  border: 1px dashed #cbd5e1;
  border-radius: 12px;
  padding: 12px 14px;
}
.auto-palette-title {
  font-size: 12px;
  font-weight: 700;
  color: #475569;
  margin-bottom: 8px;
}
.auto-palette-chips {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.ap-chip {
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 700;
}

/* Scheme grid */
.scheme-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}
.option-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px;
  border-radius: 12px;
  border: 2px solid #e2e8f0;
  background: #ffffff;
  text-align: left;
  cursor: pointer;
  transition: all 0.16s ease;
}
.option-card:hover {
  border-color: #94a3b8;
}
.option-card.active {
  border-color: #059669;
  background: #f0fdf4;
}
.option-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  flex-shrink: 0;
}
.option-icon.is-light {
  background: #fef3c7;
  color: #d97706;
}
.option-icon.is-dark {
  background: #1e293b;
  color: #facc15;
}
.option-icon.is-detail-mode {
  background: #dbeafe;
  color: #1d4ed8;
}
.option-icon.is-quick-mode {
  background: #d1fae5;
  color: #047857;
}
.option-text {
  flex: 1;
}
.option-title {
  font-size: 13.5px;
  font-weight: 800;
  color: #0f172a;
}
.option-desc {
  font-size: 12px;
  color: #64748b;
  margin-top: 2px;
}
.option-radio {
  font-size: 20px;
  color: #059669;
}

/* Surface & Radius */
.sub-group + .sub-group {
  margin-top: 16px;
}
.sub-group-label {
  font-size: 12.5px;
  font-weight: 800;
  color: #334155;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  margin-bottom: 10px;
}
.triple-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}
.mini-opt-card {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
  padding: 12px;
  border-radius: 12px;
  border: 2px solid #e2e8f0;
  background: #ffffff;
  text-align: left;
  cursor: pointer;
  transition: all 0.16s ease;
}
.mini-opt-card:hover {
  border-color: #94a3b8;
}
.mini-opt-card.active {
  border-color: #059669;
  background: #f0fdf4;
}
.surface-swatch {
  width: 100%;
  height: 30px;
  border-radius: 8px;
  border: 1px solid rgba(15, 23, 42, 0.1);
  display: flex;
  align-items: center;
  padding: 4px 6px;
}
.surface-swatch.is-clean {
  background: #f6f8fa;
}
.surface-swatch.is-warm {
  background: #faf7f2;
}
.surface-swatch span {
  width: 45%;
  height: 100%;
  background: #ffffff;
  border-radius: 5px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}
.radius-demo-box {
  width: 44px;
  height: 28px;
  background: #ffffff;
  border: 2px solid #059669;
}
.mini-opt-title {
  font-size: 13px;
  font-weight: 800;
  color: #0f172a;
}
.mini-opt-desc {
  font-size: 11.5px;
  color: #64748b;
  line-height: 1.35;
}

/* Seasonal Effects */
.effects-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}
.effect-card {
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 12px 14px;
  border-radius: 12px;
  border: 2px solid #e2e8f0;
  background: #ffffff;
  text-align: left;
  cursor: pointer;
  transition: all 0.16s ease;
}
.effect-card:hover {
  border-color: #94a3b8;
}
.effect-card.active {
  border-color: #059669;
  background: #f0fdf4;
}
.effect-ico {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: #f1f5f9;
  color: #059669;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  flex-shrink: 0;
}
.effect-card.active .effect-ico {
  background: #059669;
  color: #ffffff;
}
.effect-name {
  font-size: 13px;
  font-weight: 800;
  color: #0f172a;
}
.effect-desc {
  font-size: 11.5px;
  color: #64748b;
  margin-top: 2px;
}

/* =========================================================
   RIGHT COLUMN: STICKY LIVE PREVIEW
   ========================================================= */
.preview-col {
  position: sticky;
  top: 18px;
}
.preview-shell {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 18px;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08);
}
.preview-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 13px 16px;
  border-bottom: 1px solid #e2e8f0;
  background: #f8fafc;
}
.preview-toolbar-title {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 14px;
  font-weight: 800;
  color: #0f172a;
}
.preview-toolbar-title i {
  color: #059669;
}
.preview-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}
.seg-toggle {
  display: inline-flex;
  background: #e2e8f0;
  padding: 3px;
  border-radius: 8px;
  gap: 2px;
}
.seg-toggle button {
  width: 30px;
  height: 28px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: #475569;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
}
.seg-toggle button.active {
  background: #ffffff;
  color: #0f172a;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.12);
}

.preview-stage {
  padding: 18px;
  background: #eef2f6;
  display: flex;
  justify-content: center;
}
.mock-storefront {
  position: relative;
  overflow: hidden;
  background: var(--sa-bg);
  color: var(--sa-text, #334155);
  border-radius: 18px;
  border: 1px solid rgba(15, 23, 42, 0.14);
  box-shadow: 0 14px 36px rgba(15, 23, 42, 0.16);
  width: 100%;
  transition: all 0.22s ease;
}
.mock-storefront.is-mobile {
  max-width: 356px;
  border-radius: 26px;
  border: 5px solid #1e293b;
}
.mock-storefront.is-dark {
  --sa-text: #cbd5e1;
  --sa-heading: #f8fafc;
  --sa-muted: #94a3b8;
  --sa-border: rgba(255, 255, 255, 0.1);
}
.mock-storefront.is-light {
  --sa-text: #334155;
  --sa-heading: #0f172a;
  --sa-muted: #64748b;
  --sa-border: #e5e7eb;
}

.mk-header {
  background: var(--sa-top-header-bg);
  color: var(--sa-on-primary, #ffffff);
  padding: 11px 13px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}
.mk-brand {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}
.mk-logo {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid var(--sa-secondary);
  background: #ffffff;
  flex-shrink: 0;
}
.mk-name {
  font-size: 12.5px;
  font-weight: 800;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.mk-online {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 10px;
  color: var(--sa-on-primary-muted);
}
.mk-online-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #4ade80;
  display: inline-block;
}
.mk-search {
  flex: 1;
  max-width: 170px;
  background: rgba(255, 255, 255, 0.94);
  color: #64748b;
  border-radius: 999px;
  padding: 5px 10px;
  font-size: 10.5px;
  display: flex;
  align-items: center;
  gap: 5px;
}
.mk-actions {
  display: flex;
  align-items: center;
  gap: 6px;
}
.mk-icon-btn {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.18);
  color: var(--sa-on-primary, #ffffff);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
}
.mk-cart-pill {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 5px 9px;
  border-radius: 999px;
  background: var(--sa-secondary);
  color: var(--sa-on-secondary);
  font-size: 11px;
  font-weight: 800;
}

.mk-body {
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.mk-notice {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 8px 10px;
  background: var(--sa-notice-bg);
  border: 1px solid var(--sa-notice-border);
  border-radius: var(--sa-radius-card);
  color: var(--sa-notice-text);
  font-size: 11px;
  font-weight: 600;
}
.mk-notice-ico {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: var(--sa-secondary);
  color: var(--sa-on-secondary);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  flex-shrink: 0;
}
.mk-notice-txt {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.mk-cats {
  display: flex;
  align-items: center;
  gap: 6px;
  overflow: hidden;
}
.mk-cat {
  font-size: 11px;
  font-weight: 700;
  padding: 5px 10px;
  border-radius: 999px;
  background: var(--sa-surface);
  color: var(--sa-text);
  border: 1px solid var(--sa-border);
  white-space: nowrap;
}
.mk-cat.active {
  background: var(--sa-accent);
  color: var(--sa-on-primary);
  border-color: var(--sa-accent);
}

.mk-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}
.mk-grid.is-3col {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}
.mk-card {
  background: var(--sa-surface);
  border: 1px solid var(--sa-border);
  border-radius: var(--sa-radius-card);
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.06);
  display: flex;
  flex-direction: column;
}
.mk-thumb {
  height: 76px;
  background: var(--sa-surface-2);
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}
.mk-thumb-ico {
  font-size: 30px;
  color: var(--sa-accent);
  opacity: 0.45;
}
.mk-badge-sale {
  position: absolute;
  top: 6px;
  left: 6px;
  background: #e11d48;
  color: #ffffff;
  font-size: 9.5px;
  font-weight: 800;
  padding: 2px 6px;
  border-radius: 6px;
}
.mk-badge-top {
  position: absolute;
  top: 6px;
  right: 6px;
  background: var(--sa-secondary);
  color: var(--sa-on-secondary);
  font-size: 9.5px;
  font-weight: 800;
  padding: 2px 6px;
  border-radius: 6px;
}
.mk-badge-accent {
  position: absolute;
  top: 6px;
  left: 6px;
  background: var(--sa-secondary);
  color: var(--sa-on-secondary);
  font-size: 9.5px;
  font-weight: 800;
  padding: 2px 6px;
  border-radius: 6px;
}
.mk-card-body {
  padding: 9px;
  display: flex;
  flex-direction: column;
  gap: 5px;
}
.mk-dish {
  font-size: 12px;
  font-weight: 700;
  color: var(--sa-heading);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.mk-price-row {
  display: flex;
  align-items: baseline;
  gap: 6px;
}
.mk-price {
  font-size: 13px;
  font-weight: 800;
  color: var(--sa-price);
}
.mk-old-price {
  font-size: 10.5px;
  color: var(--sa-muted);
  text-decoration: line-through;
}
.mk-add-btn {
  margin-top: 2px;
  width: 100%;
  border: none;
  padding: 6px 8px;
  border-radius: var(--sa-radius-btn);
  background: var(--sa-accent);
  color: var(--sa-on-primary);
  font-size: 11px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 3px;
  cursor: default;
}

.mk-bottom-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 13px;
  background: var(--sa-surface);
  border-top: 1px solid var(--sa-border);
}
.mk-bottom-info {
  display: flex;
  flex-direction: column;
}
.mk-bottom-count {
  font-size: 10.5px;
  color: var(--sa-muted);
}
.mk-bottom-total {
  font-size: 14px;
  font-weight: 800;
  color: var(--sa-price);
}
.mk-checkout-btn {
  border: none;
  padding: 8px 14px;
  border-radius: var(--sa-radius-btn);
  background: var(--sa-top-header-bg);
  color: var(--sa-on-primary);
  font-size: 12px;
  font-weight: 800;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  cursor: default;
}

.preview-footnote {
  display: flex;
  align-items: flex-start;
  gap: 7px;
  padding: 11px 14px;
  font-size: 12px;
  color: #64748b;
  background: #f8fafc;
  border-top: 1px solid #e2e8f0;
  line-height: 1.45;
}

/* Responsive */
@media (max-width: 1120px) {
  .theme-workspace {
    grid-template-columns: 1fr;
  }
  .preview-col {
    position: static;
    order: -1;
  }
}

@media (max-width: 768px) {
  .theme-page {
    padding: 14px 14px 90px;
  }
  .theme-title {
    font-size: 19px;
  }
  .presets-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .color-picker-grid,
  .scheme-grid,
  .triple-grid,
  .effects-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 480px) {
  .presets-grid {
    grid-template-columns: 1fr;
  }
}

.btn-preview-splash {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: 10px;
  border: 1px solid rgba(251, 146, 60, 0.55);
  background: linear-gradient(135deg, #ea580c, #dc2626);
  color: #fff7ed;
  font-size: 12.5px;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
  flex-shrink: 0;
  box-shadow: 0 6px 18px rgba(234, 88, 12, 0.28);
  transition: transform 0.15s ease, filter 0.15s ease;
}

.btn-preview-splash:hover {
  filter: brightness(1.08);
  transform: translateY(-1px);
}

/* LIVE MINI PREVIEW BANNER FOR INTRO STUDIO */
.intro-mini-stage {
  margin-top: 14px;
  padding: 14px 16px;
  border-radius: 14px;
  border: 1px solid rgba(15, 23, 42, 0.14);
  box-shadow: 0 8px 22px rgba(15, 23, 42, 0.16);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  flex-wrap: wrap;
  cursor: pointer;
  transition: transform 0.16s ease, box-shadow 0.16s ease;
}

.intro-mini-stage:hover {
  transform: translateY(-1px);
  box-shadow: 0 12px 26px rgba(15, 23, 42, 0.22);
}

.ims-left {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
  flex: 1 1 240px;
}

.ims-logo-ring {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  border: 2px solid #fbbf24;
  padding: 2px;
  background: #ffffff;
  flex-shrink: 0;
  overflow: hidden;
}

.ims-logo-ring img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  display: block;
}

.ims-copy {
  min-width: 0;
}

.ims-kicker {
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 1.6px;
  text-transform: uppercase;
  opacity: 0.92;
}

.ims-title {
  font-size: 16px;
  font-weight: 900;
  letter-spacing: -0.2px;
  text-transform: uppercase;
  line-height: 1.2;
  margin-top: 2px;
}

.ims-sub {
  font-size: 11px;
  font-weight: 600;
  color: rgba(255, 247, 237, 0.85);
  margin-top: 2px;
}

.ims-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;
}

.ims-badges {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 6px;
}

.ims-pill {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 9px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.14);
  border: 1px solid rgba(255, 255, 255, 0.24);
  color: #ffffff;
  font-size: 11px;
  font-weight: 700;
}

.ims-play-hint {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 11.5px;
  font-weight: 700;
  color: #fde68a;
}

.intro-sub-block {
  margin-top: 18px;
  padding-top: 16px;
  border-top: 1px solid #e2e8f0;
}

.intro-sub-head-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 10px;
}

.intro-sub-head-row .intro-sub-label {
  margin-bottom: 0;
}

.intro-sub-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12.5px;
  font-weight: 800;
  color: #1e293b;
  text-transform: uppercase;
  letter-spacing: 0.02em;
  margin-bottom: 10px;
}

.intro-sub-label i {
  color: #ea580c;
  font-size: 15px;
}

.intro-chk-ico {
  font-size: 19px;
  color: #059669;
  margin-left: auto;
  flex-shrink: 0;
}

.intro-mode-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.intro-mode-card {
  align-items: flex-start;
}

.btn-sync-event-theme {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 6px 12px;
  border-radius: 9px;
  border: 1.5px solid #10b981;
  background: #ecfdf5;
  color: #047857;
  font-size: 12px;
  font-weight: 800;
  cursor: pointer;
  transition: all 0.16s ease;
}

.btn-sync-event-theme:hover {
  background: #059669;
  border-color: #059669;
  color: #ffffff;
}

.intro-events-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.intro-event-card .effect-info {
  flex: 1;
  min-width: 0;
}

.intro-event-card .effect-name {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.intro-ev-tag {
  padding: 2px 7px;
  border-radius: 999px;
  background: #fef3c7;
  border: 1px solid #fcd34d;
  color: #b45309;
  font-size: 10.5px;
  font-weight: 800;
}

.intro-bg-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.intro-bg-card {
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 11px 13px;
  border-radius: 12px;
  border: 2px solid #e2e8f0;
  background: #ffffff;
  color: #0f172a;
  text-align: left;
  cursor: pointer;
  transition: all 0.16s ease;
}

.intro-bg-card:hover {
  border-color: #94a3b8;
  background: #f8fafc;
}

.intro-bg-card.active {
  border-color: #059669;
  background: #f0fdf4;
  box-shadow: 0 4px 12px rgba(5, 150, 105, 0.12);
}

.intro-bg-swatch {
  width: 40px;
  height: 40px;
  border-radius: 11px;
  border: 2px solid rgba(15, 23, 42, 0.16);
  box-shadow: 0 3px 8px rgba(15, 23, 42, 0.16);
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  font-size: 16px;
}

.intro-bg-meta {
  min-width: 0;
  flex: 1;
}

.intro-bg-name {
  font-size: 13px;
  font-weight: 800;
  color: #0f172a;
}

.intro-bg-desc {
  font-size: 11.5px;
  color: #64748b;
  margin-top: 2px;
  line-height: 1.35;
}

.intro-trans-row {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.intro-trans-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 11px 12px;
  border-radius: 11px;
  border: 2px solid #e2e8f0;
  background: #ffffff;
  color: #334155;
  font-size: 12.5px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s ease;
}

.intro-trans-btn:hover {
  border-color: #94a3b8;
  color: #0f172a;
}

.intro-trans-btn.active {
  border-color: #059669;
  background: #f0fdf4;
  color: #047857;
  font-weight: 800;
}

.intro-copy-inputs {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.intro-text-input {
  width: 100%;
  height: 40px;
  padding: 0 12px;
  border-radius: 10px;
  border: 1.5px solid #cbd5e1;
  background: #ffffff;
  color: #0f172a;
  font-family: inherit;
  font-size: 13px;
  font-weight: 600;
  outline: none;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.intro-text-input::placeholder {
  color: #94a3b8;
  font-weight: 500;
}

.intro-text-input:focus {
  border-color: #059669;
  box-shadow: 0 0 0 3px rgba(5, 150, 105, 0.14);
}

@media (max-width: 900px) {
  .intro-mode-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .intro-events-grid,
  .intro-bg-grid,
  .intro-trans-row,
  .intro-copy-inputs {
    grid-template-columns: 1fr;
  }
  .ims-right {
    align-items: flex-start;
  }
  .ims-badges {
    justify-content: flex-start;
  }
}

/* Mock View Switcher & Quick Pick Preview */
.mk-view-bar {
  display: flex;
  justify-content: center;
  margin-bottom: 10px;
}

.mk-view-switcher {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 2px;
  border-radius: 9px;
  background: var(--sa-surface-2);
  border: 1px solid rgba(148, 163, 184, 0.25);
}

.mk-vs-pill {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 7px;
  font-size: 10px;
  font-weight: 700;
  color: #64748b;
  cursor: pointer;
  user-select: none;
}

.mk-vs-pill.active {
  background: var(--sa-accent);
  color: var(--sa-on-accent, #ffffff);
}

.mk-board-sec {
  background: var(--sa-surface);
  border: 1px solid rgba(148, 163, 184, 0.22);
  border-radius: var(--sa-radius-card, 12px);
  overflow: hidden;
}

.mk-board-head {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 6px 10px;
  background: var(--sa-top-header-bg);
  color: var(--sa-on-primary, #ffffff);
}

.mk-board-title {
  font-size: 10.5px;
  font-weight: 800;
  letter-spacing: 0.3px;
}

.mk-board-cnt {
  padding: 0 5px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.22);
  font-size: 9.5px;
  font-weight: 800;
}

.mk-board-grid {
  display: grid;
  grid-template-columns: 1fr;
  padding: 4px 8px 6px;
}

.mk-board-grid.is-2col {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  column-gap: 10px;
}

.mk-board-row {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 5px 2px;
  border-bottom: 1px dashed rgba(148, 163, 184, 0.25);
  font-size: 10.5px;
}

.mk-board-name {
  font-weight: 600;
  color: #0f172a;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.mock-storefront.is-dark .mk-board-name {
  color: #f8fafc;
}

.mk-board-dots {
  flex: 1;
  min-width: 8px;
  border-bottom: 1px dotted rgba(148, 163, 184, 0.45);
}

.mk-board-price {
  font-weight: 800;
  color: var(--sa-price);
  white-space: nowrap;
}

.mk-board-price small {
  font-weight: 600;
  opacity: 0.72;
  font-size: 9px;
}

.mk-board-plus {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--sa-accent);
  color: var(--sa-on-accent, #ffffff);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  flex-shrink: 0;
}
</style>
