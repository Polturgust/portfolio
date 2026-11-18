// Port of Wolf3D's game logic (src/*.c): same constants, timings and rules.
// The C version runs at 30 updates per second; movement here is scaled by the
// real frame time so it feels the same at any frame rate.
import type { Assets } from './assets'
import { Input, keyName } from './input'
import { generateMap, type Grid } from './map'
import { Music, Sound } from './sound'
import { Button, Slider, Widgets } from './ui'

export const W = 1600
export const H = 900
export const PI = Math.PI
export const TILE = 64
export const RAY_NBR = 400
export const BUFFER = 20
export const MINIMAP_SCALE = 0.3
export const MINIMAP_RADIUS = 150
export const HP_BAR_MAX_WIDTH = 840

const rand = (n: number) => Math.floor(Math.random() * n)
const now = () => performance.now() / 1000

export interface Player {
  alive: boolean
  x: number
  y: number
  angle: number
  pitch: number
  speed: number
  fov: number
  height: number
  hp: number
  amo: number
}

export interface RayHit {
  distance: number
  hitX: number
  hitY: number
  vertical: boolean
  tile: string
}

export type BindName =
  | 'front' | 'back' | 'left' | 'right' | 'jump' | 'flashlight' | 'crouch' | 'sprint' | 'dash'
  | 'reload'

type SoundKey = 'walk' | 'run' | 'crouch' | 'jump' | 'dash' | 'flash' | 'gun' | 'reload' | 'empty'

export class Game {
  map: Grid = []
  mapW = 0
  mapH = 0
  player: Player = this.freshPlayer()
  mouseSensi = 1
  volume = 50
  musicVolume = 50
  brightness = 0
  playStart = 0

  binds: Record<BindName, string> = {
    front: 'KeyW', left: 'KeyA', back: 'KeyS', right: 'KeyD', jump: 'Space',
    flashlight: 'KeyF', reload: 'KeyR', crouch: 'KeyC', sprint: 'ShiftLeft', dash: 'AltLeft',
  }

  upgrade = { in: false, addBullet: 0, lifeSteal: 0, addMs: 0 }
  menu = { in: true, inSaves: false, inSettings: false, inKeybinds: false, action: '', actionAlpha: 0 }
  score = { corKilled: 0, roomPassed: 0, score: 0, best: 0, done: false }
  corCnt = 0
  gun = { state: 0, explState: 0, explX: W / 2, explY: H / 2, explScale: 0.5 }
  dash = { active: false, startX: 0, startY: 0, targetX: 0, targetY: 0, start: 0, cooldownStart: -1 }
  jump = { active: false, startHeight: 0, peakHeight: 0, start: 0 }
  flash = { on: false, last: -1 }
  sounds: Record<SoundKey, Sound>
  music: Music
  menuMusic: Music
  playing: Record<SoundKey, boolean> = {
    walk: false, run: false, crouch: false, jump: false, dash: false, flash: false, gun: false,
    reload: false, empty: false,
  }
  widgets = new Widgets()
  waitingKey: { bind: BindName; button: Button } | null = null
  bindButtons = new Map<Button, BindName>()
  private lastRelease = 0
  minimap!: HTMLCanvasElement
  frame = 0

  private clocks = { gun: -1, expl: -1, drain: -1, frame: 0 }

  constructor(
    public assets: Assets,
    public input: Input,
    audio: AudioContext,
    buffers: Partial<Record<SoundKey, AudioBuffer>>,
    public onExit: () => void,
  ) {
    const loops: SoundKey[] = ['walk', 'crouch', 'run']
    this.sounds = {} as Record<SoundKey, Sound>
    for (const key of Object.keys(this.playing) as SoundKey[])
      this.sounds[key] = new Sound(audio, buffers[key] ?? null, loops.includes(key))
    this.music = new Music(`${assets.base}sounds/music.mp3`)
    this.menuMusic = new Music(`${assets.base}sounds/menu_music.mp3`)
    try {
      this.score.best = Number(localStorage.getItem('wolf3d-best-score')) || 0
    } catch {
      this.score.best = 0
    }
    const size = 15 + rand(30)
    this.loadMap(size)
    this.createMenus()
  }

