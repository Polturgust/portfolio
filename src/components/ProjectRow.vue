<script setup lang="ts">
import { computed } from 'vue'
import type { Project } from '../data/projects'
import { copy } from '../lib/state'
import ProjectMedia from './ProjectMedia.vue'

const props = defineProps<{ project: Project; index: number }>()

const text = computed(() => copy.value.work.projects[props.project.id])
const number = computed(() => String(props.index + 1).padStart(2, '0'))
const ratio = (i: number) => {
  const m = props.project.media[i]
  return m.kind === 'terminal' ? '16 / 10' : `${m.width} / ${m.height}`
}
</script>

<template>
  <article class="project" :class="{ 'project--flip': index % 2 === 1 }">
    <hr v-draw class="rule" />
    <header class="project__head">
      <span class="mono project__num">{{ number }}</span>
      <h3 v-lines class="project__title">{{ project.title }}</h3>
      <ul class="mono project__stack">
        <li v-for="tech in project.stack" :key="tech">{{ tech }}</li>
      </ul>
    </header>

    <div class="project__body">
      <div class="project__media">
        <a
          v-unveil
          class="project__frame"
          :style="{ aspectRatio: ratio(0) }"
          :href="project.repo"
          target="_blank"
          rel="noopener"
          :data-cursor="copy.cursor.view"
          :aria-label="`${project.title} — ${copy.work.repo}`"
        >
          <ProjectMedia :media="project.media[0]" :alt="text.alt[0]" />
        </a>
        <div
          v-if="project.media[1]"
          v-unveil
          class="project__frame project__frame--small"
          :style="{ aspectRatio: ratio(1) }"
        >
          <ProjectMedia :media="project.media[1]" :alt="text.alt[1] ?? ''" />
        </div>
      </div>

      <div class="project__text">
        <p v-lines class="project__pitch">{{ text.pitch }}</p>
        <p v-reveal class="project__desc">{{ text.description }}</p>
        <ul v-stagger class="project__facts">
          <li v-for="fact in text.facts" :key="fact">{{ fact }}</li>
        </ul>
        <a
          v-reveal
          class="project__link mono link-line"
          :href="project.repo"
          target="_blank"
          rel="noopener"
        >
          {{ copy.work.repo }} ↗
        </a>
      </div>
    </div>
  </article>
</template>

<style scoped>
.project {
  padding-bottom: clamp(80px, 12vw, 190px);
}

.project__head {
  display: grid;
  grid-template-columns: 4rem 1fr auto;
  align-items: baseline;
  gap: 16px;
  padding-block: 22px clamp(28px, 4vw, 56px);
}

.project__num {
  color: var(--accent);
}

.project__title {
  font-family: var(--font-display);
  font-size: clamp(2.4rem, 7.6vw, 8.4rem);
  font-weight: 600;
  line-height: 0.92;
  letter-spacing: -0.045em;
}

.project__stack {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.project__stack li {
  padding: 6px 12px;
  border: 1px solid var(--line);
  border-radius: 999px;
}

.project__body {
  display: grid;
  grid-template-columns: minmax(0, 7fr) minmax(0, 4fr);
  gap: clamp(28px, 6vw, 110px);
  align-items: start;
}

.project--flip .project__media {
  order: 2;
}

.project--flip .project__body {
  grid-template-columns: minmax(0, 4fr) minmax(0, 7fr);
}

.project__media {
  display: grid;
  gap: clamp(14px, 2vw, 28px);
}

.project__frame {
  display: block;
  overflow: hidden;
  border-radius: 4px;
  background: var(--surface);
}

.project__frame--small {
  width: 58%;
  justify-self: end;
}

.project--flip .project__frame--small {
  justify-self: start;
}

.project__text {
  position: sticky;
  top: 110px;
  display: grid;
  gap: 22px;
  justify-items: start;
}

.project__pitch {
  font-family: var(--font-display);
  font-size: clamp(1.4rem, 2.3vw, 2.2rem);
  line-height: 1.12;
  letter-spacing: -0.025em;
  text-wrap: balance;
}

.project__desc {
  color: var(--muted);
  max-width: 36rem;
  text-wrap: pretty;
}

.project__facts {
  width: 100%;
  border-top: 1px solid var(--line);
}

.project__facts li {
  padding-block: 11px;
  border-bottom: 1px solid var(--line);
  font-size: 0.95em;
}

.project__link {
  margin-top: 6px;
  padding-block: 6px;
}

@media (max-width: 900px) {
  .project__head {
    grid-template-columns: 1fr;
    gap: 12px;
  }
  .project__stack {
    justify-content: flex-start;
  }
  .project__body,
  .project--flip .project__body {
    grid-template-columns: 1fr;
  }
  .project--flip .project__media {
    order: 0;
  }
  .project__text {
    position: static;
  }
}
</style>
