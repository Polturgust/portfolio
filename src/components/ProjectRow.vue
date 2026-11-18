<script setup lang="ts">
import { computed } from 'vue'
import type { Project } from '../data/projects'
import { copy, openDemo } from '../lib/state'
import ProjectMedia from './ProjectMedia.vue'

const props = defineProps<{ project: Project; index: number }>()

const text = computed(() => copy.value.work.projects[props.project.id])
const number = computed(() => String(props.index + 1).padStart(2, '0'))
const ratio = (i: number) => {
  const m = props.project.media[i]
  return m.kind === 'terminal' ? 'auto' : `${m.width} / ${m.height}`
}
</script>

<template>
  <article class="project" :class="{ 'project--flip': index % 2 === 1 }">
    <hr v-draw class="rule" />

    <div class="project__body">
      <div class="project__media">
        <a
          v-unveil
          v-parallax="3"
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
          v-parallax="3"
          class="project__frame project__frame--small"
          :style="{ aspectRatio: ratio(1) }"
        >
          <ProjectMedia :media="project.media[1]" :alt="text.alt[1] ?? ''" />
        </div>
      </div>

      <div class="project__text">
        <span class="mono project__num">{{ number }}</span>
        <h3 v-lines class="project__title">{{ project.title }}</h3>
        <ul class="mono project__stack">
          <li v-for="tech in project.stack" :key="tech">{{ tech }}</li>
        </ul>
        <p v-lines class="project__pitch">{{ text.pitch }}</p>
        <p v-reveal class="project__desc">{{ text.description }}</p>
        <ul v-stagger class="project__facts">
          <li v-for="fact in text.facts" :key="fact">{{ fact }}</li>
        </ul>
        <div v-reveal class="project__actions">
          <button
            v-if="project.demo"
            v-magnetic="0.2"
            class="project__try"
            type="button"
            @click="openDemo(project.id)"
          >
            <span class="project__try-icon" aria-hidden="true">▶</span>
            {{ copy.demo.tryIt }}
          </button>
          <a class="project__link mono link-line" :href="project.repo" target="_blank" rel="noopener">
            {{ copy.work.repo }} ↗
          </a>
        </div>
      </div>
    </div>
  </article>
</template>

<style scoped>
.project {
  padding-bottom: clamp(80px, 12vw, 190px);
}

.project__body {
  display: grid;
  grid-template-columns: minmax(0, 7fr) minmax(0, 4fr);
  gap: clamp(28px, 6vw, 110px);
  align-items: start;
  padding-top: clamp(28px, 4vw, 56px);
}

.project--flip .project__media {
  order: 2;
}

.project--flip .project__body {
  grid-template-columns: minmax(0, 4fr) minmax(0, 7fr);
}

.project__media {
  display: grid;
  gap: clamp(20px, 3vw, 44px);
  padding-block: 3%;
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

/* Number, title and description stay on screen together while the media scrolls past. */
.project__text {
  position: sticky;
  top: 100px;
  display: grid;
  gap: 20px;
  justify-items: start;
}

.project__num {
  color: var(--accent);
}

.project__title {
  font-family: var(--font-display);
  font-size: clamp(2.2rem, 4.6vw, 5rem);
  font-weight: 600;
  line-height: 0.95;
  letter-spacing: -0.045em;
  overflow-wrap: anywhere;
  margin-top: -8px;
}

.project__stack {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.project__stack li {
  padding: 6px 12px;
  border: 1px solid var(--line);
  border-radius: 999px;
}

.project__pitch {
  margin-top: 8px;
  font-family: var(--font-display);
  font-size: clamp(1.25rem, 1.9vw, 1.8rem);
  line-height: 1.14;
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
  padding-block: 10px;
  border-bottom: 1px solid var(--line);
  font-size: 0.95em;
}

.project__actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 14px 24px;
  margin-top: 6px;
}

.project__try {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 13px 22px 13px 18px;
  border-radius: 999px;
  background: var(--accent);
  color: var(--accent-ink);
  font-weight: 500;
  transition:
    background-color 0.4s var(--ease),
    color 0.4s var(--ease);
}

.project__try:hover {
  background: var(--ink);
  color: var(--bg);
}

.project__try-icon {
  font-size: 0.7em;
}

.project__link {
  padding-block: 6px;
}

@media (max-width: 900px) {
  .project__body,
  .project--flip .project__body {
    grid-template-columns: 1fr;
  }
  .project__media {
    order: 2;
    padding-block: 0;
  }
  .project__text {
    position: static;
  }
}

@media (max-height: 760px) and (min-width: 901px) {
  .project__text {
    gap: 14px;
    top: 84px;
  }
  .project__facts li {
    padding-block: 7px;
  }
}
</style>
