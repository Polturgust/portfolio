/// <reference lib="webworker" />
// Runs the project's own render.py under Pyodide, off the main thread.

const PYODIDE = 'https://cdn.jsdelivr.net/pyodide/v0.27.2/full/'

export type Request =
  | { type: 'init'; renderUrl: string }
  | { type: 'load'; bytes: ArrayBuffer }
  | { type: 'render'; id: number; intensity: number; fade: number; leaks: number; seed: number; size: number }

export type Response =
  | { type: 'ready' }
  | { type: 'loaded' }
  | { type: 'rendered'; id: number; bytes: ArrayBuffer; ms: number }
  | { type: 'error'; message: string }

interface Pyodide {
  loadPackage(name: string): Promise<void>
  runPython(code: string): unknown
  FS: { writeFile(path: string, data: Uint8Array | string): void }
  globals: { get(name: string): (...args: unknown[]) => { toJs(): Uint8Array; destroy(): void } | undefined }
}

let py: Pyodide | undefined

const glue = `
import io, sys
sys.path.insert(0, '/demo')
import render  # the project's module, untouched

_working = None

def demo_load(path):
    global _working
    img = render.load_working(path)
    img.thumbnail((1600, 1600))  # keep preview renders quick
    _working = img

def demo_render(intensity, fade, leaks, seed, size):
    card = render.render(
        None,
        intensity=intensity,
        look={'fade': fade, 'leaks': leaks, 'leak_seed': seed},
        photo_size=size,
        working=_working,
    )
    out = io.BytesIO()
    card.save(out, 'JPEG', quality=90)
    return out.getvalue()
`

const post = (message: Response, transfer: Transferable[] = []) =>
  (self as DedicatedWorkerGlobalScope).postMessage(message, transfer)

self.onmessage = async (event: MessageEvent<Request>) => {
  const msg = event.data
  try {
    if (msg.type === 'init') {
      const { loadPyodide } = await import(/* @vite-ignore */ `${PYODIDE}pyodide.mjs`)
      const instance: Pyodide = await loadPyodide({ indexURL: PYODIDE })
      await instance.loadPackage('pillow')
      const source = await (await fetch(msg.renderUrl)).text()
      instance.runPython(`import os\nos.makedirs('/demo', exist_ok=True)`)
      instance.FS.writeFile('/demo/render.py', source)
      instance.runPython(glue)
      py = instance
      post({ type: 'ready' })
    } else if (msg.type === 'load' && py) {
      py.FS.writeFile('/demo/input', new Uint8Array(msg.bytes))
      py.globals.get('demo_load')('/demo/input')
      post({ type: 'loaded' })
    } else if (msg.type === 'render' && py) {
      const started = performance.now()
      const result = py.globals.get('demo_render')(msg.intensity, msg.fade, msg.leaks, msg.seed, msg.size)!
      const bytes = result.toJs().slice().buffer
      result.destroy()
      post({ type: 'rendered', id: msg.id, bytes, ms: performance.now() - started }, [bytes])
    }
  } catch (error) {
    post({ type: 'error', message: error instanceof Error ? error.message : String(error) })
  }
}
