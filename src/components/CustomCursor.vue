<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { activeDemo } from '../lib/state'
import { finePointer, gsap, reducedMotion } from '../lib/motion'

const enabled = finePointer && !reducedMotion
const dot = ref<HTMLElement>()
const label = ref('')
const active = ref(false)
const shown = ref(false)

let cleanup: (() => void) | undefined

// A dialog opening or closing changes what is under the pointer without a pointer move.
watch(activeDemo, () => {
  active.value = false
})

onMounted(() => {
  if (!enabled || !dot.value) return
  const xTo = gsap.quickTo(dot.value, 'x', { duration: 0.35, ease: 'power3.out' })
  const yTo = gsap.quickTo(dot.value, 'y', { duration: 0.35, ease: 'power3.out' })

  const move = (e: PointerEvent) => {
    shown.value = true
    xTo(e.clientX)
    yTo(e.clientY)
    const target = (e.target as Element | null)?.closest<HTMLElement>('[data-cursor]')
    active.value = !!target
    if (target) label.value = target.dataset.cursor ?? ''
  }
  const leave = () => {
    shown.value = false
  }

  window.addEventListener('pointermove', move, { passive: true })
  document.documentElement.addEventListener('pointerleave', leave)
  cleanup = () => {
    window.removeEventListener('pointermove', move)
    document.documentElement.removeEventListener('pointerleave', leave)
  }
})

onBeforeUnmount(() => cleanup?.())
</script>

<template>
  <div
    v-if="enabled"
    ref="dot"
    class="cursor"
    :class="{ 'is-active': active, 'is-shown': shown }"
    aria-hidden="true"
  >
    <span class="cursor__disc"><span class="cursor__label mono">{{ label }} ↗</span></span>
  </div>
</template>

<style scoped>
.cursor {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 90;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.3s;
}

.cursor.is-shown {
  opacity: 1;
}

.cursor__disc {
  position: absolute;
  top: 0;
  left: 0;
  width: 96px;
  height: 96px;
  margin: -48px 0 0 -48px;
  border-radius: 50%;
  background: var(--accent);
  color: var(--accent-ink);
  display: grid;
  place-items: center;
  transform: scale(0);
  transition: transform 0.5s var(--ease);
}

.cursor__label {
  opacity: 0;
  transition: opacity 0.2s;
  white-space: nowrap;
}

.cursor.is-active .cursor__disc {
  transform: scale(1);
}

.cursor.is-active .cursor__label {
  opacity: 1;
  transition-delay: 0.1s;
}
</style>
