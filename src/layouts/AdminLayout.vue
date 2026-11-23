<script setup>
import { ref, computed, watch, onMounted, onUnmounted, provide } from 'vue'
import { RouterView, useRouter, useRoute } from 'vue-router'
import { KeepAlive } from 'vue'
import {
  getOneSheet,
  subscribeSheet,
  checkUserExpired,
  logoutFirebase,
  subscribeAdminAuthState,
} from '@/config/api'
import { attachAdminZeroInputBehavior } from '@/utils/adminZeroInput'
const sidebarOpen = ref(true)
const mobileSidebarOpen = ref(false)
const router = useRouter()
const route = useRoute()
const nccInfo = ref({
  name: localStorage.getItem('NCC_NAME') || 'SA KITCHEN',
  logo: localStorage.getItem('NCC_LOGO') || '/Logo/FBC ONLY LOGO NO TEXT.png'
})
const pendingOrderCount = ref(0)
const pendingWebOrderCount = ref(0)
const newOrderAlert = ref(null)
const isMobileDockHidden = ref(false)
const lastScrollTopByTarget = new WeakMap()
let lastWindowScrollY = 0

const adminBaseTitle = computed(() => {
  const name = String(nccInfo.value?.name || '').trim()
  if (name) return name
  if (typeof document !== 'undefined') {
    return document.title.replace(/^\(\d+\)\s*/, '').trim() || 'SA KITCHEN'
  }
  return 'SA KITCHEN'
})

watch(
  [pendingWebOrderCount, adminBaseTitle],
  ([count, baseTitle]) => {
    if (typeof document === 'undefined') return
    document.title = count > 0 ? `(${count}) ${baseTitle}` : baseTitle
  },
  { immediate: true },
)

// Provide function để child component có thể gọi refresh
provide('refreshPendingCount', () => loadPendingOrders())
provide('updatePendingCount', () => loadPendingOrders())
provide('isMobileDockHidden', isMobileDockHidden)

const menuOnlineLink = computed(() => {
  return { name: 'menu-online', params: { lang: 'vi' } }
})

const closeMobileSidebar = () => {
  mobileSidebarOpen.value = false
}

const logout = async () => {
  await logoutFirebase()
  localStorage.removeItem('user')
  mobileSidebarOpen.value = false
  router.replace('/login')
}



let expiredTimer = null
let unsubDonHang = null
let unsubLogo = null
let unsubAuth = null
let detachZeroInputBehavior = null
let checking = false
let hasInitWebOrderBell = false
let newOrderAlertTimer = null
let sharedAudioCtx = null
let createdThemeColorMeta = false
let prevThemeColorContent = null
const knownWaitingWebOrderIds = new Set()
const knownWebOrderUpdateTimestamps = new Map()

function ensureAudioContext() {
  if (typeof window === 'undefined') return null
  const Ctx = window.AudioContext || window.webkitAudioContext
  if (!Ctx) return null
  if (!sharedAudioCtx) {
    sharedAudioCtx = new Ctx()
  }
  if (sharedAudioCtx.state === 'suspended') {
    sharedAudioCtx.resume().catch(() => {})
  }
  return sharedAudioCtx
}

function playNewWebOrderBell() {
  try {
    const ctx = ensureAudioContext()
    if (!ctx) return
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {})
    }
    const now = ctx.currentTime
    const notes = [
      { freq: 659.25, start: 0, duration: 0.24, gain: 0.22 },
      { freq: 987.77, start: 0.14, duration: 0.45, gain: 0.24 },
      { freq: 1318.51, start: 0.3, duration: 0.5, gain: 0.18 },
    ]
    for (const note of notes) {
      const osc = ctx.createOscillator()
      const amp = ctx.createGain()
      osc.type = 'triangle'
      osc.frequency.setValueAtTime(note.freq, now + note.start)

      amp.gain.setValueAtTime(0.0001, now + note.start)
      amp.gain.exponentialRampToValueAtTime(note.gain, now + note.start + 0.015)
      amp.gain.exponentialRampToValueAtTime(0.0001, now + note.start + note.duration)

      osc.connect(amp)
      amp.connect(ctx.destination)
      osc.start(now + note.start)
      osc.stop(now + note.start + note.duration + 0.02)
    }
  } catch (err) {
    console.warn('Order bell sound skipped:', err)
  }
}

function unlockAdminAudio() {
  ensureAudioContext()
}

function dismissNewOrderAlert() {
  newOrderAlert.value = null
  if (newOrderAlertTimer) {
    clearTimeout(newOrderAlertTimer)
    newOrderAlertTimer = null
  }
}

function goToPendingWebOrders() {
  const focusOrderId = newOrderAlert.value?.isUpdate ? newOrderAlert.value.maHoaDon : ''
  dismissNewOrderAlert()
  mobileSidebarOpen.value = false
  if (focusOrderId) {
    router.push({ name: 'nhap-hoa-don', query: { focusOrderId } })
  } else {
    router.push({ name: 'nhap-hoa-don' })
  }
}

// Parse datetime từ format VN (an toàn với chuỗi tự do như "18h30")
function parseVNDateTime(str) {
  if (!str || typeof str !== 'string') return null
  const [time, date] = str.trim().split(' ')
  if (!time || !date || !time.includes(':') || !date.includes('/')) return null
  const [hh, mm, ss] = time.split(':').map(Number)
  const [dd, MM, yyyy] = date.split('/').map(Number)
  if ([hh, mm, dd, MM, yyyy].some((v) => !Number.isFinite(v))) return null
  return new Date(yyyy, MM - 1, dd, hh, mm, Number.isFinite(ss) ? ss : 0)
}

// Tính trạng thái đơn hàng
function getDonStatus(dh) {
  if (!dh) return ''
  if (dh.Trang_thai === 'Hoàn thành') return 'Hoàn thành'
  if (dh.Trang_thai === 'Chờ duyệt') return 'Chờ duyệt'
  const thoiGianGiao = parseVNDateTime(dh.Thoi_gian_nhan_hang)
  if (!thoiGianGiao) return dh.Trang_thai
  const endOfDay = new Date(thoiGianGiao)
  endOfDay.setHours(23, 59, 59, 999)
  const now = new Date()
  if (now > endOfDay) return 'Quá hạn'
  return dh.Trang_thai
}

function isWaitingApprovalOrder(dh) {
  return getDonStatus(dh) === 'Chờ duyệt'
}

function isWaitingWebOrder(dh) {
  if (!isWaitingApprovalOrder(dh)) return false
  const src = String(dh.Nguon_don || '').trim().toUpperCase()
  const code = String(dh.Ma_hoa_don || '').trim().toUpperCase()
  return !src || src === 'WEB' || code.startsWith('WEB')
}

