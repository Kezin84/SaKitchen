// src/utils/productBadge.js
// Shared product badge presets, 5-language auto-translation, and group/shape resolver

export const PRODUCT_BADGE_PRESETS = [
  {
    key: 'hot',
    value: 'HOT',
    group: 'fire',
    shape: 'flame',
    icon: 'ri-fire-fill',
    i18n: {
      vi: 'HOT',
      en: 'HOT',
      'zh-CN': '爆款',
      fil: 'HOT',
      ko: 'HOT',
    },
    aliases: ['hot', 'hot hit'],
  },
  {
    key: 'best_seller',
    value: 'Bán chạy',
    group: 'fire',
    shape: 'flame',
    icon: 'ri-fire-fill',
    i18n: {
      vi: 'Bán chạy',
      en: 'Best Seller',
      'zh-CN': '热销',
      fil: 'Mabenta',
      ko: '인기',
    },
    aliases: ['ban chay', 'bán chạy', 'best seller', 'bestseller', 'best'],
  },
  {
    key: 'new_dish',
    value: 'Món mới',
    group: 'new',
    shape: 'leaf',
    icon: 'ri-sparkling-2-fill',
    i18n: {
      vi: 'Món mới',
      en: 'New',
      'zh-CN': '新品',
      fil: 'Bago',
      ko: '신메뉴',
    },
    aliases: ['mon moi', 'món mới', 'moi', 'mới', 'new'],
  },
  {
    key: 'signature',
    value: 'Đặc sản',
    group: 'crown',
    shape: 'crest',
    icon: 'ri-vip-crown-2-fill',
    i18n: {
      vi: 'Đặc sản',
      en: 'Signature',
      'zh-CN': '招牌',
      fil: 'Espesyal',
      ko: '시그니처',
    },
    aliases: ['dac san', 'đặc sản', 'signature', 'vip', 'mon tu', 'món tủ'],
  },
  {
    key: 'must_try',
    value: 'Phải thử',
    group: 'crown',
    shape: 'crest',
    icon: 'ri-thumb-up-fill',
    i18n: {
      vi: 'Phải thử',
      en: 'Must Try',
      'zh-CN': '必点',
      fil: 'Must Try',
      ko: '강추',
    },
    aliases: ['phai thu', 'phải thử', 'must try', 'nen thu', 'nên thử', 'recommend'],
  },
  {
    key: 'spicy',
    value: 'Cay',
    group: 'spicy',
    shape: 'pennant',
    icon: 'ri-blaze-fill',
    i18n: {
      vi: 'Cay',
      en: 'Spicy',
      'zh-CN': '香辣',
      fil: 'Maanghang',
      ko: '매운맛',
    },
    aliases: ['cay', 'cay 🌶️', 'spicy'],
  },
]

function normalizeMatchKey(str) {
  return String(str || '')
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/\s+/g, ' ')
}

export function resolveProductBadge(rawBadge, lang = 'vi') {
  const clean = String(rawBadge ?? '').trim()
  if (!clean) return null

  const norm = normalizeMatchKey(clean)

  // 1. Exact preset match -> auto-translate across 5 languages
  for (const preset of PRODUCT_BADGE_PRESETS) {
    if (
      clean === preset.value ||
      preset.aliases.some((al) => normalizeMatchKey(al) === norm)
    ) {
      const translated = preset.i18n[lang] || preset.i18n.vi || clean
      return {
        raw: clean,
        label: translated,
        group: preset.group,
        shape: preset.shape,
        icon: preset.icon,
        isPreset: true,
        presetKey: preset.key,
      }
    }
  }

  // 2. Keyword-based group & shape inference for custom labels (keeps exact custom label)
  if (/(cay|spicy|ot|chili|🌶)/i.test(norm)) {
    return {
      raw: clean,
      label: clean,
      group: 'spicy',
      shape: 'pennant',
      icon: 'ri-blaze-fill',
      isPreset: false,
    }
  }

  if (/(hot|chay|seller|top|trend|🔥)/i.test(norm)) {
    return {
      raw: clean,
      label: clean,
      group: 'fire',
      shape: 'flame',
      icon: 'ri-fire-fill',
      isPreset: false,
    }
  }

  if (/(moi|new|fresh|tuoi)/i.test(norm)) {
    return {
      raw: clean,
      label: clean,
      group: 'new',
      shape: 'leaf',
      icon: 'ri-sparkling-2-fill',
      isPreset: false,
    }
  }

  if (/(dac san|vip|signature|special|thu|try|ngon|👑|⭐)/i.test(norm)) {
    return {
      raw: clean,
      label: clean,
      group: 'crown',
      shape: 'crest',
      icon: 'ri-vip-crown-2-fill',
      isPreset: false,
    }
  }

  // 3. Default custom group -> distinct notched ticket shape
  return {
    raw: clean,
    label: clean,
    group: 'custom',
    shape: 'ticket',
    icon: 'ri-price-tag-3-fill',
    isPreset: false,
  }
}
