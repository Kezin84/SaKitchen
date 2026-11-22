<script setup>
import { ref, watch, onBeforeUnmount } from 'vue'
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import TextAlign from '@tiptap/extension-text-align'
import Placeholder from '@tiptap/extension-placeholder'
import { Table } from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'
import { uploadImageToCloudinary } from '@/utils/imageUpload.js'
import { escapeHtml } from '@/utils/blogSeo.js'

const props = defineProps({
  modelValue: {
    type: String,
    default: '',
  },
  placeholder: {
    type: String,
    default: 'Bắt đầu viết nội dung bài viết chuẩn SEO... Dùng H2, H3 để tự động tạo Mục lục!',
  },
  disabled: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:modelValue', 'toast'])

// Extend Link so target & rel are parsed losslessly from saved HTML AND never default to nofollow on internal links
const SeoLink = Link.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      target: {
        default: null,
        parseHTML: (el) => el.getAttribute('target') || null,
        renderHTML: (attrs) => (attrs.target ? { target: attrs.target } : {}),
      },
      rel: {
        default: null,
        parseHTML: (el) => el.getAttribute('rel') || null,
        renderHTML: (attrs) => (attrs.rel ? { rel: attrs.rel } : {}),
      },
    }
  },
})

// Extend TipTap Image to preserve SEO caption cleanly via data-caption without stale title resurrection
const SeoImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      caption: {
        default: '',
        parseHTML: (el) => el.getAttribute('data-caption') || el.getAttribute('title') || '',
        renderHTML: (attrs) => {
          const cap = String(attrs.caption || '').trim()
          if (!cap) return {}
          return {
            'data-caption': cap,
          }
        },
      },
    }
  },
})

const htmlSourceMode = ref(false)
const rawHtmlDraft = ref(props.modelValue || '')

// Link modal state
const showLinkModal = ref(false)
const linkUrl = ref('')
const linkText = ref('')
const linkNeedsAnchorText = ref(false)
const linkOpenNewTab = ref(false)
const linkNofollow = ref(false)

// Image modal state
const showImageModal = ref(false)
const isEditingImage = ref(false)
const imgUrl = ref('')
const imgAlt = ref('')
const imgCaption = ref('')
const imgUploading = ref(false)
const imgFileInputRef = ref(null)

const editor = useEditor({
  content: props.modelValue || '',
  editable: !props.disabled,
  extensions: [
    StarterKit.configure({
      heading: { levels: [2, 3, 4] },
      link: false,
      underline: false,
    }),
    Underline,
    SeoLink.configure({
      openOnClick: false,
      autolink: true,
      defaultProtocol: 'https',
      HTMLAttributes: {
        class: 'blog-link',
        target: null,
        rel: null,
      },
    }),
    SeoImage.configure({
      inline: false,
      allowBase64: false,
      HTMLAttributes: {
        class: 'blog-inline-img',
        loading: 'lazy',
      },
    }),
    TextAlign.configure({
      types: ['heading', 'paragraph'],
    }),
    Placeholder.configure({
      placeholder: props.placeholder,
    }),
    Table.configure({
      resizable: false,
      HTMLAttributes: {
        class: 'blog-table',
      },
    }),
    TableRow,
    TableHeader,
    TableCell,
  ],
  onUpdate({ editor: ed }) {
    const html = ed.getHTML()
    rawHtmlDraft.value = html
    emit('update:modelValue', html)
  },
})

watch(
  () => props.modelValue,
  (nextVal) => {
    const incoming = String(nextVal || '')
    rawHtmlDraft.value = incoming
    if (!editor.value) return
    const current = editor.value.getHTML()
    if (incoming !== current) {
      editor.value.commands.setContent(incoming, { emitUpdate: false })
    }
  },
)

watch(
  () => props.disabled,
  (isDisabled) => {
    editor.value?.setEditable(!isDisabled)
  },
)

onBeforeUnmount(() => {
  editor.value?.destroy()
})

function toggleHtmlSource() {
  if (!editor.value) return
  if (htmlSourceMode.value) {
    editor.value.commands.setContent(rawHtmlDraft.value || '', { emitUpdate: false })
    const normalizedHtml = editor.value.getHTML()
    rawHtmlDraft.value = normalizedHtml
    emit('update:modelValue', normalizedHtml)
    htmlSourceMode.value = false
  } else {
    rawHtmlDraft.value = editor.value.getHTML()
    htmlSourceMode.value = true
  }
}

