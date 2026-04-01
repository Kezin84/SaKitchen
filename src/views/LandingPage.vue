<template>
  <div class="landing-page">
    <div class="bg-overlay"></div>
    <div class="sparkle-container">
      <div class="sparkle" v-for="n in 20" :key="n" :style="sparkleStyle(n)"></div>
    </div>

    <div class="landing-content">

      <!-- PHẦN TRÊN: Logo + Dịch vụ -->
      <div class="top-section">
        <div class="logo-radar stagger-1">
          <div class="radar-ring ring-1"></div>
          <div class="radar-ring ring-2"></div>
          <div class="radar-ring ring-3"></div>
          <div class="logo-wrapper" @click="goToMenu" style="cursor: pointer;">
            <img src="/logo-sa.jpg" alt="SA Kitchen" class="logo-img" />
          </div>
        </div>
        
        <div class="social-circle-row stagger-2">
          <a href="#" @click.prevent="goToMenu" class="social-circle-btn facebook" style="cursor: pointer;">
            <i class="ri-facebook-fill"></i>
          </a>
          <a href="#" @click.prevent="goToMenu" class="social-circle-btn telegram" style="cursor: pointer;">
            <i class="ri-telegram-fill"></i>
          </a>
        </div>

        <p class="hero-sub stagger-3">Cơm Văn Phòng · Món Nhậu · Tạp Hóa · Đi Chợ Hộ</p>
      </div>

      <!-- PHẦN GIỮA: Card Slider -->
      <div class="slider-section stagger-4">
        <div class="slider-viewport">
          <div 
            class="slide-card" 
            v-for="(img, i) in slides" 
            :key="i"
            :class="getCardClass(i)"
            @click="goToMenu"
            style="cursor: pointer;"
          >
            <img :src="img" :alt="'Món ' + (i+1)" draggable="false" />
          </div>
        </div>
        <div class="slider-dots">
          <span 
            v-for="(_, i) in slides" 
            :key="i" 
            class="dot" 
            :class="{ active: currentSlide === i }"
            @click="currentSlide = i; startAutoSlide()"
          ></span>
        </div>
      </div>

      <!-- PHẦN DƯỚI: Chips + CTA + Liên hệ -->
      <div class="bottom-section">
        <div class="info-chips">
          <div class="chip chip-time stagger-5" @click="goToMenu" style="cursor: pointer;">
            <span class="online-dot"></span> Online 24/24
          </div>
          <div class="chip accent stagger-5" @click="goToMenu" style="cursor: pointer;">
            <i class="ri-truck-fill"></i> Free ship 2700₱
          </div>
          <div class="chip chip-location stagger-5" @click="goToMenu" style="cursor: pointer;">
            <img src="https://flagcdn.com/w40/ph.png" alt="Philippines" class="flag-image" /> Manila
          </div>
        </div>

        <div class="stagger-6" style="width: 100%; display: flex; justify-content: center;">
          <button class="btn-main" @click.prevent="goToMenu">
            ĐẶT MÓN NGAY
          </button>
        </div>

        <div class="stagger-7" style="width: 100%; display: flex; justify-content: center;">
          <div class="payment-methods" @click="goToMenu" style="cursor: pointer;">
            <div class="pay-card bank">
              <i class="ri-bank-card-fill"></i> NGÂN HÀNG
            </div>
          <div class="pay-circles">
            <div class="pay-circle gcash" title="GCash">
              G
            </div>
            <div class="pay-circle usdt" title="USDT">
              ₮
            </div>
          </div>
        </div>
        </div>

        <p class="copyright stagger-8">© 2026 SA KITCHEN · Manila, Philippines</p>
      </div>
    </div>

    <!-- Live Toast (Chỉ hiện trên PC) -->
    <div class="toast-container">
      <transition-group name="slide-toast">
        <div v-for="toast in activeToasts" :key="toast.id" class="live-toast" @click="goToMenu">
          <div class="toast-avatar">
            <i class="ri-check-line"></i>
          </div>
          <div class="toast-content">
            <p class="toast-title">{{ toast.phone }} <span>vừa đặt món thành công.</span></p>
            <p class="toast-desc">Cách đây vài giây</p>
          </div>
          <div class="toast-close" @click.stop="removeToast(toast.id)">
            <i class="ri-close-line"></i>
          </div>
        </div>
      </transition-group>
    </div>
  </div>
