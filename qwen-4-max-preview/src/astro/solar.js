/**
 * 太阳视黄经与二十四节气交节时刻计算
 * 方法：VSOP87 截断级数（地球日心黄经，Meeus《天文算法》表 32.A，千年引数）
 *       + 章动主项 + 光行差 + ΔT（Espenak–Meeus 多项式），得到太阳地心视黄经。
 * 交节时刻：对目标黄经做牛顿迭代求解，精度约 ±1 分钟（相对权威历书）。
 * 适用年份：1900–2100。显示时区：Asia/Shanghai (UTC+8)。
 */

const DEG = Math.PI / 180
const DAY_MS = 86400000
const J2000 = 2451545.0
export const MIN_YEAR = 1900
export const MAX_YEAR = 2100
export const BEIJING_OFFSET_MS = 8 * 3600000

// 节气顺序：立春起，至大寒止；对应太阳视黄经（度）
export const TERM_LONGITUDES = [
  315, 330, 345, 0, 15, 30, 45, 60, 75, 90, 105, 120,
  135, 150, 165, 180, 195, 210, 225, 240, 255, 270, 285, 300
]

// VSOP87 地球黄经周期项 [振幅(1e-8 rad), 相位(rad), 频率(rad/儒略世纪)]
const L0 = [
  175347046, 0, 0, 3341656, 4.6692568, 6283.07585, 34894, 4.6261, 12566.1517,
  3497, 2.7441, 5753.3849, 3418, 2.8289, 3.5231, 3136, 3.6277, 77713.7715,
  2676, 4.4181, 7860.4194, 2343, 6.1352, 3930.2097, 1324, 0.7425, 11506.7698,
  1273, 2.0371, 529.691, 1199, 1.1096, 1577.3435, 990, 5.233, 5884.927,
  902, 2.045, 26.298, 857, 3.508, 398.149, 780, 1.179, 5223.694,
  753, 2.533, 5507.553, 505, 4.583, 18849.228, 492, 4.205, 775.523,
  357, 2.92, 0.067, 317, 5.849, 11790.629, 284, 1.899, 796.298,
  271, 0.315, 10977.079, 243, 0.345, 5486.778, 206, 4.806, 2544.314,
  205, 1.869, 5573.143, 202, 2.458, 6069.777, 156, 0.833, 213.299,
  132, 3.411, 2942.463, 126, 1.083, 20.775, 115, 0.645, 0.98,
  103, 0.636, 4694.003, 102, 0.976, 15720.839, 102, 4.267, 7.114,
  99, 6.21, 2146.17, 98, 0.68, 155.42, 86, 5.98, 161000.69,
  85, 1.3, 6275.96, 85, 3.67, 71430.7, 80, 1.81, 17260.15,
  79, 3.04, 12036.46, 75, 1.76, 5088.63, 74, 3.5, 3154.69,
  74, 4.68, 801.82, 70, 0.83, 9437.76, 62, 3.98, 8827.39,
  61, 1.82, 7084.9, 57, 2.78, 6286.6, 56, 4.39, 14143.5,
  56, 3.47, 6279.55, 52, 0.19, 12139.55, 52, 1.33, 1748.02,
  51, 0.28, 5856.48, 49, 0.49, 1194.45, 41, 5.37, 8429.24,
  41, 2.4, 19651.05, 39, 6.17, 10447.39, 37, 6.04, 10213.29,
  37, 2.57, 1059.38, 36, 1.71, 2352.87, 36, 1.78, 6812.77,
  33, 0.59, 17789.85, 30, 0.44, 83996.85, 30, 2.74, 1349.87,
  25, 3.16, 4690.48
]
const L1 = [
  628331966747, 0, 0, 206059, 2.678235, 6283.07585, 4303, 2.6351, 12566.1517,
  425, 1.59, 3.523, 119, 5.796, 26.298, 109, 2.966, 1577.344,
  93, 2.59, 18849.23, 72, 1.14, 529.69, 68, 1.87, 398.15,
  67, 4.41, 5507.55, 59, 2.89, 5223.69, 56, 2.17, 155.42,
  45, 0.4, 796.3, 36, 0.47, 775.52, 29, 2.65, 7.11,
  21, 5.34, 0.98, 19, 1.85, 5486.78, 19, 4.97, 213.3,
  17, 2.99, 6275.96, 16, 0.03, 2544.31, 16, 1.43, 2146.17,
  15, 1.21, 10977.08, 12, 2.83, 1748.02, 12, 3.26, 5088.63,
  12, 5.27, 1194.45, 12, 2.08, 4694, 11, 0.77, 553.57,
  10, 1.3, 6286.6, 10, 4.24, 1349.87, 9, 2.7, 242.73,
  9, 5.64, 951.72, 8, 1.81, 2352.87, 6, 2.67, 9437.76,
  6, 2.32, 4690.48
]
const L2 = [
  52919, 0, 0, 8720, 1.0721, 6283.0758, 309, 0.867, 12566.152,
  27, 0.05, 3.52, 16, 5.19, 26.3, 16, 3.68, 155.42,
  10, 0.76, 18849.23, 9, 2.06, 77713.77, 7, 0.83, 775.52,
  5, 4.66, 1577.34, 4, 1.03, 7.11, 4, 3.44, 5573.14,
  3, 5.14, 796.3, 3, 6.05, 5507.55, 3, 1.19, 242.73,
  3, 6.12, 529.69, 3, 0.31, 398.15, 3, 2.28, 553.57,
  2, 4.38, 5223.69, 2, 3.75, 0.98
]
const L3 = [
  289, 5.844, 6283.076, 35, 0, 0, 17, 5.49, 12566.15,
  3, 5.2, 155.42, 1, 4.72, 3.52, 1, 5.3, 18849.23, 1, 5.97, 242.73
]
const L4 = [114, 3.142, 0, 8, 4.13, 6283.08, 1, 3.84, 12566.15]
const L5 = [1, 3.14, 0]

