/**
 * SceneManager.js — Three.js 场景总控
 *
 * 职责：渲染器/相机/控制器、星空背景、太阳、地球、轨道与节气标记，
 * 以及画质分级、可见性节流、射线拾取、资源释放。
 *
 * 时间来源：只从 lib/simClock.js 的 `clock.nowMs` 取值；
 * 场景本身不计算任何日期，因此时间轴、动画、详情面板必然同步。
 */

import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js'

import { SCALE, DEG, earthSpinAngle, earthPositionFromSunLongitude } from './orbitMath.js'
import { sunApparentLongitude, meanObliquity, locateTerm, precessionLongitudeDeg } from '../lib/astro.js'
import { Sun } from './Sun.js'
import { Earth } from './Earth.js'
import { OrbitRig } from './OrbitRig.js'
import { TextureManager } from './TextureManager.js'
import { makeStarPoints, makeDotTexture } from './proceduralTextures.js'
import { STAR_VERT, STAR_FRAG } from './shaders.js'
import { clock } from '../lib/simClock.js'
import { TERM_BY_INDEX } from '../data/termTable.js'
import { t } from '../i18n/index.js'
import { currentContent } from '../i18n/content.js'

export const VIEWS = [
  { id: 'default', label: '默认视角', hint: '斜上方俯瞰，兼顾轨道全貌与地球' },
  { id: 'overview', label: '轨道总览', hint: '拉远看清整条公转轨道与 24 个节气标记' },
  { id: 'top', label: '北极俯视', hint: '从北天极正上方俯视，可见公转与自转同为逆时针' },
  { id: 'earth', label: '地球近景', hint: '跟随地球，观察昼夜界线与地轴倾角' },
]

const QUALITY_PRESETS = {
  high: { pixelRatioCap: 2, stars: 2600, glow: 1.0, labelMode: 'all', shadows: false },
  medium: { pixelRatioCap: 1.5, stars: 1200, glow: 0.85, labelMode: 'all', shadows: false },
  low: { pixelRatioCap: 1, stars: 400, glow: 0.6, labelMode: 'major', shadows: false },
}

/** 根据设备粗略判断初始画质档位 */
export function detectQuality() {
  if (typeof navigator === 'undefined') return 'medium'
  const ua = navigator.userAgent || ''
  const mobile = /Android|iPhone|iPad|iPod|Mobile|HarmonyOS/i.test(ua)
  const small = typeof screen !== 'undefined' && Math.min(screen.width, screen.height) < 700
  const cores = navigator.hardwareConcurrency || 4
  const mem = navigator.deviceMemory || 4
  if (mobile || small) return cores <= 4 || mem <= 4 ? 'low' : 'medium'
  if (cores >= 8 && mem >= 8) return 'high'
  return 'medium'
}

export class SceneManager {
  /**
   * @param {HTMLElement} container  3D 展示区容器（position: relative）
   * @param {object} opts
   * @param {(termIndex:number)=>void} opts.onSelectTerm 点击节气标记时回调
   * @param {(info:object)=>void} opts.onProgress        纹理加载进度
   * @param {(info:object)=>void} opts.onStatus          画质降级 / 纹理回退等状态
   */
  constructor(container, opts = {}) {
    this.container = container
    this.onSelectTerm = opts.onSelectTerm || (() => {})
    this.onProgress = opts.onProgress || (() => {})
    this.onStatus = opts.onStatus || (() => {})

    this.quality = opts.quality || detectQuality()
    this.preset = QUALITY_PRESETS[this.quality]
    this.disposed = false
    this._renderEnabled = true
    this._docVisible = true
    this._inView = true
    this._fpsSamples = []
    this._autoDegraded = false

    this.helpers = {
      axis: true, equator: true, tropics: true, polarCircles: false,
      direction: true, markers: true, orbit: true, labels: this.preset.labelMode,
    }
    this.followEarth = false
    this.currentView = 'default'
    this._camAnim = null
    this._autoDegradeEnabled = true
    this._geoLabels = []

    this._initRenderer()
    this._initScene()
    this._initListeners()
    this._ready = this._build()
  }

