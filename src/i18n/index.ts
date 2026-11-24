import { createI18n } from 'vue-i18n'
import vi from './vi.json'

type LocaleMessages = Record<string, unknown>

const loadedLocales = new Set<string>(['vi'])
const pendingLoads = new Map<string, Promise<void>>()

const localeLoaders: Record<string, () => Promise<{ default: LocaleMessages }>> = {
  en: () => import('./en.json'),
  zh: () => import('./zh.json'),
  'zh-CN': () => import('./zh.json'),
  fil: () => import('./fil.json'),
  ko: () => import('./ko.json'),
}

export const i18n = createI18n({
  legacy: false,
  locale: 'vi',
  fallbackLocale: 'vi',
  messages: {
    vi,
  },
})

export async function ensureLocaleLoaded(rawLocale?: string): Promise<string> {
  const code = String(rawLocale || 'vi').trim() || 'vi'
  const normalized = code === 'zh' ? 'zh-CN' : code
  if (loadedLocales.has(normalized) || !localeLoaders[normalized]) {
    return loadedLocales.has(normalized) ? normalized : 'vi'
  }

  let task = pendingLoads.get(normalized)
  if (!task) {
    task = localeLoaders[normalized]()
      .then((mod) => {
        const msgs = (mod?.default || mod) as LocaleMessages
        if (normalized === 'zh-CN') {
          i18n.global.setLocaleMessage('zh', msgs as never)
          i18n.global.setLocaleMessage('zh-CN', msgs as never)
          loadedLocales.add('zh')
          loadedLocales.add('zh-CN')
        } else {
          i18n.global.setLocaleMessage(normalized, msgs as never)
          loadedLocales.add(normalized)
        }
      })
      .catch((err) => {
        console.warn(`[i18n] Failed to load locale "${normalized}":`, err)
      })
      .finally(() => {
        pendingLoads.delete(normalized)
      })
    pendingLoads.set(normalized, task)
  }

  await task
  return loadedLocales.has(normalized) ? normalized : 'vi'
}

export async function setAppLocale(rawLocale?: string): Promise<string> {
  const readyLocale = await ensureLocaleLoaded(rawLocale)
  if (i18n.global.locale.value !== readyLocale) {
    i18n.global.locale.value = readyLocale as typeof i18n.global.locale.value
  }
  return readyLocale
}
