export function normalizeNccDiscountType(rawType) {
  return String(rawType || '').trim() === 'money' ? 'money' : 'percent'
}

export function normalizeNccDiscountValue(rawVal) {
  const num = Number(rawVal)
  return Number.isFinite(num) && num > 0 ? num : 0
}

export function getNccDiscountPerUnit(giaGoc, source) {
  const cost = Math.max(0, Number(giaGoc || 0))
  const type = normalizeNccDiscountType(source?.Ncc_loai_giam ?? source?.nccLoaiGiam)
  const val = normalizeNccDiscountValue(source?.Ncc_gia_tri_giam ?? source?.nccGiaTriGiam)
  if (!val) return 0
  return type === 'money' ? val : (cost * val) / 100
}

export function calcOrderLineProfit({
  giaBan = 0,
  giaGoc = 0,
  soLuong = 1,
  giamGia = 0,
  ck1sp = 0,
  nccLoaiGiam = 'percent',
  nccGiaTriGiam = 0,
}) {
  const qty = Math.max(0, Number(soLuong || 0))
  const sell = Number(giaBan || 0)
  const cost = Number(giaGoc || 0)
  const disc = Number(giamGia || 0)
  const ck = Number(ck1sp || 0)
  const nccPerUnit = getNccDiscountPerUnit(cost, {
    Ncc_loai_giam: nccLoaiGiam,
    Ncc_gia_tri_giam: nccGiaTriGiam,
  })
  return (nccPerUnit + sell - ck - cost - disc) * qty
}

export function formatNccDiscountLabel(source, currency = 'P') {
  const type = normalizeNccDiscountType(source?.Ncc_loai_giam ?? source?.nccLoaiGiam)
  const val = normalizeNccDiscountValue(source?.Ncc_gia_tri_giam ?? source?.nccGiaTriGiam)
  if (!val) return ''
  return type === 'money' ? `+${val.toLocaleString('vi-VN')} ${currency}` : `+${val}%`
}
