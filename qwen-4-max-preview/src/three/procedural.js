/**
 * 程序化纹理：太阳表面、光晕、高亮环，以及真实纹理加载失败时的地球替代纹理。
 * 替代纹理为示意风格（非真实海陆），保证离线/加载失败时体验完整。
 */
import * as THREE from 'three'

function canvas (w, h) {
  const c = document.createElement('canvas')
  c.width = w; c.height = h
  return c
}

export function makeSunTexture () {
  const c = canvas(512, 256), g = c.getContext('2d')
  const grad = g.createLinearGradient(0, 0, 0, 256)
  grad.addColorStop(0, '#ffd977'); grad.addColorStop(0.5, '#ffb63e'); grad.addColorStop(1, '#ff9d2e')
  g.fillStyle = grad; g.fillRect(0, 0, 512, 256)
  for (let i = 0; i < 2600; i++) {
    const x = Math.random() * 512, y = Math.random() * 256, r = 1 + Math.random() * 5
    const a = 0.04 + Math.random() * 0.1
    g.fillStyle = Math.random() > 0.5 ? `rgba(255,240,190,${a})` : `rgba(230,120,30,${a})`
    g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill()
  }
  for (let i = 0; i < 7; i++) {
    const x = Math.random() * 512, y = 60 + Math.random() * 136, r = 3 + Math.random() * 7
    g.fillStyle = 'rgba(150,60,10,0.35)'
    g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill()
  }
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  return t
}

export function makeGlowTexture (inner = 'rgba(255,235,190,1)', mid = 'rgba(255,180,80,0.35)') {
  const c = canvas(256, 256), g = c.getContext('2d')
  const grad = g.createRadialGradient(128, 128, 0, 128, 128, 128)
  grad.addColorStop(0, inner)
  grad.addColorStop(0.25, mid)
  grad.addColorStop(1, 'rgba(255,140,40,0)')
  g.fillStyle = grad; g.fillRect(0, 0, 256, 256)
  return new THREE.CanvasTexture(c)
}

export function makeRingTexture () {
  const c = canvas(128, 128), g = c.getContext('2d')
  g.strokeStyle = 'rgba(255,255,255,0.95)'
  g.lineWidth = 7
  g.beginPath(); g.arc(64, 64, 48, 0, Math.PI * 2); g.stroke()
  g.strokeStyle = 'rgba(255,255,255,0.3)'
  g.lineWidth = 14
  g.beginPath(); g.arc(64, 64, 48, 0, Math.PI * 2); g.stroke()
  return new THREE.CanvasTexture(c)
}

// 粗略大陆轮廓（仅用于加载失败时的示意纹理）[lon, lat]
const CONTINENTS = [
  [[-168, 66], [-140, 70], [-120, 72], [-90, 72], [-75, 62], [-55, 50], [-65, 44], [-75, 38], [-81, 31], [-81, 25], [-90, 29], [-97, 26], [-97, 20], [-105, 20], [-110, 24], [-117, 33], [-124, 40], [-124, 48], [-135, 58], [-152, 58], [-168, 60]],
  [[-55, 60], [-42, 62], [-25, 70], [-20, 76], [-32, 83], [-55, 82], [-60, 76], [-55, 70]],
  [[-78, 7], [-60, 10], [-50, 0], [-35, -8], [-38, -15], [-48, -25], [-53, -34], [-58, -40], [-65, -47], [-68, -55], [-72, -50], [-73, -40], [-71, -30], [-70, -18], [-76, -10], [-80, -3], [-78, 3]],
  [[-17, 15], [-5, 35], [10, 37], [20, 32], [32, 31], [43, 12], [51, 11], [40, -5], [35, -20], [30, -30], [20, -35], [17, -30], [12, -18], [9, -2], [8, 4], [-5, 5], [-10, 6], [-17, 10]],
  [[-10, 36], [-9, 43], [-2, 48], [-5, 50], [0, 52], [5, 58], [10, 58], [18, 56], [25, 60], [30, 60], [40, 66], [45, 60], [40, 50], [35, 45], [28, 41], [22, 38], [15, 38], [10, 44], [3, 43], [0, 40], [-6, 36]],
  [[28, 41], [40, 50], [45, 60], [40, 66], [50, 70], [70, 73], [100, 77], [120, 73], [140, 72], [160, 70], [170, 66], [160, 60], [155, 53], [142, 45], [130, 42], [122, 38], [120, 30], [108, 20], [105, 10], [103, 2], [98, 8], [95, 16], [88, 22], [80, 15], [77, 8], [72, 20], [66, 25], [58, 25], [52, 28], [48, 30], [44, 38], [35, 45]],
  [[114, -22], [122, -18], [130, -12], [137, -12], [142, -11], [146, -15], [149, -21], [153, -27], [150, -35], [144, -38], [136, -35], [130, -32], [124, -33], [115, -34], [113, -26]]
]

