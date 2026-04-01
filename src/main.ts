import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { i18n } from './i18n'   // 👈 path này phải đúng
import { inject } from '@vercel/analytics';

const app = createApp(App)

app.use(router)
app.use(i18n)

app.mount('#app')

// Kích hoạt Vercel Analytics để theo dõi traffic
inject();
