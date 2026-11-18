// Port of the drawing code: render_before_raycasting, raycasting, render_game
// (gun, effects, minimap, flashlight, HUD), draw_menu and the death screen.
import { BUFFER, Game, H, HP_BAR_MAX_WIDTH, MINIMAP_RADIUS, MINIMAP_SCALE, PI, RAY_NBR, TILE, W } from './game'
import { text } from './ui'

export function renderWorld(g: Game, ctx: CanvasRenderingContext2D) {
  const p = g.player
  const tex = g.assets.tex
  ctx.fillStyle = 'rgb(38,8,21)'
  ctx.fillRect(0, H / 2 + p.pitch, W, H / 2 - p.pitch)
  ctx.fillStyle = 'rgb(72,13,28)'
  ctx.fillRect(0, 0, W, H / 2 + p.pitch)
  const proj = W / 3 / Math.tan(p.fov / 2)
  const colW = W / RAY_NBR
  const eye = p.height - TILE * 0.5
  for (let i = 0; i < RAY_NBR; i++) {
    const angle = p.angle - p.fov / 2 + i * (p.fov / RAY_NBR)
    const hit = g.castRay(angle)
    if (hit.distance <= 0) continue
    const h = (TILE / hit.distance) * proj
    const off = hit.vertical ? hit.hitY % TILE : hit.hitX % TILE
    const img = hit.tile === '2' ? tex.wall_2 : hit.tile === '3' ? tex.door_closed
      : hit.tile === '4' ? tex.door_open : tex.wall_1
    const tx = Math.min(img.width - 1, Math.max(0, Math.floor((off / TILE) * img.width)))
    const y = H / 2 - h / 2 + p.pitch + (eye / hit.distance) * proj
    ctx.drawImage(img, tx, 0, 1, img.height, i * colW, y, colW + 0.6, h)
    const shade = 1 / (1 + hit.distance * 0.006)
    ctx.fillStyle = `rgba(0,0,0,${1 - shade})`
    ctx.fillRect(i * colW, y, colW + 0.6, h)
  }
}

function drawGun(g: Game, ctx: CanvasRenderingContext2D) {
  const tex = g.assets.tex
  const s = W * 0.002
  ctx.drawImage(tex.gun, 116 * g.gun.state, 0, 116, 161, W - 0.05 * W - 116 * s, H - 161 * s, 116 * s, 161 * s)
  if (g.gun.explState !== 0) {
    const size = 1050 * g.gun.explScale
    ctx.drawImage(tex.explosion, 1050 * g.gun.explState, 0, 1050, 1050,
      g.gun.explX - size / 2, g.gun.explY - size / 2, size, size)
  }
  ctx.drawImage(tex.crosshair, W / 2 - 4 * 5, H / 2 - 4 * 5, 35, 35)
}

function drawEffects(g: Game, ctx: CanvasRenderingContext2D) {
  const tex = g.assets.tex
  ctx.globalAlpha = 150 / 255
  if (g.player.speed === 3 + g.upgrade.addMs) ctx.drawImage(tex.vignette, 0, 0, W, H)
  if (g.dash.active) ctx.drawImage(g.frame % 4 === 0 ? tex.dash_0 : tex.dash_1, 0, 0, W, H)
  ctx.globalAlpha = 1
  if (g.brightness > 0) {
    ctx.fillStyle = `rgba(0,0,0,${g.brightness / 255})`
    ctx.fillRect(0, 0, W, H)
  }
}

function drawMinimap(g: Game, ctx: CanvasRenderingContext2D) {
  const p = g.player
  const r = MINIMAP_RADIUS
  const cx = W * (BUFFER / 1600) + r
  const cy = H * (BUFFER / 900) + r
  const d = Math.round((2 * r) / 2)
  const half = TILE * MINIMAP_SCALE
  const left = Math.round(p.y * MINIMAP_SCALE + half - d * 0.5)
  const top = Math.round(p.x * MINIMAP_SCALE + half - d * 0.5)
  ctx.save()
  ctx.translate(cx, cy)
  ctx.rotate(p.angle)
  ctx.beginPath()
  ctx.arc(0, 0, r, 0, 2 * PI)
  ctx.save()
  ctx.clip()
  ctx.fillStyle = '#000'
  ctx.fillRect(-r, -r, 2 * r, 2 * r)
  ctx.drawImage(g.minimap, left, top, d, d, -r, -r, 2 * r, 2 * r)
  ctx.restore()
  ctx.lineWidth = 2
  ctx.strokeStyle = '#fff'
  ctx.beginPath()
  ctx.arc(0, 0, r + 1, 0, 2 * PI)
  ctx.stroke()
  ctx.restore()
  ctx.save()
  ctx.translate(cx, cy)
  ctx.rotate(PI)
  ctx.drawImage(g.assets.tex.player, -10, -10, 20, 20)
  ctx.restore()
}

