<script setup>
import { computed } from 'vue'

const props = defineProps({
  effect: {
    type: String,
    default: 'none',
  },
  contained: {
    type: Boolean,
    default: false,
  },
})

const activeEffect = computed(() => {
  const val = String(props.effect || 'none').trim()
  return ['tet', 'snow', 'sakura', 'sparkle'].includes(val) ? val : 'none'
})

// Deterministic pseudo-random particle configs (no layout thrashing or hydration mismatch)
const particles = computed(() => {
  if (activeEffect.value === 'none') return []
  const count = props.contained ? 12 : 18
  const list = []
  for (let i = 0; i < count; i++) {
    const seed = (i + 1) * 37
    const left = ((seed * 19) % 94) + 3
    const delay = -((seed * 7) % 140) / 10
    const duration =
      activeEffect.value === 'sparkle'
        ? 4.2 + ((seed * 5) % 35) / 10
        : 8.5 + ((seed * 11) % 65) / 10
    const size = props.contained
      ? 8 + ((seed * 3) % 7)
      : 10 + ((seed * 3) % 10)
    const drift = ((seed % 2 === 0 ? 1 : -1) * (16 + (seed % 28)))
    const variant = i % 2 === 0 ? 'a' : 'b'
    const top = activeEffect.value === 'sparkle' ? ((seed * 23) % 88) + 5 : -8

    list.push({
      id: `${activeEffect.value}-${i}`,
      variant,
      style: {
        '--p-left': `${left}%`,
        '--p-top': `${top}%`,
        '--p-delay': `${delay}s`,
        '--p-dur': `${duration}s`,
        '--p-size': `${size}px`,
        '--p-drift': `${drift}px`,
      },
    })
  }
  return list
})
</script>

<template>
  <div
    v-if="activeEffect !== 'none'"
    class="sa-seasonal-overlay"
    :class="[`is-${activeEffect}`, { 'is-contained': contained }]"
    aria-hidden="true"
  >
    <span
      v-for="p in particles"
      :key="p.id"
      class="sa-particle"
      :class="`is-var-${p.variant}`"
      :style="p.style"
    >
      <template v-if="activeEffect === 'snow'">❄</template>
      <template v-else-if="activeEffect === 'sparkle'">✦</template>
      <template v-else-if="activeEffect === 'tet'">
        {{ p.variant === 'a' ? '✿' : '❀' }}
      </template>
      <template v-else-if="activeEffect === 'sakura'">❀</template>
    </span>
  </div>
</template>

<style scoped>
.sa-seasonal-overlay {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 45;
  overflow: hidden;
  user-select: none;
}

.sa-seasonal-overlay.is-contained {
  position: absolute;
  z-index: 8;
}

.sa-particle {
  position: absolute;
  left: var(--p-left);
  top: var(--p-top);
  font-size: var(--p-size);
  line-height: 1;
  will-change: transform, opacity;
  opacity: 0;
}

/* TET: Hoa mai vàng & hoa đào hồng */
.sa-seasonal-overlay.is-tet .sa-particle {
  animation: saSeasonalFall var(--p-dur) linear var(--p-delay) infinite;
}
.sa-seasonal-overlay.is-tet .sa-particle.is-var-a {
  color: #facc15;
  text-shadow: 0 1px 4px rgba(202, 138, 4, 0.45);
}
.sa-seasonal-overlay.is-tet .sa-particle.is-var-b {
  color: #fb7185;
  text-shadow: 0 1px 4px rgba(225, 29, 72, 0.35);
}

/* SNOW: Bông tuyết */
.sa-seasonal-overlay.is-snow .sa-particle {
  color: #e0f2fe;
  text-shadow: 0 0 6px rgba(14, 165, 233, 0.4), 0 1px 3px rgba(15, 23, 42, 0.25);
  animation: saSeasonalFall var(--p-dur) linear var(--p-delay) infinite;
}

/* SAKURA: Cánh hoa anh đào */
.sa-seasonal-overlay.is-sakura .sa-particle {
  animation: saSeasonalFall var(--p-dur) linear var(--p-delay) infinite;
}
.sa-seasonal-overlay.is-sakura .sa-particle.is-var-a {
  color: #f9a8d4;
  text-shadow: 0 1px 4px rgba(219, 39, 119, 0.3);
}
.sa-seasonal-overlay.is-sakura .sa-particle.is-var-b {
  color: #fbcfe8;
  text-shadow: 0 1px 4px rgba(236, 72, 153, 0.28);
}

/* SPARKLE: Lấp lánh lễ hội */
.sa-seasonal-overlay.is-sparkle .sa-particle {
  animation: saSeasonalTwinkle var(--p-dur) ease-in-out var(--p-delay) infinite;
}
.sa-seasonal-overlay.is-sparkle .sa-particle.is-var-a {
  color: #facc15;
  text-shadow: 0 0 8px rgba(250, 204, 21, 0.7);
}
.sa-seasonal-overlay.is-sparkle .sa-particle.is-var-b {
  color: #fef08a;
  text-shadow: 0 0 8px rgba(253, 224, 71, 0.65);
}

@keyframes saSeasonalFall {
  0% {
    transform: translate3d(0, -10vh, 0) rotate(0deg);
    opacity: 0;
  }
  10% {
    opacity: 0.78;
  }
  50% {
    transform: translate3d(var(--p-drift), 48vh, 0) rotate(180deg);
    opacity: 0.72;
  }
  90% {
    opacity: 0.55;
  }
  100% {
    transform: translate3d(calc(var(--p-drift) * -0.5), 108vh, 0) rotate(360deg);
    opacity: 0;
  }
}

.sa-seasonal-overlay.is-contained .sa-particle {
  animation-name: saSeasonalFallContained;
}
.sa-seasonal-overlay.is-contained.is-sparkle .sa-particle {
  animation-name: saSeasonalTwinkle;
}

@keyframes saSeasonalFallContained {
  0% {
    transform: translate3d(0, -20px, 0) rotate(0deg);
    opacity: 0;
  }
  12% {
    opacity: 0.82;
  }
  50% {
    transform: translate3d(var(--p-drift), 240px, 0) rotate(180deg);
    opacity: 0.76;
  }
  90% {
    opacity: 0.5;
  }
  100% {
    transform: translate3d(calc(var(--p-drift) * -0.5), 540px, 0) rotate(360deg);
    opacity: 0;
  }
}

@keyframes saSeasonalTwinkle {
  0%,
  100% {
    transform: scale(0.55) rotate(0deg);
    opacity: 0.1;
  }
  50% {
    transform: scale(1.15) rotate(45deg);
    opacity: 0.85;
  }
}

@media (prefers-reduced-motion: reduce) {
  .sa-seasonal-overlay {
    display: none;
  }
}
</style>
