// Shared storefront theme & display configuration utilities
// Used by MenuOnline.vue (customer storefront), CauHinhHienThi.vue (admin), api.js, and displayOrder.js
import {
  INTRO_BG_TEMPLATES,
  INTRO_EFFECT_TEMPLATES,
  INTRO_TRANSITION_TEMPLATES,
  INTRO_EVENT_TEMPLATES,
  resolveIntroSplashPalette,
} from './introSplashTemplates'

export const STOREFRONT_THEME_CACHE_KEY = 'SA_STOREFRONT_THEME_V1'

export const SURFACE_STYLE_OPTIONS = [
  {
    id: 'clean',
    label: 'Trắng sạch hiện đại',
    desc: 'Nền xám trắng trung tính, nổi bật ảnh món ăn',
  },
  {
    id: 'tinted',
    label: 'Phủ sắc nhẹ theo màu chính',
    desc: 'Nền pha nhẹ tông màu chủ đạo tạo cảm giác đồng bộ',
  },
  {
    id: 'warm',
    label: 'Kem ấm ẩm thực',
    desc: 'Nền kem sữa nhẹ nhàng, tạo cảm giác ấm áp ngon miệng',
  },
]

export const CARD_RADIUS_OPTIONS = [
  {
    id: 'sharp',
    label: 'Vuông gọn',
    desc: 'Bo góc sắc nét (8px)',
    card: '8px',
    btn: '7px',
    sm: '6px',
    panel: '10px',
  },
  {
    id: 'rounded',
    label: 'Bo mềm (Mặc định)',
    desc: 'Cân đối hiện đại (14px)',
    card: '14px',
    btn: '10px',
    sm: '8px',
    panel: '16px',
  },
  {
    id: 'pill',
    label: 'Bo tròn mềm mại',
    desc: 'Thân thiện, trẻ trung (20px)',
    card: '20px',
    btn: '14px',
    sm: '12px',
    panel: '22px',
  },
]

export const SEASONAL_EFFECT_OPTIONS = [
  {
    id: 'none',
    label: 'Tắt hiệu ứng',
    icon: 'ri-prohibited-line',
    desc: 'Giao diện gọn gàng, tối ưu tốc độ',
  },
  {
    id: 'tet',
    label: 'Tết (Hoa mai & Hoa đào)',
    icon: 'ri-sparkling-2-fill',
    desc: 'Cánh hoa mai vàng & đào hồng rơi nhẹ nhàng',
  },
  {
    id: 'snow',
    label: 'Noel (Tuyết rơi)',
    icon: 'ri-snowy-fill',
    desc: 'Bông tuyết trắng rơi êm dịu không che nội dung',
  },
  {
    id: 'sakura',
    label: 'Hoa anh đào',
    icon: 'ri-flower-fill',
    desc: 'Cánh hoa hồng phấn bay nhẹ lãng mạn',
  },
  {
    id: 'sparkle',
    label: 'Lễ hội (Lấp lánh)',
    icon: 'ri-star-smile-fill',
    desc: 'Hạt ánh sáng vàng kim lung linh dịp sự kiện',
  },
]

export const INTRO_SPLASH_MODE_OPTIONS = [
  {
    id: 'once_session',
    label: 'Bật (1 lần mỗi phiên)',
    icon: 'ri-fire-fill',
    desc: 'Chạy animation chảo lửa khi khách mới mở web, F5 trong phiên không làm phiền',
  },
  {
    id: 'always',
    label: 'Bật (Mỗi lần tải trang)',
    icon: 'ri-sparkling-fill',
    desc: 'Luôn chạy màn hình chào chảo lửa mỗi khi khách mở hoặc F5 trang thực đơn',
  },
  {
    id: 'off',
    label: 'Tắt màn hình chào',
    icon: 'ri-prohibited-line',
    desc: 'Vào thẳng danh sách món ăn ngay lập tức',
  },
]

