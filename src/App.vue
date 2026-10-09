<script setup>
/**
 * App.vue — 页面骨架（中/英双语）
 *
 * 布局：
 *   页头 → [3D 展示区 | 节气详情区] → 底部时间控制 → 24 节气一览 → 阅读区 → 页脚
 * 移动端会把详情区、控制区依次堆叠到 3D 区下方（见 SceneStage 与各组件的媒体查询），
 * 不再浮在场景上遮挡地球与轨道。
 */
import { computed, inject, onMounted, watch } from 'vue'
import SceneStage from './components/SceneStage.vue'
import TimeControls from './components/TimeControls.vue'
import TermDetail from './components/TermDetail.vue'
import TermList from './components/TermList.vue'
import SectionHistory from './components/SectionHistory.vue'
import SectionCulture from './components/SectionCulture.vue'
import SectionSong from './components/SectionSong.vue'
import SectionScience from './components/SectionScience.vue'
import SectionSources from './components/SectionSources.vue'
import { sim } from './lib/simClock.js'
import { YEAR_MIN, YEAR_MAX } from './lib/astro.js'
import { useI18n, applyDocMeta, locale, setLocale } from './i18n/index.js'
import { content } from './i18n/content.js'

const { t } = useI18n()
const hasWebGL = inject('webgl', true)
const currentTitle = computed(() => content.value.termsByIndex.get(sim.value.current.index)?.title || sim.value.current.name)
const nav = computed(() => [
  { id: 'history', label: t('nav.history') },
  { id: 'culture', label: t('nav.culture') },
  { id: 'song', label: t('nav.song') },
  { id: 'science', label: t('nav.science') },
  { id: 'sources', label: t('nav.sources') },
])

onMounted(applyDocMeta)
watch(locale, applyDocMeta)
</script>

<template>
  <a class="skip-link" href="#history">{{ t('skip.link') }}</a>
  <span id="top"></span>

  <header class="site-header">
    <div class="site-header__inner">
      <div>
        <h1 class="site-title">{{ t('header.title1') }}<em>{{ t('header.title2') }}</em></h1>
        <p class="site-subtitle">{{ t('header.subtitle') }}</p>
      </div>
      <div class="header-badges">
        <span class="seg lang-switch" role="group" :aria-label="t('header.lang')">
          <button type="button" :aria-pressed="locale === 'zh'" @click="setLocale('zh')">{{ t('header.lang.zh') }}</button>
          <button type="button" :aria-pressed="locale === 'en'" @click="setLocale('en')">{{ t('header.lang.en') }}</button>
        </span>
        <span class="badge" :class="sim.isSimulated ? 'badge--sim' : 'badge--live'">
          {{ sim.isSimulated ? t('clock.sim') : t('clock.real') }} · {{ sim.shownDateTime }}
        </span>
        <span class="badge">{{ currentTitle }} · {{ t('hud.lon', { d: sim.solarLongitude.toFixed(2) }) }}</span>
        <span class="badge">{{ sim.timezoneLabel }}</span>
        <span class="badge badge--warn" v-if="!hasWebGL">{{ t('badge.nowebgl') }}</span>
      </div>
      <nav class="site-nav" :aria-label="t('nav.history')">
        <a v-for="n in nav" :key="n.id" :href="'#' + n.id">{{ n.label }}</a>
      </nav>
    </div>
  </header>

  <main>
    <div class="stage-wrap">
      <SceneStage />
      <TermDetail />
    </div>

    <TimeControls />
    <TermList />

    <div class="reading">
      <div class="reading__inner">
        <SectionHistory />
        <SectionCulture />
        <SectionSong />
        <SectionScience />
        <SectionSources />
      </div>
    </div>
  </main>

  <footer class="site-footer">
    <div class="site-footer__inner">
      <p>{{ t('footer.about', { min: YEAR_MIN, max: YEAR_MAX }) }}</p>
      <p>{{ t('footer.simplify') }}</p>
      <p>{{ t('footer.precision', { min: YEAR_MIN, max: YEAR_MAX }) }}</p>
      <p>{{ t('footer.images') }}</p>
      <p>{{ t('footer.ops') }}</p>
    </div>
  </footer>
</template>

<style scoped>
.skip-link {
  position: absolute; left: -9999px; top: 0; z-index: 100;
  background: var(--gold); color: #1a1206; padding: 8px 14px; border-radius: 0 0 8px 0;
  font-size: 13px; text-decoration: none;
}
.skip-link:focus { left: 0; }
.site-nav {
  width: 100%; display: flex; gap: 6px; flex-wrap: wrap; margin-top: 10px;
  padding-top: 10px; border-top: 1px solid var(--line-dark);
}
.site-nav a {
  font-size: 12.5px; color: var(--fg-soft); text-decoration: none;
  border: 1px solid var(--line-dark); border-radius: 999px; padding: 3px 12px;
  transition: color 0.15s, border-color 0.15s, background 0.15s;
}
.site-nav a:hover { color: var(--gold-soft); border-color: rgba(217,164,65,0.5); background: rgba(217,164,65,0.10); }
.lang-switch { flex: 0 0 auto; }
code {
  font-family: ui-monospace, "SFMono-Regular", Consolas, monospace;
  background: rgba(255,255,255,0.07); border-radius: 4px; padding: 0 4px; font-size: 11.5px;
}
kbd {
  font-family: ui-monospace, Consolas, monospace; font-size: 11px;
  border: 1px solid var(--line-dark); border-bottom-width: 2px; border-radius: 4px;
  padding: 0 4px; background: rgba(255,255,255,0.06); color: var(--fg-soft);
}
b { color: var(--fg); }
</style>
