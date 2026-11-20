// Cloudflare Pages Function: Sign Cloudinary upload requests (/api/cloudinary-sign)

const DEFAULT_CLOUD_NAME = 'dsmtq5rbh'
const DEFAULT_API_KEY = '428442636194719'
const DEFAULT_FOLDER = 'sakitchen'

function jsonResponse(payload, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...extraHeaders,
    },
  })
}

function sanitizeFolder(rawFolder) {
  const cleaned = String(rawFolder || DEFAULT_FOLDER)
    .trim()
    .replace(/^\/+|\/+$/g, '')
    .replace(/[^a-zA-Z0-9_/-]/g, '')
  return cleaned || DEFAULT_FOLDER
}

async function sha1Hex(input) {
  const bytes = new TextEncoder().encode(input)
  const digest = await crypto.subtle.digest('SHA-1', bytes)
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

export async function createCloudinarySignaturePayload(body = {}, env = {}) {
  const cloudName = String(
    env.CLOUDINARY_CLOUD_NAME || env.VITE_CLOUDINARY_CLOUD_NAME || DEFAULT_CLOUD_NAME,
  ).trim()
  const apiKey = String(
    env.CLOUDINARY_API_KEY || env.VITE_CLOUDINARY_API_KEY || DEFAULT_API_KEY,
  ).trim()
  const apiSecret = String(env.CLOUDINARY_API_SECRET || '').trim()

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error('Missing CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, or CLOUDINARY_API_SECRET')
  }

  const timestamp = Math.floor(Date.now() / 1000)
  const folder = sanitizeFolder(body?.folder)

  const paramsToSign = { timestamp }
  if (folder) {
    paramsToSign.folder = folder
  }

  const stringToSign = Object.keys(paramsToSign)
    .sort()
    .map((key) => `${key}=${paramsToSign[key]}`)
    .join('&')

  const signature = await sha1Hex(`${stringToSign}${apiSecret}`)

  return {
    success: true,
    cloudName,
    apiKey,
    timestamp,
    signature,
    folder,
  }
}

export async function onRequest(context) {
  const { request, env } = context

  if (request.method !== 'POST') {
    return jsonResponse(
      { success: false, message: 'Method not allowed' },
      405,
      { Allow: 'POST' },
    )
  }

  let body = {}
  try {
    const parsed = await request.json()
    if (parsed && typeof parsed === 'object') {
      body = parsed
    }
  } catch {
    body = {}
  }

  try {
    const payload = await createCloudinarySignaturePayload(body, env || {})
    return jsonResponse(payload, 200)
  } catch (err) {
    console.error('Cloudinary sign error:', err)
    return jsonResponse(
      {
        success: false,
        message: err?.message || 'Failed to sign Cloudinary upload request',
      },
      500,
    )
  }
}