export const STOREFRONT_THEME_PRESETS = [
  {
    id: 'sa-emerald',
    name: 'Xanh Ngọc – Vàng',
    tag: 'Mặc định SA',
    desc: 'Bản gốc SA Kitchen tươi mới, nổi bật và dễ nhìn',
    primaryColor: '#059669',
    secondaryColor: '#facc15',
    surfaceStyle: 'clean',
    defaultColorScheme: 'light',
  },
  {
    id: 'tet-crimson',
    name: 'Đỏ Đô – Vàng Kim',
    tag: 'Ẩm thực / Tết',
    desc: 'Kích thích vị giác, rực rỡ cho quán ăn Việt & dịp lễ Tết',
    primaryColor: '#c81e1e',
    secondaryColor: '#facc15',
    surfaceStyle: 'warm',
    defaultColorScheme: 'light',
  },
  {
    id: 'warm-amber',
    name: 'Cam Cháy – Vàng Mật',
    tag: 'F&B Ấm áp',
    desc: 'Tông cam ngon miệng, năng động cho cơm văn phòng & đồ nướng',
    primaryColor: '#ea580c',
    secondaryColor: '#fde047',
    surfaceStyle: 'warm',
    defaultColorScheme: 'light',
  },
  {
    id: 'ocean-blue',
    name: 'Xanh Biển – Vàng Nắng',
    tag: 'Tươi mát',
    desc: 'Sạch sẽ, mát mắt, phù hợp tạp hóa, hải sản & đi chợ hộ',
    primaryColor: '#0284c7',
    secondaryColor: '#fbbf24',
    surfaceStyle: 'clean',
    defaultColorScheme: 'light',
  },
  {
    id: 'royal-navy',
    name: 'Xanh Navy – Vàng Đồng',
    tag: 'Chuyên nghiệp',
    desc: 'Đĩnh đạc, tin cậy và sắc nét trên cả mobile lẫn PC',
    primaryColor: '#1d4ed8',
    secondaryColor: '#facc15',
    surfaceStyle: 'clean',
    defaultColorScheme: 'light',
  },
  {
    id: 'obsidian-gold',
    name: 'Đen Than – Vàng Gold',
    tag: 'Sang trọng',
    desc: 'Lịch lãm kiểu nhà hàng đêm / món nhậu cao cấp',
    primaryColor: '#1e293b',
    secondaryColor: '#f59e0b',
    surfaceStyle: 'clean',
    defaultColorScheme: 'dark',
  },
  {
    id: 'berry-rose',
    name: 'Hồng Dâu – Vàng Kem',
    tag: 'Trẻ trung',
    desc: 'Nổi bật, cuốn hút cho trà sữa, ăn vặt & đồ uống',
    primaryColor: '#e11d48',
    secondaryColor: '#fde047',
    surfaceStyle: 'tinted',
    defaultColorScheme: 'light',
  },
  {
    id: 'royal-purple',
    name: 'Tím Hoàng Gia – Vàng Chanh',
    tag: 'Hiện đại',
    desc: 'Cá tính, khác biệt và thu hút ánh nhìn ngay lập tức',
    primaryColor: '#7c3aed',
    secondaryColor: '#facc15',
    surfaceStyle: 'tinted',
    defaultColorScheme: 'light',
  },
  {
    id: 'forest-olive',
    name: 'Xanh Rêu – Cam Đất',
    tag: 'Bếp nhà',
    desc: 'Mộc mạc, organic, gần gũi cho món ăn gia đình',
    primaryColor: '#3f6212',
    secondaryColor: '#f59e0b',
    surfaceStyle: 'warm',
    defaultColorScheme: 'light',
  },
]

export const DEFAULT_STOREFRONT_THEME = {
  mode: 'preset',
  presetId: 'sa-emerald',
  primaryColor: '#059669',
  secondaryColor: '#facc15',
  defaultColorScheme: 'light',
  surfaceStyle: 'clean',
  cardRadius: 'rounded',
  seasonalEffect: 'none',
  introSplashMode: 'once_session',
  introEvent: 'default',
  introBg: 'wok-crimson',
  introEffect: 'wok',
  introTransition: 'doors',
  introCustomTitle: '',
  introCustomSubtitle: '',
  updatedAt: 0,
}

const VALID_SURFACE_STYLES = new Set(SURFACE_STYLE_OPTIONS.map((o) => o.id))
const VALID_CARD_RADII = new Set(CARD_RADIUS_OPTIONS.map((o) => o.id))
const VALID_SEASONAL_EFFECTS = new Set(SEASONAL_EFFECT_OPTIONS.map((o) => o.id))
const VALID_INTRO_SPLASH_MODES = new Set(INTRO_SPLASH_MODE_OPTIONS.map((o) => o.id))
const VALID_INTRO_EVENTS = new Set(INTRO_EVENT_TEMPLATES.map((o) => o.id))
const VALID_INTRO_BGS = new Set(INTRO_BG_TEMPLATES.map((o) => o.id))
const VALID_INTRO_EFFECTS = new Set(INTRO_EFFECT_TEMPLATES.map((o) => o.id))
const VALID_INTRO_TRANSITIONS = new Set(INTRO_TRANSITION_TEMPLATES.map((o) => o.id))

