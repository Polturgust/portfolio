<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { links } from '../data/projects'
import { asset, copy, locale } from '../lib/state'

const time = ref('')
let timer: number | undefined

function tick() {
  time.value = new Intl.DateTimeFormat(locale.value === 'fr' ? 'fr-FR' : 'en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Paris',
    timeZoneName: 'short',
  }).format(new Date())
}

onMounted(() => {
  tick()
  timer = window.setInterval(tick, 20_000)
})

onBeforeUnmount(() => window.clearInterval(timer))
</script>

<template>
  <footer id="contact" class="contact wrap">
    <div class="section-head mono">
      <span><span class="num">06</span> — {{ copy.contact.label }}</span>
      <span class="muted">{{ copy.contact.localTime }} · {{ time }}</span>
    </div>

    <p v-lines class="contact__lead">{{ copy.contact.lead }}</p>

    <a class="contact__cta" :href="`mailto:${links.email}`" :data-cursor="copy.cursor.mail">
      <span v-lines class="contact__cta-text">{{ copy.contact.cta }}</span>
      <span v-reveal="0.3" class="contact__cta-arrow" aria-hidden="true">↗</span>
    </a>

    <div v-stagger class="contact__grid">
      <div>
        <p class="mono muted">{{ copy.contact.email }}</p>
        <a class="link-line contact__value" :href="`mailto:${links.email}`">{{ links.email }}</a>
      </div>
      <div>
        <p class="mono muted">{{ copy.contact.phone }}</p>
        <a class="link-line contact__value" :href="`tel:${links.phoneHref}`">{{ links.phone }}</a>
      </div>
      <div>
        <p class="mono muted">Web</p>
        <ul class="contact__social">
          <li><a class="link-line contact__value" :href="links.github" target="_blank" rel="noopener">GitHub ↗</a></li>
          <li><a class="link-line contact__value" :href="links.linkedin" target="_blank" rel="noopener">LinkedIn ↗</a></li>
          <li><a class="link-line contact__value" :href="links.linktree" target="_blank" rel="noopener">Linktree ↗</a></li>
        </ul>
      </div>
      <div class="contact__cv">
        <a v-magnetic="0.25" class="contact__button" :href="asset(links.cv)" download>
          {{ copy.contact.cv }} <span aria-hidden="true">↓</span>
        </a>
        <p class="mono muted">{{ copy.contact.cvNote }}</p>
      </div>
    </div>

    <div class="contact__foot mono muted">
      <span>© {{ new Date().getFullYear() }} — {{ copy.contact.rights }}</span>
      <a class="link-line" href="#top">{{ copy.contact.top }} ↑</a>
    </div>
  </footer>
</template>

<style scoped>
.contact {
  padding-top: var(--section);
  padding-bottom: 28px;
}

.contact__lead {
  font-size: clamp(1.1rem, 1.8vw, 1.7rem);
  color: var(--muted);
  max-width: 30ch;
  letter-spacing: -0.01em;
}

.contact__cta {
  display: flex;
  align-items: flex-start;
  gap: 0.12em;
  margin-block: clamp(12px, 2vw, 28px) clamp(56px, 9vw, 130px);
  font-family: var(--font-display);
  font-size: clamp(3.6rem, 17.5vw, 21rem);
  font-weight: 700;
  line-height: 0.84;
  letter-spacing: -0.06em;
  transition: color 0.4s;
}

.contact__cta-text {
  display: block;
}

.contact__cta-arrow {
  font-size: 0.42em;
  font-weight: 300;
  line-height: 1;
  color: var(--accent);
  transition: transform 0.6s var(--ease);
}

@media (hover: hover) {
  .contact__cta:hover {
    color: var(--accent);
  }
  .contact__cta:hover .contact__cta-arrow {
    transform: translate(0.12em, -0.12em);
  }
}

.contact__grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: clamp(24px, 3vw, 48px);
  padding-top: 24px;
  border-top: 1px solid var(--line);
}

.contact__grid p {
  margin-bottom: 12px;
}

.contact__value {
  font-size: clamp(1rem, 1.3vw, 1.25rem);
  overflow-wrap: anywhere;
}

.contact__social {
  display: grid;
  gap: 8px;
  justify-items: start;
}

.contact__cv {
  display: grid;
  gap: 12px;
  justify-items: start;
  align-content: start;
}

.contact__cv p {
  margin: 0;
}

.contact__button {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  padding: 16px 26px;
  border-radius: 999px;
  background: var(--ink);
  color: var(--bg);
  font-weight: 500;
  transition: background-color 0.4s var(--ease);
}

.contact__button:hover {
  background: var(--accent);
  color: var(--accent-ink);
}

.contact__foot {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  margin-top: clamp(56px, 8vw, 120px);
  padding-top: 20px;
  border-top: 1px solid var(--line);
}

@media (max-width: 900px) {
  .contact__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 480px) {
  .contact__grid {
    grid-template-columns: 1fr;
  }
}
</style>
