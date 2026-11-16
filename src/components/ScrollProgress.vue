<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { gsap } from '../lib/motion'

const bar = ref<HTMLElement>()
let ctx: gsap.Context | undefined

onMounted(() => {
  ctx = gsap.context(() => {
    gsap.to(bar.value!, {
      scaleX: 1,
      ease: 'none',
      scrollTrigger: { start: 0, end: 'max', scrub: 0.3 },
    })
  })
})

onBeforeUnmount(() => ctx?.revert())
</script>

<template>
  <div ref="bar" class="progress" aria-hidden="true" />
</template>

<style scoped>
.progress {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  z-index: 60;
  background: var(--accent);
  transform: scaleX(0);
  transform-origin: left center;
}
</style>
