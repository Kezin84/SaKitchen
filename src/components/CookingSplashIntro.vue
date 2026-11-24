<template>
  <Teleport to="body">
    <div
      v-if="visible"
      class="sk-cook-splash"
      :class="[
        `is-trans-${resolvedTransition}`,
        `is-fx-${resolvedEffect}`,
        { 'is-open': isOpening, 'is-reduced': reducedMotion },
      ]"
      :style="splashCssVars"
      role="dialog"
      aria-modal="true"
      aria-label="SA Kitchen Intro"
      @click="openDoors"
    >
      <!-- Backdrop / Exit transition layers -->
      <template v-if="resolvedTransition === 'doors'">
        <div class="sks-door l"></div>
        <div class="sks-door r"></div>
      </template>
      <div v-else-if="resolvedTransition === 'curtain'" class="sks-curtain"></div>
      <div v-else class="sks-zoom-bg"></div>

      <!-- Main animated world -->
      <div class="sks-world">
        <canvas ref="canvasRef" class="sks-embers"></canvas>
        <div class="sks-rays"></div>

        <!-- ==================== STAGE 1: WOK FLAME ==================== -->
        <div v-if="resolvedEffect === 'wok'" class="sks-stage">
          <i class="sks-wave w1"></i>
          <i class="sks-wave w2"></i>
          <i class="sks-wave w3"></i>

          <div class="sks-steam-group" aria-hidden="true">
            <span class="sks-steam s1"></span>
            <span class="sks-steam s2"></span>
            <span class="sks-steam s3"></span>
          </div>

          <div class="sks-ingredients" aria-hidden="true">
            <svg class="sks-ing i1" viewBox="0 0 40 40">
              <path
                d="M27 12c-5-4-13-2-16 4-2 5-1 11 4 14 4 2 9 1 11-2-2-1-4-3-4-6 0-3 2-5 5-5 1 0 3 1 4 2 1-3 0-5-4-7z"
                fill="#fb7185"
                stroke="#fed7aa"
                stroke-width="1.6"
              />
              <path d="M16 14l4 3M13 20l4 1M15 26l4-1" stroke="#fff7ed" stroke-width="1.4" stroke-linecap="round" />
            </svg>
            <svg class="sks-ing i2" viewBox="0 0 40 40">
              <path
                d="M11 26c6 2 14-2 18-11 1-2 0-4-2-4-2 0-4 2-6 5-3 4-7 6-11 7-2 1-2 2 1 3z"
                fill="#ef4444"
                stroke="#fecaca"
                stroke-width="1.4"
              />
              <path d="M27 11c2-3 4-4 6-3" stroke="#4ade80" stroke-width="2.2" stroke-linecap="round" fill="none" />
            </svg>
            <svg class="sks-ing i3" viewBox="0 0 40 40">
              <path
                d="M10 27c2-10 10-16 20-16-2 10-10 16-20 16z"
                fill="#22c55e"
                stroke="#dcfce7"
                stroke-width="1.4"
              />
              <path d="M12 25c6-5 11-9 16-12" stroke="#dcfce7" stroke-width="1.3" stroke-linecap="round" fill="none" />
            </svg>
            <svg class="sks-ing i4" viewBox="0 0 40 40">
              <circle cx="20" cy="20" r="10" fill="#fef3c7" stroke="#f59e0b" stroke-width="1.6" />
              <circle cx="21" cy="19" r="5" fill="#f59e0b" />
              <circle cx="19" cy="17" r="1.5" fill="#fffbeb" />
            </svg>
            <svg class="sks-ing i5" viewBox="0 0 40 40">
              <circle cx="20" cy="20" r="7.5" fill="none" stroke="#4ade80" stroke-width="4" />
              <circle cx="20" cy="20" r="3" fill="#bbf7d0" />
            </svg>
          </div>

          <div class="sks-wok-rig">
            <svg class="sks-wok-svg" viewBox="0 0 220 120" aria-hidden="true">
              <defs>
                <linearGradient id="sksWokMetal" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stop-color="#475569" />
                  <stop offset="45%" stop-color="#1e293b" />
                  <stop offset="100%" stop-color="#090d16" />
                </linearGradient>
                <linearGradient id="sksWokRim" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stop-color="#94a3b8" />
                  <stop offset="50%" stop-color="#f8fafc" />
                  <stop offset="100%" stop-color="#64748b" />
                </linearGradient>
                <linearGradient id="sksHandleWood" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stop-color="#92400e" />
                  <stop offset="50%" stop-color="#d97706" />
                  <stop offset="100%" stop-color="#78350f" />
                </linearGradient>
              </defs>
              <path
                d="M158 53 L210 38 C214 37 217 40 216 44 C215 47 212 49 209 50 L158 61 Z"
                fill="url(#sksHandleWood)"
                stroke="#fbbf24"
                stroke-opacity="0.4"
                stroke-width="1"
              />
              <rect x="148" y="51" width="14" height="8" rx="3" fill="#64748b" transform="rotate(-14 155 55)" />
              <path d="M40 53 C30 51 28 60 39 62" fill="none" stroke="#94a3b8" stroke-width="3.5" stroke-linecap="round" />
              <path
                d="M38 54 C42 96 76 110 100 110 C124 110 158 96 162 54 Z"
                fill="url(#sksWokMetal)"
                stroke="rgba(251, 191, 36, 0.35)"
                stroke-width="1.5"
              />
              <ellipse cx="100" cy="54" rx="63" ry="8.5" fill="#0f172a" stroke="url(#sksWokRim)" stroke-width="2.2" />
              <ellipse cx="100" cy="54" rx="52" ry="4.5" fill="rgba(251, 146, 60, 0.25)" />
              <path
                d="M54 68 C60 88 76 98 92 100"
                fill="none"
                stroke="rgba(255, 255, 255, 0.22)"
                stroke-width="3"
                stroke-linecap="round"
              />
            </svg>
          </div>

          <div class="sks-flames" aria-hidden="true">
            <span class="sks-flame f1"></span>
            <span class="sks-flame f2"></span>
            <span class="sks-flame f3"></span>
            <span class="sks-flame f4"></span>
            <span class="sks-flame f5"></span>
            <span class="sks-burner-glow"></span>
          </div>

          <b class="sks-pop p1">{{ copy.beat1 }}</b>
          <b class="sks-pop p2">{{ copy.beat2 }}</b>
          <b class="sks-pop p3">{{ copy.beat3 }}</b>

          <div class="sks-crest">
            <img :src="resolvedLogoUrl" :alt="resolvedShopName" class="sks-crest-img" />
          </div>
        </div>

        <!-- ==================== STAGE 2: SERVING CLOCHE REVEAL ==================== -->
        <div v-else-if="resolvedEffect === 'cloche'" class="sks-stage is-cloche">
          <i class="sks-wave w1"></i>
          <i class="sks-wave w2"></i>

          <div class="sks-steam-group is-cloche-steam" aria-hidden="true">
            <span class="sks-steam s1"></span>
            <span class="sks-steam s2"></span>
            <span class="sks-steam s3"></span>
          </div>

          <!-- Serving Platter Base -->
          <svg class="sks-platter-svg" viewBox="0 0 220 40" aria-hidden="true">
            <defs>
              <linearGradient id="sksPlatterGold" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stop-color="#92400e" />
                <stop offset="30%" stop-color="#fde68a" />
                <stop offset="55%" stop-color="#ffffff" />
                <stop offset="80%" stop-color="#f59e0b" />
                <stop offset="100%" stop-color="#78350f" />
              </linearGradient>
            </defs>
            <ellipse cx="110" cy="22" rx="96" ry="12" fill="url(#sksPlatterGold)" />
            <ellipse cx="110" cy="19" rx="82" ry="7.5" fill="rgba(15, 23, 42, 0.25)" />
          </svg>

          <!-- Lifting Dome Lid -->
          <div class="sks-cloche-lid" aria-hidden="true">
            <svg viewBox="0 0 200 124">
              <defs>
                <linearGradient id="sksDomeMetal" x1="15%" y1="0%" x2="85%" y2="100%">
                  <stop offset="0%" stop-color="#fffbeb" />
                  <stop offset="28%" stop-color="#fcd34d" />
                  <stop offset="62%" stop-color="#d97706" />
                  <stop offset="100%" stop-color="#78350f" />
                </linearGradient>
              </defs>
              <circle cx="100" cy="17" r="10" fill="url(#sksDomeMetal)" stroke="#fffbeb" stroke-width="1.5" />
              <rect x="95" y="25" width="10" height="8" rx="3" fill="#b45309" />
              <path
                d="M20 110 C20 55 54 30 100 30 C146 30 180 55 180 110 Z"
                fill="url(#sksDomeMetal)"
                stroke="#fef3c7"
                stroke-width="1.8"
              />
              <path
                d="M46 94 C48 64 68 46 92 43"
                fill="none"
                stroke="rgba(255, 255, 255, 0.55)"
                stroke-width="6"
                stroke-linecap="round"
              />
              <rect x="14" y="106" width="172" height="10" rx="5" fill="#fde68a" stroke="#92400e" stroke-width="1.2" />
            </svg>
          </div>

          <b class="sks-pop p2 is-cloche-pop">{{ copy.beat3 }}</b>

          <div class="sks-crest is-cloche-crest">
            <img :src="resolvedLogoUrl" :alt="resolvedShopName" class="sks-crest-img" />
          </div>
        </div>

        <!-- ==================== STAGE 3: STEAMING VIETNAMESE BOWL ==================== -->
        <div v-else-if="resolvedEffect === 'bowl'" class="sks-stage is-bowl">
          <i class="sks-wave w1"></i>
          <i class="sks-wave w2"></i>

          <div class="sks-steam-group is-bowl-steam" aria-hidden="true">
            <span class="sks-steam s1"></span>
            <span class="sks-steam s2"></span>
            <span class="sks-steam s3"></span>
          </div>

          <!-- Chopsticks lifting gently -->
          <svg class="sks-chopsticks-svg" viewBox="0 0 180 90" aria-hidden="true">
            <line x1="28" y1="62" x2="164" y2="16" stroke="#fde68a" stroke-width="5" stroke-linecap="round" />
            <line x1="34" y1="74" x2="168" y2="32" stroke="#f59e0b" stroke-width="5" stroke-linecap="round" />
            <!-- Golden noodle curves -->
            <path d="M54 58 C56 76 62 84 62 88" fill="none" stroke="#fef9c3" stroke-width="3" stroke-linecap="round" />
            <path d="M64 55 C66 74 72 82 72 88" fill="none" stroke="#fef08a" stroke-width="3" stroke-linecap="round" />
            <path d="M74 52 C76 72 80 80 80 88" fill="none" stroke="#fffbeb" stroke-width="2.6" stroke-linecap="round" />
          </svg>

          <!-- Handcrafted ceramic bowl -->
          <svg class="sks-bowl-svg" viewBox="0 0 210 116" aria-hidden="true">
            <defs>
              <linearGradient id="sksBowlBody" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#fff7ed" />
                <stop offset="55%" stop-color="#fed7aa" />
                <stop offset="100%" stop-color="#c2410c" />
              </linearGradient>
            </defs>
            <!-- Broth surface -->
            <ellipse cx="105" cy="30" rx="82" ry="15" fill="#9a3412" stroke="#fde68a" stroke-width="2.5" />
            <ellipse cx="105" cy="30" rx="68" ry="9" fill="#d97706" opacity="0.6" />
            <!-- Garnish dots (scallion & chili) -->
            <circle cx="80" cy="29" r="4" fill="#22c55e" />
            <circle cx="122" cy="31" r="3.5" fill="#ef4444" />
            <circle cx="102" cy="27" r="3.5" fill="#4ade80" />
            <!-- Bowl silhouette -->
            <path
              d="M23 30 C26 84 58 104 105 104 C152 104 184 84 187 30 C162 42 48 42 23 30 Z"
              fill="url(#sksBowlBody)"
              stroke="#fbbf24"
              stroke-width="1.6"
            />
            <!-- Decorative Vietnamese band -->
            <path
              d="M36 56 C78 66 132 66 174 56"
              fill="none"
              stroke="#9a3412"
              stroke-width="3"
              stroke-dasharray="7 5"
              opacity="0.7"
            />
            <!-- Base foot -->
            <path d="M74 102 L136 102 L130 112 L80 112 Z" fill="#9a3412" />
          </svg>

          <b class="sks-pop p1">{{ copy.beat2 }}</b>
          <b class="sks-pop p3">{{ copy.beat3 }}</b>

          <div class="sks-crest is-bowl-crest">
            <img :src="resolvedLogoUrl" :alt="resolvedShopName" class="sks-crest-img" />
          </div>
        </div>

        <!-- ==================== STAGE 4: MINIMAL BRAND BURST ==================== -->
        <div v-else class="sks-stage is-minimal">
          <i class="sks-wave w1 is-fast"></i>
          <i class="sks-wave w2 is-fast"></i>
          <div class="sks-crest is-minimal-crest">
            <img :src="resolvedLogoUrl" :alt="resolvedShopName" class="sks-crest-img" />
          </div>
        </div>

        <!-- Typography + Diagonal Slash -->
        <div class="sks-copy">
          <span class="sks-kicker">{{ resolvedShopName }} <i>·</i> {{ copy.kickerSuffix }}</span>
          <div class="sks-titlebox">
            <i class="sks-slash"></i>
            <strong class="sks-title">
              <span class="w a">{{ resolvedTitleA }}</span>
              <span v-if="resolvedTitleB" class="w b">{{ resolvedTitleB }}</span>
            </strong>
          </div>
          <span class="sks-sub"><i></i>{{ resolvedSubtitle }}<i></i></span>
        </div>

        <!-- Progress bar -->
        <div class="sks-bar" :style="{ '--sks-dur': `${effectiveDurationMs}ms` }">
          <i></i>
        </div>
      </div>

      <span class="sks-skip">{{ copy.skip }}</span>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import {
  getIntroEventTemplate,
  getIntroEffectTemplate,
  resolveIntroSplashPalette,
} from '@/utils/introSplashTemplates'

