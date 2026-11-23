<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import {
  getOneSheet,
  subscribeSheet,
  incrementFeedPostView,
  toggleFeedPostReaction,
} from '@/config/api'
import { resolveBrandAssets } from '@/utils/brandAssets.js'
import { normalizeThemeConfig, buildStorefrontThemeVars } from '@/utils/storefrontTheme.js'
import { syncProductWithI18n } from '@/utils/i18nData.js'
import { slugifyVi } from '@/utils/blogSeo.js'
import {
  BANNER_CLICK_ACTIONS,
  isBannerActive,
  isNewsFeedVerticalBanner,
  normalizeBannerAction,
  normalizeBannerLink,
} from '@/utils/bannerLink.js'
import { getPartnerCardStyle } from '@/utils/partnerColor.js'
import { sanitizeFeedCaptionHtml, stripFeedCaptionToPlainText } from '@/utils/feedCaption.js'

const SA_THEME_MODE_KEY = 'SA_THEME_MODE'
const REACTION_STORAGE_KEY = 'SA_FEED_REACTIONS_V1'
const VIEWED_STORAGE_KEY = 'SA_FEED_VIEWED_V1'

const route = useRoute()
const router = useRouter()
const { t, locale } = useI18n()

const loading = ref(true)
const rawPosts = ref([])
const rawProducts = ref([])
const rawPartners = ref([])
const rawBanners = ref([])
const brand = ref(resolveBrandAssets(null, 'SA KITCHEN'))
const themeConfig = ref(normalizeThemeConfig(null))
const themeMode = ref('light')

const activeTab = ref('all')
const searchQuery = ref('')
const userReactions = ref({})
const shareToast = ref('')
let shareToastTimer = null

/* ACTIVE POST DETAIL SYNCED WITH /bang-tin/:postId */
const activeDetailImgIdx = ref(0)

const routePostId = computed(() => {
  const fromParam = String(route.params.postId || '').trim()
  if (fromParam) return fromParam
  return String(route.query.post || '').trim()
})

/* FULLSCREEN ZOOM LIGHTBOX (SECONDARY ZOOM FROM DETAIL OR VERTICAL AD POPUP) */
const lightbox = ref({
  open: false,
  images: [],
  index: 0,
  linkUrl: '',
})

/* CART COUNT FROM LOCALSTORAGE */
const savedCartCount = ref(0)

function readSavedCartCount() {
  try {
    const rawLines = localStorage.getItem('CART_SA_LINES_V2')
    if (rawLines) {
      const parsed = JSON.parse(rawLines)
      if (parsed && typeof parsed === 'object') {
        const sum = Object.values(parsed).reduce(
          (acc, line) => acc + Math.max(0, Number(line?.qty || 0)),
          0,
        )
        savedCartCount.value = sum
        return
      }
    }
  } catch {}
  savedCartCount.value = 0
}

const currentLang = computed(() => {
  try {
    const saved = localStorage.getItem('APP_LANG')
    if (saved) return saved
  } catch {}
  return String(locale.value || 'vi')
})

const menuBackLink = computed(() => `/${currentLang.value}`)

const themeVars = computed(() => buildStorefrontThemeVars(themeConfig.value, themeMode.value))

function initThemeMode() {
  try {
    const saved = localStorage.getItem(SA_THEME_MODE_KEY)
    if (saved === 'dark' || saved === 'light') {
      themeMode.value = saved
      return
    }
  } catch {}
  themeMode.value = themeConfig.value.defaultColorScheme || 'light'
}

function toggleThemeMode() {
  themeMode.value = themeMode.value === 'dark' ? 'light' : 'dark'
  try {
    localStorage.setItem(SA_THEME_MODE_KEY, themeMode.value)
  } catch {}
}

function loadReactionMemory() {
  try {
    const raw = localStorage.getItem(REACTION_STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed && typeof parsed === 'object') {
        userReactions.value = parsed
      }
    }
  } catch {}
}

function saveReactionMemory() {
  try {
    localStorage.setItem(REACTION_STORAGE_KEY, JSON.stringify(userReactions.value))
  } catch {}
}

function isActiveRow(val) {
  if (val === false || val === 0 || val === '0' || String(val).toLowerCase() === 'false') return false
  return true
}

const localizedProductsMap = computed(() => {
  const lang = String(locale.value || 'vi')
  const map = new Map()
  for (const p of rawProducts.value) {
    if (!p?.Ma_hang) continue
    const localized = syncProductWithI18n(p, lang)
    map.set(String(p.Ma_hang).trim(), localized)
  }
  return map
})

const sidebarDishes = computed(() => {
  const lang = String(locale.value || 'vi')
  return rawProducts.value
    .filter((p) => p?.Ma_hang && p.Trang_thai !== 'Hết hàng' && p.Main_img)
    .slice(0, 5)
    .map((p) => syncProductWithI18n(p, lang))
})

const activePartners = computed(() => {
  return (rawPartners.value || [])
    .map((p, idx) => ({ p, idx }))
    .filter(
      ({ p }) =>
        p &&
        isActiveRow(p.Active) &&
        String(p.Name || '').trim() &&
        normalizeBannerLink(p.Direct_link),
    )
    .sort((a, b) => {
      const oa = Number.isFinite(Number(a.p.Sort_order)) ? Number(a.p.Sort_order) : 9999 + a.idx
      const ob = Number.isFinite(Number(b.p.Sort_order)) ? Number(b.p.Sort_order) : 9999 + b.idx
      return oa !== ob ? oa - ob : a.idx - b.idx
    })
    .map(({ p }) => ({
      ...p,
      normalizedUrl: normalizeBannerLink(p.Direct_link),
    }))
})

function parseBannerOrder(item) {
  const n = Number(item?.Thu_tu)
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : Number.MAX_SAFE_INTEGER
}

const activeVerticalBanners = computed(() => {
  return (rawBanners.value || [])
    .filter((b) => Boolean(b?.URL) && isNewsFeedVerticalBanner(b) && isBannerActive(b))
    .sort((a, b) => {
      const orderDiff = parseBannerOrder(a) - parseBannerOrder(b)
      if (orderDiff !== 0) return orderDiff
      return String(b.ID).localeCompare(String(a.ID))
    })
    .map((b) => ({
      ...b,
      action: normalizeBannerAction(b.Click_action),
      normalizedLink: normalizeBannerLink(b.Link_url),
      cleanTitle: String(b.Title || '').trim(),
    }))
})

const hasLeftSidebar = computed(
  () => activePartners.value.length > 0 || activeVerticalBanners.value.length > 0,
)

/* DIGITAL STANDEE AUTO-SLIDE FOR LEFT SIDEBAR VERTICAL ADS */
const currentFeedAdIdx = ref(0)
const feedAdPaused = ref(false)
let feedAdTimer = null
const FEED_AD_INTERVAL = 4500

const activeFeedVertAd = computed(() => {
  const list = activeVerticalBanners.value
  if (!list.length) return null
  const idx = Math.min(Math.max(currentFeedAdIdx.value, 0), list.length - 1)
  return list[idx] || list[0]
})

const leftSidebarReservedPx = computed(() => {
  const pCount = activePartners.value.length
  const partnerH = pCount > 0 ? 52 + pCount * 54 : 0
  const hasCap = Boolean(activeFeedVertAd.value?.cleanTitle)
  const adChrome = 32 + (hasCap ? 38 : 0) + (activeVerticalBanners.value.length > 1 ? 30 : 0)
  return partnerH + adChrome
})

function stopFeedAdAuto() {
  if (feedAdTimer) {
    clearTimeout(feedAdTimer)
    feedAdTimer = null
  }
}

function startFeedAdAuto() {
  stopFeedAdAuto()
  if (activeVerticalBanners.value.length <= 1 || feedAdPaused.value) return
  feedAdTimer = setTimeout(() => {
    currentFeedAdIdx.value = (currentFeedAdIdx.value + 1) % activeVerticalBanners.value.length
    startFeedAdAuto()
  }, FEED_AD_INTERVAL)
}

function stepFeedVertAd(delta) {
  const total = activeVerticalBanners.value.length
  if (total <= 1) return
  currentFeedAdIdx.value = (currentFeedAdIdx.value + delta + total) % total
  startFeedAdAuto()
}

function goToFeedVertAd(idx) {
  if (idx < 0 || idx >= activeVerticalBanners.value.length) return
  currentFeedAdIdx.value = idx
  startFeedAdAuto()
}

watch(
  activeVerticalBanners,
  () => {
    if (currentFeedAdIdx.value >= activeVerticalBanners.value.length) {
      currentFeedAdIdx.value = 0
    }
    startFeedAdAuto()
  },
  { immediate: true },
)

const checkScamItems = computed(() => [
  {
    key: 'verify',
    url: 'https://checkscam8888.vercel.app/',
    title: t('contact.checkScamVerify'),
    sub: t('contact.checkScamVerifySub'),
    icon: 'ri-shield-check-fill',
    variant: 'is-verify',
  },
  {
    key: 'shops',
    url: 'https://checkscam8888.vercel.app/shops',
    title: t('contact.checkScamShops'),
    sub: t('contact.checkScamShopsSub'),
    icon: 'ri-store-2-fill',
    variant: 'is-shops',
  },
  {
    key: 'alerts',
    url: 'https://checkscam8888.vercel.app/alerts',
    title: t('contact.checkScamAlerts'),
    sub: t('contact.checkScamAlertsSub'),
    icon: 'ri-alarm-warning-fill',
    variant: 'is-alerts',
  },
])

const visiblePosts = computed(() => {
  return (rawPosts.value || [])
    .filter(
      (p) =>
        p &&
        isActiveRow(p.Active) &&
        (stripFeedCaptionToPlainText(p.Content) || (Array.isArray(p.Images) && p.Images.length)),
    )
    .sort((a, b) => {
      const pinA = a.Pinned ? 1 : 0
      const pinB = b.Pinned ? 1 : 0
      if (pinA !== pinB) return pinB - pinA
      return Number(b.Created_at || 0) - Number(a.Created_at || 0)
    })
})

const activeDetailPost = computed(() => {
  if (!routePostId.value) return null
  return visiblePosts.value.find((p) => String(p.ID).trim() === routePostId.value) || null
})

const filteredPosts = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  return visiblePosts.value.filter((p) => {
    if (activeTab.value !== 'all' && (p.Post_type || 'feedback') !== activeTab.value) return false
    if (!q) return true
    const caption = stripFeedCaptionToPlainText(p.Content).toLowerCase()
    const dishNames = (Array.isArray(p.Product_codes) ? p.Product_codes : [])
      .map((code) => String(localizedProductsMap.value.get(code)?.Ten_hang || '').toLowerCase())
      .join(' ')
    return caption.includes(q) || dishNames.includes(q)
  })
})

function totalViews(p) {
  return Math.max(0, Number(p?.Base_views || 0)) + Math.max(0, Number(p?.Views || 0))
}

const REACTION_DEFS = [
  {
    key: 'like',
    field: 'Like_count',
    icon: 'ri-thumb-up-fill',
    labelKey: 'feed.reactLike',
    tone: 'is-like',
  },
  {
    key: 'heart',
    field: 'Heart_count',
    icon: 'ri-heart-3-fill',
    labelKey: 'feed.reactHeart',
    tone: 'is-heart',
  },
  {
    key: 'haha',
    field: 'Haha_count',
    icon: 'ri-emotion-laugh-fill',
    labelKey: 'feed.reactHaha',
    tone: 'is-haha',
  },
  {
    key: 'wow',
    field: 'Wow_count',
    icon: 'ri-emotion-2-fill',
    labelKey: 'feed.reactWow',
    tone: 'is-wow',
  },
  {
    key: 'yummy',
    field: 'Yummy_count',
    icon: 'ri-fire-fill',
    labelKey: 'feed.reactYummy',
    tone: 'is-yummy',
  },
]

const REACTION_MAP = Object.fromEntries(REACTION_DEFS.map((r) => [r.key, r]))

function totalReactions(p) {
  if (!p) return 0
  return (
    Math.max(0, Number(p.Base_hearts || 0)) +
    Math.max(0, Number(p.Like_count || 0)) +
    Math.max(0, Number(p.Trust_count || 0)) +
    Math.max(0, Number(p.Heart_count || 0)) +
    Math.max(0, Number(p.Haha_count || 0)) +
    Math.max(0, Number(p.Wow_count || 0)) +
    Math.max(0, Number(p.Yummy_count || 0))
  )
}

