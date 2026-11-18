/**
 * OrbitRig.js — 公转轨道、24 节气标记、当前节气高亮弧段、方向与基准标识
 *
 * ── 角度换算（务必与 orbitMath.js 保持一致）────────────────────
 *   RingGeometry 的 θ 经过 rotation.x = −90° 后，
 *   点 (r·cosθ, r·sinθ, 0) 落到场景的 (r·cosθ, 0, −r·sinθ)，
 *   这恰好就是 eclipticToScene(θ, r)。
 *   所以 **RingGeometry 的 θ == 场景方位角 == 地球日心黄经 L⊕ == λ☉ + 180°**。
 *
 *   某个节气（太阳黄经 λ）对应的轨道弧段：
 *     thetaStart  = (λ + 180°)
 *     thetaLength = 15°（沿黄经增大方向，也就是公转方向）
 *   scripts/verify-scene.mjs 已验证 eclipticToScene 与该约定一致、
 *   且节气标记位置与交节时地球位置逐点重合。
 */

import * as THREE from 'three'
import { SCALE, DEG, eclipticToScene, termMarkerPosition, orbitTangent, norm360 } from './orbitMath.js'
import { TERM_TABLE, SEASON_COLOR } from '../data/termTable.js'

export class OrbitRig {
  /**
   * @param {object} opts
   * @param {Function} opts.makeMarkerLabel (termDef, isMajor) => HTMLElement
   */
  constructor({ makeMarkerLabel }) {
    this.disposables = []
    this.group = new THREE.Object3D()
    this.group.name = 'orbitRig'
    this._makeMarkerLabel = makeMarkerLabel

    this._buildOrbitRing()
    this._buildHighlightArc()
    this._buildTermMarkers()
    this._buildReferenceMarks()
    this._buildDirectionArrow()
    this._buildSunEarthLine()
    this._buildCurrentHalo()
  }

  /**
   * "当前节气"的高亮：在地球脚下画两圈金色光环（位于黄道面内）。
   * 之所以不用放大标记点来表示"当前"，是因为标记点与地球同处轨道上，
   * 放大后会挡住甚至吞掉地球本身。
   */
  _buildCurrentHalo() {
    this.haloGroup = new THREE.Object3D()
    this.haloGroup.name = 'currentHalo'
    this.group.add(this.haloGroup)
    this.halos = []
    for (const [radius, opacity] of [[3.1, 0.95], [4.3, 0.45]]) {
      const pts = []
      for (let i = 0; i <= 72; i++) {
        const a = (i / 72) * Math.PI * 2
        pts.push(new THREE.Vector3(Math.cos(a) * radius, 0, Math.sin(a) * radius))
      }
      const geo = new THREE.BufferGeometry().setFromPoints(pts)
      const mat = new THREE.LineBasicMaterial({
        color: 0xffd27a, transparent: true, opacity,
        blending: THREE.AdditiveBlending, depthWrite: false,
      })
      this.disposables.push(geo, mat)
      const line = new THREE.LineLoop(geo, mat)
      this.haloGroup.add(line)
      this.halos.push(line)
    }
  }

  // --- 轨道本体 -----------------------------------------------------------
  _buildOrbitRing() {
    const R = SCALE.orbitRadius
    const geo = new THREE.RingGeometry(R - 0.055, R + 0.055, 512, 1)
    const mat = new THREE.MeshBasicMaterial({
      color: 0x6d7f9c, transparent: true, opacity: 0.5,
      side: THREE.DoubleSide, depthWrite: false,
    })
    this.disposables.push(geo, mat)
    this.ring = new THREE.Mesh(geo, mat)
    this.ring.rotation.x = -Math.PI / 2
    this.ring.renderOrder = -2
    this.group.add(this.ring)

    // 轨道外侧一圈更淡的宽晕，让轨道在深色背景里更容易看清
    const haloGeo = new THREE.RingGeometry(R - 0.85, R + 0.85, 256, 1)
    const haloMat = new THREE.MeshBasicMaterial({
      color: 0x3d5f8a, transparent: true, opacity: 0.11,
      side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending,
    })
    this.disposables.push(haloGeo, haloMat)
    const halo = new THREE.Mesh(haloGeo, haloMat)
    halo.rotation.x = -Math.PI / 2
    halo.renderOrder = -3
    this.group.add(halo)
  }