function drawLand (g, W, H, fill) {
  const px = (lon) => (lon + 180) / 360 * W
  const py = (lat) => (90 - lat) / 180 * H
  g.fillStyle = fill
  for (const poly of CONTINENTS) {
    g.beginPath()
    poly.forEach(([lon, lat], i) => i ? g.lineTo(px(lon), py(lat)) : g.moveTo(px(lon), py(lat)))
    g.closePath(); g.fill()
  }
  g.fillRect(0, py(-72), W, H - py(-72)) // 南极洲
  g.fillRect(0, 0, W, py(84))            // 北冰洋冰盖
}

export function makeFallbackEarthTextures () {
  const W = 1024, H = 512
  const day = canvas(W, H), d = day.getContext('2d')
  const ocean = d.createLinearGradient(0, 0, 0, H)
  ocean.addColorStop(0, '#0d2c50'); ocean.addColorStop(0.5, '#123f6e'); ocean.addColorStop(1, '#0d2c50')
  d.fillStyle = ocean; d.fillRect(0, 0, W, H)
  drawLand(d, W, H, '#3e6b3a')
  d.globalAlpha = 0.35; drawLand(d, W, H, '#8a7a4a'); d.globalAlpha = 1
  d.fillStyle = 'rgba(235,240,245,0.9)'; d.fillRect(0, 0, W, H * 0.045); d.fillRect(0, H * 0.94, W, H * 0.06)

  const water = canvas(W, H), w = water.getContext('2d')
  w.fillStyle = '#ffffff'; w.fillRect(0, 0, W, H)
  drawLand(w, W, H, '#000000')

  const night = canvas(W, H), n = night.getContext('2d')
  n.fillStyle = '#020409'; n.fillRect(0, 0, W, H)
  const cities = [[-74, 40], [-87, 41], [-118, 34], [-99, 19], [-46, -23], [-58, -34], [-0.1, 51], [2, 48], [13, 52], [12, 41], [37, 55], [31, 30], [3, 6], [28, -26], [55, 25], [72, 19], [77, 28], [100, 13], [106, -6], [116, 39], [121, 31], [114, 22], [139, 35], [126, 37], [151, -33]]
  for (const [lon, lat] of cities) {
    const x = (lon + 180) / 360 * W, y = (90 - lat) / 180 * H
    for (let i = 0; i < 26; i++) {
      n.fillStyle = `rgba(255,214,140,${0.25 + Math.random() * 0.5})`
      n.fillRect(x + (Math.random() - 0.5) * 26, y + (Math.random() - 0.5) * 14, 1.4, 1.4)
    }
  }

  const clouds = canvas(W, H), cl = clouds.getContext('2d')
  for (let i = 0; i < 240; i++) {
    const x = Math.random() * W, y = Math.random() * H
    const rx = 14 + Math.random() * 60, ry = 4 + Math.random() * 12
    const grad = cl.createRadialGradient(x, y, 0, x, y, rx)
    grad.addColorStop(0, 'rgba(255,255,255,0.5)'); grad.addColorStop(1, 'rgba(255,255,255,0)')
    cl.fillStyle = grad
    cl.save(); cl.translate(x, y); cl.scale(1, ry / rx); cl.beginPath(); cl.arc(0, 0, rx, 0, Math.PI * 2); cl.fill(); cl.restore()
  }

  const bump = canvas(64, 32), b = bump.getContext('2d')
  b.fillStyle = '#808080'; b.fillRect(0, 0, 64, 32)

  const mk = (c, srgb) => { const t = new THREE.CanvasTexture(c); if (srgb) t.colorSpace = THREE.SRGBColorSpace; return t }
  return { day: mk(day, true), night: mk(night, true), clouds: mk(clouds, true), water: mk(water, false), bump: mk(bump, false) }
}