# Portfolio

Personal portfolio of Florent Serra — software developer, Epitech Nice.

Single-page site in English and French, light and dark themes.

## Stack

- Vue 3 + Vite + TypeScript
- GSAP (ScrollTrigger, SplitText) and Lenis for scroll-driven animation
- Three.js for the raymarched object in the hero

## Develop

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

Set `VITE_BASE` when the site is served from a sub-path (the Pages workflow does this automatically).

## Where things live

- `src/i18n/` — all copy, English and French
- `src/data/projects.ts` — projects, links, contact details
- `src/lib/motion.ts` — animation directives (`v-reveal`, `v-lines`, `v-parallax`, …)
- `src/components/` — one component per section
- `public/img/`, `public/cv/` — images and the downloadable CV