</template>

<script setup>
import { useRouter, useRoute } from 'vue-router'
import { ref, onMounted, onUnmounted } from 'vue'

const router = useRouter()
const route = useRoute()

const slides = [
  '/slide-6.jpg',
  '/slide-7.jpg',
  '/slide-1.jpg',
  '/slide-2.jpg',
  '/slide-3.jpg',
  '/slide-4.jpg',
  '/slide-5.jpg',
]

const currentSlide = ref(0)
let timer = null

function startAutoSlide() {
  if (timer) clearInterval(timer)
  timer = setInterval(() => {
    currentSlide.value = (currentSlide.value + 1) % slides.length
  }, 2000)
}

function getCardClass(i) {
  const len = slides.length
  const offset = (i - currentSlide.value + len) % len
  
  if (offset === 0) return 'active'
  if (offset === 1) return 'next'
  if (offset === 2) return 'next2'
  if (offset === len - 1) return 'prev'
  if (offset === len - 2) return 'prev2'
  
  return 'hidden'
}

// Logic cho Toast đặt món (Social Proof) - Chế độ "Bão Đơn"
const activeToasts = ref([])
let toastIdCounter = 0
let toastTimer = null

function triggerFakeOrderBurst() {
  const numOrders = Math.floor(Math.random() * 3) + 2 // Random từ 2 tới 4 (trung bình 3 khách)
  
  for (let i = 0; i < numOrders; i++) {
    setTimeout(() => {
      const prefixes = ['09', '08', '03', '07', '05']
      const pIdx = Math.floor(Math.random() * prefixes.length)
      const p1 = Math.floor(10 + Math.random() * 89)
      const p2 = Math.floor(10 + Math.random() * 89)
      const phone = `${prefixes[pIdx]}${p1}${p2}******`
      
      const id = toastIdCounter++
      activeToasts.value.unshift({ id, phone }) // push lên đầu
      
      // Tự động xóa order khỏi mảng sau ngẫu nhiên 5-8 giây
      setTimeout(() => {
        removeToast(id)
      }, 5000 + (Math.random() * 3000))
    }, i * (Math.random() * 400 + 300)) // Cách nhau ngẫu nhiên từ 300-700ms
  }
}

function removeToast(id) {
  activeToasts.value = activeToasts.value.filter(t => t.id !== id)
}

onMounted(() => {
  startAutoSlide()
  
  // Khởi chạy vòng lặp tạo "bão đơn hàng" ảo mỗi 15 giây
  toastTimer = setInterval(() => {
    triggerFakeOrderBurst()
  }, 15000)
  
  // Đặc biệt: Phun bão đơn ngay khi KH vừa vào web (sau 2 giây)
  setTimeout(() => triggerFakeOrderBurst(), 2000)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
  if (toastTimer) clearInterval(toastTimer)
})

function sparkleStyle(n) {
  const left = Math.random() * 100
  const size = 4 + Math.random() * 8
  const delay = Math.random() * 6
  const duration = 4 + Math.random() * 5
  return {
    left: left + '%',
    bottom: '-10px',
    width: size + 'px',
    height: size + 'px',
    animationDelay: delay + 's',
    animationDuration: duration + 's'
  }
}

function goToMenu() {
  const ncc = route.query.ncc || 'SA'
  router.push({ path: '/vi', query: { ncc } })
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap');

* { box-sizing: border-box; margin: 0; padding: 0; }

.landing-page {
  width: 100vw;
  height: 100vh;
  font-family: 'Inter', system-ui, sans-serif;
  background-image: url('/bg-landing.jpg');
  background-size: 100% 100%;
  background-position: center;
  background-repeat: no-repeat;
  background-color: #0a2e14;
  position: relative;
  overflow: hidden;
  image-rendering: high-quality;
  -webkit-image-rendering: high-quality;
}

/* ===== Sparkle ===== */
.sparkle-container {
  position: absolute;
  inset: 0;
  z-index: 2;
  pointer-events: none;
  overflow: hidden;
}

.sparkle {
  position: absolute;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.5), rgba(74, 222, 128, 0.15));
  animation: steamRise ease-out infinite;
  filter: blur(2px);
}

