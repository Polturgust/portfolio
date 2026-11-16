<script setup lang="ts">
import { links, moreProjects, projects } from '../data/projects'
import { copy } from '../lib/state'
import ProjectRow from './ProjectRow.vue'
</script>

<template>
  <section id="work" class="work section wrap">
    <div class="section-head mono">
      <span><span class="num">02</span> — {{ copy.work.label }}</span>
      <span class="muted">{{ String(projects.length).padStart(2, '0') }}</span>
    </div>

    <h2 v-lines class="display work__heading">{{ copy.work.heading }}</h2>

    <ProjectRow v-for="(project, i) in projects" :key="project.id" :project="project" :index="i" />

    <div class="more">
      <div class="more__head">
        <h3 v-lines class="more__title">{{ copy.work.moreHeading }}</h3>
        <a class="mono link-line" :href="links.github" target="_blank" rel="noopener">{{ copy.work.all }} ↗</a>
      </div>
      <ul v-stagger class="more__list">
        <li v-for="item in moreProjects" :key="item.id">
          <a class="more__row" :href="item.repo" target="_blank" rel="noopener">
            <span class="more__name">{{ item.title }}</span>
            <span class="more__desc muted">{{ copy.work.more[item.id] }}</span>
            <span class="mono more__lang">{{ item.lang }}</span>
            <span class="more__arrow" aria-hidden="true">↗</span>
          </a>
        </li>
      </ul>
    </div>
  </section>
</template>

<style scoped>
.work__heading {
  margin-bottom: clamp(56px, 9vw, 140px);
}

.more__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 24px;
  flex-wrap: wrap;
  margin-bottom: 28px;
}

.more__title {
  font-family: var(--font-display);
  font-size: clamp(1.8rem, 4vw, 3.6rem);
  font-weight: 600;
  letter-spacing: -0.035em;
  line-height: 1;
}

.more__list {
  border-top: 1px solid var(--line);
}

.more__row {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 3fr) minmax(0, 6fr) 3rem 1.5rem;
  align-items: baseline;
  gap: 20px;
  padding: 22px 0;
  border-bottom: 1px solid var(--line);
  transition:
    padding 0.5s var(--ease),
    color 0.3s;
}

.more__row::before {
  content: '';
  position: absolute;
  inset: 0 calc(var(--pad) * -1);
  background: var(--ink);
  transform: scaleY(0);
  transform-origin: bottom center;
  transition: transform 0.5s var(--ease);
  z-index: -1;
}

.more__name {
  font-family: var(--font-display);
  font-size: clamp(1.2rem, 2vw, 1.8rem);
  font-weight: 500;
  letter-spacing: -0.02em;
}

.more__arrow {
  justify-self: end;
  transition: transform 0.5s var(--ease);
}

@media (hover: hover) {
  .more__row:hover {
    color: var(--bg);
    padding-inline: 12px;
  }
  .more__row:hover::before {
    transform: scaleY(1);
  }
  .more__row:hover .more__desc {
    color: inherit;
  }
  .more__row:hover .more__arrow {
    transform: translate(4px, -4px);
  }
}

@media (max-width: 760px) {
  .more__row {
    grid-template-columns: 1fr auto;
    gap: 6px 16px;
  }
  .more__desc {
    grid-column: 1 / -1;
    grid-row: 2;
  }
  .more__lang {
    display: none;
  }
}
</style>
