<template>
  <div class="login-page">
    <div class="login-container">
      <div class="login-card">
        <div class="login-header">
          <div class="logo-icon">
            <img src="/Logo/FBC ONLY LOGO NO TEXT.png" alt="SA Kitchen Logo" class="logo-image" />
          </div>
          <h2>ĐĂNG NHẬP HỆ THỐNG</h2>
          <p class="subtitle">Xác thực bằng tài khoản Google quản trị viên</p>
        </div>

        <div class="login-form">
          <div class="auth-notice">
            <i class="app-ico ri-shield-keyhole-line"></i>
            <span>Chỉ tài khoản Gmail quản trị được cấp quyền mới có thể truy cập trang Admin.</span>
          </div>

          <button
            type="button"
            :disabled="loading"
            class="google-login-btn"
            @click="handleGoogleLogin"
          >
            <span v-if="loading" class="spinner"></span>
            <svg
              v-else
              class="google-icon"
              viewBox="0 0 24 24"
              width="22"
              height="22"
              aria-hidden="true"
            >
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.79-.07-1.54-.19-2.27h-11.3v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"
              />
              <path
                fill="#34A853"
                d="M12.255 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96h-3.98v3.09C3.515 21.3 7.565 24 12.255 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.525 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62h-3.98a11.86 11.86 0 0 0 0 10.76l3.98-3.09z"
              />
              <path
                fill="#EA4335"
                d="M12.255 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C18.205 1.19 15.495 0 12.255 0c-4.69 0-8.74 2.7-10.71 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"
              />
            </svg>
            <span>{{ loading ? 'ĐANG XÁC THỰC...' : 'ĐĂNG NHẬP BẰNG GOOGLE' }}</span>
          </button>

          <div v-if="error" class="error-box">
            <i class="app-ico ri-error-warning-line"></i>
            <span>{{ error }}</span>
          </div>

          <router-link to="/" class="back-menu-link">
            <i class="app-ico ri-arrow-left-line"></i>
            <span>Quay lại trang Menu đặt món</span>
          </router-link>
        </div>
      </div>

      <div class="login-footer">
        <p>© 2026 • Powered by <span class="fbc-text">FBC</span></p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { loginWithGoogleFirebase } from '@/config/adminAuth'

const router = useRouter()
const loading = ref(false)
const error = ref('')

const handleGoogleLogin = async () => {
  if (loading.value) return
  loading.value = true
  error.value = ''

  try {
    const data = await loginWithGoogleFirebase()

    if (!data.success) {
      if (data.message) {
        error.value = data.message
      }
      return
    }

    router.replace({ name: 'kho-hang' })
  } catch (err) {
    console.error(err)
    error.value = 'Không thể kết nối Firebase Authentication. Vui lòng thử lại.'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, rgb(15, 23, 42) 0%, rgb(30, 41, 59) 100%);
  padding: 20px;
  position: relative;
  overflow: hidden;
}

.login-page::before {
  content: '';
  position: absolute;
  top: -50%;
  right: -50%;
  width: 100%;
  height: 100%;
  background: radial-gradient(circle, rgba(34, 197, 94, 0.1) 0%, transparent 70%);
  animation: pulse 8s ease-in-out infinite;
}

.login-page::after {
  content: '';
  position: absolute;
  bottom: -50%;
  left: -50%;
  width: 100%;
  height: 100%;
  background: radial-gradient(circle, rgba(59, 130, 246, 0.08) 0%, transparent 70%);
  animation: pulse 10s ease-in-out infinite reverse;
}

@keyframes pulse {
  0%,
  100% {
    transform: scale(1);
    opacity: 0.5;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.8;
  }
}

.login-container {
  position: relative;
  z-index: 1;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
}