function onRawHtmlInput(e) {
  rawHtmlDraft.value = e.target.value
  emit('update:modelValue', rawHtmlDraft.value)
}

/* ---------- LINK MODAL ---------- */
function openLinkModal() {
  if (!editor.value) return
  const ed = editor.value
  const activeLink = ed.isActive('link')
  const selectionEmpty = ed.state.selection.empty
  linkNeedsAnchorText.value = selectionEmpty && !activeLink
  linkText.value = ''

  const attrs = ed.getAttributes('link') || {}
  linkUrl.value = attrs.href || ''
  linkOpenNewTab.value = attrs.target === '_blank'
  linkNofollow.value = String(attrs.rel || '').includes('nofollow')
  showLinkModal.value = true
}

function applyQuickInternalLink(path, suggestedText) {
  linkUrl.value = path
  if (linkNeedsAnchorText.value && !linkText.value.trim()) {
    linkText.value = suggestedText
  }
  linkOpenNewTab.value = false
  linkNofollow.value = false
}

function saveLink() {
  if (!editor.value) return
  const ed = editor.value
  const cleanUrl = linkUrl.value.trim()
  if (!cleanUrl) {
    ed.chain().focus().extendMarkRange('link').unsetLink().run()
    showLinkModal.value = false
    return
  }

  const relParts = []
  if (linkOpenNewTab.value) relParts.push('noopener', 'noreferrer')
  if (linkNofollow.value) relParts.push('nofollow')
  const targetAttr = linkOpenNewTab.value ? '_blank' : null
  const relAttr = relParts.length ? relParts.join(' ') : null

  if (linkNeedsAnchorText.value) {
    const label = linkText.value.trim() || cleanUrl
    const extraAttrs =
      (targetAttr ? ` target="${escapeHtml(targetAttr)}"` : '') +
      (relAttr ? ` rel="${escapeHtml(relAttr)}"` : '')
    ed.chain()
      .focus()
      .insertContent(`<a href="${escapeHtml(cleanUrl)}"${extraAttrs}>${escapeHtml(label)}</a> `)
      .run()
  } else {
    ed.chain()
      .focus()
      .extendMarkRange('link')
      .setLink({
        href: cleanUrl,
        target: targetAttr,
        rel: relAttr,
      })
      .run()
  }
  showLinkModal.value = false
}

function removeLink() {
  editor.value?.chain().focus().extendMarkRange('link').unsetLink().run()
  showLinkModal.value = false
}

/* ---------- IMAGE MODAL ---------- */
function openImageModal() {
  if (!editor.value) return
  if (editor.value.isActive('image')) {
    isEditingImage.value = true
    const attrs = editor.value.getAttributes('image') || {}
    imgUrl.value = attrs.src || ''
    imgAlt.value = attrs.alt || ''
    imgCaption.value = attrs.caption || attrs.title || ''
  } else {
    isEditingImage.value = false
    imgUrl.value = ''
    imgAlt.value = ''
    imgCaption.value = ''
  }
  showImageModal.value = true
}

function triggerImageFilePick() {
  imgFileInputRef.value?.click?.()
}

async function onSelectInlineImage(e) {
  const file = e.target?.files?.[0]
  if (e.target) e.target.value = ''
  if (!file) return
  if (!file.type.startsWith('image/')) {
    emit('toast', { message: 'Vui lòng chọn file hình ảnh hợp lệ', type: 'error' })
    return
  }
  imgUploading.value = true
  try {
    const uploadedUrl = await uploadImageToCloudinary(file, {
      folder: 'sakitchen/blog',
      maxWidth: 1400,
      maxHeight: 1400,
      targetKB: 180,
    })
    imgUrl.value = uploadedUrl
    if (!imgAlt.value.trim()) {
      const baseName = String(file.name || '')
        .replace(/\.[^/.]+$/, '')
        .replace(/[-_]+/g, ' ')
        .trim()
      if (baseName) imgAlt.value = baseName
    }
    emit('toast', { message: 'Upload ảnh Cloudinary thành công!', type: 'success' })
  } catch (err) {
    emit('toast', { message: err?.message || 'Upload ảnh thất bại', type: 'error' })
  } finally {
    imgUploading.value = false
  }
}

