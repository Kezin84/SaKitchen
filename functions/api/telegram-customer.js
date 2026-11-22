// Cloudflare Worker handlers for SA KITCHEN Customer Telegram Mini App (@sakitchenweb_bot)
// 1. POST /api/telegram-customer-webhook -> Handles /start, /menu, /blog commands with Mini App launch buttons
// 2. POST /api/telegram-customer-notify  -> Sends verified order status updates & shop messages back to customer on Telegram

const DEFAULT_ORIGIN = 'https://sakitchen.shop'
const DEFAULT_FIREBASE_DB_URL =
  'https://sakitchen-default-rtdb.asia-southeast1.firebasedatabase.app'

function jsonResponse(payload, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...extraHeaders,
    },
  })
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function safeFirebaseKey(raw) {
  return String(raw || '')
    .trim()
    .replace(/[.$#[\]/]/g, '_')
}

function normalizeLang(rawLang) {
  const lc = String(rawLang || '').trim().toLowerCase()
  if (lc.startsWith('zh')) return 'zh-CN'
  if (lc.startsWith('ko')) return 'ko'
  if (lc === 'tl' || lc.startsWith('fil')) return 'fil'
  if (lc.startsWith('en')) return 'en'
  return 'vi'
}

function formatAmount(amount, currency = 'P') {
  const num = Number(amount || 0)
  const formatted = Number.isFinite(num) ? num.toLocaleString('en-US') : '0'
  const cur = String(currency || 'P').trim() || 'P'
  if (cur.toUpperCase() === 'VND' || cur === 'đ') return `${formatted}đ`
  return `${formatted} ${cur}`
}

async function hmacSha256Bytes(keyBytesOrString, message) {
  const enc = new TextEncoder()
  const rawKey =
    typeof keyBytesOrString === 'string' ? enc.encode(keyBytesOrString) : keyBytesOrString
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    rawKey,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const sig = await crypto.subtle.sign('HMAC', cryptoKey, enc.encode(message))
  return new Uint8Array(sig)
}

function bytesToHex(bytes) {
  let out = ''
  for (let i = 0; i < bytes.length; i += 1) {
    out += bytes[i].toString(16).padStart(2, '0')
  }
  return out
}

function timingSafeHexEqual(a, b) {
  const sa = String(a || '').toLowerCase()
  const sb = String(b || '').toLowerCase()
  if (!sa || sa.length !== sb.length) return false
  let diff = 0
  for (let i = 0; i < sa.length; i += 1) {
    diff |= sa.charCodeAt(i) ^ sb.charCodeAt(i)
  }
  return diff === 0
}

export async function verifyTelegramInitData(initData, botToken) {
  const raw = String(initData || '').trim()
  const token = String(botToken || '').trim()
  if (!raw || !token) return { ok: false }

  try {
    const params = new URLSearchParams(raw)
    const hash = String(params.get('hash') || '').trim()
    if (!hash) return { ok: false }

    const pairs = []
    for (const [k, v] of params.entries()) {
      if (k === 'hash') continue
      pairs.push([k, v])
    }
    pairs.sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0))
    const dataCheckString = pairs.map(([k, v]) => `${k}=${v}`).join('\n')

    const secretKey = await hmacSha256Bytes('WebAppData', token)
    const computedBytes = await hmacSha256Bytes(secretKey, dataCheckString)
    const computedHex = bytesToHex(computedBytes)

    if (!timingSafeHexEqual(computedHex, hash)) {
      return { ok: false }
    }

    const userRaw = params.get('user')
    const user = userRaw ? JSON.parse(userRaw) : null
    if (!user?.id) return { ok: false }

    return { ok: true, user }
  } catch {
    return { ok: false }
  }
}

async function sendTelegramBotMessage(botToken, chatId, text, inlineKeyboard = []) {
  const endpoint = `https://api.telegram.org/bot${botToken}/sendMessage`
  const payload = {
    chat_id: chatId,
    text,
    parse_mode: 'HTML',
    disable_web_page_preview: true,
  }
  if (Array.isArray(inlineKeyboard) && inlineKeyboard.length > 0) {
    payload.reply_markup = { inline_keyboard: inlineKeyboard }
  }

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const data = await res.json().catch(() => ({}))
  return { ok: Boolean(res.ok && data?.ok), description: data?.description || '' }
}