function getTypeBadge(typeKey) {
  if (typeKey === 'kitchen') {
    return { label: t('feed.tabKitchen'), icon: 'ri-restaurant-2-fill', cls: 'is-kitchen' }
  }
  if (typeKey === 'promo') {
    return { label: t('feed.tabPromo'), icon: 'ri-megaphone-fill', cls: 'is-promo' }
  }
  return { label: t('feed.tabFeedback'), icon: 'ri-chat-smile-3-fill', cls: 'is-feedback' }
}

function formatRelativeTime(ts) {
  const num = Number(ts || 0)
  if (!num) return ''
  const diffSec = Math.max(0, Math.floor((Date.now() - num) / 1000))
  if (diffSec < 60) return t('feed.justNow')
  const mins = Math.floor(diffSec / 60)
  if (mins < 60) return t('feed.minsAgo', { n: mins })
  const hours = Math.floor(mins / 60)
  if (hours < 24) return t('feed.hoursAgo', { n: hours })
  const days = Math.floor(hours / 24)
  if (days <= 7) return t('feed.daysAgo', { n: days })
  return new Date(num).toLocaleDateString(locale.value || 'vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function isLongCaption(text) {
  const plain = stripFeedCaptionToPlainText(text)
  return plain.length > 210 || plain.split('\n').length > 4
}

function onCaptionClick(e) {
  const anchor = e.target?.closest?.('a')
  if (anchor) {
    e.stopPropagation()
  }
}

function getTaggedDishes(p) {
  if (!Array.isArray(p?.Product_codes)) return []
  return p.Product_codes.map((code) => localizedProductsMap.value.get(String(code).trim())).filter(
    Boolean,
  )
}

function formatDishPrice(dish) {
  if (!dish) return ''
  const sale = Number(dish.Gia_Giam || 0)
  const base = Number(dish.Gia_ban || 0)
  const finalVal = sale > 0 && sale < base ? sale : base
  const cur = String(dish.Don_vi_tien_te || 'P').trim()
  if (cur.toUpperCase() === 'VND' || cur === 'đ') return `${finalVal.toLocaleString('en-US')}đ`
  return `${finalVal.toLocaleString('en-US')} ${cur}`
}

function getDishOrderRoute(dish) {
  if (!dish?.Ma_hang) return menuBackLink.value
  const slug = slugifyVi(dish.Ten_hang || '') || 'mon'
  return `/${currentLang.value}/${slug}/${encodeURIComponent(dish.Ma_hang)}`
}

function ambientBgStyle(url) {
  const safe = String(url || '').replace(/"/g, '\\"')
  return safe ? { '--nf-ambient-img': `url("${safe}")` } : {}
}

/* POST DETAIL NAVIGATION (URL: /bang-tin/:postId) */
function recordPostViewOnce(postId) {
  if (!postId || hasViewedToday(postId)) return
  markViewedToday(postId)
  incrementFeedPostView(postId)
}

function openPostDetail(post, initialImgIndex = 0) {
  if (!post?.ID) return
  activeDetailImgIdx.value = Math.max(0, Number(initialImgIndex || 0))
  recordPostViewOnce(post.ID)
  const targetPath = `/bang-tin/${encodeURIComponent(post.ID)}`
  if (route.path !== targetPath) {
    router.push(targetPath)
  }
}

function closePostDetail() {
  if (routePostId.value) {
    router.push('/bang-tin')
  }
}

function stepDetailImage(delta) {
  const imgs = activeDetailPost.value?.Images
  if (!Array.isArray(imgs) || imgs.length <= 1) return
  const total = imgs.length
  activeDetailImgIdx.value = (activeDetailImgIdx.value + delta + total) % total
}

/* FACEBOOK-STYLE SINGLE LIKE + REACTION PICKER */
const openPickerKey = ref('')
let pickerEnterTimer = null
let pickerLeaveTimer = null
let touchHoldTimer = null
let touchHoldTriggered = false

function normalizeStoredReaction(entry) {
  if (!entry) return ''
  if (typeof entry === 'string') {
    if (entry === 'trust') return 'like'
    return REACTION_MAP[entry] ? entry : ''
  }
  if (typeof entry === 'object') {
    if (entry.like || entry.trust) return 'like'
    for (const def of REACTION_DEFS) {
      if (entry[def.key]) return def.key
    }
  }
  return ''
}

function getSelectedReactionKey(postId) {
  return normalizeStoredReaction(userReactions.value?.[postId])
}

function getSelectedReactionMeta(postId) {
  const key = getSelectedReactionKey(postId)
  return key ? REACTION_MAP[key] || null : null
}

function clearPickerTimers() {
  if (pickerEnterTimer) {
    clearTimeout(pickerEnterTimer)
    pickerEnterTimer = null
  }
  if (pickerLeaveTimer) {
    clearTimeout(pickerLeaveTimer)
    pickerLeaveTimer = null
  }
}

function onLikeWrapEnter(pickerKey) {
  if (typeof window !== 'undefined' && window.matchMedia?.('(hover: none)').matches) return
  clearPickerTimers()
  pickerEnterTimer = setTimeout(() => {
    openPickerKey.value = pickerKey
  }, 160)
}

function onLikeWrapLeave(pickerKey) {
  clearPickerTimers()
  pickerLeaveTimer = setTimeout(() => {
    if (openPickerKey.value === pickerKey) {
      openPickerKey.value = ''
    }
  }, 240)
}

function onLikeTouchStart(pickerKey) {
  touchHoldTriggered = false
  if (touchHoldTimer) clearTimeout(touchHoldTimer)
  touchHoldTimer = setTimeout(() => {
    touchHoldTriggered = true
    openPickerKey.value = pickerKey
  }, 280)
}

function onLikeTouchEnd() {
  if (touchHoldTimer) {
    clearTimeout(touchHoldTimer)
    touchHoldTimer = null
  }
}

function closeReactionPickerOnOutsideClick(e) {
  if (!openPickerKey.value) return
  if (!e.target?.closest?.('.nfp-like-wrap')) {
    openPickerKey.value = ''
  }
}

async function applyPostReaction(post, nextKey) {
  if (!post?.ID) return
  const prevRaw = userReactions.value?.[post.ID]
  const prevBackendKey =
    typeof prevRaw === 'object' && prevRaw?.trust && !prevRaw?.like
      ? 'trust'
      : getSelectedReactionKey(post.ID)
  const prevNormalized = getSelectedReactionKey(post.ID)

  const finalKey = prevNormalized === nextKey ? '' : nextKey
  openPickerKey.value = ''

  userReactions.value = {
    ...userReactions.value,
    [post.ID]: finalKey,
  }
  saveReactionMemory()

  const backendFieldMap = {
    like: 'Like_count',
    heart: 'Heart_count',
    haha: 'Haha_count',
    wow: 'Wow_count',
    yummy: 'Yummy_count',
    trust: 'Trust_count',
  }

  if (prevBackendKey && backendFieldMap[prevBackendKey]) {
    const prevField = backendFieldMap[prevBackendKey]
    post[prevField] = Math.max(0, Number(post[prevField] || 0) - 1)
    toggleFeedPostReaction(post.ID, prevBackendKey, -1)
  }

  if (finalKey && backendFieldMap[finalKey]) {
    const nextField = backendFieldMap[finalKey]
    post[nextField] = Math.max(0, Number(post[nextField] || 0) + 1)
    await toggleFeedPostReaction(post.ID, finalKey, 1)
  }
}

function onQuickLikeClick(post) {
  if (touchHoldTriggered) {
    touchHoldTriggered = false
    return
  }
  const current = getSelectedReactionKey(post?.ID)
  if (current) {
    applyPostReaction(post, current)
  } else {
    applyPostReaction(post, 'like')
  }
}

/* SHARE CLEAN POST URL (/bang-tin/:postId) */
async function sharePost(post) {
  if (!post?.ID) return
  const shareUrl = `${window.location.origin}/bang-tin/${encodeURIComponent(post.ID)}`
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(shareUrl)
    }
    shareToast.value = t('feed.copiedLink')
    if (shareToastTimer) clearTimeout(shareToastTimer)
    shareToastTimer = setTimeout(() => {
      shareToast.value = ''
    }, 2600)
  } catch {}
}

/* FULLSCREEN ZOOM LIGHTBOX */
function openLightbox(images, index = 0, linkUrl = '') {
  if (!Array.isArray(images) || !images.length) return
  lightbox.value = {
    open: true,
    images,
    index,
    linkUrl: normalizeBannerLink(linkUrl),
  }
}

function closeLightbox() {
  lightbox.value.open = false
  lightbox.value.linkUrl = ''
}

function stepLightbox(delta) {
  const total = lightbox.value.images.length
  if (!total) return
  lightbox.value.index = (lightbox.value.index + delta + total) % total
}

function onKeydown(e) {
  if (lightbox.value.open) {
    if (e.key === 'Escape') closeLightbox()
    else if (e.key === 'ArrowRight') stepLightbox(1)
    else if (e.key === 'ArrowLeft') stepLightbox(-1)
    return
  }

  if (activeDetailPost.value) {
    if (e.key === 'Escape') closePostDetail()
    else if (e.key === 'ArrowRight') stepDetailImage(1)
    else if (e.key === 'ArrowLeft') stepDetailImage(-1)
  }
}

/* INTERSECTION OBSERVER FOR AUTO VIEW COUNTING */
let viewObserver = null
const pendingViewTimers = new Map()
const cardElementsMap = new Map()

function hasViewedToday(postId) {
  try {
    const today = new Date().toISOString().slice(0, 10)
    const raw = localStorage.getItem(VIEWED_STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : {}
    return parsed?.[`${postId}_${today}`] === 1
  } catch {
    return false
  }
}

function markViewedToday(postId) {
  try {
    const today = new Date().toISOString().slice(0, 10)
    const raw = localStorage.getItem(VIEWED_STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : {}
    parsed[`${postId}_${today}`] = 1
    const keys = Object.keys(parsed)
    if (keys.length > 300) {
      keys.slice(0, 120).forEach((k) => delete parsed[k])
    }
    localStorage.setItem(VIEWED_STORAGE_KEY, JSON.stringify(parsed))
  } catch {}
}

function setupViewObserver() {
  if (typeof IntersectionObserver === 'undefined') return
  if (viewObserver) viewObserver.disconnect()

  viewObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const postId = entry.target?.getAttribute('data-post-id')
        if (!postId) return

        if (entry.isIntersecting && entry.intersectionRatio >= 0.45) {
          if (hasViewedToday(postId) || pendingViewTimers.has(postId)) return
          const timer = setTimeout(() => {
            pendingViewTimers.delete(postId)
            recordPostViewOnce(postId)
          }, 1200)
          pendingViewTimers.set(postId, timer)
        } else if (pendingViewTimers.has(postId)) {
          clearTimeout(pendingViewTimers.get(postId))
          pendingViewTimers.delete(postId)
        }
      })
    },
    { threshold: [0.45] },
  )

  cardElementsMap.forEach((el) => {
    if (el) viewObserver.observe(el)
  })
}

function setPostCardRef(el, postId) {
  if (!postId) return
  if (el) {
    cardElementsMap.set(postId, el)
    if (viewObserver) viewObserver.observe(el)
  } else {
    cardElementsMap.delete(postId)
  }
}

function updateDocumentMeta() {
  const detail = activeDetailPost.value
  if (detail) {
    const snippet = stripFeedCaptionToPlainText(detail.Content).replace(/\s+/g, ' ').trim()
    document.title = snippet
      ? `${snippet.slice(0, 60)}${snippet.length > 60 ? '...' : ''} - ${brand.value.siteName}`
      : `${t('feed.pageTitle')} - ${brand.value.siteName}`
    const canonical = document.querySelector('link[rel="canonical"]')
    if (canonical) {
      canonical.setAttribute(
        'href',
        `${window.location.origin}/bang-tin/${encodeURIComponent(detail.ID)}`,
      )
    }
    return
  }

  document.title = `${t('feed.pageTitle')} - ${brand.value.siteName}`
  const metaDesc = document.querySelector('meta[name="description"]')
  if (metaDesc) metaDesc.setAttribute('content', t('feed.pageSubtitle'))
  const canonical = document.querySelector('link[rel="canonical"]')
  if (canonical) canonical.setAttribute('href', `${window.location.origin}/bang-tin`)
}

watch(routePostId, (newId, oldId) => {
  if (newId && newId !== oldId) {
    activeDetailImgIdx.value = 0
    recordPostViewOnce(newId)
  }
  updateDocumentMeta()
})

watch(activeDetailPost, (val) => {
  if (typeof document !== 'undefined') {
    document.body.style.overflow = val ? 'hidden' : ''
  }
  updateDocumentMeta()
})

let unsubFeed = null
let unsubBanner = null

