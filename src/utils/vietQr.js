/**
 * Offline EMVCo / NAPAS 247 VietQR payload generator (VND).
 * Tạo chuỗi QR chuẩn Napas 247 có sẵn số tiền & nội dung chuyển khoản, không cần gọi API ngoài.
 */

const VIET_BANK_BINS = [
  ['970422', ['MB BANK', 'MBBANK', 'MB', 'NGAN HANG QUAN DOI', 'QUAN DOI']],
  ['970436', ['VIETCOMBANK', 'VCB', 'NGOAI THUONG']],
  ['970407', ['TECHCOMBANK', 'TCB', 'KY THUONG']],
  ['970415', ['VIETINBANK', 'CTG', 'ICB', 'CONG THUONG']],
  ['970418', ['BIDV', 'DAU TU VA PHAT TRIEN']],
  ['970405', ['AGRIBANK', 'VBA', 'NONG NGHIEP']],
  ['970416', ['ACB', 'A CHAU']],
  ['970432', ['VPBANK', 'VPB', 'VIET NAM THINH VUONG']],
  ['970423', ['TPBANK', 'TPB', 'TIEN PHONG']],
  ['970403', ['SACOMBANK', 'STB', 'SAI GON THUONG TIN']],
  ['970441', ['VIB', 'QUOC TE']],
  ['970437', ['HDBANK', 'HDB', 'PHAT TRIEN TP HCM']],
  ['970426', ['MSB', 'MARITIME BANK', 'MARITIME', 'HANG HAI']],
  ['970448', ['OCB', 'PHUONG DONG']],
  ['970443', ['SHB', 'SAI GON HA NOI']],
  ['970431', ['EXIMBANK', 'EIB', 'XUAT NHAP KHAU']],
  ['970440', ['SEABANK', 'SSB', 'DONG NAM A']],
  ['970428', ['NAM A BANK', 'NAMABANK', 'NAB', 'NAM A']],
  ['970449', ['LPBANK', 'LIENVIETPOSTBANK', 'LIENVIET', 'LPB', 'LOC PHAT']],
  ['970452', ['KIENLONGBANK', 'KIEN LONG', 'KLB']],
  ['970425', ['ABBANK', 'ABB', 'AN BINH']],
  ['970409', ['BAC A BANK', 'BACABANK', 'BAB', 'BAC A']],
  ['963388', ['TIMO', 'TIMO PLUS']],
  ['970454', ['BVBANK', 'VIET CAPITAL', 'VIETCAPITAL', 'BAN VIET']],
  ['546034', ['CAKE BY VPBANK', 'CAKE']],
  ['546035', ['UBANK BY VPBANK', 'UBANK']],
  ['970424', ['SHINHAN BANK', 'SHINHAN', 'SHBVN']],
  ['970458', ['UOB']],
  ['422589', ['CIMB']],
  ['970457', ['WOORI BANK', 'WOORI']],
  ['970410', ['STANDARD CHARTERED']],
  ['458761', ['HSBC']],
  ['970434', ['INDOVINA', 'IVB']],
  ['970400', ['SAIGONBANK', 'SGB']],
  ['970433', ['VIETBANK', 'VBB']],
  ['970427', ['VIETABANK', 'VIET A BANK', 'VAB']],
  ['970438', ['BAOVIETBANK', 'BAO VIET', 'BVB']],
  ['970430', ['PGBANK', 'PG BANK', 'PGB']],
  ['970419', ['NCB', 'QUOC DAN']],
  ['970412', ['PVCOMBANK', 'PVB']],
  ['970429', ['SCB']],
  ['970446', ['COOPBANK', 'CO-OPBANK', 'CO OP BANK']],
  ['970406', ['DONG A BANK', 'DONGABANK', 'DAB', 'VIKKI', 'DONG A']],
  ['970414', ['OCEANBANK', 'OCEAN BANK', 'MBV']],
  ['970444', ['CBBANK', 'VNCB']],
  ['970408', ['GPBANK', 'GPB']],
  ['970421', ['VRB']],
  ['970439', ['PUBLIC BANK', 'PBVN']],
  ['971005', ['VIETTEL MONEY', 'VIETTELPAY']],
  ['971011', ['VNPT MONEY', 'VNPTPAY']],
]

