<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { marquee } from '../data/projects'
import { ScrollTrigger, gsap, reducedMotion } from '../lib/motion'

const track = ref<HTMLElement>()
let ctx: gsap.Context | undefined

onMounted(() => {
  if (reducedMotion || !track.value) return
  ctx = gsap.context(() => {
    const loop = gsap.to(track.value!, { xPercent: -50, duration: 38, ease: 'none', repeat: -1 })
    const speed = { value: 1 }
    const apply = () => loop.timeScale(speed.value)

    // scrolling pushes the strip faster, and backwards when scrolling up
    ScrollTrigger.create({
      onUpdate(self) {
        const velocity = self.getVelocity()
        const dir = velocity < 0 ? -1 : 1
        speed.value = dir * (1 + Math.min(Math.abs(velocity) / 250, 7))
        apply()
        gsap.to(speed, { value: dir, duration: 0.9, ease: 'power2.out', overwrite: true, onUpdate: apply })
      },
    })
  })
})

onBeforeUnmount(() => ctx?.revert())
</script>

<template>
  <div class="marquee" aria-hidden="true">
    <div ref="track" class="marquee__track">
      <ul v-for="n in 2" :key="n" class="marquee__group">
        <li v-for="item in marquee" :key="item">{{ item }}<span class="marquee__star">✳</span></li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.marquee {
  overflow: hidden;
  border-block: 1px solid var(--line);
  padding-block: clamp(14px, 2vw, 26px);
}

.marquee__track {
  display: flex;
  width: max-content;
  will-change: transform;
}

.marquee__group {
  display: flex;
  flex: none;
}

.marquee__group li {
  display: flex;
  align-items: center;
  font-family: var(--font-display);
  font-size: clamp(1.6rem, 4.2vw, 4rem);
  font-weight: 500;
  letter-spacing: -0.03em;
  line-height: 1;
  white-space: nowrap;
}

.marquee__star {
  color: var(--accent);
  font-size: 0.5em;
  margin-inline: clamp(18px, 2.4vw, 40px);
}

@media (prefers-reduced-motion: reduce) {
  .marquee__track {
    flex-wrap: wrap;
    width: auto;
  }
  .marquee__group:last-child {
    display: none;
  }
  .marquee__group {
    flex-wrap: wrap;
    padding-inline: var(--pad);
  }
}
</style>