const props = defineProps({
  logoUrl: { type: String, default: '/logo-sa-sm.jpg' },
  shopName: { type: String, default: 'SA KITCHEN' },
  lang: { type: String, default: 'vi' },
  eventId: { type: String, default: 'default' },
  bgId: { type: String, default: 'wok-crimson' },
  effectId: { type: String, default: 'wok' },
  transitionId: { type: String, default: 'doors' },
  primaryColor: { type: String, default: '#059669' },
  secondaryColor: { type: String, default: '#facc15' },
  customTitle: { type: String, default: '' },
  customSubtitle: { type: String, default: '' },
  durationMs: { type: Number, default: 0 },
})

const emit = defineEmits(['done'])

const eventTemplate = computed(() => getIntroEventTemplate(props.eventId))
const effectTemplate = computed(() => getIntroEffectTemplate(props.effectId))
const resolvedEffect = computed(() => effectTemplate.value.id)
const resolvedTransition = computed(() =>
  ['doors', 'curtain', 'zoom'].includes(props.transitionId) ? props.transitionId : 'doors',
)
const effectiveDurationMs = computed(() => {
  if (props.durationMs && props.durationMs >= 1000) return props.durationMs
  return effectTemplate.value.durationMs || 2650
})

const palette = computed(() =>
  resolveIntroSplashPalette(props.bgId, props.primaryColor, props.secondaryColor),
)

