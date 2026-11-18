/**
 * 统一模拟时钟：所有 UI 与 3D 场景共享同一时间源。
 * 由场景渲染循环调用 tick()；WebGL 不可用时由备用循环驱动。
 */
import { reactive, computed } from 'vue'
import {
  solarApparentLongitude, termContextAt, termsForYear, termInstant,
  beijingYear, beijingYearStartMs, MIN_YEAR, MAX_YEAR, BEIJING_OFFSET_MS
} from '../astro/solar.js'

const now = Date.now()

export const sim = reactive({
  simTime: now,
  nowMs: now,
  playing: false,
  live: true,            // live = 跟随真实时间
  speed: 86400,          // 模拟倍率：1 秒现实时间推进的模拟秒数
  viewYear: beijingYear(now),
  lambda: solarApparentLongitude(now),
  termCtx: termContextAt(now),
  quality: 'auto',
  cameraPreset: 'default',
  helpers: { axis: true, equator: false, tropics: false, direction: true, sunLine: true, labels: true }
})

const MIN_MS = beijingYearStartMs(MIN_YEAR)
const MAX_MS = beijingYearStartMs(MAX_YEAR + 1) - 1
const clampMs = (ms) => Math.max(MIN_MS, Math.min(MAX_MS, ms))

let ctxKey = ''
function refreshDerived () {
  sim.lambda = solarApparentLongitude(sim.simTime)
  const ctx = termContextAt(sim.simTime)
  const key = ctx.current.ms + ':' + (ctx.next ? ctx.next.ms : 0)
  if (key !== ctxKey) { sim.termCtx = ctx; ctxKey = key }
  const y = beijingYear(sim.simTime)
  if (y !== sim.viewYear) sim.viewYear = y
}

export function tick (dtMs) {
  sim.nowMs = Date.now()
  if (sim.playing) {
    sim.simTime = clampMs(sim.simTime + dtMs * sim.speed)
    if (sim.simTime <= MIN_MS || sim.simTime >= MAX_MS) sim.playing = false
  } else if (sim.live) {
    sim.simTime = sim.nowMs
  }
  refreshDerived()
}

export const isSimulated = computed(() => Math.abs(sim.simTime - sim.nowMs) > 60000)
export const termsOfYear = computed(() => termsForYear(sim.viewYear))
export const termProgress = computed(() => {
  const cur = sim.termCtx.current
  const delta = ((sim.lambda - cur.lon) % 360 + 360) % 360
  return Math.max(0, Math.min(1, delta / 15))
})

export function togglePlay () {
  if (sim.playing) { sim.playing = false; return }
  sim.live = false
  sim.playing = true
}
export function pause () { sim.playing = false }
export function setSpeed (v) { sim.speed = v }

export function setTime (ms, { keepPlaying = false } = {}) {
  sim.simTime = clampMs(ms)
  sim.live = false
  if (!keepPlaying) sim.playing = false
  ctxKey = ''
  refreshDerived()
}

export function goToday () {
  sim.live = true
  sim.playing = false
  sim.simTime = Date.now()
  ctxKey = ''
  refreshDerived()
}

export function selectTerm (index, year = sim.viewYear) {
  const inst = termInstant(year, index)
  if (inst) setTime(inst.ms)
}

export function setYear (year) {
  year = Math.max(MIN_YEAR, Math.min(MAX_YEAR, Math.round(year)))
  const d = new Date(sim.simTime + BEIJING_OFFSET_MS)
  const month = d.getUTCMonth(), day = d.getUTCDate()
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate()
  const ms = Date.UTC(year, month, Math.min(day, daysInMonth), d.getUTCHours(), d.getUTCMinutes(), d.getUTCSeconds()) - BEIJING_OFFSET_MS
  setTime(ms)
}

export function setQuality (q) { sim.quality = q }
export function setHelper (key, val) { sim.helpers[key] = val }
export function setCameraPreset (p) { sim.cameraPreset = p }