function syncDonHangIndicators(donHangList, allowBell = false) {
  const list = donHangList || []
  const waitingApprovalOrders = list.filter(isWaitingApprovalOrder)
  const waitingCount = waitingApprovalOrders.length

  pendingOrderCount.value = waitingCount
  pendingWebOrderCount.value = waitingCount

  const waitingWebOrders = waitingApprovalOrders.filter(isWaitingWebOrder)

  if (!hasInitWebOrderBell) {
    hasInitWebOrderBell = true
    for (const dh of waitingWebOrders) {
      const id = String(dh?.Ma_hoa_don || '').trim()
      if (id) {
        knownWaitingWebOrderIds.add(id)
        knownWebOrderUpdateTimestamps.set(id, Number(dh?.Last_web_update_at || 0))
      }
    }
    return
  }

  const freshOrders = []
  const updatedOrders = []
  for (const dh of waitingWebOrders) {
    const id = String(dh?.Ma_hoa_don || '').trim()
    if (!id) continue
    const updTs = Number(dh?.Last_web_update_at || 0)
    if (!knownWaitingWebOrderIds.has(id)) {
      knownWaitingWebOrderIds.add(id)
      knownWebOrderUpdateTimestamps.set(id, updTs)
      freshOrders.push(dh)
    } else {
      const prevUpd = Number(knownWebOrderUpdateTimestamps.get(id) || 0)
      if (updTs > prevUpd) {
        knownWebOrderUpdateTimestamps.set(id, updTs)
        updatedOrders.push(dh)
      }
    }
  }

  if (allowBell && (freshOrders.length > 0 || updatedOrders.length > 0)) {
    playNewWebOrderBell()
    if (freshOrders.length > 0) {
      const newest = freshOrders[0]
      newOrderAlert.value = {
        count: freshOrders.length,
        isUpdate: false,
        maHoaDon: String(newest?.Ma_hoa_don || '').trim(),
        tenKhach: String(newest?.Ten_khach_hang || 'Khách web').trim(),
      }
    } else {
      const upd = updatedOrders[0]
      newOrderAlert.value = {
        count: updatedOrders.length,
        isUpdate: true,
        maHoaDon: String(upd?.Ma_hoa_don || '').trim(),
        tenKhach: String(upd?.Ten_khach_hang || 'Khách web').trim(),
      }
    }
    if (newOrderAlertTimer) clearTimeout(newOrderAlertTimer)
    newOrderAlertTimer = setTimeout(() => {
      newOrderAlert.value = null
      newOrderAlertTimer = null
    }, 7000)
  }
}

// Load số đơn hàng chờ duyệt + đang xử lý (fallback manual refresh)
const loadPendingOrders = async () => {
  try {
    const json = await getOneSheet('don_hang')
    syncDonHangIndicators(json.data || [], true)
  } catch (err) {
    console.warn('Load pending orders failed:', err)
  }
}

const loadMenuOnlineNcc = async () => {
  try {
    const jsonLogo = await getOneSheet('logo')
    const logo = jsonLogo.data?.[0]
    if (logo) {
      const tenNcc = logo.Name || 'SA KITCHEN'
      const logoNcc = logo.URL || '/Logo/FBC ONLY LOGO NO TEXT.png'

      nccInfo.value = { name: tenNcc, logo: logoNcc }
      localStorage.setItem('NCC_NAME', tenNcc)
      localStorage.setItem('NCC_LOGO', logoNcc)
    }
  } catch (err) {
    console.warn('Load NCC info failed:', err)
  }
}

const checkExpiredSilently = async () => {
  if (checking) return
  checking = true

  try {
    const data = await checkUserExpired()
    if (data?.expired === true) {
      localStorage.removeItem('user')
      router.replace('/login')
    }
  } catch (err) {
    console.warn('Expired check failed:', err)
  } finally {
    checking = false
  }
}

onMounted(() => {
  if (typeof document !== 'undefined') {
    document.documentElement.classList.add('admin-shell-active')
    let themeMeta = document.querySelector('meta[name="theme-color"]')
    if (themeMeta) {
      prevThemeColorContent = themeMeta.getAttribute('content')
    } else {
      themeMeta = document.createElement('meta')
      themeMeta.setAttribute('name', 'theme-color')
      document.head.appendChild(themeMeta)
      createdThemeColorMeta = true
    }
    themeMeta.setAttribute('content', '#0f172a')
  }

  checkExpiredSilently()
  unsubAuth = subscribeAdminAuthState((adminSession) => {
    if (!adminSession) {
      router.replace('/login')
    }
  })
  loadMenuOnlineNcc()

  // Realtime Firebase listener cho đơn hàng chờ duyệt + đang xử lý
  unsubDonHang = subscribeSheet('don_hang', (donHangList) => {
    syncDonHangIndicators(donHangList || [], true)
  })

  window.addEventListener('pointerdown', unlockAdminAudio, { passive: true })
  window.addEventListener('keydown', unlockAdminAudio, { passive: true })

  // Realtime Firebase listener cho logo / tên thương hiệu
  unsubLogo = subscribeSheet('logo', (logoList) => {
    const logo = logoList?.[0]
    if (logo) {
      const tenNcc = logo.Name || 'FBC'
      const logoNcc = logo.URL || '/Logo/FBC ONLY LOGO NO TEXT.png'
      nccInfo.value = { name: tenNcc, logo: logoNcc }
      localStorage.setItem('NCC_NAME', tenNcc)
      localStorage.setItem('NCC_LOGO', logoNcc)
    }
  })

  expiredTimer = setInterval(checkExpiredSilently, 120_000)
  document.addEventListener('visibilitychange', onVisibilityChange)
  document.addEventListener('scroll', onAdminMobileScroll, { passive: true, capture: true })
  window.addEventListener('scroll', onAdminMobileScroll, { passive: true })
  detachZeroInputBehavior = attachAdminZeroInputBehavior()
})

function onAdminMobileScroll(e) {
  if (typeof window === 'undefined' || window.innerWidth > 768) {
    isMobileDockHidden.value = false
    return
  }
  if (mobileSidebarOpen.value) {
    isMobileDockHidden.value = false
    return
  }

  const target = e?.target
  const isDocOrWin = !target || target === document || target === document.documentElement || target === window

  if (isDocOrWin) {
    const curY = Math.max(0, window.scrollY || document.documentElement.scrollTop || 0)
    if (curY <= 24) {
      isMobileDockHidden.value = false
      lastWindowScrollY = curY
      return
    }
    const delta = curY - lastWindowScrollY
    if (delta > 10) {
      isMobileDockHidden.value = true
      lastWindowScrollY = curY
    } else if (delta < -8) {
      isMobileDockHidden.value = false
      lastWindowScrollY = curY
    }
    return
  }

  if (typeof target.scrollTop !== 'number') return
  // Ignore tiny horizontal/dropdown scrollers inside forms or modals
  const isVerticalMainScroll =
    target.classList?.contains('crm-main') ||
    (target.clientHeight >= 240 && target.scrollHeight - target.clientHeight > 40)
  if (!isVerticalMainScroll) return

  const curTop = Math.max(0, target.scrollTop)
  if (curTop <= 24) {
    isMobileDockHidden.value = false
    lastScrollTopByTarget.set(target, curTop)
    return
  }
  if (!lastScrollTopByTarget.has(target)) {
    lastScrollTopByTarget.set(target, curTop)
    isMobileDockHidden.value = true
    return
  }
  const prevTop = lastScrollTopByTarget.get(target)
  const delta = curTop - prevTop
  if (delta > 10) {
    isMobileDockHidden.value = true
    lastScrollTopByTarget.set(target, curTop)
  } else if (delta < -8) {
    isMobileDockHidden.value = false
    lastScrollTopByTarget.set(target, curTop)
  }
}

