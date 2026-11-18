/**
 * astro.js — 全站唯一的天文历算入口
 *
 * 所有"太阳黄经""交节时刻""当前节气"的判断都走这里，UI、时间轴、3D 场景
 * 共用同一个模拟时间戳（毫秒），杜绝各处各算一套导致的错位。
 *
 * 数据来源：astronomy-engine（MIT，https://github.com/cosinekitty/astronomy）
 *   - 太阳位置基于 VSOP87 截断级数 + IAU 1976/1980 岁差章动模型，
 *     出自 Jean Meeus《Astronomical Algorithms》体系；
 *   - `SunPosition()` 返回的是**地心视黄经**（apparent geocentric ecliptic
 *     longitude of date），已包含光行差与光行时改正，正是节气定义所用的量；
 *   - 交节时刻由本文件用二分法反解"视黄经 = 目标值"得到，
 *     并与库自带的 `Seasons()`（春分/夏至/秋分/冬至）互相校验（见 scripts/verify-astro.mjs）。
 *
 * 精度：交节时刻误差在秒级以内，远优于展示到"分钟"的需要。
 * 时区：所有对用户展示的节气时刻统一换算为北京时间 Asia/Shanghai (UTC+8)。
 */

import * as Astronomy from 'astronomy-engine'
import { TERM_TABLE } from '../data/termTable.js'

export const DEG = Math.PI / 180
export const RAD = 180 / Math.PI
export const DAY_MS = 86400000

/**
 * UI 开放的年份范围：**1–8800**（"赛博永生"档）。
 *
 * 两个边界都是"模型/约定有效域"，不是随手设的：
 *  · 上限 8800：格里历平均年 365.2425 d 比回归年 365.24219 d 长 0.00031 d，
 *    叠加 ΔT（TT−UTC）的长期增长，到 **约 8897 年**"小寒"的民用日期会漂出 1 月
 *    （落进上一年的 12 月），于是"某公历年的小寒"不再良定义；同时 IAU 岁差多项式
 *    在万年量级发散，"当日春分点"这个量本身失效。8800 是留出余量的硬上界。
 *  · 下限 1：公元前不开放——儒略/格里历回溯涉及"无公元 0 年"、历法约定、
 *    以及历史上并不存在统一时区等问题，展示成"北京时间"会误导。
 *
 * 精度分四级（yearPrecisionTier / uncertaintySecondsForYear）：
 *  历算几何（VSOP87）在几千年内误差远小于 1″；真正随年份恶化的是
 *  ① ΔT（TT→UTC；2150 年后为抛物线外推）与 ② 岁差/历法漂移。
 *  因此越远的年份，"几点几分"附带的不确定度越大，并建议改用动力学时 TT。
 */
export const YEAR_MIN = 1
export const YEAR_MAX = 8800

/** 与权威历书（紫金山天文台《中国天文年历》、香港天文台等）做过分钟级比对的区间 */
export const VALIDATED_YEAR_MIN = 1901
export const VALIDATED_YEAR_MAX = 2100

/** 'validated' | 'good' | 'moderate' | 'millennium' */
export function yearPrecisionTier(year) {
  if (year >= VALIDATED_YEAR_MIN && year <= VALIDATED_YEAR_MAX) return 'validated'
  if (year >= 1600 && year <= 2200) return 'good'
  if (year >= 1 && year <= 3000) return 'moderate'
  return 'millennium'
}

/**
 * 该年份交节时刻（民用时读数）的估计不确定度（秒）。
 * 量级依据：ΔT 分段多项式的拟合/外推误差 + 岁差与黄经零点的长期漂移。
 * 只用于界面提示，不参与计算。
 */
export function uncertaintySecondsForYear(year) {
  switch (yearPrecisionTier(year)) {
    case 'validated': return 60      // 与历书比对到分钟以内
    case 'good': return 120          // ΔT 仍为拟合/混合式
    case 'moderate': return 900      // ΔT 外推 + 历法/时区约定成分增大
    default: return 43200            // 千年尺度：ΔT 抛物线 + 历法漂移，仅作示意
  }
}

