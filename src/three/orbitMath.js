/**
 * orbitMath.js — 天文量 ↔ 3D 场景坐标的唯一换算层
 *
 * 这里是整个项目最容易出错、也最需要写清楚的一层：**太阳黄经（天文量）**
 * 与 **场景坐标角（渲染量）** 是两套角度，必须显式建立对应关系，
 * 否则会出现"地球在夏至位置却显示冬至"这类错位。
 *
 * ── 坐标系约定 ──────────────────────────────────────────────
 *  three.js 右手系，Y 轴向上。我们把**黄道面**放在 XZ 平面上：
 *
 *    · +Y  = 黄道北极（从北天极俯视，地球公转与自转都是逆时针）
 *    · +X  = 春分点 ♈ 方向（太阳黄经 0° 的方向）
 *    · +Z  = 黄经 270° 方向
 *
 *  于是"黄经 λ、黄纬 β、半径 r"的一点在场景中的坐标是：
 *      x =  r·cosβ·cosλ
 *      y =  r·sinβ
 *      z = −r·cosβ·sinλ
 *  取 z 的负号，是为了让 λ 增大时点沿 **从 +Y 俯视的逆时针** 方向前进，
 *  与真实天球一致（若写成 +r·sinλ，俯视会变成顺时针）。
 *
 * ── 黄经 → 地球位置 ────────────────────────────────────────
 *  λ☉ 是**太阳的地心视黄经**（从地球看太阳）。地球在日心系里的黄经是
 *      L⊕ = λ☉ + 180°
 *  所以地球的场景位置 = eclipticToScene(λ☉ + 180°, R)。
 *  反过来，"从地球指向太阳"的单位向量恰好就是 eclipticToScene(λ☉, 1)。
 *
 * ── 节气标记的位置 ─────────────────────────────────────────
 *  轨道上第 i 个节气标记，画在"太阳黄经 = 该节气值时地球所在的位置"，
 *  即 eclipticToScene(λ_term + 180°, R)。这样标记与地球一一对应，
 *  地球走到标记处，就是那个节气交节的时刻。
 *
 * ── 地轴 ───────────────────────────────────────────────────
 *  北天极位于黄经 90°、黄纬 (90° − ε)。地轴方向由 eclipticToScene(90°, 1, 90°−ε)
 *  给出，**在整个模拟过程中保持不变**（真实情况：一年内岁差/章动的影响可忽略）。
 *  实现上把倾角放在一个"只平移、不随公转转动"的父节点里，
 *  因此地轴不会跟着地球一起绕太阳转，也就不会始终朝向太阳。
 *
 * 该模块是纯数学，不含任何 WebGL / DOM 依赖，可在 Node 中直接测试
 * （见 scripts/verify-scene.mjs）。
 */

import * as THREE from 'three'
import * as Astronomy from 'astronomy-engine'

export const DEG = Math.PI / 180
export const RAD = 180 / Math.PI

/** 场景尺度。真实比例下太阳半径是地球的 109 倍、日地距离是地球半径的 23481 倍，
 *  按真实比例地球在画面里不足一个像素，因此这里做了大幅压缩。
 *  页面上明确标注"尺寸与距离不按实际比例"。 */
export const SCALE = {
  sunRadius: 7.0,
  earthRadius: 2.2,
  cloudRadius: 2.2 * 1.012,
  atmosphereRadius: 2.2 * 1.16,
  orbitRadius: 62,
  starfieldRadius: 2600,
}

/** 真实比例数据，用于页面上的对照说明 */
export const REAL_SCALE = {
  auKm: 1.495978707e8,
  sunEarthRadiusRatio: 109.2,
  orbitEarthRadiusRatio: 23481,
  eccentricity: 0.0167,
}

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v)
export const norm360 = (x) => ((x % 360) + 360) % 360
/** 归一化到 (−180, 180] */
export const norm180 = (x) => {
  const r = norm360(x)
  return r > 180 ? r - 360 : r
}

/**
 * 黄道坐标 → 场景坐标（见文件头的约定）。
 * @param {number} lonDeg 黄经（度）
 * @param {number} radius 半径（场景单位）
 * @param {number} latDeg 黄纬（度），默认 0
 */
