// src/utils/partnerColor.js

export const DEFAULT_PARTNER_TONES = ['#0d9488', '#0284c7', '#6d28d9', '#059669']

export const PARTNER_COLOR_PRESETS = [
  { label: 'Xanh Ngọc', hex: '#0d9488' },
  { label: 'Xanh Lá', hex: '#059669' },
  { label: 'Xanh Biển', hex: '#0284c7' },
  { label: 'Xanh Dương', hex: '#2563eb' },
  { label: 'Tím Indigo', hex: '#4f46e5' },
  { label: 'Tím Violet', hex: '#7c3aed' },
  { label: 'Cam Nổi Bật', hex: '#ea580c' },
  { label: 'Vàng Hổ Phách', hex: '#d97706' },
  { label: 'Hồng Ruby', hex: '#e11d48' },
  { label: 'Đỏ Đậm', hex: '#dc2626' },
  { label: 'Nâu Cafe', hex: '#78350f' },
  { label: 'Xanh Than', hex: '#1e293b' },
]

export function normalizePartnerHexColor(raw) {
  const str = String(raw ?? '').trim()
  if (!str) return ''
  const cleaned = str.startsWith('#') ? str.slice(1) : str
  if (/^[0-9a-fA-F]{3}$/.test(cleaned)) {
    const expanded = cleaned
      .split('')
      .map((ch) => ch + ch)
      .join('')
      .toLowerCase()
    return `#${expanded}`
  }
  if (/^[0-9a-fA-F]{6}$/.test(cleaned)) {
    return `#${cleaned.toLowerCase()}`
  }
  return ''
}

export function resolvePartnerBaseColor(rawColor, fallbackIndex = 0) {
  const normalized = normalizePartnerHexColor(rawColor)
  if (normalized) return normalized
  const safeIdx = Math.abs(Number(fallbackIndex) || 0) % DEFAULT_PARTNER_TONES.length
  return DEFAULT_PARTNER_TONES[safeIdx]
}

function hexToRgb(hex) {
  const clean = normalizePartnerHexColor(hex).slice(1) || '0d9488'
  const num = parseInt(clean, 16)
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  }
}

function rgbToHex(r, g, b) {
  const clamp = (v) => Math.max(0, Math.min(255, Math.round(v)))
  return (
    '#' +
    [clamp(r), clamp(g), clamp(b)]
      .map((v) => v.toString(16).padStart(2, '0'))
      .join('')
  )
}

function mixHex(hexA, hexB, weightB = 0.5) {
  const a = hexToRgb(hexA)
  const b = hexToRgb(hexB)
  const w = Math.max(0, Math.min(1, weightB))
  return rgbToHex(
    a.r * (1 - w) + b.r * w,
    a.g * (1 - w) + b.g * w,
    a.b * (1 - w) + b.b * w,
  )
}

export function getPartnerCardStyle(rawColor, fallbackIndex = 0) {
  const baseHex = resolvePartnerBaseColor(rawColor, fallbackIndex)
  const { r, g, b } = hexToRgb(baseHex)
  const perceivedBrightness = 0.299 * r + 0.587 * g + 0.114 * b
  const isLightBg = perceivedBrightness >= 182

  if (isLightBg) {
    const endHex = mixHex(baseHex, '#0f172a', 0.08)
    const borderHex = mixHex(baseHex, '#0f172a', 0.2)
    const icoHex = mixHex(baseHex, '#0f172a', 0.55)
    return {
      background: `linear-gradient(135deg, ${baseHex} 0%, ${endHex} 100%)`,
      borderColor: borderHex,
      boxShadow: `0 6px 18px rgba(${r}, ${g}, ${b}, 0.28)`,
      color: '#0f172a',
      '--pt-fg': '#0f172a',
      '--pt-sub': 'rgba(15, 23, 42, 0.74)',
      '--pt-border': borderHex,
      '--pt-ext-bg': 'rgba(15, 23, 42, 0.09)',
      '--pt-ext-border': 'rgba(15, 23, 42, 0.18)',
      '--pt-ico': icoHex,
      '--pt-base': baseHex,
    }
  }

  const startHex = mixHex(baseHex, '#020617', 0.2)
  const endHex = mixHex(baseHex, '#ffffff', 0.1)

  return {
    background: `linear-gradient(135deg, ${startHex} 0%, ${baseHex} 55%, ${endHex} 100%)`,
    borderColor: 'rgba(255, 255, 255, 0.28)',
    boxShadow: `0 8px 20px rgba(${r}, ${g}, ${b}, 0.28)`,
    color: '#ffffff',
    '--pt-fg': '#ffffff',
    '--pt-sub': 'rgba(255, 255, 255, 0.88)',
    '--pt-border': 'rgba(255, 255, 255, 0.28)',
    '--pt-ext-bg': 'rgba(255, 255, 255, 0.2)',
    '--pt-ext-border': 'rgba(255, 255, 255, 0.35)',
    '--pt-ico': baseHex,
    '--pt-base': baseHex,
  }
}
