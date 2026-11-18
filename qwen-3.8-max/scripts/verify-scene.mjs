/**
 * verify-scene.mjs — 3D 场景几何与受光关系的自检
 *
 *   node scripts/verify-scene.mjs
 *
 * 只依赖纯数学模块 src/three/orbitMath.js（不含 WebGL/DOM），可在 Node 中运行。
 * 校验项：
 *  1. 黄经 → 场景坐标的映射：四个分至点地球的落点与方位角；
 *  2. 地轴：北天极方向、倾角数值、以及"地轴在空间中指向恒定，不随公转改变"；
 *  3. 受光关系：太阳直射点纬度在夏至 +ε / 冬至 −ε / 两分 0；
 *     北天极在夏至朝向太阳、冬至背离太阳、两分与日地方向垂直；
 *  4. 极昼极夜：夏至 80°N 全天见日、80°S 全天无日；冬至相反；两分各地约 12 小时；
 *  5. 太阳直射点经度与独立参考算法（赤经 − 恒星时）逐时刻一致；
 *  6. 自转与公转方向一致（从北天极俯视均为逆时针）；
 *  7. 经纬度 → 球面局部坐标的约定与 three.js SphereGeometry 的 UV 对应。
 */
import * as THREE from 'three'
import * as Astronomy from 'astronomy-engine'
import {
  SCALE, eclipticToScene, earthPositionFromSunLongitude, termMarkerPosition,
  sunDirectionFromEarth, northPoleDirection, axisQuaternion, earthSpinAngle,
  earthOrientation, isSunAboveHorizon, subSolarLatitude, subSolarLongitude,
  subSolarLongitudeReference, subSolarLatitudeReference, orbitTangent,
  sceneAzimuthFromSunLongitude, geoToSphereLocal, arcPoints, norm360, norm180, DEG,
} from '../src/three/orbitMath.js'
import { meanObliquity } from '../src/lib/astro.js'

let failures = 0
const fail = (m) => { failures++; console.log(`  ✗ ${m}`) }
const ok = (m) => console.log(`  ✓ ${m}`)
const near = (a, b, tol = 1e-6) => Math.abs(a - b) <= tol

const EPS = meanObliquity(Date.UTC(2026, 5, 21))
console.log(`\n黄赤交角 ε（2026-06-21）= ${EPS.toFixed(4)}°`)

// --- 1. 黄经 → 场景坐标 ----------------------------------------------------
console.log('\n[1] 太阳黄经 → 地球场景坐标')
{
  const R = SCALE.orbitRadius
  // 期望值推导：L⊕ = λ☉+180°，场景位置 = (R·cos L⊕, 0, −R·sin L⊕)
  //   λ☉=0   → L⊕=180° → (−R, 0, 0)
  //   λ☉=90  → L⊕=270° → ( 0, 0, +R)   ← 夏至：此时"地球→太阳"= (0,0,−1)，
  //                                        北天极 (0, sin ε', −cos ε') 与之点积为正，
  //                                        即北极朝向太阳，北半球为夏 ✓
  //   λ☉=180 → L⊕=0    → (+R, 0, 0)
  //   λ☉=270 → L⊕=90   → ( 0, 0, −R)   ← 冬至：北极背离太阳 ✓
  const cases = [
    ['春分', 0, { x: -R, y: 0, z: 0 }, 180],
    ['夏至', 90, { x: 0, y: 0, z: R }, 270],
    ['秋分', 180, { x: R, y: 0, z: 0 }, 0],
    ['冬至', 270, { x: 0, y: 0, z: -R }, 90],
  ]
  let good = true
  for (const [name, lon, exp, az] of cases) {
    const p = earthPositionFromSunLongitude(lon, R)
    if (!near(p.x, exp.x, 1e-9) || !near(p.y, exp.y, 1e-9) || !near(p.z, exp.z, 1e-9)) {
      good = false
      fail(`${name}(λ☉=${lon}°) 地球位置 = (${p.x.toFixed(3)},${p.y.toFixed(3)},${p.z.toFixed(3)})，期望 (${exp.x},${exp.y},${exp.z})`)
    }
    const a = sceneAzimuthFromSunLongitude(lon)
    if (!near(a, az, 1e-9)) { good = false; fail(`${name} 场景方位角 = ${a}，期望 ${az}`) }
  }
  if (good) ok('四个分至点的地球落点与场景方位角正确（λ☉ → L⊕ = λ☉+180°，+X 为春分点，俯视逆时针）')

  // 节气标记必须与地球在同一位置
  let mGood = true
  for (let i = 0; i < 24; i++) {
    const lon = (315 + i * 15) % 360
    const a = earthPositionFromSunLongitude(lon, R)
    const b = termMarkerPosition(lon, R)
    if (a.distanceTo(b) > 1e-12) mGood = false
  }
  if (mGood) ok('24 个节气标记的位置与该节气交节时地球的位置逐点重合')

  // 地球轨道接近圆形
  let radii = []
  for (let i = 0; i < 72; i++) radii.push(earthPositionFromSunLongitude(i * 5, R).length())
  const rMin = Math.min(...radii), rMax = Math.max(...radii)
  if (near(rMin, R, 1e-9) && near(rMax, R, 1e-9)) ok(`轨道半径恒为 ${R}（场景按近似圆绘制；真实偏心率 0.0167，已在页面注明）`)
  else fail(`轨道不是圆：${rMin}..${rMax}`)
}