export function sanitizeHexColor(val, fallback = '#059669') {
  const str = String(val || '').trim()
  if (/^#[0-9a-fA-F]{6}$/.test(str)) return str.toLowerCase()
  if (/^#[0-9a-fA-F]{3}$/.test(str)) {
    const r = str[1]
    const g = str[2]
    const b = str[3]
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase()
  }
  return fallback
}

export function normalizeThemeConfig(raw) {
  if (!raw || typeof raw !== 'object') {
    return { ...DEFAULT_STOREFRONT_THEME }
  }
  const mode = raw.mode === 'custom' ? 'custom' : 'preset'
  const matchedPreset = STOREFRONT_THEME_PRESETS.find((p) => p.id === raw.presetId)
  const presetId = matchedPreset ? matchedPreset.id : DEFAULT_STOREFRONT_THEME.presetId

  const primaryFallback = matchedPreset ? matchedPreset.primaryColor : DEFAULT_STOREFRONT_THEME.primaryColor
  const secondaryFallback = matchedPreset ? matchedPreset.secondaryColor : DEFAULT_STOREFRONT_THEME.secondaryColor

  const primaryColor =
    mode === 'preset' && matchedPreset
      ? matchedPreset.primaryColor
      : sanitizeHexColor(raw.primaryColor, primaryFallback)
  const secondaryColor =
    mode === 'preset' && matchedPreset
      ? matchedPreset.secondaryColor
      : sanitizeHexColor(raw.secondaryColor, secondaryFallback)

  const defaultColorScheme = raw.defaultColorScheme === 'dark' ? 'dark' : 'light'
  const surfaceStyle = VALID_SURFACE_STYLES.has(raw.surfaceStyle)
    ? raw.surfaceStyle
    : DEFAULT_STOREFRONT_THEME.surfaceStyle
  const cardRadius = VALID_CARD_RADII.has(raw.cardRadius)
    ? raw.cardRadius
    : DEFAULT_STOREFRONT_THEME.cardRadius
  const seasonalEffect = VALID_SEASONAL_EFFECTS.has(raw.seasonalEffect)
    ? raw.seasonalEffect
    : DEFAULT_STOREFRONT_THEME.seasonalEffect
  const introSplashMode = VALID_INTRO_SPLASH_MODES.has(raw.introSplashMode)
    ? raw.introSplashMode
    : DEFAULT_STOREFRONT_THEME.introSplashMode
  const introEvent = VALID_INTRO_EVENTS.has(raw.introEvent)
    ? raw.introEvent
    : DEFAULT_STOREFRONT_THEME.introEvent
  const introBg = VALID_INTRO_BGS.has(raw.introBg)
    ? raw.introBg
    : DEFAULT_STOREFRONT_THEME.introBg
  const introEffect = VALID_INTRO_EFFECTS.has(raw.introEffect)
    ? raw.introEffect
    : DEFAULT_STOREFRONT_THEME.introEffect
  const introTransition = VALID_INTRO_TRANSITIONS.has(raw.introTransition)
    ? raw.introTransition
    : DEFAULT_STOREFRONT_THEME.introTransition
  const introCustomTitle = String(raw.introCustomTitle ?? '').trim().slice(0, 60)
  const introCustomSubtitle = String(raw.introCustomSubtitle ?? '').trim().slice(0, 90)
  const updatedAt = Number.isFinite(Number(raw.updatedAt)) ? Number(raw.updatedAt) : 0

  return {
    mode,
    presetId,
    primaryColor,
    secondaryColor,
    defaultColorScheme,
    surfaceStyle,
    cardRadius,
    seasonalEffect,
    introSplashMode,
    introEvent,
    introBg,
    introEffect,
    introTransition,
    introCustomTitle,
    introCustomSubtitle,
    updatedAt,
  }
}

/* =========================================================
 * COLOR MATH HELPERS (ZERO DEPENDENCY)
 * ========================================================= */
export function hexToRgb(hex) {
  const clean = sanitizeHexColor(hex, '#059669').slice(1)
  return {
    r: parseInt(clean.slice(0, 2), 16),
    g: parseInt(clean.slice(2, 4), 16),
    b: parseInt(clean.slice(4, 6), 16),
  }
}

export function rgbToHex({ r, g, b }) {
  const clamp = (v) => Math.max(0, Math.min(255, Math.round(v)))
  return (
    '#' +
    [clamp(r), clamp(g), clamp(b)]
      .map((v) => v.toString(16).padStart(2, '0'))
      .join('')
  )
}

export function rgbToHsl({ r, g, b }) {
  const rn = r / 255
  const gn = g / 255
  const bn = b / 255
  const max = Math.max(rn, gn, bn)
  const min = Math.min(rn, gn, bn)
  const l = (max + min) / 2
  let h = 0
  let s = 0
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case rn:
        h = (gn - bn) / d + (gn < bn ? 6 : 0)
        break
      case gn:
        h = (bn - rn) / d + 2
        break
      case bn:
        h = (rn - gn) / d + 4
        break
    }
    h /= 6
  }
  return { h: h * 360, s: s * 100, l: l * 100 }
}