  // --- 当前节气所在的轨道弧段 ---------------------------------------------
  _buildHighlightArc() {
    const R = SCALE.orbitRadius
    this.arcGeo = new THREE.RingGeometry(R - 0.30, R + 0.30, 96, 1, 0, 15 * DEG)
    this.arcMat = new THREE.MeshBasicMaterial({
      color: 0xffcf6b, transparent: true, opacity: 0.85,
      side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending,
    })
    this.disposables.push(this.arcGeo, this.arcMat)
    this.highlightArc = new THREE.Mesh(this.arcGeo, this.arcMat)
    this.highlightArc.rotation.x = -Math.PI / 2
    this.highlightArc.renderOrder = -1
    this.group.add(this.highlightArc)

    // 弧段进度：从当前节气起点到地球当前位置
    this.progressGeo = new THREE.RingGeometry(R - 0.30, R + 0.30, 96, 1, 0, 1 * DEG)
    this.progressMat = new THREE.MeshBasicMaterial({
      color: 0xfff0c2, transparent: true, opacity: 0.95,
      side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending,
    })
    this.disposables.push(this.progressGeo, this.progressMat)
    this.progressArc = new THREE.Mesh(this.progressGeo, this.progressMat)
    this.progressArc.rotation.x = -Math.PI / 2
    this.progressArc.renderOrder = 0
    this.group.add(this.progressArc)
  }

  // --- 24 个节气标记 ------------------------------------------------------
  _buildTermMarkers() {
    const R = SCALE.orbitRadius
    this.markerGroup = new THREE.Object3D()
    this.markerGroup.name = 'termMarkers'
    this.group.add(this.markerGroup)
    this.markers = []

    const dotGeoMajor = new THREE.OctahedronGeometry(0.62, 0)
    const dotGeoMinor = new THREE.SphereGeometry(0.34, 12, 8)
    this.disposables.push(dotGeoMajor, dotGeoMinor)

    TERM_TABLE.forEach((def, i) => {
      const color = new THREE.Color(SEASON_COLOR[def.season])
      const pos = termMarkerPosition(def.longitude, R)
      // 场景方位角（== 地球日心黄经 == λ☉ + 180°）
      const azimuth = norm360(def.longitude + 180)

      // 径向刻度线：直接按世界坐标生成，避免朝向混淆
      const inner = termMarkerPosition(def.longitude, R * (def.major ? 0.948 : 0.982))
      const outer = termMarkerPosition(def.longitude, R * (def.major ? 1.052 : 1.018))
      const tGeo = new THREE.BufferGeometry().setFromPoints([inner, outer])
      const tMat = new THREE.LineBasicMaterial({
        color: def.major ? 0xffe9b0 : color,
        transparent: true, opacity: def.major ? 1.0 : 0.6,
      })
      this.disposables.push(tGeo, tMat)
      const tickLine = new THREE.Line(tGeo, tMat)
      this.markerGroup.add(tickLine)

      // 标记点（可射线拾取）
      const dotMat = new THREE.MeshBasicMaterial({
        color: def.major ? 0xfff2cf : color, transparent: true, opacity: def.major ? 1 : 0.9,
      })
      this.disposables.push(dotMat)
      const dot = new THREE.Mesh(def.major ? dotGeoMajor : dotGeoMinor, dotMat)
      dot.position.copy(pos)
      dot.userData.termIndex = def.index
      dot.userData.pickable = true
      this.markerGroup.add(dot)

      // 文字标签（DOM，可点击、可键盘聚焦）。
      // 二分二至放在最外圈（标签更宽、带副标题），其余交替两圈，减少重叠。
      let labelObj = null
      if (this._makeMarkerLabel) {
        const el = this._makeMarkerLabel(def)
        if (el) {
          labelObj = el
          const ring = def.major ? 1.315 : (i % 2 === 0 ? 1.09 : 1.195)
          labelObj.position.copy(termMarkerPosition(def.longitude, R * ring))
          this.markerGroup.add(labelObj)
        }
      }

      this.markers.push({ def, dot, dotMat, tickLine, tMat, labelObj, azimuth, active: false })
    })
  }

