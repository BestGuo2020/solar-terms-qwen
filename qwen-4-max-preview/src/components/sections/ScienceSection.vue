<script setup>
import { SCIENCE } from '../../data/content.js'
import { locale, t } from '../../i18n.js'
import { selectTerm } from '../../state/simulation.js'
import Icon from '../Icon.vue'

function jump (termIndex) {
  selectTerm(termIndex)
  document.getElementById('scene')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}
</script>

<template>
  <section id="science" class="reading-section">
    <header class="section-head reveal">
      <span class="section-kicker">SCIENCE</span>
      <h2>{{ t('scienceTitle') }}</h2>
      <p class="section-sub">{{ t('scienceSub') }}</p>
    </header>
    <div class="science-grid">
      <article v-for="(s, i) in SCIENCE" :key="i" class="science-card reveal">
        <div class="science-q">
          <span class="science-icon"><Icon :name="s.icon" :size="22" /></span>
          <h3>{{ s.q[locale] }}</h3>
        </div>
        <p>{{ s[locale] }}</p>
        <button type="button" class="jump-btn" @click="jump(s.jump.term)">
          {{ s.jump[locale] }} →
        </button>
      </article>
    </div>
  </section>
</template>