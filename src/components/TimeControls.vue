<script setup>
/**
 * TimeControls.vue — 底部时间控制（中/英双语）
 *
 * 播放/暂停、模拟速度、自转模式、时标（北京时间/TT）、年份选择、任意年份、
 * 日期时间选择、回到今天，以及一条**可拖动的年度时间轴**。
 * 时间轴上的节气刻度位置由该年份的真实交节时刻换算而来（不是把一年平均分成 24 段），
 * 拖动时直接改写唯一的模拟时间 clock.nowMs，因此地球位置、详情、列表必然同步。
 */
import { ref, computed, watch, onMounted } from 'vue'
import {
  clock, ui, sim, yearTerms, SPEEDS, ROTATION_MODES, DEFAULT_SPEED,
  YEAR_MIN, YEAR_MAX, setYear, setBeijingDate, setBeijingTime, scrubYearFraction, yearRangeMs,
} from '../lib/simClock.js'
import { locateTerm, fmtBeijing, utcMs, VALIDATED_YEAR_MIN, VALIDATED_YEAR_MAX } from '../lib/astro.js'
import { SEASON_COLOR } from '../data/termTable.js'
import { useI18n, locale } from '../i18n/index.js'
import { content } from '../i18n/content.js'

const { t } = useI18n()
const trackEl = ref(null)
const dragging = ref(false)
const currentTitle = computed(() => content.value.termsByIndex.get(sim.value.current.index)?.title || sim.value.current.name)

// --- 年份 / 年内区间 --------------------------------------------------------
const range = computed(() => yearRangeMs(yearTerms.value.year))
const span = computed(() => range.value.end - range.value.start)
const frac = computed(() => Math.min(1, Math.max(0, (ui.ms - range.value.start) / span.value)))

/** 季节色带：按真实交节时刻切分，而非平均 24 等分 */
const bands = computed(() => {
  const { start, end } = range.value
  const total = end - start
  const out = []
  const first = locateTerm(start).current
  let prevMs = start
  let prevSeason = first.season
  for (const tt of yearTerms.value.chronological) {
    out.push({
      season: prevSeason,
      left: ((prevMs - start) / total) * 100,
      width: ((tt.ms - prevMs) / total) * 100,
    })
    prevMs = tt.ms
    prevSeason = tt.season
  }
  out.push({ season: prevSeason, left: ((prevMs - start) / total) * 100, width: ((end - prevMs) / total) * 100 })
  return out
})

/** 24 个刻度（位置 = 真实交节时刻） */
const ticks = computed(() => {
  const { start } = range.value
  return yearTerms.value.chronological.map((tt) => ({
    index: tt.index,
    name: content.value.termsByIndex.get(tt.index)?.title || tt.name,
    major: tt.major, season: tt.season,
    left: ((tt.ms - start) / span.value) * 100,
    when: fmtBeijing(tt.ms),
  }))
})

const MONTHS_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const months = computed(() => {
  const { start } = range.value
  const y = yearTerms.value.year
  return Array.from({ length: 12 }, (_, i) => ({
    label: locale.value === 'en' ? MONTHS_EN[i] : `${i + 1}月`,
    left: ((setYMD(y, i + 1, 1) - start) / span.value) * 100,
  }))
})
function setYMD(y, m, d) {
  // 用 utcMs 构造，避免年份 1–99 被 Date.UTC 解释成 19xx 年
  return utcMs(y, m, d) - 8 * 3600000
}