watch(
  () => route.fullPath,
  () => {
    isMobileDockHidden.value = false
  },
)

const onVisibilityChange = () => {
  if (document.visibilityState === 'visible') {
    loadPendingOrders()
  }
}

onUnmounted(() => {
  if (expiredTimer) {
    clearInterval(expiredTimer)
    expiredTimer = null
  }
  if (unsubDonHang) {
    unsubDonHang()
    unsubDonHang = null
  }
  if (unsubLogo) {
    unsubLogo()
    unsubLogo = null
  }
  if (unsubAuth) {
    unsubAuth()
    unsubAuth = null
  }
  if (newOrderAlertTimer) {
    clearTimeout(newOrderAlertTimer)
    newOrderAlertTimer = null
  }
  window.removeEventListener('pointerdown', unlockAdminAudio)
  window.removeEventListener('keydown', unlockAdminAudio)
  document.removeEventListener('visibilitychange', onVisibilityChange)
  document.removeEventListener('scroll', onAdminMobileScroll, { capture: true })
  window.removeEventListener('scroll', onAdminMobileScroll)
  if (detachZeroInputBehavior) {
    detachZeroInputBehavior()
    detachZeroInputBehavior = null
  }
  if (typeof document !== 'undefined') {
    document.documentElement.classList.remove('admin-shell-active')
    const themeMeta = document.querySelector('meta[name="theme-color"]')
    if (themeMeta) {
      if (createdThemeColorMeta) {
        themeMeta.remove()
      } else if (prevThemeColorContent !== null) {
        themeMeta.setAttribute('content', prevThemeColorContent)
      }
    }
    document.title = adminBaseTitle.value
  }
})
</script>

