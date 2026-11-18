/**
 * Three.js 核心场景：太阳、地球（真实纹理+云层+大气+昼夜）、公转轨道与 24 节气标记。
 *
 * 坐标约定（与太阳视黄经严格对应）：
 *   - 黄道面 = 场景 XZ 平面，+Y 为黄道北极；从 +Y 俯视，地球逆时针公转。
 *   - 太阳视黄经 λ → 地球位置 (−r·cosλ, 0, r·sinλ)。
 *     春分 λ=0 → (−r,0,0)；夏至 λ=90 → (0,0,r)；秋分 λ=180 → (r,0,0)；冬至 λ=270 → (0,0,−r)。
 *   - 地轴方向固定为 (0, cos23.44°, −sin23.44°)（tiltGroup.rotation.x = −23.44°），
 *     夏至时北极倾向太阳、冬至时背向太阳，二分日侧向光照 —— 与真实季节光照一致。
 *   - 轨道为接近正圆的椭圆（显示偏心率适度夸大），r 由真近点角给出，
 *     因此“1 月初地球更快”的开普勒效应由真实 λ(t) 自动体现。
 */
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { TERMS, SEASONS } from '../data/terms.js'
import { sim, tick } from '../state/simulation.js'
import {
  makeSunTexture, makeGlowTexture, makeRingTexture, makeFallbackEarthTextures
} from './procedural.js'

const DEG = Math.PI / 180
const TILT = 23.44 * DEG
const ORBIT_A = 10
const ORBIT_E = 0.09          // 显示用偏心率（真实约 0.0167，界面已注明不按比例）
const PERIHELION_LON = 102.94 // 地球近日点的日心黄经（度）
const EARTH_R = 0.72
const SUN_R = 1.5
const SIDEREAL_DAY_MS = 86164100

const SEASON_ARCS = [
  { season: 'spring', from: 315, to: 450 },
  { season: 'summer', from: 45, to: 135 },
  { season: 'autumn', from: 135, to: 225 },
  { season: 'winter', from: 225, to: 315 }
]

function orbitPoint (lonDeg, out) {
  const nu = (lonDeg + 180 - PERIHELION_LON) * DEG
  const r = ORBIT_A * (1 - ORBIT_E * ORBIT_E) / (1 + ORBIT_E * Math.cos(nu))
  const l = lonDeg * DEG
  return out.set(-r * Math.cos(l), 0, r * Math.sin(l))
}

const easeInOutCubic = (k) => k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2

export class SolarScene {
  constructor (container, opts = {}) {
    this.container = container
    this.opts = opts
    this.disposed = false
    this.textures = new Set()
    this.locale = opts.locale || 'zh'
    this.lastPreset = null
    this.lastQuality = null
    this.currentTermIndex = -1
    this.followEarth = false
    this.camTween = null
    this.raf = 0
    this.lastT = performance.now()

    const w = Math.max(1, container.clientWidth)
    const h = Math.max(1, container.clientHeight)

    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' })
    this.renderer.setSize(w, h, false)
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1.12
    this.renderer.domElement.className = 'scene-canvas'
    container.appendChild(this.renderer.domElement)

    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color(0x04070f)

    this.camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 2000)
    this.camera.position.set(13, 10.5, 15)

    this.controls = new OrbitControls(this.camera, this.renderer.domElement)
    this.controls.enableDamping = true
    this.controls.dampingFactor = 0.06
    this.controls.minDistance = 2.2
    this.controls.maxDistance = 80
    this.controls.maxPolarAngle = Math.PI * 0.95
    this.controls.target.set(0, 0, 0)

    this._lights()
    this._sun()
    this._stars()
    this._orbit()
    this._earth()
    this._helpers()
    this._labels()

    this.ro = new ResizeObserver(() => this._resize())
    this.ro.observe(container)
    this._onVis = () => {
      if (document.hidden) { cancelAnimationFrame(this.raf); this.raf = 0 }
      else if (!this.raf && !this.disposed) { this.lastT = performance.now(); this.raf = requestAnimationFrame(this._loop) }
    }
    document.addEventListener('visibilitychange', this._onVis)