export function hslToRgb({ h, s, l }) {
  const hn = ((h % 360) + 360) % 360 / 360
  const sn = Math.max(0, Math.min(100, s)) / 100
  const ln = Math.max(0, Math.min(100, l)) / 100
  if (sn === 0) {
    const v = Math.round(ln * 255)
    return { r: v, g: v, b: v }
  }
  const q = ln < 0.5 ? ln * (1 + sn) : ln + sn - ln * sn
  const p = 2 * ln - q
  const hue2rgb = (t) => {
    let tt = t
    if (tt < 0) tt += 1
    if (tt > 1) tt -= 1
    if (tt < 1 / 6) return p + (q - p) * 6 * tt
    if (tt < 1 / 2) return q
    if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6
    return p
  }
  return {
    r: Math.round(hue2rgb(hn + 1 / 3) * 255),
    g: Math.round(hue2rgb(hn) * 255),
    b: Math.round(hue2rgb(hn - 1 / 3) * 255),
  }
}

export function mixHex(hexA, hexB, weightB = 0.5) {
  const a = hexToRgb(hexA)
  const b = hexToRgb(hexB)
  const w = Math.max(0, Math.min(1, weightB))
  return rgbToHex({
    r: a.r * (1 - w) + b.r * w,
    g: a.g * (1 - w) + b.g * w,
    b: a.b * (1 - w) + b.b * w,
  })
}

export function shiftLightness(hex, deltaL, deltaS = 0) {
  const hsl = rgbToHsl(hexToRgb(hex))
  return rgbToHex(
    hslToRgb({
      h: hsl.h,
      s: Math.max(0, Math.min(100, hsl.s + deltaS)),
      l: Math.max(4, Math.min(97, hsl.l + deltaL)),
    }),
  )
}

export function getRelativeLuminance(hex) {
  const { r, g, b } = hexToRgb(hex)
  const toLinear = (c) => {
    const v = c / 255
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
  }
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b)
}

export function getReadableTextColor(bgHex, darkColor = '#0f172a', lightColor = '#ffffff') {
  const lum = getRelativeLuminance(bgHex)
  return lum > 0.44 ? darkColor : lightColor
}

function rgbTriplet(hex) {
  const { r, g, b } = hexToRgb(hex)
  return `${r}, ${g}, ${b}`
}

/**
 * Generates all CSS custom properties for MenuOnline.vue (and Admin Live Preview).
 */
