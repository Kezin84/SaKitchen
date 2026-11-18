export function formatOrderAmount(n) {
  return Number(n || 0).toLocaleString('vi-VN')
}

export function formatOrderCurrency(n, currency = 'P') {
  return `${formatOrderAmount(n)} ${currency || 'VND'}`
}

export function resolveOrderItemGiaGoc(item, hangHoaByMaMap = null) {
  const rawGiaGoc = Number(item?.giaGoc ?? item?.Gia_goc ?? 0)
  if (rawGiaGoc > 0) return rawGiaGoc
  const rawCode = String(item?.maHang || item?.Ma_hang || '').trim()
  if (hangHoaByMaMap && rawCode) {
    const prod = hangHoaByMaMap instanceof Map ? hangHoaByMaMap.get(rawCode) : hangHoaByMaMap[rawCode]
    if (prod) return Number(prod?.Gia_goc ?? 0)
  }
  return 0
}

export function getExportItemUnitPrice(item, { isCostMode = false, hangHoaByMaMap = null } = {}) {
  return isCostMode
    ? resolveOrderItemGiaGoc(item, hangHoaByMaMap)
    : Number(item?.giaBan ?? item?.Gia_ban ?? 0)
}

export function getExportItemLineTotal(item, { isCostMode = false, hangHoaByMaMap = null } = {}) {
  const qty = Number(item?.soLuong ?? item?.So_luong ?? 0)
  if (isCostMode) {
    return resolveOrderItemGiaGoc(item, hangHoaByMaMap) * qty
  }
  if (item?.thanhTien !== undefined) {
    return Number(item.thanhTien || 0) - Number(item?.tongGiamTru || 0)
  }
  const giaBan = Number(item?.giaBan ?? item?.Gia_ban ?? 0)
  const giam = Number(item?.giamGia ?? item?.Giam_gia ?? 0) * qty
  const ck =
    item?.Tien_chiet_khau !== undefined
      ? Number(item.Tien_chiet_khau || 0)
      : (giaBan * qty * Number(item?.Chiet_khau ?? item?.chietKhau ?? 0)) / 100
  return giaBan * qty - giam - ck
}

export function detectHasMultipleOrderMembers(list = []) {
  const ids = new Set()
  const namesWithId = new Set()
  const namesWithoutId = new Set()
  let hasGuest = false
  let hasAdmin = false

  for (const it of list) {
    if (!it) continue
    if (it.Added_by_role === 'admin' || it.Nguoi_dat === 'Quán thêm') {
      hasAdmin = true
      continue
    }
    if (it.Added_by_role === 'guest') {
      hasGuest = true
    }
    const id = String(it.Nguoi_dat_id || '').trim()
    const name = String(it.Nguoi_dat || '').trim().toLowerCase()
    if (id) {
      ids.add(id)
      if (name && !id.startsWith('local_')) namesWithId.add(name)
    } else if (name) {
      namesWithoutId.add(name)
    }
  }

  let extraNameCount = 0
  for (const name of namesWithoutId) {
    if (!namesWithId.has(name)) extraNameCount += 1
  }

  const totalDistinctCustomers = ids.size + extraNameCount
  return totalDistinctCustomers > 1 || hasGuest || (hasAdmin && totalDistinctCustomers >= 1)
}

export function getOrderPrimaryMemberHint(list = [], fallbackCustomerName = '') {
  const formName = String(fallbackCustomerName || '').trim()
  const nonAdminItems = (Array.isArray(list) ? list : []).filter(
    (it) => it && it.Added_by_role !== 'admin' && it.Nguoi_dat !== 'Quán thêm',
  )
  const hostItem =
    nonAdminItems.find((it) => it.Added_by_role === 'host') ||
    nonAdminItems.find(
      (it) => formName && String(it.Nguoi_dat || '').trim().toLowerCase() === formName.toLowerCase(),
    ) ||
    nonAdminItems[0]

  const primaryId = String(hostItem?.Nguoi_dat_id || '').trim()
  const primaryName =
    String(hostItem?.Nguoi_dat || '').trim() ||
    formName ||
    (detectHasMultipleOrderMembers(list) ? 'Trưởng nhóm' : 'Khách lẻ')
  const primaryKey = primaryId ? `m:${primaryId}` : `name:${primaryName.toLowerCase()}`

  return {
    primaryId,
    primaryName,
    primaryKey,
    formName,
  }
}

