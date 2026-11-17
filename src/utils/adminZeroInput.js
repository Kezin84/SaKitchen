/**
 * Cải thiện UX cho các ô nhập giá tiền / số lượng trong trang Admin:
 * - Giữ nguyên số `0` khi giá trị bằng 0.
 * - Khi bấm/focus vào ô đang có giá trị `0`, tự bôi đen toàn bộ để gõ số mới đè lên ngay
 *   mà không phải bấm Backspace xóa số `0`.
 * - Lớp bảo vệ kép ở capture phase: tự chuẩn hóa `05` -> `5` nếu thiết bị mobile bỏ qua selection,
 *   nhưng vẫn giữ `0.` / `0.5` cho các ô nhập số thập phân.
 * - Khi xóa trắng ô rồi blur ra ngoài, tự trả về `0` (hoặc `min` nếu `min > 0`).
 */

function isTargetNumericInput(el) {
  if (typeof HTMLInputElement === 'undefined' || !(el instanceof HTMLInputElement)) {
    return false
  }
  if (el.readOnly || el.disabled) return false
  if (el.classList.contains('pos-number-input')) return false
  if (el.dataset.skipZeroBehavior === 'true') return false

  if (el.type === 'number') return true
  if (el.type === 'text') {
    const mode = String(el.inputMode || '').toLowerCase()
    return (
      mode === 'numeric' ||
      mode === 'decimal' ||
      el.classList.contains('money-input') ||
      el.classList.contains('ncc-val-input')
    )
  }
  return false
}

function isZeroInputValue(val) {
  const trimmed = String(val ?? '').trim()
  if (!trimmed) return false
  const normalized = trimmed.replace(/,/g, '')
  if (!/^-?[\d.]+$/.test(normalized)) return false
  return Number(normalized) === 0
}

function selectInputAll(el) {
  try {
    if (el.type === 'number') {
      el.select()
    } else {
      el.setSelectionRange(0, el.value.length)
    }
  } catch {
    try {
      el.select()
    } catch {
      // Ignore browsers that block selection APIs on specific input states
    }
  }
}

export function attachAdminZeroInputBehavior() {
  if (typeof document === 'undefined') return () => {}

  let pendingMouseUpSelect = null
  let syntheticDispatchTarget = null

  const onPointerDown = (e) => {
    const el = e.target
    if (!isTargetNumericInput(el)) return
    if (isZeroInputValue(el.value)) {
      pendingMouseUpSelect = el
    } else if (pendingMouseUpSelect === el) {
      pendingMouseUpSelect = null
    }
  }

  const onFocusIn = (e) => {
    const el = e.target
    if (!isTargetNumericInput(el)) return
    if (!isZeroInputValue(el.value)) return

    pendingMouseUpSelect = el
    selectInputAll(el)
    requestAnimationFrame(() => {
      if (document.activeElement === el && isZeroInputValue(el.value)) {
        selectInputAll(el)
      }
    })
  }

  const onMouseUp = (e) => {
    const el = e.target
    if (pendingMouseUpSelect !== el) {
      pendingMouseUpSelect = null
      return
    }
    pendingMouseUpSelect = null

    if (!isTargetNumericInput(el)) return
    if (document.activeElement === el && isZeroInputValue(el.value)) {
      e.preventDefault()
      selectInputAll(el)
      requestAnimationFrame(() => {
        if (document.activeElement === el && isZeroInputValue(el.value)) {
          selectInputAll(el)
        }
      })
    }
  }

  const onInputCapture = (e) => {
    const el = e.target
    if (el === syntheticDispatchTarget) return
    if (!isTargetNumericInput(el)) return

    const raw = String(el.value ?? '')
    if (!/^(-?)0+(?=\d)/.test(raw)) return

    const clean = raw.replace(/^(-?)0+(?=\d)/, '$1')
    if (clean === raw) return

    if (el.type === 'number') {
      el.value = clean
      return
    }

    let prevCaret = null
    try {
      prevCaret = el.selectionStart
    } catch {
      prevCaret = null
    }
    const diff = raw.length - clean.length
    el.value = clean
    if (typeof prevCaret === 'number') {
      const nextCaret = Math.max(0, prevCaret - diff)
      try {
        el.setSelectionRange(nextCaret, nextCaret)
      } catch {
        // Ignore if input does not support selection range
      }
    }
  }

  const onFocusOut = (e) => {
    const el = e.target
    if (pendingMouseUpSelect === el) {
      pendingMouseUpSelect = null
    }
    if (!isTargetNumericInput(el)) return
    if (String(el.value ?? '').trim() !== '') return

    const minNum = el.min !== '' ? Number(el.min) : NaN
    const fallback = Number.isFinite(minNum) && minNum > 0 ? String(minNum) : '0'
    el.value = fallback

    syntheticDispatchTarget = el
    try {
      el.dispatchEvent(new Event('input', { bubbles: true }))
    } finally {
      syntheticDispatchTarget = null
    }
  }

  document.addEventListener('pointerdown', onPointerDown, true)
  document.addEventListener('focusin', onFocusIn, true)
  document.addEventListener('mouseup', onMouseUp, true)
  document.addEventListener('input', onInputCapture, true)
  document.addEventListener('focusout', onFocusOut, true)

  return () => {
    document.removeEventListener('pointerdown', onPointerDown, true)
    document.removeEventListener('focusin', onFocusIn, true)
    document.removeEventListener('mouseup', onMouseUp, true)
    document.removeEventListener('input', onInputCapture, true)
    document.removeEventListener('focusout', onFocusOut, true)
    pendingMouseUpSelect = null
    syntheticDispatchTarget = null
  }
}
