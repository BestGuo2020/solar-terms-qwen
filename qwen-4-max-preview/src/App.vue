<script setup>
import { onMounted, onBeforeUnmount, watch } from 'vue'
import SceneView from './components/SceneView.vue'
import DetailPanel from './components/DetailPanel.vue'
import TimeControls from './components/TimeControls.vue'
import HistorySection from './components/sections/HistorySection.vue'
import CultureSection from './components/sections/CultureSection.vue'
import SongSection from './components/sections/SongSection.vue'
import ScienceSection from './components/sections/ScienceSection.vue'
import SourcesSection from './components/sections/SourcesSection.vue'
import { locale, setLocale, t } from './i18n.js'
import { togglePlay, goToday, setCameraPreset, sim } from './state/simulation.js'

const NAV = [
  { id: 'scene', key: 'navScene' },
  { id: 'history', key: 'navHistory' },
  { id: 'culture', key: 'navCulture' },
  { id: 'song', key: 'navSong' },
  { id: 'science', key: 'navScience' },
  { id: 'sources', key: 'navSources' }
]

function onKey (e) {
  const tag = (e.target.tagName || '').toLowerCase()
  if (tag === 'input' || tag === 'select' || tag === 'textarea' || e.target.isContentEditable) return
  if (e.code === 'Space') { e.preventDefault(); togglePlay() }
  else if (e.key === 't' || e.key === 'T') goToday()
  else if (e.key === '1') setCameraPreset('overview')
  else if (e.key === '2') setCameraPreset('earth')
  else if (e.key === '3') setCameraPreset('default')
}

let io = null
onMounted(() => {
  window.addEventListener('keydown', onKey)
  setLocale(locale.value)
  io = new IntersectionObserver((entries) => {
    entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add('visible'); io.unobserve(en.target) } })
  }, { threshold: 0.12 })
  document.querySelectorAll('.reveal').forEach(el => io.observe(el))
})
watch(locale, () => {
  document.querySelectorAll('.reveal:not(.visible)').forEach(el => io && io.observe(el))
})
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKey)
  if (io) io.disconnect()
})
</script>

<template>
  <div class="app" :class="{ 'locale-en': locale === 'en' }">
    <header class="topbar">
      <a class="brand" href="#scene">
        <span class="brand-mark" aria-hidden="true">
          <svg viewBox="0 0 32 32" width="30" height="30">
            <circle cx="16" cy="16" r="6" fill="#e8c476" />
            <ellipse cx="16" cy="16" rx="13" ry="8.5" fill="none" stroke="#5b8fb9" stroke-width="1.2" transform="rotate(-18 16 16)" />
            <circle cx="27" cy="11.5" r="2.2" fill="#8fc3e8" />
          </svg>
        </span>
        <span class="brand-text">
          <span class="brand-title">{{ t('appTitle') }}</span>
          <span class="brand-sub">{{ t('appSubtitle') }}</span>
        </span>
      </a>
      <nav class="topnav" aria-label="Sections">
        <a v-for="n in NAV" :key="n.id" :href="'#' + n.id">{{ t(n.key) }}</a>
      </nav>
      <button type="button" class="lang-btn" :aria-label="t('langBtnLabel')" @click="setLocale(locale === 'zh' ? 'en' : 'zh')">
        {{ t('langBtn') }}
      </button>
    </header>

    <main>
      <section id="scene" class="stage">
        <div class="stage-grid">
          <div class="scene-col">
            <SceneView />
            <TimeControls />
          </div>
          <aside class="detail-col">
            <DetailPanel />
          </aside>
        </div>
        <p class="keyboard-hint">{{ t('keyboardHint') }}</p>
      </section>

      <div class="reading">
        <HistorySection />
        <CultureSection />
        <SongSection />
        <ScienceSection />
        <SourcesSection />
      </div>
    </main>

    <footer class="footer">
      <p>{{ t('footerNote') }}</p>
      <p class="footer-sub">{{ sim.viewYear }} · Asia/Shanghai (UTC+8) · Three.js + Vue</p>
    </footer>
  </div>
</template>