// --- 播放控制 ---------------------------------------------------------------
const playing = computed({
  get: () => ui.playing,
  set: (v) => clock.setPlaying(v),
})
const speed = computed({
  get: () => ui.speed,
  set: (v) => clock.setSpeed(Number(v)),
})
const rotationMode = computed({
  get: () => ui.rotationMode,
  set: (v) => clock.setRotationMode(v),
})
const year = computed({
  get: () => yearTerms.value.year,
  set: (v) => setYear(Number(v)),
})
// 下拉只列"近世常用区间"（300 项足够滚动）；更远的年份用旁边的数字输入框直达。
const selectYears = computed(() => {
  const out = []
  for (let y = VALIDATED_YEAR_MIN; y <= 2200; y++) out.push(y)
  return out
})
const clampedSelectYear = computed(() =>
  Math.min(2200, Math.max(VALIDATED_YEAR_MIN, yearTerms.value.year)),
)
function onAnyYear(e) {
  const v = Math.round(Number(e.target.value))
  if (!Number.isFinite(v)) { e.target.value = String(sim.value.year); return }
  setYear(v)                       // setYear 内部会夹到 [YEAR_MIN, YEAR_MAX]
  e.target.value = String(yearTerms.value.year)
}

// --- 日期 / 时间输入（编辑时不被 10Hz 刷新打断） ---------------------------
const focusedField = ref(null)
const localDate = ref(sim.value.yearMonthDay)
const localTime = ref(sim.value.hourMinute)
watch(() => sim.value.yearMonthDay, (v) => { if (focusedField.value !== 'date') localDate.value = v })
watch(() => sim.value.hourMinute, (v) => { if (focusedField.value !== 'time') localTime.value = v })
onMounted(() => { localDate.value = sim.value.yearMonthDay; localTime.value = sim.value.hourMinute })

function onDateChange(e) {
  const v = e.target.value
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return
  const [y, m, d] = v.split('-').map(Number)
  if (y < YEAR_MIN || y > YEAR_MAX) { e.target.value = localDate.value; return }
  setBeijingDate(y, m, d)
}
function onTimeChange(e) {
  const v = e.target.value
  if (!/^\d{2}:\d{2}/.test(v)) return
  const [h, mi] = v.split(':').map(Number)
  setBeijingTime(h, mi, 0)
}
function backToToday() { clock.backToToday() }
function step(days) { clock.setMs(clock.nowMs + days * 86400000, { pause: true }) }

// --- 时间轴拖动 -------------------------------------------------------------
function fracFromEvent(e) {
  const r = trackEl.value.getBoundingClientRect()
  return Math.min(1, Math.max(0, (e.clientX - r.left) / r.width))
}
function onTrackDown(e) {
  dragging.value = true
  trackEl.value.setPointerCapture?.(e.pointerId)
  scrubYearFraction(fracFromEvent(e))
  e.preventDefault()
}
function onTrackMove(e) { if (dragging.value) scrubYearFraction(fracFromEvent(e)) }
function onTrackUp(e) {
  if (!dragging.value) return
  dragging.value = false
  trackEl.value.releasePointerCapture?.(e.pointerId)
}
function onTrackKey(e) {
  const stepMs = e.shiftKey ? 86400000 : 3600000   // Shift = 1 天，否则 1 小时
  if (e.key === 'ArrowRight' || e.key === 'ArrowUp') { e.preventDefault(); clock.setMs(clock.nowMs + stepMs, { pause: true }) }
  else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') { e.preventDefault(); clock.setMs(clock.nowMs - stepMs, { pause: true }) }
  else if (e.key === 'Home') { e.preventDefault(); clock.setMs(range.value.start, { pause: true }) }
  else if (e.key === 'End') { e.preventDefault(); clock.setMs(range.value.end - 1000, { pause: true }) }
}

const ariaValueText = computed(() => `${sim.value.shownDateTime}, ${sim.value.current.name}`)
const speedKey = computed(() => SPEEDS.find((s) => s.value === ui.speed)?.key || 'speed.d1')
const rotKey = computed(() => ROTATION_MODES.find((r) => r.value === ui.rotationMode)?.key || 'rot.demo')
</script>