function buildWelcomeReply(lang, firstName = '', startOrderId = '', origin = DEFAULT_ORIGIN) {
  const safeName = escapeHtml(firstName || '')
  const menuUrl = `${origin}/${lang}`
  const blogUrl = `${origin}/blog`
  const joinUrl = startOrderId
    ? `${origin}/${lang}?order=${encodeURIComponent(startOrderId)}`
    : menuUrl

  if (startOrderId) {
    const safeCode = escapeHtml(startOrderId)
    const copyByLang = {
      vi: {
        text: [
          `🤝 <b>Mời tham gia đơn nhóm #<code>${safeCode}</code> — SA KITCHEN</b>`,
          '',
          `Chào ${safeName || 'bạn'}! Bấm nút bên dưới để mở Menu ngay trong Telegram và chọn món chung vào đơn <b>#${safeCode}</b> nhé:`,
        ].join('\n'),
        joinBtn: `🍜 Vào chọn món đơn #${startOrderId}`,
        menuBtn: '📋 Đặt đơn riêng mới',
      },
      en: {
        text: [
          `🤝 <b>Join Group Order #<code>${safeCode}</code> — SA KITCHEN</b>`,
          '',
          `Hi ${safeName || 'there'}! Tap below to open the Mini App right inside Telegram and add your dishes to order <b>#${safeCode}</b>:`,
        ].join('\n'),
        joinBtn: `🍜 Join Order #${startOrderId}`,
        menuBtn: '📋 Start a Separate Order',
      },
      'zh-CN': {
        text: [
          `🤝 <b>加入拼单 #<code>${safeCode}</code> — SA KITCHEN</b>`,
          '',
          `您好 ${safeName}！点击下方按钮即可在 Telegram 内直接打开菜单并加入拼单 <b>#${safeCode}</b>：`,
        ].join('\n'),
        joinBtn: `🍜 进入拼单 #${startOrderId}`,
        menuBtn: '📋 单独创建新订单',
      },
      fil: {
        text: [
          `🤝 <b>Sumali sa Group Order #<code>${safeCode}</code> — SA KITCHEN</b>`,
          '',
          `Kumusta ${safeName || 'kaibigan'}! Pindutin sa ibaba para buksan ang Menu sa loob ng Telegram at pumili ng pagkain sa order <b>#${safeCode}</b>:`,
        ].join('\n'),
        joinBtn: `🍜 Sumali sa Order #${startOrderId}`,
        menuBtn: '📋 Gumawa ng Sariling Order',
      },
      ko: {
        text: [
          `🤝 <b>함께 주문 #<code>${safeCode}</code> 참여 — SA KITCHEN</b>`,
          '',
          `안녕하세요 ${safeName ? `${safeName}님` : ''}! 아래 버튼을 누르면 텔레그램 안에서 바로 메뉴를 열고 <b>#${safeCode}</b> 주문에 함께 담을 수 있습니다:`,
        ].join('\n'),
        joinBtn: `🍜 함께 주문 #${startOrderId} 열기`,
        menuBtn: '📋 새 개별 주문하기',
      },
    }
    const pack = copyByLang[lang] || copyByLang.vi
    return {
      text: pack.text,
      keyboard: [
        [{ text: pack.joinBtn, web_app: { url: joinUrl } }],
        [{ text: pack.menuBtn, web_app: { url: menuUrl } }],
      ],
    }
  }

  const welcomeByLang = {
    vi: {
      text: [
        `🍜 <b>Chào mừng ${safeName ? `${safeName} ` : ''}đến với SA KITCHEN!</b>`,
        '',
        '🇻🇳 Ẩm thực chuẩn vị Việt Nam • Cơm văn phòng • Món nhậu • Đi chợ hộ giao nhanh 24/24 tại Manila.',
        '✨ Chọn món trực tiếp ngay trong Telegram, ghép đơn nhóm realtime và nhận thông báo tiến trình đơn tự động!',
        '',
        '👇 <b>Bấm nút bên dưới để mở Menu đặt món ngay:</b>',
      ].join('\n'),
      orderBtn: '🍜 Mở Menu Đặt Món Ngay',
      blogBtn: '📖 Blog & Cẩm Nang Ẩm Thực',
      webBtn: '🌐 Mở trên trình duyệt',
    },
    en: {
      text: [
        `🍜 <b>Welcome${safeName ? `, ${safeName},` : ''} to SA KITCHEN!</b>`,
        '',
        '🇻🇳 Authentic Vietnamese Cuisine • Office Meals • Late-Night Bites • 24/7 Delivery in Manila.',
        '✨ Order directly inside Telegram, share live group carts, and receive instant order progress alerts!',
        '',
        '👇 <b>Tap below to launch the Menu Mini App:</b>',
      ].join('\n'),
      orderBtn: '🍜 Launch Menu & Order Now',
      blogBtn: '📖 Food Guide & Blog',
      webBtn: '🌐 Open in Browser',
    },
    'zh-CN': {
      text: [
        `🍜 <b>欢迎${safeName ? ` ${safeName}` : ''} 来到 SA KITCHEN！</b>`,
        '',
        '🇻🇳 正宗越南美食 • 商务简餐 • 夜宵下酒菜 • 马尼拉 24/7 极速配送。',
        '✨ 在 Telegram 内直接点餐、好友实时拼单，并自动接收订单进度通知！',
        '',
        '👇 <b>点击下方按钮立即打开点餐小程序：</b>',
      ].join('\n'),
      orderBtn: '🍜 立即打开菜单点餐',
      blogBtn: '📖 美食指南与资讯',
      webBtn: '🌐 浏览器打开',
    },
    fil: {
      text: [
        `🍜 <b>Maligayang pagdating${safeName ? `, ${safeName},` : ''} sa SA KITCHEN!</b>`,
        '',
        '🇻🇳 Tunay na Lutong Vietnamese • Office Meals • Pulutan • 24/7 Mabilis na Delivery sa Manila.',
        '✨ Umorder diretso sa loob ng Telegram, mag-group order, at makatanggap ng live updates!',
        '',
        '👇 <b>Pindutin sa ibaba para buksan ang Menu:</b>',
      ].join('\n'),
      orderBtn: '🍜 Buksan ang Menu at Umorder',
      blogBtn: '📖 Blog ng Pagkain',
      webBtn: '🌐 Buksan sa Browser',
    },
    ko: {
      text: [
        `🍜 <b>SA KITCHEN에 오신 것을 환영합니다${safeName ? `, ${safeName}님` : ''}!</b>`,
        '',
        '🇻🇳 정통 베트남 요리 • 도시락 & 식사 • 안주 메뉴 • 마닐라 24시간 빠른 배달.',
        '✨ 텔레그램 안에서 바로 메뉴 선택, 실시간 함께 주문 및 진행 상태 알림을 받아보세요!',
        '',
        '👇 <b>아래 버튼을 눌러 메뉴 앱을 실행하세요:</b>',
      ].join('\n'),
      orderBtn: '🍜 메뉴 열고 바로 주문하기',
      blogBtn: '📖 맛집 가이드 & 블로그',
      webBtn: '🌐 브라우저에서 열기',
    },
  }

  const pack = welcomeByLang[lang] || welcomeByLang.vi
  return {
    text: pack.text,
    keyboard: [
      [{ text: pack.orderBtn, web_app: { url: menuUrl } }],
      [
        { text: pack.blogBtn, web_app: { url: blogUrl } },
        { text: pack.webBtn, url: menuUrl },
      ],
    ],
  }
}

