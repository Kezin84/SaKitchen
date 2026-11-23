// Shared banner click behavior & link helpers
// Used by src/config/api.js, src/views/Banner.vue, and src/views/MenuOnline.vue

export const BANNER_CLICK_ACTIONS = {
  POPUP: 'popup',
  LINK: 'link',
}

export const BANNER_PLACEMENTS = {
  HOME: 'home',
  FEED_VERTICAL: 'feed_vertical',
}

export const VERTICAL_BANNER_TARGETS = {
  BOTH: 'both',
  ORDER: 'order',
  FEED: 'feed',
}

export function normalizeBannerPlacement(raw) {
  const val = String(raw ?? '').trim().toLowerCase()
  return val === BANNER_PLACEMENTS.FEED_VERTICAL
    ? BANNER_PLACEMENTS.FEED_VERTICAL
    : BANNER_PLACEMENTS.HOME
}

export function normalizeVerticalBannerTarget(raw) {
  const val = String(raw ?? '').trim().toLowerCase()
  if (val === VERTICAL_BANNER_TARGETS.ORDER) return VERTICAL_BANNER_TARGETS.ORDER
  if (val === VERTICAL_BANNER_TARGETS.FEED) return VERTICAL_BANNER_TARGETS.FEED
  return VERTICAL_BANNER_TARGETS.BOTH
}

export function isHomeBanner(banner) {
  return Boolean(banner) && normalizeBannerPlacement(banner.Placement) === BANNER_PLACEMENTS.HOME
}

export function isFeedVerticalBanner(banner) {
  return (
    Boolean(banner) &&
    normalizeBannerPlacement(banner.Placement) === BANNER_PLACEMENTS.FEED_VERTICAL
  )
}

export function isOrderVerticalBanner(banner) {
  if (!isFeedVerticalBanner(banner)) return false
  const target = normalizeVerticalBannerTarget(banner.Target_pages)
  return target === VERTICAL_BANNER_TARGETS.BOTH || target === VERTICAL_BANNER_TARGETS.ORDER
}

export function isNewsFeedVerticalBanner(banner) {
  if (!isFeedVerticalBanner(banner)) return false
  const target = normalizeVerticalBannerTarget(banner.Target_pages)
  return target === VERTICAL_BANNER_TARGETS.BOTH || target === VERTICAL_BANNER_TARGETS.FEED
}

export function normalizeBannerAction(raw) {
  const val = String(raw ?? '').trim().toLowerCase()
  return val === BANNER_CLICK_ACTIONS.LINK
    ? BANNER_CLICK_ACTIONS.LINK
    : BANNER_CLICK_ACTIONS.POPUP
}

export function isBannerActive(banner) {
  if (!banner) return false
  if (banner.Active === undefined || banner.Active === null || banner.Active === '') {
    return true
  }
  const val = banner.Active
  if (
    val === false ||
    val === 0 ||
    val === '0' ||
    String(val).trim().toLowerCase() === 'false'
  ) {
    return false
  }
  return true
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