// --- 2. 地轴 --------------------------------------------------------------
console.log('\n[2] 地轴方向与倾角')
{
  const pole = northPoleDirection(EPS)
  if (near(pole.length(), 1, 1e-12)) ok('北天极方向为单位向量')
  else fail('北天极方向未归一化')

  // 黄纬应为 90-ε
  const lat = Math.asin(pole.y) / DEG
  if (near(lat, 90 - EPS, 1e-9)) ok(`北天极黄纬 = ${lat.toFixed(4)}° = 90° − ε`)
  else fail(`北天极黄纬 = ${lat.toFixed(4)}°，期望 ${(90 - EPS).toFixed(4)}°`)

  // 局部 +Y 经四元数变换后应指向北天极
  const up = new THREE.Vector3(0, 1, 0).applyQuaternion(axisQuaternion(EPS))
  if (up.distanceTo(pole) < 1e-12) ok('axisQuaternion 把模型局部 +Y 精确对齐到北天极')
  else fail(`axisQuaternion 对齐偏差 ${up.distanceTo(pole)}`)

  // 与轨道法线（+Y）的夹角应为 ε
  const ang = THREE.MathUtils.radToDeg(new THREE.Vector3(0, 1, 0).angleTo(pole))
  if (near(ang, EPS, 1e-9)) ok(`地轴与公转轨道法线夹角 = ${ang.toFixed(4)}° ≈ 23.4°`)
  else fail(`地轴倾角 = ${ang.toFixed(4)}°，期望 ${EPS.toFixed(4)}°`)

  // 一年内指向恒定：四个分至点的 axisQuaternion 应相同（ε 变化 < 1e-4°）
  const qs = [0, 90, 180, 270].map((lon) => axisQuaternion(meanObliquity(Date.UTC(2026, lon / 30 | 0, 15))))
  let spread = 0
  for (const q of qs) spread = Math.max(spread, Math.abs(q.angleTo(qs[0])) / DEG)
  if (spread < 0.001) ok(`地轴指向在一年内变化 < ${spread.toExponential(2)}°（岁差/章动在一年内可忽略，符合"指向基本保持不变"）`)
  else fail(`地轴指向一年内变化 ${spread}°，过大`)
}

// --- 3. 受光关系 ----------------------------------------------------------
console.log('\n[3] 四个分至点的受光关系')
{
  const checks = [
    ['春分', 0, 0, 0],
    ['夏至', 90, EPS, +1],
    ['秋分', 180, 0, 0],
    ['冬至', 270, -EPS, -1],
  ]
  let good = true
  for (const [name, lon, expLat, sign] of checks) {
    const lat = subSolarLatitude(lon, EPS)
    if (!near(lat, expLat, 1e-6)) { good = false; fail(`${name}: 太阳直射点纬度 = ${lat.toFixed(4)}°，期望 ${expLat.toFixed(4)}°`) }
    const toSun = eclipticToScene(lon, 1)
    const d = northPoleDirection(EPS).dot(toSun)
    if (sign === 0 && Math.abs(d) > 1e-9) { good = false; fail(`${name}: 北天极与日地方向点积 = ${d}，期望 0（垂直）`) }
    if (sign > 0 && d <= 0.39) { good = false; fail(`${name}: 北天极未明显朝向太阳（点积 ${d.toFixed(4)}）`) }
    if (sign < 0 && d >= -0.39) { good = false; fail(`${name}: 北天极未明显背离太阳（点积 ${d.toFixed(4)}）`) }
  }
  if (good) ok(`夏至直射 ${EPS.toFixed(2)}°N、冬至直射 ${EPS.toFixed(2)}°S、两分直射赤道；北极夏至向日、冬至背日、两分垂直`)

  // 独立参考算法交叉验证
  let maxD = 0
  const times = []
  for (let i = 0; i < 200; i++) times.push(Date.UTC(2026, 0, 1) + i * 43 * 3600000)
  for (const t of times) {
    const lon = Astronomy.SunPosition(new Date(t)).elon
    maxD = Math.max(maxD, Math.abs(subSolarLatitude(lon, EPS) - subSolarLatitudeReference(t)))
  }
  if (maxD < 0.02) ok(`直射点纬度与独立公式 sin δ = sin ε·sin λ☉ 的最大偏差 = ${maxD.toFixed(4)}°`)
  else fail(`直射点纬度与参考算法偏差 ${maxD.toFixed(4)}°`)
}

