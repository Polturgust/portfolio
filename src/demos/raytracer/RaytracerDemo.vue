<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { asset, copy, locale } from '../../lib/state'
import { scenes } from './scenes'
import type { Request, Response } from './worker'
import '../demo.css'

const t = () => copy.value.demo.raytracer

const sizes = [
  { label: '480 × 270', width: 480, height: 270 },
  { label: '800 × 450', width: 800, height: 450 },
  { label: '1280 × 720', width: 1280, height: 720 },
]

const sceneId = ref(scenes[0].id)
const sizeIndex = ref(1)
const text = ref(scenes[0].text)
const canvas = ref<HTMLCanvasElement>()

const status = ref<'starting' | 'rendering' | 'done' | 'error'>('starting')
const progress = ref(0)
const info = ref('')
const error = ref('')

let worker: Worker | undefined
let job = 0
let height = 0

const send = (message: Request) => worker?.postMessage(message)

function render() {
  if (!worker || status.value === 'starting') return
  const size = sizes[sizeIndex.value]
  error.value = ''
  progress.value = 0
  status.value = 'rendering'
  send({ type: 'render', job: ++job, scene: text.value, width: size.width, height: size.height })
}

onMounted(() => {
  worker = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' })
  worker.onmessage = (event: MessageEvent<Response>) => {
    const msg = event.data
    if (msg.type === 'ready') {
      status.value = 'done'
      render()
      return
    }
    if (msg.job !== job) return
    const el = canvas.value
    if (msg.type === 'start' && el) {
      el.width = msg.width
      el.height = height = msg.height
      info.value = `${msg.width} × ${msg.height} · ${msg.objects} obj · ${msg.lights} lights`
    } else if (msg.type === 'rows' && el) {
      const image = new ImageData(new Uint8ClampedArray(msg.pixels), el.width, msg.rows)
      el.getContext('2d')!.putImageData(image, 0, msg.y)
      progress.value = Math.round(((msg.y + msg.rows) / height) * 100)
    } else if (msg.type === 'done') {
      status.value = 'done'
      info.value += ` · ${(msg.ms / 1000).toLocaleString(locale.value, { maximumFractionDigits: 2 })} s`
    } else if (msg.type === 'error') {
      status.value = 'error'
      error.value = msg.message
    }
  }
  worker.onerror = () => {
    status.value = 'error'
    error.value = copy.value.demo.failed
  }
  send({ type: 'init', baseUrl: new URL(asset('demos/raytracer/'), location.href).href })
})

watch(sceneId, (id) => {
  text.value = scenes.find((scene) => scene.id === id)!.text
  render()
})
watch(sizeIndex, render)

onBeforeUnmount(() => worker?.terminate())
</script>

<template>
  <div class="lab">
    <div class="rt__main">
      <div class="lab__stage rt__stage">
        <canvas ref="canvas" class="rt__canvas" width="800" height="450" role="img" :aria-label="t().canvasAlt" />
      </div>
      <p class="mono rt__status" aria-live="polite">
        <template v-if="status === 'rendering'">{{ t().rendering }} {{ progress }}%</template>
        <template v-else-if="status === 'done' && info">{{ t().done }} {{ info }}</template>
        <template v-else>&nbsp;</template>
      </p>
    </div>

    <div class="lab__panel">
      <p class="lab__note">{{ t().note }}</p>

      <div class="lab__field">
        <label class="mono" for="rt-scene">{{ t().scene }}</label>
        <select id="rt-scene" v-model="sceneId">
          <option v-for="scene in scenes" :key="scene.id" :value="scene.id">{{ scene.name[locale] }}</option>
        </select>
      </div>

      <div class="lab__field">
        <label class="mono" for="rt-size">{{ t().size }}</label>
        <select id="rt-size" v-model.number="sizeIndex">
          <option v-for="(size, i) in sizes" :key="size.label" :value="i">{{ size.label }}</option>
        </select>
      </div>

      <div class="lab__field">
        <label class="mono" for="rt-text">{{ t().edit }}</label>
        <textarea id="rt-text" v-model="text" rows="12" spellcheck="false" />
      </div>

      <p v-if="status === 'error'" class="lab__error" role="alert">{{ error }}</p>

      <div class="lab__buttons">
        <button class="lab__btn lab__btn--primary" type="button" :disabled="status === 'starting'" @click="render">
          {{ t().render }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.rt__stage {
  min-height: 0;
  background: #000;
}

.rt__main {
  display: grid;
  gap: 12px;
}

.rt__status {
  color: var(--muted);
}

.rt__canvas {
  width: 100%;
  height: auto;
}
</style>
