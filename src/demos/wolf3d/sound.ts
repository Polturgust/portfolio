// The game's sfSound behaviour on top of Web Audio: play() restarts a playing
// sound and resumes a paused one, pause() keeps the position, loops repeat.

export type Status = 'stopped' | 'paused' | 'playing'

export class Sound {
  private source: AudioBufferSourceNode | null = null
  private gain: GainNode
  private startedAt = 0
  private offset = 0
  status: Status = 'stopped'

  constructor(
    private ctx: AudioContext,
    private buffer: AudioBuffer | null,
    private loop = false,
  ) {
    this.gain = ctx.createGain()
    this.gain.connect(ctx.destination)
  }

  setVolume(volume: number) {
    this.gain.gain.value = Math.max(0, volume) / 100
  }

  play() {
    if (!this.buffer) return
    if (this.status === 'playing') this.offset = 0
    this.stopSource()
    const src = this.ctx.createBufferSource()
    src.buffer = this.buffer
    src.loop = this.loop
    src.connect(this.gain)
    src.onended = () => {
      if (this.source === src && !this.loop) {
        this.status = 'stopped'
        this.offset = 0
      }
    }
    src.start(0, this.offset % this.buffer.duration)
    this.startedAt = this.ctx.currentTime - this.offset
    this.source = src
    this.status = 'playing'
  }

  pause() {
    if (this.status !== 'playing' || !this.buffer) return
    this.offset = (this.ctx.currentTime - this.startedAt) % this.buffer.duration
    this.stopSource()
    this.status = 'paused'
  }

  stop() {
    this.stopSource()
    this.offset = 0
    this.status = 'stopped'
  }

  private stopSource() {
    if (!this.source) return
    const src = this.source
    this.source = null
    src.onended = null
    try {
      src.stop()
    } catch {
      /* already stopped */
    }
  }
}

/** Long music tracks stream from the network instead of being decoded up front. */
export class Music {
  private el: HTMLAudioElement
  status: Status = 'stopped'

  constructor(url: string) {
    this.el = new Audio(url)
    this.el.loop = true
    this.el.preload = 'none'
  }

  setVolume(volume: number) {
    this.el.volume = Math.min(1, Math.max(0, volume / 100))
  }

  play() {
    this.status = 'playing'
    this.el.play().catch(() => {
      this.status = 'paused'
    })
  }

  pause() {
    if (this.status !== 'playing') return
    this.el.pause()
    this.status = 'paused'
  }

  stop() {
    this.el.pause()
    this.el.currentTime = 0
    this.status = 'stopped'
  }
}
