// Port of src/story: language choice, then the briefing dialogue read from the
// game's story_eng.dat / story_fr.dat, with the colonel's mouth animation.
import type { Assets } from './assets'
import type { Input } from './input'
import { Button, text, Widgets } from './ui'

const W = 1600
const H = 900

interface Line {
  speaker: string
  text: string
}

function parse(data: string): Line[] {
  const blocks = data.replace(/\r/g, '').split(/\n\s*\n/)
  return blocks
    .map((b) => b.split('\n').filter((l, i) => i === 0 || l.length))
    .filter((lines) => lines[0]?.trim())
    .map(([speaker, ...rest]) => ({ speaker: speaker.trim(), text: rest.join('\n') }))
}

export class Story {
  done = false
  langSelect = true
  private lines: Line[] = []
  private index = -1
  private speaker = 'Colonel'
  private body = 'Hello Sergeant.'
  private mouthOpen = false
  private mouthClock = performance.now() / 1000
  private widgets = new Widgets()

  constructor(private assets: Assets, private input: Input) {
    const sc = Math.min(W / 1600, H / 900)
    const pick = (lang: 'en' | 'fr') => () => {
      this.langSelect = false
      this.lines = parse(lang === 'en' ? assets.story.en : assets.story.fr)
    }
    this.widgets.button(new Button(6, W - 80 * sc, H - 40 * sc, 100, 50, 'SKIP', null, () => (this.done = true)))
    this.widgets.button(new Button(5, W / 2, (H / 2) * 0.85, 180, 50, 'ENGLISH', null, pick('en')))
    this.widgets.button(new Button(5, W / 2, (H / 2) * 1.15, 180, 50, 'FRANCAIS', null, pick('fr')))
  }

  private next() {
    this.index++
    if (this.index >= this.lines.length) {
      this.done = true
      return
    }
    this.speaker = this.lines[this.index].speaker
    this.body = this.lines[this.index].text
  }

  step() {
    const group = this.langSelect ? 5 : 6
    for (const e of this.input.events.splice(0)) {
      if (e.type === 'mousedown' || e.type === 'mouseup') {
        if (e.button !== 0) continue
        const onButton = this.widgets.buttons.some((b) => b.group === group && b.contains(this.input.mouseX, this.input.mouseY))
        this.widgets.event(group, e.type, this.input.mouseX, this.input.mouseY)
        if (!this.langSelect && !onButton && e.type === 'mouseup') this.next()
        continue
      }
      if (e.type !== 'keyup') continue
      if (e.code === 'Escape') this.done = true
      else if (!this.langSelect && (e.code === 'Enter' || e.code === 'Space' || e.code === 'NumpadEnter')) this.next()
    }
    this.widgets.update(group, this.input.mouseX, this.input.mouseY, this.input.mouseDown)
    if (this.speaker === 'Colonel') {
      const t = performance.now() / 1000
      const rando = 0.1 + Math.random() * (1.6 - 0.1)
      if (t - this.mouthClock > rando) {
        this.mouthOpen = !this.mouthOpen
        this.mouthClock = t
      }
    } else this.mouthOpen = false
  }

  draw(ctx: CanvasRenderingContext2D) {
    const tex = this.assets.tex
    const sc = Math.min(W / 1600, H / 900)
    ctx.imageSmoothingEnabled = true
    ctx.fillStyle = '#000'
    ctx.fillRect(0, 0, W, H)
    if (this.langSelect) {
      ctx.drawImage(tex.story_back_closed, 0, 0, W, H)
      ctx.fillStyle = `rgba(0,0,0,${1 - 50 / 255})`
      ctx.fillRect(0, 0, W, H)
      text(ctx, 'Choose a language:', W / 2, H * (240 / 900), 15 * 1.8 * sc, '#fff')
      this.widgets.draw(ctx, tex, 5)
      return
    }
    ctx.drawImage(this.mouthOpen ? tex.story_back_open : tex.story_back_closed, 0, 0, W, H)
    const bw = 1300 * sc
    const bh = 279 * sc
    ctx.imageSmoothingEnabled = false
    ctx.drawImage(tex.diag_box, W / 2 - bw / 2, H - bh / 1.8 - bh / 2, bw, bh)
    const size = 15 * 1.5 * sc
    text(ctx, this.speaker, W * (250 / 1600), H * (660 / 900), size, '#000')
    ctx.font = `${size}px arcade`
    const anchor = W * (300 / 1600) - ctx.measureText('Hello Sergeant.').width / 2
    text(ctx, this.body, anchor, H * (760 / 900) - size / 2, size, '#000', 'left')
    this.widgets.draw(ctx, tex, 6)
  }
}
