import crypto from 'node:crypto'

const DEFAULT_CLOUD_NAME = 'dsmtq5rbh'
const DEFAULT_API_KEY = '428442636194719'
const DEFAULT_FOLDER = 'sakitchen'

function sanitizeFolder(rawFolder) {
  const cleaned = String(rawFolder || DEFAULT_FOLDER)
    .trim()
    .replace(/^\/+|\/+$/g, '')
    .replace(/[^a-zA-Z0-9_/-]/g, '')
  return cleaned || DEFAULT_FOLDER
}

export function createCloudinarySignaturePayload(body = {}, env = process.env) {
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

  const signature = crypto
    .createHash('sha1')
    .update(`${stringToSign}${apiSecret}`)
    .digest('hex')

  return {
    success: true,
    cloudName,
    apiKey,
    timestamp,
    signature,
    folder,
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ success: false, message: 'Method not allowed' })
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

  try {
    const payload = createCloudinarySignaturePayload(body, process.env)
    return res.status(200).json(payload)
  } catch (err) {
    console.error('Cloudinary sign error:', err)
    return res.status(500).json({
      success: false,
      message: err?.message || 'Failed to sign Cloudinary upload request',
    })
  }
}