.login-card {
  width: 100%;
  max-width: 440px;
  background: rgba(30, 41, 59, 0.82);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 20px;
  padding: 40px;
  box-shadow:
    0 20px 60px rgba(0, 0, 0, 0.5),
    0 0 0 1px rgba(34, 197, 94, 0.1);
  animation: cardEntry 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes cardEntry {
  from {
    opacity: 0;
    transform: translateY(30px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.login-header {
  text-align: center;
  margin-bottom: 28px;
}

.logo-icon {
  width: 100px;
  height: 100px;
  margin: 0 auto 20px;
  background: linear-gradient(135deg, rgb(0, 153, 255), rgb(0, 255, 42));
  border-radius: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  box-shadow:
    0 8px 24px rgba(34, 197, 94, 0.4),
    0 0 0 1px rgba(34, 197, 94, 0.3);
  animation: iconFloat 3s ease-in-out infinite;
}

.logo-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
  filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.3));
}

@keyframes iconFloat {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

.login-header h2 {
  font-size: 24px;
  font-weight: 700;
  color: #f8fafc;
  margin-bottom: 8px;
  letter-spacing: -0.5px;
}

.subtitle {
  font-size: 14px;
  color: #94a3b8;
  font-weight: 500;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.auth-notice {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px 14px;
  border-radius: 12px;
  background: rgba(34, 197, 94, 0.08);
  border: 1px solid rgba(34, 197, 94, 0.22);
  color: #cbd5e1;
  font-size: 13px;
  line-height: 1.5;
}

.auth-notice i {
  font-size: 18px;
  color: #4ade80;
  margin-top: 1px;
  flex-shrink: 0;
}

.google-login-btn {
  width: 100%;
  padding: 15px 18px;
  background: #ffffff;
  border: 1px solid rgba(255, 255, 255, 0.9);
  border-radius: 12px;
  color: #0f172a;
  font-size: 15px;
  font-weight: 700;
  letter-spacing: 0.4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  transition: all 0.25s ease;
  box-shadow: 0 10px 26px rgba(0, 0, 0, 0.28);
}

.google-login-btn:hover:not(:disabled) {
  background: #f8fafc;
  transform: translateY(-2px);
  box-shadow:
    0 14px 32px rgba(0, 0, 0, 0.36),
    0 0 0 3px rgba(74, 222, 128, 0.25);
}

.google-login-btn:active:not(:disabled) {
  transform: translateY(0);
}

.google-login-btn:disabled {
  opacity: 0.72;
  cursor: not-allowed;
  transform: none;
}

.google-icon {
  flex-shrink: 0;
}

.spinner {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(15, 23, 42, 0.2);
  border-top-color: #16a34a;
  border-radius: 50%;
  display: inline-block;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.error-box {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 14px 16px;
  background: rgba(239, 68, 68, 0.12);
  border: 1px solid rgba(239, 68, 68, 0.35);
  border-radius: 10px;
  color: #fca5a5;
  font-size: 13.5px;
  font-weight: 600;
  line-height: 1.45;
  animation: errorShake 0.45s ease;
}

.error-box i {
  font-size: 19px;
  flex-shrink: 0;
  margin-top: 1px;
}

@keyframes errorShake {
  0%,
  100% {
    transform: translateX(0);
  }
  25% {
    transform: translateX(-8px);
  }
  75% {
    transform: translateX(8px);
  }
}

.back-menu-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  margin-top: 4px;
  color: #94a3b8;
  text-decoration: none;
  font-size: 13px;
  font-weight: 500;
  transition: color 0.2s ease;
}

.back-menu-link:hover {
  color: #e2e8f0;
}

.login-footer {
  text-align: center;
  color: #64748b;
  font-size: 14px;
  font-weight: 500;
}

.login-footer p {
  margin: 0;
}

.fbc-text {
  font-weight: 700;
  color: rgb(134, 239, 172);
  letter-spacing: 1px;
  text-shadow: 0 0 10px rgba(34, 197, 94, 0.5);
}

/* ================= RESPONSIVE ================= */
@media (max-width: 640px) {
  .login-card {
    padding: 32px 24px;
    border-radius: 16px;
  }

  .logo-icon {
    width: 80px;
    height: 80px;
    border-radius: 20px;
    padding: 14px;
  }

  .login-header h2 {
    font-size: 20px;
  }

  .subtitle {
    font-size: 13px;
  }

  .google-login-btn {
    padding: 14px 16px;
    font-size: 14px;
  }
}
</style>