async function loadInitialData() {
  loading.value = true
  try {
    const savedLang = currentLang.value
    if (savedLang && locale.value !== savedLang) {
      locale.value = savedLang
    }

    if (!route.params.postId && route.query.post) {
      const legacyId = String(route.query.post).trim()
      if (legacyId) {
        router.replace(`/bang-tin/${encodeURIComponent(legacyId)}`)
      }
    }

    const [feedRes, prodRes, logoRes, displayRes, partnerRes, bannerRes] = await Promise.all([
      getOneSheet('feed_posts'),
      getOneSheet('hang_hoa'),
      getOneSheet('logo'),
      getOneSheet('display_config'),
      getOneSheet('partners'),
      getOneSheet('banner'),
    ])

    rawPosts.value = Array.isArray(feedRes?.data) ? feedRes.data : []
    rawProducts.value = Array.isArray(prodRes?.data) ? prodRes.data : []
    rawPartners.value = Array.isArray(partnerRes?.data) ? partnerRes.data : []
    rawBanners.value = Array.isArray(bannerRes?.data) ? bannerRes.data : []

    const logoRow = (logoRes?.data || [])[0] || null
    brand.value = resolveBrandAssets(logoRow, logoRow?.Name || 'SA KITCHEN')

    const cfgRow =
      (displayRes?.data || []).find((r) => r.ID === 'DEFAULT') || (displayRes?.data || [])[0]
    themeConfig.value = normalizeThemeConfig(cfgRow?.Theme_config)
    initThemeMode()
    updateDocumentMeta()

    if (routePostId.value) {
      recordPostViewOnce(routePostId.value)
    }
  } finally {
    loading.value = false
    await nextTick()
    setupViewObserver()
  }
}

watch(filteredPosts, async () => {
  await nextTick()
  setupViewObserver()
})

onMounted(() => {
  loadReactionMemory()
  readSavedCartCount()
  loadInitialData()
  window.addEventListener('keydown', onKeydown)
  document.addEventListener('click', closeReactionPickerOnOutsideClick)

  unsubFeed = subscribeSheet('feed_posts', (rows) => {
    if (Array.isArray(rows)) {
      rawPosts.value = rows
    }
  })

  unsubBanner = subscribeSheet('banner', (rows) => {
    if (Array.isArray(rows)) {
      rawBanners.value = rows
    }
  })
})

onUnmounted(() => {
  if (typeof document !== 'undefined') {
    document.body.style.overflow = ''
  }
  window.removeEventListener('keydown', onKeydown)
  document.removeEventListener('click', closeReactionPickerOnOutsideClick)
  clearPickerTimers()
  stopFeedAdAuto()
  if (touchHoldTimer) clearTimeout(touchHoldTimer)
  if (unsubFeed) unsubFeed()
  if (unsubBanner) unsubBanner()
  if (viewObserver) viewObserver.disconnect()
  pendingViewTimers.forEach((timer) => clearTimeout(timer))
  pendingViewTimers.clear()
})
</script>

