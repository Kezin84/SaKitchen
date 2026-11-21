import type { FirebaseApp } from 'firebase/app'
import type { Auth } from 'firebase/auth'
import type { Database } from 'firebase/database'

export const firebaseConfig: Record<string, string>
export const app: FirebaseApp
export const db: Database
export const auth: Auth