@keyframes steamRise {
  0% {
    opacity: 0.6;
    transform: translateY(0) scale(1);
  }
  50% {
    opacity: 0.3;
  }
  100% {
    opacity: 0;
    transform: translateY(-100vh) scale(2.5);
  }
}

/* Overlay phủ toàn bộ trang */
.bg-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    180deg,
    rgba(6, 30, 14, 0.7) 0%,
    rgba(6, 30, 14, 0.5) 40%,
    rgba(6, 30, 14, 0.6) 65%,
    rgba(6, 30, 14, 0.95) 100%
  );
  z-index: 1;
  pointer-events: none;
}

/* Content */
.landing-content {
  position: absolute;
  inset: 0;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  padding: 4vh 24px 4vh;
}

.top-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding-top: 2vh;
}

.bottom-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  width: 100%;
  max-width: 520px;
}

/* ===== Slider ===== */
.slider-section {
  width: 100%;
  max-width: 600px;
  position: relative;
  overflow: visible;
}

.slider-viewport {
  position: relative;
  height: 340px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.slide-card {
  position: absolute;
  width: 260px;
  height: 340px;
  border-radius: 16px;
  overflow: hidden;
  border: 2px solid rgba(255, 255, 255, 0.4); /* Viền rõ hơn cho các card phụ */
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.4);
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  opacity: 0;
  transform: scale(0.7) translateX(0);
  z-index: 1;
  pointer-events: none;
}

.slide-card.active {
  opacity: 1;
  transform: scale(1) translateX(0);
  z-index: 5;
  border: 2.5px solid #4ade80;
  box-shadow: 
    0 0 15px rgba(74, 222, 128, 0.4),
    0 0 30px rgba(74, 222, 128, 0.2),
    inset 0 0 15px rgba(74, 222, 128, 0.1),
    0 12px 40px rgba(0, 0, 0, 0.5);
  pointer-events: auto;
  animation: borderGlow 2s ease-in-out infinite;
}

@keyframes borderGlow {
  0%, 100% {
    border-color: #4ade80;
    box-shadow: 
      0 0 15px rgba(74, 222, 128, 0.4),
      0 0 30px rgba(74, 222, 128, 0.2),
      inset 0 0 15px rgba(74, 222, 128, 0.1),
      0 12px 40px rgba(0, 0, 0, 0.5);
  }
  50% {
    border-color: #fff;
    box-shadow: 
      0 0 20px rgba(255, 255, 255, 0.5),
      0 0 40px rgba(74, 222, 128, 0.3),
      inset 0 0 20px rgba(255, 255, 255, 0.08),
      0 12px 40px rgba(0, 0, 0, 0.5);
  }
}

.slide-card.prev {
  opacity: 0.8;
  transform: scale(0.85) translateX(-220px);
  z-index: 4;
  filter: brightness(0.5);
  pointer-events: auto;
}

.slide-card.next {
  opacity: 0.8;
  transform: scale(0.85) translateX(220px);
  z-index: 4;
  filter: brightness(0.5);
  pointer-events: auto;
}

.slide-card.prev2 {
  opacity: 0.4;
  transform: scale(0.7) translateX(-420px);
  z-index: 3;
  filter: brightness(0.3);
  pointer-events: auto;
}

.slide-card.next2 {
  opacity: 0.4;
  transform: scale(0.7) translateX(420px);
  z-index: 3;
  filter: brightness(0.3);
  pointer-events: auto;
}

.slide-card.hidden {
  opacity: 0;
  transform: scale(0.5) translateX(0);
  z-index: 1;
  pointer-events: none;
}

.slide-card img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.slider-dots {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-top: 12px;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.25);
  cursor: pointer;
  transition: all 0.3s ease;
}

