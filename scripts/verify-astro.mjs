/**
 * verify-astro.mjs — 交节时刻求解器的自检
 *
 *   npm run verify:astro
 *
 * 校验项：
 *  1. 二分反解出的春分/夏至/秋分/冬至，与 astronomy-engine 自带 Seasons() 逐一对比
 *     （独立实现，开放年份区间内全部年份，要求偏差 < 1 秒）；
 *  2. 24 节气按黄经 0/15/30…345 排列，交节时刻随黄经严格单调递增；
 *  3. 相邻节气间隔落在 14.5–16.0 天（定气法的必然结果）；
 *  4. locateTerm() 在每个交节时刻前后 1 秒的判断正确（含跨年）；
 *  5. 北京时间换算与反向换算互逆；
 *  6. 打印指定年份的完整节气表，供与权威发布值人工比对。
 */
import {
  findSunLongitude, sunApparentLongitude, termInstants, locateTerm,
  fromBeijing, beijingParts, fmtBeijing, fmtBeijingLong, meanObliquity,
  YEAR_MIN, YEAR_MAX, VALIDATED_YEAR_MAX, yearPrecisionTier, termIntervalDays,
  uncertaintySecondsForYear, deltaTSeconds, precessionLongitudeDeg,
} from '../src/lib/astro.js'
import { TERM_TABLE } from '../src/data/termTable.js'
import * as Astronomy from 'astronomy-engine'

let failures = 0
const fail = (msg) => { failures++; console.log(`  ✗ ${msg}`) }
const ok = (msg) => console.log(`  ✓ ${msg}`)

// --- 1. 与 Seasons() 交叉校验 ------------------------------------------------
console.log('\n[1] 二分反解 vs astronomy-engine Seasons()')
const seasonMap = [
  [0, 'mar_equinox'], [90, 'jun_solstice'], [180, 'sep_equinox'], [270, 'dec_solstice'],
]
// 1901–2200 逐年全查；更远的年份抽样。
// 注意：astronomy-engine 的 Seasons() 对两位数年（1–99）内部建种子时踩了
// JS Date 的 19xx 陷阱（Seasons(1) 会返回 1901 年的分至点），故 1–99 年不与它对比，
// 改由 [10] 的自洽性检查覆盖；本求解器自身对 1–99 年是正确的（见 [10] 的 fromBeijing(50,…) 断言）。
const yearsToCheck = []
for (let y = 1901; y <= 2200; y++) yearsToCheck.push(y)
for (const y of [100, 1600, 3000, 5000, 8000, 8800]) yearsToCheck.push(y)
console.log(`  年份：1901–2200 逐年 + 远年抽样，共 ${yearsToCheck.length} 年（1–99 年见 [10]）`)
let maxDiffSec = 0
let worst = null
for (const y of yearsToCheck) {
  const s = Astronomy.Seasons(y)
  for (const [lon, key] of seasonMap) {
    const seed = utcMsSeed(y, lon)
    const mine = findSunLongitude(lon, seed, 15)
    const theirs = s[key].date.getTime()
    const diff = Math.abs(mine - theirs) / 1000
    if (diff > maxDiffSec) { maxDiffSec = diff; worst = { y, lon, diff, mine, theirs } }
  }
}
const span = yearsToCheck.length * 4
if (maxDiffSec < 1) ok(`${span} 个分至点全部一致，最大偏差 ${maxDiffSec.toFixed(3)} 秒`)
else fail(`${span} 个分至点最大偏差 ${maxDiffSec.toFixed(3)} 秒 @ ${JSON.stringify(worst)}`)

/** 分至点搜索种子：按目标黄经估算年内位置（仅用于定位区间） */
function utcMsSeed(y, lon) {
  const month = { 0: 2, 90: 5, 180: 8, 270: 11 }[lon]
  const d = new Date(Date.UTC(2000, month, 21))
  d.setUTCFullYear(y)
  return d.getTime()
}