function buildOrderStatusCustomerMessage({
  event,
  lang = 'vi',
  orderId,
  customerName = '',
  totalAmount = 0,
  currency = 'P',
  itemCount = 0,
  deliveryTime = '',
  adminMessage = '',
  origin = DEFAULT_ORIGIN,
}) {
  const normLang = normalizeLang(lang)
  const safeCode = escapeHtml(orderId || 'WEB')
  const safeCustomer = escapeHtml(customerName || '')
  const safeTotal = escapeHtml(formatAmount(totalAmount, currency))
  const safeTime = escapeHtml(deliveryTime || '')
  const safeAdminMsg = escapeHtml(adminMessage || '')
  const trackUrl = `${origin}/${normLang}?order=${encodeURIComponent(orderId)}`
  const newOrderUrl = `${origin}/${normLang}`

  const templates = {
    vi: {
      submitted: [
        `✅ <b>Đã gửi đơn #<code>${safeCode}</code> thành công!</b>`,
        safeCustomer ? `👤 Người nhận: <b>${safeCustomer}</b>` : '',
        itemCount > 0
          ? `🛒 Tổng cộng: <b>${safeTotal}</b> (${itemCount} phần)`
          : `💰 Tổng cộng: <b>${safeTotal}</b>`,
        safeTime ? `⏰ Thời gian nhận: ${safeTime}` : '',
        '',
        '⏳ Quán đã nhận thông tin và sẽ xác nhận đơn của bạn ngay!',
      ],
      updated: [
        `🔄 <b>Đã cập nhật đơn #<code>${safeCode}</code>!</b>`,
        `💰 Tổng sau cập nhật: <b>${safeTotal}</b>${itemCount > 0 ? ` (${itemCount} phần)` : ''}`,
        '⏳ Thay đổi mới của bạn đã được đồng bộ tới quán.',
      ],
      approved: [
        `👨‍🍳 <b>Quán đã xác nhận đơn #<code>${safeCode}</code>!</b>`,
        `💰 Tổng đơn: <b>${safeTotal}</b>`,
        '🔥 Bếp SA KITCHEN đang chuẩn bị món nóng hổi cho bạn.',
      ],
      shipping: [
        `🛵 <b>Đơn #<code>${safeCode}</code> đang trên đường giao!</b>`,
        `💰 Tổng đơn: <b>${safeTotal}</b>`,
        '📱 Bạn vui lòng để ý điện thoại / Telegram để nhận hàng nhé!',
      ],
      completed: [
        `🎉 <b>Đơn #<code>${safeCode}</code> đã hoàn thành!</b>`,
        '💚 Cảm ơn bạn đã ủng hộ SA KITCHEN! Chúc bạn ngon miệng nhé!',
      ],
      cancelled: [
        `⚠️ <b>Đơn #<code>${safeCode}</code> đã bị hủy</b>`,
        'Quán rất tiếc chưa thể phục vụ đơn này. Vui lòng xem lời nhắn bên dưới hoặc liên hệ quán nếu cần hỗ trợ nhé.',
      ],
      message: [`💬 <b>Lời nhắn từ SA KITCHEN cho đơn #<code>${safeCode}</code>:</b>`],
      shopNotePrefix: '📝 <b>Lời nhắn từ quán:</b>\n',
      trackBtn: `🔎 Xem tiến trình đơn #${orderId}`,
      newOrderBtn: '🍜 Đặt đơn mới',
    },
    en: {
      submitted: [
        `✅ <b>Order #<code>${safeCode}</code> submitted!</b>`,
        safeCustomer ? `👤 Recipient: <b>${safeCustomer}</b>` : '',
        itemCount > 0
          ? `🛒 Total: <b>${safeTotal}</b> (${itemCount} items)`
          : `💰 Total: <b>${safeTotal}</b>`,
        safeTime ? `⏰ Delivery time: ${safeTime}` : '',
        '',
        '⏳ SA KITCHEN has received your order and will confirm shortly!',
      ],
      updated: [
        `🔄 <b>Order #<code>${safeCode}</code> updated!</b>`,
        `💰 Updated total: <b>${safeTotal}</b>${itemCount > 0 ? ` (${itemCount} items)` : ''}`,
        '⏳ Your latest changes have been synced to the kitchen.',
      ],
      approved: [
        `👨‍🍳 <b>Order #<code>${safeCode}</code> confirmed!</b>`,
        `💰 Total: <b>${safeTotal}</b>`,
        '🔥 SA KITCHEN is freshly preparing your meal.',
      ],
      shipping: [
        `🛵 <b>Order #<code>${safeCode}</code> is out for delivery!</b>`,
        `💰 Total: <b>${safeTotal}</b>`,
        '📱 Please keep an eye on your phone / Telegram for the rider!',
      ],
      completed: [
        `🎉 <b>Order #<code>${safeCode}</code> completed!</b>`,
        '💚 Thank you for ordering from SA KITCHEN! Enjoy your meal!',
      ],
      cancelled: [
        `⚠️ <b>Order #<code>${safeCode}</code> was cancelled</b>`,
        'Please check the note from the shop below or contact us if you need assistance.',
      ],
      message: [`💬 <b>Message from SA KITCHEN for order #<code>${safeCode}</code>:</b>`],
      shopNotePrefix: '📝 <b>Note from shop:</b>\n',
      trackBtn: `🔎 Track Order #${orderId}`,
      newOrderBtn: '🍜 Start New Order',
    },
    'zh-CN': {
      submitted: [
        `✅ <b>订单 #<code>${safeCode}</code> 提交成功！</b>`,
        safeCustomer ? `👤 收货人：<b>${safeCustomer}</b>` : '',
        itemCount > 0
          ? `🛒 总计：<b>${safeTotal}</b>（${itemCount} 份）`
          : `💰 总计：<b>${safeTotal}</b>`,
        safeTime ? `⏰ 送达时间：${safeTime}` : '',
        '',
        '⏳ 商家已收到您的订单，即将为您确认！',
      ],
      updated: [
        `🔄 <b>订单 #<code>${safeCode}</code> 已更新！</b>`,
        `💰 更新后总计：<b>${safeTotal}</b>${itemCount > 0 ? `（${itemCount} 份）` : ''}`,
        '⏳ 您的修改已实时同步给商家。',
      ],
      approved: [
        `👨‍🍳 <b>商家已确认订单 #<code>${safeCode}</code>！</b>`,
        `💰 订单总额：<b>${safeTotal}</b>`,
        '🔥 SA KITCHEN 厨房正在为您现做备餐中。',
      ],
      shipping: [
        `🛵 <b>订单 #<code>${safeCode}</code> 正在配送中！</b>`,
        `💰 订单总额：<b>${safeTotal}</b>`,
        '📱 请留意电话或 Telegram 消息以便取餐！',
      ],
      completed: [
        `🎉 <b>订单 #<code>${safeCode}</code> 已完成！</b>`,
        '💚 感谢您支持 SA KITCHEN，祝您用餐愉快！',
      ],
      cancelled: [
        `⚠️ <b>订单 #<code>${safeCode}</code> 已取消</b>`,
        '请查看下方商家留言，如需协助可随时联系商家。',
      ],
      message: [`💬 <b>SA KITCHEN 关于订单 #<code>${safeCode}</code> 的留言：</b>`],
      shopNotePrefix: '📝 <b>商家留言：</b>\n',
      trackBtn: `🔎 查看订单进度 #${orderId}`,
      newOrderBtn: '🍜 再下一单',
    },
    fil: {
      submitted: [
        `✅ <b>Naipadala na ang Order #<code>${safeCode}</code>!</b>`,
        safeCustomer ? `👤 Tatanggap: <b>${safeCustomer}</b>` : '',
        itemCount > 0
          ? `🛒 Kabuuan: <b>${safeTotal}</b> (${itemCount} item)`
          : `💰 Kabuuan: <b>${safeTotal}</b>`,
        safeTime ? `⏰ Oras ng delivery: ${safeTime}` : '',
        '',
        '⏳ Natanggap na ng SA KITCHEN ang iyong order at kukumpirmahin agad!',
      ],
      updated: [
        `🔄 <b>Na-update ang Order #<code>${safeCode}</code>!</b>`,
        `💰 Bagong kabuuan: <b>${safeTotal}</b>`,
        '⏳ Nai-sync na sa shop ang mga pagbabago mo.',
      ],
      approved: [
        `👨‍🍳 <b>Kumpirmado na ang Order #<code>${safeCode}</code>!</b>`,
        `💰 Kabuuan: <b>${safeTotal}</b>`,
        '🔥 Inihahanda na ng SA KITCHEN ang pagkain mo.',
      ],
      shipping: [
        `🛵 <b>Papunta na ang Order #<code>${safeCode}</code>!</b>`,
        `💰 Kabuuan: <b>${safeTotal}</b>`,
        '📱 Pakibantayan ang iyong telepono / Telegram para sa rider!',
      ],
      completed: [
        `🎉 <b>Kumpleto na ang Order #<code>${safeCode}</code>!</b>`,
        '💚 Maraming salamat sa pag-order sa SA KITCHEN! Kain po tayo!',
      ],
      cancelled: [
        `⚠️ <b>Kinansela ang Order #<code>${safeCode}</code></b>`,
        'Pakitingnan ang mensahe ng shop sa ibaba o makipag-ugnayan sa amin kung kailangan ng tulong.',
      ],
      message: [`💬 <b>Mensahe mula sa SA KITCHEN para sa Order #<code>${safeCode}</code>:</b>`],
      shopNotePrefix: '📝 <b>Mensahe ng shop:</b>\n',
      trackBtn: `🔎 Tingnan ang Order #${orderId}`,
      newOrderBtn: '🍜 Umorder Ulit',
    },
    ko: {
      submitted: [
        `✅ <b>주문 #<code>${safeCode}</code> 접수가 완료되었습니다!</b>`,
        safeCustomer ? `👤 수령인: <b>${safeCustomer}</b>` : '',
        itemCount > 0
          ? `🛒 합계: <b>${safeTotal}</b> (${itemCount}개)`
          : `💰 합계: <b>${safeTotal}</b>`,
        safeTime ? `⏰ 배달 시간: ${safeTime}` : '',
        '',
        '⏳ 매장에서 주문을 확인한 후 바로 조리를 시작합니다!',
      ],
      updated: [
        `🔄 <b>주문 #<code>${safeCode}</code> 내역이 수정되었습니다!</b>`,
        `💰 변경 후 합계: <b>${safeTotal}</b>`,
        '⏳ 수정하신 내용이 매장에 실시간 반영되었습니다.',
      ],
      approved: [
        `👨‍🍳 <b>주문 #<code>${safeCode}</code> 확인 완료!</b>`,
        `💰 합계: <b>${safeTotal}</b>`,
        '🔥 SA KITCHEN 주방에서 정성껏 조리 중입니다.',
      ],
      shipping: [
        `🛵 <b>주문 #<code>${safeCode}</code> 배달이 시작되었습니다!</b>`,
        `💰 합계: <b>${safeTotal}</b>`,
        '📱 라이더 연락을 위해 전화 / 텔레그램을 확인해 주세요!',
      ],
      completed: [
        `🎉 <b>주문 #<code>${safeCode}</code> 배달 완료!</b>`,
        '💚 SA KITCHEN을 이용해 주셔서 감사합니다! 맛있게 드세요!',
      ],
      cancelled: [
        `⚠️ <b>주문 #<code>${safeCode}</code> 취소 안내</b>`,
        '아래 매장 메시지를 확인해 주시거나 문의가 필요하면 매장으로 연락해 주세요.',
      ],
      message: [`💬 <b>주문 #<code>${safeCode}</code> 관련 SA KITCHEN 메시지:</b>`],
      shopNotePrefix: '📝 <b>매장 메시지:</b>\n',
      trackBtn: `🔎 주문 진행 보기 #${orderId}`,
      newOrderBtn: '🍜 새 주문하기',
    },
  }

  const pack = templates[normLang] || templates.vi
  const baseLines = (pack[event] || pack.submitted).filter(Boolean)

  if (safeAdminMsg) {
    baseLines.push('')
    baseLines.push(
      event === 'message'
        ? `<blockquote>${safeAdminMsg}</blockquote>`
        : `${pack.shopNotePrefix}<blockquote>${safeAdminMsg}</blockquote>`,
    )
  }

  const isClosed = event === 'completed' || event === 'cancelled'
  const keyboard = isClosed
    ? [[{ text: pack.newOrderBtn, web_app: { url: newOrderUrl } }]]
    : [[{ text: pack.trackBtn, web_app: { url: trackUrl } }]]

  return {
    text: baseLines.join('\n'),
    keyboard,
  }
}

