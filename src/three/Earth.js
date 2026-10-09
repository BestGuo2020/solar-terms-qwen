/**
 * Earth.js — 地球及其附属标识
 *
 * ── 为什么是这个层级结构（关键）──────────────────────────────
 *   scene
 *     └─ earthSystem      只负责"公转位置"，**自身绝不旋转**
 *          └─ tiltGroup   只负责"地轴倾角"，四元数在整个模拟期间保持不变
 *               ├─ earthMesh     自转（rotation.y = 自转角）
 *               ├─ cloudMesh     自转 + 缓慢漂移
 *               ├─ atmosphere    大气外壳（不随自转）
 *               └─ helpers       地轴 / 赤道 / 南北回归线
 *
 *   如果把倾角直接加在 earthSystem 上，earthSystem 一旦随公转旋转，
 *   地轴就会跟着转，出现"北极永远朝向太阳"的经典错误。
 *   这里 earthSystem 只 setPosition、不设 rotation，
 *   所以 tiltGroup 的局部朝向 == 世界朝向 == 恒定不变。
 *   scripts/verify-scene.mjs 已对这一点做了几何与受光验证。
 */

import * as THREE from 'three'
import {
  SCALE, DEG, axisQuaternion, earthPositionFromSunLongitude,
  sunDirectionFromEarth, geoToSphereLocal,
} from './orbitMath.js'
import { EARTH_VERT, EARTH_FRAG, CLOUD_FRAG, ATMO_VERT, ATMO_FRAG } from './shaders.js'

/** 生成一条纬度圈的点集（地球局部坐标） */
function latitudeCircle(latDeg, radius, segments = 160) {
  const pts = []
  const r = radius * Math.cos(latDeg * DEG)
  const y = radius * Math.sin(latDeg * DEG)
  for (let i = 0; i <= segments; i++) {
    const a = (i / segments) * Math.PI * 2
    pts.push(new THREE.Vector3(r * Math.cos(a), y, r * Math.sin(a)))
  }
  return pts
}

export class Earth {
  /**
   * @param {object} opts
   * @param {import('./TextureManager.js').TextureManager} opts.textures
   * @param {number} opts.tiltDeg   黄赤交角
   * @param {'low'|'medium'|'high'} opts.quality
   * @param {Function} opts.makeLabel  (text, className) => HTMLElement，用于 CSS2D 标签
   */
  constructor({ textures, tiltDeg, quality = 'medium', makeLabel }) {
    this.tiltDeg = tiltDeg
    this.quality = quality
    this.disposables = []
    this._makeLabel = makeLabel || (() => null)

    const seg = quality === 'high' ? [128, 64] : quality === 'medium' ? [96, 48] : [64, 32]

    // --- 层级 ---
    this.system = new THREE.Object3D()
    this.system.name = 'earthSystem'
    this.tiltGroup = new THREE.Object3D()
    this.tiltGroup.name = 'tiltGroup'
    this.tiltGroup.quaternion.copy(axisQuaternion(tiltDeg))   // 常量，之后不再改变
    this.system.add(this.tiltGroup)

    const dayTex = textures.getEarthDay()
    const nightTex = textures.get('earthNight')
    const specTex = textures.get('earthSpec')
    const cloudTex = textures.get('earthClouds')

    // --- 地球本体 ---
    this.geometry = new THREE.SphereGeometry(SCALE.earthRadius, seg[0], seg[1])
    this.disposables.push(this.geometry)

    this.material = new THREE.ShaderMaterial({
      vertexShader: EARTH_VERT,
      fragmentShader: EARTH_FRAG,
      uniforms: {
        uDay: { value: dayTex },
        uNight: { value: nightTex || dayTex },
        uSpec: { value: specTex || dayTex },
        uSunDirW: { value: new THREE.Vector3(1, 0, 0) },
        uNightGain: { value: quality === 'low' ? 1.6 : 2.1 },
        uHasNight: { value: nightTex ? 1 : 0 },
        uHasSpec: { value: specTex ? 1 : 0 },
        uOceanSpec: { value: 0.9 },
      },
    })
    this.disposables.push(this.material)
    this.mesh = new THREE.Mesh(this.geometry, this.material)
    this.mesh.name = 'earth'
    this.tiltGroup.add(this.mesh)

    // --- 云层 ---
    this.cloudsEnabled = !!cloudTex && quality !== 'low'
    if (this.cloudsEnabled) {
      this.cloudGeometry = new THREE.SphereGeometry(SCALE.cloudRadius, seg[0], seg[1])
      this.cloudMaterial = new THREE.ShaderMaterial({
        vertexShader: EARTH_VERT,
        fragmentShader: CLOUD_FRAG,
        transparent: true,
        depthWrite: false,
        uniforms: {
          uCloud: { value: cloudTex },
          uCloudShift: { value: new THREE.Vector2(0, 0) },
          uSunDirW: { value: new THREE.Vector3(1, 0, 0) },
          uOpacity: { value: 0.82 },
        },
      })
      this.disposables.push(this.cloudGeometry, this.cloudMaterial)
      this.cloudMesh = new THREE.Mesh(this.cloudGeometry, this.cloudMaterial)
      this.cloudMesh.renderOrder = 2
      this.tiltGroup.add(this.cloudMesh)
    }

    // --- 大气外壳 ---
    this.atmoGeometry = new THREE.SphereGeometry(SCALE.atmosphereRadius, 48, 32)
    this.atmoMaterial = new THREE.ShaderMaterial({
      vertexShader: ATMO_VERT,
      fragmentShader: ATMO_FRAG,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false,
      uniforms: {
        uSunDirW: { value: new THREE.Vector3(1, 0, 0) },
        uColor: { value: new THREE.Color(0x4d8fd6) },
        uIntensity: { value: quality === 'low' ? 0.7 : 1.0 },
        uPower: { value: 3.1 },
        uBias: { value: 0.70 },
      },
    })
    this.disposables.push(this.atmoGeometry, this.atmoMaterial)
    this.atmosphere = new THREE.Mesh(this.atmoGeometry, this.atmoMaterial)
    this.atmosphere.renderOrder = 3
    this.tiltGroup.add(this.atmosphere)

    // --- 辅助标识 ---
    this.helpers = new THREE.Object3D()
    this.helpers.name = 'earthHelpers'
    this.tiltGroup.add(this.helpers)
    this._buildHelpers()
  }