export function resolveMemberGroupKeyForItem(item, hint) {
  if (item?.Added_by_role === 'admin' || item?.Nguoi_dat === 'Quán thêm') {
    return '__admin__'
  }
  const mId = String(item?.Nguoi_dat_id || '').trim()
  if (mId) return `m:${mId}`

  const rawName = String(item?.Nguoi_dat || '').trim()
  if (!rawName || rawName.toLowerCase() === String(hint?.primaryName || '').toLowerCase()) {
    return hint?.primaryKey || 'name:khách lẻ'
  }
  return `name:${rawName.toLowerCase()}`
}

export function buildOrderMemberGroups(
  items = [],
  { tenKhachHang = '', customOrderMembers = [] } = {},
) {
  const hint = getOrderPrimaryMemberHint(items, tenKhachHang)
  const groupsMap = new Map()
  const customKeysSet = new Set(
    (customOrderMembers || []).map((cm) => String(cm?.groupKey || '').trim()).filter(Boolean),
  )

  items.forEach((item, idx) => {
    const qty = Number(item?.soLuong ?? item?.So_luong ?? 0)
    const net = getExportItemLineTotal(item, { isCostMode: false })

    if (item?.Added_by_role === 'admin' || item?.Nguoi_dat === 'Quán thêm') {
      const adminKey = '__admin__'
      if (!groupsMap.has(adminKey)) {
        groupsMap.set(adminKey, {
          groupKey: adminKey,
          memberId: 'admin',
          name: 'Quán thêm / Phụ phí',
          role: 'admin',
          badge: 'Quán thêm',
          isCustom: false,
          totalQty: 0,
          subtotal: 0,
          entries: [],
        })
      }
      const grp = groupsMap.get(adminKey)
      grp.entries.push({ item, idx })
      grp.totalQty += qty
      grp.subtotal += net
      return
    }

    const mId = String(item?.Nguoi_dat_id || '').trim()
    const rawName = String(item?.Nguoi_dat || '').trim()
    const gKey = resolveMemberGroupKeyForItem(item, hint)

    if (!groupsMap.has(gKey)) {
      const isHostLine = gKey === hint.primaryKey || item?.Added_by_role === 'host'
      const role = isHostLine ? 'host' : 'guest'
      groupsMap.set(gKey, {
        groupKey: gKey,
        memberId: mId || (isHostLine ? hint.primaryId : ''),
        name: rawName || (isHostLine ? hint.primaryName : 'Thành viên'),
        role,
        badge: '',
        isCustom: customKeysSet.has(gKey),
        totalQty: 0,
        subtotal: 0,
        entries: [],
      })
    }

    const grp = groupsMap.get(gKey)
    if (!grp.memberId && mId) grp.memberId = mId
    if ((!grp.name || grp.name === 'Thành viên') && rawName) {
      grp.name = rawName
    }
    grp.entries.push({ item, idx })
    grp.totalQty += qty
    grp.subtotal += net
  })

  for (const cm of customOrderMembers || []) {
    const cmName = String(cm?.name || '').trim()
    if (!cmName) continue
    const cmId = String(cm?.memberId || '').trim()
    const cmKey = String(cm?.groupKey || (cmId ? `m:${cmId}` : `name:${cmName.toLowerCase()}`)).trim()
    const existingByKey = groupsMap.get(cmKey)
    if (existingByKey) {
      existingByKey.isCustom = true
      continue
    }
    if (!cmId) {
      const existingByName = Array.from(groupsMap.values()).find(
        (g) =>
          g.role !== 'admin' &&
          !g.memberId &&
          String(g.name || '').trim().toLowerCase() === cmName.toLowerCase(),
      )
      if (existingByName) {
        existingByName.isCustom = true
        continue
      }
    }
    groupsMap.set(cmKey, {
      groupKey: cmKey,
      memberId: cmId,
      name: cmName,
      role: cm?.role === 'host' ? 'host' : 'guest',
      badge: '',
      isCustom: true,
      totalQty: 0,
      subtotal: 0,
      entries: [],
    })
  }

  const hasMultiplePeople = detectHasMultipleOrderMembers(items) || groupsMap.size > 1
  for (const grp of groupsMap.values()) {
    if (grp.role === 'admin') {
      grp.badge = 'Quán thêm'
    } else if (hasMultiplePeople) {
      grp.badge = grp.role === 'host' ? 'Trưởng nhóm' : 'Thành viên'
    } else {
      grp.badge = ''
    }
  }

  const rank = { host: 0, guest: 1, admin: 2 }
  const sorted = Array.from(groupsMap.values()).sort((a, b) => (rank[a.role] ?? 1) - (rank[b.role] ?? 1))

  const nameTotals = new Map()
  for (const grp of sorted) {
    if (grp.role === 'admin') continue
    const lower = String(grp.name || '').trim().toLowerCase()
    if (lower) nameTotals.set(lower, (nameTotals.get(lower) || 0) + 1)
  }
  const nameSeen = new Map()
  for (const grp of sorted) {
    if (grp.role === 'admin') {
      grp.dupTag = ''
      continue
    }
    const lower = String(grp.name || '').trim().toLowerCase()
    if (lower && (nameTotals.get(lower) || 0) > 1) {
      const seq = (nameSeen.get(lower) || 0) + 1
      nameSeen.set(lower, seq)
      grp.dupTag = `#${seq}`
    } else {
      grp.dupTag = ''
    }
  }

  return sorted
}

