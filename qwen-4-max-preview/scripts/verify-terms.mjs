// 用公开历书交节时间（北京时间）验证计算精度：node scripts/verify-terms.mjs
import { termInstant, formatBeijing, solarApparentLongitude, termsForYear, termContextAt } from '../src/astro/solar.js'

// 参考：中国科学院紫金山天文台历算 / 公开天文年历（北京时间，精确到分）
const expected = [
  [2024, 0, '2024-02-04 16:27'], // 立春
  [2024, 3, '2024-03-20 11:06'], // 春分
  [2024, 9, '2024-06-21 04:51'], // 夏至
  [2024, 15, '2024-09-22 20:43'], // 秋分
  [2024, 21, '2024-12-21 17:20'], // 冬至
  [2025, 0, '2025-02-03 22:10'],
  [2025, 3, '2025-03-20 17:01'],
  [2025, 9, '2025-06-21 10:42'],
  [2025, 15, '2025-09-23 02:19'],
  [2025, 21, '2025-12-21 23:03'],
  [2026, 0, '2026-02-04 04:02'],
  [2026, 3, '2026-03-20 22:46'],
  [2026, 9, '2026-06-21 16:24'],
  [2026, 21, '2026-12-22 04:50']
]

let maxDiff = 0
for (const [year, idx, ref] of expected) {
  const t = termInstant(year, idx)
  const refMs = Date.parse(ref.replace(' ', 'T') + ':00+08:00')
  const diffSec = (t.ms - refMs) / 1000
  maxDiff = Math.max(maxDiff, Math.abs(diffSec))
  const flag = Math.abs(diffSec) <= 90 ? 'PASS' : 'WARN'
  console.log(`${flag} ${year} term#${idx} calc=${formatBeijing(t.ms, 'en')} ref=${ref} diff=${diffSec.toFixed(0)}s`)
}
console.log(`\n最大偏差: ${maxDiff.toFixed(0)} 秒`)

// 边界检查：交节前后 1 秒的节气判断
const inst = termInstant(2025, 3) // 春分
const before = termContextAt(inst.ms - 1000)
const after = termContextAt(inst.ms + 1000)
console.log('春分前1s 当前节气 index =', before.current.index, '(应为 2 惊蛰)')
console.log('春分后1s 当前节气 index =', after.current.index, '(应为 3 春分)')

// 跨年：2025-01-01 应处于 2024 冬至区间
const ny = termContextAt(Date.parse('2025-01-01T00:00:00+08:00'))
console.log('2025元旦 当前节气 index =', ny.current.index, '(应为 21 冬至), 年份', ny.current.year)

// 节气间隔（验证非均匀 15 天）
const y2025 = termsForYear(2025)
const gaps = y2025.slice(1).map((t, i) => (t.ms - y2025[i].ms) / 86400000)
console.log('2025 相邻节气间隔(天): min =', Math.min(...gaps).toFixed(2), 'max =', Math.max(...gaps).toFixed(2))

// 分至点黄经校验
for (const [idx, lon] of [[3, 0], [9, 90], [15, 180], [21, 270]]) {
  const t = termInstant(2025, idx)
  console.log(`2025 term#${idx} 交节时视黄经 = ${solarApparentLongitude(t.ms).toFixed(6)}° (目标 ${lon}°)`)
}