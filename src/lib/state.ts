import { computed, ref, watch } from 'vue'
import { en } from '../i18n/en'
import { fr } from '../i18n/fr'

export type Locale = 'en' | 'fr'
export type Theme = 'light' | 'dark'

const messages = { en, fr }

function read(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function write(key: string, value: string) {
  try {
    localStorage.setItem(key, value)
  } catch {
    /* storage unavailable: preference lasts for this visit only */
  }
}

function initialLocale(): Locale {
  const saved = read('locale')
  if (saved === 'en' || saved === 'fr') return saved
  return navigator.language.toLowerCase().startsWith('fr') ? 'fr' : 'en'
}

function initialTheme(): Theme {
  const current = document.documentElement.dataset.theme
  return current === 'dark' ? 'dark' : 'light'
}

export const locale = ref<Locale>(initialLocale())
export const theme = ref<Theme>(initialTheme())
export const copy = computed(() => messages[locale.value])

/** True once the intro has finished and the page can animate in. */
export const ready = ref(false)

watch(
  locale,
  (value) => {
    document.documentElement.lang = value
    document.title = messages[value].meta.title
    write('locale', value)
  },
  { immediate: true },
)

watch(theme, (value) => {
  document.documentElement.dataset.theme = value
  write('theme', value)
})

export function toggleLocale() {
  locale.value = locale.value === 'en' ? 'fr' : 'en'
}

export function toggleTheme() {
  theme.value = theme.value === 'dark' ? 'light' : 'dark'
}

export const asset = (path: string) => import.meta.env.BASE_URL + path
