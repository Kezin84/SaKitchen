import { createRouter, createWebHistory } from 'vue-router'
import MenuOnline from '@/views/MenuOnline.vue'
import QRBanking from '@/views/QRBanking.vue'
import NhapHang from '@/views/nhapHang.vue'
import KhoHang from '@/views/khoHang.vue'
import AdminLayout from '@/layouts/AdminLayout.vue'
import Banner from '@/views/Banner.vue'
import Thongbao from '@/views/Thongbao.vue'
import Logo from '@/views/Logo.vue'
import Khuyenmai from '@/views/Khuyenmai.vue'
import OpenTime from '@/views/OpenTime.vue'
import ContactShop from '@/views/ContactShop.vue'
import SapXepHienThi from '@/views/SapXepHienThi.vue'
import CauHinhHienThi from '@/views/CauHinhHienThi.vue'
import Login from '@/views/Login.vue'
import NhapHoaDon from '@/views/nhaphoadon.vue'
import DonHang from '@/views/donhang.vue'
import BaoCao from '@/views/baocao.vue'
import TinhChietKhau from '@/views/TinhChietKhau.vue'
import ChiPhiPhatSinh from '@/views/chiPhiPhatSinh.vue'

import KhachHang from '@/views/khachHang.vue'
import { getAuthorizedAdminUser } from '@/config/adminAuth'

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

function menuLangGuard(to: {
  name?: string | symbol | null
  params: Record<string, string | string[]>
  query: Record<string, unknown>
}) {
  const lang = String(to.params.lang || '')
  if (!SUPPORTED_LANGS.includes(lang)) {
    return { name: 'menu-online', params: { lang: 'vi' }, replace: true }
  }
  // Tương thích ngược: nếu khách mở link cũ có ?ncc=SA thì tự làm sạch URL
  if ('ncc' in to.query) {
    const { ncc: _ncc, ...cleanQuery } = to.query
    return {
      name: typeof to.name === 'string' ? to.name : 'menu-online',
      params: to.params,
      query: cleanQuery as Record<string, string>,
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
        const { ncc: _ncc, ...cleanQuery } = to.query
        return {
          name: 'menu-online',
          params: { lang: getSavedLang() },
          query: cleanQuery,
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
        { path: 'sap-xep-hien-thi', name: 'admin-sap-xep-hien-thi', component: SapXepHienThi },
        { path: 'cau-hinh-hien-thi', name: 'admin-cau-hinh-hien-thi', component: CauHinhHienThi },
        { path: 'thong-bao', name: 'admin-thong-bao', component: Thongbao },
        { path: 'logo', name: 'admin-logo', component: Logo },
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