  freshPlayer(): Player {
    return {
      alive: true, x: 1.5 * TILE, y: 1.5 * TILE, angle: PI / 4, pitch: 0, speed: 4,
      fov: PI / 2, height: TILE * 0.5, hp: 100, amo: 2,
    }
  }

  // ------------------------------------------------------------------ map

  loadMap(size: number) {
    this.mapW = size
    this.mapH = size
    this.map = generateMap(size, size)
    this.corCnt = 0
    for (const row of this.map) for (const c of row) this.corCnt += c === '2' ? 1 : 0
    this.buildMinimap()
  }

  tileAt(x: number, y: number) {
    const tx = Math.trunc(x / TILE)
    const ty = Math.trunc(y / TILE)
    if (tx < 0 || tx >= this.mapW || ty < 0 || ty >= this.mapH) return '1'
    return this.map[ty][tx]
  }

  isWall(x: number, y: number) {
    return this.tileAt(Math.trunc(x), Math.trunc(y)) !== '0'
  }

  isDoor(x: number, y: number) {
    return this.tileAt(Math.trunc(x), Math.trunc(y)) === '4'
  }

  /** Minimap texture: one tile per map cell, transposed like init_minimap. */
  buildMinimap() {
    const t = TILE * MINIMAP_SCALE
    const c = document.createElement('canvas')
    c.width = Math.floor(this.mapW * t + BUFFER * 2)
    c.height = Math.floor(this.mapH * t + BUFFER * 2)
    const ctx = c.getContext('2d')!
    ctx.fillStyle = '#000'
    ctx.fillRect(0, 0, c.width, c.height)
    for (let y = 0; y < this.mapH; y++)
      for (let x = 0; x < this.mapW; x++) this.drawMiniTile(ctx, y, x, this.map[y][x])
    this.minimap = c
  }

  drawMiniTile(ctx: CanvasRenderingContext2D, row: number, col: number, tile: string) {
    const t = TILE * MINIMAP_SCALE
    const px = BUFFER + row * t
    const py = BUFFER + col * t
    const tex = this.assets.tex
    if (tile === '0') {
      ctx.fillStyle = 'rgb(38,8,21)'
      ctx.fillRect(px, py, t, t)
      return
    }
    const img = tile === '1' ? tex.wall_1 : tile === '2' ? tex.wall_2 : tex.mini_door
    ctx.drawImage(img, px, py, t, t)
  }

  changeMap(emergency: boolean) {
    this.loadMap(10 + rand(20))
    this.player.x = 1.5 * TILE
    this.player.y = 1.5 * TILE
    this.player.angle = PI / 4
    if (!emergency) {
      this.score.roomPassed++
      this.upgrade.in = true
      this.createUpgrade()
    }
  }

  // ------------------------------------------------------------- raycasting

  /** cast_single_ray, walking the grid cell by cell instead of 0.1-unit steps. */
  castRay(rayAngle: number): RayHit {
    const a = rayAngle % (2 * PI)
    const dx = Math.cos(a)
    const dy = Math.sin(a)
    const p = this.player
    let cx = Math.floor(p.x / TILE)
    let cy = Math.floor(p.y / TILE)
    const stepX = dx > 0 ? 1 : -1
    const stepY = dy > 0 ? 1 : -1
    const tdx = Math.abs(TILE / (dx || 1e-9))
    const tdy = Math.abs(TILE / (dy || 1e-9))
    let tmx = dx > 0 ? ((cx + 1) * TILE - p.x) / dx : (p.x - cx * TILE) / -(dx || -1e-9)
    let tmy = dy > 0 ? ((cy + 1) * TILE - p.y) / dy : (p.y - cy * TILE) / -(dy || -1e-9)
    let t = 0
    while (t < 1500) {
      if (tmx < tmy) {
        t = tmx
        tmx += tdx
        cx += stepX
      } else {
        t = tmy
        tmy += tdy
        cy += stepY
      }
      const tile = cx < 0 || cy < 0 || cx >= this.mapW || cy >= this.mapH ? '1' : this.map[cy][cx]
      if (tile !== '0') {
        const dist = t + 0.05
        const x = p.x + dx * dist
        const y = p.y + dy * dist
        return {
          distance: dist * Math.cos(p.angle - a),
          hitX: x,
          hitY: y,
          vertical: Math.abs((x % TILE) - TILE / 2) > Math.abs((y % TILE) - TILE / 2),
          tile,
        }
      }
    }
    return { distance: 0, hitX: p.x, hitY: p.y, vertical: false, tile: '1' }
  }