export const TIER_LABEL = {
  validated: '历书比对区间',
  good: '历算可靠区间',
  moderate: '外推区间',
  millennium: '千年尺度示意',
}

/** 给界面用的精度说明文案 */
export function precisionNoteForYear(year) {
  const tier = yearPrecisionTier(year)
  const unc = uncertaintySecondsForYear(year)
  const uncText = unc >= 3600 ? `±约 ${(unc / 3600).toFixed(0)} 小时`
    : unc >= 60 ? `±约 ${Math.round(unc / 60)} 分钟` : `±约 ${unc} 秒`
  if (tier === 'validated') {
    return `${VALIDATED_YEAR_MIN}–${VALIDATED_YEAR_MAX} 年（历书比对区间）：交节时刻与权威历书一致到分钟以内，不确定度 ${uncText}。`
  }
  if (tier === 'good') {
    return `${year} 年（历算可靠区间）：太阳黄经由 VSOP87 级数给出，ΔT 仍为观测拟合/混合式，不确定度 ${uncText}。`
  }
  if (tier === 'moderate') {
    return `${year} 年（外推区间）：几何仍可靠，但 ΔT 在 2050 年后为外推式、2150 年后为长期抛物线；` +
      `早于 1901 年并无统一"北京时间"（此处按 +08:00 折算）。不确定度 ${uncText}。`
  }
  return `${year} 年（千年尺度示意）：ΔT 已退化为长期抛物线外推、格里历相对回归年的漂移也达数天，` +
    `民用时读数不确定度 ${uncText}。若关心"几何上何时交节"，请切换到动力学时 TT 显示——` +
    `TT 不依赖地球自转，在该范围内仍由历算严格给出。再往后（约 8900 年之后）` +
    `"某公历年的某节气"会因历法漂移而不再良定义，故本页面止步于 ${YEAR_MAX} 年。`
}

/**
 * 通用纪元的岁差累积量（度）：春分点沿黄道每年西移约 50.29″。
 * 用于把星空点云旋转到当前历元（示意），让"春分点指向哪个星座"随年份变化可见。
 */
export function precessionLongitudeDeg(year) {
  return ((year - 2000) * 50.288) / 3600
}

/**
 * ΔT = TT − UTC（秒）。用于"动力学时 TT"显示模式：
 * TT 读数 = UTC 读数 + ΔT，它不含地球自转长期变化的不确定性。
 */
export function deltaTSeconds(ms) {
  const ut = (ms - Date.UTC(2000, 0, 1, 12, 0, 0)) / DAY_MS
  return Astronomy.DeltaT_EspenakMeeus(ut)
}

/**
 * 构造 UTC 毫秒。年份 1–99 必须走 setUTCFullYear，
 * 否则 Date.UTC(50, …) 会被解释成 1950 年（JS 的历史包袱）。
 */
export function utcMs(year, month = 1, day = 1, hour = 0, minute = 0, second = 0) {
  const d = new Date(Date.UTC(2000, month - 1, day, hour, minute, second))
  d.setUTCFullYear(year)
  return d.getTime()
}

/** 北京时间时区标识（页面对外统一声明用） */
export const TIMEZONE = 'Asia/Shanghai'
export const TIMEZONE_LABEL = '北京时间 (Asia/Shanghai, UTC+8)'

// ---------------------------------------------------------------------------
// 1. 太阳视黄经
// ---------------------------------------------------------------------------

/** 把任意角度归一化到 [0, 360) */
export function norm360(x) {
  const r = x % 360
  return r < 0 ? r + 360 : r
}

/**
 * 有符号角差 (lon - target)，归一化到 (-180, 180]。
 * 太阳黄经随时间单调递增（约 +0.95°~+1.02°/天），因此该差值在交节前后
 * 恰好从负号翻到正号，可直接用作二分法的判据（对 0°/360° 的跨越同样成立）。
 */