  // --- 基准标识：春分点、四季方位 -----------------------------------------
  _buildReferenceMarks() {
    const R = SCALE.orbitRadius
    this.refGroup = new THREE.Object3D()
    this.group.add(this.refGroup)

    // 春分点 ♈ 方向（+X）。注意：地球在秋分时正位于春分点方向，
    // 所以这个基准标识放在轨道**内侧**，避免与秋分标签重叠。
    const p = eclipticToScene(0, R * 0.86)
    const geo = new THREE.BufferGeometry().setFromPoints([
      eclipticToScene(0, R * 0.985), eclipticToScene(0, R * 0.90),
    ])
    const mat = new THREE.LineDashedMaterial({ color: 0x9fd8ff, dashSize: 0.9, gapSize: 0.6, transparent: true, opacity: 0.85 })
    this.disposables.push(geo, mat)
    const line = new THREE.Line(geo, mat)
    line.computeLineDistances()
    this.refGroup.add(line)

    if (this._makeMarkerLabel) {
      const el = this._makeMarkerLabel({ isReference: true, refKey: 'vernal', index: null })
      if (el) { el.position.copy(p); this.refGroup.add(el) }
    }
  }

  // --- 公转方向箭头 -------------------------------------------------------
  _buildDirectionArrow() {
    const R = SCALE.orbitRadius
    this.arrowGroup = new THREE.Object3D()
    this.group.add(this.arrowGroup)
    this._arrowAzimuthLon = 120 // 箭头画在太阳黄经 120°（大暑）附近
    this._buildArrowAt(this._arrowAzimuthLon)
  }

