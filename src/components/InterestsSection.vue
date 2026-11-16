<script setup lang="ts">
import { copy } from '../lib/state'
</script>

<template>
  <section class="hobbies section wrap">
    <div class="section-head mono">
      <span><span class="num">05</span> — {{ copy.interests.label }}</span>
    </div>

    <ul class="hobbies__list">
      <li v-for="(item, i) in copy.interests.items" :key="item.title" class="hobbies__row">
        <span class="mono muted">{{ String(i + 1).padStart(2, '0') }}</span>
        <h3 v-lines class="hobbies__title">{{ item.title }}</h3>
        <span v-reveal="0.2" class="mono hobbies__note">{{ item.note }}</span>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.hobbies__row {
  display: grid;
  grid-template-columns: 3rem 1fr auto;
  align-items: baseline;
  gap: 16px;
  padding-block: clamp(10px, 1.4vw, 20px);
  border-bottom: 1px solid var(--line);
}

.hobbies__title {
  font-family: var(--font-display);
  font-size: clamp(2.2rem, 8vw, 8.5rem);
  font-weight: 300;
  line-height: 1;
  letter-spacing: -0.05em;
  transition:
    font-weight 0.5s var(--ease),
    color 0.3s,
    translate 0.6s var(--ease);
}

.hobbies__note {
  color: var(--accent);
}

@media (hover: hover) {
  .hobbies__row:hover .hobbies__title {
    font-weight: 700;
    translate: 0.15em 0;
  }
}

@media (max-width: 600px) {
  .hobbies__row {
    grid-template-columns: 2rem 1fr;
  }
  .hobbies__note {
    grid-column: 2;
  }
}
</style>