<template>
  <div class="admin-layout" :class="{ collapsed: !sidebarOpen }">
    <!-- DESKTOP SIDEBAR (LEFT) -->
    <aside class="crm-sidebar desktop-only">
      <div class="brand">
        <div class="brand-logo">
          <img :src="nccInfo.logo" alt="Logo" class="logo-img" />
          <span class="brand-text">{{ nccInfo.name }}</span>
        </div>
        <button class="toggle-btn" @click="sidebarOpen = !sidebarOpen">
          {{ sidebarOpen ? '◀' : '▶' }}
        </button>
      </div>

      <nav class="menu">
        <!-- ========== QUẢN LÝ BÁN HÀNG ========== -->
        <div class="menu-section-title">
          <i class="ri-shopping-cart-2-fill"></i>
          <span>QUẢN LÝ BÁN HÀNG</span>
        </div>

       

        <RouterLink :to="{ name: 'nhap-hoa-don' }" class="menu-item">
          <i class="ri-file-list-3-fill"></i>
          <span>Nhập hóa đơn</span>
          <span v-if="pendingWebOrderCount > 0" class="badge-count is-web-badge">{{ pendingWebOrderCount }}</span>
        </RouterLink>

        <RouterLink :to="{ name: 'nhap-hang' }" class="menu-item">
          <i class="ri-folder-add-fill"></i>
          <span>Nhập hàng ( WEB & KHO )</span>
        </RouterLink>

        <RouterLink to="/admin/chi-phi-phat-sinh" class="menu-item">
          <i class="ri-money-dollar-circle-line"></i>
          <span>Chi phí chi tiêu</span>
        </RouterLink>
 <RouterLink :to="{ name: 'admin-don-hang' }" class="menu-item">
          <i class="ri-shopping-bag-3-fill"></i>
          <span>Đơn hàng</span>
          <span v-if="pendingOrderCount > 0" class="badge-count">{{ pendingOrderCount }}</span>
        </RouterLink>
        <div class="menu-divider"></div>

        <!-- ========== QUẢN LÝ KHO & KHÁCH ========== -->
        <div class="menu-section-title">
          <i class="ri-database-2-fill"></i>
          <span>KHO & KHÁCH HÀNG</span>
        </div>

        <RouterLink :to="{ name: 'kho-hang' }" class="menu-item">
          <i class="ri-store-2-fill"></i>
          <span>Kho hàng</span>
        </RouterLink>

        <RouterLink :to="{ name: 'admin-khach-hang' }" class="menu-item">
          <i class="ri-user-3-fill"></i>
          <span>Khách hàng</span>
        </RouterLink>

        <div class="menu-divider"></div>

        <!-- ========== BÁO CÁO ========== -->
        <div class="menu-section-title">
          <i class="ri-pie-chart-2-fill"></i>
          <span>BÁO CÁO</span>
        </div>

        <RouterLink :to="{ name: 'admin-bao-cao' }" class="menu-item">
          <i class="ri-bar-chart-2-fill"></i>
          <span>Báo cáo tổng hợp</span>
        </RouterLink>

        <RouterLink :to="{ name: 'admin-tinh-chiet-khau' }" class="menu-item">
          <i class="ri-percent-line"></i>
          <span>Tính chiết khấu</span>
        </RouterLink>

        <div class="menu-divider"></div>

        <!-- ========== NỘI DUNG WEBSITE ========== -->
        <div class="menu-section-title">
          <i class="ri-global-fill"></i>
          <span>NỘI DUNG WEBSITE</span>
        </div>

        <RouterLink :to="menuOnlineLink" class="menu-item">
          <i class="ri-layout-grid-fill"></i>
          <span>Menu Online</span>
        </RouterLink>

        <RouterLink to="/admin/banner" class="menu-item">
          <i class="ri-tv-2-fill"></i>
          <span>Banner</span>
        </RouterLink>

        <RouterLink :to="{ name: 'admin-partners' }" class="menu-item">
          <i class="ri-links-fill"></i>
          <span>Đối tác &amp; Web phụ</span>
        </RouterLink>

        <RouterLink :to="{ name: 'admin-sap-xep-hien-thi' }" class="menu-item">
          <i class="ri-arrow-up-down-line"></i>
          <span>Sắp xếp hiển thị</span>
        </RouterLink>

        <RouterLink :to="{ name: 'admin-cau-hinh-hien-thi' }" class="menu-item">
          <i class="ri-palette-fill"></i>
          <span>Giao diện & Màu sắc</span>
        </RouterLink>

        <RouterLink to="/admin/thong-bao" class="menu-item">
          <i class="ri-alert-fill"></i>
          <span>Thông báo</span>
        </RouterLink>

        <RouterLink to="/admin/logo" class="menu-item">
          <i class="ri-image-line"></i>
          <span>Logo &amp; SEO</span>
        </RouterLink>

        <RouterLink :to="{ name: 'admin-news-feed' }" class="menu-item">
          <i class="ri-newspaper-fill"></i>
          <span>Bảng tin &amp; Feedback</span>
        </RouterLink>

        <RouterLink to="/admin/bai-viet" class="menu-item">
          <i class="ri-article-line"></i>
          <span>Bài viết SEO (Blog)</span>
        </RouterLink>

        <RouterLink :to="{ name: 'admin-khuyen-mai' }" class="menu-item">
          <i class="ri-coupon-line"></i>
          <span>Khuyến mãi</span>
        </RouterLink>

        <div class="menu-divider"></div>

        <!-- ========== CẤU HÌNH HỆ THỐNG ========== -->
        <div class="menu-section-title">
          <i class="ri-settings-3-fill"></i>
          <span>CẤU HÌNH HỆ THỐNG</span>
        </div>

        <RouterLink :to="{ name: 'admin-open-time' }" class="menu-item">
          <i class="ri-24-hours-line"></i>
          <span>Giờ hoạt động</span>
        </RouterLink>

        <RouterLink :to="{ name: 'admin-contact-shop' }" class="menu-item">
          <i class="ri-contacts-book-2-fill"></i>
          <span>Thông tin liên hệ</span>
        </RouterLink>

        <RouterLink :to="{ name: 'admin-qr-banking' }" class="menu-item">
          <i class="ri-bank-card-fill"></i>
          <span>Ngân hàng & Tỉ giá</span>
        </RouterLink>

        <div class="menu-divider"></div>

        <button class="menu-item logout-btn" @click="logout">
          <i class="ri-logout-box-r-fill"></i>
          <span style="color: #ef4444; font-weight: bold;">ĐĂNG XUẤT</span>
        </button>
      </nav>
    </aside>

    <!-- MAIN CONTENT -->
    <main class="crm-main">
      <Transition name="admin-bell-toast">
        <div
          v-if="newOrderAlert"
          class="admin-web-order-toast"
          role="button"
          tabindex="0"
          @click="goToPendingWebOrders"
          @keydown.enter.prevent="goToPendingWebOrders"
        >
          <span class="awt-bell">🔔</span>
          <div class="awt-body">
            <div class="awt-title">
              {{
                newOrderAlert.isUpdate
                  ? (newOrderAlert.count > 1
                      ? `Khách vừa cập nhật ${newOrderAlert.count} đơn!`
                      : `Khách cập nhật đơn #${newOrderAlert.maHoaDon}`)
                  : (newOrderAlert.count > 1
                      ? `Có ${newOrderAlert.count} đơn web mới!`
                      : `Đơn web mới #${newOrderAlert.maHoaDon}`)
              }}
            </div>
            <div class="awt-sub">
              {{ newOrderAlert.tenKhach }} · Bấm để mở Nhập hóa đơn
            </div>
          </div>
          <button
            type="button"
            class="awt-close"
            aria-label="Đóng thông báo"
            @click.stop="dismissNewOrderAlert"
          >
            ✕
          </button>
        </div>
      </Transition>
      <RouterView v-slot="{ Component }">
        <KeepAlive>
          <component :is="Component" />
        </KeepAlive>
      </RouterView>
    </main>

    <!-- MOBILE BOTTOM BAR (FLOATING ROUNDED DOCK) -->
    <nav class="mobile-bottom-bar" :class="{ 'is-dock-hidden': isMobileDockHidden }">
      <RouterLink :to="{ name: 'nhap-hoa-don' }" class="bottom-bar-item">
        <div class="bottom-icon-wrap">
          <i class="ri-file-list-3-fill"></i>
          <span v-if="pendingWebOrderCount > 0" class="badge-count-mobile">{{ pendingWebOrderCount }}</span>
        </div>
        <span class="label">Nhập HĐ</span>
      </RouterLink>

      <RouterLink :to="{ name: 'admin-don-hang' }" class="bottom-bar-item">
        <div class="bottom-icon-wrap">
          <i class="ri-shopping-bag-3-fill"></i>
          <span v-if="pendingOrderCount > 0" class="badge-count-mobile">{{ pendingOrderCount }}</span>
        </div>
        <span class="label">Đơn hàng</span>
      </RouterLink>

      <RouterLink :to="{ name: 'admin-bao-cao' }" class="bottom-bar-item">
        <i class="ri-bar-chart-2-fill"></i>
        <span class="label">Báo cáo</span>
      </RouterLink>

      <button class="bottom-bar-item" @click="mobileSidebarOpen = true">
        <i class="ri-menu-fill"></i>
        <span class="label">Menu</span>
      </button>

      <div class="bottom-bar-item logo-item">
        <img :src="nccInfo.logo" alt="Logo" class="bottom-bar-logo" />
      </div>
    </nav>

    <!-- MOBILE SIDEBAR (RIGHT) - OVERLAY -->
    <div
      class="mobile-sidebar-overlay"
      :class="{ open: mobileSidebarOpen }"
      @click="closeMobileSidebar"
    ></div>

    <!-- MOBILE SIDEBAR (RIGHT) -->
    <aside class="mobile-sidebar" :class="{ open: mobileSidebarOpen }">
      <div class="mobile-sidebar-header">
        <div class="mobile-header-brand">
          <img :src="nccInfo.logo" alt="Logo" class="mobile-logo-img" />
          <h3>{{ nccInfo.name }}</h3>
        </div>
        <button class="close-btn" @click="closeMobileSidebar">✕</button>
      </div>

      <nav class="mobile-sidebar-menu">
        <!-- QUẢN LÝ BÁN HÀNG -->
        <div class="mobile-section-title">
          <i class="ri-shopping-cart-2-fill"></i>
          <span>QUẢN LÝ BÁN HÀNG</span>
        </div>

        <RouterLink :to="{ name: 'admin-don-hang' }" class="mobile-menu-item" @click="closeMobileSidebar">
          <i class="ri-shopping-bag-3-fill"></i>
          <span>Đơn hàng</span>
          <span v-if="pendingOrderCount > 0" class="badge-count">{{ pendingOrderCount }}</span>
        </RouterLink>

        <RouterLink :to="{ name: 'nhap-hoa-don' }" class="mobile-menu-item" @click="closeMobileSidebar">
          <i class="ri-file-list-3-fill"></i>
          <span>Nhập hóa đơn</span>
          <span v-if="pendingWebOrderCount > 0" class="badge-count is-web-badge">{{ pendingWebOrderCount }}</span>
        </RouterLink>

        <RouterLink :to="{ name: 'nhap-hang' }" class="mobile-menu-item" @click="closeMobileSidebar">
          <i class="ri-folder-add-fill"></i>
          <span>Nhập hàng ( WEB & KHO )</span>
        </RouterLink>

        <RouterLink to="/admin/chi-phi-phat-sinh" class="mobile-menu-item" @click="closeMobileSidebar">
          <i class="ri-money-dollar-circle-line"></i>
          <span>Chi phí phát sinh</span>
        </RouterLink>

        <div class="menu-divider"></div>

        <!-- KHO & KHÁCH HÀNG -->
        <div class="mobile-section-title">
          <i class="ri-database-2-fill"></i>
          <span>KHO & KHÁCH HÀNG</span>
        </div>

        <RouterLink :to="{ name: 'kho-hang' }" class="mobile-menu-item" @click="closeMobileSidebar">
          <i class="ri-store-2-fill"></i>
          <span>Kho hàng</span>
        </RouterLink>

        <RouterLink :to="{ name: 'admin-khach-hang' }" class="mobile-menu-item" @click="closeMobileSidebar">
          <i class="ri-user-3-fill"></i>
          <span>Khách hàng</span>
        </RouterLink>

        <div class="menu-divider"></div>

        <!-- BÁO CÁO -->
        <div class="mobile-section-title">
          <i class="ri-pie-chart-2-fill"></i>
          <span>BÁO CÁO</span>
        </div>

        <RouterLink :to="{ name: 'admin-bao-cao' }" class="mobile-menu-item" @click="closeMobileSidebar">
          <i class="ri-bar-chart-2-fill"></i>
          <span>Báo cáo tổng hợp</span>
        </RouterLink>

        <RouterLink :to="{ name: 'admin-tinh-chiet-khau' }" class="mobile-menu-item" @click="closeMobileSidebar">
          <i class="ri-percent-line"></i>
          <span>Tính chiết khấu</span>
        </RouterLink>

        <div class="menu-divider"></div>

        <!-- NỘI DUNG WEBSITE -->
        <div class="mobile-section-title">
          <i class="ri-global-fill"></i>
          <span>NỘI DUNG WEBSITE</span>
        </div>

        <RouterLink :to="menuOnlineLink" class="mobile-menu-item" @click="closeMobileSidebar">
          <i class="ri-layout-grid-fill"></i>
          <span>Menu Online</span>
        </RouterLink>

        <RouterLink to="/admin/banner" class="mobile-menu-item" @click="closeMobileSidebar">
          <i class="ri-tv-2-fill"></i>
          <span>Banner</span>
        </RouterLink>

        <RouterLink :to="{ name: 'admin-partners' }" class="mobile-menu-item" @click="closeMobileSidebar">
          <i class="ri-links-fill"></i>
          <span>Đối tác &amp; Web phụ</span>
        </RouterLink>

        <RouterLink :to="{ name: 'admin-sap-xep-hien-thi' }" class="mobile-menu-item" @click="closeMobileSidebar">
          <i class="ri-arrow-up-down-line"></i>
          <span>Sắp xếp hiển thị</span>
        </RouterLink>

        <RouterLink :to="{ name: 'admin-cau-hinh-hien-thi' }" class="mobile-menu-item" @click="closeMobileSidebar">
          <i class="ri-palette-fill"></i>
          <span>Giao diện & Màu sắc</span>
        </RouterLink>

        <RouterLink to="/admin/thong-bao" class="mobile-menu-item" @click="closeMobileSidebar">
          <i class="ri-alert-fill"></i>
          <span>Thông báo</span>
        </RouterLink>

        <RouterLink to="/admin/logo" class="mobile-menu-item" @click="closeMobileSidebar">
          <i class="ri-image-line"></i>
          <span>Logo &amp; SEO</span>
        </RouterLink>

        <RouterLink :to="{ name: 'admin-news-feed' }" class="mobile-menu-item" @click="closeMobileSidebar">
          <i class="ri-newspaper-fill"></i>
          <span>Bảng tin &amp; Feedback</span>
        </RouterLink>

        <RouterLink to="/admin/bai-viet" class="mobile-menu-item" @click="closeMobileSidebar">
          <i class="ri-article-line"></i>
          <span>Bài viết SEO (Blog)</span>
        </RouterLink>

        <RouterLink :to="{ name: 'admin-khuyen-mai' }" class="mobile-menu-item" @click="closeMobileSidebar">
          <i class="ri-coupon-line"></i>
          <span>Khuyến mãi</span>
        </RouterLink>

        <div class="menu-divider"></div>

        <!-- CẤU HÌNH HỆ THỐNG -->
        <div class="mobile-section-title">
          <i class="ri-settings-3-fill"></i>
          <span>CẤU HÌNH HỆ THỐNG</span>
        </div>

        <RouterLink :to="{ name: 'admin-open-time' }" class="mobile-menu-item" @click="closeMobileSidebar">
          <i class="ri-24-hours-line"></i>
          <span>Giờ hoạt động</span>
        </RouterLink>

        <RouterLink :to="{ name: 'admin-contact-shop' }" class="mobile-menu-item" @click="closeMobileSidebar">
          <i class="ri-contacts-book-2-fill"></i>
          <span>Thông tin liên hệ</span>
        </RouterLink>

        <RouterLink :to="{ name: 'admin-qr-banking' }" class="mobile-menu-item" @click="closeMobileSidebar">
          <i class="ri-bank-card-fill"></i>
          <span>Ngân hàng & Tỉ giá</span>
        </RouterLink>

        <div class="menu-divider"></div>

        <button class="mobile-menu-item logout-btn" @click="logout">
          <i class="ri-logout-box-r-fill"></i>
          <span>Đăng xuất</span>
        </button>
      </nav>
    </aside>
  </div>