export async function handleTelegramCustomerWebhook(context) {
  const { request, env = {} } = context
  if (request.method !== 'POST') {
    return jsonResponse({ ok: false, message: 'Method not allowed' }, 405, { Allow: 'POST' })
  }

  const botToken = String(env.TELEGRAM_CUSTOMER_BOT_TOKEN || '').trim()
  if (!botToken) {
    return jsonResponse({ ok: true, skipped: 'missing_customer_bot_token' }, 200)
  }

  const expectedSecret = String(env.TELEGRAM_WEBHOOK_SECRET || '').trim()
  if (expectedSecret) {
    const incomingSecret = String(
      request.headers.get('X-Telegram-Bot-Api-Secret-Token') || '',
    ).trim()
    if (incomingSecret !== expectedSecret) {
      return jsonResponse({ ok: false, message: 'Forbidden' }, 403)
    }
  }

  let update = null
  try {
    update = await request.json()
  } catch {
    return jsonResponse({ ok: true }, 200)
  }

  const msg = update?.message
  const chatId = msg?.chat?.id
  const chatType = String(msg?.chat?.type || '')
  const rawText = String(msg?.text || '').trim()

  if (!chatId || !rawText) {
    return jsonResponse({ ok: true }, 200)
  }

  // Only reply to explicit commands in private or group chats
  if (!rawText.startsWith('/')) {
    return jsonResponse({ ok: true }, 200)
  }

  const [cmdWithBot, ...argParts] = rawText.split(/\s+/)
  const cmd = cmdWithBot.toLowerCase().split('@')[0]
  const startPayload = argParts.join(' ').trim()
  const lang = normalizeLang(msg?.from?.language_code)
  const firstName = String(msg?.from?.first_name || '').trim()
  const origin = new URL(request.url).origin || DEFAULT_ORIGIN

  if (cmd === '/start' || cmd === '/menu' || cmd === '/order') {
    const startOrderId =
      cmd === '/start' && startPayload.startsWith('order_')
        ? startPayload.slice('order_'.length).trim()
        : ''
    const { text, keyboard } = buildWelcomeReply(lang, firstName, startOrderId, origin)
    // Note: web_app inline buttons work in private chats; in group chats use direct startapp link
    const safeKeyboard =
      chatType === 'private'
        ? keyboard
        : [
            [
              {
                text: keyboard[0][0].text,
                url: startOrderId
                  ? `https://t.me/sakitchenweb_bot?startapp=order_${encodeURIComponent(startOrderId)}`
                  : 'https://t.me/sakitchenweb_bot?startapp=menu',
              },
            ],
          ]
    await sendTelegramBotMessage(botToken, chatId, text, safeKeyboard).catch(() => {})
    return jsonResponse({ ok: true }, 200)
  }

  if (cmd === '/blog') {
    const blogUrl = `${origin}/blog`
    const keyboard =
      chatType === 'private'
        ? [[{ text: '📖 Blog & Cẩm Nang SA KITCHEN', web_app: { url: blogUrl } }]]
        : [[{ text: '📖 Blog & Cẩm Nang SA KITCHEN', url: blogUrl }]]
    await sendTelegramBotMessage(
      botToken,
      chatId,
      '📖 <b>Cẩm nang ẩm thực & Tin tức mới nhất từ SA KITCHEN:</b>',
      keyboard,
    ).catch(() => {})
    return jsonResponse({ ok: true }, 200)
  }

  return jsonResponse({ ok: true }, 200)
}

