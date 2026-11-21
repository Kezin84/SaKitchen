import { onRequest as handleTelegramOrder } from '../functions/api/telegram-order.js'
import { onRequest as handleCloudinarySign } from '../functions/api/cloudinary-sign.js'

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url)
    const pathname = url.pathname.replace(/\/+$/, '') || '/'

    if (pathname === '/api/telegram-order') {
      return handleTelegramOrder({ request, env, ctx })
    }

    if (pathname === '/api/cloudinary-sign') {
      return handleCloudinarySign({ request, env, ctx })
    }

    if (pathname.startsWith('/api/')) {
      return new Response(
        JSON.stringify({ success: false, message: 'API endpoint not found' }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json; charset=utf-8' },
        },
      )
    }

    if (env.ASSETS) {
      return env.ASSETS.fetch(request)
    }

    return new Response('Not Found', { status: 404 })
  },
}
