// Notification bell synthesizer using Web Audio API (zero external asset dependency)

let sharedAudioCtx = null
let unlockBound = false

function getAudioContext() {
  if (typeof window === 'undefined') return null
  const Ctor = window.AudioContext || window.webkitAudioContext
  if (!Ctor) return null
  if (!sharedAudioCtx || sharedAudioCtx.state === 'closed') {
    sharedAudioCtx = new Ctor()
  }
  return sharedAudioCtx
}

function handleFirstGesture() {
  try {
    const ctx = getAudioContext()
    if (!ctx) return
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {})
    }
    // Silent 1-sample buffer unlock for iOS Safari / mobile browsers
    const buf = ctx.createBuffer(1, 1, 22050)
    const src = ctx.createBufferSource()
    src.buffer = buf
    src.connect(ctx.destination)
    src.start(0)
  } catch {}
}

export function bindOrderBellUnlock() {
  if (typeof window === 'undefined' || unlockBound) return
  unlockBound = true
  const events = ['pointerdown', 'touchstart', 'keydown']
  const onceUnlock = () => {
    handleFirstGesture()
    events.forEach((ev) => window.removeEventListener(ev, onceUnlock, true))
  }
  events.forEach((ev) => window.addEventListener(ev, onceUnlock, { capture: true, passive: true }))
}

function triggerTone(ctx, { freq, startAt, duration, peakGain = 0.24, type = 'triangle' }) {
  const osc = ctx.createOscillator()
  const overtone = ctx.createOscillator()
  const gain = ctx.createGain()

  osc.type = type
  osc.frequency.setValueAtTime(freq, startAt)

  overtone.type = 'sine'
  overtone.frequency.setValueAtTime(freq * 2, startAt)

  const overtoneGain = ctx.createGain()
  overtoneGain.gain.setValueAtTime(0.25, startAt)

  gain.gain.setValueAtTime(0.0001, startAt)
  gain.gain.exponentialRampToValueAtTime(peakGain, startAt + 0.015)
  gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration)

  osc.connect(gain)
  overtone.connect(overtoneGain)
  overtoneGain.connect(gain)
  gain.connect(ctx.destination)

  osc.start(startAt)
  overtone.start(startAt)
  osc.stop(startAt + duration + 0.02)
  overtone.stop(startAt + duration + 0.02)
}

export async function playOrderBell(kind = 'complete') {
  try {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      try {
        navigator.vibrate(kind === 'cancel' ? [160, 80, 160] : [110, 60, 150])
      } catch {}
    }

    const ctx = getAudioContext()
    if (!ctx) return
    if (ctx.state === 'suspended') {
      await ctx.resume().catch(() => {})
    }
    if (ctx.state !== 'running') return

    const now = ctx.currentTime + 0.02
    if (kind === 'cancel') {
      // Gentle two-note alert chime (A5 -> F5)
      triggerTone(ctx, { freq: 880, startAt: now, duration: 0.34, peakGain: 0.22 })
      triggerTone(ctx, { freq: 698.46, startAt: now + 0.2, duration: 0.52, peakGain: 0.24 })
    } else {
      // Uplifting three-note shop chime (C6 -> E6 -> G6)
      triggerTone(ctx, { freq: 1046.5, startAt: now, duration: 0.28, peakGain: 0.2 })
      triggerTone(ctx, { freq: 1318.51, startAt: now + 0.14, duration: 0.32, peakGain: 0.22 })
      triggerTone(ctx, { freq: 1567.98, startAt: now + 0.28, duration: 0.55, peakGain: 0.24 })
    }
  } catch {}
}