// --- 4. 极昼极夜 ----------------------------------------------------------
console.log('\n[4] 极昼极夜与昼夜长短（用与渲染相同的朝向计算）')
{
  const dayFrac = (ms, lat, lon, stepMin = 10) => {
    let lit = 0, n = 0
    for (let m = 0; m < 1440; m += stepMin) {
      if (isSunAboveHorizon(ms + m * 60000, lat, lon, EPS) > 0) lit++
      n++
    }
    return lit / n
  }
  // 2026-06-21 16:25 北京时间 = 夏至交节
  const summer = Date.UTC(2026, 5, 21, 8, 25, 0)
  const winter = Date.UTC(2026, 11, 22, 0, 0, 0) - 8 * 3600000 + 4.83 * 3600000
  const spring = Date.UTC(2026, 2, 20, 14, 45, 36)

  const f80N_summer = dayFrac(summer, 80, 0)
  const f80S_summer = dayFrac(summer, -80, 0)
  if (f80N_summer === 1 && f80S_summer === 0) ok(`夏至：80°N 极昼（日照 ${f80N_summer * 24}h）、80°S 极夜（日照 ${f80S_summer * 24}h）`)
  else fail(`夏至极昼极夜异常：80°N=${f80N_summer} 80°S=${f80S_summer}`)

  const f80N_winter = dayFrac(winter, 80, 0)
  const f80S_winter = dayFrac(winter, -80, 0)
  if (f80N_winter === 0 && f80S_winter === 1) ok(`冬至：80°N 极夜、80°S 极昼（南北半球季节相反）`)
  else fail(`冬至极昼极夜异常：80°N=${f80N_winter} 80°S=${f80S_winter}`)

  const fEquator = dayFrac(spring, 0, 0)
  const f40N = dayFrac(spring, 40, 0)
  if (Math.abs(fEquator - 0.5) < 0.02 && Math.abs(f40N - 0.5) < 0.02)
    ok(`春分：赤道日照 ${(fEquator * 24).toFixed(2)}h、40°N 日照 ${(f40N * 24).toFixed(2)}h（全球昼夜等长）`)
  else fail(`春分昼夜不等长：赤道 ${fEquator} 40°N ${f40N}`)

  // 北纬中纬度夏至白昼长于冬至
  const f40N_s = dayFrac(summer, 40, 0)
  const f40N_w = dayFrac(winter, 40, 0)
  if (f40N_s > 0.6 && f40N_w < 0.4) ok(`40°N：夏至日照 ${(f40N_s * 24).toFixed(1)}h，冬至日照 ${(f40N_w * 24).toFixed(1)}h`)
  else fail(`40°N 昼夜长短异常：夏至 ${f40N_s} 冬至 ${f40N_w}`)
}

// --- 5. 直射点经度 --------------------------------------------------------
console.log('\n[5] 太阳直射点经度（含自转）与独立参考算法')
{
  let maxD = 0, worst = null
  for (let i = 0; i < 120; i++) {
    const t = Date.UTC(2026, 0, 1) + i * 71 * 3600000
    const a = subSolarLongitude(t, EPS)
    const b = subSolarLongitudeReference(t)
    const d = Math.abs(norm180(a - b))
    if (d > maxD) { maxD = d; worst = t }
  }
  if (maxD < 0.05) ok(`120 个时刻的最大偏差 = ${maxD.toFixed(4)}°（直射点经度 = 太阳赤经 − 格林尼治视恒星时）`)
  else fail(`直射点经度偏差 ${maxD.toFixed(4)}° @ ${new Date(worst).toISOString()}`)

  // 12:00 UTC 时直射点经度应接近 0°（受均时差影响最多 ±4.2°）
  let maxNoon = 0
  for (let d = 1; d <= 365; d += 7) {
    const t = Date.UTC(2026, 0, d, 12, 0, 0)
    maxNoon = Math.max(maxNoon, Math.abs(subSolarLongitude(t, EPS)))
  }
  if (maxNoon < 4.5) ok(`全年 12:00 UTC 直射点经度偏离 0° 不超过 ${maxNoon.toFixed(2)}°（即均时差范围，符合预期）`)
  else fail(`12:00 UTC 直射点经度偏离过大：${maxNoon.toFixed(2)}°`)
}