function insertOrUpdateImage() {
  if (!editor.value) return
  const src = imgUrl.value.trim()
  if (!src) {
    emit('toast', { message: 'Vui lòng tải ảnh lên hoặc dán URL ảnh', type: 'error' })
    return
  }
  const cleanCaption = imgCaption.value.trim()
  const attrs = {
    src,
    alt: imgAlt.value.trim(),
    caption: cleanCaption,
    title: cleanCaption || null,
  }
  if (isEditingImage.value && editor.value.isActive('image')) {
    editor.value.chain().focus().updateAttributes('image', attrs).run()
  } else {
    editor.value.chain().focus().setImage(attrs).run()
  }
  showImageModal.value = false
}

function removeSelectedImage() {
  if (!editor.value) return
  if (editor.value.isActive('image')) {
    editor.value.chain().focus().deleteSelection().run()
  }
  showImageModal.value = false
}

function insertTable() {
  editor.value?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
}
</script>

<template>
  <div class="blog-editor-shell" :class="{ 'is-source-mode': htmlSourceMode }">
    <!-- STICKY TOOLBAR -->
    <div v-if="editor" class="editor-toolbar">
      <div class="tb-group">
        <button
          type="button"
          class="tb-btn tb-text"
          :class="{ active: !htmlSourceMode && editor.isActive('paragraph') }"
          :disabled="htmlSourceMode"
          title="Đoạn văn thường (Paragraph)"
          @mousedown.prevent
          @click="editor.chain().focus().setParagraph().run()"
        >
          P
        </button>
        <button
          type="button"
          class="tb-btn tb-text"
          :class="{ active: !htmlSourceMode && editor.isActive('heading', { level: 2 }) }"
          :disabled="htmlSourceMode"
          title="Tiêu đề H2 — Tự động vào Mục lục chính (1., 2.)"
          @mousedown.prevent
          @click="editor.chain().focus().toggleHeading({ level: 2 }).run()"
        >
          H2
        </button>
        <button
          type="button"
          class="tb-btn tb-text"
          :class="{ active: !htmlSourceMode && editor.isActive('heading', { level: 3 }) }"
          :disabled="htmlSourceMode"
          title="Tiêu đề H3 — Tự động vào Mục lục phụ (1.1., 1.2.)"
          @mousedown.prevent
          @click="editor.chain().focus().toggleHeading({ level: 3 }).run()"
        >
          H3
        </button>
        <button
          type="button"
          class="tb-btn tb-text"
          :class="{ active: !htmlSourceMode && editor.isActive('heading', { level: 4 }) }"
          :disabled="htmlSourceMode"
          title="Tiêu đề H4 — Mục lục cấp 3 (1.1.1.)"
          @mousedown.prevent
          @click="editor.chain().focus().toggleHeading({ level: 4 }).run()"
        >
          H4
        </button>
      </div>

      <span class="tb-sep"></span>

      <div class="tb-group">
        <button
          type="button"
          class="tb-btn"
          :class="{ active: !htmlSourceMode && editor.isActive('bold') }"
          :disabled="htmlSourceMode"
          title="In đậm (Ctrl+B)"
          @mousedown.prevent
          @click="editor.chain().focus().toggleBold().run()"
        >
          <i class="ri-bold"></i>
        </button>
        <button
          type="button"
          class="tb-btn"
          :class="{ active: !htmlSourceMode && editor.isActive('italic') }"
          :disabled="htmlSourceMode"
          title="In nghiêng (Ctrl+I)"
          @mousedown.prevent
          @click="editor.chain().focus().toggleItalic().run()"
        >
          <i class="ri-italic"></i>
        </button>
        <button
          type="button"
          class="tb-btn"
          :class="{ active: !htmlSourceMode && editor.isActive('underline') }"
          :disabled="htmlSourceMode"
          title="Gạch chân (Ctrl+U)"
          @mousedown.prevent
          @click="editor.chain().focus().toggleUnderline().run()"
        >
          <i class="ri-underline"></i>
        </button>
        <button
          type="button"
          class="tb-btn"
          :class="{ active: !htmlSourceMode && editor.isActive('strike') }"
          :disabled="htmlSourceMode"
          title="Gạch ngang"
          @mousedown.prevent
          @click="editor.chain().focus().toggleStrike().run()"
        >
          <i class="ri-strikethrough"></i>
        </button>
      </div>

      <span class="tb-sep"></span>

      <div class="tb-group">
        <button
          type="button"
          class="tb-btn"
          :class="{ active: !htmlSourceMode && editor.isActive({ textAlign: 'left' }) }"
          :disabled="htmlSourceMode"
          title="Căn trái"
          @mousedown.prevent
          @click="editor.chain().focus().setTextAlign('left').run()"
        >
          <i class="ri-align-left"></i>
        </button>
        <button
          type="button"
          class="tb-btn"
          :class="{ active: !htmlSourceMode && editor.isActive({ textAlign: 'center' }) }"
          :disabled="htmlSourceMode"
          title="Căn giữa"
          @mousedown.prevent
          @click="editor.chain().focus().setTextAlign('center').run()"
        >
          <i class="ri-align-center"></i>
        </button>
        <button
          type="button"
          class="tb-btn"
          :class="{ active: !htmlSourceMode && editor.isActive({ textAlign: 'right' }) }"
          :disabled="htmlSourceMode"
          title="Căn phải"
          @mousedown.prevent
          @click="editor.chain().focus().setTextAlign('right').run()"
        >
          <i class="ri-align-right"></i>
        </button>
      </div>

      <span class="tb-sep"></span>

      <div class="tb-group">
        <button
          type="button"
          class="tb-btn"
          :class="{ active: !htmlSourceMode && editor.isActive('bulletList') }"
          :disabled="htmlSourceMode"
          title="Danh sách chấm tròn"
          @mousedown.prevent
          @click="editor.chain().focus().toggleBulletList().run()"
        >
          <i class="ri-list-unordered"></i>
        </button>
        <button
          type="button"
          class="tb-btn"
          :class="{ active: !htmlSourceMode && editor.isActive('orderedList') }"
          :disabled="htmlSourceMode"
          title="Danh sách đánh số"
          @mousedown.prevent
          @click="editor.chain().focus().toggleOrderedList().run()"
        >
          <i class="ri-list-ordered"></i>
        </button>
        <button
          type="button"
          class="tb-btn"
          :class="{ active: !htmlSourceMode && editor.isActive('blockquote') }"
          :disabled="htmlSourceMode"
          title="Trích dẫn (Blockquote)"
          @mousedown.prevent
          @click="editor.chain().focus().toggleBlockquote().run()"
        >
          <i class="ri-double-quotes-l"></i>
        </button>
        <button
          type="button"
          class="tb-btn"
          :disabled="htmlSourceMode"
          title="Đường kẻ ngang"
          @mousedown.prevent
          @click="editor.chain().focus().setHorizontalRule().run()"
        >
          <i class="ri-separator"></i>
        </button>
      </div>

      <span class="tb-sep"></span>

      <div class="tb-group">
        <button
          type="button"
          class="tb-btn"
          :class="{ active: !htmlSourceMode && editor.isActive('link') }"
          :disabled="htmlSourceMode"
          title="Chèn / Sửa liên kết (Link)"
          @mousedown.prevent
          @click="openLinkModal"
        >
          <i class="ri-link"></i>
        </button>
        <button
          type="button"
          class="tb-btn tb-media-btn"
          :class="{ active: !htmlSourceMode && editor.isActive('image') }"
          :disabled="htmlSourceMode"
          title="Tải ảnh lên Cloudinary hoặc bấm vào ảnh trong bài để sửa Alt/Chú thích"
          @mousedown.prevent
          @click="openImageModal"
        >
          <i class="ri-image-add-line"></i>
          <span>{{ !htmlSourceMode && editor.isActive('image') ? 'Sửa ảnh' : 'Thêm ảnh' }}</span>
        </button>
        <button
          type="button"
          class="tb-btn"
          :class="{ active: !htmlSourceMode && editor.isActive('table') }"
          :disabled="htmlSourceMode"
          title="Chèn bảng (Table 3×3)"
          @mousedown.prevent
          @click="insertTable"
        >
          <i class="ri-table-2"></i>
        </button>
      </div>

      <span class="tb-sep"></span>

      <div class="tb-group">
        <button
          type="button"
          class="tb-btn"
          :disabled="htmlSourceMode"
          title="Xóa định dạng"
          @mousedown.prevent
          @click="editor.chain().focus().unsetAllMarks().clearNodes().run()"
        >
          <i class="ri-format-clear"></i>
        </button>
        <button
          type="button"
          class="tb-btn"
          :disabled="htmlSourceMode || !editor.can().undo()"
          title="Hoàn tác (Ctrl+Z)"
          @mousedown.prevent
          @click="editor.chain().focus().undo().run()"
        >
          <i class="ri-arrow-go-back-line"></i>
        </button>
        <button
          type="button"
          class="tb-btn"
          :disabled="htmlSourceMode || !editor.can().redo()"
          title="Làm lại (Ctrl+Y)"
          @mousedown.prevent
          @click="editor.chain().focus().redo().run()"
        >
          <i class="ri-arrow-go-forward-line"></i>
        </button>
      </div>

      <div class="tb-right">
        <button
          type="button"
          class="tb-btn tb-html-toggle"
          :class="{ active: htmlSourceMode }"
          title="Chuyển chế độ xem/sửa mã HTML"
          @click="toggleHtmlSource"
        >
          <i class="ri-code-s-slash-line"></i>
          <span>{{ htmlSourceMode ? 'Trực quan' : 'HTML' }}</span>
        </button>
      </div>
    </div>

    <!-- CONTEXTUAL TABLE BAR -->
    <div v-if="editor && !htmlSourceMode && editor.isActive('table')" class="table-context-bar">
      <span class="tcb-label"><i class="ri-table-2"></i> Bảng:</span>
      <button type="button" class="tcb-btn" @mousedown.prevent @click="editor.chain().focus().addRowAfter().run()">
        + Thêm hàng
      </button>
      <button type="button" class="tcb-btn" @mousedown.prevent @click="editor.chain().focus().addColumnAfter().run()">
        + Thêm cột
      </button>
      <button type="button" class="tcb-btn" @mousedown.prevent @click="editor.chain().focus().deleteRow().run()">
        Xóa hàng
      </button>
      <button type="button" class="tcb-btn" @mousedown.prevent @click="editor.chain().focus().deleteColumn().run()">
        Xóa cột
      </button>
      <button type="button" class="tcb-btn danger" @mousedown.prevent @click="editor.chain().focus().deleteTable().run()">
        Xóa bảng
      </button>
    </div>

    <!-- VISUAL EDITOR OR RAW HTML SOURCE -->
    <textarea
      v-if="htmlSourceMode"
      :value="rawHtmlDraft"
      class="html-source-textarea"
      spellcheck="false"
      placeholder="<h2>Tiêu đề mục 1</h2><p>Nội dung bài viết...</p>"
      @input="onRawHtmlInput"
    ></textarea>
    <EditorContent v-else :editor="editor" class="editor-body" />

    <!-- LINK MODAL -->
    <div v-if="showLinkModal" class="editor-modal-backdrop" @click.self="showLinkModal = false">
      <div class="editor-modal-card">
        <div class="em-header">
          <h4><i class="ri-link"></i> Chèn / Sửa liên kết</h4>
          <button type="button" class="em-close" @click="showLinkModal = false">
            <i class="ri-close-line"></i>
          </button>
        </div>
        <div class="em-body">
          <template v-if="linkNeedsAnchorText">
            <label class="em-label">Văn bản hiển thị (Anchor Text)</label>
            <input
              v-model="linkText"
              type="text"
              class="em-input"
              placeholder="Ví dụ: Xem thực đơn SA KITCHEN 24/24"
            />
          </template>

          <label class="em-label">Đường dẫn URL</label>
          <input
            v-model="linkUrl"
            type="text"
            class="em-input"
            placeholder="https://sakitchen.shop/vi hoặc /vi"
            @keyup.enter="saveLink"
          />

          <div class="em-quick-links">
            <span>Link nội bộ nhanh:</span>
            <button
              type="button"
              class="em-chip"
              @click="applyQuickInternalLink('/vi', 'Xem thực đơn SA KITCHEN')"
            >
              Menu SA KITCHEN (/vi)
            </button>
            <button
              type="button"
              class="em-chip"
              @click="applyQuickInternalLink('/blog', 'Cẩm nang ẩm thực SA KITCHEN')"
            >
              Trang Blog (/blog)
            </button>
          </div>

          <label class="em-check">
            <input v-model="linkOpenNewTab" type="checkbox" />
            <span>Mở ở tab mới (<code>target="_blank"</code>)</span>
          </label>
          <label class="em-check">
            <input v-model="linkNofollow" type="checkbox" />
            <span>Thêm <code>rel="nofollow"</code> (dùng cho link ngoài không muốn truyền SEO)</span>
          </label>
        </div>
        <div class="em-footer">
          <button v-if="!linkNeedsAnchorText" type="button" class="em-btn danger" @click="removeLink">
            Gỡ link
          </button>
          <span v-else></span>
          <div class="em-footer-right">
            <button type="button" class="em-btn ghost" @click="showLinkModal = false">Hủy</button>
            <button type="button" class="em-btn primary" @click="saveLink">Áp dụng</button>
          </div>
        </div>
      </div>
    </div>

    <!-- IMAGE UPLOAD MODAL -->
    <div v-if="showImageModal" class="editor-modal-backdrop" @click.self="showImageModal = false">
      <div class="editor-modal-card">
        <div class="em-header">
          <h4>
            <i class="ri-image-add-line"></i>
            {{ isEditingImage ? 'Cập nhật ảnh trong bài (Alt & Chú thích)' : 'Chèn ảnh vào bài viết (Chuẩn SEO)' }}
          </h4>
          <button type="button" class="em-close" @click="showImageModal = false">
            <i class="ri-close-line"></i>
          </button>
        </div>
        <div class="em-body">
          <input
            ref="imgFileInputRef"
            type="file"
            accept="image/*"
            class="hidden-file"
            @change="onSelectInlineImage"
          />
          <div class="em-upload-box">
            <button
              type="button"
              class="em-upload-btn"
              :disabled="imgUploading"
              @click="triggerImageFilePick"
            >
              <i :class="imgUploading ? 'ri-loader-4-line spin' : 'ri-upload-cloud-2-line'"></i>
              <span>{{ imgUploading ? 'Đang nén & tải lên Cloudinary...' : 'Tải ảnh từ máy (Cloudinary)' }}</span>
            </button>
            <div v-if="imgUrl" class="em-img-preview">
              <img :src="imgUrl" :alt="imgAlt || 'Preview'" />
            </div>
          </div>

          <label class="em-label">Hoặc dán link ảnh trực tiếp</label>
          <input
            v-model="imgUrl"
            type="text"
            class="em-input"
            placeholder="https://res.cloudinary.com/..."
          />

          <label class="em-label">
            Thẻ Alt mô tả ảnh <span class="em-seo-tag">Quan trọng cho SEO</span>
          </label>
          <input
            v-model="imgAlt"
            type="text"
            class="em-input"
            placeholder="Ví dụ: Lẩu bò nhúng dấm chuẩn vị Việt tại SA KITCHEN Manila"
          />

          <label class="em-label">Chú thích hiển thị dưới ảnh (Caption — tuỳ chọn)</label>
          <input
            v-model="imgCaption"
            type="text"
            class="em-input"
            placeholder="Ví dụ: Nồi lẩu bò nóng hổi giao tận nơi 24/24"
          />
        </div>
        <div class="em-footer">
          <button
            v-if="isEditingImage"
            type="button"
            class="em-btn danger"
            @click="removeSelectedImage"
          >
            Xóa ảnh
          </button>
          <span v-else></span>
          <div class="em-footer-right">
            <button type="button" class="em-btn ghost" @click="showImageModal = false">Hủy</button>
            <button
              type="button"
              class="em-btn primary"
              :disabled="imgUploading || !imgUrl.trim()"
              @click="insertOrUpdateImage"
            >
              {{ isEditingImage ? 'Cập nhật ảnh' : 'Chèn ảnh' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.blog-editor-shell {
  border: 1px solid #d1d5db;
  border-radius: 12px;
  background: #ffffff;
  overflow: visible;
  display: flex;
  flex-direction: column;
}

.editor-toolbar {
  position: sticky;
  top: 0;
  z-index: 15;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
  padding: 8px 10px;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
  border-radius: 12px 12px 0 0;
}

.tb-group {
  display: inline-flex;
  align-items: center;
  gap: 2px;
}

.tb-sep {
  width: 1px;
  height: 20px;
  background: #cbd5e1;
  margin: 0 4px;
}

.tb-right {
  margin-left: auto;
}

.tb-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  min-width: 32px;
  height: 32px;
  padding: 0 7px;
  border: 1px solid transparent;
  border-radius: 7px;
  background: transparent;
  color: #334155;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.14s ease;
}

.tb-btn:hover:not(:disabled) {
  background: #e2e8f0;
  color: #0f172a;
}

.tb-btn.active {
  background: #059669;
  color: #ffffff;
}

.tb-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.tb-btn.tb-text {
  font-size: 12.5px;
  font-weight: 800;
}

.tb-btn.tb-media-btn {
  padding: 0 10px;
  background: #ecfdf5;
  border-color: #a7f3d0;
  color: #047857;
  font-size: 12.5px;
}

.tb-btn.tb-media-btn:hover:not(:disabled) {
  background: #d1fae5;
}

.tb-btn.tb-media-btn.active {
  background: #059669;
  border-color: #059669;
  color: #ffffff;
}

.tb-btn.tb-html-toggle {
  padding: 0 10px;
  border-color: #cbd5e1;
  font-size: 12px;
}

.table-context-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: #f0fdf4;
  border-bottom: 1px solid #bbf7d0;
  font-size: 12.5px;
}