export function buildExportGroupedRows(items = [], { isCostMode = false, hangHoaByMaMap = null } = {}) {
  const groups = new Map()
  for (const item of items) {
    const rawCode = String(item?.maHang || item?.Ma_hang || '').trim()
    const codeKey = rawCode || item?.tenHang || item?.Ten_hang || ''
    const sizeKey = item?.size || item?.Size || ''
    const dvtKey = item?.dvt || item?.Dvt || ''
    const currency = item?.donViTienTe || item?.Don_vi_tien_te || 'P'
    const unitPrice = getExportItemUnitPrice(item, { isCostMode, hangHoaByMaMap })
    const gKey = `${codeKey}__${sizeKey}__${dvtKey}__${currency}__${unitPrice}`

    if (!groups.has(gKey)) {
      groups.set(gKey, {
        groupKey: gKey,
        tenHang: item?.tenHang || item?.Ten_hang || '',
        size: sizeKey,
        dvt: dvtKey,
        donViTienTe: currency,
        soLuong: 0,
        unitPrice,
        lineTotal: 0,
        notesSet: new Set(),
      })
    }

    const grp = groups.get(gKey)
    grp.soLuong += Number(item?.soLuong ?? item?.So_luong ?? 0)
    grp.lineTotal += getExportItemLineTotal(item, { isCostMode, hangHoaByMaMap })
    const noteStr = String(item?.ghiChuHang || item?.Ghi_chu || '').trim()
    if (noteStr) grp.notesSet.add(noteStr)
  }

  return Array.from(groups.values()).map((grp) => ({
    ...grp,
    ghiChuHang: Array.from(grp.notesSet).join('; '),
  }))
}

export function buildExportMemberSections(
  memberGroups = [],
  { isCostMode = false, hangHoaByMaMap = null } = {},
) {
  const nonEmpty = (memberGroups || []).filter((grp) => grp.entries && grp.entries.length > 0)
  const nameTotals = new Map()
  for (const grp of nonEmpty) {
    if (grp.role === 'admin') continue
    const lower = String(grp.name || '').trim().toLowerCase()
    if (lower) nameTotals.set(lower, (nameTotals.get(lower) || 0) + 1)
  }
  const nameSeen = new Map()

  return nonEmpty.map((grp) => {
    const lower = String(grp.name || '').trim().toLowerCase()
    let displayName = grp.name
    if (grp.role !== 'admin' && lower && (nameTotals.get(lower) || 0) > 1) {
      const seq = (nameSeen.get(lower) || 0) + 1
      nameSeen.set(lower, seq)
      displayName = `${grp.name} (#${seq})`
    }

    const rows = grp.entries.map(({ item }) => ({
      tenHang: item?.tenHang || item?.Ten_hang || '',
      ghiChuHang: String(item?.ghiChuHang || item?.Ghi_chu || '').trim(),
      size: item?.size || item?.Size || '',
      dvt: item?.dvt || item?.Dvt || '',
      soLuong: Number(item?.soLuong ?? item?.So_luong ?? 0),
      donViTienTe: item?.donViTienTe || item?.Don_vi_tien_te || 'P',
      unitPrice: getExportItemUnitPrice(item, { isCostMode, hangHoaByMaMap }),
      lineTotal: getExportItemLineTotal(item, { isCostMode, hangHoaByMaMap }),
    }))
    const sectionTotal = rows.reduce((s, r) => s + r.lineTotal, 0)
    return {
      groupKey: grp.groupKey,
      name: displayName,
      badge: grp.badge,
      totalQty: grp.totalQty,
      sectionTotal,
      rows,
    }
  })
}

