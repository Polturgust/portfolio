<script setup lang="ts">
import { defineAsyncComponent, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { copy, ready } from '../lib/state'
import { SplitText, gsap, reducedMotion } from '../lib/motion'

const HeroCanvas = defineAsyncComponent(() => import('./HeroCanvas.vue'))

const root = ref<HTMLElement>()
let ctx: gsap.Context | undefined
let stop: (() => void) | undefined

function intro() {
  if (reducedMotion || !root.value) return
  ctx = gsap.context(() => {
    const split = SplitText.create('.hero__name-line', { type: 'chars', mask: 'chars', charsClass: 'char' })
    const tl = gsap.timeline({ defaults: { ease: 'expo.out' } })
    tl.from(split.chars, { yPercent: 115, duration: 1.3, stagger: 0.035 })
      .from('.hero__orb', { scale: 0.6, autoAlpha: 0, duration: 1.8 }, 0.1)
      .from('.hero__top > *', { y: 16, autoAlpha: 0, duration: 0.9, stagger: 0.08 }, 0.5)
      .from('.hero__bottom > *', { y: 28, autoAlpha: 0, duration: 1, stagger: 0.1 }, 0.6)

    // the name drifts apart and the object sinks as the hero scrolls away
    gsap.to('.hero__name-line--first', {
      xPercent: -6,
      ease: 'none',
      scrollTrigger: { trigger: root.value, start: 'top top', end: 'bottom top', scrub: true },
    })
    gsap.to('.hero__name-line--last', {
      xPercent: 6,
      ease: 'none',
      scrollTrigger: { trigger: root.value, start: 'top top', end: 'bottom top', scrub: true },
    })
    gsap.to('.hero__orb-inner', {
      yPercent: 22,
      ease: 'none',
      scrollTrigger: { trigger: root.value, start: 'top top', end: 'bottom top', scrub: true },
    })
  }, root.value)
}

onMounted(() => {
  if (ready.value) intro()
  else stop = watch(ready, (value) => value && intro())
})

onBeforeUnmount(() => {
  stop?.()
  ctx?.revert()
})
</script>

<template>
  <section id="top" ref="root" class="hero wrap" :class="{ 'is-waiting': !ready }">
    <div class="hero__top mono">
      <span>{{ copy.hero.kicker }}</span>
      <span class="muted">{{ copy.hero.place }} — 43.70° N, 7.27° E</span>
    </div>

    <div class="hero__orb">
      <div class="hero__orb-inner"><HeroCanvas /></div>
    </div>

    <h1 class="hero__name" aria-label="Florent Serra">
      <span class="hero__name-line hero__name-line--first" aria-hidden="true">Florent</span>
      <span class="hero__name-line hero__name-line--last" aria-hidden="true">Serra</span>
    </h1>

    <div class="hero__bottom">
      <div class="hero__intro">
        <p class="mono hero__role">{{ copy.hero.role }}</p>
        <p class="hero__tagline">{{ copy.hero.tagline }}</p>
      </div>
      <a class="hero__pill mono" href="#contact" v-magnetic="0.2">
        <span class="hero__pulse" />
        {{ copy.hero.availability }}
      </a>
      <a class="hero__scroll mono" href="#about">
        {{ copy.hero.scroll }}
        <span class="hero__scroll-line" />
      </a>
    </div>
  </section>
</template>

<style scoped>
.hero {
  position: relative;
  min-height: 100svh;
  display: flex;
  flex-direction: column;
  padding-top: 96px;
  padding-bottom: clamp(24px, 3vw, 44px);
  overflow: hidden;
}

.hero.is-waiting > * {
  visibility: hidden;
}

.hero__top {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.hero__orb {
  position: absolute;
  top: 50%;
  right: -4vw;
  width: min(72vw, 100svh);
  aspect-ratio: 1;
  translate: 0 -54%;
  pointer-events: none;
}

.hero__orb-inner {
  width: 100%;
  height: 100%;
}

.hero__name {
  position: relative;
  margin-block: auto;
  padding-block: clamp(24px, 4vw, 56px);
  font-family: var(--font-display);
  font-size: clamp(4.2rem, 19.5vw, 24rem);
  line-height: 0.8;
  letter-spacing: -0.055em;
  display: flex;
  flex-direction: column;
}

.hero__name-line {
  display: block;
  white-space: nowrap;
  will-change: transform;
}

.hero__name-line--first {
  font-weight: 300;
}

.hero__name-line--last {
  font-weight: 800;
  text-transform: uppercase;
  align-self: flex-start;
  margin-left: 0.6em;
}

.hero__bottom {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 34rem) 1fr auto;
  align-items: end;
  gap: clamp(20px, 4vw, 64px);
  padding-top: 20px;
  border-top: 1px solid var(--line);
}

.hero__role {
  color: var(--accent);
  margin-bottom: 12px;
}

.hero__tagline {
  font-size: clamp(1.05rem, 1.5vw, 1.45rem);
  line-height: 1.35;
  letter-spacing: -0.01em;
  text-wrap: pretty;
}

.hero__pill {
  justify-self: start;
  display: inline-flex;
  align-items: center;
  gap: 12px;
  padding: 14px 20px;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: color-mix(in srgb, var(--bg) 70%, transparent);
  backdrop-filter: blur(8px);
  transition:
    background-color 0.4s var(--ease),
    color 0.4s var(--ease),
    border-color 0.4s var(--ease);
}

.hero__pill:hover {
  background: var(--ink);
  color: var(--bg);
  border-color: var(--ink);
}

.hero__pulse {
  position: relative;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #2fbf71;
  flex: none;
}

.hero__pulse::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: inherit;
  animation: pulse 2s ease-out infinite;
}

@keyframes pulse {
  to {
    transform: scale(3.4);
    opacity: 0;
  }
}

.hero__scroll {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  writing-mode: vertical-rl;
}

.hero__scroll-line {
  width: 1px;
  height: 56px;
  background: var(--line);
  position: relative;
  overflow: hidden;
}

.hero__scroll-line::after {
  content: '';
  position: absolute;
  inset: 0;
  background: var(--ink);
  animation: drop 2s var(--ease) infinite;
}

@keyframes drop {
  0% {
    transform: translateY(-100%);
  }
  100% {
    transform: translateY(100%);
  }
}

@media (max-width: 900px) {
  .hero__orb {
    width: 116vw;
    right: -30vw;
    translate: 0 -62%;
  }
  .hero__name-line--last {
    margin-left: 0;
  }
  .hero__bottom {
    grid-template-columns: 1fr;
    align-items: start;
  }
  .hero__scroll {
    display: none;
  }
}
</style>