  /** take_real_d: distance to what the crosshair points at (wall, floor or ceiling). */
  realDistance() {
    const d = Math.trunc(this.castRay(this.player.angle).distance)
    const betaH = Math.atan(TILE / 2 / d)
    const beta = Math.abs(this.player.pitch / (H / 1.5)) * 0.715743
    const dh = TILE / 2 / Math.sin(beta)
    return beta < betaH ? d : dh
  }

  // ------------------------------------------------------------- shooting

  shoot() {
    const hit = this.castRay(this.player.angle)
    const tx = Math.trunc(hit.hitX / TILE)
    const ty = Math.trunc(hit.hitY / TILE)
    let d = this.realDistance()
    if (d === 0) d = 0.0001
    this.gun.explScale = (1 / d) * 20
    this.gun.explState = 1
    this.gun.explX = W / 2
    this.gun.explY = H / 2
    if (tx >= 0 && tx < this.mapW && ty >= 0 && ty < this.mapH && Math.floor(hit.distance) === this.realDistance()) {
      if (this.map[ty][tx] === '1') this.player.hp -= 10
      if (this.map[ty][tx] === '2') {
        this.map[ty][tx] = '1'
        this.drawMiniTile(this.minimap.getContext('2d')!, ty, tx, '1')
        this.corDestroyed()
        this.player.hp = Math.trunc(this.player.hp + this.upgrade.lifeSteal)
      }
    }
    if (this.player.hp > 100) this.player.hp = 100
  }

  corDestroyed() {
    this.corCnt--
    if (this.corCnt === 0)
      for (const row of this.map) for (let i = 0; i < row.length; i++) if (row[i] === '3') row[i] = '4'
    this.score.corKilled++
  }

  handleGun() {
    if (this.input.mouseDown && this.input.locked()) {
      if (this.gun.state === 0 && this.player.amo > 0) {
        this.shoot()
        this.gun.state = 1
        this.player.amo--
        this.playing.gun = true
      }
      if (this.gun.state === 0 && this.player.amo <= 0) this.playing.empty = true
    }
    if (this.pressed('reload')) {
      this.player.amo = 2 + this.upgrade.addBullet
      this.playing.reload = true
    }
  }

  // ---------------------------------------------------------- player update

  pressed(bind: BindName) {
    return this.input.keys.has(this.binds[bind])
  }

  updatePlayer(k: number) {
    if (this.menu.in || this.upgrade.in) return
    const p = this.player
    const pad = this.input.pad()
    p.speed = 4
    p.fov = PI / 2.4
    p.height = TILE * 0.5
    this.updateFlashlight()
    if (this.pressed('crouch') || pad?.button(1)) {
      this.playing.crouch = true
      p.speed = 3 + this.upgrade.addMs
      p.height = TILE * 0.3
      p.fov = PI / 2.5
    }
    if (this.pressed('sprint') || pad?.button(0)) {
      this.playing.run = true
      p.speed = 6 + this.upgrade.addMs
      p.fov = PI / 2.1
    }
    const next = { x: p.x, y: p.y }
    this.movement(next, k, pad)
    this.dashAndJump(next)
    if (!this.isWall(next.x, next.y)) {
      p.x = next.x
      p.y = next.y
    } else {
      if (this.isDoor(next.x, next.y)) this.changeMap(false)
      this.dash.active = false
    }
    p.angle %= 2 * PI
    if (p.angle < 0) p.angle += 2 * PI
  }

