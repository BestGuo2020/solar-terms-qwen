<script setup>
/**
 * TermDetail.vue — 节气详情区（中/英双语）
 *
 * 显示的内容始终跟随唯一的模拟时间（simClock.ui.ms），
 * 因此与 3D 场景中的地球位置、轨道高亮、时间轴必然一致。
 * 文案走 i18n 词典；正文内容走 i18n/content.js 的语言数据集。
 *
 * 明确区分两件事：
 *   · "当前已进入的节气区间"——从上一次交节时刻起到下一次交节时刻止；
 *   · "该节气的交节时刻"——太阳黄经恰好等于该节气值的那一瞬间（精确到秒）。
 */
import { computed, ref, watch } from 'vue'
import { sim, yearTerms, selectTerm } from '../lib/simClock.js'
import { SEASON_COLOR } from '../data/termTable.js'
import { fmtInstantLong } from '../lib/format.js'
import { useI18n, isEn, locale } from '../i18n/index.js'
import { content } from '../i18n/content.js'

const { t } = useI18n()
const bodyEl = ref(null)
const term = computed(() => content.value.termsByIndex.get(sim.value.current.index))
const inst = computed(() => yearTerms.value.byIndex.find((x) => x.index === sim.value.current.index))
const color = computed(() => SEASON_COLOR[term.value.season])

const prevIndex = computed(() => ((term.value.index - 2 + 24) % 24) + 1)
const nextIndex = computed(() => (term.value.index % 24) + 1)
const prevTerm = computed(() => content.value.termsByIndex.get(prevIndex.value))
const nextTerm = computed(() => content.value.termsByIndex.get(nextIndex.value))

function go(index) { selectTerm(index) }

// 切换节气时把详情滚回顶部，避免停留在上一个节气的段落
watch(() => term.value.index, () => { if (bodyEl.value) bodyEl.value.scrollTop = 0 })
</script>

<template>
  <aside class="detail" :aria-label="t('detail.aria')">
    <header class="detail__head">
      <div class="detail__eyebrow">
        <span>{{ t('detail.index', { n: term.index }) }}</span>
        <span>·</span>
        <span>{{ t('detail.season', { s: term.seasonWord }) }}</span>
        <span>·</span>
        <span>{{ term.kindWord }}</span>
        <span v-if="term.major" class="badge badge--warn">{{ t('hud.major') }}</span>
      </div>
      <h2 class="detail__title">{{ term.title }}</h2>
      <div class="detail__pinyin">
        {{ term.subtitle }}<span v-if="term.altNames && term.altNames.length"> · {{ t('detail.alias', { a: term.altNames.join(isEn ? ', ' : '、') }) }}</span>
      </div>
      <dl class="detail__facts">
        <div><dt>{{ t('detail.f.lon') }}</dt><dd>{{ term.longitude }}°</dd></div>
        <div><dt>{{ t('detail.f.pos') }}</dt><dd>{{ t('detail.f.posVal', { s: term.seasonWord, n: Math.ceil(term.index / 6) }) }}</dd></div>
        <div>
          <dt>{{ t('detail.f.instant', { y: sim.current.year }) }}</dt>
          <dd>{{ inst ? fmtInstantLong(inst.ms, locale) : '—' }}</dd>
        </div>
        <div><dt>{{ t('detail.f.dayIn') }}</dt><dd>{{ t('detail.f.dayInVal', { n: sim.dayInTerm, d: sim.elapsedDays.toFixed(2) }) }}</dd></div>
        <div><dt>{{ t('detail.f.next') }}</dt><dd>{{ t('detail.f.nextVal', { name: content.termsByIndex.get(sim.next.index).title, y: sim.next.year }) }}</dd></div>
        <div><dt>{{ t('detail.f.until') }}</dt><dd>{{ sim.remainingText }}</dd></div>
      </dl>
      <p class="detail__sim" v-if="sim.isSimulated">
        {{ t('detail.sim') }} <b>{{ t('detail.sim.b') }}</b> {{ sim.shownDateTime }}{{ t('detail.sim2', { x: sim.deviationText }) }}
      </p>
      <p class="detail__sim" v-else>
        {{ t('detail.sim') }} <b>{{ t('detail.real.b') }}</b> {{ sim.shownDateTime }}{{ t('detail.tzWrap', { tz: sim.tzLabel }) }}
      </p>
      <p class="detail__sim detail__sim--warn" v-if="sim.precisionTier !== 'validated'">
        {{ sim.precisionNote }}
      </p>
    </header>

    <div class="detail__body" ref="bodyEl">
      <section class="block">
        <h3 class="block__title">{{ t('detail.b.meaning') }}</h3>
        <p>{{ term.meaning }}</p>
      </section>

      <section class="block">
        <h3 class="block__title">{{ t('detail.b.climate') }}</h3>
        <p>{{ term.climate }}</p>
      </section>

      <section class="block">
        <h3 class="block__title">{{ t('detail.b.phenology') }}</h3>
        <ul class="phenology">
          <li v-for="(p, i) in term.phenology.items" :key="i">{{ p }}</li>
        </ul>
        <p style="margin-top:7px;font-size:12.5px;color:var(--fg-soft)">{{ term.phenology.note }}</p>
      </section>

      <section class="block">
        <h3 class="block__title">{{ t('detail.b.farming') }}</h3>
        <p>{{ term.farming }}</p>
      </section>

      <section class="block">
        <h3 class="block__title">{{ t('detail.b.customs') }}</h3>
        <div class="custom-item" v-for="(c, i) in term.customs" :key="i">
          <div class="custom-item__t">{{ c.title }} <span class="custom-item__r">{{ c.region }}</span></div>
          <div class="custom-item__d">{{ c.text }}</div>
        </div>
      </section>

      <section class="block">
        <h3 class="block__title">{{ t('detail.b.food') }}</h3>
        <p>{{ term.food }}</p>
      </section>

      <section class="block">
        <h3 class="block__title">{{ t('detail.b.poems') }}</h3>
        <div class="poem" v-for="(p, i) in term.poems" :key="i">
          <div class="poem__text">{{ p.text }}</div>
          <div class="poem__src poem__src--orig" v-if="isEn && p.original" lang="zh-Hans">{{ p.original }}</div>
          <div class="poem__src">{{ t('detail.poemBy', { a: p.author, t: p.title }) }}</div>
          <div class="poem__note" v-if="p.note">{{ p.note }}</div>
        </div>
      </section>

      <section class="block" v-if="term.scienceNote">
        <h3 class="block__title">{{ t('detail.b.science') }}</h3>
        <div class="science-note">{{ term.scienceNote }}</div>
      </section>
    </div>

    <nav class="detail__nav" :aria-label="t('detail.nav')">
      <button type="button" class="btn" @click="go(prevIndex)" :title="prevTerm.title">← {{ prevTerm.title }}</button>
      <button type="button" class="btn" @click="go(nextIndex)" :title="nextTerm.title">{{ nextTerm.title }} →</button>
    </nav>
  </aside>
</template>

<style scoped>
.detail__sim { margin: 9px 0 0; font-size: 11.5px; color: var(--fg-faint); line-height: 1.7; }
.detail__sim b { color: var(--gold-soft); font-weight: 600; }
.detail__sim--warn { color: #e8c07d; }
.detail__facts dd { word-break: break-word; }
</style>