</template>

<style scoped>
* {
  box-sizing: border-box;
}

.admin-layout {
  display: flex;
  height: 100vh;
  height: 100dvh;
  background: #0f172a;
  position: relative;
  overflow: hidden;
}

/* ================= DESKTOP SIDEBAR (LEFT) ================= */
.crm-sidebar {
  width: 280px;
  background: linear-gradient(135deg, #1e293b 0%, #0f172a 50%, #1e293b 100%);
  color: #e5e7eb;
  padding: 0;
  transform: translateX(0);
  transition: width 0.35s cubic-bezier(0.4, 0, 0.2, 1);
  will-change: width;
  z-index: 100;
  overflow: hidden;
  border-right: 2px solid rgba(34, 197, 94, 0.2);
  box-shadow: 4px 0 20px rgba(34, 197, 94, 0.1);
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.crm-sidebar::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 100%;
  background: linear-gradient(to bottom, 
    rgba(34, 197, 94, 0.05) 0%,
    transparent 20%,
    transparent 80%,
    rgba(34, 197, 94, 0.05) 100%);
  pointer-events: none;
  z-index: 0;
}

.admin-layout.collapsed .crm-sidebar {
  width: 80px;
}

.brand {
  position: relative;
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
  backdrop-filter: blur(10px);
  border-bottom: 2px solid rgba(34, 197, 94, 0.3);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
  flex-shrink: 0;
}

.brand-logo {
  display: flex;
  align-items: center;
  gap: 8px;
}

.logo-img {
  width: 32px;
  height: 32px;
  object-fit: contain;
  flex-shrink: 0;
  border-radius: 8px;
  filter: drop-shadow(0 0 12px rgba(34, 197, 94, 0.6))
          drop-shadow(0 0 24px rgba(34, 197, 94, 0.4))
          drop-shadow(0 0 36px rgba(34, 197, 94, 0.2));
  animation: logoGlow 3s ease-in-out infinite;
}

@keyframes logoGlow {
  0%, 100% {
    filter: drop-shadow(0 0 12px rgba(34, 197, 94, 0.6))
            drop-shadow(0 0 24px rgba(34, 197, 94, 0.4))
            drop-shadow(0 0 36px rgba(34, 197, 94, 0.2));
  }
  50% {
    filter: drop-shadow(0 0 16px rgba(34, 197, 94, 0.8))
            drop-shadow(0 0 32px rgba(34, 197, 94, 0.6))
            drop-shadow(0 0 48px rgba(34, 197, 94, 0.3));
  }
}

.brand-text {
  font-weight: 700;
  font-size: 16px;
  color: rgb(134, 239, 172);
  white-space: nowrap;
  overflow: hidden;
  letter-spacing: 1px;
  text-shadow: 0 0 10px rgba(34, 197, 94, 0.5);
}

.toggle-btn {
  background: rgba(34, 197, 94, 0.1);
  border: 1px solid rgba(34, 197, 94, 0.3);
  color: rgb(134, 239, 172);
  cursor: pointer;
  font-size: 14px;
  padding: 6px;
  flex-shrink: 0;
  transition: all 0.2s ease;
  border-radius: 6px;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.toggle-btn:hover {
  background: rgba(34, 197, 94, 0.2);
  border-color: rgb(34, 197, 94);
  box-shadow: 0 0 12px rgba(34, 197, 94, 0.4);
  transform: scale(1.1);
}

.admin-layout.collapsed .brand-text {
  display: none;
}

.admin-layout.collapsed .brand-logo {
  justify-content: center;
}

.menu {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 10px;
  min-height: 0;
}

.menu::-webkit-scrollbar {
  width: 6px;
}

.menu::-webkit-scrollbar-track {
  background: rgba(15, 23, 42, 0.5);
}

.menu::-webkit-scrollbar-thumb {
  background: rgba(34, 197, 94, 0.3);
  border-radius: 3px;
}

.menu::-webkit-scrollbar-thumb:hover {
  background: rgba(34, 197, 94, 0.5);
}

.menu-divider {
  height: 1px;
  background: linear-gradient(to right, 
    transparent, 
    rgba(34, 197, 94, 0.25), 
    transparent);
  margin: 6px 0;
  border-radius: 2px;
}

.menu-section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  font-size: 10px;
  text-transform: uppercase;
  color: rgb(134, 239, 172);
  font-weight: 700;
  letter-spacing: 1px;
  text-shadow: 0 0 8px rgba(34, 197, 94, 0.4);
  background: rgba(34, 197, 94, 0.08);
  border-radius: 6px;
  border-left: 3px solid rgb(34, 197, 94);
  margin-bottom: 2px;
}

.menu-section-title i {
  font-size: 12px;
  opacity: 0.9;
}

.menu-item,
.logout-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  color: #e5e7eb;
  text-decoration: none;
  border-radius: 8px;
  font-size: 12px;
  transition: all 0.3s ease;
  white-space: nowrap;
  background: transparent;
  border: 1px solid transparent;
  cursor: pointer;
  width: 100%;
  text-align: left;
  font-family: inherit;
  font-weight: 600;
  position: relative;
  overflow: hidden;
}

