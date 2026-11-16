export type ProjectId = 'raytracer' | 'zappy' | 'teams' | 'wolf3d' | 'zelmon' | 'polaroid'

export type Media =
  | { kind: 'image'; src: string; width: number; height: number }
  | { kind: 'video'; src: string; poster: string; width: number; height: number }
  | { kind: 'terminal' }

export interface Project {
  id: ProjectId
  title: string
  stack: string[]
  repo: string
  media: Media[]
}

const gh = (name: string) => `https://github.com/Polturgust/${name}`

export const projects: Project[] = [
  {
    id: 'raytracer',
    title: 'Raytracer',
    stack: ['C++', 'CMake', 'SFML'],
    repo: gh('Raytracer'),
    media: [
      { kind: 'image', src: 'img/projects/raytracer-1.webp', width: 1280, height: 720 },
      { kind: 'image', src: 'img/projects/raytracer-2.webp', width: 1600, height: 900 },
    ],
  },
  {
    id: 'zappy',
    title: 'Zappy',
    stack: ['C', 'C++', 'Python'],
    repo: gh('Zappy'),
    media: [
      { kind: 'image', src: 'img/projects/zappy-1.webp', width: 912, height: 507 },
      { kind: 'image', src: 'img/projects/zappy-2.webp', width: 912, height: 507 },
    ],
  },
  {
    id: 'teams',
    title: 'Teams from scratch',
    stack: ['C++17', 'TCP', 'Makefile'],
    repo: gh('Teams-from-scratch'),
    media: [{ kind: 'terminal' }],
  },
  {
    id: 'wolf3d',
    title: 'Wolf3D',
    stack: ['C', 'CSFML'],
    repo: gh('Wolf3D'),
    media: [
      { kind: 'image', src: 'img/projects/wolf3d-1.webp', width: 1598, height: 900 },
      { kind: 'image', src: 'img/projects/wolf3d-2.webp', width: 1594, height: 895 },
    ],
  },
  {
    id: 'zelmon',
    title: 'Zelmon',
    stack: ['Python', 'Pygame', 'SQLite'],
    repo: gh('Zelmon-project'),
    media: [
      {
        kind: 'video',
        src: 'img/projects/zelmon.mp4',
        poster: 'img/projects/zelmon-poster.webp',
        width: 640,
        height: 480,
      },
    ],
  },
  {
    id: 'polaroid',
    title: 'polaroid-forge',
    stack: ['Python', 'Pillow'],
    repo: gh('polaroid-forge'),
    media: [
      { kind: 'image', src: 'img/projects/polaroid-1.webp', width: 1600, height: 1000 },
      { kind: 'image', src: 'img/projects/polaroid-2.webp', width: 1600, height: 500 },
    ],
  },
]

export type MoreId = 'shell' | 'maze' | 'radar' | 'hunter' | 'ls'

export const moreProjects: { id: MoreId; title: string; lang: string; repo: string }[] = [
  { id: 'shell', title: 'my-shell (42sh)', lang: 'C', repo: gh('my-shell') },
  { id: 'maze', title: 'a-maze-d', lang: 'C', repo: gh('a-maze-d') },
  { id: 'radar', title: 'my-radar', lang: 'C', repo: gh('my-radar') },
  { id: 'hunter', title: 'my-hunter', lang: 'C', repo: gh('my-hunter') },
  { id: 'ls', title: 'my-ls', lang: 'C', repo: gh('my-ls') },
]

export const links = {
  email: 'florent.serra@epitech.eu',
  phone: '+33 6 95 24 53 44',
  phoneHref: '+33695245344',
  github: 'https://github.com/Polturgust',
  linkedin: 'https://www.linkedin.com/in/florent-serra-81759927a',
  linktree: 'https://linktr.ee/florent_serra',
  cv: 'cv/Florent-Serra-CV-EN.pdf',
}

export const marquee = [
  'C',
  'C++',
  'Python',
  'Rust',
  'Haskell',
  'JavaScript',
  'Bash',
  'Linux',
  'Git',
  'Jenkins',
  'CMake',
  'OpenCV',
  'FAISS',
  'MySQL',
  'SQLite',
  'SFML',
  'Vue.js',
]
