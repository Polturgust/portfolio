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

Four projects have a "Try a demo" button. my-shell runs in full, Wolf3D is the whole game ported to TypeScript, and the other two run one part of their project. Each demo says which on screen:

| Project | What runs |
| --- | --- |
| polaroid-forge | The project's own `render.py`, unmodified, on Pyodide (`public/demos/polaroid/`) |
| Raytracer | The original C++ scene reader, renderer and plugins compiled to WebAssembly (`public/demos/raytracer/`) |
| my-shell | The whole 42sh, unmodified, on a minimal Linux booted in the browser by the v86 emulator (`public/demos/myshell/`) |
| Wolf3D | The whole game (without the story intro) — menus, settings, saves, upgrades — ported from the C source to TypeScript, with the original assets (`src/demos/wolf3d/`) |

Rebuild the raytracer module after changing the C++ (needs Docker):

```bash
./demos/raytracer/build.sh
```

Rebuild the my-shell Linux guest (needs Docker):

```bash
./demos/myshell/build.sh
```

Re-convert the Wolf3D assets (needs Docker):

```bash
./demos/wolf3d/build-assets.sh
```

## Where things live

- `src/i18n/` — all copy, English and French
- `src/data/projects.ts` — projects, links, contact details
- `src/lib/motion.ts` — animation directives (`v-reveal`, `v-lines`, `v-parallax`, …)
- `src/components/` — one component per section
- `src/demos/` — the live demos, each loaded only when opened
- `public/img/`, `public/cv/` — images and the downloadable CV
