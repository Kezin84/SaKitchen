import { fileURLToPath, URL } from 'node:url'

import { defineConfig, loadEnv, type Plugin } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import vueDevTools from 'vite-plugin-vue-devtools'

function cloudinaryDevSignPlugin(): Plugin {
  return {
    name: 'cloudinary-dev-sign',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/api/cloudinary-sign', (req, res, next) => {
        if (req.method !== 'POST') {
          res.statusCode = 405
          res.setHeader('Allow', 'POST')
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ success: false, message: 'Method not allowed' }))
          return
        }

        const chunks: Buffer[] = []
        req.on('data', (chunk: Buffer) => chunks.push(chunk))
        req.on('end', async () => {
          try {
            const rawBody = Buffer.concat(chunks).toString('utf8')
            let body: Record<string, unknown> = {}
            if (rawBody) {
              try {
                body = JSON.parse(rawBody) as Record<string, unknown>
              } catch {
                body = {}
              }
            }

            const env = loadEnv(server.config.mode, process.cwd(), '')
            const mod = (await server.ssrLoadModule('/api/cloudinary-sign.js')) as {
              createCloudinarySignaturePayload: (
                b: Record<string, unknown>,
                e: Record<string, string | undefined>,
              ) => Record<string, unknown>
            }
            const payload = mod.createCloudinarySignaturePayload(body, {
              ...process.env,
              ...env,
            })

            res.statusCode = 200
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify(payload))
          } catch (err) {
            const message = err instanceof Error ? err.message : 'Cloudinary sign error'
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ success: false, message }))
          }
        })
        req.on('error', next)
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueJsx(),
    vueDevTools(),
    cloudinaryDevSignPlugin(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
})
