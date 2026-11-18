<script setup>
/**
 * TermList.vue — 该年份 24 节气一览（中/英双语）
 *
 * 列表按公历年内的先后排列（小寒 → 大寒 → 立春 → … → 冬至），
 * 每格显示该年的真实交节时刻。点击任意一格会暂停播放并跳到该时刻。
 */
import { computed } from 'vue'
import { yearTerms, selectTerm, sim } from '../lib/simClock.js'
import { SEASON_COLOR } from '../data/termTable.js'
import { fmtInstant } from '../lib/format.js'
import { useI18n, locale } from '../i18n/index.js'
import { content } from '../i18n/content.js'

const { t } = useI18n()

const rows = computed(() =>
  yearTerms.value.chronological.map((tt) => {
    const c = content.value.termsByIndex.get(tt.index)
    return {
      index: tt.index,
      title: c?.title || tt.name,
      tip: c?.tip || '',
      longitude: tt.longitude,
      season: tt.season,
      major: tt.major,
      ms: tt.ms,
      when: fmtInstant(tt.ms, locale.value),
      color: SEASON_COLOR[tt.season],
      active: tt.index === sim.value.current.index,
    }
  }),
)

function pick(index) { selectTerm(index) }
</script>

<template>
  <section class="termlist" :aria-label="t('list.aria')">
    <div class="termlist__head">
      <h2 class="termlist__title">{{ t('list.title', { y: yearTerms.year }) }}</h2>
      <span class="termlist__sub">{{ t('list.sub') }}</span>
    </div>
    <div class="termlist__grid">
      <button
        v-for="r in rows"
        :key="r.index"
        type="button"
        class="tcell"
        :class="{ 'is-active': r.active, 'is-major': r.major }"
        :style="{ '--c': r.color }"
        :aria-current="r.active ? 'true' : undefined"
        :title="t('list.cellTip', { name: r.title, d: r.longitude, when: r.when })"
        @click="pick(r.index)"
      >
        <span class="tcell__dot" aria-hidden="true"></span>
        <span class="tcell__idx">{{ String(r.index).padStart(2, '0') }}</span>
        <span class="tcell__name">{{ r.title }}</span>
        <span class="tcell__lon">{{ r.longitude }}°</span>
        <span class="tcell__when">{{ r.when }}</span>
        <span class="tcell__tip">{{ r.tip }}</span>
      </button>
    </div>
  </section>
</template>
