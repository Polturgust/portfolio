<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import '@xterm/xterm/css/xterm.css'
import { V86 } from 'v86/build/libv86.mjs'
import wasmUrl from 'v86/build/v86.wasm?url'
import { asset, copy } from '../../lib/state'
import '../demo.css'

const t = () => copy.value.demo.myshell

// Commands checked against the real 42sh in this VM.
// Full commands, checked against the real 42sh: simple ones first, then one per feature.
const examples = [
  'ls -la',
  'cat fruits.txt | grep a | sort -r',
  'echo "hello $USER" > hi.txt && cat hi.txt',
  'ls nothere || echo "ls failed with status $status"',
  'sort < fruits.txt | head -n 2 > top.txt ; cat top.txt',
  'set n = 3 ; repeat $n echo hi',
  'echo `ls *.txt | wc -l` text files in $cwd',
  '(cd projects && ./hello.sh) ; pwd',
  'sleep 10 & jobs',
  'history',
]

const host = ref<HTMLElement>()
const status = ref<'downloading' | 'booting' | 'ready' | 'error'>('downloading')
const progress = ref(0)

let term: Terminal | undefined
let fit: FitAddon | undefined
let emulator: V86 | undefined
let pending: number[] = []
let flushQueued = false
let seen = ''
let welcomed = false
let resize: ResizeObserver | undefined

const file = (name: string) => ({ url: asset(`demos/myshell/${name}`) })

function flush() {
  flushQueued = false
  if (!pending.length || !term) return
  term.write(new Uint8Array(pending)) // xterm decodes UTF-8, so the shell's ➜ prompt shows correctly
  pending = []
}

function onByte(byte: number) {
  pending.push(byte)
  if (status.value !== 'ready') {
    seen = (seen + String.fromCharCode(byte)).slice(-64)
    if (!welcomed && seen.includes('Try:')) {
      welcomed = true
      seen = ''
    }
    // the prompt's "➜" (UTF-8 e2 9e 9c) appears once the welcome text is out
    if (welcomed && seen.includes('\u00e2\u009e\u009c')) status.value = 'ready'
  }
  if (!flushQueued) {
    flushQueued = true
    requestAnimationFrame(flush)
  }
}

function run(command: string) {
  if (status.value !== 'ready') return
  emulator?.serial0_send('\x15' + command + '\r')
  term?.focus()
}

function restart() {
  status.value = 'booting'
  seen = ''
  welcomed = false
  term?.reset()
  emulator?.restart()
}

onMounted(async () => {
  // wait for the dialog's layout to settle so the terminal is measured at its real size
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
  if (!host.value) return

  term = new Terminal({
    convertEol: false,
    cursorBlink: true,
    fontFamily: "'JetBrains Mono Variable', ui-monospace, monospace",
    fontSize: window.innerWidth < 600 ? 12 : 14,
    theme: { background: '#0f1114', foreground: '#e6e4de', cursor: '#3aa6f2', selectionBackground: '#3aa6f255' },
    scrollback: 2000,
  })
  fit = new FitAddon()
  term.loadAddon(fit)
  term.open(host.value)
  fit.fit()

  // The guest's init reads these from the kernel command line and sets the tty size.
  const cols = Math.max(40, term.cols)
  const rows = Math.max(12, term.rows)

  try {
    emulator = new V86({
      wasm_path: wasmUrl,
      bios: file('seabios.bin'),
      vga_bios: file('vgabios.bin'),
      bzimage: file('bzImage'),
      initrd: file('initramfs.cpio.gz'),
      cmdline: `console=ttyS0 quiet loglevel=0 tsc=reliable mitigations=off random.trust_cpu=on term_cols=${cols} term_rows=${rows}`,
      memory_size: 128 * 1024 * 1024,
      autostart: true,
      disable_keyboard: true,
      disable_mouse: true,
      disable_speaker: true,
    })
  } catch {
    status.value = 'error'
    return
  }

  emulator.add_listener('download-progress', (e: { loaded: number; total: number; file_index: number; file_count: number }) => {
    const share = 1 / e.file_count
    const part = e.total ? e.loaded / e.total : 0
    progress.value = Math.round((e.file_index * share + part * share) * 100)
  })
  emulator.add_listener('emulator-loaded', () => {
    status.value = 'booting'
  })
  emulator.add_listener('serial0-output-byte', onByte)

  term.onData((data) => emulator?.serial0_send(data))
  resize = new ResizeObserver(() => fit?.fit())
  resize.observe(host.value)
  term.focus()
})

onBeforeUnmount(() => {
  resize?.disconnect()
  emulator?.destroy()
  term?.dispose()
})
</script>

<template>
  <div class="lab">
    <div class="sh__main">
      <div class="sh__frame" :aria-label="t().terminalLabel" role="application">
        <div ref="host" class="sh__term" />
        <p v-if="status !== 'ready'" class="sh__overlay mono" aria-live="polite">
          <template v-if="status === 'downloading'">{{ t().downloading }} {{ progress }}%</template>
          <template v-else-if="status === 'booting'">{{ t().booting }}</template>
          <template v-else>{{ copy.demo.failed }}</template>
        </p>
      </div>
      <p class="mono sh__status">
        <span>{{ status === 'ready' ? t().ready : ' ' }}</span>
        <span class="muted">{{ t().keys }}</span>
      </p>
    </div>

    <div class="lab__panel">
      <p class="sh__hint">{{ t().typeHint }}</p>
      <p class="lab__note">{{ t().note }}</p>
      <p class="mono lab__label">{{ t().examples }}</p>
      <ul class="sh__examples">
        <li v-for="example in examples" :key="example">
          <button class="sh__example mono" type="button" :disabled="status !== 'ready'" @click="run(example)">
            {{ example }}
          </button>
        </li>
      </ul>
      <div class="lab__buttons">
        <button class="lab__btn" type="button" :disabled="status === 'downloading'" @click="restart">
          {{ t().restart }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.sh__main {
  display: grid;
  gap: 12px;
  min-width: 0;
}

.sh__frame {
  position: relative;
  overflow: hidden;
  height: min(68vh, 620px);
  padding: 12px;
  border-radius: 6px;
  background: #0f1114;
}

.sh__term {
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.sh__overlay {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  color: #e6e4de;
  background: rgba(15, 17, 20, 0.85);
  border-radius: 6px;
}

.sh__status {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 8px 20px;
  color: var(--accent);
}

.sh__hint {
  padding: 12px 14px;
  border-left: 3px solid var(--accent);
  background: color-mix(in srgb, var(--accent) 8%, transparent);
  border-radius: 4px;
  line-height: 1.45;
}

.sh__examples {
  display: grid;
  gap: 6px;
}

.sh__example {
  width: 100%;
  padding: 9px 12px;
  border: 1px solid var(--line);
  border-radius: 6px;
  text-align: left;
  text-transform: none;
  letter-spacing: 0;
  font-size: 0.8rem;
  transition:
    background-color 0.3s,
    color 0.3s;
}

.sh__example:hover:not(:disabled) {
  background: var(--ink);
  color: var(--bg);
}

.sh__example:disabled {
  opacity: 0.45;
  cursor: default;
}

@media (max-width: 600px) {
  .sh__frame {
    height: 60vh;
    padding: 6px;
  }
}
</style>