// --- 6. 方向一致性 --------------------------------------------------------
console.log('\n[6] 公转与自转方向')
{
  // 公转：黄经增大时，从 +Y 俯视应为逆时针（叉积 (p × p')·Y > 0）
  let ccw = true
  for (let lon = 0; lon < 360; lon += 15) {
    const p = earthPositionFromSunLongitude(lon, 1)
    const t = orbitTangent(lon)
    if (p.clone().cross(t).y <= 0) ccw = false
  }
  if (ccw) ok('公转方向：太阳黄经增大时地球沿逆时针前进（从北天极俯视），与真实一致')
  else fail('公转方向错误')

  // 自转：恒星时增大 → rotation.y 增大 → 逆时针
  const t1 = Date.UTC(2026, 5, 21, 0, 0, 0)
  const t2 = t1 + 3 * 3600000
  const a1 = earthSpinAngle(t1), a2 = earthSpinAngle(t2)
  let delta = norm360(a2 / DEG - a1 / DEG)
  if (delta > 0 && delta < 180) ok(`自转方向与公转同向（3 小时内自转角增加 ${delta.toFixed(2)}°，约 15°/h）`)
  else fail(`自转角变化异常：${delta.toFixed(3)}°`)

  // 恒星日 vs 太阳日：地球相对春分点自转一周 ≈ 23h56m04s = 23.9345 h
  let spin = 0
  let prev = a1 / DEG          // ← 必须与 cur 同为"度"
  let ms = t1
  for (let i = 0; i < 200000; i++) {
    ms += 1000
    const cur = earthSpinAngle(ms) / DEG
    let d = cur - prev
    if (d < -180) d += 360     // 跨过 0°/360°
    if (d > 180) d -= 360
    spin += d
    prev = cur
    if (spin >= 360) break
  }
  const hours = (ms - t1) / 3600000
  if (Math.abs(hours - 23.93447) < 0.02) ok(`自转一周（相对春分点）耗时 ${hours.toFixed(4)} h ≈ 恒星日 23.9345 h`)
  else fail(`自转周期 = ${hours.toFixed(4)} h，期望 ≈ 23.9345 h`)
}

// --- 7. 球面 UV 约定 -----------------------------------------------------
console.log('\n[7] 经纬度 ↔ three.js SphereGeometry UV 约定')
{
  const g = geoToSphereLocal(0, 0)
  if (g.distanceTo(new THREE.Vector3(1, 0, 0)) < 1e-9) ok('0°N 0°E（格林尼治）→ 局部 +X，对应球面 u=0.5')
  else fail(`格林尼治映射异常：${g.toArray().join(',')}`)
  const np = geoToSphereLocal(90, 0)
  if (np.distanceTo(new THREE.Vector3(0, 1, 0)) < 1e-9) ok('90°N → 局部 +Y（球面顶点）')
  else fail(`北极映射异常：${np.toArray().join(',')}`)
  const e90 = geoToSphereLocal(0, 90)
  // 东经 90° 应在 +X 逆时针 90° 处，即局部 −Z ... 用 u 反算验证
  const phi = Math.atan2(e90.z, -e90.x)
  const u = phi / (2 * Math.PI)
  const lonBack = (u - 0.5) * 360
  if (near(norm180(lonBack), 90, 1e-9)) ok(`东经 90° 往返一致（u=${u.toFixed(4)} → lon=${norm180(lonBack).toFixed(4)}°），东经方向与 UV 约定吻合`)
  else fail(`东经 90° 往返不一致：${lonBack}`)

  const pts = arcPoints(0, 90, 1, 8)
  if (pts.length === 9 && near(pts[0].x, -1, 1e-9)) ok('arcPoints 沿公转方向生成弧段')
  else fail('arcPoints 方向或数量异常')
}

console.log(failures === 0 ? '\n=== 场景几何与受光关系全部校验通过 ===' : `\n=== 有 ${failures} 项校验失败 ===`)
process.exitCode = failures === 0 ? 0 : 1
