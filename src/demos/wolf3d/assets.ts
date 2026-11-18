// Loads the game's own textures, sounds, font and story files (converted for the
// web by demos/wolf3d/build-assets.sh).

export const TEXTURES = [
  'amo', 'background_menu', 'button', 'button_clic', 'cor_rect', 'crosshair',
  'dash_0', 'dash_1', 'dash_icon', 'diag_box', 'door_closed', 'door_open',
  'explosion', 'flashlight', 'game_over', 'gun', 'hp', 'mini_door', 'player',
  'story_back_closed', 'story_back_open', 'up_amo', 'up_click', 'up_hp',
  'up_lf', 'up_ms', 'upgrade', 'vignette', 'wall_1', 'wall_2',
] as const

export type TexName = (typeof TEXTURES)[number]

export const SOUNDS = [
  'walk', 'run', 'crouch', 'jump', 'dash', 'flash', 'gun', 'reload', 'empty',
] as const

export type SoundName = (typeof SOUNDS)[number]

export interface Assets {
  tex: Record<TexName, HTMLImageElement>
  sounds: Record<SoundName, ArrayBuffer>
  story: { en: string; fr: string }
  base: string
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error(`Could not load ${url}`))
    img.src = url
  })
}

async function fetchBuffer(url: string): Promise<ArrayBuffer> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Could not load ${url}`)
  return res.arrayBuffer()
}

async function fetchText(url: string): Promise<string> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Could not load ${url}`)
  return res.text()
}

export async function loadAssets(base: string, progress: (ratio: number) => void): Promise<Assets> {
  const total = TEXTURES.length + SOUNDS.length + 3
  let done = 0
  const step = <T>(p: Promise<T>) =>
    p.then((v) => {
      progress(++done / total)
      return v
    })

  const font = new FontFace('arcade', `url(${base}arcade.ttf)`)
  const [images, sounds, en, fr] = await Promise.all([
    Promise.all(TEXTURES.map((n) => step(loadImage(`${base}tex/${n}.webp`)))),
    Promise.all(SOUNDS.map((n) => step(fetchBuffer(`${base}sounds/${n}.mp3`)))),
    step(fetchText(`${base}story/story_eng.dat`)),
    step(fetchText(`${base}story/story_fr.dat`)),
    step(font.load().then((f) => document.fonts.add(f))),
  ])
  const tex = {} as Record<TexName, HTMLImageElement>
  TEXTURES.forEach((n, i) => (tex[n] = images[i]))
  const snd = {} as Record<SoundName, ArrayBuffer>
  SOUNDS.forEach((n, i) => (snd[n] = sounds[i]))
  return { tex, sounds: snd, story: { en, fr }, base }
}