    this.applyQuality(sim.quality)
    this.camera.position.multiplyScalar(this.viewScale || 1)
    this._loadTextures()
    this.raf = requestAnimationFrame(this._loop)
  }

  _track (tex) { this.textures.add(tex); return tex }

  _lights () {
    this.sunLight = new THREE.PointLight(0xfff1d6, 350, 0, 2)
    this.scene.add(this.sunLight)
    this.scene.add(new THREE.AmbientLight(0x28344a, 0.5))
  }

  _sun () {
    this.sunGroup = new THREE.Group()
    const sunTex = this._track(makeSunTexture())
    this.sunMesh = new THREE.Mesh(
      new THREE.SphereGeometry(SUN_R, 48, 48),
      new THREE.MeshBasicMaterial({ map: sunTex, toneMapped: false })
    )
    this.sunGroup.add(this.sunMesh)

    const glowIn = this._track(makeGlowTexture())
    const glowOut = this._track(makeGlowTexture('rgba(255,200,120,0.5)', 'rgba(255,150,60,0.16)'))
    this.glow1 = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowIn, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, opacity: 0.9 }))
    this.glow1.scale.setScalar(7.2)
    this.glow2 = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowOut, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, opacity: 0.65 }))
    this.glow2.scale.setScalar(17)
    this.sunGroup.add(this.glow1, this.glow2)
    this.scene.add(this.sunGroup)
  }

  _stars () {
    const N = 2600
    const pos = new Float32Array(N * 3)
    const col = new Float32Array(N * 3)
    for (let i = 0; i < N; i++) {
      const r = 260 + Math.random() * 260
      const th = Math.random() * Math.PI * 2
      const ph = Math.acos(2 * Math.random() - 1)
      pos[i * 3] = r * Math.sin(ph) * Math.cos(th)
      pos[i * 3 + 1] = r * Math.cos(ph)
      pos[i * 3 + 2] = r * Math.sin(ph) * Math.sin(th)
      const p = Math.random()
      let c
      if (p < 0.12) c = [1, 0.85, 0.68]
      else if (p < 0.2) c = [0.72, 0.84, 1]
      else { const b = 0.6 + Math.random() * 0.4; c = [b, b, b * (0.95 + Math.random() * 0.05)] }
      col[i * 3] = c[0]; col[i * 3 + 1] = c[1]; col[i * 3 + 2] = c[2]
    }
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3))
    this.stars = new THREE.Points(geo, new THREE.PointsMaterial({
      size: 1.5, sizeAttenuation: false, vertexColors: true, transparent: true, opacity: 0.95, depthWrite: false
    }))
    this.scene.add(this.stars)
  }

  _orbit () {
    // 基础轨道线
    const pts = []
    for (let i = 0; i < 256; i++) pts.push(orbitPoint(i / 256 * 360, new THREE.Vector3()))
    const orbitGeo = new THREE.BufferGeometry().setFromPoints(pts)
    this.scene.add(new THREE.LineLoop(orbitGeo, new THREE.LineBasicMaterial({ color: 0x33465f, transparent: true, opacity: 0.9 })))

    // 四季色弧
    for (const arc of SEASON_ARCS) {
      const p = []
      for (let i = 0; i <= 64; i++) p.push(orbitPoint(arc.from + (arc.to - arc.from) * i / 64, new THREE.Vector3()))
      const line = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(p),
        new THREE.LineBasicMaterial({ color: new THREE.Color(SEASONS[arc.season].color), transparent: true, opacity: 0.5 })
      )
      this.scene.add(line)
    }

    // 24 节气标记
    this.markers = []
    this.labelAnchors = []
    const geoSmall = new THREE.SphereGeometry(0.085, 12, 12)
    const geoMajor = new THREE.SphereGeometry(0.15, 16, 16)
    TERMS.forEach((term, i) => {
      const color = term.major ? 0xe8c476 : new THREE.Color(SEASONS[term.season].color).getHex()
      const mesh = new THREE.Mesh(term.major ? geoMajor : geoSmall, new THREE.MeshBasicMaterial({ color, toneMapped: false }))
      orbitPoint(term.lon, mesh.position)
      mesh.userData.index = i
      this.scene.add(mesh)
      this.markers.push(mesh)
      // 标签锚点沿轨道径向向外偏移，避免遮挡地球与标记
      this.labelAnchors.push(mesh.position.clone().multiplyScalar(1.16))
    })

    // 当前节气高亮环
    this.ringTex = this._track(makeRingTexture())
    this.ring = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.ringTex, color: 0xe8c476, transparent: true, depthWrite: false, toneMapped: false }))
    this.ring.scale.setScalar(0.6)
    this.scene.add(this.ring)

    // 公转方向箭头
    this.dirGroup = new THREE.Group()
    const coneGeo = new THREE.ConeGeometry(0.13, 0.4, 12)
    const coneMat = new THREE.MeshBasicMaterial({ color: 0xd9b36c, transparent: true, opacity: 0.9, toneMapped: false })
    for (const lon of [45, 165, 285]) {
      const cone = new THREE.Mesh(coneGeo, coneMat)
      orbitPoint(lon, cone.position)
      const tangent = new THREE.Vector3(Math.sin(lon * DEG), 0, Math.cos(lon * DEG)).normalize()
      cone.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), tangent)
      this.dirGroup.add(cone)
    }
    this.scene.add(this.dirGroup)

    // 日地连线
    const slGeo = new THREE.BufferGeometry()
    slGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(6), 3))
    this.sunLine = new THREE.Line(slGeo, new THREE.LineBasicMaterial({ color: 0xc9a15f, transparent: true, opacity: 0.45 }))
    this.scene.add(this.sunLine)
  }

  _earth () {
    this.earthAnchor = new THREE.Group()
    this.tiltGroup = new THREE.Group()
    this.tiltGroup.rotation.x = -TILT // 地轴指向 (0, cosε, −sinε)，空间中固定不变
    this.spinGroup = new THREE.Group()
    this.earthAnchor.add(this.tiltGroup)
    this.tiltGroup.add(this.spinGroup)
    this.scene.add(this.earthAnchor)

    const fb = makeFallbackEarthTextures()
    Object.values(fb).forEach(t => this._track(t))
    this.fallback = fb

    const aniso = Math.min(8, this.renderer.capabilities.getMaxAnisotropy())
    this.earthMat = new THREE.MeshPhongMaterial({
      map: fb.day, bumpMap: fb.bump, bumpScale: 0.02,
      specularMap: fb.water, specular: new THREE.Color(0x4a5a6a), shininess: 16,
      emissiveMap: fb.night, emissive: new THREE.Color(0xffc978), emissiveIntensity: 1.5
    })
    this.earthMat.onBeforeCompile = (shader) => {
      shader.vertexShader = shader.vertexShader
        .replace('#include <common>', '#include <common>\nvarying vec3 vWPos;\nvarying vec3 vWNormal;')
        .replace('#include <fog_vertex>', '#include <fog_vertex>\nvWPos = (modelMatrix * vec4(transformed, 1.0)).xyz;\nvWNormal = normalize(mat3(modelMatrix) * objectNormal);')
      shader.fragmentShader = shader.fragmentShader
        .replace('#include <common>', '#include <common>\nvarying vec3 vWPos;\nvarying vec3 vWNormal;')
        .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\nfloat sunDot = dot(normalize(vWNormal), normalize(-vWPos));\ntotalEmissiveRadiance *= smoothstep(0.06, -0.22, sunDot);')
    }
    this.earthMesh = new THREE.Mesh(new THREE.SphereGeometry(EARTH_R, 64, 64), this.earthMat)
    this.spinGroup.add(this.earthMesh)

    this.cloudMat = new THREE.MeshLambertMaterial({ map: fb.clouds, transparent: true, opacity: 0.92, depthWrite: false })
    this.clouds = new THREE.Mesh(new THREE.SphereGeometry(EARTH_R * 1.028, 48, 48), this.cloudMat)
    this.spinGroup.add(this.clouds)

    // 大气边缘辉光（菲涅尔）
    this.atmoMat = new THREE.ShaderMaterial({
      uniforms: { uColor: { value: new THREE.Color(0x4a90d9) } },
      vertexShader: `
        varying vec3 vWPos; varying vec3 vWNormal;
        void main() {
          vWPos = (modelMatrix * vec4(position, 1.0)).xyz;
          vWNormal = normalize(mat3(modelMatrix) * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }`,
      fragmentShader: `
        uniform vec3 uColor; varying vec3 vWPos; varying vec3 vWNormal;
        void main() {
          vec3 viewDir = normalize(cameraPosition - vWPos);
          float rim = 1.0 - abs(dot(viewDir, normalize(vWNormal)));
          float sunDot = dot(normalize(vWNormal), normalize(-vWPos));
          float day = smoothstep(-0.35, 0.45, sunDot);
          float a = pow(rim, 2.6) * (0.18 + 0.82 * day);
          gl_FragColor = vec4(uColor, a * 0.9);
        }`,
      side: THREE.BackSide, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false
    })
    this.atmosphere = new THREE.Mesh(new THREE.SphereGeometry(EARTH_R * 1.17, 48, 48), this.atmoMat)
    this.earthAnchor.add(this.atmosphere)
    this.aniso = aniso
  }

  _helpers () {
    // 地轴（在倾斜组内，不随自转）
    this.axisGroup = new THREE.Group()
    const axisGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, -1.25, 0), new THREE.Vector3(0, 1.25, 0)])
    this.axisGroup.add(new THREE.Line(axisGeo, new THREE.LineBasicMaterial({ color: 0xe8c476, transparent: true, opacity: 0.95 })))
    const cone = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.18, 10), new THREE.MeshBasicMaterial({ color: 0xe8c476, toneMapped: false }))
    cone.position.set(0, 1.3, 0)
    this.axisGroup.add(cone)
    const nc = document.createElement('canvas'); nc.width = nc.height = 64
    const ng = nc.getContext('2d')
    ng.font = 'bold 44px Georgia, serif'; ng.textAlign = 'center'; ng.textBaseline = 'middle'
    ng.fillStyle = '#f3d9a4'; ng.fillText('N', 32, 34)
    const nTex = this._track(new THREE.CanvasTexture(nc))
    const nSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: nTex, depthTest: false, transparent: true, toneMapped: false }))
    nSprite.scale.setScalar(0.4)
    nSprite.position.set(0, 1.55, 0)
    this.axisGroup.add(nSprite)
    this.tiltGroup.add(this.axisGroup)

    // 赤道环
    const ringPts = (lat) => {
      const r = EARTH_R * 1.018 * Math.cos(lat)
      const y = EARTH_R * 1.018 * Math.sin(lat)
      const p = []
      for (let i = 0; i < 96; i++) { const a = i / 96 * Math.PI * 2; p.push(new THREE.Vector3(r * Math.cos(a), y, r * Math.sin(a))) }
      return p
    }
    this.equator = new THREE.LineLoop(
      new THREE.BufferGeometry().setFromPoints(ringPts(0)),
      new THREE.LineBasicMaterial({ color: 0x6fd3e0, transparent: true, opacity: 0.9 })
    )
    this.tiltGroup.add(this.equator)

    // 南北回归线（虚线）
    this.tropics = new THREE.Group()
    for (const lat of [TILT, -TILT]) {
      const line = new THREE.LineLoop(
        new THREE.BufferGeometry().setFromPoints(ringPts(lat)),
        new THREE.LineDashedMaterial({ color: 0xffb163, dashSize: 0.055, gapSize: 0.04, transparent: true, opacity: 0.9 })
      )
      line.computeLineDistances()
      this.tropics.add(line)
    }
    this.tiltGroup.add(this.tropics)
  }

  _labels () {
    this.labelLayer = document.createElement('div')
    this.labelLayer.className = 'label-layer'
    this.labels = []
    TERMS.forEach((term, i) => {
      const b = document.createElement('button')
      b.type = 'button'
      b.className = 'term-label' + (term.major ? ' major' : '')
      b.addEventListener('click', () => this.opts.onTermClick && this.opts.onTermClick(i))
      const span = document.createElement('span')
      b.appendChild(span)
      this.labelLayer.appendChild(b)
      this.labels.push({ el: b, span, term })
    })
    this.container.appendChild(this.labelLayer)
    this.setLocale(this.locale)
  }

  setLocale (l) {
    this.locale = l
    this.labels.forEach(({ span, term }, i) => {
      span.textContent = term[l].name
      this.labels[i].el.title = `${term[l].name} · λ ${term.lon}°`
      this.labels[i].el.setAttribute('aria-label', term[l].name)
    })
  }

  _loadTextures () {
    const manager = new THREE.LoadingManager()
    manager.onProgress = (url, loaded, total) => this.opts.onProgress && this.opts.onProgress(loaded / total)
    manager.onLoad = () => this.opts.onReady && this.opts.onReady()
    const loader = new THREE.TextureLoader(manager)
    const base = import.meta.env.BASE_URL + 'textures/'
    const jobs = [
      ['earth_day.jpg', (t) => { t.colorSpace = THREE.SRGBColorSpace; this.earthMat.map = t; this.earthMat.needsUpdate = true }],
      ['earth_night.jpg', (t) => { t.colorSpace = THREE.SRGBColorSpace; this.earthMat.emissiveMap = t; this.earthMat.needsUpdate = true }],
      ['earth_clouds.png', (t) => { t.colorSpace = THREE.SRGBColorSpace; this.cloudMat.map = t; this.cloudMat.needsUpdate = true }],
      ['earth_water.png', (t) => { this.earthMat.specularMap = t; this.earthMat.needsUpdate = true }],
      ['earth_bump.png', (t) => { this.earthMat.bumpMap = t; this.earthMat.needsUpdate = true }]
    ]
    for (const [file, apply] of jobs) {
      loader.load(base + file,
        (t) => { t.anisotropy = this.aniso; this._track(t); apply(t) },
        undefined,
        () => { this.opts.onTextureError && this.opts.onTextureError(file) }
      )
    }
  }

  applyQuality (q) {
    const coarse = window.matchMedia && window.matchMedia('(pointer: coarse)').matches
    const small = Math.min(window.innerWidth, window.innerHeight) < 700
    const eff = q === 'auto' ? ((coarse || small) ? 'low' : 'high') : q
    this.effQuality = eff
    const dpr = Math.min(window.devicePixelRatio || 1, eff === 'low' ? 1.3 : 2)
    this.renderer.setPixelRatio(dpr)
    this._resize()
    this.clouds.visible = eff !== 'low'
    this.atmosphere.visible = eff !== 'low'
    this.stars.geometry.setDrawRange(0, eff === 'low' ? 1000 : 2600)
    this.earthMat.bumpScale = eff === 'low' ? 0 : 0.02
  }

  goToPreset (preset) {
    const earthPos = this.earthAnchor.position
    const s = this.viewScale || 1
    let toPos, toTarget
    if (preset === 'overview') { toPos = new THREE.Vector3(4 * s, 27 * s, 9 * s); toTarget = new THREE.Vector3(0, 0, 0) }
    else if (preset === 'earth') { toPos = earthPos.clone().add(new THREE.Vector3(2.6, 1.5, 3.0)); toTarget = earthPos.clone() }
    else { toPos = new THREE.Vector3(13 * s, 10.5 * s, 15 * s); toTarget = new THREE.Vector3(0, 0, 0) }
    this.camTween = {
      t0: performance.now(), dur: 900,
      fromPos: this.camera.position.clone(), toPos,
      fromTarget: this.controls.target.clone(), toTarget,
      preset
    }
    this.followEarth = false
    this.controls.enabled = false
  }

  _resize () {
    if (this.disposed) return
    const w = Math.max(1, this.container.clientWidth)
    const h = Math.max(1, this.container.clientHeight)
    this.renderer.setSize(w, h, false)
    this.camera.aspect = w / h
    this.camera.updateProjectionMatrix()
    // 窄屏（手机竖屏）自动拉远相机，保证整条轨道可见
    const scale = Math.min(1.9, Math.max(1, 1.25 / this.camera.aspect))
    if (Math.abs(scale - (this.viewScale || 1)) > 0.02) {
      this.viewScale = scale
      if (this.lastPreset && this.lastPreset !== 'earth' && !this.camTween) this.goToPreset(this.lastPreset)
    }
  }

  _loop = (t) => {
    if (this.disposed) return
    this.raf = requestAnimationFrame(this._loop)
    const dt = Math.min(100, t - this.lastT)
    this.lastT = t
    tick(dt)
    this._update(t, dt)
    this.controls.update()
    this.renderer.render(this.scene, this.camera)
  }

  _update (t, dt) {
    const lambda = sim.lambda
    const prevEarth = this._prevEarth || (this._prevEarth = new THREE.Vector3())
    prevEarth.copy(this.earthAnchor.position)
    orbitPoint(lambda, this.earthAnchor.position)

    // 自转（恒星日）与云层略快
    const spin = ((sim.simTime / SIDEREAL_DAY_MS) % 1) * Math.PI * 2
    this.spinGroup.rotation.y = spin
    this.clouds.rotation.y = spin * 1.06 + 0.7

    // 太阳缓慢自转与光晕呼吸
    this.sunMesh.rotation.y = t * 0.00003
    const pulse = 1 + 0.03 * Math.sin(t * 0.0008)
    this.glow1.scale.setScalar(7.2 * pulse)
    this.glow2.scale.setScalar(17 * (2 - pulse))
    this.stars.rotation.y = t * 0.0000035

    // 当前节气标记高亮（近景模式下隐藏高亮环、淡化标签，避免遮挡地球）
    const cur = sim.termCtx.current.index
    if (cur !== this.currentTermIndex) {
      this.currentTermIndex = cur
      this.ring.position.copy(this.markers[cur].position)
      this.ring.material.color.set(SEASONS[TERMS[cur].season].glow)
      this.labels.forEach(({ el }, i) => el.classList.toggle('current', i === cur))
    }
    const closeup = sim.cameraPreset === 'earth'
    this.ring.visible = !closeup
    this.labelLayer.classList.toggle('closeup', closeup)
    this.ring.scale.setScalar(0.62 + 0.11 * Math.sin(t * 0.004))
    this.markers[cur].scale.setScalar(1 + 0.25 * Math.sin(t * 0.004))

    // 日地连线
    const slPos = this.sunLine.geometry.attributes.position
    slPos.setXYZ(1, this.earthAnchor.position.x, this.earthAnchor.position.y, this.earthAnchor.position.z)
    slPos.needsUpdate = true

    // 辅助标识开关
    const hp = sim.helpers
    this.axisGroup.visible = hp.axis
    this.equator.visible = hp.equator
    this.tropics.visible = hp.tropics
    this.dirGroup.visible = hp.direction
    this.sunLine.visible = hp.sunLine
    this.labelLayer.style.display = hp.labels ? '' : 'none'

    // 画质切换
    if (sim.quality !== this.lastQuality) { this.lastQuality = sim.quality; this.applyQuality(sim.quality) }

    // 相机预设与跟随
    if (sim.cameraPreset !== this.lastPreset) { this.lastPreset = sim.cameraPreset; this.goToPreset(sim.cameraPreset) }
    if (this.camTween) {
      const k = Math.min(1, (t - this.camTween.t0) / this.camTween.dur)
      const e = easeInOutCubic(k)
      this.camera.position.lerpVectors(this.camTween.fromPos, this.camTween.toPos, e)
      this.controls.target.lerpVectors(this.camTween.fromTarget, this.camTween.toTarget, e)
      if (k >= 1) {
        this.followEarth = this.camTween.preset === 'earth'
        this.controls.enabled = true
        this.controls.enablePan = !this.followEarth
        this.camTween = null
      }
    } else if (this.followEarth) {
      const delta = this.earthAnchor.position.clone().sub(prevEarth)
      this.camera.position.add(delta)
      this.controls.target.copy(this.earthAnchor.position)
    }

    this._updateLabels()
  }

  _updateLabels () {
    if (!sim.helpers.labels) return
    const w = this.container.clientWidth, h = this.container.clientHeight
    const v = this._lv || (this._lv = new THREE.Vector3())
    for (let i = 0; i < 24; i++) {
      v.copy(this.labelAnchors[i]).project(this.camera)
      const { el } = this.labels[i]
      if (v.z > 1 || v.z < -1) { el.style.opacity = '0'; el.style.pointerEvents = 'none'; continue }
      const x = Math.max(34, Math.min(w - 34, (v.x + 1) / 2 * w))
      const y = Math.max(14, Math.min(h - 14, (-v.y + 1) / 2 * h))
      el.style.opacity = ''
      el.style.pointerEvents = ''
      el.style.transform = `translate(-50%, -50%) translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`
    }
  }

  dispose () {
    this.disposed = true
    cancelAnimationFrame(this.raf)
    document.removeEventListener('visibilitychange', this._onVis)
    this.ro.disconnect()
    this.controls.dispose()
    this.scene.traverse(obj => {
      if (obj.geometry) obj.geometry.dispose()
      if (obj.material) {
        const mats = Array.isArray(obj.material) ? obj.material : [obj.material]
        mats.forEach(m => m.dispose())
      }
    })
    this.textures.forEach(t => t.dispose())
    this.renderer.dispose()
    this.renderer.forceContextLoss()
    this.renderer.domElement.remove()
    this.labelLayer.remove()
  }
}