  private movement(next: { x: number; y: number }, k: number, pad: ReturnType<Input['pad']>) {
    const p = this.player
    const ms = (p.speed + this.upgrade.addMs) * k
    this.playing.walk = false
    const go = (angle: number, factor: number) => {
      this.playing.walk = true
      next.x += Math.cos(angle) * ms * factor
      next.y += Math.sin(angle) * ms * factor
    }
    if (this.pressed('front') || (pad && pad.y < 0)) go(p.angle, 1)
    if (this.pressed('back') || (pad && pad.y > 0)) go(p.angle, -1)
    if (this.pressed('left') || (pad && pad.x < 0)) go(p.angle - PI / 2, 1 / 1.5)
    if (this.pressed('right') || (pad && pad.x > 0)) go(p.angle + PI / 2, 1 / 1.5)
  }

  private updateFlashlight() {
    if (!this.pressed('flashlight')) return
    const t = now()
    if (this.flash.last < 0) this.flash.last = t
    if (t - this.flash.last >= 0.2) {
      this.playing.flash = true
      this.flash.on = !this.flash.on
      this.flash.last = t
    }
  }

  private dashAndJump(next: { x: number; y: number }) {
    const p = this.player
    const t = now()
    const pad = this.input.pad()
    if (this.dash.cooldownStart < 0) this.dash.cooldownStart = t
    if (!this.dash.active && (this.pressed('dash') || pad?.button(3)) && t - this.dash.cooldownStart >= 2) {
      this.playing.dash = true
      Object.assign(this.dash, {
        startX: p.x, startY: p.y, targetX: p.x + Math.cos(p.angle) * 120,
        targetY: p.y + Math.sin(p.angle) * 120, start: t, active: true, cooldownStart: t,
      })
    }
    if (!this.jump.active && (this.pressed('jump') || pad?.button(2))) {
      this.playing.jump = true
      Object.assign(this.jump, { startHeight: p.height, peakHeight: p.height + 30, start: t, active: true })
    }
    if (this.dash.active) {
      const s = t - this.dash.start
      if (s >= 0.3) {
        p.x = this.dash.targetX
        p.y = this.dash.targetY
        this.dash.active = false
      } else {
        const r = s / 0.3
        p.fov = PI / 1.8
        next.x = this.dash.startX + (this.dash.targetX - this.dash.startX) * r
        next.y = this.dash.startY + (this.dash.targetY - this.dash.startY) * r
      }
    }
    if (this.jump.active) {
      const s = t - this.jump.start
      if (s >= 0.5) {
        p.height = this.jump.startHeight
        this.jump.active = false
      } else {
        const f = 4 * (s / 0.5 - 0.5) * (s / 0.5 - 0.5)
        p.height = this.jump.startHeight + (this.jump.peakHeight - this.jump.startHeight) * (1 - f)
      }
    }
  }

  /** handle_mouse: look around with the mouse (and the right stick). */
  look() {
    const [dx, dy] = this.input.takeLook()
    const p = this.player
    const maxPitch = H / 1.5
    const pad = this.input.pad()
    if (dx) {
      p.angle += (dx * this.mouseSensi) / 1000
      this.gun.explX -= dx * this.mouseSensi * 2
    }
    if (dy) {
      p.pitch -= dy * this.mouseSensi
      this.gun.explY -= dy * this.mouseSensi
    }
    if (pad?.u) p.angle += (pad.u * 0.005) / 6
    if (pad?.v) p.pitch -= pad.v * (0.005 * 200)
    p.pitch = Math.max(-maxPitch, Math.min(maxPitch, p.pitch))
  }

  // -------------------------------------------------------- per-frame update

