<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import type { Media } from '../data/projects'
import { asset } from '../lib/state'
import { gsap, reducedMotion } from '../lib/motion'

const props = defineProps<{ media: Media; alt: string }>()

const video = ref<HTMLVideoElement>()
const terminal = ref<HTMLElement>()
let io: IntersectionObserver | undefined
let ctx: gsap.Context | undefined

const session = [
  { prompt: '$', text: './myteams_server 4242' },
  { prompt: '$', text: './myteams_cli 127.0.0.1 4242' },
  { prompt: '>', text: '/login "flo"' },
  { prompt: '>', text: '/help' },
]

onMounted(() => {
  if (props.media.kind === 'video' && video.value && !reducedMotion) {
    const el = video.value
    io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) el.play().catch(() => {})
      else el.pause()
    })
    io.observe(el)
  }

  if (props.media.kind === 'terminal' && terminal.value && !reducedMotion) {
    ctx = gsap.context(() => {
      gsap.from('.term__line', {
        autoAlpha: 0,
        x: -12,
        duration: 0.5,
        ease: 'power2.out',
        stagger: 0.45,
        scrollTrigger: { trigger: terminal.value, start: 'top 75%', once: true },
      })
    }, terminal.value)
  }
})

onBeforeUnmount(() => {
  io?.disconnect()
  ctx?.revert()
})
</script>

<template>
  <img
    v-if="media.kind === 'image'"
    v-parallax="7"
    class="media media--drift"
    :src="asset(media.src)"
    :alt="alt"
    :width="media.width"
    :height="media.height"
    loading="lazy"
    decoding="async"
  />

  <video
    v-else-if="media.kind === 'video'"
    ref="video"
    class="media media--pixel"
    :poster="asset(media.poster)"
    :width="media.width"
    :height="media.height"
    :aria-label="alt"
    :controls="reducedMotion"
    muted
    loop
    playsinline
    preload="none"
  >
    <source :src="asset(media.src)" type="video/mp4" />
  </video>

  <div v-else ref="terminal" class="term" role="img" :aria-label="alt">
    <div class="term__bar"><span /><span /><span /><em class="mono">myteams</em></div>
    <ol class="term__body">
      <li v-for="line in session" :key="line.text" class="term__line">
        <span class="term__prompt">{{ line.prompt }}</span>{{ line.text }}
      </li>
      <li class="term__line"><span class="term__prompt">&gt;</span><span class="term__caret" /></li>
    </ol>
  </div>
</template>

<style scoped>
.media {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.media--drift {
  scale: 1.16;
}

.media--pixel {
  image-rendering: pixelated;
}

.term {
  width: 100%;
  height: 100%;
  background: #0f1114;
  color: #e6e4de;
  display: flex;
  flex-direction: column;
}

.term__bar {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 14px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.term__bar span {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.22);
}

.term__bar em {
  margin-left: auto;
  font-style: normal;
  opacity: 0.5;
}

.term__body {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 0.7em;
  padding: clamp(20px, 4vw, 56px);
  font-family: var(--font-mono);
  font-size: clamp(0.8rem, 1.45vw, 1.25rem);
}

.term__prompt {
  color: #3aa6f2;
  margin-right: 0.9em;
}

.term__caret {
  display: inline-block;
  width: 0.6em;
  height: 1.1em;
  background: currentColor;
  vertical-align: text-bottom;
  animation: blink 1.1s steps(1) infinite;
}

@keyframes blink {
  50% {
    opacity: 0;
  }
}
</style>