function seriesSum (table, T) {
  let s = 0
  for (let i = 0; i < table.length; i += 3) {
    s += table[i] * Math.cos(table[i + 1] + table[i + 2] * T)
  }
  return s
}

export const norm360 = (d) => ((d % 360) + 360) % 360
const wrap180 = (d) => { const x = norm360(d); return x > 180 ? x - 360 : x }

export const msToJd = (ms) => ms / DAY_MS + 2440587.5
export const jdToMs = (jd) => (jd - 2440587.5) * DAY_MS

/** ΔT = TT − UTC（秒），Espenak & Meeus (2006) 多项式，1900–2100 适用 */
export function deltaTSeconds (year) {
  let t, dt
  if (year < 1920) { t = year - 1900; dt = -2.79 + 1.494119 * t - 0.0598939 * t ** 2 + 0.0061966 * t ** 3 - 0.000197 * t ** 4 }
  else if (year < 1941) { t = year - 1920; dt = 21.20 + 0.84493 * t - 0.076100 * t ** 2 + 0.0020936 * t ** 3 }
  else if (year < 1961) { t = year - 1950; dt = 29.07 + 0.407 * t - t ** 2 / 233 + t ** 3 / 2547 }
  else if (year < 1986) { t = year - 1975; dt = 45.45 + 1.067 * t - t ** 2 / 260 - t ** 3 / 718 }
  else if (year < 2005) { t = year - 2000; dt = 63.86 + 0.3345 * t - 0.060374 * t ** 2 + 0.0017275 * t ** 3 + 0.000651814 * t ** 4 + 0.00002373599 * t ** 5 }
  else if (year < 2050) { t = year - 2000; dt = 62.92 + 0.32217 * t + 0.005589 * t ** 2 }
  else { dt = -20 + 32 * ((year - 1820) / 100) ** 2 - 0.5628 * (2150 - year) }
  return dt
}

/** 太阳地心视黄经（度），输入 UTC 毫秒（内部换算为力学时 TT） */
export function solarApparentLongitude (ms) {
  const year = new Date(ms).getUTCFullYear()
  const T = (msToJd(ms + deltaTSeconds(year) * 1000) - J2000) / 36525
  const tau = T / 10 // VSOP87 时间引数为儒略千年
  const Lrad = (seriesSum(L0, tau) + seriesSum(L1, tau) * tau + seriesSum(L2, tau) * tau ** 2 +
    seriesSum(L3, tau) * tau ** 3 + seriesSum(L4, tau) * tau ** 4 + seriesSum(L5, tau) * tau ** 5) / 1e8
  let L = norm360(Lrad / DEG + 180) // 地球日心黄经 → 太阳地心几何黄经（该截断表已含 FK5 基准）

  // 章动主项（角秒）
  const omega = (125.04452 - 1934.136261 * T + 0.0020708 * T * T) * DEG
  const Lsun = (280.4665 + 36000.7698 * T) * DEG
  const Lmoon = (218.3165 + 481267.8813 * T) * DEG
  const dPsi = (-17.20 * Math.sin(omega) - 1.32 * Math.sin(2 * Lsun) -
    0.23 * Math.sin(2 * Lmoon) + 0.21 * Math.sin(2 * omega)) / 3600

  // 光行差：-20.4898" / R（日地距离，AU）
  const e = 0.016708634 - 0.000042037 * T - 0.0000001267 * T * T
  const M = (357.52911 + 35999.05029 * T - 0.0001537 * T * T) * DEG
  const C = (1.914602 - 0.004817 * T - 0.000014 * T * T) * Math.sin(M) +
    (0.019993 - 0.000101 * T) * Math.sin(2 * M) + 0.000289 * Math.sin(3 * M)
  const v = M + C
  const R = 1.000001018 * (1 - e * e) / (1 + e * Math.cos(v))
  const aberration = -20.4898 / (3600 * R)

  return norm360(L + dPsi + aberration)
}