export function signedDelta(lon, target) {
  let d = norm360(lon - target)
  if (d > 180) d -= 360
  return d
}

/**
 * 太阳地心视黄经（度，[0,360)）。
 * @param {Date|number} when Date 对象或 UTC 毫秒
 */
export function sunApparentLongitude(when) {
  const date = typeof when === 'number' ? new Date(when) : when
  return norm360(Astronomy.SunPosition(date).elon)
}

/**
 * 黄赤交角（度）。用 IAU 2006 的平黄赤交角多项式；节气展示取约 23.4°。
 * 一年内变化极小，3D 场景按"定值"处理，符合真实情况（岁差在百年尺度才明显）。
 */
export function meanObliquity(when) {
  const ms = typeof when === 'number' ? when : when.getTime()
  // 儒略世纪数（自 J2000.0 = 2000-01-01T12:00 TT，这里用 UTC 近似，误差 < 0.0001°）
  const T = (ms - Date.UTC(2000, 0, 1, 12, 0, 0)) / (36525 * DAY_MS)
  const arcsec = 84381.406 - 46.836769 * T - 0.0001831 * T * T + 0.0020034 * T * T * T
  return arcsec / 3600
}

/** 场景与文案统一使用的地轴倾角（度） */
export function axialTiltDegrees(when = Date.now()) {
  return meanObliquity(when)
}

// ---------------------------------------------------------------------------
// 2. 交节时刻求解
// ---------------------------------------------------------------------------

/**
 * 反解"太阳视黄经 = target"的时刻（UTC 毫秒）。
 *
 * @param {number} target   目标黄经 0..360
 * @param {number} seedMs   搜索起点（近似值，仅用于定位区间，不参与结果）
 * @param {number} windowDays 单侧搜索窗口（天）
 * @returns {number|null}   UTC 毫秒；未能在窗口内定位时返回 null
 */
export function findSunLongitude(target, seedMs, windowDays = 15) {
  const t = norm360(target)
  const step = DAY_MS
  const limit = windowDays * 2

  // --- 定位跨越区间 [lo, hi]，使 signedDelta(lo) <= 0 < signedDelta(hi) ---
  let lo = seedMs
  let dLo = signedDelta(sunApparentLongitude(lo), t)
  let hi = null

  if (dLo === 0) return lo

  if (dLo < 0) {
    let prev = lo
    for (let i = 0; i < limit; i++) {
      const next = prev + step
      const dn = signedDelta(sunApparentLongitude(next), t)
      if (dn > 0) { lo = prev; hi = next; break }
      if (dn === 0) return next
      prev = next
    }
  } else {
    let prev = lo
    for (let i = 0; i < limit; i++) {
      const next = prev - step
      const dn = signedDelta(sunApparentLongitude(next), t)
      if (dn <= 0) { lo = next; hi = prev; break }
      prev = next
    }
  }

  if (hi === null) return null

  // --- 二分收敛到 < 20 ms（展示精度到分钟，余量充足） ---
  let a = lo
  let b = hi
  for (let i = 0; i < 80 && b - a > 20; i++) {
    const mid = (a + b) / 2
    const dm = signedDelta(sunApparentLongitude(mid), t)
    if (dm > 0) b = mid
    else a = mid
  }
  return Math.round((a + b) / 2)
}

const termCache = new Map()

/**
 * 某公历年 24 个节气的准确交节时刻。
 *
 * 年份归属采用中国通行习惯：year 年的小寒/大寒在 year 年 1 月，
 * 立春在 year 年 2 月，冬至在 year 年 12 月。
 *
 * @param {number} year 公历年
 * @returns {{year:number, byIndex:Array, chronological:Array, byId:Object}}
 */