export function buildOrderTextInvoice({
  items = [],
  tenKhachHang = '',
  diaChi = '',
  soDienThoai = '',
  thoiGianNhanHang = '',
  hinhThucThanhToan = 'TIEN_MAT',
  tongCong = 0,
  phiShip = 0,
  ckBaoGomShip = false,
  ghiChuDonHang = '',
  khuyenMaiText = '',
  nextMilestoneHintText = '',
  donViTienTe = 'P',
  groupMode = 'grouped',
  priceMode = 'giaBan',
  hangHoaByMaMap = null,
  customOrderMembers = [],
} = {}) {
  const isCostMode = priceMode === 'giaGoc'
  const isByMember = groupMode === 'by_member'

  let bodyText = ''
  if (isByMember) {
    const memberGroups = buildOrderMemberGroups(items, { tenKhachHang, customOrderMembers })
    const sections = buildExportMemberSections(memberGroups, { isCostMode, hangHoaByMaMap })
    bodyText = sections
      .map((sec) => {
        const roleLabel = sec.badge ? ` (${sec.badge})` : ''
        const header = `【${sec.name}${roleLabel} — ${formatOrderCurrency(sec.sectionTotal, donViTienTe)}】`
        const itemLines = sec.rows.map((i) => {
          const ghiChu = i.ghiChuHang ? ` (${i.ghiChuHang})` : ''
          return `- ${i.soLuong} ${i.tenHang} : ${formatOrderCurrency(i.unitPrice, i.donViTienTe)}${ghiChu}`
        })
        return [header, ...itemLines].join('\n')
      })
      .join('\n\n')
  } else {
    const groupedRows = buildExportGroupedRows(items, { isCostMode, hangHoaByMaMap })
    bodyText = groupedRows
      .map((i) => {
        const ghiChu = i.ghiChuHang ? ` (${i.ghiChuHang})` : ''
        return `${i.soLuong} ${i.tenHang} : ${formatOrderCurrency(i.unitPrice, i.donViTienTe)}${ghiChu}`
      })
      .join('\n')
  }

  const normalizedShip = Math.max(0, Number(phiShip || 0))
  const exportShip = !isCostMode ? normalizedShip : 0
  const exportTongCong = isCostMode
    ? items.reduce(
        (s, i) => s + resolveOrderItemGiaGoc(i, hangHoaByMaMap) * Number(i?.soLuong ?? i?.So_luong ?? 0),
        0,
      )
    : Number(tongCong || 0) + exportShip

  const isTransferPay = String(hinhThucThanhToan || '').trim().toUpperCase() === 'CHUYEN_KHOAN'
  const summaryLine = isCostMode
    ? isTransferPay
      ? ckBaoGomShip
        ? 'Khách CK tiền hàng + ship'
        : 'Khách CK tiền hàng'
      : `Thu cod: ${formatOrderCurrency(tongCong, donViTienTe)}`
    : exportShip > 0
      ? `Tổng cộng : ${formatOrderCurrency(tongCong, donViTienTe)} + ${formatOrderCurrency(exportShip, donViTienTe)} ship`
      : `Tổng cộng : ${formatOrderCurrency(exportTongCong, donViTienTe)}`

  const promoLine = khuyenMaiText ? `\nƯu đãi : ${khuyenMaiText}` : ''
  const nextPromoLine = nextMilestoneHintText ? `\n${nextMilestoneHintText}` : ''
  const trimmedOrderNote = String(ghiChuDonHang || '').trim()
  const orderNoteLine = trimmedOrderNote ? `\nGhi chú đơn hàng : ${trimmedOrderNote}` : ''

  return `${bodyText}\n\nĐịa chỉ: ${String(diaChi || '').trim()}\nSĐT: ${String(soDienThoai || '').trim()}\nThời gian nhận: ${String(thoiGianNhanHang || '').trim()}\n${summaryLine}${promoLine}${nextPromoLine}${orderNoteLine}`.trim()
}
