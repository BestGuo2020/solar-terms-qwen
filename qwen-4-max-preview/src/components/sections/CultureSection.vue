<script setup>
import { CULTURE } from '../../data/content.js'
import { locale, t } from '../../i18n.js'
import Icon from '../Icon.vue'
</script>

<template>
  <section id="culture" class="reading-section culture-section">
    <header class="section-head reveal">
      <span class="section-kicker">CULTURE</span>
      <h2>{{ t('cultureTitle') }}</h2>
      <p class="section-sub">{{ t('cultureSub') }}</p>
    </header>
    <div class="culture-grid">
      <article v-for="(c, i) in CULTURE" :key="i" class="culture-card reveal" :style="{ '--i': i }">
        <div class="culture-icon"><Icon :name="c.icon" :size="26" /></div>
        <h3>{{ c.title[locale] }}</h3>
        <p>{{ c[locale] }}</p>
      </article>
    </div>
  </section>
</template>