export function eclipticToScene(lonDeg, radius, latDeg = 0) {
  const l = lonDeg * DEG
  const b = latDeg * DEG
  const r = radius * Math.cos(b)
  return new THREE.Vector3(r * Math.cos(l), radius * Math.sin(b), -r * Math.sin(l))
}

/**
 * 太阳黄经 λ☉ → 地球在场景中的位置。
 * @param {number} sunLonDeg 太阳地心视黄经
 * @param {number} radius    轨道半径
 */
export function earthPositionFromSunLongitude(sunLonDeg, radius = SCALE.orbitRadius) {
  return eclipticToScene(sunLonDeg + 180, radius)
}

/** 节气标记的位置：太阳黄经为 λ 时地球所在之处 */
export function termMarkerPosition(termLongitudeDeg, radius = SCALE.orbitRadius) {
  return earthPositionFromSunLongitude(termLongitudeDeg, radius)
}

/**
 * 从地球指向太阳的单位向量（场景坐标）。
 * 点光源放在原点，因此这就是地球着色器需要的 sunDir。
 */
export function sunDirectionFromEarth(sunLonDeg) {
  return eclipticToScene(sunLonDeg, 1).normalize()
}

/** 北天极方向（场景坐标，单位向量） */
export function northPoleDirection(epsDeg) {
  return eclipticToScene(90, 1, 90 - epsDeg).normalize()
}

/**
 * 让"模型局部 +Y"对齐到北天极的四元数。
 * 这是一个**常量**（一年内不变），不随地球公转位置改变。
 */
export function axisQuaternion(epsDeg) {
  return new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), northPoleDirection(epsDeg))
}

/**
 * 地球自转角（弧度），由格林尼治视恒星时给出。
 * GAST 是春分点相对格林尼治子午圈的时角，因此 rotation.y = GAST×15°
 * 时，格林尼治正好落在春分点以东 GAST 小时处 —— 与 three.js SphereGeometry
 * 的 UV 约定（u=0.5 为 0° 经线、局部 +X 方向）一致。
 * @param {Date|number} when
 */
export function earthSpinAngle(when) {
  const date = typeof when === 'number' ? new Date(when) : when
  return norm360(Astronomy.SiderealTime(date) * 15) * DEG
}

/**
 * 地球在场景中的完整朝向：先按地轴倾角定向，再绕自身轴自转。
 * 3D 场景与所有光照/昼夜判断都使用这一个四元数，避免两套算法不同步。
 * @param {Date|number} when
 * @param {number} epsDeg 黄赤交角
 */
export function earthOrientation(when, epsDeg) {
  const ms = typeof when === 'number' ? when : when.getTime()
  return axisQuaternion(epsDeg).multiply(
    new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), earthSpinAngle(ms)),
  )
}

/**
 * 某地理坐标此刻是否处于白昼（太阳在地平线以上）。
 * 用与渲染完全相同的朝向四元数计算，因此"受光关系"与画面必然一致。
 */
export function isSunAboveHorizon(when, latDeg, lonDeg, epsDeg) {
  const ms = typeof when === 'number' ? when : when.getTime()
  const q = earthOrientation(ms, epsDeg)
  const up = geoToSphereLocal(latDeg, lonDeg).applyQuaternion(q)
  const toSun = sunDirectionFromEarth(Astronomy.SunPosition(new Date(ms)).elon)
  return up.dot(toSun)
}

/**
 * 太阳直射点（sub-solar point）的地理纬度 —— 也就是太阳赤纬。
 * 这是检验"受光关系是否正确"的最直接物理量：
 * 夏至 ≈ +23.44°、冬至 ≈ −23.44°、两分 ≈ 0°。
 */
export function subSolarLatitude(sunLonDeg, epsDeg) {
  const toSun = eclipticToScene(sunLonDeg, 1)
  const pole = northPoleDirection(epsDeg)
  return 90 - THREE.MathUtils.radToDeg(pole.angleTo(toSun))
}

/**
 * 太阳直射点的地理经度（度，[−180,180)），含地球自转。
 * 用于验证"昼夜分界线是否落在正确的经度上"。
 */
