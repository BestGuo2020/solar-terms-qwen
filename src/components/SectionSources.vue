<script setup>
/** SectionSources.vue — 参考来源与许可（中/英双语） */
import { computed } from 'vue'
import { useI18n } from '../i18n/index.js'
import { content } from '../i18n/content.js'

const { t } = useI18n()
const groups = computed(() => content.value.sources.sourceGroups)
</script>

<template>
  <section class="sec" id="sources" aria-labelledby="sources-t">
    <div class="sec__head">
      <span class="sec__no">{{ t('sec.sources.no') }}</span>
      <h2 class="sec__title" id="sources-t">{{ t('sec.sources.title') }}</h2>
    </div>
    <p class="sec__lede">{{ t('sec.sources.lede') }}</p>

    <div v-for="g in groups" :key="g.title" class="src-group">
      <h3 class="sub-title">{{ g.title }}</h3>
      <ul class="sources">
        <li v-for="(it, i) in g.items" :key="i">
          <span class="sources__tag" v-if="it.tag">{{ it.tag }}</span>
          {{ it.text }}
          <a v-if="it.url" :href="it.url" target="_blank" rel="noopener noreferrer">{{ it.url }}</a>
        </li>
      </ul>
    </div>

    <div class="callout">
      <div class="callout__t">{{ t('sec.sources.summary') }}</div>
      {{ t('footer.precision', { min: 1, max: 8800 }) }}
    </div>
  </section>
</template>

<style scoped>
.sub-title {
  font-family: var(--font-serif); font-size: 17px; letter-spacing: 0.1em;
  color: var(--ink-accent); margin: 22px 0 4px; font-weight: 600;
}
.src-group + .src-group { margin-top: 8px; }
b { color: var(--ink-accent); font-weight: 650; }
</style>
