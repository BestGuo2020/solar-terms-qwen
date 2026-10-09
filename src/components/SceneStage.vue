<script setup>
/**
 * SceneStage.vue — 3D 展示区（中/英双语）
 *
 * 负责：SceneManager 的生命周期、加载状态、HUD 信息、视角与辅助线开关。
 * 时间一律来自 lib/simClock.js 的单一模拟时钟，本组件不自行计算日期。
 * 文案一律走 i18n 词典；节气内容走 i18n/content.js 的语言数据集。
 */
import { ref, reactive, computed, onMounted, onBeforeUnmount, inject, nextTick, watch } from 'vue'
import { SceneManager, VIEWS, detectQuality } from '../three/SceneManager.js'
import { clock, ui, sim, selectTerm } from '../lib/simClock.js'
import { SEASON_COLOR } from '../data/termTable.js'
import { subSolarLatitude, subSolarLongitude } from '../three/orbitMath.js'
import { fmtDeg } from '../lib/astro.js'
import { fmtInstant } from '../lib/format.js'
import { useI18n, locale } from '../i18n/index.js'
import { content } from '../i18n/content.js'

const props = defineProps({ quality: { type: String, default: '' } })
const emit = defineEmits(['status'])
const { t } = useI18n()

const hasWebGL = inject('webgl', true)
const stageEl = ref(null)
const loading = ref(true)
const loadProgress = ref(0)
const loadText = ref('')
const loadError = ref('')
const statusNotes = ref([])
let manager = null

const helperDefs = [
  { key: 'axis', labelKey: 'helper.axis', hintKey: 'helper.axis.hint' },
  { key: 'equator', labelKey: 'helper.equator', hintKey: 'helper.equator.hint' },
  { key: 'tropics', labelKey: 'helper.tropics', hintKey: 'helper.tropics.hint' },
  { key: 'polarCircles', labelKey: 'helper.polar', hintKey: 'helper.polar.hint' },
  { key: 'direction', labelKey: 'helper.direction', hintKey: 'helper.direction.hint' },
  { key: 'orbit', labelKey: 'helper.orbit', hintKey: 'helper.orbit.hint' },
  { key: 'markers', labelKey: 'helper.markers', hintKey: 'helper.markers.hint' },
]

const helpers = reactive({
  axis: true, equator: true, tropics: true, polarCircles: false,
  direction: true, orbit: true, markers: true, labels: 'all',
})
const labelModes = [
  { value: 'all', labelKey: 'labels.all' },
  { value: 'major', labelKey: 'labels.major' },
  { value: 'none', labelKey: 'labels.none' },
]
const qualityOpts = [
  { v: 'high', labelKey: 'quality.high' },
  { v: 'medium', labelKey: 'quality.medium' },
  { v: 'low', labelKey: 'quality.low' },
]

const currentView = ref('default')
const fps = ref(null)
const autoDegraded = ref(null)

// --- 右下角控制面板：默认收起为一个圆形按钮，点开才是分组面板 ---
const PANEL_LS_KEY = 'jieqi24.hudPanel'
function readPanelOpen() {
  try { return localStorage.getItem(PANEL_LS_KEY) === '1' } catch { return false }
}
const panelOpen = ref(readPanelOpen())
function togglePanel() {
  panelOpen.value = !panelOpen.value
  try { localStorage.setItem(PANEL_LS_KEY, panelOpen.value ? '1' : '0') } catch { /* ignore */ }
}
// 左下天文读数：默认一行，点击展开说明
const geoOpen = ref(false)

// 支持 ?q=high|medium|low 固定画质、?nodegrade 关闭自动降级（验收与慢机器排查用）
const urlParams = typeof location !== 'undefined' ? new URLSearchParams(location.search) : new URLSearchParams()
const qParam = urlParams.get('q')
const noAutoDegrade = urlParams.has('nodegrade')
const quality = ref(['high', 'medium', 'low'].includes(qParam) ? qParam : (props.quality || detectQuality()))

// --- HUD 数据 ---------------------------------------------------------------
const term = computed(() => content.value.termsByIndex.get(sim.value.current.index))
const seasonColor = computed(() => SEASON_COLOR[sim.value.current.season] || '#7fb8a4')