export async function handleTelegramCustomerNotify(context) {
  const { request, env = {} } = context
  if (request.method !== 'POST') {
    return jsonResponse({ success: false, message: 'Method not allowed' }, 405, { Allow: 'POST' })
  }

  const botToken = String(env.TELEGRAM_CUSTOMER_BOT_TOKEN || '').trim()
  if (!botToken) {
    return jsonResponse({ success: false, skipped: true, reason: 'missing_customer_bot_token' }, 200)
  }

  let body = {}
  try {
    const parsed = await request.json()
    if (parsed && typeof parsed === 'object') body = parsed
  } catch {
    return jsonResponse({ success: false, message: 'Invalid JSON' }, 400)
  }

  const orderId = String(body.orderId || '').trim()
  const event = String(body.event || '').trim()
  const allowedEvents = ['submitted', 'updated', 'approved', 'shipping', 'completed', 'cancelled', 'message']
  if (!orderId || !allowedEvents.includes(event)) {
    return jsonResponse({ success: false, message: 'Missing orderId or valid event' }, 400)
  }

  const origin = new URL(request.url).origin || DEFAULT_ORIGIN
  const dbBase = String(env.FIREBASE_DATABASE_URL || DEFAULT_FIREBASE_DB_URL).replace(/\/+$/, '')
  const orderKey = safeFirebaseKey(orderId)

  // Always read canonical live_orders/{orderKey}/meta from Firebase RTDB to verify order state & avoid spoofing
  let fbMeta = null
  try {
    const fbRes = await fetch(`${dbBase}/live_orders/${encodeURIComponent(orderKey)}/meta.json`, {
      headers: { Accept: 'application/json' },
    })
    if (fbRes.ok) {
      fbMeta = await fbRes.json()
    }
  } catch {
    fbMeta = null
  }

  let targetChatId = String(fbMeta?.Telegram_chat_id || '').trim()
  let targetLang = String(body.lang || fbMeta?.Telegram_lang || 'vi').trim()

  // For customer submit/update, also cryptographically verify initData if provided
  if ((event === 'submitted' || event === 'updated') && body.initData) {
    const verified = await verifyTelegramInitData(body.initData, botToken)
    if (verified.ok && verified.user?.id) {
      targetChatId = String(verified.user.id)
      if (!body.lang && verified.user.language_code) {
        targetLang = verified.user.language_code
      }
    }
  }

  if (!targetChatId) {
    return jsonResponse({ success: true, skipped: true, reason: 'no_telegram_chat_id' }, 200)
  }

  // Verify status transitions against Firebase truth so unauthenticated callers cannot send fake status alerts
  const fbStatus = String(fbMeta?.Trang_thai || '').trim()
  if (event === 'submitted' || event === 'updated') {
    if (fbMeta && fbStatus && fbStatus !== 'Chờ duyệt') {
      return jsonResponse({ success: true, skipped: true, reason: 'status_mismatch' }, 200)
    }
  } else if (event === 'approved' && fbStatus !== 'Đang xử lý') {
    return jsonResponse({ success: true, skipped: true, reason: 'status_mismatch' }, 200)
  } else if (event === 'shipping' && fbStatus !== 'Đang ship') {
    return jsonResponse({ success: true, skipped: true, reason: 'status_mismatch' }, 200)
  } else if (event === 'completed' && fbStatus !== 'Hoàn thành') {
    return jsonResponse({ success: true, skipped: true, reason: 'status_mismatch' }, 200)
  } else if (event === 'cancelled' && fbStatus !== 'Đã hủy') {
    return jsonResponse({ success: true, skipped: true, reason: 'status_mismatch' }, 200)
  } else if (event === 'message' && !String(fbMeta?.Admin_message || '').trim()) {
    return jsonResponse({ success: true, skipped: true, reason: 'empty_admin_message' }, 200)
  }

  const totalAmount = Number(
    body.tongCong !== undefined
      ? body.tongCong
      : fbMeta?.Tong_cong || body.totalAmount || 0,
  )
  const currency = String(body.donViTienTe || fbMeta?.Don_vi_tien_te || 'P').trim() || 'P'
  const customerName = String(body.tenKhach || fbMeta?.Ten_khach_hang || '').trim()
  const deliveryTime = String(body.thoiGian || fbMeta?.Thoi_gian_nhan_hang || '').trim()
  const adminMessage = String(fbMeta?.Admin_message || body.adminMessage || '').trim()
  const itemCount = Math.max(0, Number(body.itemCount || 0))

  const { text, keyboard } = buildOrderStatusCustomerMessage({
    event,
    lang: targetLang,
    orderId,
    customerName,
    totalAmount,
    currency,
    itemCount,
    deliveryTime,
    adminMessage,
    origin,
  })

  try {
    const sendRes = await sendTelegramBotMessage(botToken, targetChatId, text, keyboard)
    return jsonResponse(
      {
        success: sendRes.ok,
        description: sendRes.description,
      },
      200,
    )
  } catch {
    return jsonResponse({ success: false, message: 'Failed to notify Telegram user' }, 502)
  }
}