const splashCssVars = computed(() => {
  const p = palette.value
  return {
    '--sks-center': p.center,
    '--sks-mid': p.mid,
    '--sks-deep': p.deep,
    '--sks-edge': p.edge,
    '--sks-accent': p.accent,
    '--sks-glow': p.glow,
    '--sks-title-start': p.titleStart,
    '--sks-title-mid': p.titleMid,
    '--sks-title-end': p.titleEnd,
  }
})

const copy = computed(() => {
  const key = props.lang === 'zh' ? 'zh-CN' : props.lang
  const map = eventTemplate.value.copy || {}
  return map[key] || map.vi
})

const resolvedTitleA = computed(() => {
  const custom = String(props.customTitle || '').trim()
  if (!custom) return copy.value.titleA
  const words = custom.split(/\s+/)
  if (words.length <= 2) return custom
  const mid = Math.ceil(words.length / 2)
  return words.slice(0, mid).join(' ')
})

const resolvedTitleB = computed(() => {
  const custom = String(props.customTitle || '').trim()
  if (!custom) return copy.value.titleB
  const words = custom.split(/\s+/)
  if (words.length <= 2) return ''
  const mid = Math.ceil(words.length / 2)
  return words.slice(mid).join(' ')
})

const resolvedSubtitle = computed(() => {
  const custom = String(props.customSubtitle || '').trim()
  return custom || copy.value.subtitle
})

const resolvedLogoUrl = computed(() => String(props.logoUrl || '').trim() || '/logo-sa-sm.jpg')
const resolvedShopName = computed(
  () => String(props.shopName || '').trim().toUpperCase() || 'SA KITCHEN',
)

const visible = ref(true)
const isOpening = ref(false)
const reducedMotion = ref(false)
const canvasRef = ref(null)

let rafId = 0
let autoTimer = null
let finishTimer = null
let burstTimers = []
let prevOverflow = ''
let closed = false

function cleanupCanvasAndTimers() {
  if (rafId) {
    cancelAnimationFrame(rafId)
    rafId = 0
  }
  if (autoTimer) {
    clearTimeout(autoTimer)
    autoTimer = null
  }
  if (finishTimer) {
    clearTimeout(finishTimer)
    finishTimer = null
  }
  for (const t of burstTimers) clearTimeout(t)
  burstTimers = []
  if (typeof window !== 'undefined') {
    window.removeEventListener('resize', resizeCanvas)
    window.removeEventListener('keydown', onKeyDown)
  }
}

function restoreScroll() {
  if (typeof document !== 'undefined') {
    document.documentElement.style.overflow = prevOverflow
  }
}

function openDoors() {
  if (closed) return
  closed = true
  isOpening.value = true
  if (autoTimer) {
    clearTimeout(autoTimer)
    autoTimer = null
  }
  const openDuration = reducedMotion.value ? 220 : resolvedTransition.value === 'zoom' ? 560 : 760
  finishTimer = setTimeout(() => {
    cleanupCanvasAndTimers()
    restoreScroll()
    visible.value = false
    emit('done')
  }, openDuration)
}

function onKeyDown(e) {
  if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
    openDoors()
  }
}

// Multi-style Canvas 2D Particle Engine (embers, petals, snow, lanterns, confetti, hearts, stars)
let ctx = null
let particles = []
let startTime = 0

function resizeCanvas() {
  const cv = canvasRef.value
  if (!cv) return
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  cv.width = window.innerWidth * dpr
  cv.height = window.innerHeight * dpr
  ctx = cv.getContext('2d')
  if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
}

