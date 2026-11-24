import { createRouter, createWebHistory } from 'vue-router'
import MenuOnline from '@/views/MenuOnline.vue'
import { getAuthorizedAdminUser } from '@/config/adminAuth'
import { setAppLocale } from '@/i18n'

const AdminLayout = () => import('@/layouts/AdminLayout.vue')
const Login = () => import('@/views/Login.vue')
const QRBanking = () => import('@/views/QRBanking.vue')
const NhapHang = () => import('@/views/nhapHang.vue')
const KhoHang = () => import('@/views/khoHang.vue')
const Banner = () => import('@/views/Banner.vue')
const Thongbao = () => import('@/views/Thongbao.vue')
const Logo = () => import('@/views/Logo.vue')
const Khuyenmai = () => import('@/views/Khuyenmai.vue')
const OpenTime = () => import('@/views/OpenTime.vue')
const ContactShop = () => import('@/views/ContactShop.vue')
const Partners = () => import('@/views/Partners.vue')
const SapXepHienThi = () => import('@/views/SapXepHienThi.vue')
const CauHinhHienThi = () => import('@/views/CauHinhHienThi.vue')
const NhapHoaDon = () => import('@/views/nhaphoadon.vue')
const DonHang = () => import('@/views/donhang.vue')
const BaoCao = () => import('@/views/baocao.vue')
const TinhChietKhau = () => import('@/views/TinhChietKhau.vue')
const ChiPhiPhatSinh = () => import('@/views/chiPhiPhatSinh.vue')
const KhachHang = () => import('@/views/khachHang.vue')

const SUPPORTED_LANGS = ['vi', 'en', 'zh-CN', 'fil', 'ko']

function getSavedLang() {
  try {
    const saved = localStorage.getItem('APP_LANG')
    if (saved && SUPPORTED_LANGS.includes(saved)) {
      return saved
    }
  } catch {
    // ignore storage errors
  }
  return 'vi'
}

function normalizeOrderQueryFromTelegram(rawQuery: Record<string, unknown>) {
  const { ncc: _ncc, tgWebAppStartParam, ...rest } = rawQuery || {}
  if (
    !rest.order &&
    typeof tgWebAppStartParam === 'string' &&
    tgWebAppStartParam.startsWith('order_')
  ) {
    const extracted = tgWebAppStartParam.slice('order_'.length).trim()
    if (extracted) {
      rest.order = extracted
    }
  }
  return rest as Record<string, string>
}

