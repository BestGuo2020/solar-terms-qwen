<script setup>
import { computed } from 'vue'
import { sim, termsOfYear, termProgress, selectTerm } from '../state/simulation.js'
import { locale, t } from '../i18n.js'
import { TERMS, SEASONS } from '../data/terms.js'
import { formatBeijing, formatBeijingShort, BEIJING_OFFSET_MS } from '../astro/solar.js'
import Icon from './Icon.vue'

const cur = computed(() => TERMS[sim.termCtx.current.index])
const curData = computed(() => cur.value[locale.value])
const season = computed(() => SEASONS[cur.value.season])
const seasonLabel = computed(() => t('season' + cur.value.season.charAt(0).toUpperCase() + cur.value.season.slice(1)))
const instantStr = computed(() => formatBeijing(sim.termCtx.current.ms, locale.value, true))
const nextTerm = computed(() => TERMS[sim.termCtx.next.index])
const nextInstantStr = computed(() => formatBeijing(sim.termCtx.next.ms, locale.value, false))

const countdown = computed(() => {
  let ms = Math.max(0, sim.termCtx.next.ms - sim.simTime)
  const d = Math.floor(ms / 86400000); ms -= d * 86400000
  const h = Math.floor(ms / 3600000); ms -= h * 3600000
  const m = Math.floor(ms / 60000)
  return `${d}${t('dayUnit')} ${h}${t('hourUnit')} ${m}${t('minUnit')}`
})

const progressPct = computed(() => (termProgress.value * 100).toFixed(1) + '%')

const FIELDS = [
  { key: 'meaning', icon: 'info', title: 'meaningTitle' },
  { key: 'climate', icon: 'cloud', title: 'climateTitle' },
  { key: 'phenology', icon: 'leaf', title: 'phenologyTitle' },
  { key: 'farming', icon: 'wheat', title: 'farmingTitle' },
  { key: 'customs', icon: 'lantern', title: 'customsTitle' }
]

const gridItems = computed(() => termsOfYear.value.map(entry => {
  const term = TERMS[entry.index]
  const d = new Date(entry.ms + BEIJING_OFFSET_MS)
  const dateStr = `${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`
  return { entry, term, dateStr, data: term[locale.value] }
}))

function goPrev () { if (sim.termCtx.prev) selectTerm(sim.termCtx.prev.index, sim.termCtx.prev.year) }
function goNext () { selectTerm(sim.termCtx.next.index, sim.termCtx.next.year) }
</script>

<template>
  <div class="detail-panel">
    <div class="detail-head">
      <h2 class="panel-title">{{ t('detailTitle') }}</h2>
      <div class="detail-nav">
        <button type="button" class="icon-btn" :aria-label="t('prevTerm')" :title="t('prevTerm')" @click="goPrev">
          <Icon name="prev" :size="16" />
        </button>
        <button type="button" class="icon-btn" :aria-label="t('nextTerm')" :title="t('nextTerm')" @click="goNext">
          <Icon name="next" :size="16" />
        </button>
      </div>
    </div>

    <article class="term-card" :style="{ '--season': season.color, '--season-glow': season.glow }">
      <header class="term-card-head">
        <div>
          <div class="term-name-row">
            <h3 class="term-name">{{ curData.name }}</h3>
            <span v-if="cur.major" class="major-tag">{{ t('majorTerm') }}</span>
          </div>
          <div class="term-sub">
            <template v-if="locale === 'zh'">{{ cur.zh.pinyin }} · {{ cur.en.name }}</template>
            <template v-else>{{ cur.zh.name }} · {{ cur.zh.pinyin }}</template>
          </div>
        </div>
        <div class="term-season-badge" :style="{ background: season.color + '22', color: season.glow, borderColor: season.color + '66' }">
          {{ seasonLabel }}
        </div>
      </header>

      <div class="term-meta">
        <span class="meta-chip">{{ t('orderLabel') }} {{ TERMS.indexOf(cur) + 1 }} / 24</span>
        <span class="meta-chip">{{ t('lonLabel') }} {{ cur.lon }}°</span>
        <span class="meta-chip instant-chip" :title="t('atInstant')">
          <Icon name="clock" :size="13" />{{ instantStr }}
        </span>
      </div>

      <div class="term-progress">
        <div class="term-progress-label">
          <span>{{ t('progressLabel') }}</span>
          <span class="term-countdown">{{ t('untilNext') }} {{ countdown }}</span>
        </div>
        <div class="progress-track" role="progressbar" :aria-valuenow="Math.round(termProgress * 100)" aria-valuemin="0" aria-valuemax="100">
          <div class="progress-fill" :style="{ width: progressPct, background: season.color }"></div>
        </div>
        <div class="next-term-line">
          {{ t('nextTermLabel') }}：<b>{{ nextTerm[locale].name }}</b> · {{ t('beginsAt') }} {{ nextInstantStr }}
        </div>
      </div>

      <div class="term-fields">
        <section v-for="f in FIELDS" :key="f.key" class="term-field">
          <h4><Icon :name="f.icon" :size="15" />{{ t(f.title) }}</h4>
          <p>{{ curData[f.key] }}</p>
        </section>
      </div>

      <section class="term-poem">
        <h4><Icon name="brush" :size="15" />{{ t('poemTitle') }}</h4>
        <p class="poem-text" :lang="locale === 'zh' ? 'zh-CN' : 'en'">{{ curData.poem.text }}</p>
        <p class="poem-attr">—— {{ curData.poem.author }} {{ curData.poem.source }}
          <span v-if="locale === 'en'" class="poem-note">（{{ t('poemNote') }}）</span>
        </p>
      </section>

      <p class="regional-note">{{ t('regionalNote') }}</p>
    </article>

    <div class="term-list-block">
      <div class="term-list-head">
        <h3 class="panel-title small">{{ t('termListTitle') }}</h3>
        <span class="term-list-hint">{{ t('termListHint') }} · {{ sim.viewYear }}</span>
      </div>
      <div class="term-grid" role="list">
        <button v-for="item in gridItems" :key="item.term.id" type="button" role="listitem"
          class="term-cell"
          :class="{ current: sim.termCtx.current.index === item.entry.index && sim.termCtx.current.year === item.entry.year, major: item.term.major }"
          :style="{ '--sc': SEASONS[item.term.season].color }"
          :aria-current="sim.termCtx.current.index === item.entry.index ? 'true' : undefined"
          @click="selectTerm(item.entry.index, item.entry.year)">
          <span class="term-cell-dot"></span>
          <span class="term-cell-name">{{ item.data.name }}</span>
          <span class="term-cell-date">{{ item.dateStr }}</span>
        </button>
      </div>
    </div>
  </div>
</template>