/** 天文读数：明确区分"太阳黄经"与"3D 场景中的坐标角度" */
const geo = computed(() => {
  const ms = ui.ms
  const lon = sim.value.solarLongitude
  const eps = sim.value.axialTilt
  const lat = subSolarLatitude(lon, eps)
  const slon = subSolarLongitude(ms, eps)
  return {
    sunLon: fmtDeg(lon, 3),
    earthLon: fmtDeg(sim.value.earthHeliocentricLongitude, 3),
    subLat: `${lat >= 0 ? (locale.value === 'en' ? 'N ' : '北纬 ') : (locale.value === 'en' ? 'S ' : '南纬 ')}${Math.abs(lat).toFixed(2)}°`,
    tilt: eps.toFixed(3) + '°',
    termStart: fmtInstant(sim.value.current.ms, locale.value, { seconds: false }),
    nextStart: fmtInstant(sim.value.next.ms, locale.value, { seconds: false }),
  }
})

// --- 生命周期 ---------------------------------------------------------------
onMounted(async () => {
  if (!hasWebGL) {
    loading.value = false
    loadError.value = t('loader.nowebgl')
    return
  }
  await nextTick()
  if (!stageEl.value) return
  loadText.value = t('loader.init')
  manager = new SceneManager(stageEl.value, {
    quality: quality.value,
    onSelectTerm: (index) => { selectTerm(index); emit('status', { kind: 'select', index }) },
    onProgress: ({ progress, done, total }) => {
      loadProgress.value = progress
      loadText.value = progress < 1 ? t('loader.tex', { done, total }) : t('loader.done')
    },
    onStatus: (info) => {
      if (info.kind === 'fps') { fps.value = info.fps; return }
      if (info.kind === 'auto-degrade') {
        quality.value = info.to
        autoDegraded.value = info
        note(t('note.degrade', { fps: info.fps, from: qLabel(info.from), to: qLabel(info.to) }))
        return
      }
      if (info.kind === 'texture-fallback') {
        const names = [...(info.failures || []), ...(info.missing || [])]
        if (names.length) note(t('note.texfail', { names: names.join(', ') }))
        return
      }
      if (info.kind === 'ready') { loading.value = false; return }
      emit('status', info)
    },
  })
  if (noAutoDegrade) manager.setAutoDegrade(false)
  if (typeof window !== 'undefined' && window.__jieqi) window.__jieqi.scene = manager
  manager.ready?.catch?.((e) => {
    loading.value = false
    loadError.value = t('loader.fail', { e: e?.message || e })
  })
  setTimeout(() => {
    if (loading.value) {
      loading.value = false
      note(t('loader.slow'))
    }
  }, 12000)
})

onBeforeUnmount(() => {
  manager?.dispose()
  manager = null
})

// 切换语言时重绘 3D 场景内的文字标签（轨道节气名、春分点、赤道/回归线等）
watch(locale, () => { manager?.refreshLabels() })

function note(text) {
  if (!statusNotes.value.includes(text)) statusNotes.value.push(text)
}
function qLabel(q) { return t('quality.' + q) }

// --- 交互 -------------------------------------------------------------------
function setView(id) {
  currentView.value = id
  manager?.setView(id)
}
function resetView() { setView('default') }
function applyHelpers() { manager?.setHelpers({ ...helpers }) }
function toggleHelper(key) { helpers[key] = !helpers[key]; applyHelpers() }
function setLabelMode(m) { helpers.labels = m; applyHelpers() }
function setQuality(q) { quality.value = q; manager?.setQuality(q); autoDegraded.value = null }
function saveSnapshot() {
  try {
    const url = manager?.snapshot()
    if (!url) return
    const a = document.createElement('a')
    a.href = url
    a.download = `solar-terms-${sim.value.current.name}-${sim.value.yearMonthDay}.png`
    a.click()
  } catch (e) { note(t('note.shotfail', { e: e?.message || e })) }
}
defineExpose({ setView, resetView, manager: () => manager })
</script>