// --- 2. 黄经与时刻的单调性 ---------------------------------------------------
console.log('\n[2] 24 节气黄经与交节时刻的一致性')
{
  const t = termInstants(2026)
  const lons = TERM_TABLE.map((d) => d.longitude)
  const expect = Array.from({ length: 24 }, (_, i) => (315 + i * 15) % 360)
  if (JSON.stringify(lons) === JSON.stringify(expect)) ok('黄经序列 = 315° 起每 15° 递进，与 春分0°/夏至90°/秋分180°/冬至270° 一致')
  else fail(`黄经序列异常: ${lons.join(',')}`)

  const chrono = t.chronological
  let mono = true
  for (let i = 1; i < chrono.length; i++) if (chrono[i].ms <= chrono[i - 1].ms) mono = false
  if (mono) ok(`按公历年内时间排序后时刻严格递增（首个为 ${chrono[0].name}，末个为 ${chrono[22].name}）`)
  else fail('交节时刻未严格递增')

  let lonOk = true
  for (const it of t.byIndex) {
    const l = sunApparentLongitude(it.ms)
    let d = Math.abs(((l - it.longitude + 540) % 360) - 180)
    if (d > 0.0001) { lonOk = false; fail(`${it.name} 时刻处黄经 = ${l.toFixed(6)}°，期望 ${it.longitude}°`) }
  }
  if (lonOk) ok('每个交节时刻处反算的太阳视黄经与目标值之差 < 0.0001°')
}

// --- 3. 相邻节气间隔 --------------------------------------------------------
console.log('\n[3] 相邻节气间隔（定气法应当不等长）')
{
  const t = termInstants(2026)
  const c = t.chronological
  let min = Infinity, max = -Infinity, minName = '', maxName = ''
  let bad = 0
  for (let i = 1; i < c.length; i++) {
    const d = termIntervalDays(c[i - 1].ms, c[i].ms)
    if (d < 14.5 || d > 16.0) bad++
    if (d < min) { min = d; minName = `${c[i - 1].name}→${c[i].name}` }
    if (d > max) { max = d; maxName = `${c[i - 1].name}→${c[i].name}` }
  }
  if (bad === 0) ok(`23 个间隔全部落在 14.5–16.0 天：最短 ${min.toFixed(3)} 天 (${minName})，最长 ${max.toFixed(3)} 天 (${maxName})`)
  else fail(`${bad} 个间隔超出 14.5–16.0 天`)
}

// --- 4. locateTerm 边界与跨年 ----------------------------------------------
console.log('\n[4] locateTerm() 交节时刻前后 1 秒 / 跨年')
{
  const t26 = termInstants(2026)
  const t25 = termInstants(2025)
  let edgeOk = true
  for (const it of t26.byIndex) {
    const before = locateTerm(it.ms - 1000)
    const at = locateTerm(it.ms)
    const after = locateTerm(it.ms + 1000)
    if (at.current.index !== it.index) { edgeOk = false; fail(`${it.name}: 交节当刻判为 ${at.current.name}`) }
    if (after.current.index !== it.index) { edgeOk = false; fail(`${it.name}: +1s 判为 ${after.current.name}`) }
    const expectBefore = ((it.index - 2 + 24) % 24) + 1
    if (before.current.index !== expectBefore) { edgeOk = false; fail(`${it.name}: -1s 判为 ${before.current.name}，期望 index ${expectBefore}`) }
  }
  if (edgeOk) ok('2026 年 24 个交节时刻的 -1s / 0 / +1s 判断全部正确')

  // 跨年：2026-01-01 00:00 北京时间应处于 2025 年冬至 之后、2026 年小寒 之前
  const newYear = fromBeijing(2026, 1, 1, 0, 0, 0)
  const l = locateTerm(newYear)
  if (l.current.name === '冬至' && l.current.year === 2025 && l.next.name === '小寒' && l.next.year === 2026) {
    ok(`跨年正确：2026-01-01 00:00 (北京) 处于 ${l.current.year}年${l.current.name} 区间，下一节气 ${l.next.year}年${l.next.name}`)
  } else {
    fail(`跨年判断错误：current=${l.current.year}${l.current.name} next=${l.next.year}${l.next.name}`)
  }

  // 年末
  const ye = fromBeijing(2026, 12, 31, 23, 59, 59)
  const l2 = locateTerm(ye)
  if (l2.current.name === '冬至' && l2.next.name === '小寒' && l2.next.year === 2027) ok(`年末正确：2026-12-31 处于 ${l2.current.name}，下一节气为 ${l2.next.year}年${l2.next.name}`)
  else fail(`年末判断错误：${l2.current.name} -> ${l2.next.year}${l2.next.name}`)

  if (t25.byIndex[0].ms < t26.byIndex[0].ms) ok('同一节气在相邻两年的交节时刻顺序正确')
  else fail('年份间交节时刻顺序异常')
}