.dot.active {
  background: #4ade80;
  box-shadow: 0 0 8px rgba(74, 222, 128, 0.6);
  transform: scale(1.3);
}

/* ===== Logo + Radar ===== */
.logo-radar {
  position: relative;
  width: 130px;
  height: 130px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 8px;
}

.radar-ring {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 110px;
  height: 110px;
  border-radius: 24px;
  border: 2.5px solid rgba(74, 222, 128, 0.7);
  box-shadow: 0 0 15px rgba(255, 255, 255, 0.15), 0 0 8px rgba(74, 222, 128, 0.4);
  animation: radarPulse 2.5s ease-out infinite;
  pointer-events: none;
}

.ring-2 {
  animation-delay: 0.8s;
}

.ring-3 {
  animation-delay: 1.6s;
}

@keyframes radarPulse {
  0% {
    width: 110px;
    height: 110px;
    opacity: 1;
    border-color: rgba(74, 222, 128, 0.8);
    box-shadow: 0 0 15px rgba(255, 255, 255, 0.3), 0 0 10px rgba(74, 222, 128, 0.5);
  }
  50% {
    border-color: rgba(255, 255, 255, 0.3);
    box-shadow: 0 0 20px rgba(255, 255, 255, 0.15), 0 0 15px rgba(74, 222, 128, 0.2);
  }
  100% {
    width: 280px;
    height: 280px;
    opacity: 0;
    border-color: rgba(255, 255, 255, 0);
    box-shadow: 0 0 0 rgba(255, 255, 255, 0);
  }
}

.logo-wrapper {
  width: 110px;
  height: 110px;
  border-radius: 24px;
  overflow: hidden;
  border: 3px solid rgba(74, 222, 128, 0.6);
  box-shadow:
    0 0 20px rgba(34, 197, 94, 0.4),
    0 0 50px rgba(34, 197, 94, 0.2);
  position: relative;
  z-index: 3;
  animation: logoBeat 2.5s ease-out infinite;
}

@keyframes logoBeat {
  0%, 100% { transform: scale(1); box-shadow: 0 0 20px rgba(34, 197, 94, 0.4); }
  10% { transform: scale(1.08); box-shadow: 0 0 35px rgba(34, 197, 94, 0.7); }  /* Nhịp 1 - Khớp vòng 1 */
  32% { transform: scale(1); box-shadow: 0 0 20px rgba(34, 197, 94, 0.4); }     /* 32% ~ 0.8s */
  42% { transform: scale(1.08); box-shadow: 0 0 35px rgba(34, 197, 94, 0.7); }  /* Nhịp 2 - Khớp vòng 2 */
  64% { transform: scale(1); box-shadow: 0 0 20px rgba(34, 197, 94, 0.4); }     /* 64% ~ 1.6s */
  74% { transform: scale(1.08); box-shadow: 0 0 35px rgba(34, 197, 94, 0.7); }  /* Nhịp 3 - Khớp vòng 3 */
  96% { transform: scale(1); box-shadow: 0 0 20px rgba(34, 197, 94, 0.4); }
}

.logo-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

/* ===== Heading ===== */
.hero-heading {
  display: flex;
  flex-direction: row;
  align-items: baseline;
  gap: 10px;
  text-align: center;
  line-height: 1;
  flex-wrap: wrap;
  justify-content: center;
}

.brand-name {
  font-size: 28px;
  font-weight: 900;
  letter-spacing: 4px;
  text-transform: uppercase;
  color: #4ade80;
  text-shadow:
    0 0 10px rgba(74, 222, 128, 0.8),
    0 0 30px rgba(74, 222, 128, 0.5),
    0 0 60px rgba(74, 222, 128, 0.3);
}

.hero-dash { display: none; }

.hero-title {
  font-size: 16px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.75);
  letter-spacing: 2px;
  text-transform: uppercase;
}

.hero-sub {
  font-size: 22px;
  font-weight: 800;
  letter-spacing: 3px;
  text-transform: uppercase;
  color: #facc15; /* Màu vàng thuần */
  animation: pulseGold 1.5s ease-in-out infinite alternate;
  text-align: center;
}

