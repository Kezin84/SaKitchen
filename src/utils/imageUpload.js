import { CLOUDINARY_CLOUD_NAME, CLOUDINARY_SIGN_ENDPOINT } from '@/config/api'

const DEFAULT_CLOUDINARY_FOLDER = 'sakitchen'
const DEFAULT_TARGET_KB = 100
const DEFAULT_MAX_WIDTH = 1200
const DEFAULT_MAX_HEIGHT = 1200
const DEFAULT_MIN_QUALITY = 0.42
const DEFAULT_MAX_QUALITY = 0.9
const SCALE_DOWN_FACTOR = 0.8
const MIN_DIMENSION_PX = 320
const MAX_SCALE_ROUNDS = 5
const QUALITY_SEARCH_STEPS = 5

function toJpgFileName(name) {
  const raw = String(name || 'image').trim() || 'image'
  const base = raw.replace(/\.[^/.]+$/, '') || 'image'
  return `${base}.jpg`
}

function loadImageElement(file) {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file)
    const img = new Image()

    img.onload = () => {
      URL.revokeObjectURL(objectUrl)
      if (!img.naturalWidth || !img.naturalHeight) {
        reject(new Error('Ảnh không có kích thước hợp lệ'))
        return
      }
      resolve(img)
    }

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('Không thể đọc file ảnh'))
    }

    img.src = objectUrl
  })
}

function encodeCanvasToJpg(img, width, height, quality, backgroundColor) {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(width))
    canvas.height = Math.max(1, Math.round(height))

    const ctx = canvas.getContext('2d')
    if (!ctx) {
      reject(new Error('Trình duyệt không hỗ trợ xử lý ảnh Canvas'))
      return
    }

    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'
    ctx.fillStyle = backgroundColor
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Không thể nén ảnh sang JPG'))
          return
        }
        resolve(blob)
      },
      'image/jpeg',
      quality,
    )
  })
}

/**
 * Compress and convert an image file/blob to a JPG File (~<= targetKB).
 * Uses quality binary search first and progressively downscales dimensions if needed.
 * @param {File|Blob} file
 * @param {Object} [options]
 * @param {number} [options.targetKB=100]
 * @param {number} [options.maxWidth=1200]
 * @param {number} [options.maxHeight=1200]
 * @param {number} [options.minQuality=0.42]
 * @param {number} [options.maxQuality=0.9]
 * @param {string} [options.backgroundColor='#ffffff']
 * @returns {Promise<File>}
 */