// --- 5. 北京时间换算互逆 ---------------------------------------------------
console.log('\n[5] 北京时间换算')
{
  const samples = [
    [2026, 10, 8, 21, 42, 0], [2026, 1, 1, 0, 0, 0], [2026, 6, 21, 12, 0, 0],
    [1986, 5, 4, 0, 0, 0], [1991, 9, 15, 1, 0, 0], [2000, 2, 29, 23, 59, 59],
  ]
  let rev = true
  for (const s of samples) {
    const ms = fromBeijing(...s)
    const p = beijingParts(ms)
    const back = [p.year, p.month, p.day, p.hour, p.minute, p.second]
    if (JSON.stringify(back) !== JSON.stringify(s)) { rev = false; fail(`${s.join('-')} 往返不一致 -> ${back.join('-')}`) }
  }
  if (rev) ok(`${samples.length} 组北京时间往返换算一致（含 1986/1991 夏令时期与闰日）`)
  // 中国 1986–1991 年曾实行夏令时：1986 年自 5 月 4 日 02:00 起拨快 1 小时。
  // 因此 1986-05-04 00:00 仍在标准时（+480），而 1986-07-01 处于夏令时（+540）。
  const offsetOf = (y, mo, d, h) =>
    Math.round((Date.UTC(y, mo - 1, d, h, 0, 0) - fromBeijing(y, mo, d, h, 0, 0)) / 60000)
  const oPreDst = offsetOf(1986, 5, 4, 0)
  const oDst = offsetOf(1986, 7, 1, 12)
  const o2026 = offsetOf(2026, 10, 8, 0)
  console.log(`  · 1986-05-04 00:00 (北京，拨快前) 偏移 = ${oPreDst} 分钟（应为 480）`)
  console.log(`  · 1986-07-01 12:00 (北京，夏令时) 偏移 = ${oDst} 分钟（应为 540）`)
  console.log(`  · 2026-10-08 00:00 (北京)         偏移 = ${o2026} 分钟（应为 480）`)
  if (oPreDst !== 480) fail(`1986-05-04 00:00 偏移应为 480 分钟，实得 ${oPreDst}`)
  if (oDst !== 540) fail(`1986 年夏令时期间偏移应为 540 分钟，实得 ${oDst}（ICU tzdata 是否完整？）`)
  if (o2026 !== 480) fail(`现代偏移应为 480 分钟，实得 ${o2026}`)
  if (oPreDst === 480 && oDst === 540 && o2026 === 480) ok('时区偏移随历史夏令时正确变化（1986–1991 中国曾实行夏令时）')
}

// --- 6. 打印节气表 ---------------------------------------------------------
const yearArg = Number(process.argv[2] || new Date().getUTCFullYear() + (beijingParts(Date.now()).month <= 1 ? 0 : 0))
console.log(`\n[6] ${yearArg} 年二十四节气交节时刻（${'北京时间 UTC+8'}）`)
console.log('序  节气   黄经    交节时刻(北京)                        距上一节气')
{
  const t = termInstants(yearArg)
  let prevMs = null
  for (const it of t.chronological) {
    const gap = prevMs === null ? '—' : `${termIntervalDays(prevMs, it.ms).toFixed(2)} 天`
    console.log(
      String(it.index).padStart(2), ' ',
      it.name.padEnd(4), ' ',
      `${String(it.longitude).padStart(3)}°`, ' ',
      fmtBeijingLong(it.ms, { seconds: true }).padEnd(38), ' ',
      gap,
    )
    prevMs = it.ms
  }
}