  _buildArrowAt(sunLon) {
    for (const c of [...this.arrowGroup.children]) {
      this.arrowGroup.remove(c)
    }
    const R = SCALE.orbitRadius
    // 放在比所有标签更外的一圈，避免与节气标签重叠
    const pos = eclipticToScene(sunLon + 180, R * 1.42)
    const tan = orbitTangent(sunLon)
    const geo = new THREE.ConeGeometry(1.0, 3.2, 14)
    const mat = new THREE.MeshBasicMaterial({ color: 0x8fe3c0, transparent: true, opacity: 0.9 })
    this.disposables.push(geo, mat)
    const cone = new THREE.Mesh(geo, mat)
    cone.position.copy(pos)
    // ConeGeometry 默认朝 +Y，转到切线方向
    cone.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), tan)
    this.arrowGroup.add(cone)

    if (this._makeMarkerLabel) {
      const el = this._makeMarkerLabel({ isReference: true, refKey: 'dir', index: null })
      if (el) {
        // 文字放在比所有节气标签更外的一圈，避免与它们重叠
        el.position.copy(eclipticToScene(sunLon + 180, R * 1.56))
        this.arrowGroup.add(el)
      }
    }
  }

  setDirectionArrowSunLon(lon) {
    if (Math.abs(norm360(lon - this._arrowAzimuthLon)) < 40) return
    this._arrowAzimuthLon = lon
    this._buildArrowAt(lon)
  }

  // --- 日地连线 -----------------------------------------------------------
  _buildSunEarthLine() {
    const geo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()])
    const mat = new THREE.LineDashedMaterial({
      color: 0xffd27a, dashSize: 1.5, gapSize: 1.2, transparent: true, opacity: 0.42,
    })
    this.disposables.push(geo, mat)
    this.sunEarthLine = new THREE.Line(geo, mat)
    this.sunEarthLine.computeLineDistances()
    this.group.add(this.sunEarthLine)
  }

  // --- 每帧更新 -----------------------------------------------------------
  /**
   * @param {number} sunLon       太阳地心视黄经
   * @param {object} currentTerm  当前已进入的节气（含 longitude）
   * @param {number} progress     本节气区间内的进度 0..1
   * @param {THREE.Vector3} earthPos
   */
  update(sunLon, currentTerm, progress, earthPos) {
    if (currentTerm) {
      const startAz = norm360(currentTerm.longitude + 180) * DEG
      this.highlightArc.rotation.z = startAz
      const sweep = Math.max(0.0001, norm360(sunLon - currentTerm.longitude)) * DEG
      this._setArcSweep(this.progressArc, startAz, Math.min(sweep, 15 * DEG))
    }

    // 日地连线
    const pa = this.sunEarthLine.geometry.attributes.position
    pa.setXYZ(0, 0, 0, 0)
    pa.setXYZ(1, earthPos.x, earthPos.y, earthPos.z)
    pa.needsUpdate = true
    this.sunEarthLine.computeLineDistances()

    // 高亮当前节气的标记（只轻微放大，避免遮挡地球）
    for (const m of this.markers) {
      const on = currentTerm && m.def.index === currentTerm.index
      if (on !== m.active) {
        m.active = on
        m.dotMat.opacity = on ? 1 : (m.def.major ? 1 : 0.9)
        m.dot.scale.setScalar(on ? 1.35 : 1)
        if (m.labelObj?.element?.classList) m.labelObj.element.classList.toggle('is-active', !!on)
      }
    }

    // 当前节气光环跟随地球
    this.haloGroup.position.copy(earthPos)
    const pulse = 1 + Math.sin(performance.now() * 0.0022) * 0.05
    this.haloGroup.scale.setScalar(pulse)

    // 方向箭头跟着地球走，避免被地球挡住；+157° 落在两个节气标记之间
    this.setDirectionArrowSunLon(norm360(sunLon + 157))
  }

  /**
   * 重设进度弧段扫过的角度。
   * RingGeometry 的 thetaLength 无法原地修改，只能重建；这里做了节流
   * （变化 < 0.12° 不重建），且顶点数随扫过角度动态取，代价可忽略。
   */
  _setArcSweep(mesh, startAz, sweepRad) {
    if (Math.abs((mesh.userData.sweep ?? -1) - sweepRad) < 0.002) {
      mesh.rotation.z = startAz
      return
    }
    mesh.userData.sweep = sweepRad
    const R = SCALE.orbitRadius
    const segments = Math.max(4, Math.ceil(sweepRad / (0.4 * DEG)))
    const next = new THREE.RingGeometry(R - 0.30, R + 0.30, segments, 1, 0, sweepRad)
    const prev = mesh.geometry
    mesh.geometry = next
    mesh.rotation.z = startAz
    const i = this.disposables.indexOf(prev)
    if (i >= 0) this.disposables.splice(i, 1)
    prev.dispose()
    this.disposables.push(next)
  }

  setLabelsVisible(mode) {
    // mode: 'all' | 'major' | 'none'
    for (const m of this.markers) {
      if (!m.labelObj) continue
      const show = mode === 'all' || (mode === 'major' && m.def.major)
      m.labelObj.visible = show
      if (m.labelObj.element) m.labelObj.element.style.display = show ? '' : 'none'
    }
    if (this.refGroup) {
      const show = mode !== 'none'
      this.refGroup.visible = show
    }
  }

  setMarkersVisible(v) { this.markerGroup.visible = v }
  setRingVisible(v) { this.ring.visible = v }
  setDirectionVisible(v) { this.arrowGroup.visible = v }

  /** 供射线拾取：返回所有可点击的标记网格 */
  pickables() { return this.markers.map((m) => m.dot) }

  dispose() {
    for (const d of this.disposables) d.dispose?.()
    this.disposables.length = 0
  }
}
