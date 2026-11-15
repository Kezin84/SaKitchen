// src/config/firebase.js
import { initializeApp, getApps, getApp } from 'firebase/app'
import { getDatabase } from 'firebase/database'
import { getAuth } from 'firebase/auth'
import { getAnalytics, isSupported as isAnalyticsSupported } from 'firebase/analytics'

export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyCh88YjlsGOawKWPi6Uj63b9gBxIX4iME0',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'sakitchen.firebaseapp.com',
  databaseURL:
    import.meta.env.VITE_FIREBASE_DATABASE_URL ||
    'https://sakitchen-default-rtdb.asia-southeast1.firebasedatabase.app',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'sakitchen',
  storageBucket:
    import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'sakitchen.firebasestorage.app',
  messagingSenderId:
    import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '204680614901',
  appId:
    import.meta.env.VITE_FIREBASE_APP_ID ||
    '1:204680614901:web:ff4d0a1c972e764fab06bc',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-G23RNKHGRC',
}

export const app = getApps().length ? getApp() : initializeApp(firebaseConfig)
export const db = getDatabase(app)
export const auth = getAuth(app)

// Initialize Firebase Analytics safely in browser environments
if (typeof window !== 'undefined') {
  isAnalyticsSupported()
    .then((supported) => {
      if (supported) {
        getAnalytics(app)
      }
    })
    .catch(() => {
      // Ignore analytics errors (e.g. adblockers or unsupported environments)
    })
}