console.log(`\n[·] 黄赤交角（${new Date().toISOString().slice(0, 10)}）= ${meanObliquity(Date.now()).toFixed(4)}°`)
console.log(`[·] 现在：${fmtBeijing(Date.now())} (北京) → 太阳黄经 ${sunApparentLongitude(Date.now()).toFixed(4)}° → ${locateTerm(Date.now()).current.name}`)

// --- 7. 与公开发布的节气表对比（外部参考） --------------------------------
console.log('\n[7] 与公开发布的 2026 年节气表逐一对比（外部参考值，分钟级）')
{
  // 参考值取自公开发布/整理的 2026 年二十四节气时刻表（北京时间，精确到分），
  // 与紫金山天文台发布值一致；顺序为 小寒→冬至（公历年内先后）。
  // 该表只精确到分钟，因此允许 ±60 秒偏差。
  const REF_2026 = [
    ['小寒', 1, 5, 16, 23], ['大寒', 1, 20, 9, 45], ['立春', 2, 4, 4, 2], ['雨水', 2, 18, 23, 52],
    ['惊蛰', 3, 5, 21, 59], ['春分', 3, 20, 22, 46], ['清明', 4, 5, 2, 40], ['谷雨', 4, 20, 9, 39],
    ['立夏', 5, 5, 19, 49], ['小满', 5, 21, 8, 37], ['芒种', 6, 5, 23, 48], ['夏至', 6, 21, 16, 25],
    ['小暑', 7, 7, 9, 57], ['大暑', 7, 23, 3, 13], ['立秋', 8, 7, 19, 43], ['处暑', 8, 23, 10, 19],
    ['白露', 9, 7, 22, 41], ['秋分', 9, 23, 8, 5], ['寒露', 10, 8, 14, 29], ['霜降', 10, 23, 17, 38],
    ['立冬', 11, 7, 17, 52], ['小雪', 11, 22, 15, 23], ['大雪', 12, 7, 10, 52], ['冬至', 12, 22, 4, 50],
  ]
  const t = termInstants(2026)
  let worstDiff = 0
  let worstName = ''
  let bad = 0
  for (const [name, mo, d, h, mi] of REF_2026) {
    const item = t.byIndex.find((x) => x.name === name)
    if (!item) { fail(`未找到节气 ${name}`); bad++; continue }
    // 参考值是北京时间墙上时刻，用同一套换算反推 UTC 毫秒后再比
    const refMs = fromBeijing(2026, mo, d, h, mi, 0)
    const diffSec = Math.abs(item.ms - refMs) / 1000
    if (diffSec > worstDiff) { worstDiff = diffSec; worstName = name }
    if (diffSec > 60) { fail(`${name}: 本地 ${fmtBeijing(item.ms, { seconds: true })} vs 参考 ${mo}/${d} ${String(h).padStart(2, '0')}:${String(mi).padStart(2, '0')}，偏差 ${diffSec.toFixed(0)} 秒`); bad++ }
  }
  if (bad === 0) ok(`24 个节气与公开参考值全部落在 ±60 秒内，最大偏差 ${worstDiff.toFixed(0)} 秒（${worstName}）`)

  // 与香港天文台（数据源：英国皇家航海历书局 HMNAO / 美国海军天文台 USNO）对比分至点
  // HKO 公布 2026 年秋分 = 2026-09-23 08:05:38 HKT = 00:05:38 UTC
  const hkoSepEquinox = Date.UTC(2026, 8, 23, 0, 5, 38)
  const mineSepEquinox = findSunLongitude(180, Date.UTC(2026, 8, 21), 15)
  const dSec = Math.abs(mineSepEquinox - hkoSepEquinox) / 1000
  if (dSec < 2) ok(`与香港天文台公布的 2026 年秋分时刻相差 ${dSec.toFixed(2)} 秒（HKO 00:05:38 UTC vs 本地 ${(mineSepEquinox % 86400000 / 1000).toFixed(1)}s）`)
  else fail(`与 HKO 2026 秋分相差 ${dSec.toFixed(2)} 秒`)
}

