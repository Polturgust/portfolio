<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { asset, copy } from '../../lib/state'
import type { Request, Response } from './worker'
import '../demo.css'

const t = () => copy.value.demo.polaroid

const intensity = ref(100)
const fade = ref(100)
const leaks = ref(35)
const seed = ref(1)

const status = ref<'starting' | 'rendering' | 'idle' | 'error'>('starting')
const error = ref('')
const result = ref('')
const ms = ref(0)

let worker: Worker | undefined
let hasPhoto = false
let renderId = 0
let pending = false
let busy = false

const send = (message: Request, transfer: Transferable[] = []) => worker?.postMessage(message, transfer)

/** A small sunset drawn on a canvas, so the demo works before any photo is chosen. */
async function sampleScene(): Promise<ArrayBuffer> {
  const size = 900
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const ctx = canvas.getContext('2d')!
  const sky = ctx.createLinearGradient(0, 0, 0, size)
  sky.addColorStop(0, '#17355e')
  sky.addColorStop(0.45, '#d9705a')
  sky.addColorStop(0.62, '#f6c66f')
  sky.addColorStop(0.63, '#1f5f7a')
  sky.addColorStop(1, '#0c2233')
  ctx.fillStyle = sky
  ctx.fillRect(0, 0, size, size)
  ctx.fillStyle = '#fff3c4'
  ctx.beginPath()
  ctx.arc(size * 0.62, size * 0.52, size * 0.09, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#122a3a'
  ctx.beginPath()
  ctx.moveTo(0, size * 0.63)
  for (let x = 0; x <= size; x += 10) {
    ctx.lineTo(x, size * 0.63 - 60 * Math.max(0, Math.sin(x / 120)) - 25 * Math.sin(x / 37))
  }
  ctx.lineTo(size, size * 0.63)
  ctx.fill()
  ctx.fillStyle = 'rgba(255, 220, 150, 0.35)'
  for (let i = 0; i < 26; i++) {
    const y = size * 0.66 + i * 12
    ctx.fillRect(size * 0.62 - (140 - i * 4), y, (140 - i * 4) * 2, 3)
  }
  const blob = await new Promise<Blob>((resolve) => canvas.toBlob((b) => resolve(b!), 'image/jpeg', 0.92))
  return blob.arrayBuffer()
}

function requestRender() {
  if (!hasPhoto) return
  if (busy) {
    pending = true
    return
  }
  busy = true
  status.value = 'rendering'
  send({
    type: 'render',
    id: ++renderId,
    intensity: intensity.value / 100,
    fade: fade.value / 100,
    leaks: leaks.value / 100,
    seed: seed.value,
    size: 720,
  })
}

async function load(bytes: ArrayBuffer) {
  status.value = 'rendering'
  send({ type: 'load', bytes }, [bytes])
}

async function onFile(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (file) load(await file.arrayBuffer())
}

function reroll() {
  seed.value = Math.floor(Math.random() * 0x7fffffff)
}

onMounted(() => {
  worker = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' })
  worker.onmessage = async (event: MessageEvent<Response>) => {
    const msg = event.data
    if (msg.type === 'ready') {
      load(await sampleScene())
    } else if (msg.type === 'loaded') {
      hasPhoto = true
      requestRender()
    } else if (msg.type === 'rendered') {
      busy = false
      if (result.value) URL.revokeObjectURL(result.value)
      result.value = URL.createObjectURL(new Blob([msg.bytes], { type: 'image/jpeg' }))
      ms.value = Math.round(msg.ms)
      status.value = 'idle'
      if (pending) {
        pending = false
        requestRender()
      }
    } else {
      busy = false
      status.value = 'error'
      error.value = msg.message
    }
  }
  worker.onerror = () => {
    status.value = 'error'
  }
  send({ type: 'init', renderUrl: new URL(asset('demos/polaroid/render.py'), location.href).href })
})

watch([intensity, fade, leaks, seed], requestRender)

onBeforeUnmount(() => {
  worker?.terminate()
  if (result.value) URL.revokeObjectURL(result.value)
})
</script>

<template>
  <div class="lab">
    <div class="lab__stage polaroid__stage" aria-live="polite">
      <img v-if="result" class="polaroid__card" :src="result" :alt="t().resultAlt" />
      <p v-if="status === 'starting'" class="polaroid__boot">
        {{ t().starting }}<br /><span class="muted">{{ t().firstLoad }}</span>
      </p>
      <span v-if="status === 'rendering'" class="lab__status mono">{{ t().rendering }}</span>
      <span v-else-if="status === 'idle'" class="lab__status mono">render.py · {{ ms }} ms</span>
    </div>

    <div class="lab__panel">
      <p class="lab__note">{{ t().note }}</p>
      <p v-if="status === 'error'" class="lab__error">{{ copy.demo.failed }} {{ error }}</p>

      <div class="lab__buttons">
        <label class="lab__btn lab__btn--primary">
          {{ t().choose }}
          <input class="sr-only" type="file" accept="image/*" :disabled="status === 'starting'" @change="onFile" />
        </label>
      </div>

      <div class="lab__field">
        <label class="mono" for="pf-intensity"><span>{{ t().intensity }}</span><span>{{ intensity }}%</span></label>
        <input id="pf-intensity" v-model.number="intensity" type="range" min="0" max="100" />
      </div>
      <div class="lab__field">
        <label class="mono" for="pf-fade"><span>{{ t().fade }}</span><span>{{ fade }}%</span></label>
        <input id="pf-fade" v-model.number="fade" type="range" min="0" max="100" />
      </div>
      <div class="lab__field">
        <label class="mono" for="pf-leaks"><span>{{ t().leaks }}</span><span>{{ leaks }}%</span></label>
        <input id="pf-leaks" v-model.number="leaks" type="range" min="0" max="100" />
      </div>

      <div class="lab__buttons">
        <button class="lab__btn" type="button" :disabled="status === 'starting'" @click="reroll">
          {{ t().reroll }}
        </button>
        <a v-if="result" class="lab__btn" :href="result" download="polaroid.jpg">{{ t().download }} ↓</a>
      </div>
    </div>
  </div>
</template>

<style scoped>
.polaroid__stage {
  padding: clamp(16px, 3vw, 40px);
  min-height: min(70vh, 720px);
}

.polaroid__card {
  max-height: min(70vh, 720px);
  width: auto;
  box-shadow: 0 18px 50px rgba(0, 0, 0, 0.28);
  rotate: -1.5deg;
}

.polaroid__boot {
  text-align: center;
  line-height: 1.6;
}
</style>
