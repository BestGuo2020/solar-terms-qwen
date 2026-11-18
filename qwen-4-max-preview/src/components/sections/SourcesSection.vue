<script setup>
import { REFERENCES, ACCURACY_NOTE, SCALE_NOTE } from '../../data/content.js'
import { locale, t } from '../../i18n.js'
</script>

<template>
  <section id="sources" class="reading-section sources-section">
    <header class="section-head reveal">
      <span class="section-kicker">SOURCES</span>
      <h2>{{ t('sourcesTitle') }}</h2>
      <p class="section-sub">{{ t('sourcesSub') }}</p>
    </header>
    <div class="sources-body reveal">
      <div class="accuracy-note">
        <p>{{ ACCURACY_NOTE[locale] }}</p>
        <p class="scale-line">{{ SCALE_NOTE[locale] }}</p>
      </div>
      <ul class="ref-list">
        <li v-for="(r, i) in REFERENCES" :key="i">
          <a v-if="r.url" :href="r.url" target="_blank" rel="noopener noreferrer">{{ r[locale] }}</a>
          <span v-else>{{ r[locale] }}</span>
        </li>
      </ul>
      <div class="texture-credit">
        <h3>{{ t('textureCreditTitle') }}</h3>
        <p>{{ t('textureCredit') }}</p>
      </div>
    </div>
  </section>
</template>