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

## Live demos

Three projects have a "Try a demo" button. Each demo runs one part of the project in the browser, not the whole thing, and says so on screen:

| Project | What runs |
| --- | --- |
| polaroid-forge | The project's own `render.py`, unmodified, on Pyodide (`public/demos/polaroid/`) |
| Raytracer | The original C++ scene reader, renderer and plugins compiled to WebAssembly (`public/demos/raytracer/`) |
| Wolf3D | A TypeScript port of the raycaster and map generator (`src/demos/wolf3d/`) |

Rebuild the raytracer module after changing the C++ (needs Docker):

```bash
./demos/raytracer/build.sh
```

## Where things live

- `src/i18n/` — all copy, English and French
- `src/data/projects.ts` — projects, links, contact details
- `src/lib/motion.ts` — animation directives (`v-reveal`, `v-lines`, `v-parallax`, …)
- `src/components/` — one component per section
- `src/demos/` — the live demos, each loaded only when opened
- `public/img/`, `public/cv/` — images and the downloadable CV