  updateElements() {
    if (!this.player.alive) {
      this.calculateScore()
      return
    }
    const t = now()
    if (this.clocks.gun < 0) this.clocks.gun = t
    if (t - this.clocks.gun > 0.05 && this.gun.state !== 0) {
      this.gun.state++
      this.clocks.gun = t
    }
    if (this.gun.state > 5) this.gun.state = 0
    if (this.clocks.expl < 0) this.clocks.expl = t
    if (t - this.clocks.expl > 0.04 && this.gun.explState !== 0) {
      this.gun.explState++
      this.clocks.expl = t
    }
    if (this.gun.explState > 7) this.gun.explState = 0
    this.updateSounds()
    this.drainLife(t)
  }

  private drainLife(t: number) {
    if (this.clocks.drain < 0) this.clocks.drain = t
    const interval = Math.max(2.0 - (t - this.playStart) * 0.005, 0.1)
    if (t - this.clocks.drain > interval) {
      this.player.hp--
      this.clocks.drain = t
    }
    if (this.player.hp <= 0) {
      this.player.hp = 0
      this.player.alive = false
      this.input.unlock()
    }
  }

  private calculateScore() {
    if (this.score.done) return
    const time = now() - this.playStart
    this.score.score = Math.max(0, Math.trunc(this.score.corKilled * 10 + this.score.roomPassed * 50 + time * 2))
    if (this.score.score > this.score.best) {
      this.score.best = this.score.score
      try {
        localStorage.setItem('wolf3d-best-score', String(this.score.best))
      } catch {
        /* best score only lasts for this visit */
      }
    }
    this.score.done = true
    this.stopAllSounds()
  }

  // ----------------------------------------------------------------- sounds

  updateSounds() {
    const s = this.sounds
    const pl = this.playing
    if (pl.walk) {
      if (pl.crouch) {
        if (s.crouch.status !== 'playing') {
          s.crouch.play()
          s.walk.pause()
        }
      } else if (pl.run) {
        if (s.run.status !== 'playing') {
          s.run.play()
          s.walk.pause()
        }
      } else if (s.walk.status !== 'playing') s.walk.play()
    } else {
      s.walk.pause()
      s.crouch.pause()
      s.run.pause()
    }
    if (pl.jump && s.jump.status !== 'playing') s.jump.play()
    for (const key of ['dash', 'flash', 'gun', 'reload', 'empty'] as SoundKey[]) if (pl[key]) s[key].play()
    if (this.music.status !== 'playing') {
      this.music.play()
      this.menuMusic.pause()
    }
    if (s.jump.status === 'playing') {
      s.walk.pause()
      s.crouch.pause()
      s.run.pause()
    }
    this.applyVolumes()
    for (const key of Object.keys(pl) as SoundKey[]) pl[key] = false
  }

  applyVolumes() {
    for (const key of Object.keys(this.sounds) as SoundKey[]) this.sounds[key].setVolume(this.volume)
    this.music.setVolume(this.musicVolume)
    this.menuMusic.setVolume(this.musicVolume)
  }

  stopAllSounds() {
    for (const key of Object.keys(this.sounds) as SoundKey[]) this.sounds[key].stop()
    this.music.pause()
    this.menuMusic.pause()
  }

  // ------------------------------------------------------------------ menus

  showAction(msg: string) {
    this.menu.action = msg
    this.menu.actionAlpha = 255
  }

  openCloseMenu() {
    if (this.menu.in) this.input.lock()
    else this.input.unlock()
    this.menu.in = !this.menu.in
    this.menu.inKeybinds = false
    this.menu.inSaves = false
  }

  /** escape_effect: Escape steps back out of sub-menus, then toggles the menu. */
  escape() {
    const m = this.menu
    if (this.waitingKey || now() - this.lastRelease < 0.4) return
    if (m.inKeybinds && m.in) m.inKeybinds = false
    else if (m.inSaves && m.in) m.inSaves = false
    else if (m.inSettings && m.in) m.inSettings = false
    else if (this.player.alive && !this.upgrade.in) this.openCloseMenu()
  }