export async function compressImageToJpg(file, options = {}) {
  if (!file || (file.type && !file.type.startsWith('image/'))) {
    throw new Error('Vui lòng chọn file hình ảnh hợp lệ')
  }

  const targetBytes = Math.max(10 * 1024, (options.targetKB ?? DEFAULT_TARGET_KB) * 1024)
  const maxWidth = options.maxWidth ?? DEFAULT_MAX_WIDTH
  const maxHeight = options.maxHeight ?? DEFAULT_MAX_HEIGHT
  const minQuality = options.minQuality ?? DEFAULT_MIN_QUALITY
  const maxQuality = options.maxQuality ?? DEFAULT_MAX_QUALITY
  const backgroundColor = options.backgroundColor ?? '#ffffff'
  const originalName = 'name' in file ? file.name : 'image.jpg'
  const jpgName = toJpgFileName(originalName)

  const img = await loadImageElement(file)
  const isAlreadyJpg = file.type === 'image/jpeg' || file.type === 'image/jpg'
  const withinBounds = img.naturalWidth <= maxWidth && img.naturalHeight <= maxHeight

  if (isAlreadyJpg && withinBounds && file.size <= targetBytes) {
    return new File([file], jpgName, { type: 'image/jpeg', lastModified: Date.now() })
  }

  const initialScale = Math.min(1, maxWidth / img.naturalWidth, maxHeight / img.naturalHeight)
  let width = Math.max(1, Math.round(img.naturalWidth * initialScale))
  let height = Math.max(1, Math.round(img.naturalHeight * initialScale))
  let smallestBlob = null

  for (let round = 0; round < MAX_SCALE_ROUNDS; round++) {
    const highBlob = await encodeCanvasToJpg(img, width, height, maxQuality, backgroundColor)
    if (!smallestBlob || highBlob.size < smallestBlob.size) {
      smallestBlob = highBlob
    }
    if (highBlob.size <= targetBytes) {
      return new File([highBlob], jpgName, { type: 'image/jpeg', lastModified: Date.now() })
    }

    const lowBlob = await encodeCanvasToJpg(img, width, height, minQuality, backgroundColor)
    if (lowBlob.size < smallestBlob.size) {
      smallestBlob = lowBlob
    }

    if (lowBlob.size <= targetBytes) {
      let lo = minQuality
      let hi = maxQuality
      let bestUnderTarget = lowBlob

      for (let step = 0; step < QUALITY_SEARCH_STEPS; step++) {
        const mid = (lo + hi) / 2
        const midBlob = await encodeCanvasToJpg(img, width, height, mid, backgroundColor)
        if (midBlob.size <= targetBytes) {
          bestUnderTarget = midBlob
          lo = mid
        } else {
          hi = mid
        }
      }

      return new File([bestUnderTarget], jpgName, { type: 'image/jpeg', lastModified: Date.now() })
    }

    if (Math.max(width, height) <= MIN_DIMENSION_PX) {
      break
    }

    width = Math.max(1, Math.round(width * SCALE_DOWN_FACTOR))
    height = Math.max(1, Math.round(height * SCALE_DOWN_FACTOR))
  }

  const fallbackBlob = await encodeCanvasToJpg(img, width, height, 0.3, backgroundColor)
  const finalBlob =
    smallestBlob && smallestBlob.size < fallbackBlob.size ? smallestBlob : fallbackBlob

  return new File([finalBlob], jpgName, { type: 'image/jpeg', lastModified: Date.now() })
}

/**
 * Request a short-lived signed upload payload from our serverless endpoint.
 * @param {string} folder
 * @returns {Promise<{cloudName: string, apiKey: string, timestamp: number, signature: string, folder: string}>}
 */
async function requestCloudinarySignature(folder) {
  const res = await fetch(CLOUDINARY_SIGN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ folder }),
  })
  const json = await res.json().catch(() => ({}))

  if (!res.ok || !json?.success || !json?.signature || !json?.apiKey) {
    throw new Error(json?.message || 'Không thể tạo chữ ký upload Cloudinary')
  }

  return json
}

/**
 * Compress an image to ~100KB JPG and upload it to Cloudinary, returning the hosted HTTPS URL.
 * @param {File|Blob} file
 * @param {Object} [options]
 * @param {string} [options.folder='sakitchen']
 * @returns {Promise<string>}
 */
export async function uploadImageToCloudinary(file, options = {}) {
  const compressedFile = await compressImageToJpg(file, options)
  const folder = options.folder || DEFAULT_CLOUDINARY_FOLDER
  const sign = await requestCloudinarySignature(folder)
  const cloudName = sign.cloudName || CLOUDINARY_CLOUD_NAME

  const formData = new FormData()
  formData.append('file', compressedFile, compressedFile.name)
  formData.append('api_key', sign.apiKey)
  formData.append('timestamp', String(sign.timestamp))
  formData.append('signature', sign.signature)
  if (sign.folder) {
    formData.append('folder', sign.folder)
  }

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: 'POST',
    body: formData,
  })
  const json = await res.json().catch(() => ({}))

  if (!res.ok || !(json?.secure_url || json?.url)) {
    throw new Error(json?.error?.message || 'Upload Cloudinary thất bại')
  }

  return json.secure_url || json.url
}
