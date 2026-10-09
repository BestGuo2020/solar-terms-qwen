/**
 * proceduralTextures.js — 程序化生成的纹理
 *
 * 两类用途：
 *  1) **资源失败后的替代效果**：public/textures/ 里某张图缺失或加载失败时，
 *     用这里生成的等效纹理顶上，页面照常可用（只是真实感下降），并在界面上提示。
 *  2) **本来就该程序化生成的东西**：太阳光晕 sprite、星空点云、轨道发光等。
 *
 * 全部用 Canvas 2D 生成，不依赖任何网络资源。
 */

import * as THREE from 'three'

// ---------------------------------------------------------------------------
// 可平铺的值噪声（沿经度方向周期平铺，避免球面接缝）
// ---------------------------------------------------------------------------
function makeNoise(seed = 1, periodX = 64, periodY = 64) {
  const hash = (x, y) => {
    const ix = ((x % periodX) + periodX) % periodX
    const iy = ((y % periodY) + periodY) % periodY
    let n = Math.imul(ix, 1619) + Math.imul(iy, 31337) + Math.imul(seed, 6971)
    n = (n << 13) ^ n
    const t = Math.imul(Math.imul(Math.imul(n, n), 15731) + 789221, n) + 1376312589
    return 1 - ((t & 0x7fffffff) / 1073741823)
  }
  const smooth = (t) => t * t * (3 - 2 * t)

  const noise = (fx, fy) => {
    const x0 = Math.floor(fx), y0 = Math.floor(fy)
    const tx = smooth(fx - x0), ty = smooth(fy - y0)
    const a = hash(x0, y0), b = hash(x0 + 1, y0), c = hash(x0, y0 + 1), d = hash(x0 + 1, y0 + 1)
    return (a * (1 - tx) + b * tx) * (1 - ty) + (c * (1 - tx) + d * tx) * ty
  }

  return function fbm(fx, fy, octaves = 5, lacunarity = 2, gain = 0.5) {
    let amp = 1, freq = 1, sum = 0, norm = 0
    for (let i = 0; i < octaves; i++) {
      sum += amp * noise(fx * freq, fy * freq)
      norm += amp
      amp *= gain
      freq *= lacunarity
    }
    return sum / norm
  }
}

function canvas2D(w, h) {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  return { canvas: c, ctx: c.getContext('2d', { willReadFrequently: false }) }
}

function toTexture(canvas, { srgb = true, repeat = null, aniso = 4 } = {}) {
  const t = new THREE.CanvasTexture(canvas)
  if (srgb) t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = aniso
  t.wrapS = THREE.RepeatWrapping
  t.wrapT = THREE.ClampToEdgeWrapping
  if (repeat) t.repeat.set(repeat[0], repeat[1])
  t.needsUpdate = true
  return t
}

// ---------------------------------------------------------------------------
// 替代纹理：地球白昼
// ---------------------------------------------------------------------------
/**
 * 程序化"类地行星"底图。这不是真实地球海陆分布，只作为纹理加载失败时的替代，
 * 界面上会明确提示当前使用的是替代纹理。
 */