  createMenus() {
    const w = this.widgets
    const cx = W / 2
    let m = H / 5
    const add = (g: number, y: number, bw: number, txt: string, fn: (b: Button) => void, label: string | null = null) =>
      w.button(new Button(g, cx, y, bw, 50, txt, label, fn))
    add(1, m, 100, 'PLAY', () => this.openCloseMenu())
    add(1, m * 2, 200, 'SAVE MENU', () => (this.menu.inSaves = !this.menu.inSaves))
    add(1, m * 3, 200, 'SETTINGS', () => (this.menu.inSettings = !this.menu.inSettings))
    add(1, m * 4, 100, 'EXIT', () => this.onExit())
    add(7, (H / 8) * 7, 100, 'EXIT', () => this.onExit())
    m = H / 6
    add(2, m, 180, 'KEYBINDS', () => (this.menu.inKeybinds = !this.menu.inKeybinds))
    w.slider(new Slider(2, cx, m * 2, 320, 50, 'BRIGHTNESS', 100, (r) => {
      this.brightness = Math.round((1 - r) * 255)
      this.showAction('Changed brightness')
    }))
    w.slider(new Slider(2, cx, m * 3, 320, 50, 'SENSITIVITY', 50, (r) => {
      this.mouseSensi = r * 2
      this.showAction('Changed mouse sensibility')
    }))
    w.slider(new Slider(2, cx, m * 4, 320, 50, 'MUSIC VOLUME', 50, (r) => {
      this.musicVolume = r * 100
      this.applyVolumes()
      this.showAction('Changed music volume')
    }))
    w.slider(new Slider(2, cx, m * 5, 320, 50, 'EFFECTS VOLUME', 50, (r) => {
      this.volume = r * 100
      this.applyVolumes()
      this.showAction('Changed effects volume')
    }))
    m = H / 10
    const binds: [BindName, string, string][] = [
      ['front', 'Forward:', 'forward walking'], ['left', 'Left:', 'left walking'],
      ['back', 'Back:', 'back walking'], ['right', 'Right:', 'right walking'],
      ['flashlight', 'Flashlight:', 'flashlight'], ['reload', 'Reload:', 'reload'],
      ['jump', 'Jump:', 'jump'], ['sprint', 'Run:', 'sprint'], ['dash', 'Dash:', 'dash'],
    ]
    binds.forEach(([bind, label], i) => {
      const b = add(4, m * (i + 1), 150, keyName(this.binds[bind]), (btn) => {
        this.waitingKey = { bind, button: btn }
        this.showAction('Press the new key (Escape to cancel)')
      }, label)
      this.bindButtons.set(b, bind)
    })
    m = H / 4
    add(3, m, 180, 'SAVE GAME', () => this.saveGame())
    add(3, m * 2, 220, 'LOAD LAST SAVE', () => this.loadSave())
    add(3, m * 3, 200, 'DELETE SAVE', () => this.deleteSave())
  }

  /** get_new_key: the next key pressed becomes the binding. */
  takeKey(code: string) {
    const wait = this.waitingKey
    if (!wait) return false
    this.waitingKey = null
    if (code !== 'Escape') this.binds[wait.bind] = code
    wait.button.txt = keyName(this.binds[wait.bind])
    const names: Record<BindName, string> = {
      front: 'forward walking', back: 'back walking', left: 'left walking', right: 'right walking',
      jump: 'jump', flashlight: 'flashlight', crouch: 'crouch', sprint: 'sprint', dash: 'dash',
      reload: 'reload',
    }
    this.showAction(`Changed ${names[wait.bind]} key`)
    return true
  }

  refreshKeyNames() {
    for (const [button, bind] of this.bindButtons) button.txt = keyName(this.binds[bind])
  }

  saveGame() {
    try {
      localStorage.setItem('wolf3d-save', JSON.stringify(this.player))
      this.showAction('Game Saved')
    } catch {
      this.showAction('Could not save')
    }
  }

  loadSave() {
    let data: string | null = null
    try {
      data = localStorage.getItem('wolf3d-save')
    } catch {
      data = null
    }
    if (!data) {
      this.showAction('There is no save to load')
      return
    }
    Object.assign(this.player, JSON.parse(data))
    this.showAction('Save Loaded')
  }

  deleteSave() {
    try {
      localStorage.removeItem('wolf3d-save')
    } catch {
      /* nothing saved */
    }
    this.showAction('Save deleted')
  }