function menuLangGuard(to: {
  name?: string | symbol | null
  params: Record<string, string | string[]>
  query: Record<string, unknown>
  hash?: string
}) {
  const lang = String(to.params.lang || '')
  if (!SUPPORTED_LANGS.includes(lang)) {
    return {
      name: 'menu-online',
      params: { lang: 'vi' },
      query: normalizeOrderQueryFromTelegram(to.query),
      hash: to.hash,
      replace: true,
    }
  }
  // Tương thích ngược: nếu khách mở link cũ có ?ncc=SA hoặc ?tgWebAppStartParam=order_... thì chuẩn hóa URL
  if ('ncc' in to.query || 'tgWebAppStartParam' in to.query) {
    return {
      name: typeof to.name === 'string' ? to.name : 'menu-online',
      params: to.params,
      query: normalizeOrderQueryFromTelegram(to.query),
      hash: to.hash,
      replace: true,
    }
  }
}

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      redirect: (to) => {
        return {
          name: 'menu-online',
          params: { lang: getSavedLang() },
          query: normalizeOrderQueryFromTelegram(to.query as Record<string, unknown>),
          hash: to.hash,
        }
      },
    },
    {
      path: '/welcome',
      name: 'landing',
      component: () => import('@/views/LandingPage.vue'),
      beforeEnter: (to) => {
        if ('ncc' in to.query) {
          const { ncc: _ncc, ...cleanQuery } = to.query
          return { path: '/welcome', query: cleanQuery, replace: true }
        }
      },
    },
    { path: '/login', name: 'login', component: Login },
    {
      path: '/bang-tin/:postId?',
      name: 'news-feed',
      component: () => import('@/views/NewsFeed.vue'),
    },
    {
      path: '/blog',
      name: 'blog-list',
      component: () => import('@/views/BlogList.vue'),
    },
    {
      path: '/blog/:slug',
      name: 'blog-detail',
      component: () => import('@/views/BlogDetail.vue'),
    },

    {
      path: '/admin',
      component: AdminLayout,
      meta: { requiresAuth: true },
      children: [
        { path: '', redirect: '/admin/kho-hang' },
        { path: 'nhap-hoa-don', name: 'nhap-hoa-don', component: NhapHoaDon },
        {
          path: 'don-hang',
          name: 'admin-don-hang',
          component: DonHang
        },
        { path: 'khach-hang', name: 'admin-khach-hang', component: KhachHang },
        { path: 'nhap-hang', name: 'nhap-hang', component: NhapHang },
        { path: 'kho-hang', name: 'kho-hang', component: KhoHang },
        { path: 'chi-phi-phat-sinh', name: 'admin-chi-phi-phat-sinh', component: ChiPhiPhatSinh },
        {
          path: 'bao-cao',
          name: 'admin-bao-cao',
          component: BaoCao,
        },
        {
          path: 'tinh-chiet-khau',
          name: 'admin-tinh-chiet-khau',
          component: TinhChietKhau,
        },
        { path: 'banner', name: 'admin-banner', component: Banner },
        { path: 'doi-tac', name: 'admin-partners', component: Partners },
        { path: 'sap-xep-hien-thi', name: 'admin-sap-xep-hien-thi', component: SapXepHienThi },
        { path: 'cau-hinh-hien-thi', name: 'admin-cau-hinh-hien-thi', component: CauHinhHienThi },
        { path: 'thong-bao', name: 'admin-thong-bao', component: Thongbao },
        { path: 'logo', name: 'admin-logo', component: Logo },
        {
          path: 'bang-tin',
          name: 'admin-news-feed',
          component: () => import('@/views/AdminNewsFeed.vue'),
        },
        {
          path: 'bai-viet',
          name: 'admin-blog',
          component: () => import('@/views/AdminBlog.vue'),
        },
        { path: 'khuyen-mai', name: 'admin-khuyen-mai', component: Khuyenmai },
        { path: 'open-time', name: 'admin-open-time', component: OpenTime },
        { path: 'contact-shop', name: 'admin-contact-shop', component: ContactShop },
        { path: 'qr-banking', name: 'admin-qr-banking', component: QRBanking },
      ],
    },

    // Tương thích ngược từ đường dẫn /crm cũ sang /admin
    { path: '/crm', redirect: '/admin' },
    {
      path: '/crm/:subPath(.*)*',
      redirect: (to) => {
        const sub = Array.isArray(to.params.subPath)
          ? to.params.subPath.join('/')
          : String(to.params.subPath || '')
        return sub ? `/admin/${sub}` : '/admin'
      },
    },

    {
      path: '/:lang/:productSlug?/:productId?',
      name: 'menu-online',
      component: MenuOnline,
      beforeEnter: menuLangGuard,
    },
    {
      path: '/:lang/:parentCategory/:subCategory/:productSlug',
      name: 'menu-online-legacy',
      component: MenuOnline,
      beforeEnter: menuLangGuard,
    },

    { path: '/:pathMatch(.*)*', redirect: '/vi' },
  ],
})

router.beforeEach(async (to) => {
  const paramLang = typeof to.params?.lang === 'string' ? to.params.lang : ''
  const targetLang = SUPPORTED_LANGS.includes(paramLang) ? paramLang : getSavedLang()
  if (targetLang !== 'vi') {
    await setAppLocale(targetLang)
  }

  const requiresAuth = to.matched.some((record) => Boolean(record.meta?.requiresAuth))
  const isLoginPage = to.name === 'login'

  if (!requiresAuth && !isLoginPage) {
    return true
  }

  const adminUser = await getAuthorizedAdminUser()

  if (requiresAuth && !adminUser) {
    return { name: 'login' }
  }

  if (isLoginPage && adminUser) {
    return '/admin/kho-hang'
  }

  return true
})

export default router
