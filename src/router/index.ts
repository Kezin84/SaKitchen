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
import Login from '@/views/Login.vue'
import NhapHoaDon from '@/views/nhaphoadon.vue'
import DonHang from '@/views/donhang.vue'
import BaoCao from '@/views/baocao.vue'
import ChiPhiPhatSinh from '@/views/chiPhiPhatSinh.vue'

import KhachHang from '@/views/khachHang.vue'

import LandingPage from '@/views/LandingPage.vue'

const SUPPORTED_LANGS = ['vi', 'en', 'zh-CN', 'fil', 'ko']

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'landing',
      component: LandingPage,
      beforeEnter: (to) => {
        if ('ncc' in to.query) {
          const { ncc: _ncc, ...cleanQuery } = to.query
          return { path: '/', query: cleanQuery, replace: true }
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
        { path: 'banner', name: 'admin-banner', component: Banner },
        { path: 'sap-xep-hien-thi', name: 'admin-sap-xep-hien-thi', component: SapXepHienThi },
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
      path: '/:lang',
      name: 'menu-online',
      component: MenuOnline,
      beforeEnter: (to) => {
        const lang = String(to.params.lang || '')
        if (!SUPPORTED_LANGS.includes(lang)) {
          return { name: 'menu-online', params: { lang: 'vi' }, replace: true }
        }
        // Tương thích ngược: nếu khách mở link cũ có ?ncc=SA thì tự làm sạch URL về /:lang
        if ('ncc' in to.query) {
          const { ncc: _ncc, ...cleanQuery } = to.query
          return { name: 'menu-online', params: { lang }, query: cleanQuery, replace: true }
        }
      },
    },

    { path: '/:pathMatch(.*)*', redirect: '/vi' },
  ],
})

router.beforeEach((to, from, next) => {
  const user = JSON.parse(localStorage.getItem('user') || 'null')
  const isLoginPage = to.name === 'login'
  const isPublicMenu = to.name === 'menu-online' || to.name === 'menu-mobile'

  if (to.meta.requiresAuth && !user) {
    return next({ name: 'login' })
  }

  if (user && isLoginPage) {
    return next('/admin/kho-hang')
  }

  if (isPublicMenu || isLoginPage) {
    return next()
  }

  next()
})

export default router
