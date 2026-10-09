<script setup>
/** SectionCulture.vue — 文化价值（中/英双语） */
import { computed } from 'vue'
import { useI18n, isEn } from '../i18n/index.js'
import { content } from '../i18n/content.js'

const { t } = useI18n()
const data = computed(() => content.value.culture)
</script>

<template>
  <section class="sec" id="culture" aria-labelledby="culture-t">
    <div class="sec__head">
      <span class="sec__no">{{ t('sec.culture.no') }}</span>
      <h2 class="sec__title" id="culture-t">{{ t('sec.culture.title') }}</h2>
    </div>
    <p class="sec__lede">{{ t('sec.culture.lede') }}</p>

    <div class="cards">
      <article class="card" v-for="p in data.pillars" :key="p.key">
        <div class="card__title">{{ p.title }}</div>
        <p class="card__text">{{ p.text }}</p>
        <ul class="card__list" v-if="p.examples && p.examples.length">
          <li v-for="(e, i) in p.examples" :key="i">
            <b>{{ e.label }}</b><template v-if="isEn">: </template><template v-else>｜</template>{{ e.text }}
            <span class="card__note" v-if="e.note">{{ e.note }}</span>
          </li>
        </ul>
      </article>
    </div>

    <h3 class="sub-title">{{ t('sec.culture.subIdioms') }}</h3>
    <p class="prose" style="font-size:13.5px;color:var(--ink-text-soft);margin-bottom:10px">
      {{ t('sec.culture.idiomsNote') }}
    </p>
    <div class="cards">
      <div class="card" v-for="(m, i) in data.idioms" :key="i">
        <div class="card__title" style="font-size:15px" lang="zh-Hans">「{{ m.text }}」</div>
        <div class="card__title" style="font-size:13.5px;margin-top:-2px" v-if="isEn && m.en">{{ m.en }}</div>
        <div class="card__text" style="margin-bottom:4px">
          <span class="chip">{{ m.region }}</span>
        </div>
        <p class="card__text" style="font-size:13px">{{ m.explain }}</p>
      </div>
    </div>

    <div class="callout callout--gold">
      <div class="callout__t">{{ t('sec.culture.heritage') }}</div>
      <p style="margin:0 0 8px">{{ data.heritage.text }}</p>
      <p style="margin:0 0 4px;font-size:12.5px;color:var(--ink-text-soft)">
        <b>{{ t('sec.culture.heritageName') }}</b>{{ data.heritage.englishName }}<br />
        <b>{{ t('sec.culture.heritageDate') }}</b>{{ data.heritage.inscribed }}　<b>{{ t('sec.culture.heritageSession') }}</b>{{ data.heritage.session }}<br />
        <b>{{ t('sec.culture.heritageUrl') }}</b>
        <a :href="data.heritage.officialUrl" target="_blank" rel="noopener noreferrer">{{ data.heritage.officialUrl }}</a>
      </p>
    </div>

    <div class="callout callout--warn">
      <div class="callout__t">{{ t('sec.culture.region') }}</div>
      {{ data.note }}
    </div>
  </section>
</template>

<style scoped>
.sub-title {
  font-family: var(--font-serif); font-size: 17px; letter-spacing: 0.1em;
  color: var(--ink-accent); margin: 26px 0 6px; font-weight: 600;
}
.chip {
  display: inline-block; font-size: 11.5px; color: var(--ink-accent);
  border: 1px solid var(--paper-line); border-radius: 999px; padding: 1px 9px;
  background: rgba(255, 255, 255, 0.55);
}
</style>
