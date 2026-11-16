<script setup lang="ts">
import { copy } from '../lib/state'
</script>

<template>
  <section class="skills section wrap">
    <div class="section-head mono">
      <span><span class="num">04</span> — {{ copy.skills.label }}</span>
    </div>

    <h2 v-lines class="display skills__heading">{{ copy.skills.heading }}</h2>

    <div class="skills__groups">
      <div v-for="(group, i) in copy.skills.groups" :key="group.title" class="skills__group">
        <hr v-draw class="rule" />
        <div class="skills__row">
          <p class="mono skills__title">
            <span class="muted">{{ String(i + 1).padStart(2, '0') }}</span> {{ group.title }}
          </p>
          <ul v-stagger="0.05" class="skills__items">
            <li v-for="item in group.items" :key="item">{{ item }}</li>
          </ul>
        </div>
      </div>
      <div class="skills__group">
        <hr v-draw class="rule" />
        <div class="skills__row">
          <p class="mono skills__title">
            <span class="muted">05</span> {{ copy.skills.softLabel }}
          </p>
          <ul v-stagger="0.05" class="skills__items skills__items--soft">
            <li v-for="item in copy.skills.soft" :key="item">{{ item }}</li>
          </ul>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.skills__heading {
  margin-bottom: clamp(40px, 6vw, 96px);
}

.skills__row {
  display: grid;
  grid-template-columns: minmax(0, 3fr) minmax(0, 9fr);
  gap: clamp(16px, 3vw, 48px);
  padding-block: clamp(20px, 2.6vw, 36px);
}

.skills__title {
  padding-top: 0.9em;
  display: flex;
  gap: 1em;
}

.skills__items {
  display: flex;
  flex-wrap: wrap;
  gap: 0.1em 0.7em;
  font-family: var(--font-display);
  font-size: clamp(1.7rem, 4.4vw, 4.4rem);
  font-weight: 500;
  line-height: 1.08;
  letter-spacing: -0.04em;
}

.skills__items li {
  transition: color 0.3s;
}

.skills__items li:not(:last-child)::after {
  content: '/';
  margin-left: 0.7em;
  color: var(--line);
  font-weight: 300;
}

@media (hover: hover) {
  .skills__items li:hover {
    color: var(--accent);
  }
}

.skills__items--soft {
  font-size: clamp(1.2rem, 2.4vw, 2.2rem);
  color: var(--muted);
}

@media (max-width: 760px) {
  .skills__row {
    grid-template-columns: 1fr;
  }
  .skills__title {
    padding-top: 0;
  }
}
</style>
