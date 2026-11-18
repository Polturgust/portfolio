export type ProjectId = 'raytracer' | 'zappy' | 'teams' | 'wolf3d' | 'myshell' | 'zelmon' | 'polaroid'

export type Media =
  | { kind: 'image'; src: string; width: number; height: number }
  | { kind: 'video'; src: string; poster: string; width: number; height: number }
  | { kind: 'terminal'; title: string; lines: TerminalLine[] }

/** One line of a recorded terminal session: a command after `prompt`, or plain output. */
export interface TerminalLine {
  prompt?: string
  text: string
}

export interface Project {
  id: ProjectId
  title: string
  stack: string[]
  repo: string
  media: Media[]
  /**
   * 'full' runs the whole project unmodified, 'original' runs part of the project's own
   * source, 'port' is a rewrite of part of it for the web.
   */
  demo?: 'full' | 'original' | 'port'
}

const gh = (name: string) => `https://github.com/Polturgust/${name}`

export const projects: Project[] = [
  {
    id: 'raytracer',
    title: 'Raytracer',
    stack: ['C++', 'CMake', 'SFML'],
    repo: gh('Raytracer'),
    demo: 'original',
    media: [
      { kind: 'image', src: 'img/projects/raytracer-1.webp', width: 1280, height: 720 },
      { kind: 'image', src: 'img/projects/raytracer-2.webp', width: 1600, height: 900 },
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
    id: 'wolf3d',
    title: 'Wolf3D',
    stack: ['C', 'CSFML'],
    repo: gh('Wolf3D'),
    demo: 'port',
    media: [
      { kind: 'image', src: 'img/projects/wolf3d-1.webp', width: 1598, height: 900 },
      { kind: 'image', src: 'img/projects/wolf3d-2.webp', width: 1594, height: 895 },
    ],
  },
  {
    id: 'myshell',
    title: 'my-shell (42sh)',
    stack: ['C', 'POSIX', 'Makefile'],
    repo: gh('my-shell'),
    demo: 'full',
    media: [
      {
        kind: 'terminal',
        title: '42sh',
        // Recorded from the live demo.
        lines: [
          { prompt: '➜', text: 'cat fruits.txt | grep ap | sort -r' },
          { text: 'apricot' },
          { text: 'apple' },
          { prompt: '➜', text: 'echo hello > note.txt ; cat < note.txt' },
          { text: 'hello' },
          { prompt: '➜', text: 'false || echo fallback' },
          { text: 'fallback' },
          { prompt: '➜', text: 'ls *.t?t' },
          { text: 'fruits.txt  note.txt  notes.txt' },
        ],
      },
    ],
  },
  {
    id: 'polaroid',
    title: 'polaroid-forge',
    stack: ['Python', 'Pillow'],
    repo: gh('polaroid-forge'),
    demo: 'original',
    media: [
      { kind: 'image', src: 'img/projects/polaroid-1.webp', width: 1600, height: 1000 },
      { kind: 'image', src: 'img/projects/polaroid-2.webp', width: 1600, height: 500 },
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
    media: [
      {
        kind: 'terminal',
        title: 'myteams',
        lines: [
          { prompt: '$', text: './myteams_server 4242' },
          { prompt: '$', text: './myteams_cli 127.0.0.1 4242' },
          { prompt: '>', text: '/login "flo"' },
          { prompt: '>', text: '/help' },
        ],
      },
    ],
  },
]

export type MoreId = 'maze' | 'radar' | 'hunter' | 'ls'

export const moreProjects: { id: MoreId; title: string; lang: string; repo: string }[] = [
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
