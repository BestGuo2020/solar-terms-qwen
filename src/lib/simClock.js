/**
 * simClock.js — 全站唯一的"模拟时间"驱动
 *
 * 设计要点：
 *  · 只有一个真值 `clock.nowMs`（UTC 毫秒）。3D 场景、时间轴、详情面板、
 *    节气高亮全部从它派生，绝不各自计算时间，杜绝不同步。
 *  · `nowMs` 每帧更新（非响应式，避免 Vue 在 60fps 下疯狂重渲染）；
 *    另有一个 **10Hz 节流**的响应式快照 `ui`，供 Vue 组件使用。
 *  · 公转由 `playing + speed` 驱动；自转由 `rotationMode` 独立控制
 *    （需求要求"公转与自转分别控制"）。
 */

import { reactive, computed } from 'vue'
import {
  DAY_MS, YEAR_MIN, YEAR_MAX, TIMEZONE_LABEL,
  locateTerm, sunApparentLongitude, fmtBeijing, fmtBeijingLong, fmtBeijingTime,
  fmtDuration, fromBeijing, beijingParts, termInstants, axialTiltDegrees,
  yearPrecisionTier, precisionNoteForYear, uncertaintySecondsForYear, TIER_LABEL,
  deltaTSeconds, utcMs, VALIDATED_YEAR_MIN, VALIDATED_YEAR_MAX,
} from './astro.js'
import { sceneAzimuthFromSunLongitude } from '../three/orbitMath.js'
import { locale, t } from '../i18n/index.js'
import { fmtInstant } from './format.js'

/** 速度档位：每秒真实时间推进多少模拟秒。label/hint 走 i18n 词典（key 见下） */
export const SPEEDS = [
  { value: 1, key: 'speed.real' },
  { value: 60, key: 'speed.m1' },
  { value: 600, key: 'speed.m10' },
  { value: 3600, key: 'speed.h1' },
  { value: 21600, key: 'speed.h6' },
  { value: 86400, key: 'speed.d1' },
  { value: 604800, key: 'speed.w1' },
  { value: 15778800, key: 'speed.hy' },
  { value: 31557600, key: 'speed.y1' },
]

export const DEFAULT_SPEED = 86400 // 1 天/秒：一年约 6 分钟走完，公转清晰可见

/** 自转模式：与公转分开控制 */
export const ROTATION_MODES = [
  { value: 'demo', key: 'rot.demo' },
  { value: 'real', key: 'rot.real' },
  { value: 'off', key: 'rot.off' },
]
const DEMO_ROTATION_PERIOD_S = 24

export const MS_MIN = fromBeijing(YEAR_MIN, 1, 1, 0, 0, 0)
export const MS_MAX = fromBeijing(YEAR_MAX, 12, 31, 23, 59, 59)

const clampMs = (ms) => Math.min(MS_MAX, Math.max(MS_MIN, ms))

/** 与语言相关的时长文案：zh「14天8小时44分」/ en「14 d 8 h 44 min」 */
function durationText(ms) {
  const abs = Math.abs(ms)
  const d = Math.floor(abs / DAY_MS)
  const h = Math.floor((abs % DAY_MS) / 3600000)
  const m = Math.floor((abs % 3600000) / 60000)
  const parts = []
  if (d) parts.push(t('dur.d', { n: d }))
  if (h) parts.push(t('dur.h', { n: h }))
  parts.push(t('dur.m', { n: m }))
  return parts.join(locale.value === 'en' ? ' ' : '')
}

/** 与语言相关的不确定度文案 */
function uncText(sec) {
  if (sec >= 3600) return t('unc.h', { n: Math.round(sec / 3600) })
  if (sec >= 60) return t('unc.min', { n: Math.round(sec / 60) })
  return t('unc.s', { n: sec })
}

class SimClock {
  constructor() {
    this.nowMs = Date.now()
    // 默认**暂停在真实当前时间**：打开页面看到的就是"今天的地球位置与节气"，
    // 且标注为"当前真实时间"而不是"模拟时间"。用户点播放后才进入模拟推进。
    this.playing = false
    this.speed = DEFAULT_SPEED
    this.rotationMode = 'demo'
    this.hasEverPlayed = false
    // 'civil' = 北京时间（民用时）；'tt' = 动力学时 TT（不依赖地球自转，远年更可靠）
    this.displayMode = 'civil'

    this._spinAngle = 0            // 演示/停止模式下的自转角（弧度）
    this._lastReal = performance.now()
    this._listeners = new Set()
    this._uiTimer = 0
    this.scrubbing = false
  }

