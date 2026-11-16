import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'
import Lenis from 'lenis'
import type { Directive } from 'vue'

gsap.registerPlugin(ScrollTrigger, SplitText)

export const reducedMotion =
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

export const finePointer =
  typeof window !== 'undefined' && window.matchMedia('(hover: hover) and (pointer: fine)').matches

/* ---------- smooth scroll ---------- */

let lenis: Lenis | null = null

export function initSmoothScroll() {
  if (reducedMotion || lenis) return
  lenis = new Lenis({ lerp: 0.1, anchors: true })
  lenis.on('scroll', ScrollTrigger.update)
  gsap.ticker.add((time) => lenis?.raf(time * 1000))
  gsap.ticker.lagSmoothing(0)
}

export function lockScroll(locked: boolean) {
  document.documentElement.classList.toggle('is-locked', locked)
  if (locked) lenis?.stop()
  else lenis?.start()
}

export function scrollVelocity() {
  return lenis?.velocity ?? 0
}

/* ---------- directives ---------- */

type Cleanup = (() => void) | void

function motionDirective<T>(setup: (el: HTMLElement, value: T) => Cleanup): Directive<HTMLElement, T> {
  const contexts = new WeakMap<HTMLElement, { ctx: gsap.Context; cleanup: Cleanup }>()
  return {
    mounted(el, binding) {
      if (reducedMotion) return
      let cleanup: Cleanup = undefined
      const ctx = gsap.context(() => {
        cleanup = setup(el, binding.value)
      })
      contexts.set(el, { ctx, cleanup })
    },
    unmounted(el) {
      const entry = contexts.get(el)
      if (!entry) return
      if (entry.cleanup) entry.cleanup()
      entry.ctx.revert()
      contexts.delete(el)
    },
  }
}

/** Fade + rise when the element scrolls into view. Value = delay in seconds. */
export const vReveal = motionDirective<number | undefined>((el, delay) => {
  gsap.from(el, {
    y: 36,
    autoAlpha: 0,
    duration: 1.1,
    ease: 'expo.out',
    delay: delay ?? 0,
    scrollTrigger: { trigger: el, start: 'top 90%', once: true },
  })
})

/** Children fade + rise one after another. */
export const vStagger = motionDirective<number | undefined>((el, each) => {
  gsap.from(el.children, {
    y: 28,
    autoAlpha: 0,
    duration: 0.9,
    ease: 'expo.out',
    stagger: each ?? 0.06,
    scrollTrigger: { trigger: el, start: 'top 88%', once: true },
  })
})

/** Text revealed line by line from behind a mask. Value = delay in seconds. */
export const vLines = motionDirective<number | undefined>((el, delay) => {
  SplitText.create(el, {
    type: 'lines',
    mask: 'lines',
    linesClass: 'line',
    autoSplit: true,
    onSplit: (self) =>
      gsap.from(self.lines, {
        yPercent: 110,
        duration: 1.15,
        ease: 'expo.out',
        stagger: 0.08,
        delay: delay ?? 0,
        scrollTrigger: { trigger: el, start: 'top 90%', once: true },
      }),
  })
})

/** Horizontal rule that draws itself. */
export const vDraw = motionDirective<void>((el) => {
  gsap.from(el, {
    scaleX: 0,
    duration: 1.4,
    ease: 'expo.inOut',
    scrollTrigger: { trigger: el, start: 'top 92%', once: true },
  })
})

/** Vertical drift tied to scroll. Value = percent of travel. */
export const vParallax = motionDirective<number | undefined>((el, amount) => {
  const amt = amount ?? 10
  gsap.fromTo(
    el,
    { yPercent: -amt },
    {
      yPercent: amt,
      ease: 'none',
      scrollTrigger: {
        trigger: el.parentElement ?? el,
        start: 'top bottom',
        end: 'bottom top',
        scrub: true,
      },
    },
  )
})

/** Image frame opening with a clip-path wipe. */
export const vUnveil = motionDirective<void>((el) => {
  gsap.fromTo(
    el,
    { clipPath: 'inset(100% 0% 0% 0%)' },
    {
      clipPath: 'inset(0% 0% 0% 0%)',
      duration: 1.5,
      ease: 'expo.inOut',
      scrollTrigger: { trigger: el, start: 'top 88%', once: true },
    },
  )
  const media = el.querySelector('img, video')
  if (media) {
    gsap.from(media, {
      scale: 1.35,
      duration: 1.9,
      ease: 'expo.out',
      scrollTrigger: { trigger: el, start: 'top 88%', once: true },
    })
  }
})

/** Element pulled towards the pointer. Value = strength (0–1). */
export const vMagnetic = motionDirective<number | undefined>((el, strength) => {
  if (!finePointer) return
  const k = strength ?? 0.3
  const xTo = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'power3.out' })
  const yTo = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'power3.out' })
  const move = (e: PointerEvent) => {
    const r = el.getBoundingClientRect()
    xTo((e.clientX - (r.left + r.width / 2)) * k)
    yTo((e.clientY - (r.top + r.height / 2)) * k)
  }
  const leave = () => {
    xTo(0)
    yTo(0)
  }
  el.addEventListener('pointermove', move)
  el.addEventListener('pointerleave', leave)
  return () => {
    el.removeEventListener('pointermove', move)
    el.removeEventListener('pointerleave', leave)
  }
})

export { gsap, ScrollTrigger, SplitText }
