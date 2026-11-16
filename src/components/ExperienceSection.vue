<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { copy, locale } from '../lib/state'
import { gsap, reducedMotion } from '../lib/motion'

const root = ref<HTMLElement>()
const stats = copy.value.experience.stats
const shown = ref(stats.map((s) => (reducedMotion ? s.value : 0)))
let ctx: gsap.Context | undefined

function format(value: number, decimals: number) {
  return value.toLocaleString(locale.value === 'fr' ? 'fr-FR' : 'en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}

onMounted(() => {
  if (reducedMotion || !root.value) return
  ctx = gsap.context(() => {
    gsap.fromTo(
      '.xp__line',
      { scaleY: 0 },
      {
        scaleY: 1,
        ease: 'none',
        scrollTrigger: { trigger: '.xp__jobs', start: 'top 70%', end: 'bottom 60%', scrub: 0.4 },
      },
    )

    stats.forEach((stat, i) => {
      const state = { value: 0 }
      gsap.to(state, {
        value: stat.value,
        duration: 2,
        ease: 'expo.out',
        onUpdate: () => {
          shown.value[i] = state.value
        },
        scrollTrigger: { trigger: '.xp__stats', start: 'top 85%', once: true },
      })
    })
  }, root.value)
})

onBeforeUnmount(() => ctx?.revert())
</script>

<template>
  <section id="experience" ref="root" class="xp section wrap">
    <div class="section-head mono">
      <span><span class="num">03</span> — {{ copy.experience.label }}</span>
      <span class="muted">2024 — {{ copy.experience.present }}</span>
    </div>

    <h2 v-lines class="display xp__heading">{{ copy.experience.heading }}</h2>

    <div class="xp__jobs">
      <span class="xp__line" aria-hidden="true" />
      <article v-for="job in copy.experience.jobs" :key="job.role" class="xp__job">
        <p v-reveal class="mono xp__period">{{ job.period }}</p>
        <div>
          <h3 v-lines class="xp__role">{{ job.role }}</h3>
          <p v-reveal class="xp__company">
            {{ job.company }} <span class="muted">— {{ job.place }}</span>
          </p>
        </div>
        <ul v-stagger class="xp__points">
          <li v-for="point in job.points" :key="point">{{ point }}</li>
        </ul>
      </article>
    </div>

    <dl class="xp__stats">
      <div v-for="(stat, i) in stats" :key="stat.label" v-reveal="i * 0.1" class="xp__stat">
        <dd>{{ format(shown[i], stat.decimals) }}{{ stat.suffix }}</dd>
        <dt class="mono muted">Micromania · {{ stat.label }}</dt>
      </div>
    </dl>

    <div class="xp__edu">
      <p class="mono muted xp__edu-label">{{ copy.experience.educationLabel }}</p>
      <ul v-stagger class="xp__edu-list">
        <li v-for="item in copy.experience.education" :key="item.title" class="xp__edu-row">
          <span class="mono">{{ item.period }}</span>
          <span class="xp__edu-title">{{ item.title }}</span>
          <span class="muted">{{ item.school }}<template v-if="item.note"> · {{ item.note }}</template></span>
        </li>
      </ul>
    </div>
  </section>
</template>

<style scoped>
.xp__heading {
  margin-bottom: clamp(48px, 8vw, 120px);
}

.xp__jobs {
  position: relative;
  padding-left: clamp(20px, 3vw, 44px);
}

.xp__jobs::before,
.xp__line {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 1px;
  background: var(--line);
}

.xp__line {
  width: 2px;
  left: -0.5px;
  background: var(--accent);
  transform-origin: top center;
}

.xp__job {
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(0, 5fr) minmax(0, 4fr);
  gap: clamp(16px, 3vw, 48px);
  padding-block: clamp(28px, 4vw, 56px);
  border-bottom: 1px solid var(--line);
}

.xp__job:first-of-type {
  padding-top: 0;
}

.xp__period {
  padding-top: 0.9em;
  color: var(--accent);
}

.xp__role {
  font-family: var(--font-display);
  font-size: clamp(1.7rem, 3.6vw, 3.4rem);
  font-weight: 600;
  line-height: 1;
  letter-spacing: -0.035em;
  margin-bottom: 12px;
}

.xp__company {
  font-size: 1.1em;
}

.xp__points li {
  padding-block: 11px;
  border-bottom: 1px solid var(--line);
  color: var(--muted);
}

.xp__points li:first-child {
  border-top: 1px solid var(--line);
}

.xp__stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: clamp(20px, 3vw, 48px);
  margin: clamp(56px, 9vw, 130px) 0;
}

.xp__stat {
  display: flex;
  flex-direction: column;
}

.xp__stat dd {
  margin: 0 0 14px;
  font-family: var(--font-display);
  font-size: clamp(2.6rem, 9vw, 9.5rem);
  font-weight: 600;
  line-height: 0.9;
  letter-spacing: -0.05em;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.xp__stat dt {
  padding-top: 14px;
  border-top: 1px solid var(--line);
  line-height: 1.5;
}

.xp__edu {
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(0, 9fr);
  gap: clamp(16px, 3vw, 48px);
}

.xp__edu-list {
  border-top: 1px solid var(--line);
}

.xp__edu-row {
  display: grid;
  grid-template-columns: 8rem minmax(0, 5fr) minmax(0, 4fr);
  gap: 20px;
  align-items: baseline;
  padding-block: 20px;
  border-bottom: 1px solid var(--line);
}

.xp__edu-title {
  font-family: var(--font-display);
  font-size: clamp(1.1rem, 1.7vw, 1.5rem);
  font-weight: 500;
  letter-spacing: -0.02em;
}

@media (max-width: 900px) {
  .xp__job,
  .xp__edu,
  .xp__edu-row {
    grid-template-columns: 1fr;
  }
  .xp__edu-row {
    gap: 6px;
  }
  .xp__period {
    padding-top: 0;
  }
  .xp__stats {
    grid-template-columns: 1fr;
  }
}
</style>
