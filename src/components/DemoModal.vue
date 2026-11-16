<script setup lang="ts">
import { computed, defineAsyncComponent, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { projects } from '../data/projects'
import type { ProjectId } from '../data/projects'
import { activeDemo, closeDemo, copy } from '../lib/state'
import { lockScroll } from '../lib/motion'

// Each demo is its own chunk: nothing here is downloaded until a visitor opens it.
const demos: Partial<Record<ProjectId, ReturnType<typeof defineAsyncComponent>>> = {
  polaroid: defineAsyncComponent(() => import('../demos/polaroid/PolaroidDemo.vue')),
  raytracer: defineAsyncComponent(() => import('../demos/raytracer/RaytracerDemo.vue')),
  wolf3d: defineAsyncComponent(() => import('../demos/wolf3d/Wolf3dDemo.vue')),
}

const project = computed(() => projects.find((p) => p.id === activeDemo.value))
const view = computed(() => (activeDemo.value ? demos[activeDemo.value] : undefined))
const scope = computed(() => {
  const id = activeDemo.value
  return id === 'polaroid' || id === 'raytracer' || id === 'wolf3d' ? copy.value.demo[id].scope : ''
})

const dialog = ref<HTMLElement>()
const closeButton = ref<HTMLButtonElement>()
let opener: HTMLElement | null = null

const close = closeDemo

function onKeydown(e: KeyboardEvent) {
  // While a demo holds the pointer (mouse look), Escape only releases it.
  if (e.key === 'Escape' && !document.pointerLockElement) {
    close()
    return
  }
  if (e.key !== 'Tab' || !dialog.value) return
  const focusable = dialog.value.querySelectorAll<HTMLElement>(
    'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])',
  )
  if (!focusable.length) return
  const first = focusable[0]
  const last = focusable[focusable.length - 1]
  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault()
    last.focus()
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault()
    first.focus()
  }
}

watch(activeDemo, async (id) => {
  if (id) {
    opener = document.activeElement as HTMLElement | null
    lockScroll(true)
    document.addEventListener('keydown', onKeydown)
    await nextTick()
    closeButton.value?.focus()
  } else {
    lockScroll(false)
    document.removeEventListener('keydown', onKeydown)
    opener?.focus()
  }
})

onBeforeUnmount(() => document.removeEventListener('keydown', onKeydown))
</script>

<template>
  <Transition name="demo">
    <div
      v-if="project && view"
      ref="dialog"
      class="demo"
      role="dialog"
      aria-modal="true"
      :aria-label="`${project.title} — ${copy.demo.tryIt}`"
      data-lenis-prevent
    >
      <header class="demo__bar">
        <div class="demo__id">
          <h2 class="demo__title">{{ project.title }}</h2>
          <span class="demo__badge mono" :class="`demo__badge--${project.demo}`">
            {{ project.demo === 'original' ? copy.demo.original : copy.demo.port }}
          </span>
        </div>
        <a class="mono link-line demo__source" :href="project.repo" target="_blank" rel="noopener">
          {{ copy.demo.source }} ↗
        </a>
        <button ref="closeButton" class="demo__close mono" type="button" @click="close">
          {{ copy.demo.close }} <span aria-hidden="true">✕</span>
        </button>
      </header>
      <div class="demo__body">
        <aside class="demo__notice" role="note">
          <p class="demo__notice-title">
            <strong>{{ copy.demo.notFull }}</strong> {{ copy.demo.notFullLead }}
          </p>
          <p class="demo__notice-scope">{{ scope }}</p>
          <a class="mono link-line" :href="project.repo" target="_blank" rel="noopener">
            {{ copy.demo.fullProject }} ↗
          </a>
        </aside>
        <component :is="view" />
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.demo {
  position: fixed;
  inset: 0;
  z-index: 80;
  display: flex;
  flex-direction: column;
  background: var(--bg);
  color: var(--ink);
}

.demo__bar {
  flex: none;
  display: flex;
  align-items: center;
  gap: clamp(12px, 2vw, 28px);
  min-height: 68px;
  padding: 10px var(--pad);
  border-bottom: 1px solid var(--line);
}

.demo__id {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px 16px;
  margin-right: auto;
}

.demo__title {
  font-family: var(--font-display);
  font-size: clamp(1.2rem, 2vw, 1.7rem);
  font-weight: 600;
  letter-spacing: -0.03em;
}

.demo__badge {
  padding: 6px 12px;
  border-radius: 999px;
  border: 1px solid var(--line);
}


.demo__close {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 10px 16px;
  border: 1px solid var(--line);
  border-radius: 999px;
  transition:
    background-color 0.3s,
    color 0.3s;
}

.demo__close:hover {
  background: var(--ink);
  color: var(--bg);
}

.demo__body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: clamp(16px, 3vw, 40px) var(--pad);
}

.demo__notice {
  display: grid;
  gap: 8px;
  justify-items: start;
  max-width: 1500px;
  margin: 0 auto clamp(16px, 2.4vw, 32px);
  padding: clamp(14px, 1.6vw, 20px) clamp(16px, 2vw, 24px);
  border: 1px solid var(--accent);
  border-left-width: 4px;
  border-radius: 6px;
  background: color-mix(in srgb, var(--accent) 8%, transparent);
}

.demo__notice-title {
  font-family: var(--font-display);
  font-size: clamp(1.05rem, 1.5vw, 1.35rem);
  letter-spacing: -0.02em;
  line-height: 1.25;
}

.demo__notice-scope {
  color: var(--muted);
  font-size: 0.95rem;
  max-width: 80ch;
  text-wrap: pretty;
}

.demo-enter-active,
.demo-leave-active {
  transition:
    clip-path 0.7s var(--ease),
    opacity 0.3s;
}

.demo-enter-from,
.demo-leave-to {
  clip-path: inset(100% 0 0 0);
}

.demo-enter-to,
.demo-leave-from {
  clip-path: inset(0 0 0 0);
}

@media (max-width: 600px) {
  .demo__source {
    display: none;
  }
}
</style>