.tcb-label {
  font-weight: 700;
  color: #166534;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.tcb-btn {
  padding: 4px 8px;
  border-radius: 6px;
  border: 1px solid #86efac;
  background: #ffffff;
  color: #166534;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}

.tcb-btn:hover {
  background: #dcfce7;
}

.tcb-btn.danger {
  border-color: #fecaca;
  color: #dc2626;
}

.tcb-btn.danger:hover {
  background: #fee2e2;
}

.html-source-textarea {
  width: 100%;
  min-height: 440px;
  padding: 16px;
  border: none;
  outline: none;
  resize: vertical;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 13px;
  line-height: 1.6;
  background: #0f172a;
  color: #e2e8f0;
  border-radius: 0 0 12px 12px;
  box-sizing: border-box;
}

.editor-body {
  min-height: 440px;
  padding: 18px 22px;
}

.editor-body :deep(.tiptap) {
  min-height: 400px;
  outline: none;
  color: #1e293b;
  font-size: 15.5px;
  line-height: 1.75;
}

.editor-body :deep(.tiptap p.is-editor-empty:first-child::before) {
  content: attr(data-placeholder);
  float: left;
  color: #94a3b8;
  pointer-events: none;
  height: 0;
}

.editor-body :deep(.tiptap h2) {
  font-size: 1.45em;
  font-weight: 800;
  margin: 1.3em 0 0.55em;
  color: #0f172a;
  padding-bottom: 6px;
  border-bottom: 2px solid #e2e8f0;
}

.editor-body :deep(.tiptap h3) {
  font-size: 1.2em;
  font-weight: 700;
  margin: 1.1em 0 0.45em;
  color: #1e293b;
}

.editor-body :deep(.tiptap h4) {
  font-size: 1.05em;
  font-weight: 700;
  margin: 0.9em 0 0.4em;
  color: #334155;
}

.editor-body :deep(.tiptap p) {
  margin: 0 0 0.9em;
}

.editor-body :deep(.tiptap ul),
.editor-body :deep(.tiptap ol) {
  padding-left: 24px;
  margin: 0 0 1em;
}

.editor-body :deep(.tiptap li) {
  margin-bottom: 4px;
}

.editor-body :deep(.tiptap blockquote) {
  border-left: 4px solid #059669;
  background: #f0fdf4;
  padding: 10px 16px;
  margin: 1em 0;
  border-radius: 0 8px 8px 0;
  color: #334155;
  font-style: italic;
}

.editor-body :deep(.tiptap a) {
  color: #059669;
  text-decoration: underline;
  font-weight: 600;
}

.editor-body :deep(.tiptap img) {
  display: block;
  max-width: 100%;
  height: auto;
  margin: 14px auto;
  border-radius: 10px;
  border: 2px solid transparent;
  cursor: pointer;
}

.editor-body :deep(.tiptap img.ProseMirror-selectednode) {
  border-color: #059669;
  box-shadow: 0 0 0 3px rgba(5, 150, 105, 0.2);
}

.editor-body :deep(.tiptap hr) {
  border: none;
  border-top: 1px solid #cbd5e1;
  margin: 1.5em 0;
}

.editor-body :deep(.tiptap table) {
  border-collapse: collapse;
  width: 100%;
  margin: 1em 0;
  overflow: hidden;
  table-layout: fixed;
}

.editor-body :deep(.tiptap td),
.editor-body :deep(.tiptap th) {
  border: 1px solid #cbd5e1;
  padding: 8px 10px;
  vertical-align: top;
  min-width: 60px;
}

.editor-body :deep(.tiptap th) {
  background: #f1f5f9;
  font-weight: 700;
  text-align: left;
}

/* Modals */
.hidden-file {
  display: none;
}

.editor-modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: rgba(15, 23, 42, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}

.editor-modal-card {
  width: 100%;
  max-width: 480px;
  background: #ffffff;
  border-radius: 14px;
  box-shadow: 0 20px 50px rgba(15, 23, 42, 0.25);
  overflow: hidden;
}

.em-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px;
  border-bottom: 1px solid #e2e8f0;
}