export function buildStorefrontThemeVars(rawConfig, colorScheme = 'light') {
  const cfg = normalizeThemeConfig(rawConfig)
  const isDark = colorScheme === 'dark'
  const basePrimary = cfg.primaryColor
  const baseSecondary = cfg.secondaryColor

  const pHsl = rgbToHsl(hexToRgb(basePrimary))
  const isLowSatDark = pHsl.s < 24 && pHsl.l < 30 // e.g., Obsidian Slate (#1e293b)

  // Primary scale
  const primaryHover = isLowSatDark ? '#0f172a' : mixHex(basePrimary, '#000000', 0.16)
  const primaryDark = isLowSatDark ? '#0f172a' : mixHex(basePrimary, '#000000', 0.28)
  const primaryDeep = isLowSatDark ? '#020617' : mixHex(basePrimary, '#000000', 0.48)
  const primaryDeepest = isLowSatDark ? '#020617' : mixHex(basePrimary, '#000000', 0.64)
  const primaryBright = isLowSatDark
    ? mixHex(baseSecondary, '#ffffff', 0.12)
    : shiftLightness(basePrimary, 10, 4)
  const primaryLight = isLowSatDark
    ? shiftLightness(baseSecondary, 14, 0)
    : shiftLightness(basePrimary, 22, 2)
  const primaryPastel = mixHex(basePrimary, '#ffffff', 0.78)
  const primarySoftLight = mixHex(basePrimary, '#ffffff', 0.91)
  const primarySoftTint = mixHex(basePrimary, '#ffffff', 0.95)

  // Dark-mode legible accent (if primary is very dark like obsidian/navy, brighten for dark surfaces)
  const darkAccent = isLowSatDark
    ? baseSecondary
    : pHsl.l < 38
      ? shiftLightness(basePrimary, 22, 6)
      : shiftLightness(basePrimary, 10, 4)
  const darkPrice = isLowSatDark
    ? shiftLightness(baseSecondary, 12, 0)
    : shiftLightness(darkAccent, 14, 2)
  const darkBorderRgb = rgbTriplet(darkPrice)

  // Secondary (accent / yellow replacement) scale
  const secBright = shiftLightness(baseSecondary, 10, 0)
  const secLight = mixHex(baseSecondary, '#ffffff', 0.45)
  const secSoftLight = mixHex(baseSecondary, '#ffffff', 0.88)
  const secMid = mixHex(baseSecondary, '#000000', 0.12)
  const secDark = mixHex(baseSecondary, '#000000', 0.34)
  const secDeep = mixHex(baseSecondary, '#000000', 0.5)

  // Contrast text colors
  const onPrimary = getReadableTextColor(basePrimary, '#0f172a', '#ffffff')
  const onPrimaryMuted =
    onPrimary === '#ffffff' ? 'rgba(255, 255, 255, 0.86)' : 'rgba(15, 23, 42, 0.78)'
  const onSecondary = getReadableTextColor(baseSecondary, '#0f172a', '#ffffff')

  // Surface style (page background feel)
  let bgLight = '#f6f8fa'
  let surface2Light = '#f1f5f9'
  let toolbarBgLight = 'rgba(246, 248, 250, 0.94)'
  let bgDark = '#0b0f17'
  let surfaceDark = '#131a26'
  let surface2Dark = '#1c2536'
  let toolbarBgDark = 'rgba(11, 15, 23, 0.94)'

  if (cfg.surfaceStyle === 'tinted') {
    bgLight = mixHex(basePrimary, '#ffffff', 0.955)
    surface2Light = mixHex(basePrimary, '#ffffff', 0.91)
    const { r, g, b } = hexToRgb(bgLight)
    toolbarBgLight = `rgba(${r}, ${g}, ${b}, 0.94)`
    bgDark = mixHex(basePrimary, '#090d14', 0.92)
    surfaceDark = mixHex(basePrimary, '#111824', 0.92)
    surface2Dark = mixHex(basePrimary, '#1a2333', 0.9)
    const dRgb = hexToRgb(bgDark)
    toolbarBgDark = `rgba(${dRgb.r}, ${dRgb.g}, ${dRgb.b}, 0.94)`
  } else if (cfg.surfaceStyle === 'warm') {
    bgLight = '#faf7f2'
    surface2Light = '#f3ede2'
    toolbarBgLight = 'rgba(250, 247, 242, 0.94)'
    bgDark = '#110f0d'
    surfaceDark = '#1b1815'
    surface2Dark = '#26211d'
    toolbarBgDark = 'rgba(17, 15, 13, 0.94)'
  }

  // Radius tokens
  const radiusOpt =
    CARD_RADIUS_OPTIONS.find((r) => r.id === cfg.cardRadius) || CARD_RADIUS_OPTIONS[1]

  // Top header gradient
  const topHeaderLight = `linear-gradient(135deg, ${basePrimary} 0%, ${primaryHover} 58%, ${primaryDark} 100%)`
  const topHeaderDark = isLowSatDark
    ? 'linear-gradient(135deg, #1e293b 0%, #0f172a 55%, #020617 100%)'
    : `linear-gradient(135deg, ${primaryDark} 0%, ${primaryDeep} 55%, ${primaryDeepest} 100%)`

  const primaryRgb = rgbTriplet(basePrimary)
  const primaryBrightRgb = rgbTriplet(primaryBright)
  const primaryDarkRgb = rgbTriplet(primaryHover)
  const primaryDeepRgb = rgbTriplet(primaryDeep)
  const secondaryRgb = rgbTriplet(baseSecondary)
  const secondaryMidRgb = rgbTriplet(secMid)
  const secondaryDarkRgb = rgbTriplet(secDark)
  const secondaryLightRgb = rgbTriplet(secLight)

  // Effective accent for active light/dark state
  const activeAccent = isDark ? darkAccent : basePrimary
  const activeAccentHover = isDark ? basePrimary : primaryHover
  const activePrice = isDark ? darkPrice : isLowSatDark ? secDark : basePrimary

  return {
    // === BRAND PRIMARY SCALE ===
    '--sa-primary': basePrimary,
    '--sa-primary-hover': primaryHover,
    '--sa-primary-dark': primaryDark,
    '--sa-primary-deep': primaryDeep,
    '--sa-primary-deepest': primaryDeepest,
    '--sa-primary-bright': primaryBright,
    '--sa-primary-light': primaryLight,
    '--sa-primary-pastel': primaryPastel,
    '--sa-primary-soft': isDark ? `rgba(${primaryBrightRgb}, 0.14)` : primarySoftLight,
    '--sa-primary-soft-2': isDark ? `rgba(${primaryBrightRgb}, 0.2)` : primarySoftTint,
    '--sa-primary-rgb': isDark && isLowSatDark ? secondaryRgb : primaryRgb,
    '--sa-primary-bright-rgb': isDark && isLowSatDark ? secondaryRgb : primaryBrightRgb,
    '--sa-primary-dark-rgb': primaryDarkRgb,
    '--sa-primary-deep-rgb': primaryDeepRgb,
    '--sa-on-primary': onPrimary,
    '--sa-on-primary-muted': onPrimaryMuted,

    // === BRAND SECONDARY (ACCENT / YELLOW) SCALE ===
    '--sa-secondary': baseSecondary,
    '--sa-secondary-bright': secBright,
    '--sa-secondary-light': secLight,
    '--sa-secondary-soft': isDark ? `rgba(${secondaryMidRgb}, 0.16)` : secSoftLight,
    '--sa-secondary-mid': secMid,
    '--sa-secondary-dark': secDark,
    '--sa-secondary-deep': secDeep,
    '--sa-secondary-rgb': secondaryRgb,
    '--sa-secondary-mid-rgb': secondaryMidRgb,
    '--sa-secondary-dark-rgb': secondaryDarkRgb,
    '--sa-secondary-light-rgb': secondaryLightRgb,
    '--sa-on-secondary': onSecondary,

    // === CORE STOREFRONT TOKENS (EXISTING + EXTENDED) ===
    '--sa-bg': isDark ? bgDark : bgLight,
    '--sa-main-bg': isDark ? bgDark : bgLight,
    '--sa-top-header-bg': isDark ? topHeaderDark : topHeaderLight,
    '--sa-header-bg': isDark ? 'rgba(15, 21, 33, 0.94)' : 'rgba(255, 255, 255, 0.94)',
    '--sa-bottom-bar-bg': isDark ? 'rgba(19, 26, 38, 0.94)' : 'rgba(255, 255, 255, 0.94)',
    '--sa-toolbar-bg': isDark ? toolbarBgDark : toolbarBgLight,
    '--sa-surface': isDark ? surfaceDark : '#ffffff',
    '--sa-surface-2': isDark ? surface2Dark : surface2Light,
    '--sa-surface-soft': isDark ? `rgba(${primaryBrightRgb}, 0.14)` : primarySoftLight,
    '--sa-img-bg': isDark ? '#172030' : '#f8fafc',
    '--sa-border-green': isDark
      ? `rgba(${darkBorderRgb}, 0.28)`
      : `rgba(${primaryBrightRgb}, 0.28)`,
    '--sa-accent': activeAccent,
    '--sa-accent-hover': activeAccentHover,
    '--sa-price': activePrice,
    '--sa-card-hover-shadow': isDark
      ? `0 16px 36px rgba(0, 0, 0, 0.65), 0 4px 14px rgba(${primaryBrightRgb}, 0.2)`
      : `0 14px 30px rgba(15, 23, 42, 0.16), 0 4px 10px rgba(${primaryRgb}, 0.16)`,
    '--sa-notice-bg': isDark
      ? `linear-gradient(90deg, rgba(${primaryDeepRgb}, 0.46) 0%, rgba(${primaryDarkRgb}, 0.26) 65%, rgba(${secondaryMidRgb}, 0.14) 100%)`
      : `linear-gradient(90deg, ${primarySoftLight} 0%, ${primarySoftTint} 58%, ${secSoftLight} 100%)`,
    '--sa-notice-border': isDark
      ? `rgba(${darkBorderRgb}, 0.32)`
      : `rgba(${primaryRgb}, 0.28)`,
    '--sa-notice-text': isDark ? primarySoftLight : primaryDeep,
    '--sa-notice-icon': isDark ? primaryDeepest : primaryDark,

    // === SHAPE / RADIUS TOKENS ===
    '--sa-radius-card': radiusOpt.card,
    '--sa-radius-btn': radiusOpt.btn,
    '--sa-radius-sm': radiusOpt.sm,
    '--sa-radius-panel': radiusOpt.panel,
  }
}