export function termInstants(year) {
  if (termCache.has(year)) return termCache.get(year)

  const byIndex = TERM_TABLE.map((def) => {
    // 只把月/日当作搜索种子；真正的时刻来自天文反解
    const seed = utcMs(year, def.seedMonth, def.seedDay)
    let ms = findSunLongitude(def.longitude, seed, 15)
    if (ms === null) {
      // 极端兜底：放宽窗口再试一次
      ms = findSunLongitude(def.longitude, seed, 40)
    }
    return {
      ...def,
      year,
      ms,
      valid: ms !== null,
    }
  })

  const chronological = byIndex.slice().sort((a, b) => a.ms - b.ms)
  const byId = Object.fromEntries(byIndex.map((t) => [t.id, t]))
  const result = { year, byIndex, chronological, byId }
  termCache.set(year, result)
  return result
}

// 供 locateTerm 使用的"按时间排序的节气池"缓存。
// 键为中间年份；只有跨到新的年份区间时才会重建，因此每帧调用 locateTerm 的开销
// 只是一次线性扫描（约 72 项）而不是 3 次求解 + 排序。
let _poolKey = null
let _pool = null

function _getPool(year) {
  if (_poolKey === year && _pool) return _pool
  const pool = []
  for (const y of [year - 1, year, year + 1]) {
    if (y < YEAR_MIN - 1 || y > YEAR_MAX + 1) continue
    pool.push(...termInstants(y).byIndex)
  }
  pool.sort((a, b) => a.ms - b.ms)
  _poolKey = year
  _pool = pool
  return pool
}

/**
 * 定位某一时刻所处的节气区间。
 *
 * @param {number} ms UTC 毫秒
 * @param {number} [knownLongitude] 已经算好的太阳视黄经（避免重复计算）
 * @returns {{
 *   current: object,        // 已进入的节气（其交节时刻 <= ms）
 *   next: object,           // 下一个节气
 *   prev: object,           // 上一个节气
 *   progress: number,       // 在本区间内的进度 0..1
 *   dayInTerm: number,      // 进入本节气第几天（从 1 起）
 *   elapsedDays: number,    // 已经过的天数（浮点）
 *   remainingMs: number,    // 距下一个节气交节还有多少毫秒
 *   remainingDays: number,
 *   solarLongitude: number, // 当前太阳视黄经
 *   atExactInstant: boolean // ms 是否恰好是某个交节时刻（<=1s）
 * }}
 */
export function locateTerm(ms, knownLongitude) {
  const year = new Date(ms).getUTCFullYear()
  const pool = _getPool(year)

  let i = 0
  while (i < pool.length && pool[i].ms <= ms) i++
  // pool[i-1] 是已进入的节气，pool[i] 是下一个
  let cur = i > 0 ? pool[i - 1] : pool[0]
  let nxt = i < pool.length ? pool[i] : pool[pool.length - 1]
  if (i === 0) {
    // ms 早于池中最早时刻（极端情况）：往前补一年
    const prevYear = pool[0].year - 1
    if (prevYear >= YEAR_MIN) {
      const earlier = termInstants(prevYear).byIndex
      cur = earlier.reduce((a, b) => (b.ms <= ms && b.ms > a.ms ? b : a), earlier[0])
      nxt = pool[0]
    }
  }

  const span = Math.max(1, nxt.ms - cur.ms)
  const elapsed = Math.min(span, Math.max(0, ms - cur.ms))
  const solarLongitude = knownLongitude ?? sunApparentLongitude(ms)

  return {
    current: cur,
    next: nxt,
    prev: cur,
    progress: elapsed / span,
    dayInTerm: Math.floor(elapsed / DAY_MS) + 1,
    elapsedDays: elapsed / DAY_MS,
    remainingMs: nxt.ms - ms,
    remainingDays: (nxt.ms - ms) / DAY_MS,
    solarLongitude,
    atExactInstant: Math.abs(ms - cur.ms) <= 1000,
  }
}

/**
 * 相邻两个节气之间的间隔（天）。用于说明"节气不是固定 15 天"。
 */
export function termIntervalDays(aMs, bMs) {
  return (bMs - aMs) / DAY_MS
}