  // --------------------------------------------------------------- upgrades

  createUpgrade() {
    const cards: [() => void, string, 'up_amo' | 'up_hp' | 'up_ms' | 'up_lf'][] = [
      [() => (this.upgrade.addBullet += 1), 'Ammo +1', 'up_amo'],
      [() => (this.player.hp = Math.min(100, this.player.hp + 20)), 'Heal 20 hp', 'up_hp'],
      [() => (this.upgrade.addMs += 0.5), 'Moove speed up', 'up_ms'],
      [() => (this.upgrade.lifeSteal += 0.5), 'Life steal up', 'up_lf'],
    ]
    const used = [false, false, false, false]
    for (let i = 1; i <= 3; i++) {
      let e = rand(4)
      while (used[e] || (e === 3 && this.upgrade.lifeSteal >= 5)) e = rand(4)
      used[e] = true
      const [apply, title, image] = cards[e]
      this.widgets.button(new Button(10, (W / 10) * (3 * i - 1), H / 2, (W / 10) * 2, (H / 10) * 6,
        title, null, () => {
          apply()
          this.widgets.removeGroup(10)
          this.upgrade.in = false
          this.input.lock()
        }, image, [200, 200]))
    }
    this.input.unlock()
  }

  // ---------------------------------------------------------- frame driver

  /** handle_events + update: one frame of the main loop. */
  step(dt: number) {
    const k = Math.min(dt, 0.1) * 30
    this.clocks.frame += dt
    while (this.clocks.frame >= 1 / 30) {
      this.clocks.frame -= 1 / 30
      this.frame = (this.frame + 1) % 4
      this.menu.actionAlpha = Math.max(0, this.menu.actionAlpha - 5)
    }
    this.handleEvents()
    if (!this.player.alive) {
      this.widgets.update(7, this.input.mouseX, this.input.mouseY, this.input.mouseDown)
    } else {
      if (!this.menu.in && !this.upgrade.in) {
        this.look()
        this.handleGun()
      } else this.input.takeLook()
      this.updatePlayer(k)
    }
    if (this.upgrade.in) this.widgets.update(10, this.input.mouseX, this.input.mouseY, this.input.mouseDown)
    else if (this.menu.in) this.updateMenu()
    else this.updateElements()
  }

  private updateMenu() {
    if (this.menuMusic.status !== 'playing') {
      this.menuMusic.play()
      this.music.pause()
    }
    this.sounds.walk.pause()
    this.sounds.run.pause()
    this.sounds.crouch.pause()
    this.applyVolumes()
    this.widgets.update(this.menuGroup(), this.input.mouseX, this.input.mouseY, this.input.mouseDown)
  }

  menuGroup() {
    if (this.upgrade.in) return 10
    if (this.menu.inKeybinds) return 4
    if (this.menu.inSettings) return 2
    if (this.menu.inSaves) return 3
    return 1
  }

  private handleEvents() {
    for (const e of this.input.events.splice(0)) {
      if (e.type === 'keydown' && this.takeKey(e.code)) continue
      if ((e.type === 'mousedown' || e.type === 'mouseup') && e.button === 0) {
        const group = !this.player.alive ? 7 : this.menu.in || this.upgrade.in ? this.menuGroup() : -1
        if (group >= 0) this.widgets.event(group, e.type, this.input.mouseX, this.input.mouseY)
        else if (e.type === 'mousedown' && !this.input.locked()) this.input.lock()
      }
      if (e.type === 'keyup' && e.code === 'Escape') this.escape()
      if (e.type === 'keyup' && e.code === 'KeyL' && this.player.alive && !this.menu.in && !this.upgrade.in)
        this.changeMap(true)
    }
  }

  /** The pointer was released (Escape in the browser): same as pressing Escape in game. */
  pointerReleased() {
    if (!this.player.alive || this.menu.in || this.upgrade.in) return
    this.lastRelease = now()
    this.openCloseMenu()
  }

  destroy() {
    this.stopAllSounds()
  }
}