export function getStorefrontMetaThemeColor(rawConfig, colorScheme = 'light') {
  const cfg = normalizeThemeConfig(rawConfig)
  if (colorScheme === 'dark') {
    return mixHex(cfg.primaryColor, '#000000', 0.35)
  }
  return cfg.primaryColor
}

/* =========================================================
 * LOCAL STORAGE CACHE (ANTI-FLASH / INSTANT LOAD)
 * ========================================================= */
export function loadCachedStorefrontTheme() {
  if (typeof window === 'undefined') return { ...DEFAULT_STOREFRONT_THEME }
  try {
    const raw = localStorage.getItem(STOREFRONT_THEME_CACHE_KEY)
    if (!raw) return { ...DEFAULT_STOREFRONT_THEME }
    return normalizeThemeConfig(JSON.parse(raw))
  } catch {
    return { ...DEFAULT_STOREFRONT_THEME }
  }
}

export function saveCachedStorefrontTheme(config) {
  if (typeof window === 'undefined') return
  try {
    const normalized = normalizeThemeConfig(config)
    const palette = resolveIntroSplashPalette(
      normalized.introBg,
      normalized.primaryColor,
      normalized.secondaryColor,
    )
    localStorage.setItem(
      STOREFRONT_THEME_CACHE_KEY,
      JSON.stringify({
        ...normalized,
        introLoaderBg: palette.loaderBg,
      }),
    )
  } catch {}
}