  get ready() { return this._ready }

  // -------------------------------------------------------------------------
  _initRenderer() {
    const w = this.container.clientWidth || 800
    const h = this.container.clientHeight || 600

    this.renderer = new THREE.WebGLRenderer({
      antialias: this.quality !== 'low',
      alpha: false,
      powerPreference: this.quality === 'low' ? 'default' : 'high-performance',
      stencil: false,
    })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, this.preset.pixelRatioCap))
    this.renderer.setSize(w, h)
    this.renderer.outputColorSpace = THREE.SRGBColorSpace
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1.05
    this.renderer.setClearColor(0x04060c, 1)
    // 不覆盖 setSize 写入的行内尺寸：容器大小变化由 ResizeObserver → resize() 统一处理
    this.renderer.domElement.style.display = 'block'
    this.renderer.domElement.setAttribute('aria-label', '二十四节气地球公转三维场景')
    this.container.appendChild(this.renderer.domElement)

    // WebGL 能力：决定是否可以启用 8k 底图
    const gl = this.renderer.getContext()
    this.maxTextureSize = gl ? gl.getParameter(gl.MAX_TEXTURE_SIZE) : 4096
    this.maxAnisotropy = this.renderer.capabilities.getMaxAnisotropy()

    // CSS2D 图层：节气文字标签。容器本身不接收指针事件，
    // 只有标签按钮自己接收，因此不会挡住视角拖拽。
    this.labelRenderer = new CSS2DRenderer()
    this.labelRenderer.setSize(w, h)
    const le = this.labelRenderer.domElement
    le.style.position = 'absolute'
    le.style.inset = '0'
    le.style.pointerEvents = 'none'
    le.style.overflow = 'hidden'
    le.className = 'scene-labels'
    this.container.appendChild(le)

    this.camera = new THREE.PerspectiveCamera(40, w / h, 0.4, 8000)
    this.camera.position.set(0, 98, 142)

    this.controls = new OrbitControls(this.camera, this.renderer.domElement)
    this.controls.enableDamping = true
    this.controls.dampingFactor = 0.075
    this.controls.rotateSpeed = 0.62
    this.controls.zoomSpeed = 0.85
    this.controls.panSpeed = 0.6
    this.controls.minDistance = 4.2
    this.controls.maxDistance = 460
    this.controls.maxPolarAngle = Math.PI * 0.985
    this.controls.minPolarAngle = Math.PI * 0.015
    this.controls.target.set(0, 0, 0)
    // 触屏：单指旋转、双指缩放与平移
    this.controls.touches = { ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN }
    this.controls.update()
    this.defaultCamera = { pos: this.camera.position.clone(), target: this.controls.target.clone() }
  }

  _initScene() {
    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color(0x04060c)
    this.scene.backgroundIntensity = 0.34
    this.root = new THREE.Object3D()
    this.scene.add(this.root)
  }

  async _build() {
    // 1) 纹理（带加载进度与失败回退）
    this.textures = new TextureManager()
    this.textures.setMaxTextureSize(this.maxTextureSize)
    this.textures.onProgress((p, done, total) => this.onProgress({ progress: p, done, total }))
    await this.textures.loadAll(this.quality, this.maxAnisotropy)
    if (this.disposed) return
    this.onProgress({ progress: 1, done: 1, total: 1 })
    if (this.textures.failures.length || this.textures.missing.length) {
      this.onStatus({
        kind: 'texture-fallback',
        failures: [...this.textures.failures],
        missing: [...this.textures.missing],
      })
    }

    this.tiltDeg = meanObliquity(clock.nowMs)

    // 2) 星空背景
    const stars = this.textures.get('stars')
    if (stars) {
      stars.mapping = THREE.EquirectangularReflectionMapping
      this.scene.background = stars
      this.scene.backgroundIntensity = 0.30
    }
    this._buildStarPoints()

    // 3) 天体与轨道
    this.sun = new Sun({ textures: this.textures, quality: this.quality })
    this.root.add(this.sun.group)

    this.earth = new Earth({
      textures: this.textures, tiltDeg: this.tiltDeg, quality: this.quality,
      makeLabel: (text, cls) => this._makeGeoLabel(text, cls),
    })
    this.root.add(this.earth.system)

    this.rig = new OrbitRig({ makeMarkerLabel: (def) => this._makeMarkerLabel(def) })
    this.root.add(this.rig.group)

    this.applyHelpers()
    this._syncTermState(true)
    this._loop = this._loop.bind(this)
    this._lastT = performance.now()
    this._raf = requestAnimationFrame(this._loop)
    this.onStatus({ kind: 'ready', quality: this.quality })
  }

  _buildStarPoints() {
    const count = this.preset.stars
    if (!count) return
    const geo = makeStarPoints(count, SCALE.starfieldRadius * 0.72)
    const dot = makeDotTexture()
    const mat = new THREE.ShaderMaterial({
      vertexShader: STAR_VERT,
      fragmentShader: STAR_FRAG,
      uniforms: {
        uDot: { value: dot },
        uPixelRatio: { value: Math.min(window.devicePixelRatio || 1, 2) },
        uTime: { value: 0 },
        uSizeScale: { value: this.quality === 'low' ? 1.5 : 2.1 },
      },
      vertexColors: true,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
    this.starPoints = new THREE.Points(geo, mat)
    this.starPoints.frustumCulled = false
    this.starDotTex = dot
    this.root.add(this.starPoints)
  }

  // -------------------------------------------------------------------------
  // 标签（DOM，随语言刷新）
  // -------------------------------------------------------------------------
  _makeMarkerLabel(def) {
    let el
    if (def.isReference || def.index == null) {
      el = document.createElement('div')
      el.className = 'marker marker--ref'
    } else {
      el = document.createElement('button')
      el.type = 'button'
      el.className = `marker marker--term${def.major ? ' is-major' : ''}`
      el.dataset.termIndex = String(def.index)
      el.style.setProperty('--season-color', def.season === '春' ? '#7bd389' : def.season === '夏' ? '#f2b64c' : def.season === '秋' ? '#e08a4b' : '#7fb3e0')
      el.addEventListener('click', (e) => {
        e.stopPropagation()
        this.onSelectTerm(def.index)
      })
    }
    const o = new CSS2DObject(el)
    o.center.set(0.5, 0.5)
    o.userData.labelDef = def
    ;(this._labelObjs ||= []).push(o)
    this._fillMarkerLabel(o)
    return o
  }

  /** 按当前语言填充一个轨道/参考标签 */
  _fillMarkerLabel(o) {
    const el = o.element
    const def = o.userData.labelDef
    if (!el || !def) return
    if (def.isReference) {
      el.innerHTML = `<span class="marker__name">${t('ref.' + def.refKey)}</span>` +
        `<span class="marker__sub">${t('ref.' + def.refKey + 'Sub')}</span>`
      return
    }
    const term = currentContent().termsByIndex.get(def.index)
    const name = term ? term.title : def.name
    const vars = { name, d: def.longitude, n: def.index }
    if (def.major) {
      vars.sub = t('major.' + def.index)
      el.title = t('marker.tipMajor', vars)
      el.setAttribute('aria-label', t('marker.tipMajor', vars))
    } else {
      el.title = t('marker.tip', vars)
      el.setAttribute('aria-label', t('marker.tip', vars))
    }
    el.innerHTML =
      `<span class="marker__name">${name}</span>` +
      `<span class="marker__lon">${def.longitude}°</span>` +
      (def.major ? `<span class="marker__sub">${t('major.' + def.index)}</span>` : '')
  }

  _makeGeoLabel(geoKey, cls) {
    const d = document.createElement('div')
    d.className = cls || 'marker marker--geo'
    const o = new CSS2DObject(d)
    o.center.set(0.5, 0.5)
    o.userData.geoKey = geoKey
    ;(this._geoLabels ||= []).push(o)
    this._fillGeoLabel(o)
    return o
  }

  _fillGeoLabel(o) {
    const key = o.userData.geoKey
    if (!key || !o.element) return
    const eps = this.tiltDeg || 23.436
    const vars = key.indexOf('arctic') >= 0 ? { d: (90 - eps).toFixed(2) }
      : key.indexOf('tropic') >= 0 ? { d: eps.toFixed(2) } : {}
    o.element.textContent = t(key, vars)
  }

  /** 切换语言后重绘所有场景内文字标签 */
  refreshLabels() {
    for (const o of this._labelObjs || []) this._fillMarkerLabel(o)
    for (const o of this._geoLabels || []) this._fillGeoLabel(o)
  }

  /** 赤道/回归线/极圈的文字标签只在靠近地球时显示，避免在总览里糊成一团 */
  _updateGeoLabelVisibility() {
    if (!this._geoLabels?.length || !this.earth) return
    const d = this.camera.position.distanceTo(this.earth.system.position)
    const show = d < 34
    for (const o of this._geoLabels) {
      if (o.visible !== show) {
        o.visible = show
        if (o.element) o.element.style.display = show ? '' : 'none'
      }
    }
  }

  /**
   * 镜头贴近地球时隐藏轨道上的节气标记点：它们与地球同处一点，
   * 近景下会挡在地球前面，反而看不清地球本身。光环仍保留以指示当前节气。
   */
  _updateMarkerProximity() {
    if (!this.rig || !this.earth) return
    const d = this.camera.position.distanceTo(this.earth.system.position)
    const show = this.helpers.markers && d > 14
    if (this.rig.markerGroup.visible !== show) this.rig.markerGroup.visible = show
  }

  // -------------------------------------------------------------------------
  // 监听
  // -------------------------------------------------------------------------
  _initListeners() {
    this._onResize = () => this.resize()
    this._ro = new ResizeObserver(this._onResize)
    this._ro.observe(this.container)

    this._onVisibility = () => {
      this._docVisible = !document.hidden
      if (this._docVisible) { this._lastT = performance.now(); this._startRaf() }
    }
    document.addEventListener('visibilitychange', this._onVisibility)

    // 滚出视口时只跳过渲染，时间照常推进（省电，且回到视口时状态仍然连续）
    this._io = new IntersectionObserver((entries) => {
      this._inView = entries.some((e) => e.isIntersecting)
      if (this._inView) this._lastT = performance.now()
    }, { threshold: 0.01 })
    this._io.observe(this.container)

    // 射线拾取（区分点击与拖拽）
    this._raycaster = new THREE.Raycaster()
    this._pointer = new THREE.Vector2()
    this._down = null
    const el = this.renderer.domElement
    this._onPointerDown = (e) => { this._down = { x: e.clientX, y: e.clientY, t: performance.now() } }
    this._onPointerUp = (e) => {
      if (!this._down) return
      const dx = e.clientX - this._down.x
      const dy = e.clientY - this._down.y
      const dt = performance.now() - this._down.t
      this._down = null
      if (Math.hypot(dx, dy) > 6 || dt > 600) return   // 视为拖拽
      this._pick(e)
    }
    el.addEventListener('pointerdown', this._onPointerDown)
    el.addEventListener('pointerup', this._onPointerUp)

    // 键盘：空格播放/暂停，←→ 步进，Home 回到今天，V 切视角，H 切辅助线
    this._onKey = (e) => this._handleKey(e)
    el.tabIndex = 0
    el.setAttribute('role', 'application')
    el.addEventListener('keydown', this._onKey)
  }

  _pick(e) {
    if (!this.rig) return
    const rect = this.renderer.domElement.getBoundingClientRect()
    this._pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
    this._pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1
    this._raycaster.setFromCamera(this._pointer, this.camera)
    const hits = this._raycaster.intersectObjects(this.rig.pickables(), false)
    if (hits.length) {
      const idx = hits[0].object.userData.termIndex
      if (idx) this.onSelectTerm(idx)
    }
  }

  _handleKey(e) {
    const k = e.key
    if (k === ' ' || k === 'Spacebar') { e.preventDefault(); clock.toggle(); return }
    if (k === 'ArrowRight') { e.preventDefault(); clock.setMs(clock.nowMs + (e.shiftKey ? 86400000 : 3600000)); return }
    if (k === 'ArrowLeft') { e.preventDefault(); clock.setMs(clock.nowMs - (e.shiftKey ? 86400000 : 3600000)); return }
    if (k === 'Home') { e.preventDefault(); clock.backToToday(); return }
    if (k === 'v' || k === 'V') {
      const ids = VIEWS.map((v) => v.id)
      const cur = ids.indexOf(this.currentView || 'default')
      this.setView(ids[(cur + 1) % ids.length])
      return
    }
    if (k === 'h' || k === 'H') { this.setHelpers({ axis: !this.helpers.axis, equator: !this.helpers.equator, tropics: !this.helpers.tropics }); return }
  }

  // -------------------------------------------------------------------------
  // 主循环
  // -------------------------------------------------------------------------
  _startRaf() {
    if (this._raf || this.disposed) return
    this._lastT = performance.now()
    this._raf = requestAnimationFrame(this._loop)
  }

  _loop(t) {
    if (this.disposed) return
    this._raf = requestAnimationFrame(this._loop)
    const dtReal = Math.min(0.25, Math.max(0, (t - this._lastT) / 1000))
    this._lastT = t

    // 时间始终推进（保证回到视口时状态连续）
    clock.tick(dtReal)
    this._elapsed = (this._elapsed || 0) + dtReal

    // 文档不可见 → 完全停止；容器滚出视口 → 只跳过渲染
    if (!this._docVisible) return
    if (!this._renderEnabled || !this._inView) { clock.publish(); return }

    this._updateScene()
    this.renderer.render(this.scene, this.camera)
    this.labelRenderer.render(this.scene, this.camera)
    clock.publish()

    this._measureFps(dtReal)
  }

  _measureFps(dt) {
    if (dt <= 0 || this._autoDegraded || this._autoDegradeEnabled === false) return
    this._fpsSamples.push(dt)
    if (this._fpsSamples.length < 150) return       // 约 2.5 秒一个窗口
    const avg = this._fpsSamples.reduce((a, b) => a + b, 0) / this._fpsSamples.length
    this._fpsSamples = []
    const fps = 1 / avg
    this.lastFps = Math.round(fps)
    if (fps < 28 && this.quality !== 'low') {
      this._autoDegraded = true
      const from = this.quality
      const next = from === 'high' ? 'medium' : 'low'
      this.setQuality(next, { silent: true })
      // 降级后画质相关状态变了，需要重设像素比等
      this.onStatus({ kind: 'auto-degrade', from, to: next, fps: Math.round(fps) })
    }
  }

  _updateScene() {
    const ms = clock.nowMs
    const sunLon = sunApparentLongitude(ms)
    const spin = clock.spinAngle(earthSpinAngle(ms))

    this.sun.update(this._elapsed || 0)
    if (this.starPoints) {
      this.starPoints.material.uniforms.uTime.value = this._elapsed || 0
      // 星空点云按岁差旋转到当前历元（示意）：春分点每年沿黄道西移约 50.29″，
      // 因此"春分点指向哪片星空"会随模拟年份缓慢变化——这正是岁差的直观表现。
      // 银河底图强度很低，仍按 J2000 历元作为环境光处理。
      this.starPoints.rotation.y = precessionLongitudeDeg(new Date(ms).getUTCFullYear()) * DEG
    }

    this.earth.update(ms, sunLon, spin, ((this._elapsed || 0) * 0.0016) % 1)

    this._syncTermState(false, sunLon)
    this._updateGeoLabelVisibility()
    this._updateMarkerProximity()

    if (this.followEarth && this.earth) {
      const p = this.earth.system.position
      const delta = p.clone().sub(this._lastEarthPos || p)
      this.controls.target.add(delta)
      this.camera.position.add(delta)
      this._lastEarthPos = p.clone()
    }

    this._animateCamera()
    this.controls.update()
  }

  /** 只在节气发生变化时做一次较重的同步；每帧只更新弧段进度与连线 */
  _syncTermState(force = false, sunLon) {
    const ms = clock.nowMs
    const lon = sunLon ?? sunApparentLongitude(ms)
    const loc = locateTerm(ms, lon)
    this.currentLoc = loc
    this.currentSunLon = lon
    this.rig.update(lon, loc.current, loc.progress, this.earth.system.position)

    const key = `${loc.current.year}-${loc.current.index}`
    if (force || key !== this._termKey) {
      this._termKey = key
      this.onStatus({ kind: 'term-change', termIndex: loc.current.index, year: loc.current.year })
    }
  }

  // -------------------------------------------------------------------------
  // 对外 API
  // -------------------------------------------------------------------------
  applyHelpers() {
    if (!this.earth || !this.rig) return
    this.earth.setHelperVisible('axis', this.helpers.axis)
    this.earth.setHelperVisible('equator', this.helpers.equator)
    this.earth.setHelperVisible('tropics', this.helpers.tropics)
    this.earth.setHelperVisible('polarCircles', this.helpers.polarCircles)
    this.rig.setMarkersVisible(this.helpers.markers)
    this._updateMarkerProximity()
    this.rig.setRingVisible(this.helpers.orbit)
    this.rig.setDirectionVisible(this.helpers.direction)
    this.rig.setLabelsVisible(this.helpers.labels)
  }

  setHelpers(patch) {
    Object.assign(this.helpers, patch)
    if (patch.labels) this.preset.labelMode = patch.labels
    this.applyHelpers()
  }

  setView(id) {
    this.currentView = id
    const R = SCALE.orbitRadius
    if (id === 'earth' && this.earth) {
      this.followEarth = true
      // 用模拟时间直接算地球位置，而不是读上一帧的 earth.system.position：
      // 这样即使"改时间"和"切视角"发生在同一帧内也不会瞄错地方
      const p = earthPositionFromSunLongitude(sunApparentLongitude(clock.nowMs), SCALE.orbitRadius)
      const dir = p.clone().normalize()
      const sunDir = dir.clone().negate()          // 指向太阳（昼半球方向）
      const side = new THREE.Vector3(-dir.z, 0, dir.x).normalize()
      const up = new THREE.Vector3(0, 1, 0)
      // 从"偏向日半球一侧"观察：能同时看到受光面与晨昏线，
      // 而不是只能看到一片漆黑的夜面
      const offset = sunDir.clone().multiplyScalar(4.6)
        .addScaledVector(side, 6.4)
        .addScaledVector(up, 3.2)
      this._startCameraAnim(p.clone().add(offset), p.clone(), 900)
    } else {
      this.followEarth = false
      this._lastEarthPos = null
      if (id === 'overview') this._startCameraAnim(new THREE.Vector3(0, 138, 158), new THREE.Vector3(0, 0, 0), 900)
      else if (id === 'top') this._startCameraAnim(new THREE.Vector3(0, 196, 0.01), new THREE.Vector3(0, 0, 0), 900)
      else this._startCameraAnim(this.defaultCamera.pos.clone(), this.defaultCamera.target.clone(), 900)
    }
  }

  resetView() { this.setView('default') }

  _startCameraAnim(toPos, toTarget, ms) {
    this._camAnim = {
      t0: performance.now(), dur: ms,
      fromPos: this.camera.position.clone(), fromTarget: this.controls.target.clone(),
      toPos, toTarget,
    }
  }

  _animateCamera() {
    const a = this._camAnim
    if (!a) return
    const k = Math.min(1, (performance.now() - a.t0) / a.dur)
    const e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2  // easeInOutCubic
    this.camera.position.lerpVectors(a.fromPos, a.toPos, e)
    this.controls.target.lerpVectors(a.fromTarget, a.toTarget, e)
    if (k >= 1) {
      this._camAnim = null
      if (this.followEarth) this._lastEarthPos = this.earth.system.position.clone()
    }
  }

  /** 把镜头对准某个节气标记（点击列表项时的视觉反馈） */
  focusTerm(termIndex) {
    const def = TERM_BY_INDEX.get(termIndex)
    if (!def) return
    const p = earthPositionFromSunLongitude(def.longitude, SCALE.orbitRadius)
    const dir = p.clone().normalize()
    const offset = dir.clone().multiplyScalar(SCALE.orbitRadius * 0.62).add(new THREE.Vector3(0, SCALE.orbitRadius * 0.42, 0))
    this.followEarth = false
    this._lastEarthPos = null
    this.currentView = 'custom'
    this._startCameraAnim(offset, new THREE.Vector3(0, 0, 0), 800)
  }

  /** 关闭/开启"帧率低时自动降画质"。验收脚本会关闭它以保证截图画质稳定。 */
  setAutoDegrade(v) { this._autoDegradeEnabled = !!v }

  setQuality(q, { silent = false } = {}) {
    if (!QUALITY_PRESETS[q] || q === this.quality) return
    this.quality = q
    this.preset = QUALITY_PRESETS[q]
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, this.preset.pixelRatioCap))
    if (this.sun) this.sun.setGlow(this.preset.glow)
    if (this.starPoints) this.starPoints.material.uniforms.uSizeScale.value = q === 'low' ? 1.5 : 2.1
    // 标签密度随画质调整，避免小屏拥挤
    this.helpers.labels = this.preset.labelMode === 'major' ? 'major' : this.helpers.labels
    this.applyHelpers()
    if (!silent) this.onStatus({ kind: 'quality', quality: q })
  }

  setRenderEnabled(v) { this._renderEnabled = v }

  resize() {
    if (!this.renderer || this.disposed) return
    const w = this.container.clientWidth
    const h = this.container.clientHeight
    if (!w || !h) return
    this.camera.aspect = w / h
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(w, h)
    this.labelRenderer.setSize(w, h)
    if (this.starPoints) this.starPoints.material.uniforms.uPixelRatio.value = Math.min(window.devicePixelRatio || 1, 2)
  }

  /** 截图（供"保存当前画面"按钮使用） */
  snapshot() {
    this._updateScene()
    this.renderer.render(this.scene, this.camera)
    return this.renderer.domElement.toDataURL('image/png')
  }

  dispose() {
    if (this.disposed) return
    this.disposed = true
    if (this._raf) cancelAnimationFrame(this._raf)
    this._raf = null

    document.removeEventListener('visibilitychange', this._onVisibility)
    this._ro?.disconnect()
    this._io?.disconnect()
    const el = this.renderer?.domElement
    if (el) {
      el.removeEventListener('pointerdown', this._onPointerDown)
      el.removeEventListener('pointerup', this._onPointerUp)
      el.removeEventListener('keydown', this._onKey)
    }

    this.controls?.dispose()
    this.earth?.dispose()
    this.sun?.dispose()
    this.rig?.dispose()

    if (this.starPoints) {
      this.starPoints.geometry.dispose()
      this.starPoints.material.dispose()
      this.starDotTex?.dispose()
    }

    // 兜底：遍历场景释放剩余资源
    this.scene?.traverse((o) => {
      if (o.geometry) o.geometry.dispose?.()
      const m = o.material
      if (Array.isArray(m)) m.forEach((x) => x?.dispose?.())
      else m?.dispose?.()
      if (o.element?.parentNode) o.element.parentNode.removeChild(o.element)
    })

    this.textures?.dispose()
    if (this.labelRenderer?.domElement?.parentNode) this.labelRenderer.domElement.parentNode.removeChild(this.labelRenderer.domElement)
    if (this.renderer) {
      this.renderer.dispose()
      this.renderer.forceContextLoss?.()
      if (this.renderer.domElement.parentNode) this.renderer.domElement.parentNode.removeChild(this.renderer.domElement)
    }
    this.scene = null
  }
}
