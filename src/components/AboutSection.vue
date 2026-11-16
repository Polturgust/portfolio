<script setup lang="ts">
import { asset, copy } from '../lib/state'
</script>

<template>
  <section id="about" class="about section wrap">
    <div class="section-head mono">
      <span><span class="num">01</span> — {{ copy.about.label }}</span>
      <span class="muted">Epitech Nice</span>
    </div>

    <h2 v-lines class="display about__heading">{{ copy.about.heading }}</h2>

    <div class="about__grid">
      <figure v-unveil class="about__portrait">
        <img
          v-parallax="6"
          :src="asset('img/portrait.webp')"
          :alt="copy.about.portraitAlt"
          width="350"
          height="350"
          loading="lazy"
          decoding="async"
        />
      </figure>

      <div class="about__text">
        <p v-for="(paragraph, i) in copy.about.paragraphs" :key="i" v-lines :class="{ lead: i === 0 }">
          {{ paragraph }}
        </p>
      </div>
    </div>

    <dl v-stagger class="about__facts">
      <div v-for="fact in copy.about.facts" :key="fact.label" class="about__fact">
        <dt class="mono muted">{{ fact.label }}</dt>
        <dd>{{ fact.value }}</dd>
      </div>
    </dl>
  </section>
</template>

<style scoped>
.about__heading {
  max-width: 12ch;
  margin-bottom: clamp(48px, 8vw, 120px);
}

.about__grid {
  display: grid;
  grid-template-columns: minmax(0, 4fr) minmax(0, 7fr);
  gap: clamp(32px, 7vw, 120px);
  align-items: start;
}

.about__portrait {
  overflow: hidden;
  border-radius: 4px;
  aspect-ratio: 4 / 5;
  max-width: 420px;
  background: var(--surface);
}

.about__portrait img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  scale: 1.14;
}

.about__text {
  display: grid;
  gap: 1.4em;
  max-width: 44rem;
  color: var(--muted);
  font-size: clamp(1rem, 1.25vw, 1.2rem);
}

.about__text .lead {
  color: var(--ink);
  font-family: var(--font-display);
  font-size: clamp(1.5rem, 2.7vw, 2.6rem);
  line-height: 1.16;
  letter-spacing: -0.025em;
}

.about__facts {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0 clamp(20px, 3vw, 48px);
  margin: clamp(56px, 9vw, 140px) 0 0;
  border-top: 1px solid var(--line);
}

.about__fact {
  padding-top: 20px;
}

.about__fact dt {
  margin-bottom: 10px;
}

.about__fact dd {
  margin: 0;
  line-height: 1.4;
  text-wrap: pretty;
}

@media (max-width: 900px) {
  .about__grid {
    grid-template-columns: 1fr;
  }
  .about__portrait {
    max-width: 280px;
  }
  .about__facts {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    row-gap: 28px;
  }
}

@media (max-width: 480px) {
  .about__facts {
    grid-template-columns: 1fr;
  }
}
</style>