const SORTED_BANK_MATCHERS = VIET_BANK_BINS.flatMap(([bin, aliases]) =>
  aliases.map((alias) => ({ bin, alias })),
).sort((a, b) => b.alias.length - a.alias.length)

export function toAsciiClean(str = '') {
  return String(str || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .replace(/[^A-Za-z0-9 _\-./]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function normalizeBankLookup(str = '') {
  return toAsciiClean(str)
    .toUpperCase()
    .replace(/[_\-./]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function resolveVietBankBin(bankName = '') {
  const norm = normalizeBankLookup(bankName)
  if (!norm) return ''

  const directBin = norm.match(/\b(9704\d{2}|963388|546034|546035|422589|458761|9710\d{2})\b/)
  if (directBin) return directBin[1]

  const compact = norm.replace(/\s+/g, '')
  for (const { bin, alias } of SORTED_BANK_MATCHERS) {
    const aliasCompact = alias.replace(/\s+/g, '')
    if (norm === alias || compact === aliasCompact) return bin
  }

  for (const { bin, alias } of SORTED_BANK_MATCHERS) {
    if (alias.length <= 3) {
      const re = new RegExp(`(^|\\s)${alias}(\\s|$)`)
      if (re.test(norm)) return bin
    } else if (norm.includes(alias) || compact.includes(alias.replace(/\s+/g, ''))) {
      return bin
    }
  }

  return ''
}

export function parseBankAccountInfo(info) {
  if (!info || typeof info !== 'object') return null
  const currency = String(info.Don_vi_tien_te || 'VND').trim().toUpperCase()
  const lines = String(info.ThongTin || '')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)

  const rawStkLine = lines[0] || ''
  const rawBankLine = lines[1] || ''
  const rawOwnerLine = lines[2] || ''

  const stk = rawStkLine
    .replace(/^(stk|so\s*tk|so\s*tai\s*khoan|account)\s*[:\-]?\s*/i, '')
    .replace(/[^A-Za-z0-9]/g, '')

  let bin = resolveVietBankBin(rawBankLine)
  if (!bin && info.Tieu_de) {
    bin = resolveVietBankBin(info.Tieu_de)
  }

  const qrImgSrc = String(info.QR_IMG_base64 || info.QR_IMG || '').trim()
  const isValidVietQr = Boolean(bin && stk && currency === 'VND')

  return {
    id: info.ID || '',
    title: String(info.Tieu_de || 'QR CHUYỂN KHOẢN').trim(),
    stk,
    bankName: rawBankLine,
    ownerName: rawOwnerLine,
    bin,
    currency,
    tiGia: Number(info.Ti_gia || 0),
    qrImgSrc,
    isValidVietQr,
    hasAnyQr: isValidVietQr || Boolean(qrImgSrc),
  }
}

function tlv(id, value) {
  const str = String(value ?? '')
  const len = String(str.length).padStart(2, '0')
  return `${id}${len}${str}`
}

function crc16Ccitt(str) {
  let crc = 0xffff
  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xffff
      } else {
        crc = (crc << 1) & 0xffff
      }
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0')
}

export function buildVietQrPayload({ bin, accountNo, amount = 0, addInfo = '' }) {
  const cleanBin = String(bin || '').replace(/\D/g, '')
  const cleanAcc = String(accountNo || '').replace(/[^A-Za-z0-9]/g, '')
  if (!cleanBin || !cleanAcc) return ''

  const beneficiaryOrg = tlv('00', cleanBin) + tlv('01', cleanAcc)
  const merchantAccount =
    tlv('00', 'A000000727') + tlv('01', beneficiaryOrg) + tlv('02', 'QRIBFTTA')

  const roundedAmt = Math.round(Number(amount || 0))
  const isDynamic = Number.isFinite(roundedAmt) && roundedAmt > 0

  const parts = [
    tlv('00', '01'),
    tlv('01', isDynamic ? '12' : '11'),
    tlv('38', merchantAccount),
    tlv('53', '704'),
  ]

  if (isDynamic) {
    parts.push(tlv('54', String(roundedAmt)))
  }

  parts.push(tlv('58', 'VN'))

  const cleanMemo = toAsciiClean(addInfo).slice(0, 50)
  if (cleanMemo) {
    parts.push(tlv('62', tlv('08', cleanMemo)))
  }

  const withoutCrc = `${parts.join('')}6304`
  return `${withoutCrc}${crc16Ccitt(withoutCrc)}`
}
