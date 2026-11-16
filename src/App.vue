<script setup lang="ts">
import { nextTick, onMounted, watch } from 'vue'
import { copy, locale, ready } from './lib/state'
import { ScrollTrigger, initSmoothScroll, lockScroll } from './lib/motion'
import Preloader from './components/Preloader.vue'
import NavBar from './components/NavBar.vue'
import CustomCursor from './components/CustomCursor.vue'
import ScrollProgress from './components/ScrollProgress.vue'
import HeroSection from './components/HeroSection.vue'
import TechMarquee from './components/TechMarquee.vue'
import AboutSection from './components/AboutSection.vue'
import WorkSection from './components/WorkSection.vue'
import ExperienceSection from './components/ExperienceSection.vue'
import SkillsSection from './components/SkillsSection.vue'
import InterestsSection from './components/InterestsSection.vue'
import ContactSection from './components/ContactSection.vue'

onMounted(() => {
  initSmoothScroll()
  lockScroll(true)
})

function onIntroDone() {
  ready.value = true
  lockScroll(false)
}

// Sections are re-created on language change so split text is rebuilt on the new copy.
watch(locale, async () => {
  await nextTick()
  ScrollTrigger.refresh()
})
</script>

<template>
  <a class="skip" href="#about">{{ copy.nav.skip }}</a>
  <Preloader @done="onIntroDone" />
  <ScrollProgress />
  <CustomCursor />
  <NavBar />
  <main :key="locale">
    <HeroSection />
    <TechMarquee />
    <AboutSection />
    <WorkSection />
    <ExperienceSection />
    <SkillsSection />
    <InterestsSection />
    <ContactSection />
  </main>
</template>

<style scoped>
.skip {
  position: fixed;
  top: 12px;
  left: 12px;
  z-index: 200;
  padding: 10px 16px;
  background: var(--ink);
  color: var(--bg);
  border-radius: 999px;
  transform: translateY(-200%);
}

.skip:focus-visible {
  transform: none;
}
</style>