function drawHud(g: Game, ctx: CanvasRenderingContext2D) {
  const tex = g.assets.tex
  const s = 0.6
  const hp = { x: BUFFER * s, y: H - BUFFER * s - 128 * s }
  ctx.drawImage(tex.hp, hp.x, hp.y, 1016 * s, 128 * s)
  const hpv = g.player.hp
  ctx.fillStyle = hpv < 30 ? '#f00' : hpv < 50 ? 'rgb(255,165,0)' : '#0f0'
  ctx.fillRect(hp.x + 160 * s, hp.y + 40 * s, (hpv / 100) * HP_BAR_MAX_WIDTH * s, 48 * s)
  const amo = { x: BUFFER * s, y: H - BUFFER * s * 2 - 128 * s * 2 }
  ctx.drawImage(tex.amo, amo.x, amo.y, 260 * s, 128 * s)
  text(ctx, String(g.player.amo), amo.x + 182 * s, amo.y + 38 * s, 24, '#fff', 'left')
  const ui = { x: 192, y: 730, size: 80 * 0.8 }
  ctx.fillStyle = 'rgb(54,54,54)'
  ctx.fillRect(ui.x - 5, ui.y - 5, ui.size + 10, ui.size + 10)
  ctx.drawImage(tex.dash_icon, ui.x, ui.y, ui.size, ui.size)
  const ratio = g.dash.cooldownStart < 0 ? 1 : (performance.now() / 1000 - g.dash.cooldownStart) / 2
  if (ratio < 1) {
    const cur = ui.size * (1 - ratio)
    ctx.fillStyle = 'rgba(0,0,0,0.784)'
    ctx.fillRect(ui.x, ui.y + (ui.size - cur), ui.size, cur)
  }
  const cor = { x: BUFFER * s, y: H - BUFFER * s * 3 - 128 * s * 3 }
  ctx.drawImage(tex.cor_rect, cor.x, cor.y, 260 * s, 128 * s)
  text(ctx, String(g.corCnt), cor.x + 182 * s, cor.y + 38 * s, 24, '#fff', 'left')
}

function drawDeath(g: Game, ctx: CanvasRenderingContext2D) {
  ctx.drawImage(g.assets.tex.game_over, 0, 0, W, H)
  g.widgets.draw(ctx, g.assets.tex, 7)
  const sc = Math.min(W / 1600, H / 900)
  text(ctx, String(g.score.score), W / 2, 390 * sc, 24, '#0f0')
  text(ctx, String(g.score.best), W / 2, 480 * sc, 24, 'rgb(239,191,4)')
  text(ctx, String(g.score.corKilled), W / 2, 586 * sc, 24, 'rgb(255,128,0)')
  text(ctx, String(g.score.roomPassed), W / 2, 690 * sc, 24, 'rgb(2,184,229)')
}

function drawMenu(g: Game, ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = 'rgba(200,200,200,0.392)'
  ctx.fillRect(0, 0, W, H)
  if (g.menu.actionAlpha > 0)
    text(ctx, g.menu.action, W / 2, H - H / 25, 15, `rgba(255,255,255,${g.menu.actionAlpha / 255})`)
  g.widgets.draw(ctx, g.assets.tex, g.menuGroup())
}

export function renderGame(g: Game, ctx: CanvasRenderingContext2D) {
  ctx.imageSmoothingEnabled = false
  ctx.fillStyle = '#000'
  ctx.fillRect(0, 0, W, H)
  renderWorld(g, ctx)
  if (!g.player.alive) {
    drawDeath(g, ctx)
    return
  }
  drawGun(g, ctx)
  drawEffects(g, ctx)
  drawMinimap(g, ctx)
  if (g.flash.on) ctx.drawImage(g.assets.tex.flashlight, W / 2 - 625, H / 2 - 625, 1250, 1250)
  drawHud(g, ctx)
  if (g.menu.in || g.upgrade.in) drawMenu(g, ctx)
  else if (!g.input.locked()) {
    ctx.fillStyle = 'rgba(0,0,0,0.55)'
    ctx.fillRect(0, 0, W, H)
    text(ctx, 'CLICK TO PLAY', W / 2, H / 2, 40, '#fff')
    text(ctx, 'Escape opens the menu', W / 2, H / 2 + 60, 18, '#ddd')
  }
}
