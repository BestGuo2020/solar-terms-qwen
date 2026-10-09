<script setup>
/** SectionScience.vue — 科普问答与术语表（中/英双语） */
import { computed } from 'vue'
import { subSolarLatitude } from '../three/orbitMath.js'
import { sim } from '../lib/simClock.js'
import { useI18n, isEn } from '../i18n/index.js'
import { content } from '../i18n/content.js'

const { t } = useI18n()
const data = computed(() => content.value.science)

/** 用页面上真实的模拟时间做现场演示，让抽象解释和 3D 场景对得上 */
const demo = computed(() => {
  const lon = sim.value.solarLongitude
  const eps = sim.value.axialTilt
  const lat = subSolarLatitude(lon, eps)
  return {
    lon: lon.toFixed(2),
    eps: eps.toFixed(3),
    lat: Math.abs(lat).toFixed(2),
    hemi: lat >= 0 ? (isEn.value ? 'north' : '北') : (isEn.value ? 'south' : '南'),
    term: content.value.termsByIndex.get(sim.value.current.index)?.title || sim.value.current.name,
  }
})
</script>

<template>
  <section class="sec" id="science" aria-labelledby="science-t">
    <div class="sec__head">
      <span class="sec__no">{{ t('sec.science.no') }}</span>
      <h2 class="sec__title" id="science-t">{{ t('sec.science.title') }}</h2>
    </div>
    <p class="sec__lede">{{ t('sec.science.lede') }}</p>

    <div class="qa">
      <article class="qa__item" v-for="q in data.qa" :key="q.id" :id="q.id">
        <h3 class="qa__q">{{ q.q }}</h3>
        <div class="qa__a">
          <p v-for="(p, i) in q.a" :key="i">{{ p }}</p>
        </div>
        <ul class="qa__points" v-if="q.keyPoints && q.keyPoints.length">
          <li v-for="(k, i) in q.keyPoints" :key="i">{{ k }}</li>
        </ul>
        <div class="qa__myth" v-if="q.myth"><b>{{ t('sec.science.myth') }}</b>{{ q.myth }}</div>
      </article>
    </div>

    <div class="callout">
      <div class="callout__t">{{ t('sec.science.demo') }}</div>
      {{ t('sec.science.demoText', demo) }}
    </div>

    <h3 class="sub-title">{{ t('sec.science.subGlossary') }}</h3>
    <div class="glossary">
      <div class="glossary__item" v-for="g in data.glossary" :key="g.hanzi || g.term">
        <div class="glossary__t">{{ g.term }}</div>
        <span class="glossary__en">
          <template v-if="isEn"><span lang="zh-Hans">{{ g.hanzi }}</span> · {{ g.en }}</template>
          <template v-else>{{ g.en }}</template>
        </span>
        <p class="glossary__d">{{ g.explain }}</p>
      </div>
    </div>

    <div class="callout callout--gold">
      <div class="callout__t">{{ data.precision.title }}</div>
      <ul class="card__list" style="margin-top:4px">
        <li v-for="(it, i) in data.precision.items" :key="i">{{ it }}</li>
      </ul>
    </div>
  </section>
</template>

<style scoped>
.sub-title {
  font-family: var(--font-serif); font-size: 17px; letter-spacing: 0.1em;
  color: var(--ink-accent); margin: 26px 0 6px; font-weight: 600;
}
.card__list { list-style: none; margin: 0; padding: 0; display: grid; gap: 6px; }
.card__list li { font-size: 13px; line-height: 1.85; color: var(--ink-text); padding-left: 13px; position: relative; }
.card__list li::before { content: "·"; position: absolute; left: 2px; color: var(--ink-accent); font-weight: 700; }
</style>