.em-header h4 {
  margin: 0;
  font-size: 15px;
  font-weight: 700;
  color: #0f172a;
  display: flex;
  align-items: center;
  gap: 8px;
}

.em-close {
  border: none;
  background: transparent;
  color: #64748b;
  font-size: 20px;
  cursor: pointer;
  padding: 2px;
}

.em-body {
  padding: 16px 18px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.em-label {
  font-size: 12.5px;
  font-weight: 700;
  color: #334155;
  display: flex;
  align-items: center;
  gap: 6px;
}

.em-seo-tag {
  font-size: 11px;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 999px;
  background: #ecfdf5;
  color: #047857;
}

.em-input {
  width: 100%;
  padding: 9px 12px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  font-size: 14px;
  color: #0f172a;
  background: #ffffff;
  box-sizing: border-box;
}

.em-input:focus {
  outline: none;
  border-color: #059669;
  box-shadow: 0 0 0 3px rgba(5, 150, 105, 0.14);
}

.em-quick-links {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #64748b;
}

.em-chip {
  padding: 4px 8px;
  border-radius: 999px;
  border: 1px solid #a7f3d0;
  background: #ecfdf5;
  color: #047857;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}

.em-check {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #334155;
  cursor: pointer;
}

.em-upload-box {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.em-upload-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 11px 14px;
  border: 1.5px dashed #10b981;
  border-radius: 10px;
  background: #ecfdf5;
  color: #047857;
  font-size: 13.5px;
  font-weight: 700;
  cursor: pointer;
}

.em-upload-btn:hover:not(:disabled) {
  background: #d1fae5;
}

.em-img-preview {
  max-height: 170px;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #e2e8f0;
  background: #f8fafc;
  display: flex;
  align-items: center;
  justify-content: center;
}

.em-img-preview img {
  max-width: 100%;
  max-height: 170px;
  object-fit: contain;
}

.em-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 18px;
  border-top: 1px solid #e2e8f0;
  background: #f8fafc;
}

.em-footer-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.em-btn {
  padding: 8px 14px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  border: 1px solid transparent;
}

.em-btn.primary {
  background: #059669;
  color: #ffffff;
}

.em-btn.primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.em-btn.ghost {
  background: #ffffff;
  border-color: #cbd5e1;
  color: #334155;
}

.em-btn.danger {
  background: #fef2f2;
  border-color: #fecaca;
  color: #dc2626;
}

.spin {
  animation: spinAnim 0.8s linear infinite;
}

@keyframes spinAnim {
  to {
    transform: rotate(360deg);
  }
}
</style>
