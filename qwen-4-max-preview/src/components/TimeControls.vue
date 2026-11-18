<script setup>
import { ref, computed } from 'vue'
import {
  sim, isSimulated, togglePlay, setSpeed, setTime, goToday, setYear, selectTerm, termsOfYear
} from '../state/simulation.js'
import { locale, t, SPEED_OPTIONS } from '../i18n.js'
import {
  beijingInputValue, parseBeijingInput, beijingYearStartMs, beijingYearLength,
  MIN_YEAR, MAX_YEAR, BEIJING_OFFSET_MS
} from '../astro/solar.js'
import { TERMS, SEASONS } from '../data/terms.js'
import Icon from './Icon.vue'

const years = computed(() => {
  const arr = []
  for (let y = MIN_YEAR; y <= MAX_YEAR; y++) arr.push(y)
  return arr
})

const dateInput = computed(() => beijingInputValue(sim.simTime))
function onDateInput (e) {
  const ms = parseBeijingInput(e.target.value)
  if (ms != null) setTime(ms)
}
function onYearChange (e) { setYear(+e.target.value) }

// ---- 年度时间轴 ----
const track = ref(null)
const dragging = ref(false)
const yearLenDays = computed(() => beijingYearLength(sim.viewYear))
const yearStartMs = computed(() => beijingYearStartMs(sim.viewYear))

const thumbFrac = computed(() => {
  const days = (sim.simTime - yearStartMs.value) / 86400000
  return Math.max(0, Math.min(1, days / yearLenDays.value))
})

const monthMarks = computed(() => {
  const y = sim.viewYear
  const names = t('monthNames')
  return names.map((name, m) => ({
    name,
    frac: (Date.UTC(y, m, 1) - Date.UTC(y, 0, 1)) / (yearLenDays.value * 86400000)
  }))
})

const termTicks = computed(() => termsOfYear.value.map(entry => ({
  entry,
  term: TERMS[entry.index],
  frac: (entry.ms - yearStartMs.value) / (yearLenDays.value * 86400000)
})))

const seasonBands = computed(() => {
  const find = (id) => termsOfYear.value.find(e => TERMS[e.index].id === id)
  const marks = ['lichun', 'lixia', 'liqiu', 'lidong'].map(id => {
    const e = find(id)
    return e ? (e.ms - yearStartMs.value) / (yearLenDays.value * 86400000) : 0
  })
  return [
    { season: 'winter', from: 0, to: marks[0] },
    { season: 'spring', from: marks[0], to: marks[1] },
    { season: 'summer', from: marks[1], to: marks[2] },
    { season: 'autumn', from: marks[2], to: marks[3] },
    { season: 'winter', from: marks[3], to: 1 }
  ]
})

function fracFromEvent (e) {
  const rect = track.value.getBoundingClientRect()
  return Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
}
function applyFrac (frac) {
  setTime(yearStartMs.value + frac * yearLenDays.value * 86400000)
}
function onPointerDown (e) {
  if (e.target.closest('.tl-tick')) return
  dragging.value = true
  track.value.setPointerCapture(e.pointerId)
  applyFrac(fracFromEvent(e))
}
function onPointerMove (e) { if (dragging.value) applyFrac(fracFromEvent(e)) }
function onPointerUp () { dragging.value = false }
function onKeyDown (e) {
  const dayMs = 86400000
  if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') { setTime(sim.simTime - dayMs); e.preventDefault() }
  else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') { setTime(sim.simTime + dayMs); e.preventDefault() }
  else if (e.key === 'PageDown') { setTime(sim.simTime - 15 * dayMs); e.preventDefault() }
  else if (e.key === 'PageUp') { setTime(sim.simTime + 15 * dayMs); e.preventDefault() }
  else if (e.key === 'Home') { setTime(yearStartMs.value); e.preventDefault() }
  else if (e.key === 'End') { setTime(yearStartMs.value + (yearLenDays.value - 0.001) * dayMs); e.preventDefault() }
}
function tickTitle (item) {
  const d = new Date(item.entry.ms + BEIJING_OFFSET_MS)
  return `${item.term[locale.value].name} · ${d.getUTCMonth() + 1}-${d.getUTCDate()}`
}
</script>

<template>
  <div class="time-controls">
    <div class="tc-row">
      <button type="button" class="play-btn" :aria-label="sim.playing ? t('pause') : t('play')" @click="togglePlay">
        <Icon :name="sim.playing ? 'pause' : 'play'" :size="17" />
        <span>{{ sim.playing ? t('pause') : t('play') }}</span>
      </button>

      <label class="tc-field">
        <span class="tc-label">{{ t('speed') }}</span>
        <select :value="sim.speed" @change="setSpeed(+$event.target.value)">
          <option v-for="o in SPEED_OPTIONS" :key="o.value" :value="o.value">{{ t(o.key) }}</option>
        </select>
      </label>

      <label class="tc-field">
        <span class="tc-label">{{ t('dateLabel') }} (UTC+8)</span>
        <input type="datetime-local" :value="dateInput" :min="`${MIN_YEAR}-01-01T00:00`" :max="`${MAX_YEAR}-12-31T23:59`" @change="onDateInput" />
      </label>

      <label class="tc-field">
        <span class="tc-label">{{ t('yearLabel') }}</span>
        <select :value="sim.viewYear" @change="onYearChange">
          <option v-for="y in years" :key="y" :value="y">{{ y }}</option>
        </select>
      </label>

      <button type="button" class="today-btn" :class="{ live: sim.live && !isSimulated }" @click="goToday">
        <Icon name="today" :size="15" />{{ t('today') }}
      </button>
    </div>

    <div class="timeline-block">
      <div class="tl-caption">
        <span>{{ t('timelineLabel') }} · {{ sim.viewYear }}</span>
        <span class="tl-range">{{ t('yearRange') }}</span>
      </div>
      <div class="tl-months" aria-hidden="true">
        <span v-for="(m, i) in monthMarks" :key="i" :style="{ left: (m.frac * 100) + '%' }">{{ m.name }}</span>
      </div>
      <div ref="track" class="tl-track" role="slider" tabindex="0"
        :aria-label="t('timelineLabel')"
        :aria-valuemin="0" :aria-valuemax="Math.round(yearLenDays)"
        :aria-valuenow="Math.round(thumbFrac * yearLenDays)"
        :aria-valuetext="dateInput.replace('T', ' ')"
        @pointerdown="onPointerDown" @pointermove="onPointerMove"
        @pointerup="onPointerUp" @pointercancel="onPointerUp" @keydown="onKeyDown">
        <div class="tl-bands" aria-hidden="true">
          <div v-for="(b, i) in seasonBands" :key="i" class="tl-band"
            :style="{ left: (b.from * 100) + '%', width: ((b.to - b.from) * 100) + '%', background: SEASONS[b.season].color }"></div>
        </div>
        <button v-for="item in termTicks" :key="item.entry.index" type="button" class="tl-tick"
          :class="{ major: item.term.major, current: sim.termCtx.current.index === item.entry.index && sim.termCtx.current.year === item.entry.year }"
          :style="{ left: (item.frac * 100) + '%', '--sc': SEASONS[item.term.season].color }"
          :title="tickTitle(item)" :aria-label="tickTitle(item)"
          @click.stop="selectTerm(item.entry.index, item.entry.year)"></button>
        <div class="tl-thumb" :class="{ dragging }" :style="{ left: (thumbFrac * 100) + '%' }" aria-hidden="true"></div>
      </div>
    </div>
  </div>
</template>