@keyframes pulseGold {
  0% {
    text-shadow: 0 0 5px rgba(250, 204, 21, 0.2);
  }
  100% {
    text-shadow: 0 0 15px rgba(250, 204, 21, 0.8), 0 0 25px rgba(250, 204, 21, 0.4);
  }
}


/* ===== Info Chips ===== */
.info-chips {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: center;
  margin-top: 2px;
}

.chip {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 6px 14px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  color: #86efac;
  background: rgba(34, 197, 94, 0.1);
  border: 1px solid rgba(34, 197, 94, 0.2);
}

.chip.accent {
  position: relative;
  overflow: hidden;
  background: linear-gradient(135deg, rgba(234, 179, 8, 0.15), rgba(180, 83, 9, 0.4));
  border: 1px solid rgba(250, 204, 21, 0.4);
  color: #fde047;
  font-size: 13px;
  font-weight: 800;
  letter-spacing: 1px;
  padding: 8px 18px;
  box-shadow: 
    0 4px 15px rgba(234, 179, 8, 0.2),
    inset 0 1px 1px rgba(255, 255, 255, 0.2);
  text-shadow: 0 0 8px rgba(250, 204, 21, 0.3);
  animation: freeshipPulse 2.5s infinite;
}

.chip.accent::after {
  content: '';
  position: absolute;
  top: 0; left: -100%;
  width: 50%; height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.7), transparent);
  transform: skewX(-20deg);
  animation: freeshipShimmer 3s infinite;
}

@keyframes freeshipPulse {
  0%, 100% {
    box-shadow: 0 4px 15px rgba(234, 179, 8, 0.2), inset 0 1px 1px rgba(255, 255, 255, 0.2);
    border-color: rgba(250, 204, 21, 0.3);
  }
  50% {
    box-shadow: 0 4px 25px rgba(234, 179, 8, 0.6), inset 0 1px 2px rgba(255, 255, 255, 0.5);
    border-color: rgba(250, 204, 21, 0.9);
  }
}

@keyframes freeshipShimmer {
  0%, 40% { left: -100%; }
  100% { left: 200%; }
}

.chip i {
  font-size: 14px;
}

.online-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: #4ade80;
  box-shadow: 0 0 8px #4ade80;
  animation: dotPulse 2s infinite;
  margin-right: 2px;
}

@keyframes dotPulse {
  0% { box-shadow: 0 0 0 0 rgba(74, 222, 128, 0.7); }
  70% { box-shadow: 0 0 0 8px rgba(74, 222, 128, 0); }
  100% { box-shadow: 0 0 0 0 rgba(74, 222, 128, 0); }
}

.flag-image {
  width: 18px;
  height: auto;
  border-radius: 2px;
  margin-right: 4px;
}

/* ===== CTA chính ===== */
.btn-main {
  width: 100%;
  max-width: 420px;
  padding: 18px 0;
  font-family: 'Inter', sans-serif;
  font-size: 20px;
  font-weight: 900;
  letter-spacing: 2px;
  text-transform: uppercase;
  color: #fff;
  background: linear-gradient(180deg, #4ade80 0%, #16a34a 100%);
  border: none;
  border-radius: 999px;
  cursor: pointer;
  box-shadow:
    0 6px 25px rgba(22, 163, 74, 0.5),
    inset 0 1px 0 rgba(255, 255, 255, 0.25);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  margin-top: 6px;
  animation: btnHeartbeat 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

.btn-main::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg, transparent, rgba(255,255,255,0.4), transparent
  );
  animation: btnSweep 3s ease-out infinite;
}

@keyframes btnSweep {
  0%, 30% { left: -100%; }
  100% { left: 200%; }
}

@keyframes btnHeartbeat {
  0%, 100% { 
    transform: scale(1);
    box-shadow: 0 6px 25px rgba(22, 163, 74, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.25);
  }
  15% {
    transform: scale(1.06);
    box-shadow: 0 12px 35px rgba(22, 163, 74, 0.7), inset 0 1px 0 rgba(255, 255, 255, 0.4);
  }
  25% {
    transform: scale(1);
    box-shadow: 0 6px 25px rgba(22, 163, 74, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.25);
  }
  35% {
    transform: scale(1.03);
    box-shadow: 0 10px 30px rgba(22, 163, 74, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.3);
  }
  50% {
    transform: scale(1);
    box-shadow: 0 6px 25px rgba(22, 163, 74, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.25);
  }
}

