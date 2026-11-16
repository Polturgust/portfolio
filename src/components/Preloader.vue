<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { gsap, reducedMotion } from '../lib/motion'

const emit = defineEmits<{ done: [] }>()

const visible = ref(true)
const count = ref(0)
const root = ref<HTMLElement>()

onMounted(() => {
  if (reducedMotion) {
    visible.value = false
    emit('done')
    return
  }

  const state = { value: 0 }
  const tl = gsap.timeline()

  tl.from('.pre__name span', { yPercent: 110, duration: 0.9, ease: 'expo.out', stagger: 0.08 })
    .to(
      state,
      {
        value: 100,
        duration: 1.5,
        ease: 'power2.inOut',
        onUpdate: () => {
          count.value = Math.round(state.value)
        },
      },
      0,
    )
    .to('.pre__bar', { scaleX: 1, duration: 1.5, ease: 'power2.inOut' }, 0)
    .to('.pre__inner', { yPercent: -30, autoAlpha: 0, duration: 0.6, ease: 'power3.in' }, '+=0.15')
    .add(() => emit('done'))
    .to(root.value!, { yPercent: -100, duration: 1.1, ease: 'expo.inOut' }, '<')
    .add(() => {
      visible.value = false
    })
})
</script>

<template>
  <div v-if="visible" ref="root" class="pre" aria-hidden="true">
    <div class="pre__inner">
      <p class="pre__name">
        <span>Florent</span>
        <span><b>Serra</b></span>
      </p>
      <p class="pre__count mono">{{ String(count).padStart(3, '0') }}</p>
    </div>
    <div class="pre__bar" />
  </div>
</template>

<style scoped>
.pre {
  position: fixed;
  inset: 0;
  z-index: 100;
  background: var(--ink);
  color: var(--bg);
  display: flex;
  align-items: flex-end;
  padding: var(--pad);
}

.pre__inner {
  width: 100%;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;
}

.pre__name {
  display: flex;
  flex-wrap: wrap;
  gap: 0 0.25em;
  overflow: hidden;
  font-family: var(--font-display);
  font-size: clamp(2.4rem, 8vw, 7rem);
  font-weight: 300;
  line-height: 1;
  letter-spacing: -0.04em;
  padding-bottom: 0.1em;
}

.pre__name span {
  display: inline-block;
}

.pre__name b {
  font-weight: 700;
}

.pre__count {
  font-size: 0.9rem;
  padding-bottom: 0.9em;
  font-variant-numeric: tabular-nums;
}

.pre__bar {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 3px;
  background: var(--accent);
  transform: scaleX(0);
  transform-origin: left center;
}
</style>