export function subSolarLongitude(ms, epsDeg) {
  const sunLon = Astronomy.SunPosition(new Date(ms)).elon
  const toSun = eclipticToScene(sunLon, 1)
  const q = earthOrientation(ms, epsDeg)
  const local = toSun.clone().applyQuaternion(q.clone().invert())
  const phi = Math.atan2(local.z, -local.x)          // SphereGeometry 的 u = phi/2π
  const lon = (phi / (2 * Math.PI) - 0.5) * 360      // u=0.5 → 0° 经线
  return norm180(lon)
}

/**
 * 用与 3D 场景无关的独立方法（球面天文学公式）算出太阳直射点经度，
 * 供 verify-scene.mjs 交叉验证：直射点经度 = 太阳赤经 − 格林尼治视恒星时。
 */
export function subSolarLongitudeReference(ms) {
  const date = new Date(ms)
  const ecl = Astronomy.SunPosition(date)
  const eps = Astronomy.SiderealTime(date) * 15 // GAST（度）
  // 黄道坐标 → 赤道坐标（绕 X 轴转 −ε）
  const x = ecl.vec.x
  const y = ecl.vec.y * Math.cos(eps * DEG * 0 + meanObliquityRad(ms)) - ecl.vec.z * Math.sin(meanObliquityRad(ms))
  const z = ecl.vec.y * Math.sin(meanObliquityRad(ms)) + ecl.vec.z * Math.cos(meanObliquityRad(ms))
  const raDeg = norm360(Math.atan2(y, x) * RAD)
  return norm180(raDeg - eps)
}

function meanObliquityRad(ms) {
  const T = (ms - Date.UTC(2000, 0, 1, 12, 0, 0)) / (36525 * 86400000)
  const arcsec = 84381.406 - 46.836769 * T - 0.0001831 * T * T + 0.0020034 * T * T * T
  return (arcsec / 3600) * DEG
}

/** 太阳直射点纬度（独立参考算法：sin δ = sin ε · sin λ☉） */
export function subSolarLatitudeReference(ms) {
  const date = new Date(ms)
  const lon = Astronomy.SunPosition(date).elon * DEG
  return Math.asin(clamp(Math.sin(meanObliquityRad(ms)) * Math.sin(lon), -1, 1)) * RAD
}

/**
 * 轨道上"公转方向"箭头所在的场景位置与切线方向。
 * @param {number} sunLonDeg 当前太阳黄经
 */
export function orbitTangent(sunLonDeg) {
  // 位置角 L⊕ = λ☉+180；逆时针前进的切线 = d/dL (cos L, 0, −sin L) = (−sin L, 0, −cos L)
  const l = (sunLonDeg + 180) * DEG
  return new THREE.Vector3(-Math.sin(l), 0, -Math.cos(l)).normalize()
}

/**
 * 把黄经换算成"轨道上的显示角度"（用于 UI 上明确区分两套角度）。
 * 返回地球在场景 XZ 平面内、从 +X 轴起向 −Z 度量的方位角（度）。
 */
export function sceneAzimuthFromSunLongitude(sunLonDeg) {
  return norm360(sunLonDeg + 180)
}

/**
 * 地球上某一地理经纬度在**未倾斜、未自转**的局部坐标系中的单位向量，
 * 与 three.js SphereGeometry 的 UV 约定严格对应。可用于放置地面标记。
 */
export function geoToSphereLocal(latDeg, lonDeg) {
  const u = lonDeg / 360 + 0.5      // 0° 经线 → u=0.5
  const phi = u * 2 * Math.PI
  const theta = (90 - latDeg) * DEG
  return new THREE.Vector3(
    -Math.cos(phi) * Math.sin(theta),
    Math.cos(theta),
    Math.sin(phi) * Math.sin(theta),
  )
}

/** 生成一段圆弧上的点（黄经 from→to，逆时针），用于高亮当前节气所在的轨道弧段 */
export function arcPoints(fromSunLon, toSunLon, radius = SCALE.orbitRadius, segments = 96, y = 0) {
  const pts = []
  // 始终沿公转方向（黄经增大）前进
  let span = norm360(toSunLon - fromSunLon)
  if (span === 0) span = 360
  for (let i = 0; i <= segments; i++) {
    const lon = fromSunLon + (span * i) / segments
    const p = earthPositionFromSunLongitude(lon, radius)
    p.y = y
    pts.push(p)
  }
  return pts
}