.btn-main:hover {
  animation-play-state: paused;
  transform: translateY(-3px) scale(1.02);
  box-shadow:
    0 12px 40px rgba(22, 163, 74, 0.6),
    inset 0 1px 0 rgba(255, 255, 255, 0.3);
}

.btn-main:active {
  transform: translateY(0) scale(0.98);
}

/* ===== Mạng Xã Hội Tròn ===== */
.social-circle-row {
  display: flex;
  gap: 15px;
  justify-content: center;
  position: relative;
  z-index: 5;
  margin-top: -2px;
  margin-bottom: 6px;
}

.social-circle-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  color: #fff;
  text-decoration: none;
  font-size: 24px;
  border: 1.5px solid rgba(255, 255, 255, 0.2);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  animation: iconBeat 2.5s ease-out infinite;
}

@keyframes iconBeat {
  0%, 100% { transform: scale(1); }
  10% { transform: scale(1.08); }
  32% { transform: scale(1); }
  42% { transform: scale(1.08); }
  64% { transform: scale(1); }
  74% { transform: scale(1.08); }
  96% { transform: scale(1); }
}

.social-circle-btn.facebook {
  background: linear-gradient(135deg, #1877F2, #0d5cbe);
  box-shadow: 0 4px 15px rgba(24, 119, 242, 0.4);
}

.social-circle-btn.telegram {
  background: linear-gradient(135deg, #0088cc, #005a88);
  box-shadow: 0 4px 15px rgba(0, 136, 204, 0.4);
}

.social-circle-btn:hover {
  animation-play-state: paused;
  transform: scale(1.15) !important;
  border-color: rgba(255, 255, 255, 0.5);
}

.social-circle-btn.facebook:hover {
  box-shadow: 0 8px 25px rgba(24, 119, 242, 0.6);
}

.social-circle-btn.telegram:hover {
  box-shadow: 0 8px 25px rgba(0, 136, 204, 0.6);
}

/* ===== Thanh toán ===== */
.payment-methods {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  width: 100%;
  max-width: 420px;
  margin-top: 2px;
}

.pay-card {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  color: #fff;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 1px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
}

.pay-card i {
  font-size: 18px;
  color: #fbbf24;
}

.pay-circles {
  display: flex;
  gap: 8px;
}

.pay-circle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  border-radius: 50%;
  font-size: 18px;
  font-weight: 900;
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
}

.pay-circle.gcash {
  background: linear-gradient(135deg, #0054a5, #0074d9);
}

.pay-circle.usdt {
  background: linear-gradient(135deg, #26A17B, #1ca073);
  font-size: 20px;
}

/* ===== Copyright ===== */
.copyright {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.18);
  letter-spacing: 1px;
}

/* ===== MOBILE ===== */
@media (max-width: 600px) {
  .landing-content {
    padding: 0 20px 3vh;
    gap: 10px;
  }

  .logo-wrapper {
    width: 90px;
    height: 90px;
    border-radius: 20px;
  }

  .hero-heading {
    flex-wrap: nowrap;
    white-space: nowrap;
    gap: 6px;
  }

  .brand-name {
    font-size: 16px;
    letter-spacing: 2px;
  }

  .hero-dash {
    display: none;
  }

  .hero-title {
    font-size: 10px;
    letter-spacing: 1px;
  }

  .hero-sub {
    font-size: 11px;
    letter-spacing: 2px;
  }

  .chip {
    font-size: 11px;
    padding: 5px 10px;
  }

  .btn-main {
    padding: 16px 0;
    font-size: 17px;
  }

  .btn-secondary {
    padding: 12px 0;
    font-size: 12px;
  }

  .payment-methods {
    gap: 8px;
  }
  .pay-card {
    padding: 8px 14px;
    font-size: 11px;
  }
  .pay-card i {
    font-size: 16px;
  }
  .pay-circle {
    width: 32px;
    height: 32px;
    font-size: 14px;
  }
  .pay-circle.usdt {
    font-size: 16px;
  }
}

/* ===== PC: Nút mạng xã hội góc phải & Radar ===== */
@media (min-width: 768px) {
  /* Di chuyển Info Chips lên góc trái - Khẳng định Đẳng cấp VIP */
  .chip-time, .chip-location {
    position: fixed;
    left: 45px;
    z-index: 100;
    
    /* Giao diện Glassmorphism Cực VIP */
    padding: 14px 30px;
    background: linear-gradient(135deg, rgba(30, 30, 30, 0.85), rgba(10, 10, 10, 0.95));
    backdrop-filter: blur(25px);
    -webkit-backdrop-filter: blur(25px);
    border-radius: 999px; /* Góc bo tròn mượt đỉnh cấp */
    border: 1px solid rgba(255, 255, 255, 0.1);
    
    font-size: 15px;
    font-weight: 800;
    letter-spacing: 3px;
    text-transform: uppercase;
    color: #f8fafc;
    display: flex;
    align-items: center;
    overflow: hidden;
  }

  /* Hiệu ứng quét sáng (Shimmer) VIP VIP */
  .chip-time::after, .chip-location::after {
    content: '';
    position: absolute;
    top: 0; left: -100%;
    width: 60%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent);
    transform: skewX(-20deg);
    animation: vipShimmer 4s infinite;
  }
  
  .chip-time {
    top: 45px;
    box-shadow: 
      0 20px 40px rgba(0, 0, 0, 0.8),
      0 0 35px rgba(74, 222, 128, 0.25),
      inset 0 1px 1px rgba(255, 255, 255, 0.3),
      inset 0 0 15px rgba(74, 222, 128, 0.15);
    border: 1px solid rgba(74, 222, 128, 0.5);
    color: #4ade80; /* Màu chữ ngả xanh neon cực chảnh */
  }
  
  .chip-location {
    top: 115px;
    box-shadow: 
      0 20px 40px rgba(0, 0, 0, 0.8),
      0 0 35px rgba(250, 204, 21, 0.25),
      inset 0 1px 1px rgba(255, 255, 255, 0.3),
      inset 0 0 15px rgba(250, 204, 21, 0.15);
    border: 1px solid rgba(250, 204, 21, 0.5);
    color: #facc15; /* Màu chữ ngả vàng gold VIP */
  }

  .chip-time .online-dot {
    width: 12px;
    height: 12px;
    margin-right: 14px;
    background: #10b981;
    box-shadow: 0 0 10px #10b981, 0 0 20px #10b981;
  }
  
  .chip-location .flag-image {
    width: 26px;
    border-radius: 3px;
    margin-right: 14px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.5);
  }

  .social-circle-row {
    position: fixed;
    bottom: 30px;
    right: 30px;
    flex-direction: column;
    margin: 0;
    z-index: 100;
  }
  
  .social-circle-btn {
    position: relative;
  }
  
  .social-circle-btn::before,
  .social-circle-btn::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 44px;
    height: 44px;
    border-radius: 50%;
    z-index: -1;
    pointer-events: none;
  }
  
  .social-circle-btn.facebook::before {
    border: 2px solid rgba(24, 119, 242, 0.8);
    animation: socialRadarFb 2.5s ease-out infinite;
  }
  .social-circle-btn.facebook::after {
    border: 2px solid rgba(24, 119, 242, 0.8);
    animation: socialRadarFb 2.5s ease-out infinite 0.8s;
  }

  .social-circle-btn.telegram::before {
    border: 2px solid rgba(0, 136, 204, 0.8);
    animation: socialRadarTg 2.5s ease-out infinite;
  }
  .social-circle-btn.telegram::after {
    border: 2px solid rgba(0, 136, 204, 0.8);
    animation: socialRadarTg 2.5s ease-out infinite 0.8s;
  }
}

