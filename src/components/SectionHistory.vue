<script setup>
/** SectionHistory.vue — 历史渊源时间线（中/英双语） */
import { computed } from 'vue'
import { useI18n } from '../i18n/index.js'
import { content } from '../i18n/content.js'

const { t } = useI18n()
const data = computed(() => content.value.history)
</script>

<template>
  <section class="sec" id="history" aria-labelledby="history-t">
    <div class="sec__head">
      <span class="sec__no">{{ t('sec.history.no') }}</span>
      <h2 class="sec__title" id="history-t">{{ t('sec.history.title') }}</h2>
    </div>
    <p class="sec__lede">{{ t('sec.history.lede') }}</p>

    <div class="tline">
      <article class="tline__item" v-for="(item, i) in data.timeline" :key="i">
        <div>
          <span class="tline__era">{{ item.era }}</span>
          <span class="tline__date">{{ item.date }}</span>
        </div>
        <h3 class="tline__title">{{ item.title }}</h3>
        <p class="tline__text">{{ item.text }}</p>
        <div class="tline__refs" v-if="item.refs && item.refs.length">
          <span v-for="(r, j) in item.refs" :key="j">{{ r }}</span>
        </div>
      </article>
    </div>

    <h3 class="sub-title">{{ t('sec.history.sub') }}</h3>
    <div class="cards">
      <div class="card" v-for="(h, i) in data.highlights" :key="i">
        <div class="card__title">{{ h.title }}</div>
        <p class="card__text">{{ h.text }}</p>
      </div>
    </div>

    <div class="callout callout--warn">
      <div class="callout__t">{{ t('sec.history.callout') }}</div>
      {{ data.note }}
    </div>
  </section>
</template>

<style scoped>
.sub-title {
  font-family: var(--font-serif); font-size: 17px; letter-spacing: 0.1em;
  color: var(--ink-accent); margin: 26px 0 4px; font-weight: 600;
}
</style>
