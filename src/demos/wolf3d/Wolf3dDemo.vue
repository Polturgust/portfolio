<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { asset, closeDemo, copy } from '../../lib/state'
import { loadAssets, SOUNDS, type Assets } from './assets'
import { Game } from './game'
import { Input, loadLayout } from './input'
import { renderGame } from './render'
import '../demo.css'

const t = () => copy.value.demo.wolf3d

const canvas = ref<HTMLCanvasElement>()
const frame = ref<HTMLElement>()
const status = ref<'loading' | 'ready' | 'running' | 'error'>('loading')
const progress = ref(0)

let assets: Assets | undefined
let input: Input | undefined
let game: Game | undefined
let audio: AudioContext | undefined
let raf = 0
let last = 0

async function start() {
  if (!assets || !canvas.value || status.value !== 'ready') return
  status.value = 'running'
  audio = new AudioContext()
  const buffers: Record<string, AudioBuffer> = {}
  await Promise.all(
    SOUNDS.map(async (name) => {
      try {
        buffers[name] = await audio!.decodeAudioData(assets!.sounds[name].slice(0))
      } catch {
        /* a sound that cannot be decoded stays silent */
      }
    }),
  )
  input = new Input(canvas.value, () => (game ? new Set(Object.values(game.binds)) : new Set(['Space'])))
  game = new Game(assets, input, audio, buffers, () => closeDemo())
  game.playStart = performance.now() / 1000
  if (import.meta.env.DEV) Object.assign(window, { __wolf: { game } })
  document.addEventListener('pointerlockchange', onLockChange)
  last = performance.now()
  raf = requestAnimationFrame(loop)
}

function onLockChange() {
  if (!input?.locked()) game?.pointerReleased()
}

function loop(time: number) {
  const dt = (time - last) / 1000
  last = time
  const ctx = canvas.value?.getContext('2d')
  if (ctx && game) {
    game.step(dt)
    renderGame(game, ctx)
  }
  raf = requestAnimationFrame(loop)
}

function fullscreen() {
  if (document.fullscreenElement) document.exitFullscreen()
  else frame.value?.requestFullscreen?.()
}

onMounted(async () => {
  await loadLayout()
  try {
    assets = await loadAssets(asset('demos/wolf3d/'), (r) => (progress.value = Math.round(r * 100)))
    status.value = 'ready'
  } catch {
    status.value = 'error'
  }
})

onBeforeUnmount(() => {
  cancelAnimationFrame(raf)
  document.removeEventListener('pointerlockchange', onLockChange)
  game?.destroy()
  input?.destroy()
  audio?.close()
  if (document.fullscreenElement) document.exitFullscreen()
})
</script>

<template>
  <div class="lab wolf">
    <div class="wolf__main">
      <div ref="frame" class="wolf__frame">
        <canvas ref="canvas" class="wolf__canvas" width="1600" height="900" role="img" :aria-label="t().canvasAlt" />
        <button v-if="status !== 'running'" class="wolf__start" type="button" :disabled="status !== 'ready'" @click="start">
          <span v-if="status === 'loading'" class="mono">{{ t().loading }} {{ progress }}%</span>
          <span v-else-if="status === 'ready'" class="wolf__play">▶ {{ t().start }}</span>
          <span v-else>{{ copy.demo.failed }}</span>
        </button>
      </div>
      <div class="lab__buttons">
        <button class="lab__btn" type="button" @click="fullscreen">{{ t().fullscreen }}</button>
      </div>
    </div>

    <div class="lab__panel">
      <p class="lab__note">{{ t().note }}</p>
      <p class="mono lab__label">{{ t().controlsTitle }}</p>
      <dl class="wolf__keys">
        <template v-for="row in t().controls" :key="row[0]">
          <dt class="mono">{{ row[0] }}</dt>
          <dd>{{ row[1] }}</dd>
        </template>
      </dl>
      <p class="lab__note">{{ t().goal }}</p>
    </div>
  </div>
</template>

<style scoped>
.wolf {
  grid-template-columns: minmax(0, 1fr) minmax(240px, 300px);
}

.wolf__main {
  display: grid;
  gap: 12px;
  min-width: 0;
}

.wolf__frame {
  position: relative;
  background: #000;
  border-radius: 6px;
  overflow: hidden;
  display: grid;
  place-items: center;
}

.wolf__frame:fullscreen .wolf__canvas {
  width: 100vw;
  height: 100vh;
  object-fit: contain;
}

.wolf__canvas {
  width: 100%;
  height: auto;
  aspect-ratio: 16 / 9;
  cursor: crosshair;
}

.wolf__start {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  color: #fff;
  background: rgba(0, 0, 0, 0.7);
  font-size: 1.2rem;
}

.wolf__play {
  padding: 14px 26px;
  border-radius: 999px;
  background: var(--accent);
  color: var(--accent-ink);
}

.wolf__keys {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 6px 14px;
  margin: 0;
  font-size: 0.9rem;
}

.wolf__keys dt {
  white-space: nowrap;
}

.wolf__keys dd {
  margin: 0;
  color: var(--muted);
}
</style>
