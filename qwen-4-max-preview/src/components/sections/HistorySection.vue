<script setup>
import { HISTORY } from '../../data/content.js'
import { locale, t } from '../../i18n.js'
</script>

<template>
  <section id="history" class="reading-section">
    <header class="section-head reveal">
      <span class="section-kicker">HISTORY</span>
      <h2>{{ t('historyTitle') }}</h2>
      <p class="section-sub">{{ t('historySub') }}</p>
    </header>
    <ol class="history-line">
      <li v-for="(h, i) in HISTORY" :key="i" class="history-item reveal">
        <div class="history-node" aria-hidden="true"></div>
        <div class="history-card">
          <div class="history-year">{{ h.year[locale] }}</div>
          <h3>{{ h.era[locale] }}</h3>
          <p>{{ h[locale] }}</p>
        </div>
      </li>
    </ol>
  </section>
</template>