  /** 每帧调用；realDeltaSec 为真实经过的秒数 */
  tick(realDeltaSec) {
    const dt = Math.min(0.25, Math.max(0, realDeltaSec)) // 限制单帧步长，切回页面时不会瞬移
    if (this.playing) {
      this.nowMs = clampMs(this.nowMs + dt * 1000 * this.speed)
      if (this.nowMs >= MS_MAX || this.nowMs <= MS_MIN) this.playing = false
    }
    // 自转独立推进
    if (this.rotationMode === 'demo' && this.playing) {
      this._spinAngle += (dt / DEMO_ROTATION_PERIOD_S) * Math.PI * 2
    }
  }

  /** 供 SceneManager 使用：地球自转角（弧度） */
  spinAngle(spinAngleReal) {
    if (this.rotationMode === 'real') return spinAngleReal
    return this._spinAngle
  }

  /** 与当前真实时间的偏差；超过 90 秒就认为处于"模拟时间" */
  get deviationMs() { return this.nowMs - Date.now() }
  get isSimulated() { return Math.abs(this.deviationMs) > 90000 }

  setMs(ms, { pause = false } = {}) {
    this.nowMs = clampMs(ms)
    if (pause) this.playing = false
    this.publish(true)
  }

  setSpeed(v) { this.speed = v }
  setPlaying(p) {
    this.playing = p
    if (p) this.hasEverPlayed = true
    this.publish(true)
  }
  toggle() { this.setPlaying(!this.playing) }
  setRotationMode(m) { this.rotationMode = m }
  setDisplayMode(m) {
    this.displayMode = m === 'tt' ? 'tt' : 'civil'
    this.publish(true)
  }

  backToToday() {
    this.nowMs = Date.now()
    this.publish(true)
  }

  /** 跳到某年某节气的准确交节时刻，并按需求暂停自动播放 */
  jumpToTerm(year, termIndex) {
    const t = termInstants(year).byIndex.find((x) => x.index === termIndex)
    if (!t || !t.valid) return null
    this.setMs(t.ms, { pause: true })
    return t
  }

  /** 订阅 10Hz 快照更新 */
  subscribe(fn) { this._listeners.add(fn); return () => this._listeners.delete(fn) }

  /** 节流发布 UI 快照 */
  publish(force = false) {
    const now = performance.now()
    if (!force && now - this._uiTimer < 100) return
    this._uiTimer = now
    ui.ms = this.nowMs
    ui.playing = this.playing
    ui.speed = this.speed
    ui.rotationMode = this.rotationMode
    ui.scrubbing = this.scrubbing
    ui.hasEverPlayed = this.hasEverPlayed
    ui.displayMode = this.displayMode
    for (const fn of this._listeners) fn(ui)
  }
}

export const clock = new SimClock()

// ---------------------------------------------------------------------------
// 响应式快照
// ---------------------------------------------------------------------------
export const ui = reactive({
  ms: clock.nowMs,
  playing: clock.playing,
  speed: clock.speed,
  rotationMode: clock.rotationMode,
  scrubbing: false,
  hasEverPlayed: false,
  displayMode: 'civil',
})