.menu-item::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  background: rgb(34, 197, 94);
  transform: scaleY(0);
  transition: transform 0.3s ease;
}

.menu-item:hover::before {
  transform: scaleY(1);
}

.menu-item i {
  font-size: 16px;
  width: 20px;
  text-align: center;
  flex-shrink: 0;
  transition: all 0.3s ease;
}

.menu-item:hover,
.logout-btn:hover {
  background: rgba(34, 197, 94, 0.15);
  border: 1px solid rgba(34, 197, 94, 0.4);
  color: rgb(134, 239, 172);
  transform: translateX(4px);
  box-shadow: 0 4px 12px rgba(34, 197, 94, 0.2);
}

.menu-item:hover i,
.logout-btn:hover i {
  transform: scale(1.1);
}

.menu-item.router-link-active {
  background: linear-gradient(135deg, 
    rgba(34, 197, 94, 0.2), 
    rgba(34, 197, 94, 0.15));
  border: 1px solid rgb(34, 197, 94);
  color: #fff;
  box-shadow: 
    0 4px 12px rgba(34, 197, 94, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
}

.menu-item.router-link-active::before {
  transform: scaleY(1);
}

/* Badge Count - Số đơn hàng đang xử lý */
.badge-count {
  margin-left: auto;
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  border-radius: 10px;
  background: linear-gradient(135deg, #ef4444, #dc2626);
  color: #fff;
  font-size: 11px;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(239, 68, 68, 0.4);
  animation: badgePulse 2s ease-in-out infinite;
}

@keyframes badgePulse {
  0%, 100% { 
    box-shadow: 0 2px 8px rgba(239, 68, 68, 0.4);
    transform: scale(1);
  }
  50% { 
    box-shadow: 0 2px 12px rgba(239, 68, 68, 0.6);
    transform: scale(1.05);
  }
}

.logout-btn:hover span {
  color: #fca5a5 !important;
}

.admin-layout.collapsed .menu-item span:not(.badge-count),
.admin-layout.collapsed .menu-section-title span {
  display: none;
}

.admin-layout.collapsed .menu-item .badge-count {
  position: absolute;
  top: 4px;
  right: 6px;
  min-width: 17px;
  height: 17px;
  padding: 0 4px;
  font-size: 10px;
}

.admin-layout.collapsed .menu-section-title {
  justify-content: center;
  padding: 6px;
}

.admin-layout.collapsed .menu-item {
  justify-content: center;
}

.admin-layout.collapsed .menu-item i {
  font-size: 18px;
}

.admin-layout.collapsed .menu-divider {
  margin: 4px 0;
}

/* ================= MAIN CONTENT ================= */
.crm-main {
  flex: 1;
  min-width: 0;
  min-height: 0;
  padding: 0;
  overflow: auto;
  background: #0f172a;
  color: #e2e8f0;
  transition: margin-left 0.35s cubic-bezier(0.4, 0, 0.2, 1);
}

/* ================= MOBILE ELEMENTS (HIDDEN ON DESKTOP) ================= */
.mobile-bottom-bar,
.mobile-sidebar,
.mobile-sidebar-overlay {
  display: none;
}

/* ================================================= */
/* ================= MOBILE MODE =================== */
/* ================================================= */
@media (max-width: 768px) {
  .desktop-only {
    display: none !important;
  }

  .admin-layout {
    flex-direction: column;
    height: 100%;
    height: 100dvh;
    overflow: hidden;
    background: #0f172a;
  }

  .crm-main {
    flex: 1;
    min-height: 0;
    height: 100%;
    padding: 0;
    background: #0f172a;
    overflow-y: auto;
    overflow-x: clip;
    overscroll-behavior-y: contain;
    -webkit-overflow-scrolling: touch;
  }

  /* ================= MOBILE BOTTOM BAR (LIQUID GLASS DOCK) ================= */
  .mobile-bottom-bar {
    display: flex;
    justify-content: space-around;
    align-items: center;
    position: fixed;
    bottom: calc(10px + env(safe-area-inset-bottom));
    left: 10px;
    right: 10px;
    max-width: 520px;
    margin: 0 auto;
    height: 64px;
    background: linear-gradient(
      165deg,
      rgba(30, 41, 59, 0.54) 0%,
      rgba(15, 23, 42, 0.4) 55%,
      rgba(30, 41, 59, 0.5) 100%
    );
    backdrop-filter: blur(26px) saturate(190%) brightness(1.08);
    -webkit-backdrop-filter: blur(26px) saturate(190%) brightness(1.08);
    border: 1px solid rgba(255, 255, 255, 0.24);
    border-radius: 999px;
    z-index: 1000;
    padding: 0 8px;
    box-shadow:
      0 16px 38px rgba(2, 6, 23, 0.56),
      0 0 0 1px rgba(34, 197, 94, 0.14),
      inset 0 1.5px 1px rgba(255, 255, 255, 0.34),
      inset 0 -1.5px 2px rgba(0, 0, 0, 0.36);
    transition: transform 0.28s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.22s ease;
    will-change: transform, opacity;
  }

  .mobile-bottom-bar::after {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    background: linear-gradient(
      180deg,
      rgba(255, 255, 255, 0.16) 0%,
      rgba(255, 255, 255, 0.02) 45%,
      rgba(255, 255, 255, 0.07) 100%
    );
    pointer-events: none;
    z-index: 0;
  }

  .mobile-bottom-bar.is-dock-hidden {
    transform: translateY(calc(100% + 28px));
    opacity: 0;
    pointer-events: none;
  }

  .bottom-bar-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 3px;
    flex: 1;
    height: 50px;
    padding: 4px 4px;
    color: #ffffff;
    text-decoration: none;
    border-radius: 999px;
    transition: all 0.25s ease;
    background: transparent;
    border: none;
    cursor: pointer;
    font-family: inherit;
    position: relative;
    z-index: 1;
  }

  .bottom-bar-item::before {
    content: '';
    position: absolute;
    bottom: 2px;
    left: 50%;
    transform: translateX(-50%);
    width: 0;
    height: 3px;
    border-radius: 999px;
    background: linear-gradient(to right, 
      transparent, 
      rgb(34, 197, 94), 
      transparent);
    transition: width 0.3s ease;
    box-shadow: 0 0 10px rgba(34, 197, 94, 0.6);
  }

  .bottom-bar-item.router-link-active::before {
    width: 56%;
  }

  .bottom-bar-item i {
    font-size: 21px;
    color: #ffffff;
    filter: drop-shadow(0 1px 3px rgba(0, 0, 0, 0.55));
    transition: all 0.3s ease;
  }

  /* Bottom bar icon wrapper for badge */
  .bottom-icon-wrap {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .bottom-icon-wrap i {
    font-size: 21px;
    color: #ffffff;
    filter: drop-shadow(0 1px 3px rgba(0, 0, 0, 0.55));
    transition: all 0.3s ease;
  }

  .badge-count-mobile {
    position: absolute;
    top: -6px;
    right: -10px;
    min-width: 18px;
    height: 18px;
    padding: 0 5px;
    border-radius: 9px;
    background: linear-gradient(135deg, #ef4444, #dc2626);
    color: #fff;
    font-size: 10px;
    font-weight: 800;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 2px 6px rgba(239, 68, 68, 0.5);
    animation: badgePulse 2s ease-in-out infinite;
  }

  .bottom-bar-item .label {
    font-size: 10.5px;
    font-weight: 700;
    text-align: center;
    color: #f8fafc;
    text-shadow: 0 1px 3px rgba(0, 0, 0, 0.55);
    line-height: 1.15;
    white-space: nowrap;
  }

  /* Logo item trong bottom bar */
  .bottom-bar-item.logo-item {
    flex: 0.6;
    cursor: default;
  }

  .bottom-bar-item.logo-item::before {
    display: none;
  }

  .bottom-bar-logo {
    width: 34px;
    height: 34px;
    object-fit: contain;
    border-radius: 999px;
    filter: drop-shadow(0 0 8px rgba(34, 197, 94, 0.5));
  }

  .bottom-bar-item:active {
    background: rgba(34, 197, 94, 0.15);
  }

  .bottom-bar-item.router-link-active {
    background: linear-gradient(180deg, rgba(255, 255, 255, 0.2) 0%, rgba(34, 197, 94, 0.16) 100%);
    border: 1px solid rgba(255, 255, 255, 0.24);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.36);
  }

  .bottom-bar-item.router-link-active i {
    color: rgb(134, 239, 172);
    transform: scale(1.15);
    filter: drop-shadow(0 0 8px rgba(34, 197, 94, 0.6));
  }

  .bottom-bar-item.router-link-active .label {
    color: rgb(134, 239, 172);
    text-shadow: 0 0 8px rgba(34, 197, 94, 0.4);
  }

  /* ================= MOBILE SIDEBAR OVERLAY ================= */
  .mobile-sidebar-overlay {
    display: block;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.75);
    z-index: 1100;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.3s ease;
    backdrop-filter: blur(4px);
  }

  .mobile-sidebar-overlay.open {
    opacity: 1;
    pointer-events: auto;
  }

  /* ================= MOBILE SIDEBAR (RIGHT) ================= */
  .mobile-sidebar {
    display: block;
    position: fixed;
    top: 0;
    right: 0;
    bottom: 0;
    width: 300px;
    max-width: 85vw;
    background: linear-gradient(135deg, #1e293b 0%, #0f172a 50%, #1e293b 100%);
    color: #e5e7eb;
    z-index: 1200;
    transform: translateX(100%);
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    will-change: transform;
    overflow-y: auto;
    box-shadow: -4px 0 20px rgba(34, 197, 94, 0.2);
    border-left: 2px solid rgba(34, 197, 94, 0.3);
  }

  .mobile-sidebar.open {
    transform: translateX(0);
  }

  .mobile-sidebar-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px 16px;
    border-bottom: 2px solid rgba(34, 197, 94, 0.3);
    position: sticky;
    top: 0;
    background: rgba(30, 41, 59, 0.95);
    backdrop-filter: blur(10px);
    z-index: 10;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }

  .mobile-header-brand {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .mobile-logo-img {
    width: 50px;
    height: 50px;
    object-fit: contain;
    flex-shrink: 0;
    border-radius: 10px;
    filter: drop-shadow(0 0 10px rgba(34, 197, 94, 0.6))
            drop-shadow(0 0 20px rgba(34, 197, 94, 0.4))
            drop-shadow(0 0 30px rgba(34, 197, 94, 0.2));
    animation: logoGlowMobile 3s ease-in-out infinite;
  }

  @keyframes logoGlowMobile {
    0%, 100% {
      filter: drop-shadow(0 0 10px rgba(34, 197, 94, 0.6))
              drop-shadow(0 0 20px rgba(34, 197, 94, 0.4))
              drop-shadow(0 0 30px rgba(34, 197, 94, 0.2));
    }
    50% {
      filter: drop-shadow(0 0 14px rgba(34, 197, 94, 0.8))
              drop-shadow(0 0 28px rgba(34, 197, 94, 0.6))
              drop-shadow(0 0 42px rgba(34, 197, 94, 0.3));
    }
  }

  .mobile-sidebar-header h3 {
    margin: 0;
    font-size: 18px;
    font-weight: 700;
    color: rgb(134, 239, 172);
    letter-spacing: 1px;
    text-shadow: 0 0 10px rgba(34, 197, 94, 0.5);
  }

  .close-btn {
    background: rgba(34, 197, 94, 0.1);
    border: 1px solid rgba(34, 197, 94, 0.3);
    color: rgb(134, 239, 172);
    font-size: 24px;
    cursor: pointer;
    padding: 4px 8px;
    line-height: 1;
    transition: all 0.2s ease;
    border-radius: 8px;
  }

  .close-btn:active {
    background: rgba(34, 197, 94, 0.2);
    transform: scale(0.95);
  }

  .mobile-sidebar-menu {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 12px;
  }

  .mobile-section-title {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 12px;
    font-size: 11px;
    text-transform: uppercase;
    color: rgb(134, 239, 172);
    font-weight: 700;
    letter-spacing: 1.2px;
    text-shadow: 0 0 8px rgba(34, 197, 94, 0.4);
    background: rgba(34, 197, 94, 0.08);
    border-radius: 8px;
    border-left: 3px solid rgb(34, 197, 94);
    margin-top: 4px;
    margin-bottom: 4px;
  }

  .mobile-section-title i {
    font-size: 14px;
    opacity: 0.9;
  }

  .mobile-menu-item {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 14px 16px;
    color: #e5e7eb;
    text-decoration: none;
    border-radius: 10px;
    font-size: 14px;
    font-weight: 600;
    transition: all 0.3s ease;
    background: transparent;
    border: 1px solid transparent;
    cursor: pointer;
    width: 100%;
    text-align: left;
    font-family: inherit;
    position: relative;
    overflow: hidden;
  }

  .mobile-menu-item::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 4px;
    background: rgb(34, 197, 94);
    transform: scaleY(0);
    transition: transform 0.3s ease;
  }

  .mobile-menu-item:active::before {
    transform: scaleY(1);
  }

  .mobile-menu-item i {
    font-size: 18px;
    width: 24px;
    text-align: center;
    flex-shrink: 0;
    transition: all 0.3s ease;
  }

  .mobile-menu-item:active {
    background: rgba(34, 197, 94, 0.15);
    border: 1px solid rgba(34, 197, 94, 0.4);
    color: rgb(134, 239, 172);
    transform: translateX(4px);
  }

  .mobile-menu-item:active i {
    transform: scale(1.1);
  }

  .mobile-menu-item.router-link-active {
    background: linear-gradient(135deg, 
      rgba(34, 197, 94, 0.2), 
      rgba(34, 197, 94, 0.15));
    border: 1px solid rgb(34, 197, 94);
    color: #fff;
    box-shadow: 0 4px 12px rgba(34, 197, 94, 0.3);
  }

  .mobile-menu-item.router-link-active::before {
    transform: scaleY(1);
  }

  .mobile-menu-item.logout-btn:active span {
    color: #fca5a5;
  }
}

/* ================= NEW WEB ORDER BELL TOAST ================= */
.admin-web-order-toast {
  position: fixed;
  top: 16px;
  right: 18px;
  z-index: 9500;
  display: flex;
  align-items: center;
  gap: 12px;
  max-width: 340px;
  padding: 12px 14px;
  border-radius: 14px;
  background: linear-gradient(135deg, #0f172a, #1e293b);
  border: 1.5px solid #22c55e;
  box-shadow: 0 14px 36px rgba(15, 23, 42, 0.35), 0 0 0 3px rgba(34, 197, 94, 0.18);
  color: #ffffff;
  cursor: pointer;
}

.awt-bell {
  font-size: 22px;
  line-height: 1;
  animation: awtRing 0.8s ease-in-out infinite;
}

@keyframes awtRing {
  0%, 100% { transform: rotate(0deg); }
  20% { transform: rotate(16deg); }
  40% { transform: rotate(-14deg); }
  60% { transform: rotate(10deg); }
  80% { transform: rotate(-8deg); }
}

.awt-body {
  min-width: 0;
  flex: 1;
}

.awt-title {
  font-size: 13.5px;
  font-weight: 800;
  color: #86efac;
  line-height: 1.3;
}

.awt-sub {
  font-size: 12px;
  color: #cbd5e1;
  margin-top: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.awt-close {
  border: none;
  background: rgba(148, 163, 184, 0.16);
  color: #e2e8f0;
  width: 26px;
  height: 26px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 12px;
  flex-shrink: 0;
}

.admin-bell-toast-enter-active,
.admin-bell-toast-leave-active {
  transition: all 0.25s ease;
}

.admin-bell-toast-enter-from,
.admin-bell-toast-leave-to {
  opacity: 0;
  transform: translateY(-10px) scale(0.96);
}
</style>

<style>
html.admin-shell-active,
html.admin-shell-active body,
html.admin-shell-active #app,
html.admin-shell-active .app-root {
  width: 100%;
  height: 100%;
  height: 100dvh;
  min-height: 100%;
  margin: 0;
  padding: 0;
  overflow: hidden;
  overscroll-behavior: none;
  background: #0f172a !important;
  background-color: #0f172a !important;
}

@media (max-width: 768px) {
  html.admin-shell-active .crm-main > :not(.admin-web-order-toast) {
    min-height: 100% !important;
    box-sizing: border-box;
  }

  html.admin-shell-active .crm-main > :is(
    .admin-page,
    .bao-cao-page,
    .chi-phi-page,
    .ck-page,
    .page-container,
    .container,
    .page
  ) {
    padding-bottom: calc(84px + env(safe-area-inset-bottom));
  }
}
</style>