// Port of src/raycasting.c from Wolf3D: the same ray marching, projection,
// texture mapping and distance shading, drawn on a 2D canvas instead of CSFML.

import type { Grid } from './map'

export const TILE_SIZE = 64
export const RAY_NBR = 400
const PI = Math.PI

export interface Player {
  x: number
  y: number
  angle: number
  speed: number
  fov: number
}

export interface Textures {
  wall: HTMLImageElement
  wall2: HTMLImageElement
  door: HTMLImageElement
}

interface RayHit {
  distance: number
  hitX: number
  hitY: number
  vertical: boolean
  tile: string
}

export function spawn(): Player {
  // init_player() and reset_values()
  return { x: 1.5 * TILE_SIZE, y: 1.5 * TILE_SIZE, angle: PI / 4, speed: 4, fov: PI / 2.4 }
}

export function tileAt(map: Grid, x: number, y: number): string {
  const tx = Math.trunc(x / TILE_SIZE)
  const ty = Math.trunc(y / TILE_SIZE)
  if (tx < 0 || ty < 0 || ty >= map.length || tx >= map[0].length) return '1'
  return map[ty][tx]
}

export function isWall(map: Grid, x: number, y: number): boolean {
  return tileAt(map, Math.trunc(x), Math.trunc(y)) !== '0'
}

function castSingleRay(map: Grid, player: Player, rayAngle: number): RayHit {
  const angle = rayAngle % (2 * PI)
  const dx = Math.cos(angle) * 0.1
  const dy = Math.sin(angle) * 0.1
  let x = player.x
  let y = player.y
  let dist = 0
  while (dist < 1500) {
    x += dx
    y += dy
    dist += 0.1
    if (isWall(map, x, y)) {
      return {
        distance: dist * Math.cos(player.angle - angle),
        hitX: x,
        hitY: y,
        vertical: Math.abs((x % TILE_SIZE) - TILE_SIZE / 2) > Math.abs((y % TILE_SIZE) - TILE_SIZE / 2),
        tile: tileAt(map, x, y),
      }
    }
  }
  return { distance: 1500, hitX: x, hitY: y, vertical: false, tile: '1' }
}

function chooseTexture(textures: Textures, tile: string): HTMLImageElement {
  if (tile === '2') return textures.wall2
  if (tile === '3' || tile === '4') return textures.door
  return textures.wall
}

export function render(ctx: CanvasRenderingContext2D, map: Grid, player: Player, textures: Textures) {
  const { width, height } = ctx.canvas

  // render_before_raycasting(): flat ceiling and floor
  ctx.fillStyle = 'rgb(72, 13, 28)'
  ctx.fillRect(0, 0, width, height / 2)
  ctx.fillStyle = 'rgb(38, 8, 21)'
  ctx.fillRect(0, height / 2, width, height / 2)

  const fov = player.fov
  const projection = width / 3 / Math.tan(fov / 2)
  const columnWidth = width / RAY_NBR

  for (let i = 0; i < RAY_NBR; i++) {
    const angle = player.angle - fov / 2 + i * (fov / RAY_NBR)
    const hit = castSingleRay(map, player, angle)
    const h = (TILE_SIZE / hit.distance) * projection
    const offset = hit.vertical ? hit.hitY % TILE_SIZE : hit.hitX % TILE_SIZE
    const texture = chooseTexture(textures, hit.tile)
    const texX = Math.min(texture.width - 1, Math.floor((offset / TILE_SIZE) * texture.width))
    const texWidth = Math.max(1, (columnWidth / width) * texture.width)
    const top = height / 2 - h / 2

    ctx.drawImage(texture, texX, 0, texWidth, texture.height, i * columnWidth, top, columnWidth + 0.5, h)

    // get_wall_color(): walls fade with distance
    const shade = 1 / (1 + hit.distance * 0.006)
    ctx.fillStyle = `rgba(0, 0, 0, ${1 - shade})`
    ctx.fillRect(i * columnWidth, top, columnWidth + 0.5, h)
  }
}

const tileColor: Record<string, string> = {
  '1': '#7c1a33',
  '2': '#d8456b',
  '3': '#f2c14e',
}

/** Round minimap centred on the player, like the game's HUD. */
export function renderMinimap(ctx: CanvasRenderingContext2D, map: Grid, player: Player, radius: number) {
  const scale = 0.16
  const cx = radius + 12
  const cy = radius + 12

  ctx.save()
  ctx.beginPath()
  ctx.arc(cx, cy, radius, 0, 2 * PI)
  ctx.clip()
  ctx.fillStyle = 'rgba(20, 4, 10, 0.85)'
  ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2)

  const size = TILE_SIZE * scale
  for (let ty = 0; ty < map.length; ty++) {
    for (let tx = 0; tx < map[ty].length; tx++) {
      const color = tileColor[map[ty][tx]]
      if (!color) continue
      ctx.fillStyle = color
      ctx.fillRect(cx + (tx * TILE_SIZE - player.x) * scale, cy + (ty * TILE_SIZE - player.y) * scale, size + 0.5, size + 0.5)
    }
  }

  ctx.translate(cx, cy)
  ctx.rotate(player.angle)
  ctx.fillStyle = '#ffe680'
  ctx.beginPath()
  ctx.moveTo(8, 0)
  ctx.lineTo(-5, -5)
  ctx.lineTo(-5, 5)
  ctx.fill()
  ctx.restore()

  ctx.strokeStyle = '#fff'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.arc(cx, cy, radius, 0, 2 * PI)
  ctx.stroke()
}

/** Whole map, used for the overview next to the view. */
export function renderOverview(ctx: CanvasRenderingContext2D, map: Grid, player: Player) {
  const { width, height } = ctx.canvas
  const cell = Math.floor(Math.min(width / map[0].length, height / map.length))
  const ox = (width - cell * map[0].length) / 2
  const oy = (height - cell * map.length) / 2
  ctx.fillStyle = '#14040a'
  ctx.fillRect(0, 0, width, height)
  for (let ty = 0; ty < map.length; ty++) {
    for (let tx = 0; tx < map[ty].length; tx++) {
      ctx.fillStyle = tileColor[map[ty][tx]] ?? '#2a0815'
      ctx.fillRect(ox + tx * cell, oy + ty * cell, cell, cell)
    }
  }
  ctx.fillStyle = '#ffe680'
  ctx.beginPath()
  ctx.arc(ox + (player.x / TILE_SIZE) * cell, oy + (player.y / TILE_SIZE) * cell, Math.max(2, cell / 2.5), 0, 2 * PI)
  ctx.fill()
}
