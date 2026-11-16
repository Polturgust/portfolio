<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { asset, copy } from '../../lib/state'
import { finePointer } from '../../lib/motion'
import { randomMap } from './map'
import type { Grid } from './map'
import { isWall, render, renderMinimap, renderOverview, spawn, tileAt } from './engine'
import type { Player, Textures } from './engine'
import '../demo.css'

const t = () => copy.value.demo.wolf3d

const view = ref<HTMLCanvasElement>()
const overview = ref<HTMLCanvasElement>()
const rooms = ref(1)
const failed = ref(false)

let map: Grid = randomMap()
let player: Player = spawn()
let textures: Textures | undefined
let frame = 0
let last = 0
const held = new Set<string>()

const keys: Record<string, string> = {
  KeyW: 'front', KeyZ: 'front', ArrowUp: 'front',
  KeyS: 'back', ArrowDown: 'back',
  KeyA: 'left', KeyQ: 'left',
  KeyD: 'right',
  ArrowLeft: 'turnLeft', ArrowRight: 'turnRight',
}

function newMap(next = false) {
  map = randomMap()
  player = spawn()
  rooms.value = next ? rooms.value + 1 : 1
}

function loadImage(name: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = reject
    image.src = asset(`demos/wolf3d/${name}.webp`)
  })
}

// update_player(): same speeds as the game, which runs at 60 frames per second.
function update(dt: number) {
  const step = player.speed * dt * 60
  let x = player.x
  let y = player.y
  if (held.has('front')) {
    x += Math.cos(player.angle) * step
    y += Math.sin(player.angle) * step
  }
  if (held.has('back')) {
    x -= Math.cos(player.angle) * step
    y -= Math.sin(player.angle) * step
  }
  if (held.has('left')) {
    x += (Math.cos(player.angle - Math.PI / 2) * step) / 1.5
    y += (Math.sin(player.angle - Math.PI / 2) * step) / 1.5
  }
  if (held.has('right')) {
    x += (Math.cos(player.angle + Math.PI / 2) * step) / 1.5
    y += (Math.sin(player.angle + Math.PI / 2) * step) / 1.5
  }
  if (held.has('turnLeft')) player.angle -= 2.4 * dt
  if (held.has('turnRight')) player.angle += 2.4 * dt

  if (!isWall(map, x, y)) {
    player.x = x
    player.y = y
  } else if (tileAt(map, x, y) === '3') {
    newMap(true) // the door leads to the next generated room
  }
  player.angle %= 2 * Math.PI
  if (player.angle < 0) player.angle += 2 * Math.PI
}

function loop(now: number) {
  const dt = Math.min(0.05, (now - last) / 1000)
  last = now
  update(dt)
  const ctx = view.value?.getContext('2d')
  const mini = overview.value?.getContext('2d')
  if (ctx && textures) {
    render(ctx, map, player, textures)
    renderMinimap(ctx, map, player, 62)
  }
  if (mini) renderOverview(mini, map, player)
  frame = requestAnimationFrame(loop)
}

function onKey(event: KeyboardEvent) {
  const action = keys[event.code]
  if (!action) return
  // let typing and native controls keep their keys
  if (event.target instanceof Element && event.target.closest('input, select, textarea')) return
  event.preventDefault()
  if (event.type === 'keydown') held.add(action)
  else held.delete(action)
}

function onMouse(event: MouseEvent) {
  if (document.pointerLockElement === view.value) player.angle += event.movementX * 0.0025
}

function lock() {
  if (finePointer) view.value?.requestPointerLock?.()
}

const press = (action: string) => held.add(action)
const release = (action: string) => held.delete(action)

onMounted(async () => {
  try {
    const [wall, wall2, door] = await Promise.all(['wall_1', 'wall_2', 'door_closed'].map(loadImage))
    textures = { wall, wall2, door }
  } catch {
    failed.value = true
    return
  }
  window.addEventListener('keydown', onKey)
  window.addEventListener('keyup', onKey)
  document.addEventListener('mousemove', onMouse)
  last = performance.now()
  frame = requestAnimationFrame(loop)
})

onBeforeUnmount(() => {
  cancelAnimationFrame(frame)
  window.removeEventListener('keydown', onKey)
  window.removeEventListener('keyup', onKey)
  document.removeEventListener('mousemove', onMouse)
  if (document.pointerLockElement) document.exitPointerLock()
})
</script>

<template>
  <div class="lab">
    <div class="wolf__main">
      <div class="lab__stage wolf__stage">
        <canvas
          ref="view"
          class="wolf__view"
          width="800"
          height="450"
          role="img"
          :aria-label="t().canvasAlt"
          @click="lock"
        />
      </div>

      <div class="wolf__pad">
        <button
          v-for="control in [
            { action: 'turnLeft', label: '⟲' },
            { action: 'front', label: '▲' },
            { action: 'back', label: '▼' },
            { action: 'turnRight', label: '⟳' },
          ]"
          :key="control.action"
          class="lab__btn wolf__key"
          type="button"
          :aria-label="control.action"
          @pointerdown.prevent="press(control.action)"
          @pointerup="release(control.action)"
          @pointerleave="release(control.action)"
          @pointercancel="release(control.action)"
        >
          {{ control.label }}
        </button>
      </div>
    </div>

    <div class="lab__panel">
      <p class="lab__note">{{ t().note }}</p>
      <p v-if="failed" class="lab__error">{{ copy.demo.failed }}</p>
      <p class="lab__note">{{ finePointer ? t().controls : t().touch }}</p>

      <canvas ref="overview" class="wolf__overview" width="300" height="300" aria-hidden="true" />
      <p class="mono lab__label">
        <span>{{ t().room }} {{ rooms }}</span>
        <span>{{ t().legend }}</span>
      </p>

      <div class="lab__buttons">
        <button class="lab__btn lab__btn--primary" type="button" @click="newMap(false)">{{ t().newMap }}</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.wolf__main {
  display: grid;
  gap: 14px;
}

.wolf__stage {
  min-height: 0;
  background: #000;
}

.wolf__view {
  width: 100%;
  height: auto;
  cursor: crosshair;
  image-rendering: pixelated;
}

.wolf__pad {
  display: flex;
  justify-content: center;
  gap: 10px;
}

.wolf__key {
  min-width: 56px;
  min-height: 48px;
  touch-action: none;
  user-select: none;
}

.wolf__overview {
  width: 100%;
  max-width: 300px;
  height: auto;
  border-radius: 6px;
  image-rendering: pixelated;
}
</style>
