// Keyboard, mouse (with pointer lock for looking around) and gamepad state.

export type InputEvent =
  | { type: 'keydown' | 'keyup'; code: string }
  | { type: 'mousedown' | 'mouseup'; button: number }

const DEADZONE = 15

export class Input {
  keys = new Set<string>()
  mouseX = 800
  mouseY = 450
  mouseDown = false
  lookX = 0
  lookY = 0
  events: InputEvent[] = []
  private cleanup: (() => void)[] = []

  constructor(private canvas: HTMLCanvasElement, private gameKeys: () => Set<string>) {
    const on = <K extends keyof WindowEventMap>(
      target: Window | Document | HTMLElement,
      type: K,
      fn: (e: WindowEventMap[K]) => void,
      capture = false,
    ) => {
      target.addEventListener(type, fn as EventListener, capture)
      this.cleanup.push(() => target.removeEventListener(type, fn as EventListener, capture))
    }
    on(window, 'keydown', (e) => this.key(e, true), true)
    on(window, 'keyup', (e) => this.key(e, false), true)
    on(window, 'blur', () => {
      this.keys.clear()
      this.mouseDown = false
    })
    on(canvas, 'mousedown', (e) => {
      this.pointer(e)
      if (e.button === 0) this.mouseDown = true
      this.events.push({ type: 'mousedown', button: e.button })
    })
    on(window, 'mouseup', (e) => {
      if (e.button === 0) this.mouseDown = false
      this.events.push({ type: 'mouseup', button: e.button })
    })
    on(window, 'mousemove', (e) => {
      if (document.pointerLockElement === canvas) {
        this.lookX += e.movementX
        this.lookY += e.movementY
      } else this.pointer(e)
    })
    on(canvas, 'contextmenu', (e) => e.preventDefault())
  }

  private pointer(e: MouseEvent) {
    const r = this.canvas.getBoundingClientRect()
    this.mouseX = ((e.clientX - r.left) * this.canvas.width) / r.width
    this.mouseY = ((e.clientY - r.top) * this.canvas.height) / r.height
  }

  private key(e: KeyboardEvent, down: boolean) {
    if (e.target instanceof HTMLElement && e.target.closest('input, textarea, select')) return
    // Keep the page from scrolling, the browser menu from opening on Alt and the
    // dialog from closing on Escape while the game uses those keys.
    if (this.gameKeys().has(e.code) || e.code === 'Escape' || e.key === 'Alt') e.preventDefault()
    if (down) {
      if (!e.repeat) this.events.push({ type: 'keydown', code: e.code })
      this.keys.add(e.code)
    } else {
      this.keys.delete(e.code)
      this.events.push({ type: 'keyup', code: e.code })
    }
  }

  takeLook() {
    const look = [this.lookX, this.lookY]
    this.lookX = 0
    this.lookY = 0
    return look
  }

  locked() {
    return document.pointerLockElement === this.canvas
  }

  lock() {
    if (!this.locked()) this.canvas.requestPointerLock?.()?.catch?.(() => {})
  }

  unlock() {
    if (this.locked()) document.exitPointerLock()
  }

  /** First connected gamepad, mapped like sfJoystick (axes in -100..100). */
  pad() {
    const p = navigator.getGamepads?.().find((g) => g)
    if (!p) return null
    const axis = (i: number) => {
      const v = (p.axes[i] ?? 0) * 100
      return Math.abs(v) > DEADZONE ? v : 0
    }
    const button = (i: number) => !!p.buttons[i]?.pressed
    return { x: axis(0), y: axis(1), u: axis(2), v: axis(3), button }
  }

  destroy() {
    this.cleanup.forEach((fn) => fn())
    this.unlock()
  }
}

const NAMES: Record<string, string> = {
  Space: 'SPACE',
  ShiftLeft: 'Left Shift',
  ShiftRight: 'Right Shift',
  ControlLeft: 'Left Ctrl',
  ControlRight: 'Right Ctrl',
  AltLeft: 'Left Alt',
  AltRight: 'Right Alt',
  Enter: '↩',
  Tab: '↹',
  Backspace: 'Backspace',
  ArrowLeft: '←',
  ArrowRight: '→',
  ArrowUp: '↑',
  ArrowDown: '↓',
}

let layout: Map<string, string> | null = null

/** Read the keyboard layout so W shows as Z on an AZERTY keyboard. */
export async function loadLayout() {
  try {
    const kb = (navigator as unknown as { keyboard?: { getLayoutMap(): Promise<Map<string, string>> } })
      .keyboard
    layout = kb ? await kb.getLayoutMap() : null
  } catch {
    layout = null
  }
}

export function keyName(code: string) {
  if (NAMES[code]) return NAMES[code]
  const mapped = layout?.get(code)
  if (mapped) return mapped.toUpperCase()
  if (code.startsWith('Key')) return code.slice(3)
  if (code.startsWith('Digit')) return code.slice(5)
  return code
}