export function makeFallbackEarthDay(size = 1024) {
  const w = size, h = size / 2
  const { canvas, ctx } = canvas2D(w, h)
  const img = ctx.createImageData(w, h)
  const cont = makeNoise(7, 48, 48)
  const detail = makeNoise(23, 96, 96)

  for (let y = 0; y < h; y++) {
    const lat = 90 - (y / h) * 180                 // +90 北 → −90 南
    const latT = Math.abs(lat) / 90
    for (let x = 0; x < w; x++) {
      const u = x / w, v = y / h
      // 经度方向周期平铺；纬度方向压缩，减少两极拉伸
      const e = cont(u * 12, v * 6, 6) * 0.72 + detail(u * 26, v * 13, 4) * 0.28
      const land = e > 0.04
      let r, g, b

      if (land) {
        const alt = Math.min(1, Math.max(0, (e - 0.04) * 2.6))
        if (latT > 0.82) {                            // 极地冰雪
          r = 232; g = 238; b = 242
        } else if (latT > 0.58) {                     // 亚寒带针叶林 / 苔原
          const k = detail(u * 40, v * 20, 3) * 0.5 + 0.5
          r = 74 + k * 26; g = 96 + k * 30; b = 74 + k * 20
        } else if (latT < 0.2 && alt < 0.35) {         // 赤道雨林
          r = 34 + alt * 40; g = 88 + alt * 40; b = 40 + alt * 24
        } else if (latT > 0.18 && latT < 0.42 && alt < 0.45) {  // 副热带荒漠
          const k = detail(u * 34, v * 17, 3) * 0.5 + 0.5
          r = 186 + k * 34; g = 158 + k * 28; b = 106 + k * 24
        } else {                                       // 温带草原 / 落叶林
          const k = detail(u * 30, v * 15, 3) * 0.5 + 0.5
          r = 96 + k * 44; g = 122 + k * 38; b = 66 + k * 26
        }
        // 高海拔提亮（山地）
        if (alt > 0.62) { const s = (alt - 0.62) * 140; r += s; g += s; b += s }
      } else {
        const depth = Math.min(1, Math.max(0, (0.04 - e) * 3.2))
        r = 22 - depth * 14
        g = 62 - depth * 30
        b = 118 - depth * 44
        if (latT > 0.9) { const s = (latT - 0.9) * 900; r += s * 0.6; g += s * 0.65; b += s * 0.7 }
      }

      const i = (y * w + x) * 4
      img.data[i] = Math.max(0, Math.min(255, r | 0))
      img.data[i + 1] = Math.max(0, Math.min(255, g | 0))
      img.data[i + 2] = Math.max(0, Math.min(255, b | 0))
      img.data[i + 3] = 255
    }
  }
  ctx.putImageData(img, 0, 0)
  return toTexture(canvas)
}

/** 替代：夜面灯光（在"陆地"上撒点） */
export function makeFallbackEarthNight(size = 1024) {
  const w = size, h = size / 2
  const { canvas, ctx } = canvas2D(w, h)
  ctx.fillStyle = '#000'
  ctx.fillRect(0, 0, w, h)
  const cont = makeNoise(7, 48, 48)
  const clumps = makeNoise(91, 24, 24)
  for (let y = 0; y < h; y++) {
    const v = y / h
    const latT = Math.abs(90 - v * 180) / 90
    for (let x = 0; x < w; x++) {
      const u = x / w
      const e = cont(u * 12, v * 6, 6)
      if (e <= 0.04 || latT > 0.8) continue
      const pop = clumps(u * 8, v * 4, 4) * 0.5 + 0.5
      if (Math.random() > pop * 0.28) continue
      const br = 0.35 + Math.random() * 0.65
      ctx.fillStyle = `rgba(255,${214 + Math.random() * 30 | 0},${150 + Math.random() * 60 | 0},${br})`
      ctx.fillRect(x, y, 1, 1)
    }
  }
  return toTexture(canvas)
}

/** 替代：云层 */
export function makeFallbackClouds(size = 1024) {
  const w = size, h = size / 2
  const { canvas, ctx } = canvas2D(w, h)
  const img = ctx.createImageData(w, h)
  const bands = makeNoise(11, 24, 24)
  const swirl = makeNoise(53, 64, 64)
  for (let y = 0; y < h; y++) {
    const v = y / h
    const lat = 90 - v * 180
    // 三圈环流：赤道与副热带少云、中纬度与赤道辐合带多云
    const band = 0.55 + 0.45 * Math.cos((lat * Math.PI) / 26) * Math.cos((lat * Math.PI) / 13)
    for (let x = 0; x < w; x++) {
      const u = x / w
      const n = bands(u * 6, v * 3, 5) * 0.6 + swirl(u * 16, v * 8, 4) * 0.4
      let a = (n + 0.18) * band
      a = Math.max(0, Math.min(1, (a - 0.34) * 3.4))
      const i = (y * w + x) * 4
      img.data[i] = img.data[i + 1] = img.data[i + 2] = 255
      img.data[i + 3] = (a * 235) | 0
    }
  }
  ctx.putImageData(img, 0, 0)
  const t = toTexture(canvas)
  return t
}

