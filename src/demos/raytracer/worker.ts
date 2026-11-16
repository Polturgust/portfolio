/// <reference lib="webworker" />
// Drives the WebAssembly build of the raytracer, a few rows at a time.

export type Request =
  | { type: 'init'; baseUrl: string }
  | { type: 'render'; job: number; scene: string; width: number; height: number }

export type Response =
  | { type: 'ready' }
  | { type: 'start'; job: number; width: number; height: number; objects: number; lights: number }
  | { type: 'rows'; job: number; y: number; rows: number; pixels: ArrayBuffer }
  | { type: 'done'; job: number; ms: number }
  | { type: 'error'; job: number; message: string }

interface RaytracerModule {
  cwrap(name: string, ret: string | null, args: string[]): (...args: unknown[]) => number
  HEAPU8: Uint8Array
  UTF8ToString(ptr: number): string
  _malloc(size: number): number
  _free(ptr: number): void
}

const ROWS_PER_STEP = 6

let wasm: RaytracerModule | undefined
let current = 0

const post = (message: Response, transfer: Transferable[] = []) =>
  (self as DedicatedWorkerGlobalScope).postMessage(message, transfer)

async function render(job: number, scene: string, width: number, height: number) {
  const m = wasm!
  const load = m.cwrap('rt_load', 'number', ['string', 'number', 'number'])
  const rows = m.cwrap('rt_render_rows', null, ['number', 'number', 'number'])
  const count = (name: string) => m.cwrap(name, 'number', [])()

  if (!load(scene, width, height)) {
    post({ type: 'error', job, message: m.UTF8ToString(m.cwrap('rt_error', 'number', [])()) })
    return
  }

  const w = count('rt_width')
  const h = count('rt_height')
  post({ type: 'start', job, width: w, height: h, objects: count('rt_object_count'), lights: count('rt_light_count') })

  const started = performance.now()
  const buffer = m._malloc(w * 4 * ROWS_PER_STEP)
  try {
    for (let y = 0; y < h; y += ROWS_PER_STEP) {
      if (job !== current) return // a newer render replaced this one
      const n = Math.min(ROWS_PER_STEP, h - y)
      rows(y, y + n, buffer)
      const pixels = m.HEAPU8.slice(buffer, buffer + w * 4 * n).buffer
      post({ type: 'rows', job, y, rows: n, pixels }, [pixels])
      await new Promise((resolve) => setTimeout(resolve)) // let a new request in
    }
    post({ type: 'done', job, ms: performance.now() - started })
  } finally {
    m._free(buffer)
  }
}

self.onmessage = async (event: MessageEvent<Request>) => {
  const msg = event.data
  try {
    if (msg.type === 'init') {
      const factory = (await import(/* @vite-ignore */ `${msg.baseUrl}raytracer.mjs`)).default
      wasm = await factory({ locateFile: (file: string) => msg.baseUrl + file })
      post({ type: 'ready' })
    } else if (wasm) {
      current = msg.job
      await render(msg.job, msg.scene, msg.width, msg.height)
    }
  } catch (error) {
    post({ type: 'error', job: current, message: error instanceof Error ? error.message : String(error) })
  }
}
