<script setup>
import { ref, watch, onMounted, nextTick } from 'vue'
import { normalizeBannerLink } from '@/utils/bannerLink.js'
import { sanitizeFeedCaptionHtml, stripFeedCaptionToPlainText } from '@/utils/feedCaption.js'

const props = defineProps({
  modelValue: {
    type: String,
    default: '',
  },
  placeholder: {
    type: String,
    default: 'Nhập nội dung bài đăng...',
  },
  inModal: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:modelValue', 'paste-images'])

const editorRef = ref(null)
const linkUrlInputRef = ref(null)
const isFocused = ref(false)
const isEmpty = ref(true)

/* LINK POPOVER & INSPECTOR STATE */
const showLinkPopover = ref(false)
const linkUrl = ref('')
const linkText = ref('')
const needsLinkText = ref(false)
const linkError = ref('')
const activeAnchorHref = ref('')

let savedRange = null
let activeAnchorNode = null

function checkEmptyState() {
  const el = editorRef.value
  if (!el) {
    isEmpty.value = true
    return
  }
  const plain = stripFeedCaptionToPlainText(el.innerHTML)
  isEmpty.value = !plain
}

function syncFromModelValue(val) {
  const el = editorRef.value
  if (!el) return
  const sanitized = sanitizeFeedCaptionHtml(val)
  if (el.innerHTML !== sanitized) {
    el.innerHTML = sanitized
  }
  checkEmptyState()
}

watch(
  () => props.modelValue,
  (newVal) => {
    if (!isFocused.value || !newVal) {
      syncFromModelValue(newVal)
    }
  },
)

onMounted(() => {
  syncFromModelValue(props.modelValue)
})

function emitCleanHtml() {
  const el = editorRef.value
  if (!el) return
  checkEmptyState()
  const cleaned = isEmpty.value ? '' : sanitizeFeedCaptionHtml(el.innerHTML)
  emit('update:modelValue', cleaned)
}

function findClosestAnchor(node) {
  let cur = node
  const root = editorRef.value
  while (cur && cur !== root) {
    if (cur.nodeType === 1 && cur.tagName === 'A') {
      return cur
    }
    cur = cur.parentNode
  }
  return null
}

function updateSelectionInspector() {
  const sel = window.getSelection()
  if (!sel || !sel.rangeCount || !editorRef.value) {
    activeAnchorHref.value = ''
    activeAnchorNode = null
    return
  }
  const range = sel.getRangeAt(0)
  if (!editorRef.value.contains(range.commonAncestorContainer)) {
    activeAnchorHref.value = ''
    activeAnchorNode = null
    return
  }
  const anchor = findClosestAnchor(range.startContainer) || findClosestAnchor(range.endContainer)
  if (anchor) {
    activeAnchorNode = anchor
    activeAnchorHref.value = anchor.getAttribute('href') || ''
  } else {
    activeAnchorNode = null
    activeAnchorHref.value = ''
  }
}

function saveCurrentSelection() {
  const sel = window.getSelection()
  if (sel && sel.rangeCount > 0 && editorRef.value?.contains(sel.anchorNode)) {
    savedRange = sel.getRangeAt(0).cloneRange()
  }
}

function restoreSavedSelection() {
  if (!savedRange) return
  const sel = window.getSelection()
  if (!sel) return
  sel.removeAllRanges()
  sel.addRange(savedRange)
}

function execInlineFormat(cmd) {
  editorRef.value?.focus()
  document.execCommand(cmd, false, null)
  emitCleanHtml()
}

async function openLinkDialog() {
  linkError.value = ''
  const el = editorRef.value
  if (!el) return

  const sel = window.getSelection()
  if (sel && sel.rangeCount > 0 && el.contains(sel.anchorNode)) {
    savedRange = sel.getRangeAt(0).cloneRange()
  } else {
    el.focus()
    const fallbackRange = document.createRange()
    fallbackRange.selectNodeContents(el)
    fallbackRange.collapse(false)
    savedRange = fallbackRange
  }

  const existingAnchor =
    findClosestAnchor(savedRange.startContainer) || findClosestAnchor(savedRange.endContainer)

  if (existingAnchor) {
    activeAnchorNode = existingAnchor
    const r = document.createRange()
    r.selectNodeContents(existingAnchor)
    savedRange = r
    linkUrl.value = existingAnchor.getAttribute('href') || ''
    linkText.value = existingAnchor.textContent || ''
    needsLinkText.value = false
  } else {
    const selectedStr = savedRange.toString()
    linkUrl.value = ''
    linkText.value = selectedStr
    needsLinkText.value = !selectedStr.trim()
  }

  showLinkPopover.value = true
  await nextTick()
  linkUrlInputRef.value?.focus()
}

function closeLinkDialog() {
  showLinkPopover.value = false
  linkError.value = ''
}

function applyLink() {
  const normalized = normalizeBannerLink(linkUrl.value)
  if (!normalized) {
    linkError.value = 'Đường dẫn chưa hợp lệ (VD: https://... hoặc t.me/...)'
    return
  }

  const el = editorRef.value
  if (!el) return
  el.focus()
  restoreSavedSelection()

  const existingAnchor =
    activeAnchorNode && el.contains(activeAnchorNode) ? activeAnchorNode : null

  if (existingAnchor) {
    existingAnchor.setAttribute('href', normalized)
    existingAnchor.setAttribute('target', '_blank')
    existingAnchor.setAttribute('rel', 'noopener noreferrer')
  } else {
    const sel = window.getSelection()
    const range = sel && sel.rangeCount > 0 ? sel.getRangeAt(0) : savedRange
    if (!range) return

    const displayLabel = (range.toString() || linkText.value || normalized).trim()
    range.deleteContents()

    const a = document.createElement('a')
    a.setAttribute('href', normalized)
    a.setAttribute('target', '_blank')
    a.setAttribute('rel', 'noopener noreferrer')
    a.textContent = displayLabel
    range.insertNode(a)

    // Move caret right after the newly inserted link
    const after = document.createRange()
    after.setStartAfter(a)
    after.collapse(true)
    sel?.removeAllRanges()
    sel?.addRange(after)
  }

  closeLinkDialog()
  updateSelectionInspector()
  emitCleanHtml()
}

function removeActiveLink() {
  const el = editorRef.value
  if (!el) return

  const targetAnchor = activeAnchorNode && el.contains(activeAnchorNode) ? activeAnchorNode : null
  if (targetAnchor) {
    const parent = targetAnchor.parentNode
    while (targetAnchor.firstChild) {
      parent.insertBefore(targetAnchor.firstChild, targetAnchor)
    }
    parent.removeChild(targetAnchor)
  } else {
    el.focus()
    restoreSavedSelection()
    document.execCommand('unlink', false, null)
  }

  activeAnchorNode = null
  activeAnchorHref.value = ''
  closeLinkDialog()
  emitCleanHtml()
}

function onEditorKeydown(e) {
  const isMod = e.ctrlKey || e.metaKey
  if (isMod && e.key.toLowerCase() === 'k') {
    e.preventDefault()
    openLinkDialog()
  } else if (isMod && e.key.toLowerCase() === 'b') {
    e.preventDefault()
    execInlineFormat('bold')
  } else if (isMod && e.key.toLowerCase() === 'i') {
    e.preventDefault()
    execInlineFormat('italic')
  }
}

function onEditorPaste(e) {
  const items = Array.from(e.clipboardData?.items || [])
  const imageFiles = items
    .filter((it) => it.type && it.type.startsWith('image/'))
    .map((it) => it.getAsFile())
    .filter(Boolean)

  if (imageFiles.length) {
    e.preventDefault()
    emit('paste-images', imageFiles)
    return
  }

  const plainText = String(e.clipboardData?.getData('text/plain') || '')
  e.preventDefault()
  if (!plainText) return

  // WordPress-style quick link paste: if text is highlighted and clipboard is a single URL, wrap selection as a link!
  const sel = window.getSelection()
  const selectedStr = sel && sel.rangeCount > 0 ? sel.toString().trim() : ''
  const trimmedClip = plainText.trim()
  const isSingleLineUrl =
    selectedStr &&
    !/\s/.test(trimmedClip) &&
    (/^https?:\/\//i.test(trimmedClip) || /^t\.me\//i.test(trimmedClip)) &&
    Boolean(normalizeBannerLink(trimmedClip))

  if (isSingleLineUrl && sel && sel.rangeCount > 0) {
    const validHref = normalizeBannerLink(trimmedClip)
    const range = sel.getRangeAt(0)
    const label = range.toString()
    range.deleteContents()
    const a = document.createElement('a')
    a.setAttribute('href', validHref)
    a.setAttribute('target', '_blank')
    a.setAttribute('rel', 'noopener noreferrer')
    a.textContent = label
    range.insertNode(a)

    const after = document.createRange()
    after.setStartAfter(a)
    after.collapse(true)
    sel.removeAllRanges()
    sel.addRange(after)
    updateSelectionInspector()
    emitCleanHtml()
    return
  }

  document.execCommand('insertText', false, plainText)
  emitCleanHtml()
}
</script>

<template>
  <div class="fce-wrap" :class="{ 'in-modal': inModal, 'is-focused': isFocused }">
    <!-- MINI FORMATTING TOOLBAR (WORDPRESS INLINE LINK STYLE) -->
    <div class="fce-format-bar">
      <button
        type="button"
        class="fce-fmt-btn is-link-btn"
        :class="{ active: showLinkPopover || Boolean(activeAnchorHref) }"
        title="Bôi đen chữ rồi bấm để gắn link (Ctrl + K)"
        @mousedown.prevent="saveCurrentSelection"
        @click="openLinkDialog"
      >
        <i class="ri-link"></i>
        <span>Gắn link</span>
      </button>

      <button
        v-if="activeAnchorHref"
        type="button"
        class="fce-fmt-btn is-unlink-btn"
        title="Gỡ link khỏi đoạn chữ"
        @mousedown.prevent
        @click="removeActiveLink"
      >
        <i class="ri-link-unlink"></i>
        <span>Gỡ link</span>
      </button>

      <span class="fce-sep"></span>

      <button
        type="button"
        class="fce-fmt-btn icon-only"
        title="In đậm (Ctrl + B)"
        @mousedown.prevent
        @click="execInlineFormat('bold')"
      >
        <i class="ri-bold"></i>
      </button>

      <button
        type="button"
        class="fce-fmt-btn icon-only"
        title="In nghiêng (Ctrl + I)"
        @mousedown.prevent
        @click="execInlineFormat('italic')"
      >
        <i class="ri-italic"></i>
      </button>

      <span class="fce-hint">
        Bôi đen chữ rồi bấm Gắn link (hoặc dán thẳng URL đè lên chữ đã bôi)
      </span>
    </div>

    <!-- WORDPRESS-STYLE LINK POPOVER BAR -->
    <div v-if="showLinkPopover" class="fce-link-popover">
      <div class="fce-lp-inputs">
        <input
          v-if="needsLinkText"
          v-model="linkText"
          type="text"
          class="fce-lp-input is-text"
          placeholder="Chữ hiển thị (VD: Xem tại đây)"
          @keydown.enter.prevent="applyLink"
          @keydown.esc.prevent="closeLinkDialog"
        />
        <div class="fce-lp-url-box">
          <i class="ri-links-line"></i>
          <input
            ref="linkUrlInputRef"
            v-model="linkUrl"
            type="text"
            class="fce-lp-input"
            placeholder="Dán hoặc nhập link (VD: https://... hoặc t.me/...)"
            @keydown.enter.prevent="applyLink"
            @keydown.esc.prevent="closeLinkDialog"
          />
        </div>
        <button type="button" class="fce-lp-apply" @click="applyLink">
          <i class="ri-check-line"></i>
          <span>Áp dụng</span>
        </button>
        <button type="button" class="fce-lp-cancel" title="Đóng" @click="closeLinkDialog">
          <i class="ri-close-line"></i>
        </button>
      </div>
      <div v-if="linkError" class="fce-lp-error">
        <i class="ri-error-warning-line"></i>
        <span>{{ linkError }}</span>
      </div>
    </div>

    <!-- ACTIVE LINK INSPECTOR BAR (WHEN CURSOR IS ON AN EXISTING LINK) -->
    <div v-else-if="activeAnchorHref" class="fce-active-link-bar">
      <i class="ri-external-link-line"></i>
      <a :href="activeAnchorHref" target="_blank" rel="noopener noreferrer" class="fce-alb-url">
        {{ activeAnchorHref }}
      </a>
      <button type="button" class="fce-alb-act" @mousedown.prevent @click="openLinkDialog">
        <i class="ri-pencil-line"></i>
        <span>Sửa</span>
      </button>
      <button type="button" class="fce-alb-act is-danger" @mousedown.prevent @click="removeActiveLink">
        <i class="ri-link-unlink"></i>
        <span>Gỡ</span>
      </button>
    </div>

    <!-- RICH CONTENTEDITABLE SURFACE -->
    <div class="fce-editor-stage">
      <div v-if="isEmpty" class="fce-placeholder" aria-hidden="true">
        {{ placeholder }}
      </div>
      <div
        ref="editorRef"
        class="fce-editable"
        contenteditable="true"
        role="textbox"
        aria-multiline="true"
        @focus="isFocused = true; updateSelectionInspector()"
        @blur="isFocused = false; emitCleanHtml()"
        @input="emitCleanHtml(); updateSelectionInspector()"
        @keyup="updateSelectionInspector"
        @mouseup="updateSelectionInspector"
        @keydown="onEditorKeydown"
        @paste="onEditorPaste"
      ></div>
    </div>
  </div>
</template>

<style scoped>
.fce-wrap {
  border-radius: 12px;
  background: rgba(15, 23, 42, 0.45);
  border: 1px solid rgba(148, 163, 184, 0.18);
  transition: border-color 0.18s ease;
}

.fce-wrap.is-focused {
  border-color: rgba(74, 222, 128, 0.5);
}

.fce-wrap.in-modal {
  background: rgba(15, 23, 42, 0.68);
}

.fce-format-bar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  padding: 8px 10px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.14);
}

.fce-fmt-btn {
  height: 30px;
  padding: 0 10px;
  border-radius: 7px;
  border: 1px solid rgba(148, 163, 184, 0.24);
  background: rgba(30, 41, 59, 0.85);
  color: #e2e8f0;
  font-size: 12px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.fce-fmt-btn.icon-only {
  width: 30px;
  padding: 0;
  justify-content: center;
  font-size: 14px;
}

.fce-fmt-btn:hover,
.fce-fmt-btn.active {
  background: rgba(16, 185, 129, 0.22);
  border-color: #4ade80;
  color: #86efac;
}

.fce-fmt-btn.is-unlink-btn {
  border-color: rgba(251, 113, 133, 0.4);
  color: #fda4af;
}

.fce-sep {
  width: 1px;
  height: 18px;
  background: rgba(148, 163, 184, 0.2);
  margin: 0 2px;
}

.fce-hint {
  margin-left: auto;
  font-size: 11.5px;
  color: #94a3b8;
}

/* LINK POPOVER */
.fce-link-popover {
  padding: 9px 10px;
  background: rgba(30, 41, 59, 0.95);
  border-bottom: 1px solid rgba(74, 222, 128, 0.3);
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.fce-lp-inputs {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 7px;
}

.fce-lp-url-box {
  flex: 1;
  min-width: 210px;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0 10px;
  height: 34px;
  border-radius: 8px;
  background: rgba(15, 23, 42, 0.85);
  border: 1px solid rgba(74, 222, 128, 0.45);
  color: #4ade80;
}

.fce-lp-input {
  flex: 1;
  min-width: 0;
  height: 34px;
  background: transparent;
  border: none;
  outline: none;
  color: #ffffff;
  font-size: 13px;
}

.fce-lp-input.is-text {
  flex: 0 1 180px;
  padding: 0 10px;
  border-radius: 8px;
  background: rgba(15, 23, 42, 0.85);
  border: 1px solid rgba(148, 163, 184, 0.28);
}

.fce-lp-apply {
  height: 34px;
  padding: 0 12px;
  border-radius: 8px;
  border: none;
  background: linear-gradient(135deg, #16a34a 0%, #059669 100%);
  color: #ffffff;
  font-size: 12.5px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
}

.fce-lp-cancel {
  width: 34px;
  height: 34px;
  border-radius: 8px;
  border: 1px solid rgba(148, 163, 184, 0.25);
  background: rgba(51, 65, 85, 0.6);
  color: #cbd5e1;
  font-size: 16px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.fce-lp-error {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  color: #fda4af;
}

/* ACTIVE LINK INSPECTOR */
.fce-active-link-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  background: rgba(13, 148, 136, 0.16);
  border-bottom: 1px solid rgba(45, 212, 191, 0.28);
  font-size: 12px;
  color: #5eead4;
}

.fce-alb-url {
  flex: 1;
  min-width: 0;
  color: #5eead4;
  font-weight: 600;
  text-decoration: underline;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.fce-alb-act {
  padding: 3px 8px;
  border-radius: 6px;
  border: 1px solid rgba(148, 163, 184, 0.28);
  background: rgba(15, 23, 42, 0.7);
  color: #e2e8f0;
  font-size: 11.5px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
}

.fce-alb-act.is-danger {
  color: #fda4af;
  border-color: rgba(251, 113, 133, 0.35);
}

/* EDITOR STAGE */
.fce-editor-stage {
  position: relative;
  min-height: 108px;
  padding: 12px 14px;
}

.fce-placeholder {
  position: absolute;
  top: 12px;
  left: 14px;
  right: 14px;
  color: #94a3b8;
  font-size: 14.5px;
  line-height: 1.55;
  pointer-events: none;
  user-select: none;
}

.fce-editable {
  position: relative;
  z-index: 1;
  min-height: 84px;
  outline: none;
  color: #f8fafc;
  font-size: 14.5px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
}

.fce-editable :deep(a) {
  color: #38bdf8;
  font-weight: 700;
  text-decoration: underline;
  text-underline-offset: 2px;
}

@media (max-width: 640px) {
  .fce-hint {
    display: none;
  }
}
</style>
