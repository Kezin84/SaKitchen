// Shared banner click behavior & link helpers
// Used by src/config/api.js, src/views/Banner.vue, and src/views/MenuOnline.vue

export const BANNER_CLICK_ACTIONS = {
  POPUP: 'popup',
  LINK: 'link',
}

export function normalizeBannerAction(raw) {
  const val = String(raw ?? '').trim().toLowerCase()
  return val === BANNER_CLICK_ACTIONS.LINK
    ? BANNER_CLICK_ACTIONS.LINK
    : BANNER_CLICK_ACTIONS.POPUP
}

export function normalizeBannerLink(raw) {
  const trimmed = String(raw ?? '').trim()
  if (!trimmed) return ''

  // Strip control characters and reject unsafe schemes
  const compact = trimmed.replace(/[\u0000-\u001F\u007F\s]+/g, '')
  if (/^(javascript|data|vbscript):/i.test(compact)) {
    return ''
  }

  let candidate = trimmed
  const hasExplicitScheme = /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(candidate)
  const isRootRelative = candidate.startsWith('/') && !candidate.startsWith('//')

  if (!hasExplicitScheme && !isRootRelative) {
    if (candidate.startsWith('//')) {
      candidate = `https:${candidate}`
    } else if (/^[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)+([/:?#].*)?$/.test(candidate)) {
      candidate = `https://${candidate}`
    } else {
      return ''
    }
  }

  try {
    const parsed = isRootRelative
      ? new URL(candidate, 'https://sakitchen.shop')
      : new URL(candidate)

    const protocol = parsed.protocol.toLowerCase()
    if (!['https:', 'http:', 'tel:', 'mailto:'].includes(protocol)) {
      return ''
    }

    if ((protocol === 'https:' || protocol === 'http:') && !isRootRelative) {
      if (!parsed.hostname || !parsed.hostname.includes('.')) {
        return ''
      }
    }

    return isRootRelative
      ? `${parsed.pathname}${parsed.search}${parsed.hash}`
      : parsed.toString()
  } catch {
    return ''
  }
}

export function isValidBannerLink(raw) {
  const trimmed = String(raw ?? '').trim()
  if (!trimmed) return false
  return Boolean(normalizeBannerLink(trimmed))
}

export function formatBannerLinkShort(rawUrl, maxLen = 40) {
  const normalized = normalizeBannerLink(rawUrl)
  if (!normalized) return ''
  const display = normalized
    .replace(/^https?:\/\//i, '')
    .replace(/^www\./i, '')
    .replace(/\/+$/, '')
  if (display.length <= maxLen) return display
  return `${display.slice(0, Math.max(12, maxLen - 1))}…`
}

export function openBannerLinkInNewTab(rawUrl) {
  const url = normalizeBannerLink(rawUrl)
  if (!url || typeof window === 'undefined' || typeof document === 'undefined') {
    return false
  }

  // Triggering a real <a> click synchronously inside the user gesture avoids
  // popup blockers on iOS Safari and in-app browsers (Telegram, Messenger, Zalo).
  try {
    const a = document.createElement('a')
    a.href = url
    a.target = '_blank'
    a.rel = 'noopener noreferrer'
    a.style.display = 'none'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    return true
  } catch {
    try {
      window.open(url, '_blank', 'noopener,noreferrer')
      return true
    } catch {
      return false
    }
  }
}