export const sim = computed(() => {
  const ms = ui.ms
  const loc = locateTerm(ms)
  const lon = sunApparentLongitude(ms)
  const p = beijingParts(ms)
  const L = locale.value
  const tier = yearPrecisionTier(p.year)
  const unc = uncertaintySecondsForYear(p.year)
  const ttMs = ms + deltaTSeconds(ms) * 1000
  const shownMs = ui.displayMode === 'tt' ? ttMs : ms
  return {
    ms,
    year: p.year,
    beijingDate: fmtBeijing(ms),
    beijingDateTime: fmtBeijing(ms, { seconds: true }),
    beijingLong: fmtBeijingLong(ms),
    beijingTime: fmtBeijingTime(ms),
    yearMonthDay: `${p.year}-${String(p.month).padStart(2, '0')}-${String(p.day).padStart(2, '0')}`,
    hourMinute: `${String(p.hour).padStart(2, '0')}:${String(p.minute).padStart(2, '0')}`,
    second: p.second,
    solarLongitude: lon,
    earthHeliocentricLongitude: sceneAzimuthFromSunLongitude(lon),
    current: loc.current,
    next: loc.next,
    progress: loc.progress,
    dayInTerm: loc.dayInTerm,
    elapsedDays: loc.elapsedDays,
    remainingMs: loc.remainingMs,
    remainingText: durationText(loc.remainingMs),
    season: loc.current.season,
    atExactInstant: loc.atExactInstant,
    axialTilt: axialTiltDegrees(ms),
    precisionTier: tier,
    tierLabel: t('tier.' + tier),
    precisionNote: L === 'en'
      ? t('note.' + tier, { y: p.year, u: uncText(unc), a: VALIDATED_YEAR_MIN, b: VALIDATED_YEAR_MAX, max: YEAR_MAX })
      : precisionNoteForYear(p.year),
    uncertaintySeconds: unc,
    uncertaintyText: uncText(unc),
    deltaT: deltaTSeconds(ms),
    // 动力学时 TT 读数 = 民用时读数 + ΔT；远年场景下它不含地球自转的不确定性
    shownDateTime: fmtInstant(shownMs, L, { seconds: true }),
    shownDate: fmtInstant(shownMs, L, { seconds: false }),
    shownTime: fmtInstant(shownMs, L, { seconds: true }).split(' ').slice(-1)[0],
    shownScaleLabel: ui.displayMode === 'tt' ? t('tz.tt') : t('tz.label'),
    tzLabel: t('tz.label'),
    isSimulated: clock.isSimulated,
    deviationMs: clock.deviationMs,
    deviationText: durationText(clock.deviationMs),
    timezoneLabel: t('tz.label'),
  }
})

/** 当前显示年份的全部 24 个节气（含准确交节时刻），按公历年内先后排序 */
export const yearTerms = computed(() => {
  const y = beijingParts(ui.ms).year
  const t = termInstants(y)
  return { year: y, chronological: t.chronological, byIndex: t.byIndex }
})

// ---------------------------------------------------------------------------
// 供各组件调用的动作（都只改 clock.nowMs，因此天然同步）
// ---------------------------------------------------------------------------

/** 当前显示年份（北京时间） */
export function displayYear() {
  return beijingParts(ui.ms).year
}

/**
 * 跳到"所选年份"某个节气的准确交节时刻，并按需求暂停自动播放。
 * @param {number} index 节气序号 1..24
 */
export function selectTerm(index) {
  const y = displayYear()
  const t = clock.jumpToTerm(y, index)
  return t
}

/** 切换显示年份：保持月/日/时/分不变，只换年份（2 月 29 日会自动收敛到 28 日） */
export function setYear(year) {
  const y = Math.min(YEAR_MAX, Math.max(YEAR_MIN, Math.round(year)))
  const p = beijingParts(ui.ms)
  const lastDay = 32 - new Date(utcMs(y, p.month, 32)).getUTCDate()
  const d = Math.min(p.day, lastDay)
  clock.setMs(fromBeijing(y, p.month, d, p.hour, p.minute, p.second), { pause: true })
}

/** 由日期/时间输入框设置模拟时间（按北京时间解释），并暂停播放 */
export function setBeijingDate(year, month, day) {
  const p = beijingParts(ui.ms)
  clock.setMs(fromBeijing(year, month, day, p.hour, p.minute, 0), { pause: true })
}

export function setBeijingTime(hour, minute, second = 0) {
  const p = beijingParts(ui.ms)
  clock.setMs(fromBeijing(p.year, p.month, p.day, hour, minute, second), { pause: true })
}

/** 时间轴拖动：把 [0,1] 的进度映射为当年（北京时间）内的时刻，拖动期间暂停播放 */
export function scrubYearFraction(frac) {
  const y = displayYear()
  const start = fromBeijing(y, 1, 1, 0, 0, 0)
  const end = fromBeijing(y + 1, 1, 1, 0, 0, 0)
  const f = Math.min(1, Math.max(0, frac))
  clock.playing = false
  clock.setMs(start + (end - start) * f, { pause: true })
}

export function yearRangeMs(year) {
  return { start: fromBeijing(year, 1, 1, 0, 0, 0), end: fromBeijing(year + 1, 1, 1, 0, 0, 0) }
}

export { DAY_MS, YEAR_MIN, YEAR_MAX, TIMEZONE_LABEL }