/** 某年 24 节气交节时刻（UTC ms），按时间排序（小寒起） */
const yearCache = new Map()
export function termsForYear (year) {
  year = Math.max(MIN_YEAR, Math.min(MAX_YEAR, Math.round(year)))
  if (yearCache.has(year)) return yearCache.get(year)
  const base = Date.UTC(year, 0, 5, 12) // 小寒约在 1 月 5 日
  const out = []
  for (let i = 0; i < 24; i++) {
    const lon = TERM_LONGITUDES[i]
    const offset = ((lon - 285 + 360) % 360) / 360 * 365.2422
    let t = base + offset * DAY_MS
    for (let k = 0; k < 8; k++) {
      const d = wrap180(solarApparentLongitude(t) - lon)
      t -= d / 0.9856 * DAY_MS
      if (Math.abs(d) < 1e-8) break
    }
    out.push({ index: i, lon, ms: Math.round(t), year })
  }
  out.sort((a, b) => a.ms - b.ms)
  yearCache.set(year, out)
  return out
}

export const beijingYear = (ms) => new Date(ms + BEIJING_OFFSET_MS).getUTCFullYear()

/** 当前时刻所处节气区间：返回 current / next / prev（含交节时刻） */
export function termContextAt (ms) {
  const y = beijingYear(ms)
  const all = [...termsForYear(y - 1), ...termsForYear(y), ...termsForYear(y + 1)]
  let cur = 0
  for (let i = 0; i < all.length; i++) { if (all[i].ms <= ms) cur = i; else break }
  return { current: all[cur], next: all[cur + 1], prev: all[cur - 1] || null }
}

/** 指定年份某节气（0=立春…23=大寒）的交节时刻 */
export function termInstant (year, index) {
  return termsForYear(year).find(t => t.index === index)
}

// ---- 北京时间格式化 ----
const bjParts = (ms) => {
  const d = new Date(ms + BEIJING_OFFSET_MS)
  return {
    y: d.getUTCFullYear(), m: d.getUTCMonth() + 1, d: d.getUTCDate(),
    h: d.getUTCHours(), mi: d.getUTCMinutes(), s: d.getUTCSeconds()
  }
}
const p2 = (n) => String(n).padStart(2, '0')

export function formatBeijing (ms, locale = 'zh', withSeconds = true) {
  const t = bjParts(ms)
  const time = `${p2(t.h)}:${p2(t.mi)}${withSeconds ? ':' + p2(t.s) : ''}`
  return locale === 'zh'
    ? `${t.y}年${t.m}月${t.d}日 ${time}`
    : `${t.y}-${p2(t.m)}-${p2(t.d)} ${time}`
}
export function formatBeijingShort (ms, locale = 'zh') {
  const t = bjParts(ms)
  return locale === 'zh' ? `${t.m}月${t.d}日 ${p2(t.h)}:${p2(t.mi)}` : `${p2(t.m)}-${p2(t.d)} ${p2(t.h)}:${p2(t.mi)}`
}
export function formatBeijingDate (ms, locale = 'zh') {
  const t = bjParts(ms)
  return locale === 'zh' ? `${t.y}年${t.m}月${t.d}日` : `${t.y}-${p2(t.m)}-${p2(t.d)}`
}
export function beijingInputValue (ms) {
  const t = bjParts(ms)
  return `${t.y}-${p2(t.m)}-${p2(t.d)}T${p2(t.h)}:${p2(t.mi)}`
}
export function parseBeijingInput (value) {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(value)
  if (!m) return null
  return Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]) - BEIJING_OFFSET_MS
}
export function beijingDayOfYear (ms) {
  const t = bjParts(ms)
  return (Date.UTC(t.y, t.m - 1, t.d) - Date.UTC(t.y, 0, 1)) / DAY_MS
}
export function beijingYearLength (year) {
  return (Date.UTC(year + 1, 0, 1) - Date.UTC(year, 0, 1)) / DAY_MS
}
export function beijingYearStartMs (year) {
  return Date.UTC(year, 0, 1) - BEIJING_OFFSET_MS
}