<template>
  <div class="controls">
    <div class="controls__card">
      <!-- 年度时间轴 -->
      <div class="timeline">
        <div
          ref="trackEl"
          class="timeline__track"
          role="slider"
          tabindex="0"
          :aria-label="t('tl.aria')"
          :aria-valuemin="0" :aria-valuemax="100"
          :aria-valuenow="Number((frac * 100).toFixed(2))"
          :aria-valuetext="ariaValueText"
          @pointerdown="onTrackDown"
          @pointermove="onTrackMove"
          @pointerup="onTrackUp"
          @pointercancel="onTrackUp"
          @keydown="onTrackKey"
        >
          <div class="timeline__bands" aria-hidden="true">
            <i v-for="(b, i) in bands" :key="i"
               :style="{ left: b.left + '%', width: b.width + '%', background: SEASON_COLOR[b.season], opacity: 0.2 }"></i>
          </div>
          <div class="timeline__ticks" aria-hidden="true">
            <template v-for="tk in ticks" :key="tk.index">
              <span class="timeline__tick" :class="{ 'is-major': tk.major }" :style="{ left: tk.left + '%' }"></span>
              <span v-if="tk.major" class="timeline__tick-label" :style="{ left: tk.left + '%' }">{{ tk.name }}</span>
            </template>
          </div>
          <div class="timeline__playhead" :style="{ left: (frac * 100) + '%' }" aria-hidden="true"></div>
        </div>
        <div class="timeline__months" aria-hidden="true">
          <span v-for="m in months" :key="m.label" class="timeline__month" :style="{ left: m.left + '%' }">{{ m.label }}</span>
        </div>
        <div class="timeline__hint">{{ t('tl.hint', { year: yearTerms.year }) }}</div>
      </div>

      <!-- 播放与速度 -->
      <div class="controls__row">
        <div class="controls__group">
          <button type="button" class="btn btn--primary btn--icon"
                  :aria-label="playing ? t('ctl.pause.aria') : t('ctl.play.aria')"
                  :title="playing ? t('ctl.pause.tip') : t('ctl.play.tip')" @click="clock.toggle()">
            {{ playing ? t('ctl.pause') : t('ctl.play') }}
          </button>
          <button type="button" class="btn btn--icon" :title="t('ctl.minusDay.tip')" :aria-label="t('ctl.minusDay.tip')" @click="step(-1)">{{ t('ctl.minusDay') }}</button>
          <button type="button" class="btn btn--icon" :title="t('ctl.plusDay.tip')" :aria-label="t('ctl.plusDay.tip')" @click="step(1)">{{ t('ctl.plusDay') }}</button>
          <button type="button" class="btn" :title="t('ctl.today.tip')" @click="backToToday">{{ t('ctl.today') }}</button>
        </div>

        <div class="controls__group">
          <label class="controls__label" for="speed">{{ t('ctl.speed') }}</label>
          <select id="speed" class="input" v-model="speed" :title="t(speedKey + '.hint')">
            <option v-for="s in SPEEDS" :key="s.value" :value="s.value">{{ t(s.key + '.label') }}</option>
          </select>
          <span class="controls__label">{{ t(speedKey + '.hint') }}</span>
        </div>

        <div class="controls__group">
          <label class="controls__label" for="rot">{{ t('ctl.rot') }}</label>
          <select id="rot" class="input" v-model="rotationMode" :title="t(rotKey + '.hint')">
            <option v-for="r in ROTATION_MODES" :key="r.value" :value="r.value">{{ t(r.key + '.label') }}</option>
          </select>
          <span class="controls__label">{{ t(rotKey + '.hint') }}</span>
        </div>

        <div class="controls__group">
          <span class="controls__label">{{ t('ctl.timescale') }}</span>
          <span class="seg" role="group" :aria-label="t('ctl.timescale')">
            <button type="button" :aria-pressed="ui.displayMode === 'civil'" @click="clock.setDisplayMode('civil')">{{ t('ctl.civil') }}</button>
            <button type="button" :aria-pressed="ui.displayMode === 'tt'" :title="t('ctl.tt.tip')" @click="clock.setDisplayMode('tt')">{{ t('ctl.tt') }}</button>
          </span>
        </div>

        <div class="controls__spacer"></div>

        <div class="controls__group">
          <label class="controls__label" for="year">{{ t('ctl.year') }}</label>
          <select id="year" class="input" :value="clampedSelectYear"
                  @change="year = Number($event.target.value)"
                  :title="t('ctl.year.tip', { a: VALIDATED_YEAR_MIN, min: YEAR_MIN, max: YEAR_MAX })">
            <option v-for="y in selectYears" :key="y" :value="y">{{ y }}</option>
          </select>
          <div class="field">
            <label for="any-year">{{ t('ctl.anyYear') }}</label>
            <input id="any-year" type="number" class="input" style="width: 96px"
                   :min="YEAR_MIN" :max="YEAR_MAX" step="1" :value="sim.year"
                   :title="t('ctl.anyYear.tip', { min: YEAR_MIN, max: YEAR_MAX, a: VALIDATED_YEAR_MIN, b: VALIDATED_YEAR_MAX })"
                   @change="onAnyYear" />
          </div>
          <div class="field">
            <label for="pick-date">{{ t('ctl.date') }}</label>
            <input id="pick-date" type="date" class="input" v-model="localDate"
                   :min="`${YEAR_MIN}-01-01`" :max="`${YEAR_MAX}-12-31`"
                   @focus="focusedField = 'date'; clock.setPlaying(false)"
                   @blur="focusedField = null" @change="onDateChange" />
          </div>
          <div class="field">
            <label for="pick-time">{{ t('ctl.time') }}</label>
            <input id="pick-time" type="time" class="input" step="60" v-model="localTime"
                   @focus="focusedField = 'time'; clock.setPlaying(false)"
                   @blur="focusedField = null" @change="onTimeChange" />
          </div>
          <span class="controls__label">{{ t('ctl.bj') }}</span>
        </div>
      </div>

      <!-- 超出与权威历书比对区间时，明确提示精度为外推 -->
      <div class="controls__row" v-if="sim.precisionTier !== 'validated'">
        <span class="badge badge--warn badge--hint" role="status">{{ sim.precisionNote }}</span>
      </div>

      <div class="controls__row" v-if="!ui.hasEverPlayed && !ui.playing && !sim.isSimulated">
        <span class="badge badge--live badge--hint">
          {{ t('hint.firstRun') }}<b style="margin:0 3px">{{ t('hint.firstRun.b') }}</b>{{ t('hint.firstRun2') }}
        </span>
      </div>

      <div class="controls__row">
        <span class="badge" :class="sim.isSimulated ? 'badge--sim' : 'badge--live'">
          {{ sim.isSimulated ? t('clock.sim') : t('clock.real') }} · {{ sim.shownDateTime }} · {{ sim.shownScaleLabel }}
        </span>
        <span class="badge">
          {{ t('badge.termNow') }} <b style="margin-left:4px">{{ currentTitle }}</b> {{ t('badge.termNowUnit', { n: sim.dayInTerm }) }}
        </span>
        <span class="badge">{{ t('hud.lon', { d: sim.solarLongitude.toFixed(3) }) }}</span>
        <span class="badge" :class="sim.precisionTier === 'validated' ? '' : 'badge--warn'" :title="sim.precisionNote">
          {{ t('badge.precision', { u: sim.uncertaintyText, tier: sim.tierLabel }) }}
        </span>
        <span class="badge" v-if="ui.displayMode === 'tt'" :title="t('ctl.tt.tip')">{{ t('badge.deltaT', { d: sim.deltaT.toFixed(1) }) }}</span>
        <span class="badge" v-if="sim.isSimulated">{{ t('badge.dev', { x: sim.deviationText }) }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.timeline__bands { position: absolute; inset: 0; pointer-events: none; }
.timeline__bands i { position: absolute; top: 0; bottom: 0; display: block; }
b { color: var(--gold-soft); font-weight: 600; }
</style>