/* =========================================================
 * ROOT DOM APPLICATOR (FOR TELEPORTED MODALS + META TAG)
 * ========================================================= */
let appliedRootVarKeys = []
let prevMetaThemeColor = null
let createdMetaThemeColor = false

export function applyStorefrontThemeToRoot(vars, metaColor) {
  if (typeof document === 'undefined' || !vars) return
  const rootStyle = document.documentElement.style
  const keys = Object.keys(vars)
  for (const k of keys) {
    rootStyle.setProperty(k, vars[k])
  }
  appliedRootVarKeys = keys

  if (metaColor) {
    let meta = document.querySelector('meta[name="theme-color"]')
    if (!meta) {
      meta = document.createElement('meta')
      meta.setAttribute('name', 'theme-color')
      document.head.appendChild(meta)
      createdMetaThemeColor = true
    } else if (prevMetaThemeColor === null && !createdMetaThemeColor) {
      prevMetaThemeColor = meta.getAttribute('content')
    }
    meta.setAttribute('content', metaColor)
  }
}

export function clearStorefrontThemeFromRoot() {
  if (typeof document === 'undefined') return
  const rootStyle = document.documentElement.style
  for (const k of appliedRootVarKeys) {
    rootStyle.removeProperty(k)
  }
  appliedRootVarKeys = []

  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) {
    if (createdMetaThemeColor) {
      meta.remove()
    } else if (prevMetaThemeColor !== null) {
      meta.setAttribute('content', prevMetaThemeColor)
    }
  }
  prevMetaThemeColor = null
  createdMetaThemeColor = false
}