<template>
  <div
    class="feed-public-page"
    :class="themeMode === 'dark' ? 'theme-dark' : 'theme-light'"
    :style="themeVars"
  >
    <!-- SHARE TOAST -->
    <Transition name="toast-pop">
      <div v-if="shareToast" class="nf-toast">
        <i class="ri-checkbox-circle-fill"></i>
        <span>{{ shareToast }}</span>
      </div>
    </Transition>

    <!-- STICKY HEADER (ALL MENU LINKS OPEN IN NEW TAB) -->
    <header class="nf-header">
      <div class="nf-header-inner">
        <div class="nf-brand-cluster">
          <a :href="menuBackLink" target="_blank" rel="noopener noreferrer" class="nf-brand">
            <img v-if="brand.logoUrl" :src="brand.logoUrl" :alt="brand.siteName" class="nf-logo" />
            <div class="nf-brand-text">
              <strong>{{ brand.siteName }}</strong>
              <span>{{ $t('feed.navShort') }}</span>
            </div>
          </a>

          <nav class="nf-nav-links" aria-label="Điều hướng chính">
            <a :href="menuBackLink" target="_blank" rel="noopener noreferrer" class="nf-nav-link">
              {{ $t('feed.navMenu') }}
            </a>
            <RouterLink to="/bang-tin" class="nf-nav-link active">
              {{ $t('feed.navShort') }}
            </RouterLink>
            <RouterLink to="/blog" class="nf-nav-link">
              Blog
            </RouterLink>

            <div class="nf-nav-dropdown">
              <button
                type="button"
                class="nf-nav-link nf-nav-dropdown-trigger"
                aria-haspopup="true"
              >
                <span>Check Scam</span>
                <i class="ri-arrow-down-s-line nf-nav-chevron"></i>
              </button>
              <div class="nf-nav-dropdown-menu" role="menu">
                <a
                  v-for="item in checkScamItems"
                  :key="'nf-hdr-scam-' + item.key"
                  :href="item.url"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="nf-scam-dd-item"
                  :class="item.variant"
                  role="menuitem"
                  @click="$event.currentTarget.blur()"
                >
                  <i :class="item.icon" class="nf-scam-dd-ico"></i>
                  <span class="nf-scam-dd-body">
                    <span class="nf-scam-dd-title">{{ item.title }}</span>
                    <span class="nf-scam-dd-sub">{{ item.sub }}</span>
                  </span>
                  <i class="ri-arrow-right-up-line nf-scam-dd-ext"></i>
                </a>
              </div>
            </div>
          </nav>
        </div>

        <div class="nf-nav">
          <button
            type="button"
            class="nf-icon-btn"
            :title="themeMode === 'dark' ? $t('common.lightMode') : $t('common.darkMode')"
            @click="toggleThemeMode"
          >
            <i :class="themeMode === 'dark' ? 'ri-sun-fill' : 'ri-moon-clear-line'"></i>
          </button>

          <a :href="menuBackLink" target="_blank" rel="noopener noreferrer" class="nf-menu-cta">
            <i class="ri-restaurant-2-line"></i>
            <span>{{ $t('feed.backToMenu') }}</span>
            <span v-if="savedCartCount > 0" class="nf-cart-count">
              {{ savedCartCount > 99 ? '99+' : savedCartCount }}
            </span>
          </a>
        </div>
      </div>
    </header>

    <main class="nf-container">
      <!-- 3-COLUMN FEED LAYOUT: LEFT (PARTNERS + VERTICAL ADS) | CENTER (POSTS ONLY) | RIGHT (TRUST + MENU) -->
      <div class="nf-layout-grid" :class="{ 'no-left-col': !hasLeftSidebar }">
        <!-- ================= LEFT STICKY SIDEBAR (ZERO SCROLL DIGITAL STANDEE) ================= -->
        <aside
          v-if="hasLeftSidebar"
          class="nf-sidebar-col nf-left-sidebar"
          :style="{ '--nfs-reserved-h': `${leftSidebarReservedPx}px` }"
        >
          <!-- PARTNER ECOSYSTEM -->
          <div v-if="activePartners.length" class="nfs-widget is-compact-partners">
            <h3 class="nfs-title">
              <i class="ri-links-fill"></i>
              <span>{{ $t('contact.ecosystem') }}</span>
            </h3>
            <div class="nfs-partner-list">
              <a
                v-for="(pt, idx) in activePartners"
                :key="pt.ID"
                :href="pt.normalizedUrl"
                target="_blank"
                rel="noopener noreferrer"
                class="nfs-partner-card"
                :style="getPartnerCardStyle(pt.Bg_color, idx)"
              >
                <span class="nfs-pt-avatar">
                  <img v-if="pt.URL_img" :src="pt.URL_img" :alt="pt.Name" loading="lazy" />
                  <i v-else class="ri-store-3-fill"></i>
                </span>
                <span class="nfs-pt-meta">
                  <strong>{{ pt.Name }}</strong>
                  <span v-if="pt.Subtitle">{{ pt.Subtitle }}</span>
                </span>
                <i class="ri-arrow-right-up-line nfs-pt-ext"></i>
              </a>
            </div>
          </div>

          <!-- DIGITAL STANDEE VERTICAL AD (AUTO-SLIDE, ZERO SCROLLBAR) -->
          <div
            v-if="activeVerticalBanners.length && activeFeedVertAd"
            class="nfs-ad-stack"
            @mouseenter="feedAdPaused = true; stopFeedAdAuto()"
            @mouseleave="feedAdPaused = false; startFeedAdAuto()"
          >
            <div class="nfs-ad-section-head">
              <div class="nfs-ad-head-left">
                <i class="ri-megaphone-line"></i>
                <span>{{ $t('feed.sidebarAdTitle') }}</span>
              </div>
              <span v-if="activeVerticalBanners.length > 1" class="nfs-ad-counter">
                {{ currentFeedAdIdx + 1 }}/{{ activeVerticalBanners.length }}
              </span>
            </div>

            <Transition name="standee-fade" mode="out-in">
              <!-- LINK MODE: OPENS IN NEW TAB -->
              <a
                v-if="
                  activeFeedVertAd.action === BANNER_CLICK_ACTIONS.LINK &&
                  activeFeedVertAd.normalizedLink
                "
                :key="'nf-ad-link-' + activeFeedVertAd.ID"
                :href="activeFeedVertAd.normalizedLink"
                target="_blank"
                rel="noopener noreferrer"
                class="nfs-ad-card"
              >
                <div
                  class="nfs-ad-poster-wrap has-glassy-ambient"
                  :style="ambientBgStyle(activeFeedVertAd.URL)"
                >
                  <img
                    :src="activeFeedVertAd.URL"
                    :alt="activeFeedVertAd.cleanTitle || brand.siteName"
                    class="nfs-ad-img"
                  />
                  <span class="nfs-ad-corner-ico">
                    <i class="ri-arrow-right-up-line"></i>
                  </span>
                </div>
                <div v-if="activeFeedVertAd.cleanTitle" class="nfs-ad-caption">
                  <span>{{ activeFeedVertAd.cleanTitle }}</span>
                </div>
              </a>

              <!-- POPUP MODE: OPENS FULLSCREEN ZOOM (+ OPTIONAL LINK BUTTON) -->
              <button
                v-else
                :key="'nf-ad-btn-' + activeFeedVertAd.ID"
                type="button"
                class="nfs-ad-card is-btn"
                @click="openLightbox([activeFeedVertAd.URL], 0, activeFeedVertAd.normalizedLink)"
              >
                <div
                  class="nfs-ad-poster-wrap has-glassy-ambient"
                  :style="ambientBgStyle(activeFeedVertAd.URL)"
                >
                  <img
                    :src="activeFeedVertAd.URL"
                    :alt="activeFeedVertAd.cleanTitle || brand.siteName"
                    class="nfs-ad-img"
                  />
                  <span class="nfs-ad-corner-ico">
                    <i class="ri-fullscreen-line"></i>
                  </span>
                </div>
                <div v-if="activeFeedVertAd.cleanTitle" class="nfs-ad-caption">
                  <span>{{ activeFeedVertAd.cleanTitle }}</span>
                </div>
              </button>
            </Transition>

            <div v-if="activeVerticalBanners.length > 1" class="nfs-standee-nav">
              <button
                type="button"
                class="nfs-snav-btn"
                aria-label="Previous"
                @click="stepFeedVertAd(-1)"
              >
                <i class="ri-arrow-left-s-line"></i>
              </button>
              <div class="nfs-snav-dots">
                <button
                  v-for="(item, idx) in activeVerticalBanners"
                  :key="'nf-dot-' + item.ID"
                  type="button"
                  class="nfs-snav-dot"
                  :class="{ active: idx === currentFeedAdIdx }"
                  @click="goToFeedVertAd(idx)"
                ></button>
              </div>
              <button
                type="button"
                class="nfs-snav-btn"
                aria-label="Next"
                @click="stepFeedVertAd(1)"
              >
                <i class="ri-arrow-right-s-line"></i>
              </button>
            </div>
          </div>
        </aside>

        <!-- ================= CENTER COLUMN: POSTS ONLY ================= -->
        <div class="nf-timeline-col">
          <!-- COMPACT FILTER & SEARCH BAR -->
          <div class="nf-feed-toolbar">
            <div class="nf-tabs" role="tablist">
              <button
                type="button"
                class="nf-tab"
                :class="{ active: activeTab === 'all' }"
                @click="activeTab = 'all'"
              >
                <i class="ri-apps-2-line"></i>
                <span>{{ $t('feed.tabAll') }}</span>
              </button>
              <button
                type="button"
                class="nf-tab"
                :class="{ active: activeTab === 'feedback' }"
                @click="activeTab = 'feedback'"
              >
                <i class="ri-chat-smile-3-line"></i>
                <span>{{ $t('feed.tabFeedback') }}</span>
              </button>
              <button
                type="button"
                class="nf-tab"
                :class="{ active: activeTab === 'kitchen' }"
                @click="activeTab = 'kitchen'"
              >
                <i class="ri-restaurant-2-line"></i>
                <span>{{ $t('feed.tabKitchen') }}</span>
              </button>
              <button
                type="button"
                class="nf-tab"
                :class="{ active: activeTab === 'promo' }"
                @click="activeTab = 'promo'"
              >
                <i class="ri-megaphone-line"></i>
                <span>{{ $t('feed.tabPromo') }}</span>
              </button>
            </div>

            <div class="nf-search-box">
              <i class="ri-search-line"></i>
              <input
                v-model="searchQuery"
                type="text"
                :placeholder="$t('feed.searchPlaceholder')"
              />
              <button
                v-if="searchQuery"
                type="button"
                class="nf-clear-btn"
                @click="searchQuery = ''"
              >
                <i class="ri-close-line"></i>
              </button>
            </div>
          </div>

          <!-- SKELETON -->
          <template v-if="loading">
            <div v-for="n in 3" :key="n" class="nf-post-card nf-skeleton">
              <div class="sk-head">
                <div class="sk-circle"></div>
                <div class="sk-lines">
                  <div class="sk-bar w-40"></div>
                  <div class="sk-bar w-25"></div>
                </div>
              </div>
              <div class="sk-bar w-90"></div>
              <div class="sk-bar w-70"></div>
              <div class="sk-rect"></div>
            </div>
          </template>

          <!-- EMPTY STATE -->
          <div v-else-if="!filteredPosts.length" class="nf-empty-card">
            <div class="nf-empty-ico">
              <i class="ri-newspaper-line"></i>
            </div>
            <h2>{{ $t('feed.emptyTitle') }}</h2>
            <p>{{ $t('feed.emptyDesc') }}</p>
            <div class="nf-empty-actions">
              <button
                v-if="activeTab !== 'all' || searchQuery"
                type="button"
                class="nf-btn-outline"
                @click="activeTab = 'all'; searchQuery = ''"
              >
                <i class="ri-refresh-line"></i>
                <span>{{ $t('feed.viewAllPosts') }}</span>
              </button>
              <a
                :href="menuBackLink"
                target="_blank"
                rel="noopener noreferrer"
                class="nf-btn-primary"
              >
                <i class="ri-restaurant-2-line"></i>
                <span>{{ $t('feed.backToMenu') }}</span>
              </a>
            </div>
          </div>

          <!-- FEED CARDS -->
          <template v-else>
            <article
              v-for="post in filteredPosts"
              :key="post.ID"
              :ref="(el) => setPostCardRef(el, post.ID)"
              :data-post-id="post.ID"
              class="nf-post-card is-clickable-card"
              :class="{
                'is-pinned': post.Pinned,
                'is-highlighted': routePostId === post.ID,
              }"
              @click="openPostDetail(post, 0)"
            >
              <!-- POST HEADER -->
              <header class="nfp-header">
                <img
                  v-if="brand.logoUrl"
                  :src="brand.logoUrl"
                  :alt="brand.siteName"
                  class="nfp-avatar"
                />
                <div class="nfp-author-meta">
                  <div class="nfp-author-line">
                    <strong class="nfp-author-name">{{ brand.siteName }}</strong>
                    <i class="ri-verified-badge-fill nfp-verified-ico"></i>
                    <span class="nfp-type-pill" :class="getTypeBadge(post.Post_type).cls">
                      <i :class="getTypeBadge(post.Post_type).icon"></i>
                      <span>{{ getTypeBadge(post.Post_type).label }}</span>
                    </span>
                  </div>
                  <div class="nfp-sub-line">
                    <span class="nfp-time">
                      <i class="ri-time-line"></i>
                      <span>{{ formatRelativeTime(post.Created_at) }}</span>
                    </span>
                    <span v-if="post.Pinned" class="nfp-pin-badge">
                      <i class="ri-pushpin-2-fill"></i>
                      <span>{{ $t('feed.pinnedBadge') }}</span>
                    </span>
                  </div>
                </div>

                <span class="nfp-detail-hint">
                  <span>{{ $t('feed.viewDetail') }}</span>
                  <i class="ri-arrow-right-up-line"></i>
                </span>
              </header>

              <!-- CAPTION (SUPPORTS ATTACHED NEW-TAB LINKS) -->
              <div
                v-if="stripFeedCaptionToPlainText(post.Content)"
                class="nfp-caption-wrap"
                @click="onCaptionClick"
              >
                <div
                  class="nfp-caption"
                  :class="{ 'is-clamped': isLongCaption(post.Content) }"
                  v-html="sanitizeFeedCaptionHtml(post.Content)"
                ></div>
                <span v-if="isLongCaption(post.Content)" class="nfp-readmore-btn">
                  {{ $t('feed.readMore') }}
                </span>
              </div>

              <!-- COMPACT GLASSY PHOTO GRID -->
              <div
                v-if="Array.isArray(post.Images) && post.Images.length"
                class="nfp-media-grid"
                :class="[
                  post.Images.length === 1
                    ? 'is-1'
                    : post.Images.length === 2
                      ? 'is-2'
                      : post.Images.length === 3
                        ? 'is-3'
                        : 'is-4plus',
                ]"
              >
                <button
                  v-for="(imgUrl, idx) in post.Images.slice(0, 4)"
                  :key="idx"
                  type="button"
                  class="nfp-media-tile has-glassy-ambient"
                  :style="ambientBgStyle(imgUrl)"
                  @click.stop="openPostDetail(post, idx)"
                >
                  <img :src="imgUrl" :alt="brand.siteName" loading="lazy" />
                  <span v-if="idx === 3 && post.Images.length > 4" class="nfp-more-overlay">
                    +{{ post.Images.length - 4 }}
                  </span>
                </button>
              </div>

              <!-- COMPACT TAGGED DISH CHIPS (OPENS IN NEW TAB) -->
              <div v-if="getTaggedDishes(post).length" class="nfp-dish-strip" @click.stop>
                <span class="nfp-dish-strip-ico" :title="$t('feed.taggedDishes')">
                  <i class="ri-price-tag-3-fill"></i>
                </span>
                <a
                  v-for="dish in getTaggedDishes(post)"
                  :key="dish.Ma_hang"
                  :href="getDishOrderRoute(dish)"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="nfp-dish-chip"
                  :title="`${dish.Ten_hang} — ${formatDishPrice(dish)}`"
                >
                  <img
                    v-if="dish.Main_img"
                    :src="dish.Main_img"
                    :alt="dish.Ten_hang"
                    class="nfp-chip-thumb"
                    loading="lazy"
                  />
                  <span class="nfp-chip-name">{{ dish.Ten_hang }}</span>
                  <span class="nfp-chip-sep">·</span>
                  <span class="nfp-chip-price">{{ formatDishPrice(dish) }}</span>
                  <span class="nfp-chip-bag">
                    <i class="ri-shopping-bag-3-fill"></i>
                  </span>
                </a>
              </div>

              <!-- FOOTER: CLEAN LIKE + FB REACTION DOCK + VIEWS + SHARE -->
              <footer class="nfp-footer" @click.stop>
                <div
                  class="nfp-like-wrap"
                  @mouseenter="onLikeWrapEnter('card_' + post.ID)"
                  @mouseleave="onLikeWrapLeave('card_' + post.ID)"
                >
                  <!-- FLOATING REACTION PICKER -->
                  <Transition name="react-dock">
                    <div
                      v-if="openPickerKey === 'card_' + post.ID"
                      class="nfp-reaction-dock"
                      role="toolbar"
                    >
                      <button
                        v-for="opt in REACTION_DEFS"
                        :key="opt.key"
                        type="button"
                        class="nfp-dock-item"
                        :class="[
                          opt.tone,
                          { 'is-selected': getSelectedReactionKey(post.ID) === opt.key },
                        ]"
                        :title="$t(opt.labelKey)"
                        @click.stop="applyPostReaction(post, opt.key)"
                      >
                        <i :class="opt.icon"></i>
                        <span class="nfp-dock-tip">{{ $t(opt.labelKey) }}</span>
                      </button>
                    </div>
                  </Transition>

                  <button
                    type="button"
                    class="nfp-like-btn"
                    :class="getSelectedReactionMeta(post.ID)?.tone || ''"
                    @touchstart.passive="onLikeTouchStart('card_' + post.ID)"
                    @touchend.passive="onLikeTouchEnd"
                    @touchcancel.passive="onLikeTouchEnd"
                    @contextmenu.prevent="openPickerKey = 'card_' + post.ID"
                    @click="onQuickLikeClick(post)"
                  >
                    <i
                      :class="
                        getSelectedReactionMeta(post.ID)
                          ? getSelectedReactionMeta(post.ID).icon
                          : 'ri-thumb-up-line'
                      "
                    ></i>
                    <span class="nfp-like-label">
                      {{
                        getSelectedReactionMeta(post.ID)
                          ? $t(getSelectedReactionMeta(post.ID).labelKey)
                          : $t('feed.reactLike')
                      }}
                    </span>
                    <span v-if="totalReactions(post) > 0" class="nfp-like-count">
                      {{ totalReactions(post).toLocaleString('en-US') }}
                    </span>
                  </button>
                </div>

                <div class="nfp-right-meta">
                  <span class="nfp-views" :title="`${totalViews(post)} ${$t('feed.viewsUnit')}`">
                    <i class="ri-eye-line"></i>
                    <span>{{ totalViews(post).toLocaleString('en-US') }}</span>
                  </span>

                  <button
                    type="button"
                    class="nfp-share-btn"
                    :title="$t('feed.shareBtn')"
                    @click="sharePost(post)"
                  >
                    <i class="ri-share-forward-line"></i>
                    <span>{{ $t('feed.shareBtn') }}</span>
                  </button>
                </div>
              </footer>
            </article>
          </template>
        </div>

        <!-- ================= RIGHT STICKY SIDEBAR ================= -->
        <aside class="nf-sidebar-col nf-right-sidebar">
          <!-- CHECK SCAM TRUST WIDGET -->
          <div class="nfs-widget">
            <h3 class="nfs-title">
              <i class="ri-shield-check-fill"></i>
              <span>{{ $t('footer.safetyTitle') }}</span>
            </h3>
            <div class="nfs-scam-list">
              <a
                v-for="item in checkScamItems"
                :key="item.key"
                :href="item.url"
                target="_blank"
                rel="noopener noreferrer"
                class="nfs-scam-btn"
                :class="item.variant"
              >
                <span class="nfs-scam-ico">
                  <i :class="item.icon"></i>
                </span>
                <span class="nfs-scam-label">{{ item.title }}</span>
                <i class="ri-external-link-line nfs-scam-ext"></i>
              </a>
            </div>
          </div>

          <!-- POPULAR DISHES WIDGET (OPENS IN NEW TAB) -->
          <div v-if="sidebarDishes.length" class="nfs-widget">
            <h3 class="nfs-title">
              <i class="ri-restaurant-2-fill"></i>
              <span>{{ $t('feed.sidebarHotTitle') }}</span>
            </h3>
            <div class="nfs-dish-list">
              <a
                v-for="dish in sidebarDishes"
                :key="'side-' + dish.Ma_hang"
                :href="getDishOrderRoute(dish)"
                target="_blank"
                rel="noopener noreferrer"
                class="nfs-dish-row"
              >
                <img :src="dish.Main_img" :alt="dish.Ten_hang" loading="lazy" />
                <div class="nfs-dish-meta">
                  <strong>{{ dish.Ten_hang }}</strong>
                  <span>{{ formatDishPrice(dish) }}</span>
                </div>
                <i class="ri-external-link-line"></i>
              </a>
            </div>
            <a
              :href="menuBackLink"
              target="_blank"
              rel="noopener noreferrer"
              class="nfs-all-menu-btn"
            >
              <i class="ri-layout-grid-fill"></i>
              <span>{{ $t('feed.sidebarViewAllMenu') }}</span>
            </a>
          </div>
        </aside>
      </div>
    </main>

    <!-- POST DETAIL MODAL (SYNCED WITH /bang-tin/:postId) -->
    <Teleport to="body">
      <Transition name="fade">
        <div
          v-if="activeDetailPost"
          class="nfd-overlay"
          :class="themeMode === 'dark' ? 'theme-dark' : 'theme-light'"
          :style="themeVars"
          @click.self="closePostDetail"
        >
          <div
            class="nfd-dialog"
            :class="{
              'no-media': !(
                Array.isArray(activeDetailPost.Images) && activeDetailPost.Images.length
              ),
            }"
          >
            <!-- LEFT / TOP GLASSY MEDIA STAGE -->
            <div
              v-if="Array.isArray(activeDetailPost.Images) && activeDetailPost.Images.length"
              class="nfd-media-pane"
            >
              <div
                class="nfd-media-stage has-glassy-ambient"
                :style="
                  ambientBgStyle(
                    activeDetailPost.Images[activeDetailImgIdx] || activeDetailPost.Images[0],
                  )
                "
              >
                <img
                  :src="activeDetailPost.Images[activeDetailImgIdx] || activeDetailPost.Images[0]"
                  :alt="brand.siteName"
                  class="nfd-main-img"
                  @click="openLightbox(activeDetailPost.Images, activeDetailImgIdx)"
                />

                <button
                  type="button"
                  class="nfd-zoom-btn"
                  :title="$t('feed.zoomImage')"
                  @click="openLightbox(activeDetailPost.Images, activeDetailImgIdx)"
                >
                  <i class="ri-fullscreen-line"></i>
                </button>

                <button
                  v-if="activeDetailPost.Images.length > 1"
                  type="button"
                  class="nfd-stage-nav is-prev"
                  @click="stepDetailImage(-1)"
                >
                  <i class="ri-arrow-left-s-line"></i>
                </button>
                <button
                  v-if="activeDetailPost.Images.length > 1"
                  type="button"
                  class="nfd-stage-nav is-next"
                  @click="stepDetailImage(1)"
                >
                  <i class="ri-arrow-right-s-line"></i>
                </button>
              </div>

              <div v-if="activeDetailPost.Images.length > 1" class="nfd-thumb-strip">
                <button
                  v-for="(imgUrl, tIdx) in activeDetailPost.Images"
                  :key="tIdx"
                  type="button"
                  class="nfd-thumb-btn"
                  :class="{ active: activeDetailImgIdx === tIdx }"
                  @click="activeDetailImgIdx = tIdx"
                >
                  <img :src="imgUrl" alt="" loading="lazy" />
                </button>
              </div>
            </div>

            <!-- RIGHT / BOTTOM POST INFO & ACTIONS PANE -->
            <div class="nfd-info-pane">
              <div class="nfd-info-header">
                <div class="nfd-author">
                  <img
                    v-if="brand.logoUrl"
                    :src="brand.logoUrl"
                    :alt="brand.siteName"
                    class="nfp-avatar"
                  />
                  <div class="nfp-author-meta">
                    <div class="nfp-author-line">
                      <strong class="nfp-author-name">{{ brand.siteName }}</strong>
                      <i class="ri-verified-badge-fill nfp-verified-ico"></i>
                      <span
                        class="nfp-type-pill"
                        :class="getTypeBadge(activeDetailPost.Post_type).cls"
                      >
                        <i :class="getTypeBadge(activeDetailPost.Post_type).icon"></i>
                        <span>{{ getTypeBadge(activeDetailPost.Post_type).label }}</span>
                      </span>
                    </div>
                    <div class="nfp-sub-line">
                      <span class="nfp-time">
                        <i class="ri-time-line"></i>
                        <span>{{ formatRelativeTime(activeDetailPost.Created_at) }}</span>
                      </span>
                      <span v-if="activeDetailPost.Pinned" class="nfp-pin-badge">
                        <i class="ri-pushpin-2-fill"></i>
                        <span>{{ $t('feed.pinnedBadge') }}</span>
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  class="nfd-close-btn"
                  :title="$t('feed.closeDetail')"
                  @click="closePostDetail"
                >
                  <i class="ri-close-line"></i>
                </button>
              </div>

              <div class="nfd-info-scroll">
                <div
                  v-if="stripFeedCaptionToPlainText(activeDetailPost.Content)"
                  class="nfd-full-caption"
                  v-html="sanitizeFeedCaptionHtml(activeDetailPost.Content)"
                ></div>

                <!-- COMPACT TAGGED DISH CHIPS IN DETAIL (OPENS IN NEW TAB) -->
                <div
                  v-if="getTaggedDishes(activeDetailPost).length"
                  class="nfp-dish-strip is-in-detail"
                >
                  <span class="nfp-dish-strip-ico" :title="$t('feed.taggedDishes')">
                    <i class="ri-price-tag-3-fill"></i>
                  </span>
                  <a
                    v-for="dish in getTaggedDishes(activeDetailPost)"
                    :key="'det-' + dish.Ma_hang"
                    :href="getDishOrderRoute(dish)"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="nfp-dish-chip"
                    :title="`${dish.Ten_hang} — ${formatDishPrice(dish)}`"
                  >
                    <img
                      v-if="dish.Main_img"
                      :src="dish.Main_img"
                      :alt="dish.Ten_hang"
                      class="nfp-chip-thumb"
                    />
                    <span class="nfp-chip-name">{{ dish.Ten_hang }}</span>
                    <span class="nfp-chip-sep">·</span>
                    <span class="nfp-chip-price">{{ formatDishPrice(dish) }}</span>
                    <span class="nfp-chip-bag">
                      <i class="ri-shopping-bag-3-fill"></i>
                    </span>
                  </a>
                </div>
              </div>

              <div class="nfd-info-footer">
                <div
                  class="nfp-like-wrap"
                  @mouseenter="onLikeWrapEnter('detail_' + activeDetailPost.ID)"
                  @mouseleave="onLikeWrapLeave('detail_' + activeDetailPost.ID)"
                >
                  <Transition name="react-dock">
                    <div
                      v-if="openPickerKey === 'detail_' + activeDetailPost.ID"
                      class="nfp-reaction-dock"
                      role="toolbar"
                    >
                      <button
                        v-for="opt in REACTION_DEFS"
                        :key="'det-opt-' + opt.key"
                        type="button"
                        class="nfp-dock-item"
                        :class="[
                          opt.tone,
                          { 'is-selected': getSelectedReactionKey(activeDetailPost.ID) === opt.key },
                        ]"
                        :title="$t(opt.labelKey)"
                        @click.stop="applyPostReaction(activeDetailPost, opt.key)"
                      >
                        <i :class="opt.icon"></i>
                        <span class="nfp-dock-tip">{{ $t(opt.labelKey) }}</span>
                      </button>
                    </div>
                  </Transition>

                  <button
                    type="button"
                    class="nfp-like-btn"
                    :class="getSelectedReactionMeta(activeDetailPost.ID)?.tone || ''"
                    @touchstart.passive="onLikeTouchStart('detail_' + activeDetailPost.ID)"
                    @touchend.passive="onLikeTouchEnd"
                    @touchcancel.passive="onLikeTouchEnd"
                    @contextmenu.prevent="openPickerKey = 'detail_' + activeDetailPost.ID"
                    @click="onQuickLikeClick(activeDetailPost)"
                  >
                    <i
                      :class="
                        getSelectedReactionMeta(activeDetailPost.ID)
                          ? getSelectedReactionMeta(activeDetailPost.ID).icon
                          : 'ri-thumb-up-line'
                      "
                    ></i>
                    <span class="nfp-like-label">
                      {{
                        getSelectedReactionMeta(activeDetailPost.ID)
                          ? $t(getSelectedReactionMeta(activeDetailPost.ID).labelKey)
                          : $t('feed.reactLike')
                      }}
                    </span>
                    <span v-if="totalReactions(activeDetailPost) > 0" class="nfp-like-count">
                      {{ totalReactions(activeDetailPost).toLocaleString('en-US') }}
                    </span>
                  </button>
                </div>

                <div class="nfd-footer-right">
                  <span class="nfp-views">
                    <i class="ri-eye-line"></i>
                    <span>{{ totalViews(activeDetailPost).toLocaleString('en-US') }}</span>
                  </span>

                  <button
                    type="button"
                    class="nfd-copy-link-btn"
                    @click="sharePost(activeDetailPost)"
                  >
                    <i class="ri-links-line"></i>
                    <span>{{ $t('feed.copyPostLink') }}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- SECONDARY FULLSCREEN LIGHTBOX -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="lightbox.open" class="nf-lightbox" @click.self="closeLightbox">
          <button type="button" class="nfl-close" @click="closeLightbox">
            <i class="ri-close-line"></i>
          </button>

          <button
            v-if="lightbox.images.length > 1"
            type="button"
            class="nfl-nav is-prev"
            @click.stop="stepLightbox(-1)"
          >
            <i class="ri-arrow-left-s-line"></i>
          </button>

          <div class="nfl-stage" @click.self="closeLightbox">
            <img :src="lightbox.images[lightbox.index]" alt="" />
            <div v-if="lightbox.images.length > 1" class="nfl-counter">
              {{ lightbox.index + 1 }} / {{ lightbox.images.length }}
            </div>
            <a
              v-if="lightbox.linkUrl"
              :href="lightbox.linkUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="nfl-open-link-btn"
              @click.stop
            >
              <i class="ri-external-link-line"></i>
              <span>{{ $t('feed.openAdLink') }}</span>
            </a>
          </div>

          <button
            v-if="lightbox.images.length > 1"
            type="button"
            class="nfl-nav is-next"
            @click.stop="stepLightbox(1)"
          >
            <i class="ri-arrow-right-s-line"></i>
          </button>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.feed-public-page {
  min-height: 100vh;
  background: var(--sa-bg, #f1f5f9);
  color: var(--sa-text, #1e293b);
  display: flex;
  flex-direction: column;
}

.feed-public-page.theme-light,
.nfd-overlay.theme-light {
  --nf-card-bg: var(--sa-surface, #ffffff);
  --nf-card-soft: var(--sa-surface-2, #f8fafc);
  --nf-heading: #0f172a;
  --nf-text: #334155;
  --nf-muted: #64748b;
  --nf-border: #e2e8f0;
  --nf-shadow: 0 4px 18px rgba(15, 23, 42, 0.05);
}

.feed-public-page.theme-dark,
.nfd-overlay.theme-dark {
  --nf-card-bg: var(--sa-surface, #131a26);
  --nf-card-soft: var(--sa-surface-2, #1c2536);
  --nf-heading: #f8fafc;
  --nf-text: #cbd5e1;
  --nf-muted: #94a3b8;
  --nf-border: rgba(148, 163, 184, 0.16);
  --nf-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
}

.nf-toast {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1200;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  border-radius: 999px;
  background: #059669;
  color: #ffffff;
  font-size: 13.5px;
  font-weight: 700;
  box-shadow: 0 10px 28px rgba(5, 150, 105, 0.38);
}

/* =========================================================
   GLASSY AMBIENT PHOTO BACKDROP (MATCHES PRODUCT CARDS)
   ========================================================= */
.has-glassy-ambient {
  position: relative;
  isolation: isolate;
  overflow: hidden;
  background: linear-gradient(
    135deg,
    var(--sa-primary-soft, rgba(16, 185, 129, 0.1)) 0%,
    var(--nf-card-soft) 100%
  );
}

.has-glassy-ambient::before {
  content: '';
  position: absolute;
  inset: -14%;
  z-index: 0;
  pointer-events: none;
  background-image: var(--nf-ambient-img);
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  filter: blur(16px) saturate(1.32);
  transform: scale(1.1);
  opacity: 0.64;
}

.theme-dark .has-glassy-ambient::before {
  opacity: 0.5;
  filter: blur(18px) saturate(1.38) brightness(0.78);
}

.has-glassy-ambient::after {
  content: '';
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
  background:
    radial-gradient(circle at 18% 14%, rgba(255, 255, 255, 0.52) 0%, transparent 54%),
    linear-gradient(
      135deg,
      rgba(255, 255, 255, 0.36) 0%,
      rgba(255, 255, 255, 0.1) 50%,
      rgba(255, 255, 255, 0.26) 100%
    );
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.68),
    inset 0 -1px 0 rgba(15, 23, 42, 0.06);
}

.theme-dark .has-glassy-ambient::after {
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.12) 0%,
    rgba(15, 23, 42, 0.18) 60%,
    rgba(255, 255, 255, 0.06) 100%
  );
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.16);
}

/* HEADER (EMERALD BRAND BAR SYNCED WITH ORDER HEADER) */
.nf-header {
  position: sticky;
  top: 0;
  z-index: 60;
  min-height: 64px;
  background: var(
    --sa-top-header-bg,
    linear-gradient(135deg, #059669 0%, #047857 58%, #065f46 100%)
  );
  border-bottom: 1px solid rgba(255, 255, 255, 0.14);
  box-shadow: 0 4px 18px rgba(var(--sa-primary-dark-rgb, 4, 120, 87), 0.18);
}

.nf-header-inner {
  max-width: 1260px;
  min-height: 64px;
  margin: 0 auto;
  padding: 0 18px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.nf-brand-cluster {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.nf-brand {
  display: flex;
  align-items: center;
  gap: 11px;
  text-decoration: none;
  color: var(--sa-on-primary, #ffffff);
  min-width: 0;
}

.nf-logo {
  width: 40px;
  height: 40px;
  border-radius: 11px;
  object-fit: contain;
  background: #ffffff;
  border: 1px solid rgba(255, 255, 255, 0.4);
  padding: 2px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.14);
  flex-shrink: 0;
}

.nf-brand-text {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
}

.nf-brand-text strong {
  font-size: 15.5px;
  font-weight: 800;
  color: var(--sa-on-primary, #ffffff);
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.nf-brand-text span {
  font-size: 11.5px;
  font-weight: 500;
  color: var(--sa-on-primary-muted, rgba(255, 255, 255, 0.85));
}

.nf-nav {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.nf-nav-links {
  display: inline-flex;
  align-items: center;
  gap: 18px;
  margin-left: 6px;
  padding-left: 16px;
  border-left: 1px solid rgba(255, 255, 255, 0.24);
  flex-shrink: 0;
}

.nf-nav-link {
  position: relative;
  display: inline-flex;
  align-items: center;
  padding: 6px 0;
  text-decoration: none;
  font-size: 14px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.82);
  background: transparent;
  white-space: nowrap;
  transition: color 0.18s ease, opacity 0.18s ease;
}

.nf-nav-link::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 2px;
  border-radius: 999px;
  background: var(--sa-secondary-bright, #fde047);
  transform: scaleX(0);
  transform-origin: center;
  opacity: 0;
  transition: transform 0.2s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.18s ease;
}

.nf-nav-link:hover {
  color: #ffffff;
  background: transparent;
}

.nf-nav-link:hover::after {
  transform: scaleX(0.65);
  opacity: 0.75;
}

.nf-nav-link.active {
  color: #ffffff;
  font-weight: 800;
  background: transparent;
}

.nf-nav-link.active::after {
  transform: scaleX(1);
  opacity: 1;
}

.nf-nav-dropdown {
  position: relative;
  display: inline-flex;
  align-items: center;
}

.nf-nav-dropdown-trigger {
  border: none;
  font-family: inherit;
  cursor: pointer;
  gap: 3px;
}

.nf-nav-chevron {
  font-size: 15px;
  line-height: 1;
  opacity: 0.85;
  transition: transform 0.2s ease;
}

.nf-nav-dropdown:hover .nf-nav-dropdown-trigger,
.nf-nav-dropdown:focus-within .nf-nav-dropdown-trigger {
  color: #ffffff;
}

.nf-nav-dropdown:hover .nf-nav-dropdown-trigger::after,
.nf-nav-dropdown:focus-within .nf-nav-dropdown-trigger::after {
  transform: scaleX(0.65);
  opacity: 0.75;
}

.nf-nav-dropdown:hover .nf-nav-chevron,
.nf-nav-dropdown:focus-within .nf-nav-chevron {
  transform: rotate(180deg);
}

.nf-nav-dropdown-menu {
  position: absolute;
  top: calc(100% + 10px);
  left: 0;
  min-width: 268px;
  padding: 6px;
  border-radius: 14px;
  background: var(--nf-card-bg);
  border: 1px solid var(--nf-border);
  box-shadow:
    0 18px 42px rgba(15, 23, 42, 0.18),
    0 4px 12px rgba(15, 23, 42, 0.08);
  display: flex;
  flex-direction: column;
  gap: 2px;
  z-index: 120;
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
  transform: translateY(6px);
  transition:
    opacity 0.18s ease,
    transform 0.2s cubic-bezier(0.22, 1, 0.36, 1),
    visibility 0s linear 0.18s;
}

.nf-nav-dropdown-menu::before {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  top: -12px;
  height: 12px;
}

.theme-dark .nf-nav-dropdown-menu {
  box-shadow:
    0 20px 46px rgba(0, 0, 0, 0.5),
    0 4px 14px rgba(0, 0, 0, 0.32);
}

.nf-nav-dropdown:hover .nf-nav-dropdown-menu,
.nf-nav-dropdown:focus-within .nf-nav-dropdown-menu {
  opacity: 1;
  visibility: visible;
  pointer-events: auto;
  transform: translateY(0);
  transition-delay: 0s;
}

.nf-scam-dd-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 11px;
  border-radius: 10px;
  text-decoration: none;
  color: var(--nf-heading);
  transition: background-color 0.15s ease;
}

.nf-scam-dd-item:hover {
  background: var(--nf-card-soft);
}

.nf-scam-dd-ico {
  font-size: 17px;
  flex-shrink: 0;
}

.nf-scam-dd-item.is-verify .nf-scam-dd-ico {
  color: #10b981;
}

.nf-scam-dd-item.is-shops .nf-scam-dd-ico {
  color: #f59e0b;
}

.nf-scam-dd-item.is-alerts .nf-scam-dd-ico {
  color: #f43f5e;
}

.nf-scam-dd-body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.nf-scam-dd-title {
  font-size: 13px;
  font-weight: 700;
  color: var(--nf-heading);
  line-height: 1.25;
}

.nf-scam-dd-sub {
  font-size: 11.5px;
  font-weight: 500;
  color: var(--nf-muted);
  line-height: 1.25;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.nf-scam-dd-ext {
  font-size: 14px;
  color: var(--nf-muted);
  opacity: 0.7;
  flex-shrink: 0;
  transition: transform 0.15s ease, opacity 0.15s ease, color 0.15s ease;
}

.nf-scam-dd-item:hover .nf-scam-dd-ext {
  opacity: 1;
  color: var(--sa-accent, #059669);
  transform: translate(1px, -1px);
}

.nf-icon-btn {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.24);
  background: rgba(255, 255, 255, 0.14);
  color: var(--sa-on-primary, #ffffff);
  font-size: 17px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.16s ease;
}

.nf-icon-btn:hover {
  border-color: rgba(255, 255, 255, 0.42);
  background: rgba(255, 255, 255, 0.24);
  color: #ffffff;
}

.theme-dark .nf-icon-btn {
  color: var(--sa-secondary-light, #fef08a);
}

.nf-menu-cta {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 38px;
  padding: 0 15px;
  border-radius: 999px;
  background: #ffffff;
  border: 1px solid rgba(255, 255, 255, 0.92);
  color: var(--sa-primary-dark, #065f46);
  font-size: 13px;
  font-weight: 800;
  text-decoration: none;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.14);
  transition: all 0.16s ease;
}

.nf-menu-cta:hover {
  background: var(--sa-secondary-bright, #fde047);
  border-color: var(--sa-secondary-bright, #fde047);
  color: #0f172a;
  transform: translateY(-1px);
}

.nf-cart-count {
  min-width: 19px;
  height: 19px;
  padding: 0 5px;
  border-radius: 999px;
  background: linear-gradient(135deg, #f43f5e 0%, #e11d48 100%);
  color: #ffffff;
  font-size: 10.5px;
  font-weight: 800;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

/* CONTAINER & 3-COLUMN LAYOUT */
.nf-container {
  max-width: 1260px;
  width: 100%;
  margin: 0 auto;
  padding: 20px 18px 56px;
  box-sizing: border-box;
  flex: 1;
}

.nf-layout-grid {
  display: grid;
  grid-template-columns: 272px minmax(0, 620px) 284px;
  justify-content: space-between;
  gap: 20px;
  align-items: start;
}

.nf-layout-grid.no-left-col {
  grid-template-columns: minmax(0, 640px) 300px;
  justify-content: center;
}

/* COMPACT FEED TOOLBAR (CENTER TOP - UNCLIPPED ON PC) */
.nf-feed-toolbar {
  background: var(--nf-card-bg);
  border: 1px solid var(--nf-border);
  border-radius: 14px;
  padding: 7px 9px;
  box-shadow: var(--nf-shadow);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 7px;
  flex-wrap: wrap;
}

.nf-tabs {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px;
  flex: 0 1 auto;
  min-width: 0;
}

.nf-tab {
  display: inline-flex;
  align-items: center;
  height: 30px;
  gap: 4px;
  padding: 0 9px;
  border-radius: 999px;
  border: 1px solid var(--nf-border);
  background: var(--nf-card-soft);
  color: var(--nf-text);
  font-size: 11.5px;
  font-weight: 700;
  white-space: nowrap;
  cursor: pointer;
  transition: all 0.16s ease;
}

.nf-tab i {
  font-size: 13px;
}

.nf-tab.active {
  background: var(--sa-accent, #059669);
  border-color: var(--sa-accent, #059669);
  color: #ffffff;
}

.nf-search-box {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 0 9px;
  height: 30px;
  border-radius: 999px;
  border: 1px solid var(--nf-border);
  background: var(--nf-card-soft);
  flex: 1 1 132px;
  min-width: 126px;
  transition: border-color 0.16s ease, box-shadow 0.16s ease;
}

.nf-search-box:focus-within {
  border-color: var(--sa-accent, #059669);
  box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.12);
}

.nf-search-box i {
  color: var(--nf-muted);
  font-size: 13.5px;
  flex-shrink: 0;
}

.nf-search-box input {
  flex: 1;
  min-width: 0;
  width: 100%;
  border: none;
  outline: none;
  background: transparent;
  color: var(--nf-heading);
  font-size: 12px;
  text-overflow: ellipsis;
}

.nf-clear-btn {
  border: none;
  background: transparent;
  color: var(--nf-muted);
  cursor: pointer;
  display: inline-flex;
}

.nf-timeline-col {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 0;
}

/* POST CARD */
.nf-post-card {
  background: var(--nf-card-bg);
  border: 1px solid var(--nf-border);
  border-radius: 18px;
  padding: 16px 18px;
  box-shadow: var(--nf-shadow);
  transition:
    border-color 0.2s ease,
    transform 0.18s ease,
    box-shadow 0.2s ease;
}

.nf-post-card.is-clickable-card {
  cursor: pointer;
}

.nf-post-card.is-clickable-card:hover {
  border-color: rgba(16, 185, 129, 0.38);
}

.nf-post-card.is-pinned {
  border-color: rgba(245, 158, 11, 0.45);
}

.nf-post-card.is-highlighted {
  border-color: var(--sa-accent, #059669);
  box-shadow:
    0 0 0 3px rgba(16, 185, 129, 0.2),
    var(--nf-shadow);
}

.nfp-header {
  display: flex;
  align-items: center;
  gap: 11px;
  margin-bottom: 10px;
}

.nfp-avatar {
  width: 42px;
  height: 42px;
  border-radius: 11px;
  object-fit: cover;
  border: 1px solid var(--nf-border);
  flex-shrink: 0;
}

.nfp-author-meta {
  flex: 1;
  min-width: 0;
}

.nfp-author-line {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
}

.nfp-author-name {
  font-size: 14.5px;
  font-weight: 800;
  color: var(--nf-heading);
}

.nfp-verified-ico {
  color: #059669;
  font-size: 15px;
}

.nfp-type-pill {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
}

.nfp-type-pill.is-feedback {
  background: rgba(16, 185, 129, 0.12);
  color: #059669;
}

.nfp-type-pill.is-kitchen {
  background: rgba(245, 158, 11, 0.14);
  color: #d97706;
}

.nfp-type-pill.is-promo {
  background: rgba(37, 99, 235, 0.12);
  color: #2563eb;
}

.theme-dark .nfp-type-pill.is-feedback {
  color: #34d399;
}
.theme-dark .nfp-type-pill.is-kitchen {
  color: #fbbf24;
}
.theme-dark .nfp-type-pill.is-promo {
  color: #60a5fa;
}

.nfp-sub-line {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 2px;
  font-size: 12px;
  color: var(--nf-muted);
}

.nfp-time {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.nfp-pin-badge {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  color: #d97706;
  font-weight: 700;
}

.nfp-detail-hint {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 4px 9px;
  border-radius: 999px;
  background: var(--nf-card-soft);
  border: 1px solid var(--nf-border);
  color: var(--nf-muted);
  font-size: 11.5px;
  font-weight: 700;
  flex-shrink: 0;
  transition:
    color 0.16s ease,
    border-color 0.16s ease;
}

.nf-post-card:hover .nfp-detail-hint {
  color: var(--sa-accent, #059669);
  border-color: rgba(16, 185, 129, 0.35);
}

/* CAPTION */
.nfp-caption-wrap {
  margin-bottom: 11px;
}

.nfp-caption {
  margin: 0;
  font-size: 14.5px;
  line-height: 1.58;
  color: var(--nf-heading);
  word-break: break-word;
}

.nfp-caption :deep(a),
.nfd-full-caption :deep(a) {
  color: var(--sa-accent, #059669);
  font-weight: 700;
  text-decoration: underline;
  text-underline-offset: 2.5px;
  transition: opacity 0.16s ease;
}

.nfp-caption :deep(a:hover),
.nfd-full-caption :deep(a:hover) {
  opacity: 0.82;
}

.nfp-caption.is-clamped {
  display: -webkit-box;
  -webkit-line-clamp: 4;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.nfp-readmore-btn {
  display: inline-block;
  margin-top: 4px;
  color: var(--sa-accent, #059669);
  font-size: 13px;
  font-weight: 700;
}

/* COMPACT GLASSY PHOTO GRID */
.nfp-media-grid {
  display: grid;
  gap: 7px;
  border-radius: 14px;
  overflow: hidden;
  margin-bottom: 12px;
}

.nfp-media-grid.is-1 {
  grid-template-columns: 1fr;
}

.nfp-media-grid.is-2 {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.nfp-media-grid.is-3 {
  grid-template-columns: 1.25fr 1fr;
  grid-template-rows: repeat(2, 112px);
}

.nfp-media-grid.is-3 .nfp-media-tile:first-child {
  grid-row: 1 / span 2;
}

.nfp-media-grid.is-4plus {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  grid-template-rows: repeat(2, 136px);
}

.nfp-media-tile {
  position: relative;
  padding: 8px;
  border: 1px solid var(--nf-border);
  border-radius: 13px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.nfp-media-grid.is-1 .nfp-media-tile {
  height: 256px;
  padding: 10px;
}

.nfp-media-grid.is-2 .nfp-media-tile {
  height: 176px;
}

.nfp-media-tile img {
  position: relative;
  z-index: 2;
  max-width: 100%;
  max-height: 100%;
  width: auto;
  height: auto;
  object-fit: contain;
  border-radius: 9px;
  box-shadow: 0 5px 16px rgba(15, 23, 42, 0.14);
  display: block;
  transition: transform 0.24s ease;
}

.nfp-media-tile:hover img {
  transform: scale(1.025);
}

.nfp-more-overlay {
  position: absolute;
  inset: 0;
  z-index: 3;
  background: rgba(15, 23, 42, 0.62);
  backdrop-filter: blur(4px);
  color: #ffffff;
  font-size: 22px;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* COMPACT TAGGED DISH CHIPS */
.nfp-dish-strip {
  display: flex;
  align-items: center;
  gap: 7px;
  margin-bottom: 10px;
  overflow-x: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
  padding-bottom: 2px;
  cursor: default;
}

.nfp-dish-strip::-webkit-scrollbar {
  display: none;
}

.nfp-dish-strip.is-in-detail {
  flex-wrap: wrap;
  overflow-x: visible;
  margin-bottom: 0;
}

.nfp-dish-strip-ico {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: rgba(16, 185, 129, 0.12);
  color: var(--sa-accent, #059669);
  font-size: 13px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.nfp-dish-chip {
  height: 34px;
  padding: 3px 5px 3px 4px;
  border-radius: 999px;
  background: var(--nf-card-soft);
  border: 1px solid var(--nf-border);
  color: var(--nf-heading);
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
  max-width: 100%;
  transition:
    border-color 0.16s ease,
    background-color 0.16s ease,
    transform 0.16s ease;
}

.nfp-dish-chip:hover {
  border-color: var(--sa-accent, #059669);
  background: var(--nf-card-bg);
  transform: translateY(-1px);
}

.nfp-chip-thumb {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
  border: 1px solid var(--nf-border);
}

.nfp-chip-name {
  font-size: 12px;
  font-weight: 700;
  color: var(--nf-heading);
  white-space: nowrap;
}

.nfp-chip-sep {
  font-size: 11px;
  color: var(--nf-muted);
  margin: 0 -2px;
}

.nfp-chip-price {
  font-size: 12px;
  font-weight: 800;
  color: var(--sa-price, #059669);
  white-space: nowrap;
}

.nfp-chip-bag {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--sa-accent, #059669);
  color: #ffffff;
  font-size: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

/* POST FOOTER: MINIMAL FACEBOOK-STYLE LIKE + FLOATING REACTION DOCK */
.nfp-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding-top: 8px;
  border-top: 1px solid var(--nf-border);
  cursor: default;
}

.nfp-like-wrap {
  position: relative;
  display: inline-flex;
  align-items: center;
}

.nfp-like-btn {
  height: 34px;
  padding: 0 10px;
  margin-left: -6px;
  border-radius: 8px;
  border: none;
  background: transparent;
  color: var(--nf-muted);
  font-size: 13.5px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  user-select: none;
  -webkit-user-select: none;
  transition:
    background-color 0.15s ease,
    color 0.15s ease;
}

.nfp-like-btn:hover {
  background: var(--nf-card-soft);
  color: var(--nf-heading);
}

.nfp-like-btn i {
  font-size: 17px;
  line-height: 1;
  transition: transform 0.18s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.nfp-like-btn:active i {
  transform: scale(1.22);
}

.nfp-like-btn.is-like {
  color: var(--sa-accent, #059669);
}

.nfp-like-btn.is-heart {
  color: #e11d48;
}

.nfp-like-btn.is-haha,
.nfp-like-btn.is-wow {
  color: #d97706;
}

.nfp-like-btn.is-yummy {
  color: #ea580c;
}

.theme-dark .nfp-like-btn.is-like {
  color: #34d399;
}
.theme-dark .nfp-like-btn.is-heart {
  color: #fb7185;
}
.theme-dark .nfp-like-btn.is-haha,
.theme-dark .nfp-like-btn.is-wow {
  color: #fbbf24;
}
.theme-dark .nfp-like-btn.is-yummy {
  color: #fb923c;
}

.nfp-like-count {
  font-size: 12.5px;
  font-weight: 600;
  color: var(--nf-muted);
  margin-left: 1px;
}

/* FLOATING REACTION PICKER TRAY */
.nfp-reaction-dock {
  position: absolute;
  left: -4px;
  bottom: calc(100% + 6px);
  z-index: 30;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 5px 8px;
  border-radius: 999px;
  background: var(--nf-card-bg);
  border: 1px solid var(--nf-border);
  box-shadow: 0 10px 28px rgba(15, 23, 42, 0.18);
}

.nfp-reaction-dock::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  top: 100%;
  height: 10px;
}

.nfp-dock-item {
  position: relative;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  background: transparent;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 21px;
  cursor: pointer;
  transition: transform 0.18s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.nfp-dock-item:hover {
  transform: translateY(-5px) scale(1.26);
}

.nfp-dock-item.is-selected {
  background: var(--nf-card-soft);
}

.nfp-dock-item.is-like {
  color: var(--sa-accent, #059669);
}
.nfp-dock-item.is-heart {
  color: #e11d48;
}
.nfp-dock-item.is-haha,
.nfp-dock-item.is-wow {
  color: #f59e0b;
}
.nfp-dock-item.is-yummy {
  color: #ea580c;
}

.nfp-dock-tip {
  position: absolute;
  bottom: calc(100% + 5px);
  left: 50%;
  transform: translateX(-50%);
  padding: 2px 7px;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.88);
  color: #ffffff;
  font-size: 10.5px;
  font-weight: 700;
  white-space: nowrap;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.14s ease;
}

.nfp-dock-item:hover .nfp-dock-tip {
  opacity: 1;
}

.react-dock-enter-active,
.react-dock-leave-active {
  transition:
    opacity 0.16s ease,
    transform 0.18s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.react-dock-enter-from,
.react-dock-leave-to {
  opacity: 0;
  transform: translateY(8px) scale(0.92);
}

.nfp-right-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-left: auto;
}

.nfp-views {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12.5px;
  font-weight: 600;
  color: var(--nf-muted);
}

.nfp-share-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  height: 34px;
  padding: 0 10px;
  border-radius: 8px;
  border: none;
  background: transparent;
  color: var(--nf-muted);
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition:
    background-color 0.15s ease,
    color 0.15s ease;
}

.nfp-share-btn:hover {
  color: var(--nf-heading);
  background: var(--nf-card-soft);
}

/* =========================================================
   LEFT & RIGHT STICKY SIDEBARS
   ========================================================= */
.nf-sidebar-col {
  position: sticky;
  top: 76px;
  max-height: calc(100vh - 92px);
  overflow-y: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-bottom: 8px;
}

.nf-sidebar-col::-webkit-scrollbar {
  display: none;
}

.nfs-widget {
  background: var(--nf-card-bg);
  border: 1px solid var(--nf-border);
  border-radius: 16px;
  padding: 15px;
  box-shadow: var(--nf-shadow);
  flex-shrink: 0;
}

.nfs-title {
  margin: 0 0 12px;
  font-size: 13px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  color: var(--nf-heading);
  display: flex;
  align-items: center;
  gap: 6px;
}

.nfs-title i {
  color: var(--sa-accent, #059669);
  font-size: 15px;
}

.nfs-partner-list,
.nfs-dish-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.nfs-scam-list {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.nfs-partner-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 11px;
  border-radius: 12px;
  border: 1px solid var(--pt-border, rgba(255, 255, 255, 0.26));
  color: var(--pt-fg, #ffffff);
  text-decoration: none;
  transition:
    transform 0.16s ease,
    filter 0.16s ease;
}

.nfs-partner-card:hover {
  transform: translateY(-1px);
  filter: brightness(1.06);
}

.nfs-pt-avatar {
  width: 34px;
  height: 34px;
  border-radius: 9px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.95);
  color: var(--pt-ico, #059669);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.nfs-pt-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.nfs-pt-meta {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.nfs-pt-meta strong {
  font-size: 13px;
  font-weight: 800;
  color: var(--pt-fg, #ffffff);
}

.nfs-pt-meta span {
  font-size: 11px;
  color: var(--pt-sub, rgba(255, 255, 255, 0.86));
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.nfs-pt-ext {
  color: var(--pt-fg, #ffffff);
  font-size: 14px;
}

.nf-left-sidebar {
  overflow: hidden;
  gap: 12px;
}

.nfs-widget.is-compact-partners {
  padding: 12px;
}

.nfs-widget.is-compact-partners .nfs-title {
  margin-bottom: 8px;
}

.nfs-widget.is-compact-partners .nfs-partner-list {
  gap: 6px;
}

.nfs-widget.is-compact-partners .nfs-partner-card {
  padding: 7px 10px;
}

/* VERTICAL SIDEBAR AD STANDEE */
.nfs-ad-stack {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1 1 auto;
  min-height: 0;
}

.nfs-ad-section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  padding: 0 4px;
  font-size: 11.5px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.35px;
  color: var(--nf-muted);
}

.nfs-ad-head-left {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.nfs-ad-head-left i {
  color: var(--sa-accent, #059669);
  font-size: 14px;
}

.nfs-ad-counter {
  padding: 1px 7px;
  border-radius: 999px;
  background: var(--nf-card-bg);
  border: 1px solid var(--nf-border);
  font-size: 10.5px;
  font-weight: 800;
  color: var(--nf-muted);
}

.nfs-ad-card {
  display: flex;
  flex-direction: column;
  width: 100%;
  padding: 0;
  background: var(--nf-card-bg);
  border: 1px solid var(--nf-border);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: var(--nf-shadow);
  text-decoration: none;
  color: var(--nf-heading);
  cursor: pointer;
  transition:
    transform 0.2s ease,
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}

.nfs-ad-card.is-btn {
  text-align: left;
  font-family: inherit;
}

.nfs-ad-card:hover {
  transform: translateY(-2px);
  border-color: rgba(16, 185, 129, 0.42);
}

.nfs-ad-poster-wrap {
  position: relative;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background: var(--nf-card-soft);
}

.nfs-ad-img {
  position: relative;
  z-index: 2;
  width: auto;
  height: auto;
  max-width: 100%;
  max-height: clamp(
    130px,
    calc(100dvh - 102px - var(--nfs-reserved-h, 140px)),
    560px
  );
  object-fit: contain;
  display: block;
  margin: 0 auto;
  transition: transform 0.28s ease;
}

.nfs-standee-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  height: 22px;
  padding: 0 2px;
}

.nfs-snav-btn {
  width: 22px;
  height: 22px;
  padding: 0;
  border-radius: 50%;
  border: 1px solid var(--nf-border);
  background: var(--nf-card-bg);
  color: var(--nf-heading);
  font-size: 14px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background-color 0.15s ease, color 0.15s ease;
}

.nfs-snav-btn:hover {
  background: var(--sa-accent, #059669);
  border-color: var(--sa-accent, #059669);
  color: #ffffff;
}

.nfs-snav-dots {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  flex: 1;
}

.nfs-snav-dot {
  width: 6px;
  height: 6px;
  padding: 0;
  border-radius: 999px;
  border: none;
  background: var(--nf-border);
  cursor: pointer;
  transition: width 0.2s ease, background-color 0.2s ease;
}

.nfs-snav-dot.active {
  width: 16px;
  background: var(--sa-accent, #059669);
}

.standee-fade-enter-active,
.standee-fade-leave-active {
  transition: opacity 0.24s ease, transform 0.24s ease;
}

.standee-fade-enter-from,
.standee-fade-leave-to {
  opacity: 0;
  transform: scale(0.98);
}

.nfs-ad-card:hover .nfs-ad-img {
  transform: scale(1.015);
}

.nfs-ad-corner-ico {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 3;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: rgba(15, 23, 42, 0.62);
  border: 1px solid rgba(255, 255, 255, 0.38);
  color: #ffffff;
  font-size: 14px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(6px);
}

.nfs-ad-caption {
  padding: 9px 12px;
  font-size: 12.5px;
  font-weight: 700;
  color: var(--nf-heading);
  border-top: 1px solid var(--nf-border);
  line-height: 1.4;
}

/* RIGHT SIDEBAR WIDGETS (FLAT LIST LINKS — NO BADGE FRAME) */
.nfs-scam-btn {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 8px 2px;
  border-radius: 0;
  background: transparent;
  border: none;
  border-bottom: 1px dashed var(--nf-border);
  color: var(--nf-heading);
  text-decoration: none;
  font-size: 13px;
  font-weight: 700;
  transition: color 0.16s ease, transform 0.16s ease;
}

.nfs-scam-btn:first-child {
  padding-top: 2px;
}

.nfs-scam-btn:last-child {
  border-bottom: none;
  padding-bottom: 2px;
}

.nfs-scam-btn:hover {
  color: var(--sa-accent, #059669);
  transform: translateX(2px);
}

.nfs-scam-ico {
  width: auto;
  height: auto;
  border-radius: 0;
  background: none;
  font-size: 16px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.nfs-scam-btn.is-verify .nfs-scam-ico {
  color: #10b981;
}
.nfs-scam-btn.is-shops .nfs-scam-ico {
  color: #f59e0b;
}
.nfs-scam-btn.is-alerts .nfs-scam-ico {
  color: #f43f5e;
}

.nfs-scam-label {
  flex: 1;
  min-width: 0;
}

.nfs-scam-ext {
  color: var(--nf-muted);
  font-size: 13px;
  opacity: 0.72;
  transition: opacity 0.16s ease, color 0.16s ease;
}

.nfs-scam-btn:hover .nfs-scam-ext {
  opacity: 1;
  color: var(--sa-accent, #059669);
}

.nfs-dish-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px;
  border-radius: 10px;
  text-decoration: none;
  color: var(--nf-heading);
  transition: background-color 0.16s ease;
}

.nfs-dish-row:hover {
  background: var(--nf-card-soft);
}

.nfs-dish-row img {
  width: 42px;
  height: 42px;
  border-radius: 9px;
  object-fit: cover;
  flex-shrink: 0;
}

.nfs-dish-meta {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.nfs-dish-meta strong {
  font-size: 13px;
  font-weight: 700;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.nfs-dish-meta span {
  font-size: 12px;
  font-weight: 800;
  color: var(--sa-price, #059669);
}

.nfs-all-menu-btn {
  margin-top: 10px;
  width: 100%;
  padding: 9px 12px;
  border-radius: 10px;
  background: var(--nf-card-soft);
  border: 1px solid var(--nf-border);
  color: var(--sa-accent, #059669);
  font-size: 12.5px;
  font-weight: 800;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  box-sizing: border-box;
}

/* =========================================================
   POST DETAIL DIALOG (/bang-tin/:postId)
   ========================================================= */
.nfd-overlay {
  position: fixed;
  inset: 0;
  z-index: 950;
  background: rgba(15, 23, 42, 0.72);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.nfd-dialog {
  width: 100%;
  max-width: 940px;
  max-height: 88vh;
  background: var(--nf-card-bg);
  border: 1px solid var(--nf-border);
  border-radius: 20px;
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.35);
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr);
  overflow: hidden;
}

.nfd-dialog.no-media {
  max-width: 580px;
  grid-template-columns: 1fr;
}

.nfd-media-pane {
  background: var(--nf-card-soft);
  border-right: 1px solid var(--nf-border);
  padding: 16px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 10px;
  min-width: 0;
}

.nfd-media-stage {
  position: relative;
  height: 370px;
  padding: 14px;
  border-radius: 15px;
  border: 1px solid var(--nf-border);
  display: flex;
  align-items: center;
  justify-content: center;
}

.nfd-main-img {
  position: relative;
  z-index: 2;
  max-width: 100%;
  max-height: 100%;
  width: auto;
  height: auto;
  object-fit: contain;
  border-radius: 10px;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.22);
  cursor: zoom-in;
}

.nfd-zoom-btn {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 3;
  width: 34px;
  height: 34px;
  border-radius: 9px;
  border: 1px solid rgba(255, 255, 255, 0.45);
  background: rgba(15, 23, 42, 0.58);
  color: #ffffff;
  font-size: 16px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.nfd-stage-nav {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  z-index: 3;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.5);
  background: rgba(15, 23, 42, 0.6);
  color: #ffffff;
  font-size: 20px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.nfd-stage-nav.is-prev {
  left: 10px;
}
.nfd-stage-nav.is-next {
  right: 10px;
}

.nfd-thumb-strip {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  overflow-x: auto;
  padding-bottom: 2px;
}

.nfd-thumb-btn {
  width: 48px;
  height: 48px;
  padding: 0;
  border-radius: 9px;
  overflow: hidden;
  border: 2px solid transparent;
  background: transparent;
  opacity: 0.65;
  cursor: pointer;
  flex-shrink: 0;
}

.nfd-thumb-btn.active {
  border-color: var(--sa-accent, #059669);
  opacity: 1;
}

.nfd-thumb-btn img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.nfd-info-pane {
  display: flex;
  flex-direction: column;
  min-width: 0;
  max-height: 88vh;
}

.nfd-info-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 15px 18px;
  border-bottom: 1px solid var(--nf-border);
}

.nfd-author {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.nfd-close-btn {
  width: 34px;
  height: 34px;
  border-radius: 9px;
  border: 1px solid var(--nf-border);
  background: var(--nf-card-soft);
  color: var(--nf-heading);
  font-size: 18px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
}

.nfd-info-scroll {
  flex: 1;
  overflow-y: auto;
  padding: 16px 18px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.nfd-full-caption {
  margin: 0;
  font-size: 15px;
  line-height: 1.65;
  color: var(--nf-heading);
  word-break: break-word;
}

.nfd-info-footer {
  padding: 12px 18px;
  border-top: 1px solid var(--nf-border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
}

.nfd-footer-right {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-left: auto;
}

.nfd-copy-link-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 7px 12px;
  border-radius: 999px;
  border: 1px solid var(--sa-accent, #059669);
  background: rgba(16, 185, 129, 0.1);
  color: var(--sa-accent, #059669);
  font-size: 12px;
  font-weight: 800;
  cursor: pointer;
}

.nfd-copy-link-btn:hover {
  background: var(--sa-accent, #059669);
  color: #ffffff;
}

/* SKELETON & EMPTY */
.nf-skeleton .sk-head {
  display: flex;
  gap: 10px;
  margin-bottom: 12px;
}
.sk-circle {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: var(--nf-card-soft);
}
.sk-lines {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
  justify-content: center;
}
.sk-bar {
  height: 12px;
  border-radius: 6px;
  background: var(--nf-card-soft);
  margin-bottom: 8px;
}
.sk-bar.w-40 {
  width: 40%;
}
.sk-bar.w-25 {
  width: 25%;
}
.sk-bar.w-90 {
  width: 90%;
}
.sk-bar.w-70 {
  width: 70%;
}
.sk-rect {
  height: 200px;
  border-radius: 12px;
  background: var(--nf-card-soft);
}

.nf-empty-card {
  background: var(--nf-card-bg);
  border: 1px solid var(--nf-border);
  border-radius: 18px;
  padding: 48px 20px;
  text-align: center;
}

.nf-empty-ico {
  font-size: 48px;
  color: var(--nf-muted);
  margin-bottom: 8px;
}

.nf-empty-card h2 {
  margin: 0 0 6px;
  font-size: 18px;
  color: var(--nf-heading);
}

.nf-empty-card p {
  margin: 0 0 18px;
  font-size: 13.5px;
  color: var(--nf-muted);
}

.nf-empty-actions {
  display: flex;
  justify-content: center;
  gap: 10px;
  flex-wrap: wrap;
}

.nf-btn-primary,
.nf-btn-outline {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 800;
  text-decoration: none;
  cursor: pointer;
}

.nf-btn-primary {
  background: var(--sa-accent, #059669);
  color: #ffffff;
  border: none;
}

.nf-btn-outline {
  background: transparent;
  border: 1px solid var(--nf-border);
  color: var(--nf-heading);
}

/* LIGHTBOX */
.nf-lightbox {
  position: fixed;
  inset: 0;
  background: rgba(2, 6, 23, 0.94);
  z-index: 1100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.nfl-close {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 42px;
  height: 42px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.25);
  background: rgba(255, 255, 255, 0.12);
  color: #ffffff;
  font-size: 22px;
  cursor: pointer;
  z-index: 2;
}

.nfl-nav {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.25);
  background: rgba(255, 255, 255, 0.14);
  color: #ffffff;
  font-size: 24px;
  cursor: pointer;
  z-index: 2;
}

.nfl-nav.is-prev {
  left: 16px;
}
.nfl-nav.is-next {
  right: 16px;
}

.nfl-stage {
  max-width: 92vw;
  max-height: 88vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.nfl-stage img {
  max-width: 92vw;
  max-height: 78vh;
  object-fit: contain;
  border-radius: 10px;
}

.nfl-counter {
  padding: 4px 12px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.14);
  color: #ffffff;
  font-size: 12.5px;
  font-weight: 700;
}

.nfl-open-link-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 9px 18px;
  border-radius: 999px;
  background: #10b981;
  color: #ffffff;
  font-size: 13.5px;
  font-weight: 800;
  text-decoration: none;
  box-shadow: 0 6px 20px rgba(16, 185, 129, 0.35);
}

/* TABLET & MOBILE RESPONSIVE */
@media (max-width: 1120px) {
  .nf-layout-grid,
  .nf-layout-grid.no-left-col {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .nf-timeline-col {
    grid-column: 1 / -1;
    order: 1;
  }

  .nf-left-sidebar {
    order: 2;
    position: static;
    max-height: none;
    overflow: visible;
  }

  .nf-right-sidebar {
    order: 3;
    position: static;
    max-height: none;
    overflow: visible;
  }
}

@media (max-width: 920px) {
  .nfd-dialog {
    grid-template-columns: 1fr;
    max-height: 92vh;
    overflow-y: auto;
  }

  .nfd-media-pane {
    border-right: none;
    border-bottom: 1px solid var(--nf-border);
    padding: 12px;
  }

  .nfd-media-stage {
    height: 260px;
  }

  .nfd-info-pane {
    max-height: none;
  }
}

@media (max-width: 720px) {
  .nf-layout-grid,
  .nf-layout-grid.no-left-col {
    grid-template-columns: 1fr;
  }

  .nfs-ad-stack {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 12px;
  }

  .nfs-ad-section-head {
    grid-column: 1 / -1;
  }
}

@media (max-width: 640px) {
  .nf-header-inner {
    padding: 9px 12px;
  }

  .nf-nav-links {
    display: none;
  }

  .nf-menu-cta {
    padding: 8px 12px;
    font-size: 12px;
  }

  .nf-container {
    padding: 12px 10px 44px;
  }

  .nf-feed-toolbar,
  .nf-post-card {
    padding: 12px 14px;
    border-radius: 15px;
  }

  .nf-tabs {
    width: 100%;
    flex-wrap: nowrap;
    overflow-x: auto;
    scrollbar-width: none;
  }

  .nf-tabs::-webkit-scrollbar {
    display: none;
  }

  .nf-search-box {
    width: 100%;
    flex: 1 1 100%;
  }

  .nfp-detail-hint span {
    display: none;
  }

  .nfp-media-grid.is-1 .nfp-media-tile {
    height: 210px;
  }

  .nfp-media-grid.is-2 .nfp-media-tile {
    height: 145px;
  }

  .nfp-media-grid.is-3 {
    grid-template-rows: repeat(2, 94px);
  }

  .nfp-media-grid.is-4plus {
    grid-template-rows: repeat(2, 112px);
  }

  .nfp-share-btn span {
    display: none;
  }

  .nfd-overlay {
    padding: 10px;
  }
}
</style>
