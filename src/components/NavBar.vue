<script setup lang="ts">
import { copy, locale, theme, toggleLocale, toggleTheme } from '../lib/state'
</script>

<template>
  <header class="nav wrap">
    <a class="nav__brand" href="#top" v-magnetic="0.25">Florent <b>Serra</b></a>
    <nav class="nav__links mono" aria-label="Sections">
      <a class="link-line" href="#about">{{ copy.nav.about }}</a>
      <a class="link-line" href="#work">{{ copy.nav.work }}</a>
      <a class="link-line" href="#experience">{{ copy.nav.experience }}</a>
      <a class="link-line" href="#contact">{{ copy.nav.contact }}</a>
    </nav>
    <div class="nav__tools mono">
      <button class="nav__lang" type="button" :aria-label="copy.nav.language" @click="toggleLocale">
        <span :class="{ on: locale === 'en' }">EN</span>
        <span class="sep">/</span>
        <span :class="{ on: locale === 'fr' }">FR</span>
      </button>
      <button
        class="nav__theme"
        type="button"
        :aria-label="copy.nav.theme"
        :aria-pressed="theme === 'dark'"
        @click="toggleTheme"
      >
        <span class="nav__theme-dot" />
      </button>
    </div>
  </header>
</template>

<style scoped>
.nav {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 50;
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  height: 68px;
  color: #fff;
  mix-blend-mode: difference;
}

.nav__brand {
  justify-self: start;
  font-family: var(--font-display);
  font-size: 1.1rem;
  font-weight: 300;
  letter-spacing: -0.02em;
}

.nav__brand b {
  font-weight: 700;
}

.nav__links {
  display: flex;
  gap: clamp(16px, 2.4vw, 40px);
}

.nav__tools {
  justify-self: end;
  display: flex;
  align-items: center;
  gap: 20px;
}

.nav__lang {
  display: flex;
  gap: 6px;
  padding: 8px 0;
  letter-spacing: 0.08em;
}

.nav__lang span {
  opacity: 0.45;
  transition: opacity 0.3s;
}

.nav__lang span.on {
  opacity: 1;
}

.nav__theme {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  border: 1px solid currentColor;
  display: grid;
  place-items: center;
}

.nav__theme-dot {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: linear-gradient(90deg, currentColor 50%, transparent 50%);
  border: 1px solid currentColor;
  transition: transform 0.6s var(--ease);
}

.nav__theme[aria-pressed='true'] .nav__theme-dot {
  transform: rotate(180deg);
}

@media (max-width: 760px) {
  .nav {
    grid-template-columns: 1fr auto;
  }
  .nav__links {
    display: none;
  }
}
</style>