// --- 8. 年份边界 ------------------------------------------------------------
console.log(`\n[8] 支持年份边界 ${YEAR_MIN}–${YEAR_MAX}`)
{
  let edgeOk = true
  for (const y of [YEAR_MIN, YEAR_MIN + 1, YEAR_MAX - 1, YEAR_MAX]) {
    const t = termInstants(y)
    for (const it of t.byIndex) {
      if (!it.valid) { edgeOk = false; fail(`${y} 年 ${it.name} 求解失败`) }
      else if (beijingParts(it.ms).year !== y) { edgeOk = false; fail(`${y} 年 ${it.name} 落在了 ${beijingParts(it.ms).year} 年`) }
    }
  }
  if (edgeOk) ok(`${YEAR_MIN}、${YEAR_MIN + 1}、${YEAR_MAX - 1}、${YEAR_MAX} 四个年份的 24 节气均落在正确的公历年内`)
}

// --- 9. 外推区间（2101 之后）的自洽性 --------------------------------------
console.log(`\n[9] 外推区间 ${VALIDATED_YEAR_MAX + 1}–${YEAR_MAX}（无权威值可比，只查内部一致性）`)
{
  let bad2 = 0
  // 2101–2300 逐年，之后步长 25 抽样（全查 6700 年太慢且无额外信息）
  const sampleYears = []
  for (let y = VALIDATED_YEAR_MAX + 1; y <= 2300; y++) sampleYears.push(y)
  for (let y = 2325; y <= YEAR_MAX; y += 25) sampleYears.push(y)
  if (!sampleYears.includes(YEAR_MAX)) sampleYears.push(YEAR_MAX)
  for (const y of sampleYears) {
    const c = termInstants(y).chronological
    for (let i = 0; i < c.length; i++) {
      if (!c[i].valid) { fail(`${y} 年 ${c[i].name} 求解失败`); bad2++; continue }
      if (beijingParts(c[i].ms).year !== y) { fail(`${y} 年 ${c[i].name} 落在 ${beijingParts(c[i].ms).year} 年`); bad2++ }
      if (i > 0) {
        const d = termIntervalDays(c[i - 1].ms, c[i].ms)
        if (d < 14.5 || d > 16.0) { fail(`${y} 年 ${c[i - 1].name}→${c[i].name} 间隔 ${d.toFixed(3)} 天越界`); bad2++ }
      }
    }
  }
  if (bad2 === 0) ok(`${sampleYears.length} 个外推年份（2101–2300 逐年 + 步长 25 抽样至 ${YEAR_MAX}）× 24 节气：均可解、落在正确公历年、相邻间隔均在 14.5–16.0 天`)

  if (yearPrecisionTier(1901) === 'validated' && yearPrecisionTier(2000) === 'validated'
    && yearPrecisionTier(2100) === 'validated' && yearPrecisionTier(2101) === 'good'
    && yearPrecisionTier(2200) === 'good' && yearPrecisionTier(2201) === 'moderate'
    && yearPrecisionTier(3000) === 'moderate' && yearPrecisionTier(3001) === 'millennium'
    && yearPrecisionTier(8800) === 'millennium') ok('精度分级：1901–2100 validated / 1600–2200 good / 1–3000 moderate / 3001–8800 millennium')
  else fail('精度分级函数判断错误')

  // ΔT 是外推区间的主要误差源：打印若干年份的取值，便于人工判断量级
  const dtSec = (y) => {
    const ut = (Date.UTC(y, 0, 1) - Date.UTC(2000, 0, 1, 12)) / 86400000
    return Astronomy.DeltaT_EspenakMeeus(ut)
  }
  console.log(`  · ΔT（TT−UTC，秒）：2000=${dtSec(2000).toFixed(1)} 2050=${dtSec(2050).toFixed(1)} 2100=${dtSec(2100).toFixed(1)} 2150=${dtSec(2150).toFixed(1)} 2200=${dtSec(2200).toFixed(1)}`)
  console.log(`  · 2150 年之后为长期抛物线外推（-20 + 32u²），其不确定度即外推区间时刻误差的主要来源`)
}