function spawnParticles(count, burst = false) {
  const w = window.innerWidth
  const h = window.innerHeight
  const cx = w * 0.5
  const cy = h * 0.42
  const style = eventTemplate.value.particle || 'embers'

  const palettes = {
    embers: ['#fbbf24', '#f97316', '#fde047', '#fb7185'],
    petals: ['#facc15', '#fb7185', '#fde047', '#f43f5e'],
    snow: ['#ffffff', '#e0f2fe', '#bae6fd', '#fde68a'],
    lanterns: ['#fde047', '#fb923c', '#f59e0b', '#fef3c7'],
    confetti: ['#facc15', '#ef4444', '#38bdf8', '#4ade80', '#f97316'],
    hearts: ['#fda4af', '#f472b6', '#fb7185', '#fef08a'],
    stars: ['#fde047', '#facc15', '#fb923c', '#ffffff'],
  }
  const colors = palettes[style] || palettes.embers

  for (let i = 0; i < count; i += 1) {
    const color = colors[Math.floor(Math.random() * colors.length)]
    const falling = style === 'snow' || (style === 'petals' && !burst)

    if (burst) {
      const angle = Math.random() * Math.PI * 2
      const speed = 2.4 + Math.random() * 6.5
      particles.push({
        x: cx + (Math.random() - 0.5) * 60,
        y: cy + (Math.random() - 0.5) * 30,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.5,
        r: style === 'confetti' ? 3 + Math.random() * 3.5 : 1.4 + Math.random() * 2.8,
        rot: Math.random() * Math.PI * 2,
        vrot: (Math.random() - 0.5) * 0.16,
        life: 1,
        dec: 0.014 + Math.random() * 0.018,
        color,
        gravity: style === 'snow' ? 0.02 : 0.075,
        shape: style,
      })
    } else if (falling) {
      particles.push({
        x: Math.random() * w,
        y: -12,
        vx: (Math.random() - 0.5) * 1.1,
        vy: 1.0 + Math.random() * 1.8,
        r: style === 'petals' ? 3.2 + Math.random() * 2.8 : 1.6 + Math.random() * 2.6,
        rot: Math.random() * Math.PI * 2,
        vrot: (Math.random() - 0.5) * 0.08,
        life: 1,
        dec: 0.0035 + Math.random() * 0.004,
        color,
        gravity: 0.004,
        shape: style,
      })
    } else {
      particles.push({
        x: Math.random() * w,
        y: h + 12,
        vx: (Math.random() - 0.5) * 0.8,
        vy: -(1.0 + Math.random() * 2.2),
        r: style === 'lanterns' || style === 'hearts' ? 2.8 + Math.random() * 3.2 : 1.0 + Math.random() * 2.3,
        rot: Math.random() * Math.PI * 2,
        vrot: (Math.random() - 0.5) * 0.08,
        life: 1,
        dec: 0.0045 + Math.random() * 0.0055,
        color,
        gravity: -0.004,
        shape: style,
      })
    }
  }
}

