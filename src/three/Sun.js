/**
 * Sun.js — 太阳：自发光表面 + 双层光晕 + 点光源
 *
 * 光照一致性：点光源与太阳网格同在场景原点，地球的着色器另外直接接收
 * "从地球指向太阳"的单位向量（orbitMath.sunDirectionFromEarth），
 * 两者同源，因此**光晕、光源方向与地球受光面永远一致**。
 */

import * as THREE from 'three'
import { SCALE } from './orbitMath.js'
import { SUN_VERT, SUN_FRAG } from './shaders.js'
import { makeGlowTexture } from './proceduralTextures.js'

export class Sun {
  /**
   * @param {object} opts
   * @param {import('./TextureManager.js').TextureManager} opts.textures
   * @param {'low'|'medium'|'high'} opts.quality
   */
  constructor({ textures, quality = 'medium' }) {
    this.quality = quality
    this.disposables = []

    this.group = new THREE.Object3D()
    this.group.name = 'sun'

    const seg = quality === 'low' ? 48 : quality === 'medium' ? 64 : 96
    const sunTex = textures.get('sun')

    this.geometry = new THREE.SphereGeometry(SCALE.sunRadius, seg, seg / 2)
    this.material = new THREE.ShaderMaterial({
      vertexShader: SUN_VERT,
      fragmentShader: SUN_FRAG,
      uniforms: {
        uMap: { value: sunTex || null },
        uTime: { value: 0 },
        // 亮度刻意压低：过曝会让光球纹理与临边昏暗全部变成一片白
        uColorCore: { value: new THREE.Color(0xffd98a) },
        uColorEdge: { value: new THREE.Color(0xff8a2a) },
        uBrightness: { value: 0.92 },
      },
    })
    this.disposables.push(this.geometry, this.material)
    this.mesh = new THREE.Mesh(this.geometry, this.material)
    // 若纹理缺失，退化为纯色自发光球
    if (!sunTex) {
      this.material.fragmentShader = SUN_FRAG.replace(
        'float g = texture2D(uMap, uv1).r * 0.62 + texture2D(uMap, uv2).r * 0.38;',
        'float g = 0.5 + 0.22 * sin(uv1.x * 42.0 + uTime * 0.4) * cos(uv2.y * 31.0 - uTime * 0.3);',
      )
      this.material.needsUpdate = true
    }
    this.group.add(this.mesh)

    // --- 光晕（两层：内层紧贴光球，外层大范围柔光） ---
    const glowTex = makeGlowTexture()
    this.disposables.push(glowTex)

    const mk = (scale, opacity, color) => {
      const m = new THREE.SpriteMaterial({
        map: glowTex, color, transparent: true, opacity,
        // depthTest 保持开启：地球运行到太阳与相机之间时，光晕会被正确遮挡
        blending: THREE.AdditiveBlending, depthWrite: false, depthTest: true,
      })
      this.disposables.push(m)
      const s = new THREE.Sprite(m)
      s.scale.set(scale, scale, 1)
      s.renderOrder = -1
      return s
    }
    this.glowInner = mk(SCALE.sunRadius * 5.4, quality === 'low' ? 0.55 : 0.80, new THREE.Color(0xffd79a))
    this.glowOuter = mk(SCALE.sunRadius * 14.0, quality === 'low' ? 0.20 : 0.34, new THREE.Color(0xff9a3c))
    this.group.add(this.glowInner, this.glowOuter)

    // --- 点光源 ---
    // 衰减设为 0（不随距离衰减），保证地球在任何位置都得到稳定照度；
    // 场景中只有一个光源，因此"光照方向 == 日地方向"始终成立。
    this.light = new THREE.PointLight(0xfff2dd, 2.6, 0, 0)
    this.light.position.set(0, 0, 0)
    this.group.add(this.light)

    // 极弱的环境光：让地球夜面与辅助线不至于全黑，但绝不冲淡昼夜界线
    this.ambient = new THREE.AmbientLight(0x2a3550, 0.28)
    this.group.add(this.ambient)
  }

  update(elapsedSec) {
    this.material.uniforms.uTime.value = elapsedSec
    // 太阳自转（约 25.4 天一圈，赤道），仅作视觉细节
    this.mesh.rotation.y = elapsedSec * 0.012
    const pulse = 1 + Math.sin(elapsedSec * 0.7) * 0.015
    this.glowInner.scale.setScalar(SCALE.sunRadius * 5.4 * pulse)
  }

  setGlow(v) {
    this.glowInner.material.opacity = 0.80 * v
    this.glowOuter.material.opacity = 0.34 * v
  }

  dispose() {
    for (const d of this.disposables) d.dispose?.()
    this.disposables.length = 0
  }
}
