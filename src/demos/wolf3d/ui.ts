// Port of src/my_sfform: textured buttons and sliders grouped by id, drawn and
// updated per group exactly like draw_button / update_button / event_button.
import type { TexName } from './assets'

export type Tex = Record<TexName, HTMLImageElement>

export const FONT = 'arcade'

export function text(
  ctx: CanvasRenderingContext2D,
  str: string,
  x: number,
  y: number,
  size: number,
  color: string,
  align: 'center' | 'left' = 'center',
) {
  ctx.font = `${size}px ${FONT}`
  ctx.fillStyle = color
  ctx.textAlign = align
  ctx.textBaseline = align === 'center' ? 'middle' : 'top'
  const lines = str.split('\n')
  const lh = size * 1.25
  lines.forEach((line, i) => ctx.fillText(line, x, y + i * lh))
}

export class Button {
  pressed = false
  hover = false

  constructor(
    public group: number,
    public x: number,
    public y: number,
    public w: number,
    public h: number,
    public txt: string | null,
    public label: string | null,
    public onPress: (b: Button) => void,
    public image: TexName | null = null,
    public imageSize: [number, number] = [0, 0],
  ) {}

  contains(mx: number, my: number) {
    return Math.abs(mx - this.x) <= this.w / 2 + 2 && Math.abs(my - this.y) <= this.h / 2 + 2
  }

  draw(ctx: CanvasRenderingContext2D, tex: Tex) {
    const card = this.group === 10
    const s = this.pressed ? 1.2 : 1
    const t: TexName = card ? (this.pressed ? 'up_click' : 'upgrade') : this.pressed ? 'button_clic' : 'button'
    ctx.drawImage(tex[t], this.x - (this.w * s) / 2, this.y - (this.h * s) / 2, this.w * s, this.h * s)
    const color = this.hover ? '#fff' : '#000'
    if (this.txt && this.image) {
      text(ctx, this.txt, this.x, this.y + this.h / 6, 15, color)
      const [iw, ih] = this.imageSize
      ctx.drawImage(tex[this.image], this.x - iw / 2, this.y - this.h / 6 - ih / 2, iw, ih)
    } else if (this.txt) {
      text(ctx, this.txt, this.x, this.y, 15, color)
    }
    if (this.label) text(ctx, this.label, this.x, this.y - this.h / 1.45, 15, color)
  }
}

export class Slider {
  knob: number
  hover = false
  active = false

  constructor(
    public group: number,
    public x: number,
    public y: number,
    public w: number,
    public h: number,
    public label: string,
    pos: number,
    public onRelease: (ratio: number) => void,
  ) {
    this.knob = x + (w - w / 5) * (pos / 100) - w / 2 + w / 10
  }

  contains(mx: number, my: number) {
    return Math.abs(mx - this.x) <= this.w / 2 + 2 && Math.abs(my - this.y) <= this.h / 2 + 2
  }

  get min() {
    return this.x - this.w / 2 + this.w / 10
  }

  get max() {
    return this.x + this.w / 2 - this.w / 10
  }

  ratio() {
    const r = (this.knob - this.min) / (this.max - this.min)
    return r < 0.01 ? 0.01 : r
  }

  move(mx: number) {
    this.knob = Math.min(this.max, Math.max(this.min, mx))
  }

  draw(ctx: CanvasRenderingContext2D, tex: Tex) {
    ctx.drawImage(tex.button, this.x - this.w / 2, this.y - this.h / 2, this.w, this.h)
    const s = this.active ? 1.2 : 1
    const kw = (this.w / 15) * s
    const kh = (this.h - 28) * s
    ctx.fillStyle = 'rgb(40,40,40)'
    ctx.fillRect(this.knob - kw / 2, this.y - kh / 2, kw, kh)
    text(ctx, this.label, this.x, this.y - this.h / 1.3, 15, this.hover ? '#fff' : '#000')
  }
}

/** Buttons and sliders, handled per group like the original linked lists. */
export class Widgets {
  buttons: Button[] = []
  sliders: Slider[] = []

  button(b: Button) {
    this.buttons.push(b)
    return b
  }

  slider(s: Slider) {
    this.sliders.push(s)
    return s
  }

  removeGroup(group: number) {
    this.buttons = this.buttons.filter((b) => b.group !== group)
  }

  draw(ctx: CanvasRenderingContext2D, tex: Tex, group: number) {
    for (const b of this.buttons) if (b.group === group) b.draw(ctx, tex)
    for (const s of this.sliders) if (s.group === group) s.draw(ctx, tex)
  }

  update(group: number, mx: number, my: number, mouseDown: boolean) {
    for (const b of this.buttons) {
      if (b.group !== group) continue
      b.hover = b.contains(mx, my)
      if (!b.hover) b.pressed = false
    }
    for (const s of this.sliders) {
      if (s.group !== group) continue
      s.hover = s.contains(mx, my)
      s.active = s.hover && mouseDown
      if (s.active) s.move(mx)
    }
  }

  event(group: number, type: 'mousedown' | 'mouseup', mx: number, my: number) {
    for (const b of [...this.buttons]) {
      if (b.group !== group || !b.contains(mx, my)) continue
      if (type === 'mouseup') b.onPress(b)
      else b.pressed = true
    }
    for (const s of this.sliders) {
      if (s.group !== group || !s.contains(mx, my)) continue
      if (type === 'mousedown') s.move(mx)
      else s.onRelease(s.ratio())
    }
  }
}