function drawParticle(p) {
  ctx.save()
  ctx.globalAlpha = Math.max(0, p.life)
  ctx.translate(p.x, p.y)
  ctx.rotate(p.rot)
  ctx.fillStyle = p.color
  ctx.shadowColor = p.color
  ctx.shadowBlur = p.shape === 'snow' ? 5 : 8

  if (p.shape === 'confetti') {
    ctx.fillRect(-p.r, -p.r * 0.55, p.r * 2, p.r * 1.1)
  } else if (p.shape === 'petals') {
    ctx.beginPath()
    ctx.ellipse(0, 0, p.r * 1.35, p.r * 0.72, 0, 0, Math.PI * 2)
    ctx.fill()
  } else if (p.shape === 'hearts') {
    const s = p.r * 0.85
    ctx.beginPath()
    ctx.moveTo(0, s * 0.9)
    ctx.bezierCurveTo(-s * 1.4, -s * 0.1, -s * 0.9, -s * 1.3, 0, -s * 0.4)
    ctx.bezierCurveTo(s * 0.9, -s * 1.3, s * 1.4, -s * 0.1, 0, s * 0.9)
    ctx.fill()
  } else if (p.shape === 'stars') {
    ctx.beginPath()
    for (let k = 0; k < 5; k += 1) {
      const a1 = (k * 2 * Math.PI) / 5 - Math.PI / 2
      const a2 = a1 + Math.PI / 5
      ctx.lineTo(Math.cos(a1) * p.r * 1.45, Math.sin(a1) * p.r * 1.45)
      ctx.lineTo(Math.cos(a2) * p.r * 0.62, Math.sin(a2) * p.r * 0.62)
    }
    ctx.closePath()
    ctx.fill()
  } else {
    ctx.beginPath()
    ctx.arc(0, 0, p.r, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.restore()
}

function tickCanvas(now) {
  if (!ctx) return
  ctx.clearRect(0, 0, window.innerWidth, window.innerHeight)

  if (!isOpening.value && now - startTime < effectiveDurationMs.value && Math.random() < 0.72) {
    spawnParticles(2, false)
  }

  for (let i = particles.length - 1; i >= 0; i -= 1) {
    const p = particles[i]
    p.x += p.vx
    p.y += p.vy
    p.vy += p.gravity
    p.rot += p.vrot
    p.life -= p.dec
    if (p.life <= 0) {
      particles.splice(i, 1)
      continue
    }
    drawParticle(p)
  }
  rafId = requestAnimationFrame(tickCanvas)
}

onMounted(() => {
  if (typeof window === 'undefined') return
  reducedMotion.value = Boolean(
    window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )

  prevOverflow = document.documentElement.style.overflow || ''
  document.documentElement.style.overflow = 'hidden'
  window.addEventListener('keydown', onKeyDown)

  if (!reducedMotion.value) {
    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)
    startTime = performance.now()
    particles = []
    rafId = requestAnimationFrame(tickCanvas)

    if (resolvedEffect.value === 'minimal') {
      burstTimers.push(setTimeout(() => spawnParticles(54, true), 420))
    } else if (resolvedEffect.value === 'cloche') {
      burstTimers.push(setTimeout(() => spawnParticles(28, true), 520))
      burstTimers.push(setTimeout(() => spawnParticles(72, true), 1150))
    } else if (resolvedEffect.value === 'bowl') {
      burstTimers.push(setTimeout(() => spawnParticles(24, true), 450))
      burstTimers.push(setTimeout(() => spawnParticles(64, true), 1300))
    } else {
      burstTimers.push(setTimeout(() => spawnParticles(26, true), 300))
      burstTimers.push(setTimeout(() => spawnParticles(38, true), 920))
      burstTimers.push(setTimeout(() => spawnParticles(78, true), 1520))
    }
  }

  const totalWait = reducedMotion.value ? 900 : effectiveDurationMs.value
  autoTimer = setTimeout(openDoors, totalWait)
})

onUnmounted(() => {
  cleanupCanvasAndTimers()
  restoreScroll()
})
</script>

<style scoped>
.sk-cook-splash {
  position: fixed;
  inset: 0;
  width: 100vw;
  height: 100vh;
  height: 100dvh;
  z-index: 2147483640;
  overflow: hidden;
  cursor: pointer;
  user-select: none;
  font-family: 'Be Vietnam Pro', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

/* ===== BACKDROP & TRANSITIONS (DOORS / CURTAIN / ZOOM) ===== */
.sks-door {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 50.5%;
  z-index: 0;
  transition: transform 0.76s cubic-bezier(0.72, 0, 0.2, 1);
  will-change: transform;
}

.sks-door.l {
  left: 0;
  background: radial-gradient(
    circle at 100% 45%,
    var(--sks-center) 0%,
    var(--sks-mid) 42%,
    var(--sks-deep) 80%,
    var(--sks-edge) 100%
  );
}

.sks-door.r {
  right: 0;
  background: radial-gradient(
    circle at 0% 45%,
    var(--sks-center) 0%,
    var(--sks-mid) 42%,
    var(--sks-deep) 80%,
    var(--sks-edge) 100%
  );
}

.sks-door::after {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  width: 3px;
  background: linear-gradient(180deg, transparent, var(--sks-accent) 28%, #fffbeb 50%, var(--sks-accent) 72%, transparent);
  box-shadow: 0 0 18px var(--sks-glow);
  opacity: 0;
  transition: opacity 0.18s ease;
}

.sks-door.l::after { right: 0; }
.sks-door.r::after { left: 0; }

.sk-cook-splash.is-open .sks-door.l { transform: translateX(-102%); }
.sk-cook-splash.is-open .sks-door.r { transform: translateX(102%); }
.sk-cook-splash.is-open .sks-door::after { opacity: 1; }

.sks-curtain {
  position: absolute;
  inset: 0;
  z-index: 0;
  background: radial-gradient(
    circle at 50% 42%,
    var(--sks-center) 0%,
    var(--sks-mid) 42%,
    var(--sks-deep) 80%,
    var(--sks-edge) 100%
  );
  transition: transform 0.74s cubic-bezier(0.72, 0, 0.2, 1);
  will-change: transform;
}

.sks-curtain::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 3px;
  background: linear-gradient(90deg, transparent, var(--sks-accent) 30%, #fffbeb 50%, var(--sks-accent) 70%, transparent);
  box-shadow: 0 0 18px var(--sks-glow);
}

.sk-cook-splash.is-open .sks-curtain {
  transform: translateY(-102%);
}

.sks-zoom-bg {
  position: absolute;
  inset: 0;
  z-index: 0;
  background: radial-gradient(
    circle at 50% 42%,
    var(--sks-center) 0%,
    var(--sks-mid) 44%,
    var(--sks-deep) 82%,
    var(--sks-edge) 100%
  );
  transition: opacity 0.52s ease, transform 0.52s ease;
  will-change: opacity, transform;
}

.sk-cook-splash.is-open .sks-zoom-bg {
  opacity: 0;
  transform: scale(1.16);
}

/* ===== WORLD ===== */
.sks-world {
  position: absolute;
  inset: 0;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: clamp(14px, 3vh, 26px);
  padding: 20px;
  transition: opacity 0.26s ease, transform 0.36s ease;
}

.sk-cook-splash.is-fx-wok .sks-world {
  animation: sksShake 1.8s linear 0.2s both;
}

.sk-cook-splash.is-open .sks-world {
  opacity: 0;
  transform: scale(1.1);
}

.sk-cook-splash.is-open .sks-skip {
  opacity: 0;
}

@keyframes sksShake {
  0%, 9% { transform: none; }
  6% { transform: translate(2.5px, -2px); }
  37%, 43% { transform: none; }
  40% { transform: translate(-3.5px, 2.5px); }
  71% { transform: none; }
  73% { transform: translate(5px, -3.5px) scale(1.012); }
  75% { transform: translate(-4px, 3px); }
  77% { transform: translate(2.5px, -1.5px); }
  80%, 100% { transform: none; }
}

.sks-embers {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.sks-rays {
  position: absolute;
  left: 50%;
  top: 42%;
  width: 170vmax;
  height: 170vmax;
  margin: -85vmax 0 0 -85vmax;
  pointer-events: none;
  opacity: 0;
  background: repeating-conic-gradient(
    from 0deg,
    color-mix(in srgb, var(--sks-accent) 16%, transparent) 0deg 4deg,
    transparent 4deg 15deg
  );
  -webkit-mask: radial-gradient(circle, #000 0, transparent 54%);
  mask: radial-gradient(circle, #000 0, transparent 54%);
  animation:
    sksRaysIn 0.85s ease 1.1s forwards,
    sksRaysSpin 28s linear 1.1s infinite;
}

.sk-cook-splash.is-fx-minimal .sks-rays {
  animation:
    sksRaysIn 0.55s ease 0.25s forwards,
    sksRaysSpin 28s linear 0.25s infinite;
}

@keyframes sksRaysIn { to { opacity: 1; } }
@keyframes sksRaysSpin { to { transform: rotate(360deg); } }

/* ===== CENTER STAGE ===== */
.sks-stage {
  position: relative;
  width: min(64vw, 260px);
  height: min(56vw, 226px);
  display: flex;
  align-items: center;
  justify-content: center;
  flex: none;
}

.sks-stage.is-minimal {
  height: min(44vw, 168px);
}

.sks-wave {
  position: absolute;
  width: 130px;
  height: 130px;
  border-radius: 50%;
  border: 2px solid var(--sks-accent);
  box-shadow: 0 0 22px var(--sks-glow);
  opacity: 0;
  pointer-events: none;
}

.sks-wave.w1 { animation: sksWave 0.75s cubic-bezier(0.2, 0.7, 0.2, 1) 0.28s both; }
.sks-wave.w2 { animation: sksWave 0.78s cubic-bezier(0.2, 0.7, 0.2, 1) 0.9s both; }
.sks-wave.w3 { animation: sksWave 0.9s cubic-bezier(0.2, 0.7, 0.2, 1) 1.5s both; }
.sks-wave.w1.is-fast { animation: sksWave 0.72s cubic-bezier(0.2, 0.7, 0.2, 1) 0.2s both; }
.sks-wave.w2.is-fast { animation: sksWave 0.82s cubic-bezier(0.2, 0.7, 0.2, 1) 0.58s both; }

@keyframes sksWave {
  0% { transform: scale(0.55); opacity: 0.92; }
  100% { transform: scale(2.45); opacity: 0; }
}

/* Steam */
.sks-steam-group {
  position: absolute;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  width: 110px;
  height: 70px;
  pointer-events: none;
}

.sks-steam-group.is-cloche-steam { top: 44px; }
.sks-steam-group.is-bowl-steam { top: 14px; }

.sks-steam {
  position: absolute;
  bottom: 0;
  width: 20px;
  height: 52px;
  border-radius: 999px;
  background: radial-gradient(circle, rgba(255, 247, 237, 0.45) 0%, transparent 72%);
  filter: blur(5px);
  opacity: 0;
}

.sks-steam.s1 { left: 16px; animation: sksSteamRise 1.6s ease-out 0.15s infinite; }
.sks-steam.s2 { left: 45px; animation: sksSteamRise 1.5s ease-out 0.55s infinite; }
.sks-steam.s3 { left: 74px; animation: sksSteamRise 1.7s ease-out 0.95s infinite; }

@keyframes sksSteamRise {
  0% { transform: translateY(10px) scale(0.7); opacity: 0; }
  35% { opacity: 0.65; }
  100% { transform: translateY(-48px) translateX(8px) scale(1.6); opacity: 0; }
}

/* ===== WOK STAGE ===== */
.sks-ingredients {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 3;
}

.sks-ing {
  position: absolute;
  left: 47%;
  top: 48%;
  width: 34px;
  height: 34px;
  margin: -17px 0 0 -17px;
  opacity: 0;
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.45));
}

.sks-ing.i1 { animation: sksToss1 0.85s cubic-bezier(0.22, 0.72, 0.25, 1) 0.26s 2 both; }
.sks-ing.i2 { animation: sksToss2 0.85s cubic-bezier(0.22, 0.72, 0.25, 1) 0.32s 2 both; }
.sks-ing.i3 { animation: sksToss3 0.85s cubic-bezier(0.22, 0.72, 0.25, 1) 0.29s 2 both; }
.sks-ing.i4 { animation: sksToss4 0.85s cubic-bezier(0.22, 0.72, 0.25, 1) 0.35s 2 both; }
.sks-ing.i5 { animation: sksToss5 0.85s cubic-bezier(0.22, 0.72, 0.25, 1) 0.31s 2 both; }

@keyframes sksToss1 {
  0% { transform: translate(-18px, 6px) scale(0.5) rotate(0deg); opacity: 0; }
  20% { opacity: 1; }
  52% { transform: translate(-48px, -74px) scale(1.12) rotate(-140deg); opacity: 1; }
  88% { opacity: 1; }
  100% { transform: translate(-12px, 8px) scale(0.65) rotate(-290deg); opacity: 0; }
}
@keyframes sksToss2 {
  0% { transform: translate(12px, 6px) scale(0.5) rotate(0deg); opacity: 0; }
  20% { opacity: 1; }
  52% { transform: translate(44px, -68px) scale(1.1) rotate(130deg); opacity: 1; }
  88% { opacity: 1; }
  100% { transform: translate(10px, 8px) scale(0.65) rotate(260deg); opacity: 0; }
}
@keyframes sksToss3 {
  0% { transform: translate(0, 4px) scale(0.5) rotate(0deg); opacity: 0; }
  20% { opacity: 1; }
  50% { transform: translate(-6px, -84px) scale(1.15) rotate(95deg); opacity: 1; }
  88% { opacity: 1; }
  100% { transform: translate(-2px, 8px) scale(0.65) rotate(220deg); opacity: 0; }
}
@keyframes sksToss4 {
  0% { transform: translate(-10px, 8px) scale(0.5) rotate(0deg); opacity: 0; }
  22% { opacity: 1; }
  54% { transform: translate(24px, -78px) scale(1.06) rotate(-110deg); opacity: 1; }
  88% { opacity: 1; }
  100% { transform: translate(4px, 8px) scale(0.6) rotate(-230deg); opacity: 0; }
}
@keyframes sksToss5 {
  0% { transform: translate(18px, 6px) scale(0.5) rotate(0deg); opacity: 0; }
  22% { opacity: 1; }
  52% { transform: translate(-28px, -62px) scale(1.05) rotate(160deg); opacity: 1; }
  88% { opacity: 1; }
  100% { transform: translate(-8px, 8px) scale(0.6) rotate(320deg); opacity: 0; }
}

.sks-wok-rig {
  position: relative;
  z-index: 2;
  width: 214px;
  margin-top: 28px;
  transform-origin: 76% 52%;
  animation: sksWokToss 2.2s cubic-bezier(0.32, 0.08, 0.24, 1) 0.1s both;
}

.sks-wok-svg {
  width: 100%;
  height: auto;
  display: block;
  filter: drop-shadow(0 12px 24px rgba(0, 0, 0, 0.65));
}

@keyframes sksWokToss {
  0% { transform: scale(0.84) rotate(0deg) translateY(10px); opacity: 0; }
  8% { transform: scale(1) rotate(0deg) translateY(0); opacity: 1; }
  14% { transform: rotate(9deg) translateY(6px); }
  22% { transform: rotate(-14deg) translateY(-14px); }
  30% { transform: rotate(0deg) translateY(0); }
  40% { transform: rotate(11deg) translateY(7px); }
  49% { transform: rotate(-16deg) translateY(-18px); }
  58% { transform: rotate(0deg) translateY(0); }
  66% { transform: scale(1.05) rotate(-8deg) translateY(-8px); opacity: 1; }
  78%, 100% { transform: scale(0.88) translateY(18px); opacity: 0.25; }
}

.sks-flames {
  position: absolute;
  bottom: 18px;
  left: 46%;
  transform: translateX(-50%);
  width: 136px;
  height: 54px;
  z-index: 1;
  pointer-events: none;
  animation: sksFlameFade 2.2s ease 0.1s both;
}

@keyframes sksFlameFade {
  0% { opacity: 0; transform: translateX(-50%) scale(0.7); }
  12% { opacity: 1; transform: translateX(-50%) scale(1); }
  50% { opacity: 1; transform: translateX(-50%) scale(1.18); }
  72% { opacity: 1; transform: translateX(-50%) scale(1.28); }
  86%, 100% { opacity: 0.35; transform: translateX(-50%) scale(0.9); }
}

.sks-burner-glow {
  position: absolute;
  bottom: -4px;
  left: 50%;
  transform: translateX(-50%);
  width: 132px;
  height: 22px;
  border-radius: 50%;
  background: radial-gradient(ellipse, rgba(251, 146, 60, 0.85) 0%, rgba(239, 68, 68, 0.45) 55%, transparent 78%);
  filter: blur(6px);
}

.sks-flame {
  position: absolute;
  bottom: 4px;
  border-radius: 50% 50% 45% 45% / 65% 65% 35% 35%;
  transform-origin: bottom center;
}

.sks-flame.f1 { left: 14px; width: 24px; height: 36px; background: radial-gradient(circle at 50% 80%, #fef08a 0%, #f97316 55%, #dc2626 100%); animation: sksFlicker 0.24s ease-in-out infinite alternate; }
.sks-flame.f2 { left: 34px; width: 28px; height: 46px; background: radial-gradient(circle at 50% 82%, #fffbeb 0%, #fbbf24 45%, #ea580c 100%); animation: sksFlicker 0.2s ease-in-out 0.06s infinite alternate; }
.sks-flame.f3 { left: 54px; width: 30px; height: 52px; background: radial-gradient(circle at 50% 85%, #ffffff 0%, #fde047 38%, #f97316 78%, #dc2626 100%); animation: sksFlicker 0.18s ease-in-out 0.1s infinite alternate; }
.sks-flame.f4 { left: 76px; width: 26px; height: 44px; background: radial-gradient(circle at 50% 82%, #fef08a 0%, #fb923c 52%, #dc2626 100%); animation: sksFlicker 0.22s ease-in-out 0.04s infinite alternate; }
.sks-flame.f5 { left: 96px; width: 22px; height: 34px; background: radial-gradient(circle at 50% 80%, #fde047 0%, #ea580c 60%, #b91c1c 100%); animation: sksFlicker 0.25s ease-in-out 0.12s infinite alternate; }

@keyframes sksFlicker {
  0% { transform: scaleY(0.88) scaleX(0.96) skewX(-3deg); }
  100% { transform: scaleY(1.14) scaleX(1.04) skewX(3deg); }
}

/* ===== CLOCHE STAGE ===== */
.sks-platter-svg {
  position: absolute;
  bottom: 24px;
  width: 214px;
  z-index: 2;
  filter: drop-shadow(0 10px 20px rgba(0, 0, 0, 0.55));
}

.sks-cloche-lid {
  position: absolute;
  bottom: 38px;
  width: 190px;
  z-index: 6;
  transform-origin: center bottom;
  filter: drop-shadow(0 12px 24px rgba(0, 0, 0, 0.55));
  animation: sksClocheLift 1.85s cubic-bezier(0.28, 0.05, 0.22, 1) 0.12s forwards;
}

@keyframes sksClocheLift {
  0% { transform: translateY(-22px) scale(0.9); opacity: 0; }
  14% { transform: translateY(0) scale(1); opacity: 1; }
  22% { transform: rotate(-3deg); }
  28% { transform: rotate(3deg); }
  34% { transform: rotate(-2deg); }
  40% { transform: rotate(0deg); }
  52% { transform: translateY(-10px) rotate(-4deg); opacity: 1; }
  85% { transform: translate(42px, -118px) rotate(22deg) scale(0.88); opacity: 0.25; }
  100% { transform: translate(65px, -150px) rotate(28deg) scale(0.8); opacity: 0; }
}

/* ===== BOWL STAGE ===== */
.sks-bowl-svg {
  position: relative;
  z-index: 3;
  width: 204px;
  margin-top: 42px;
  filter: drop-shadow(0 12px 24px rgba(0, 0, 0, 0.55));
  animation: sksBowlIn 2.2s ease 0.1s both;
}

@keyframes sksBowlIn {
  0% { transform: translateY(16px) scale(0.85); opacity: 0; }
  16% { transform: translateY(0) scale(1); opacity: 1; }
  66% { transform: translateY(0) scale(1); opacity: 1; }
  84%, 100% { transform: translateY(14px) scale(0.9); opacity: 0.3; }
}

.sks-chopsticks-svg {
  position: absolute;
  top: 24px;
  left: 50%;
  width: 174px;
  margin-left: -74px;
  z-index: 4;
  filter: drop-shadow(0 6px 12px rgba(0, 0, 0, 0.45));
  animation: sksChopLift 2.1s ease-in-out 0.18s both;
}

@keyframes sksChopLift {
  0% { transform: translateY(18px) rotate(6deg); opacity: 0; }
  18% { transform: translateY(4px) rotate(0deg); opacity: 1; }
  45% { transform: translateY(-16px) rotate(-5deg); opacity: 1; }
  68% { transform: translateY(-4px) rotate(0deg); opacity: 1; }
  85%, 100% { transform: translateY(-28px) rotate(-8deg); opacity: 0; }
}

/* ===== POP CALLOUTS ===== */
.sks-pop {
  position: absolute;
  z-index: 4;
  font-size: clamp(14px, 3.6vw, 18px);
  font-weight: 900;
  letter-spacing: 0.8px;
  color: var(--sks-title-start);
  text-shadow: 0 2px 14px var(--sks-glow), 0 0 2px #000;
  opacity: 0;
  pointer-events: none;
  white-space: nowrap;
}

.sks-pop.p1 { top: 22px; left: 2px; animation: sksPop 0.65s cubic-bezier(0.2, 0.8, 0.25, 1) 0.26s both; }
.sks-pop.p2 { top: 14px; right: 0; animation: sksPop 0.65s cubic-bezier(0.2, 0.8, 0.25, 1) 0.88s both; }
.sks-pop.p3 { top: -4px; left: 50%; animation: sksPopCenter 0.72s cubic-bezier(0.2, 0.8, 0.25, 1) 1.44s both; }
.sks-pop.is-cloche-pop { top: 8px; left: 50%; right: auto; animation: sksPopCenter 0.75s cubic-bezier(0.2, 0.8, 0.25, 1) 1.05s both; }

@keyframes sksPop {
  0% { transform: scale(0.45) translateY(14px) rotate(-6deg); opacity: 0; }
  25% { transform: scale(1.14) translateY(-4px) rotate(2deg); opacity: 1; }
  75% { opacity: 1; }
  100% { transform: scale(0.95) translateY(-16px) rotate(0deg); opacity: 0; }
}

@keyframes sksPopCenter {
  0% { transform: translateX(-50%) scale(0.45) translateY(12px); opacity: 0; }
  28% { transform: translateX(-50%) scale(1.16) translateY(-4px); opacity: 1; }
  78% { opacity: 1; }
  100% { transform: translateX(-50%) scale(0.96) translateY(-16px); opacity: 0; }
}

/* ===== LOGO CREST ===== */
.sks-crest {
  position: absolute;
  z-index: 5;
  width: 112px;
  height: 112px;
  border-radius: 50%;
  padding: 4px;
  background: linear-gradient(135deg, var(--sks-title-start), var(--sks-accent), var(--sks-glow));
  box-shadow:
    0 0 0 5px color-mix(in srgb, var(--sks-accent) 24%, transparent),
    0 14px 40px color-mix(in srgb, var(--sks-glow) 55%, transparent);
  opacity: 0;
  transform: scale(0.35);
  animation: sksCrestIn 0.65s cubic-bezier(0.18, 0.89, 0.32, 1.2) 1.48s forwards;
}

.sks-crest.is-cloche-crest {
  bottom: 44px;
  animation: sksCrestIn 0.65s cubic-bezier(0.18, 0.89, 0.32, 1.2) 1.08s forwards;
}

.sks-crest.is-bowl-crest {
  animation: sksCrestIn 0.65s cubic-bezier(0.18, 0.89, 0.32, 1.2) 1.32s forwards;
}

.sks-crest.is-minimal-crest {
  width: 122px;
  height: 122px;
  animation: sksCrestIn 0.55s cubic-bezier(0.18, 0.89, 0.32, 1.2) 0.16s forwards;
}

.sks-crest-img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  background: #ffffff;
  display: block;
}

@keyframes sksCrestIn {
  0% { opacity: 0; transform: scale(0.35) rotate(-14deg); }
  100% { opacity: 1; transform: scale(1) rotate(0deg); }
}

/* ===== TYPOGRAPHY ===== */
.sks-copy {
  position: relative;
  z-index: 4;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 8px;
}

.sks-kicker {
  font-size: clamp(10.5px, 2.5vw, 12.5px);
  font-weight: 800;
  letter-spacing: 3px;
  color: var(--sks-title-start);
  opacity: 0;
  animation: sksFadeUp 0.5s ease 0.22s forwards;
}

.sks-kicker i {
  font-style: normal;
  color: var(--sks-accent);
  margin: 0 6px;
}

.sks-titlebox {
  position: relative;
  padding: 2px 10px;
  overflow: hidden;
}

.sks-title {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 6px 12px;
  font-size: clamp(24px, 6.8vw, 42px);
  font-weight: 900;
  line-height: 1.1;
  letter-spacing: -0.5px;
  text-transform: uppercase;
}

.sks-title .w.a {
  color: #fff7ed;
  text-shadow: 0 4px 18px rgba(0, 0, 0, 0.65);
  opacity: 0;
  animation: sksSlideLeft 0.52s cubic-bezier(0.2, 0.85, 0.25, 1) 0.36s forwards;
}

.sks-title .w.b {
  background: linear-gradient(180deg, var(--sks-title-start) 0%, var(--sks-title-mid) 55%, var(--sks-title-end) 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  filter: drop-shadow(0 4px 16px color-mix(in srgb, var(--sks-glow) 50%, transparent));
  opacity: 0;
  animation: sksSlideRight 0.52s cubic-bezier(0.2, 0.85, 0.25, 1) 0.48s forwards;
}

.sks-slash {
  position: absolute;
  top: 0;
  bottom: 0;
  left: -40%;
  width: 34%;
  background: linear-gradient(90deg, transparent, rgba(255, 251, 235, 0.72), transparent);
  transform: skewX(-24deg);
  pointer-events: none;
  animation: sksSlashSweep 0.7s ease 1.18s both;
}

@keyframes sksSlashSweep {
  0% { left: -40%; opacity: 0; }
  20% { opacity: 1; }
  100% { left: 135%; opacity: 0; }
}

@keyframes sksSlideLeft {
  0% { opacity: 0; transform: translateX(-28px); }
  100% { opacity: 1; transform: none; }
}

@keyframes sksSlideRight {
  0% { opacity: 0; transform: translateX(28px); }
  100% { opacity: 1; transform: none; }
}

.sks-sub {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-size: clamp(10.5px, 2.6vw, 12.5px);
  font-weight: 700;
  letter-spacing: 1.8px;
  color: rgba(255, 247, 237, 0.86);
  opacity: 0;
  animation: sksFadeUp 0.5s ease 0.68s forwards;
}

.sks-sub i {
  display: inline-block;
  width: clamp(14px, 4vw, 28px);
  height: 1.5px;
  background: linear-gradient(90deg, transparent, var(--sks-accent), transparent);
}

@keyframes sksFadeUp {
  0% { opacity: 0; transform: translateY(10px); }
  100% { opacity: 1; transform: none; }
}

/* ===== PROGRESS BAR ===== */
.sks-bar {
  position: relative;
  z-index: 4;
  width: min(210px, 56vw);
  height: 3.5px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.14);
  overflow: hidden;
}

.sks-bar i {
  display: block;
  width: 100%;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, var(--sks-glow), var(--sks-accent), var(--sks-title-start));
  box-shadow: 0 0 12px var(--sks-accent);
  transform-origin: left center;
  animation: sksBarFill var(--sks-dur, 2650ms) cubic-bezier(0.25, 0.1, 0.25, 1) forwards;
}

@keyframes sksBarFill {
  0% { transform: scaleX(0); }
  100% { transform: scaleX(1); }
}

/* ===== SKIP HINT ===== */
.sks-skip {
  position: absolute;
  bottom: max(22px, env(safe-area-inset-bottom, 22px));
  left: 50%;
  transform: translateX(-50%);
  z-index: 5;
  padding: 6px 14px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid color-mix(in srgb, var(--sks-accent) 32%, transparent);
  color: rgba(255, 247, 237, 0.85);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.4px;
  white-space: nowrap;
  transition: opacity 0.2s ease;
  animation: sksSkipPulse 1.6s ease-in-out 0.6s infinite;
}

@keyframes sksSkipPulse {
  0%, 100% { opacity: 0.65; }
  50% { opacity: 1; }
}

.sk-cook-splash.is-reduced .sks-world,
.sk-cook-splash.is-reduced .sks-wok-rig,
.sk-cook-splash.is-reduced .sks-cloche-lid,
.sk-cook-splash.is-reduced .sks-bowl-svg,
.sk-cook-splash.is-reduced .sks-chopsticks-svg,
.sk-cook-splash.is-reduced .sks-ing,
.sk-cook-splash.is-reduced .sks-flame,
.sk-cook-splash.is-reduced .sks-wave,
.sk-cook-splash.is-reduced .sks-rays {
  animation: none !important;
}

.sk-cook-splash.is-reduced .sks-crest,
.sk-cook-splash.is-reduced .sks-title .w,
.sk-cook-splash.is-reduced .sks-kicker,
.sk-cook-splash.is-reduced .sks-sub {
  opacity: 1 !important;
  transform: none !important;
}
</style>