/** 替代：太阳光球 */
export function makeFallbackSun(size = 1024) {
  const w = size, h = size / 2
  const { canvas, ctx } = canvas2D(w, h)
  const img = ctx.createImageData(w, h)
  const gran = makeNoise(3, 128, 128)
  const big = makeNoise(17, 24, 24)
  for (let y = 0; y < h; y++) {
    const v = y / h
    for (let x = 0; x < w; x++) {
      const u = x / w
      const n = gran(u * 60, v * 30, 4) * 0.55 + big(u * 10, v * 5, 4) * 0.45
      const t = n * 0.5 + 0.5
      const i = (y * w + x) * 4
      img.data[i] = Math.min(255, 210 + t * 45) | 0
      img.data[i + 1] = Math.min(255, 120 + t * 105) | 0
      img.data[i + 2] = Math.min(255, 20 + t * 60) | 0
      img.data[i + 3] = 255
    }
  }
  ctx.putImageData(img, 0, 0)
  return toTexture(canvas)
}

// ---------------------------------------------------------------------------
// 始终程序化生成的资源
// ---------------------------------------------------------------------------

/** 太阳/大气光晕用的径向渐变 sprite */
export function makeGlowTexture(inner = 'rgba(255,246,214,1)', mid = 'rgba(255,190,90,0.45)', outer = 'rgba(255,140,40,0)') {
  const s = 256
  const { canvas, ctx } = canvas2D(s, s)
  const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2)
  g.addColorStop(0, inner)
  g.addColorStop(0.18, mid)
  g.addColorStop(0.55, 'rgba(255,150,60,0.10)')
  g.addColorStop(1, outer)
  ctx.fillStyle = g
  ctx.fillRect(0, 0, s, s)
  const t = toTexture(canvas)
  t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping
  return t
}

/** 柔和圆点，用于星空点云 */
export function makeDotTexture() {
  const s = 64
  const { canvas, ctx } = canvas2D(s, s)
  const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2)
  g.addColorStop(0, 'rgba(255,255,255,1)')
  g.addColorStop(0.35, 'rgba(255,255,255,0.55)')
  g.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, s, s)
  return toTexture(canvas)
}

/**
 * 程序化星空点云。与银河背景贴图叠加使用：背景负责"银河"，点云负责近处的亮星，
 * 缩放视角时能提供轻微层次，但始终位于最远处，不干扰节气标签辨认。
 */
export function makeStarPoints(count = 3000, radius = 2400) {
  const positions = new Float32Array(count * 3)
  const colors = new Float32Array(count * 3)
  const sizes = new Float32Array(count)
  // 恒星色温：蓝白 → 白 → 黄 → 橙红
  const palette = [
    [0.68, 0.78, 1.0], [0.82, 0.88, 1.0], [1.0, 1.0, 1.0],
    [1.0, 0.96, 0.86], [1.0, 0.88, 0.72], [1.0, 0.78, 0.6],
  ]
  for (let i = 0; i < count; i++) {
    // 均匀分布在球面上
    const u = Math.random() * 2 - 1
    const th = Math.random() * Math.PI * 2
    const s = Math.sqrt(1 - u * u)
    positions[i * 3] = radius * s * Math.cos(th)
    positions[i * 3 + 1] = radius * u
    positions[i * 3 + 2] = radius * s * Math.sin(th)
    const c = palette[(Math.random() ** 1.7 * palette.length) | 0]
    const b = 0.35 + Math.random() ** 2.4 * 0.65
    colors[i * 3] = c[0] * b
    colors[i * 3 + 1] = c[1] * b
    colors[i * 3 + 2] = c[2] * b
    sizes[i] = (Math.random() ** 3.2 * 2.6 + 0.45)
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  g.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  g.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1))
  return g
}