<template>
  <div class="stage-col">
    <div ref="stageEl" class="stage" aria-label="Earth revolving around the Sun — 3D scene"></div>

    <!-- 加载状态 -->
    <div class="loader" :hidden="!loading" role="status" aria-live="polite">
      <div class="loader__ring" aria-hidden="true"></div>
      <div class="loader__text">{{ loadError || loadText }}</div>
      <div class="loader__bar" v-if="!loadError" aria-hidden="true">
        <i :style="{ width: (loadProgress * 100).toFixed(0) + '%' }"></i>
      </div>
    </div>

    <!-- HUD：桌面端浮在场景上，移动端自动排到场景下方，避免遮挡地球与轨道 -->
    <div class="hud">
      <div class="hud-term">
        <div class="hud-term__top">
          <span class="hud-season" :style="{ '--c': seasonColor }" aria-hidden="true"></span>
          <span class="hud-term__name">{{ term.title }}</span>
          <span class="hud-term__meta">
            {{ t('hud.index', { n: term.index }) }} · {{ t('hud.season', { s: term.seasonWord }) }} · {{ term.kindWord }} · {{ t('hud.lon', { d: term.longitude }) }}
          </span>
        </div>
        <div class="hud-term__tip">{{ term.tip }}</div>
        <div class="hud-term__row">
          <span>{{ t('hud.dayIn') }} <b>{{ t('hud.dayUnit', { n: sim.dayInTerm }) }}</b></span>
          <span>{{ t('hud.untilNext') }} <b>{{ sim.remainingText }}</b></span>
          <span v-if="sim.atExactInstant"><b>{{ t('hud.exact') }}</b></span>
        </div>
        <div class="hud-term__row">
          <span>{{ t('hud.termStart', { name: term.title }) }}<b>{{ geo.termStart }}</b></span>
          <span>{{ t('hud.nextStart', { name: content.termsByIndex.get(sim.next.index).title }) }}<b>{{ geo.nextStart }}</b></span>
        </div>
      </div>

      <div class="hud-clock">
        <div class="hud-clock__time">
          <div class="hud-clock__big">{{ sim.shownDateTime }}</div>
          <div class="hud-clock__small">
            {{ sim.isSimulated ? t('clock.sim') : t('clock.real') }}
            <span v-if="sim.isSimulated">{{ t('clock.dev', { x: sim.deviationText }) }}</span>
            · {{ sim.uncertaintyText }}
          </div>
          <div class="hud-clock__tz">{{ sim.shownScaleLabel }}</div>
        </div>
      </div>

      <!-- 天文读数：默认一行，点击展开映射说明 -->
      <button type="button" class="hud-geo" :class="{ 'is-open': geoOpen }"
              :aria-expanded="String(geoOpen)" :title="t('geo.toggleTip')" @click="geoOpen = !geoOpen">
        <span class="hud-geo__line">
          <b>λ☉</b> {{ geo.sunLon }}<i>·</i><b>L⊕</b> {{ geo.earthLon }}<i>·</i><b>{{ t('geo.sub') }}</b> {{ geo.subLat }}<i>·</i><b>ε</b> {{ geo.tilt }}
        </span>
        <span class="hud-geo__note" v-show="geoOpen">{{ t('geo.note') }}</span>
      </button>

      <div class="hud-bottomright">
        <ul class="hud-notes" v-if="statusNotes.length" aria-live="polite">
          <li v-for="(n, i) in statusNotes" :key="i">{{ n }}</li>
        </ul>

        <div class="hud-panel-wrap">
          <!-- 弹出面板：分组收纳全部场景控制 -->
          <div id="hud-panel" class="hud-panel" v-show="panelOpen" role="group" :aria-label="t('tools.panel')">
            <div class="hud-panel__group">
              <span class="hud-panel__t">{{ t('tools.views') }}</span>
              <div class="hud-panel__grid">
                <button v-for="v in VIEWS" :key="v.id" type="button" class="btn btn--sm"
                        :class="{ 'is-on': currentView === v.id }" :aria-pressed="currentView === v.id"
                        :title="t('view.' + v.id + '.hint')" @click="setView(v.id)">{{ t('view.' + v.id) }}</button>
                <button type="button" class="btn btn--sm" :title="t('view.reset.hint')" @click="resetView">{{ t('view.reset') }}</button>
              </div>
            </div>
            <div class="hud-panel__group">
              <span class="hud-panel__t">{{ t('tools.helpers') }}</span>
              <div class="hud-panel__grid hud-panel__grid--helpers">
                <button v-for="h in helperDefs" :key="h.key" type="button" class="btn btn--sm"
                        :aria-pressed="helpers[h.key]" :title="t(h.hintKey)"
                        @click="toggleHelper(h.key)">{{ t(h.labelKey) }}</button>
              </div>
            </div>
            <div class="hud-panel__group hud-panel__row">
              <span class="controls__label">{{ t('tools.labels') }}</span>
              <span class="seg seg--sm" role="group" :aria-label="t('tools.labels')">
                <button v-for="m in labelModes" :key="m.value" type="button"
                        :aria-pressed="helpers.labels === m.value" @click="setLabelMode(m.value)">{{ t(m.labelKey) }}</button>
              </span>
            </div>
            <div class="hud-panel__group hud-panel__row">
              <span class="controls__label">{{ t('tools.quality') }}</span>
              <span class="seg seg--sm" role="group" :aria-label="t('tools.quality')">
                <button v-for="q in qualityOpts" :key="q.v" type="button"
                        :aria-pressed="quality === q.v" @click="setQuality(q.v)">{{ t(q.labelKey) }}</button>
              </span>
              <button type="button" class="btn btn--sm" :title="t('tools.saveTip')" @click="saveSnapshot">{{ t('tools.save') }}</button>
            </div>
          </div>

          <!-- 唯一的常驻按钮 -->
          <button type="button" class="hud-fab"
                  :aria-expanded="String(panelOpen)" aria-controls="hud-panel"
                  :title="panelOpen ? t('tools.close') : t('tools.open')"
                  :aria-label="panelOpen ? t('tools.close') : t('tools.open')"
                  @click="togglePanel">
            <span aria-hidden="true">{{ panelOpen ? '✕' : '⚙' }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.stage-col { grid-area: stage; position: relative; display: flex; flex-direction: column; min-width: 0; }
.stage { flex: 1 1 auto; }

.hud { position: absolute; inset: 0; z-index: 10; pointer-events: none; }
.hud > * { pointer-events: auto; }

.hud-bottomright {
  position: absolute; right: 12px; bottom: 12px;
  display: flex; flex-direction: column; align-items: flex-end; gap: 8px;
  max-width: min(460px, 66%);
}
.hud-notes {
  margin: 0; padding: 0; list-style: none; display: grid; gap: 5px; width: 100%;
}
.hud-notes li {
  font-size: 11.5px; line-height: 1.6; color: #f3d9a8;
  background: rgba(60, 42, 12, 0.82); border: 1px solid rgba(217,164,65,0.4);
  border-radius: 7px; padding: 5px 9px; backdrop-filter: blur(6px);
}

/* 唯一常驻的圆形按钮 */
.hud-panel-wrap { position: relative; display: flex; flex-direction: column; align-items: flex-end; }
.hud-fab {
  width: 42px; height: 42px; border-radius: 50%;
  display: inline-flex; align-items: center; justify-content: center;
  font-size: 17px; line-height: 1; cursor: pointer;
  color: var(--gold-soft);
  background: rgba(14, 20, 34, 0.88);
  border: 1px solid rgba(217, 164, 65, 0.45);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(8px);
  transition: background 0.15s, transform 0.12s, border-color 0.15s;
}
.hud-fab:hover { background: rgba(30, 40, 62, 0.95); border-color: var(--gold); }
.hud-fab:active { transform: scale(0.94); }
.hud-fab[aria-expanded="true"] { background: rgba(217, 164, 65, 0.24); color: #fff3da; }

/* 弹出面板 */
.hud-panel {
  position: absolute; right: 0; bottom: 50px;
  width: 300px; max-width: calc(100vw - 24px);
  background: linear-gradient(170deg, rgba(13, 19, 33, 0.96), rgba(8, 12, 22, 0.96));
  border: 1px solid var(--line-dark);
  border-radius: 12px;
  padding: 12px 12px 10px;
  box-shadow: 0 12px 34px rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(10px);
  display: grid; gap: 10px;
}
.hud-panel__group { display: grid; gap: 6px; }
.hud-panel__t {
  font-size: 10.5px; letter-spacing: 0.14em; color: var(--fg-faint);
  text-transform: uppercase;
}
.hud-panel__grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 6px; }
.hud-panel__grid--helpers { grid-template-columns: repeat(3, minmax(0, 1fr)); }
.hud-panel__grid .btn { width: 100%; }
.hud-panel__row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }

/* 移动端：HUD 脱离场景、排到下方，避免遮挡地球和轨道 */
@media (max-width: 760px) {
  .stage-col { display: block; }
  .hud {
    position: static; inset: auto; pointer-events: auto;
    display: flex; flex-direction: column; gap: 8px; padding-top: 10px;
  }
  .hud > * { position: static; max-width: none; }
  .hud-term { margin: 0; }
  .hud-clock { align-items: stretch; }
  .hud-clock__time { text-align: left; min-width: 0; }
  .hud-bottomright { align-items: flex-start; }
  .hud-panel-wrap { align-items: flex-start; }
  .hud-panel { right: auto; left: 0; bottom: 50px; }
}
</style>
