<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { Color, Mesh, OrthographicCamera, PlaneGeometry, Scene, ShaderMaterial, Vector2, WebGLRenderer } from 'three'
import { reducedMotion } from '../lib/motion'
import { theme } from '../lib/state'

const canvas = ref<HTMLCanvasElement>()

const vertex = /* glsl */ `
  void main() {
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`

// A small raymarcher: four spheres blended into one glossy body, lit by a procedural studio.
const fragment = /* glsl */ `
  precision highp float;

  uniform float uTime;
  uniform vec2 uRes;
  uniform vec2 uMouse;
  uniform vec3 uAccent;
  uniform float uDark;

  float smin(float a, float b, float k) {
    float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
    return mix(b, a, h) - k * h * (1.0 - h);
  }

  float map(vec3 p) {
    float t = uTime * 0.45;
    float d = length(p - vec3(sin(t) * 0.5, cos(t * 0.8) * 0.3, 0.0)) - 0.62;
    d = smin(d, length(p - vec3(cos(t * 0.7) * 0.85, sin(t * 1.1) * 0.55, sin(t * 0.5) * 0.4)) - 0.36, 0.45);
    d = smin(d, length(p - vec3(-cos(t * 0.9) * 0.75, -sin(t * 0.6) * 0.65, cos(t * 0.4) * 0.3)) - 0.3, 0.45);
    d = smin(d, length(p - vec3(uMouse * 1.15, 0.35)) - 0.24, 0.55);
    return d;
  }

  vec3 normalAt(vec3 p) {
    vec2 e = vec2(0.0015, 0.0);
    return normalize(vec3(
      map(p + e.xyy) - map(p - e.xyy),
      map(p + e.yxy) - map(p - e.yxy),
      map(p + e.yyx) - map(p - e.yyx)
    ));
  }

  vec3 studio(vec3 d) {
    vec3 low = mix(vec3(0.16, 0.17, 0.2), vec3(0.01, 0.012, 0.02), uDark);
    vec3 high = mix(vec3(1.0), vec3(0.6, 0.68, 0.8), uDark);
    float g = smoothstep(-0.7, 0.9, d.y);
    vec3 c = mix(low, high, g * g);
    float band = smoothstep(0.16, 0.0, abs(d.y - 0.1 + 0.18 * sin(d.x * 3.0 + uTime * 0.2)));
    c += uAccent * band * 1.3;
    float box = smoothstep(0.8, 0.97, dot(d, normalize(vec3(0.5, 0.7, 0.5))));
    c += vec3(1.6) * box;
    return c;
  }

  void main() {
    vec2 uv = (gl_FragCoord.xy * 2.0 - uRes) / min(uRes.x, uRes.y);
    vec3 ro = vec3(0.0, 0.0, 3.3);
    vec3 rd = normalize(vec3(uv * 1.22, -1.7));

    float t = 0.0;
    float nearest = 1e3;
    bool hit = false;
    for (int i = 0; i < 72; i++) {
      float d = map(ro + rd * t);
      nearest = min(nearest, d);
      if (d < 0.001) { hit = true; break; }
      t += d;
      if (t > 7.0) break;
    }

    vec3 col = vec3(0.0);
    float alpha = 0.0;

    if (hit) {
      vec3 p = ro + rd * t;
      vec3 n = normalAt(p);
      vec3 l = normalize(vec3(0.5, 0.8, 0.6));
      float diff = max(dot(n, l), 0.0);
      float fres = pow(1.0 - max(dot(n, -rd), 0.0), 3.0);
      vec3 body = uAccent * (0.22 + 0.78 * diff);
      col = mix(body, studio(reflect(rd, n)), 0.3 + 0.7 * fres);
      alpha = 1.0;
    } else {
      // soft antialiased silhouette
      alpha = smoothstep(0.012, 0.0, nearest);
      col = uAccent * 0.5;
    }

    gl_FragColor = vec4(pow(col, vec3(0.4545)), alpha);
  }
`

function accent() {
  const value = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim()
  return new Color(value || '#0a7fd0')
}

let dispose: (() => void) | undefined

onMounted(() => {
  const el = canvas.value
  if (!el) return

  let renderer: WebGLRenderer
  try {
    renderer = new WebGLRenderer({ canvas: el, alpha: true, antialias: false, premultipliedAlpha: false })
  } catch {
    return // no WebGL: the hero simply shows without the object
  }

  const dpr = Math.min(window.devicePixelRatio, 1.5)
  renderer.setPixelRatio(dpr)
  renderer.setClearColor(0x000000, 0)

  const uniforms = {
    uTime: { value: 0 },
    uRes: { value: new Vector2(1, 1) },
    uMouse: { value: new Vector2(0, 0) },
    uAccent: { value: accent() },
    uDark: { value: theme.value === 'dark' ? 1 : 0 },
  }

  const scene = new Scene()
  const camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1)
  const geometry = new PlaneGeometry(2, 2)
  const material = new ShaderMaterial({ vertexShader: vertex, fragmentShader: fragment, uniforms, transparent: true })
  scene.add(new Mesh(geometry, material))

  const target = new Vector2(0, 0)
  let frame = 0
  let running = false
  let onScreen = true
  const start = performance.now()

  const resize = () => {
    const { width, height } = el.getBoundingClientRect()
    if (!width || !height) return
    renderer.setSize(width, height, false)
    uniforms.uRes.value.set(width * dpr, height * dpr)
    if (!running) renderer.render(scene, camera)
  }

  const tick = () => {
    uniforms.uTime.value = (performance.now() - start) / 1000
    uniforms.uMouse.value.lerp(target, 0.06)
    renderer.render(scene, camera)
    frame = requestAnimationFrame(tick)
  }

  const play = () => {
    if (running || reducedMotion || !onScreen || document.hidden) return
    running = true
    frame = requestAnimationFrame(tick)
  }

  const pause = () => {
    running = false
    cancelAnimationFrame(frame)
  }

  const onPointer = (e: PointerEvent) => {
    const r = el.getBoundingClientRect()
    target.set(
      Math.max(-1.2, Math.min(1.2, ((e.clientX - r.left) / r.width) * 2 - 1)),
      Math.max(-1.2, Math.min(1.2, -(((e.clientY - r.top) / r.height) * 2 - 1))),
    )
  }

  const onVisibility = () => (document.hidden ? pause() : play())

  const io = new IntersectionObserver(([entry]) => {
    onScreen = entry.isIntersecting
    if (onScreen) play()
    else pause()
  })
  io.observe(el)

  const ro = new ResizeObserver(resize)
  ro.observe(el)

  window.addEventListener('pointermove', onPointer, { passive: true })
  document.addEventListener('visibilitychange', onVisibility)

  const stopTheme = watch(theme, (value) => {
    uniforms.uDark.value = value === 'dark' ? 1 : 0
    uniforms.uAccent.value = accent()
    if (!running) renderer.render(scene, camera)
  })

  resize()
  play()

  dispose = () => {
    pause()
    stopTheme()
    io.disconnect()
    ro.disconnect()
    window.removeEventListener('pointermove', onPointer)
    document.removeEventListener('visibilitychange', onVisibility)
    geometry.dispose()
    material.dispose()
    renderer.dispose()
  }
})

onBeforeUnmount(() => dispose?.())
</script>

<template>
  <canvas ref="canvas" class="orb" aria-hidden="true" />
</template>

<style scoped>
.orb {
  width: 100%;
  height: 100%;
}
</style>
