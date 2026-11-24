// Vercel Serverless Function: Send new customer order alerts to Telegram group/chat

const DEFAULT_ADMIN_ORDERS_URL = 'https://sakitchen.shop/admin'
const TELEGRAM_MAX_TEXT = 3900

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function formatAmount(amount, currency = 'P') {
  const num = Number(amount || 0)
  const formatted = Number.isFinite(num) ? num.toLocaleString('en-US') : '0'
  const cur = String(currency || 'P').trim() || 'P'
  if (cur.toUpperCase() === 'VND' || cur === 'đ') return `${formatted}đ`
  return `${formatted} ${cur}`
}

function formatPaymentLabel(method) {
  const m = String(method || '').trim().toUpperCase()
  if (m === 'CHUYEN_KHOAN') return 'Chuyển khoản'
  if (m === 'TIEN_MAT') return 'Tiền mặt'
  return method ? String(method) : 'Tiền mặt'
}

function buildOrderMessage(payload = {}, adminUrl = DEFAULT_ADMIN_ORDERS_URL) {
  const orderId = String(payload.orderId || '').trim() || 'WEB'
  const isUpdate = Boolean(payload.isUpdate)
  const rawChanges = Array.isArray(payload.updateChanges)
    ? payload.updateChanges.map((c) => String(c || '').trim()).filter(Boolean)
    : []
  const tenKhach = String(payload.tenKhach || 'Khách lẻ').trim() || 'Khách lẻ'
  const sdt = String(payload.sdt || '').trim()
  const diaChi = String(payload.diaChi || '').trim()
  const thoiGian = String(payload.thoiGian || '').trim()
  const hinhThucTT = formatPaymentLabel(payload.hinhThucTT)
  const ghiChu = String(payload.ghiChu || '').trim()
  const khuyenMai = String(payload.khuyenMai || '').trim()
  const donViTienTe = String(payload.donViTienTe || 'P').trim() || 'P'
  const items = Array.isArray(payload.items) ? payload.items : []
  const totalQty = items.reduce((sum, it) => sum + Math.max(0, Number(it?.So_luong || 0)), 0)

  const headerLines = [
    isUpdate
      ? `🔄 <b>KHÁCH CẬP NHẬT ĐƠN #<code>${escapeHtml(orderId)}</code></b>`
      : `🔔 <b>CÓ ĐƠN HÀNG MỚI #<code>${escapeHtml(orderId)}</code></b>`,
    `👤 Khách: <b>${escapeHtml(tenKhach)}</b>`,
  ]
  if (sdt) headerLines.push(`📞 SĐT / Telegram: <code>${escapeHtml(sdt)}</code>`)
  if (diaChi) headerLines.push(`📍 Địa chỉ: ${escapeHtml(diaChi)}`)
  if (thoiGian) headerLines.push(`⏰ Nhận hàng: ${escapeHtml(thoiGian)}`)
  headerLines.push(`💳 Thanh toán: ${escapeHtml(hinhThucTT)}`)

  const changeSectionLines = []
  if (isUpdate && rawChanges.length > 0) {
    const maxChanges = 12
    const shownChanges = rawChanges.slice(0, maxChanges)
    changeSectionLines.push('', '✏️ <b>Thay đổi mới:</b>')
    for (const ch of shownChanges) {
      changeSectionLines.push(`• ${escapeHtml(ch)}`)
    }
    if (rawChanges.length > maxChanges) {
      changeSectionLines.push(`• ... và ${rawChanges.length - maxChanges} thay đổi khác`)
    }
  }

  const footerLines = []
  if (khuyenMai) footerLines.push(`🎁 Khuyến mãi: ${escapeHtml(khuyenMai)}`)
  if (ghiChu) footerLines.push(`📝 Ghi chú: ${escapeHtml(ghiChu)}`)
  footerLines.push(
    `💰 Tổng cộng: <b>${escapeHtml(formatAmount(payload.tongCong, donViTienTe))}</b>`,
    `🔗 Quản lý đơn: <a href="${escapeHtml(adminUrl)}">${escapeHtml(adminUrl)}</a>`,
  )

  const detailTitle = isUpdate
    ? `🛒 <b>Chi tiết sau cập nhật (${totalQty} phần):</b>`
    : `🛒 <b>Chi tiết (${totalQty} phần):</b>`

  const itemLines = []
  for (let idx = 0; idx < items.length; idx += 1) {
    const it = items[idx] || {}
    const name = String(it.Ten_hang || it.Ma_hang || 'Món').trim()
    const qty = Math.max(1, Number(it.So_luong || 1))
    const lineTotal = Number(it.Gia_ban || 0) * qty
    const cur = String(it.Don_vi_tien_te || donViTienTe).trim() || donViTienTe
    const notePart = String(it.Ghi_chu || '').trim()
      ? ` <i>(${escapeHtml(it.Ghi_chu)})</i>`
      : ''
    const memberPart =
      String(it.Nguoi_dat || '').trim() && String(it.Nguoi_dat || '').trim() !== tenKhach
        ? ` [${escapeHtml(it.Nguoi_dat)}]`
        : ''
    const nextLine = `• ${escapeHtml(name)} ×${qty}${memberPart} — ${escapeHtml(
      formatAmount(lineTotal, cur),
    )}${notePart}`

    const previewText = [
      ...headerLines,
      ...changeSectionLines,
      '',
      detailTitle,
      ...itemLines,
      nextLine,
      '',
      ...footerLines,
    ].join('\n')

    if (previewText.length > TELEGRAM_MAX_TEXT) {
      itemLines.push(`• ... và ${items.length - idx} món khác`)
      break
    }
    itemLines.push(nextLine)
  }

  return [
    ...headerLines,
    ...changeSectionLines,
    '',
    detailTitle,
    ...itemLines,
    '',
    ...footerLines,
  ].join('\n')
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ success: false, message: 'Method not allowed' })
  }

  const botToken = String(process.env.TELEGRAM_BOT_TOKEN || '').trim()
  const rawChatIds = String(process.env.TELEGRAM_CHAT_ID || '').trim()
  const chatIds = rawChatIds
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean)

  if (!botToken || !chatIds.length) {
    return res.status(500).json({
      success: false,
      message: 'Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID environment variable',
    })
  }

  let body = req.body
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body)
    } catch {
      body = {}
    }
  }
  if (!body || typeof body !== 'object') {
    body = {}
  }

  const adminUrl =
    String(process.env.ADMIN_ORDERS_URL || body.adminUrl || DEFAULT_ADMIN_ORDERS_URL).trim() ||
    DEFAULT_ADMIN_ORDERS_URL
  const text = buildOrderMessage(body, adminUrl)
  const endpoint = `https://api.telegram.org/bot${botToken}/sendMessage`

  try {
    const results = await Promise.all(
      chatIds.map(async (chatId) => {
        const tgRes = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text,
            parse_mode: 'HTML',
            disable_web_page_preview: true,
            reply_markup: {
              inline_keyboard: [
                [
                  {
                    text: '📋 Vào trang Quản lý Đơn hàng',
                    url: adminUrl,
                  },
                ],
              ],
            },
          }),
        })
        const data = await tgRes.json().catch(() => ({}))
        return { chatId, ok: Boolean(tgRes.ok && data?.ok), description: data?.description || '' }
      }),
    )

    const allOk = results.every((r) => r.ok)
    return res.status(allOk ? 200 : 502).json({
      success: allOk,
      results,
    })
  } catch (err) {
    console.error('Telegram order notification error:', err)
    return res.status(502).json({
      success: false,
      message: 'Failed to send Telegram notification',
    })
  }
}