// ---------------------------------------------------------------------------
// 3. 北京时间（Asia/Shanghai）工具
// ---------------------------------------------------------------------------

const bjFormatter = new Intl.DateTimeFormat('zh-CN', {
  timeZone: TIMEZONE,
  year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', second: '2-digit',
  hour12: false,
})

const WEEKDAY_CN = ['日', '一', '二', '三', '四', '五', '六']

/** 取某一 UTC 瞬时的北京时间各字段 */
export function beijingParts(ms) {
  const parts = bjFormatter.formatToParts(new Date(ms))
  const g = {}
  for (const p of parts) g[p.type] = p.value
  let hour = Number(g.hour)
  if (hour === 24) hour = 0 // 部分 ICU 版本把 00 时报成 24
  const year = Number(g.year)
  const month = Number(g.month)
  const day = Number(g.day)
  return {
    year, month, day,
    hour, minute: Number(g.minute), second: Number(g.second),
    weekday: new Date(utcMs(year, month, day)).getUTCDay(),
  }
}

export function weekdayCn(ms) {
  return '星期' + WEEKDAY_CN[beijingParts(ms).weekday]
}

/** 该瞬时的北京时间相对 UTC 的偏移（分钟），中国自 1991 年后恒为 +480 */
export function beijingOffsetMinutes(ms) {
  const p = beijingParts(ms)
  const asUtc = utcMs(p.year, p.month, p.day, p.hour, p.minute, p.second)
  const base = Math.floor(ms / 1000) * 1000
  return Math.round((asUtc - base) / 60000)
}

/**
 * 由北京时间墙上时刻反推 UTC 毫秒。
 * 迭代修正偏移量，因此对历史上曾实行夏令时的时段也正确。
 */
export function fromBeijing(year, month, day, hour = 0, minute = 0, second = 0) {
  const wall = utcMs(year, month, day, hour, minute, second)
  let ms = wall - 8 * 3600000
  for (let i = 0; i < 4; i++) {
    const cand = wall - beijingOffsetMinutes(ms) * 60000
    if (cand === ms) break
    ms = cand
  }
  return ms
}

const pad2 = (n) => String(n).padStart(2, '0')

/** "2026-10-08 21:42" */
export function fmtBeijing(ms, { seconds = false, date = true, time = true } = {}) {
  const p = beijingParts(ms)
  const d = `${p.year}-${pad2(p.month)}-${pad2(p.day)}`
  const t = seconds
    ? `${pad2(p.hour)}:${pad2(p.minute)}:${pad2(p.second)}`
    : `${pad2(p.hour)}:${pad2(p.minute)}`
  if (date && time) return `${d} ${t}`
  if (date) return d
  return t
}

/** "2026年10月8日 21:42（星期四）" */
export function fmtBeijingLong(ms, { seconds = false } = {}) {
  const p = beijingParts(ms)
  const t = seconds
    ? `${pad2(p.hour)}:${pad2(p.minute)}:${pad2(p.second)}`
    : `${pad2(p.hour)}:${pad2(p.minute)}`
  return `${p.year}年${p.month}月${p.day}日 ${t}（星期${WEEKDAY_CN[p.weekday]}）`
}

/** "21:42:03" */
export function fmtBeijingTime(ms) {
  const p = beijingParts(ms)
  return `${pad2(p.hour)}:${pad2(p.minute)}:${pad2(p.second)}`
}

/** 把毫秒差写成"X天X小时X分" */
export function fmtDuration(ms) {
  const abs = Math.abs(ms)
  const d = Math.floor(abs / DAY_MS)
  const h = Math.floor((abs % DAY_MS) / 3600000)
  const m = Math.floor((abs % 3600000) / 60000)
  const parts = []
  if (d) parts.push(`${d}天`)
  if (h) parts.push(`${h}小时`)
  parts.push(`${m}分`)
  return parts.join('')
}

/** 度数格式化，如 "195.23°" */
export function fmtDeg(x, digits = 2) {
  return `${norm360(x).toFixed(digits)}°`
}