  _buildHelpers() {
    const R = SCALE.earthRadius
    const eps = this.tiltDeg

    // 地轴：穿过南北极并向两端延长
    const axisGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, -R * 2.15, 0), new THREE.Vector3(0, R * 2.15, 0),
    ])
    const axisMat = new THREE.LineDashedMaterial({ color: 0xffd27a, dashSize: R * 0.14, gapSize: R * 0.09, transparent: true, opacity: 0.95 })
    this.disposables.push(axisGeo, axisMat)
    this.axisLine = new THREE.Line(axisGeo, axisMat)
    this.axisLine.computeLineDistances()
    this.helpers.add(this.axisLine)

    // 北极锥头 + 南极锥头
    const coneGeo = new THREE.ConeGeometry(R * 0.11, R * 0.3, 12)
    const coneMat = new THREE.MeshBasicMaterial({ color: 0xffd27a })
    this.disposables.push(coneGeo, coneMat)
    const north = new THREE.Mesh(coneGeo, coneMat)
    north.position.set(0, R * 2.15, 0)
    const south = new THREE.Mesh(coneGeo, coneMat)
    south.position.set(0, -R * 2.15, 0)
    south.rotation.x = Math.PI
    this.helpers.add(north, south)

    // 赤道 / 回归线 / 极圈：文字标签交给 SceneManager 按当前语言填充
    this.equator = this._circle(0, 0x6fe3c4, 'geo.equator')
    this.tropicN = this._circle(eps, 0xf0a35e, 'geo.tropicN')
    this.tropicS = this._circle(-eps, 0xf0a35e, 'geo.tropicS')
    this.arcticN = this._circle(90 - eps, 0x9fc4ef, 'geo.arcticN', 0.45)
    this.arcticS = this._circle(-(90 - eps), 0x9fc4ef, 'geo.arcticS', 0.45)

    this.groups = {
      axis: [this.axisLine, north, south],
      equator: [this.equator.group],
      tropics: [this.tropicN.group, this.tropicS.group],
      polarCircles: [this.arcticN.group, this.arcticS.group],
    }
  }

  _circle(latDeg, color, geoKey, opacity = 0.9) {
    const pts = latitudeCircle(latDeg, SCALE.earthRadius * 1.004)
    const geo = new THREE.BufferGeometry().setFromPoints(pts)
    const mat = new THREE.LineBasicMaterial({ color, transparent: true, opacity })
    this.disposables.push(geo, mat)
    const line = new THREE.LineLoop(geo, mat)
    const group = new THREE.Object3D()
    group.add(line)
    if (geoKey) {
      const el = this._makeLabel(geoKey, 'marker marker--geo')
      if (el) {
        el.userData.geoKey = geoKey
        // 标签挂在该纬线圈朝向 +X 的一点上
        const anchor = geoToSphereLocal(latDeg, 0).multiplyScalar(SCALE.earthRadius * 1.02)
        el.position?.set?.(anchor.x, anchor.y, anchor.z)
        group.add(el)
      }
    }
    this.helpers.add(group)
    return { group, line }
  }

  setHelperVisible(key, visible) {
    const list = this.groups[key]
    if (list) for (const o of list) o.visible = visible
  }

  /**
   * 每帧更新。
   * @param {number} ms        模拟时间（UTC 毫秒）
   * @param {number} sunLon    太阳地心视黄经（度）
   * @param {number} spinAngle 自转角（弧度）
   * @param {number} cloudDrift 云层相对地面的漂移量（圈，0..1）
   */
  update(ms, sunLon, spinAngle, cloudDrift = 0) {
    // 公转位置：只平移，不旋转
    this.system.position.copy(earthPositionFromSunLongitude(sunLon, SCALE.orbitRadius))

    // 自转：地球与云
    this.mesh.rotation.y = spinAngle
    if (this.cloudMesh) {
      this.cloudMesh.rotation.y = spinAngle * 0.985
      this.cloudMaterial.uniforms.uCloudShift.value.x = cloudDrift
    }

    // 光照方向（世界坐标，从地球指向太阳）
    const sunDir = sunDirectionFromEarth(sunLon)
    this.material.uniforms.uSunDirW.value.copy(sunDir)
    if (this.cloudMaterial) this.cloudMaterial.uniforms.uSunDirW.value.copy(sunDir)
    this.atmoMaterial.uniforms.uSunDirW.value.copy(sunDir)

    // tiltGroup 的四元数保持不变 —— 地轴在空间中指向恒定
    return sunDir
  }

  setNightGain(v) { this.material.uniforms.uNightGain.value = v }
  setCloudOpacity(v) { if (this.cloudMaterial) this.cloudMaterial.uniforms.uOpacity.value = v }

  dispose() {
    for (const d of this.disposables) d.dispose?.()
    this.disposables.length = 0
  }
}