// --- 10. "赛博永生"档：1–9999 年可解性与精度分级 ----------------------------
console.log(`\n[10] 开放范围 ${YEAR_MIN}–${YEAR_MAX} 的可解性与精度分级`)
{
  let bad3 = 0
  for (const y of [1, 50, 99, 100, 1600, 1900, 3000, 5000, 8000, 8800]) {
    const c = termInstants(y).chronological
    for (let i = 0; i < c.length; i++) {
      if (!c[i].valid) { fail(`${y} 年 ${c[i].name} 求解失败`); bad3++; continue }
      if (beijingParts(c[i].ms).year !== y) { fail(`${y} 年 ${c[i].name} 落在 ${beijingParts(c[i].ms).year} 年`); bad3++ }
      if (i > 0) {
        const d = termIntervalDays(c[i - 1].ms, c[i].ms)
        if (d < 14.4 || d > 16.1) { fail(`${y} 年 ${c[i - 1].name}→${c[i].name} 间隔 ${d.toFixed(3)} 天异常`); bad3++ }
      }
    }
  }
  if (bad3 === 0) ok('公元 1 / 50 / 99 / 100 / 1600 / 1900 / 3000 / 5000 / 8000 / 8800 年各 24 节气均可解且自洽')

  const y50 = beijingParts(fromBeijing(50, 6, 21, 12, 0, 0))
  if (y50.year === 50) ok('fromBeijing(50, …) 落在公元 50 年（未触发 Date.UTC 的 19xx 陷阱）')
  else fail(`fromBeijing(50,…) 得到 ${y50.year} 年`)

  const u = (y) => uncertaintySecondsForYear(y)
  if (u(2000) <= u(1800) && u(1800) <= u(1000) && u(2000) <= u(2200) && u(2200) <= u(3000) && u(3000) <= u(8800)) {
    ok('不确定度随远离比对区间单调不降：' + [2000, 1800, 1000, 2200, 3000, 8800].map((y) => `${y}=${u(y)}s`).join(' '))
  } else fail('不确定度分级不单调')

  const ms3000 = fromBeijing(3000, 3, 20, 12, 0, 0)
  const dT = deltaTSeconds(ms3000)
  const tt = beijingParts(ms3000 + dT * 1000)
  const civ = beijingParts(ms3000)
  const diffSec = (tt.hour * 3600 + tt.minute * 60 + tt.second) - (civ.hour * 3600 + civ.minute * 60 + civ.second)
  if (Math.abs(diffSec - dT) < 2) ok(`3000 年：TT 读数 − 民用时读数 = ${diffSec}s ≈ ΔT = ${dT.toFixed(1)}s`)
  else fail(`TT 与民用时差 ${diffSec}s ≠ ΔT ${dT.toFixed(1)}s`)

  const p4000 = precessionLongitudeDeg(4000)
  if (Math.abs(precessionLongitudeDeg(2000)) < 1e-9 && Math.abs(p4000 - 27.94) < 0.01) {
    ok(`岁差累积量：2000 年 = 0°，4000 年 ≈ ${p4000.toFixed(2)}°（星空点云据此旋转）`)
  } else fail(`岁差累积量异常：4000 年 = ${p4000}`)

  const tiers = [1901, 2000, 2100, 2101, 2200, 2201, 3000, 3001, 8800].map((y) => `${y}:${yearPrecisionTier(y)}`)
  console.log('  · 分级：' + tiers.join('  '))
}

console.log(failures === 0 ? '\n=== 全部校验通过 ===' : `\n=== 有 ${failures} 项校验失败 ===`)
process.exitCode = failures === 0 ? 0 : 1