/* ===== Live Toast (Chỉ có ở PC) ===== */
.toast-container {
  display: none;
}

@media (min-width: 768px) {
  .toast-container {
    display: flex;
    flex-direction: column-reverse; /* Xếp thẻ từ dưới lên */
    position: fixed;
    bottom: 50px;
    left: 45px;
    z-index: 200;
    gap: 12px;
    pointer-events: none;
  }

  .live-toast {
    position: relative;
    pointer-events: auto; /* Để click vào được menu và nút tắt */
    display: flex;
    align-items: center;
    background: rgba(15, 15, 15, 0.7);
    backdrop-filter: blur(25px);
    -webkit-backdrop-filter: blur(25px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 14px;
    padding: 12px 18px;
    gap: 14px;
    width: 320px; /* Cố định width để transition mượt hơn */
    box-shadow: 
      0 10px 30px rgba(0,0,0,0.6), 
      0 0 15px rgba(74, 222, 128, 0.1),
      inset 0 1px 0 rgba(255,255,255,0.1);
    cursor: pointer;
    border-left: 4px solid #4ade80;
  }
  
  .toast-avatar {
    width: 34px; height: 34px;
    border-radius: 50%;
    background: linear-gradient(135deg, rgba(74, 222, 128, 0.3), rgba(22, 163, 74, 0.6));
    color: #fff;
    display: flex; align-items: center; justify-content: center;
    font-size: 16px;
    box-shadow: 0 0 10px rgba(74, 222, 128, 0.4);
  }
  
  .toast-content {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  
  .toast-title {
    margin: 0;
    font-size: 14px;
    color: #4ade80;
    font-weight: 800;
    letter-spacing: 0.5px;
  }
  
  .toast-title span {
    color: #e2e8f0;
    font-weight: 500;
  }
  
  .toast-desc {
    margin: 0;
    font-size: 12px;
    color: rgba(255,255,255,0.4);
    font-weight: 500;
  }
  
  .toast-close {
    margin-left: 10px;
    color: rgba(255,255,255,0.3);
    cursor: pointer;
    transition: 0.2s;
  }
  .toast-close:hover { color: #fff; }

  /* Anime config cho danh sách xếp chồng */
  .slide-toast-enter-active,
  .slide-toast-leave-active,
  .slide-toast-move {
    transition: all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
  }
  
  .slide-toast-enter-from,
  .slide-toast-leave-to {
    opacity: 0;
    transform: translateX(-40px);
  }
  
  .slide-toast-leave-active {
    position: absolute; /* Thoát khỏi flow để thẻ khác trượt lên mượt */
  }
}

@keyframes socialRadarFb {
  0% {
    width: 44px;
    height: 44px;
    opacity: 1;
    box-shadow: 0 0 10px rgba(24, 119, 242, 0.6);
  }
  100% {
    width: 120px;
    height: 120px;
    opacity: 0;
    box-shadow: 0 0 20px rgba(24, 119, 242, 0);
  }
}

@keyframes socialRadarTg {
  0% {
    width: 44px;
    height: 44px;
    opacity: 1;
    box-shadow: 0 0 10px rgba(0, 136, 204, 0.6);
  }
  100% {
    width: 120px;
    height: 120px;
    opacity: 0;
    box-shadow: 0 0 20px rgba(0, 136, 204, 0);
  }
}

/* ===== Hiệu ứng Slide In lúc tải trang (Entrance Animations) ===== */
.stagger-1 { animation: entranceUp 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) both 0.1s; }
.stagger-2 { animation: entranceUp 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) both 0.2s; }
.stagger-3 { animation: entranceUp 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) both 0.3s; }
.stagger-4 { animation: entranceUp 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) both 0.4s; }
.stagger-5 { animation: entranceUp 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) both 0.5s; }
.stagger-6 { animation: entranceUp 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) both 0.6s; }
.stagger-7 { animation: entranceUp 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) both 0.7s; }
.stagger-8 { animation: entranceUp 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) both 0.8s; }

@keyframes entranceUp {
  0% {
    opacity: 0;
    transform: translateY(30px);
    filter: blur(8px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
    filter: blur(0);
  }
}
</style>
