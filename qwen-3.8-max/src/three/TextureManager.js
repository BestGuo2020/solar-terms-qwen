/**
 * TextureManager.js — 纹理加载、加载状态与失败回退
 *
 * 需求：纹理要注明来源与许可，要有加载状态，资源失败后要有替代效果。
 *
 * 做法：
 *  · 所有纹理都已由 `npm run fetch:textures` 预先下载到 public/textures/，
 *    运行时不依赖任何第三方 CDN（来源与许可见 public/textures/CREDITS.json）。
 *  · 每张纹理带一个"回退生成器"（proceduralTextures.js）。加载失败时自动改用
 *    程序化纹理，并把名字记入 failures，由 UI 明确提示"当前为替代纹理"。
 *  · 通过 onProgress 汇报 0..1 的加载进度，UI 显示加载条。
 *  · 高画质档会在 WebGL MAX_TEXTURE_SIZE 允许时才加载 8k 底图，否则退回 2k。
 */

import * as THREE from 'three'
import {
  makeFallbackEarthDay, makeFallbackEarthNight, makeFallbackClouds, makeFallbackSun,
} from './proceduralTextures.js'

const BASE = './textures/'

/** 纹理清单：url 为相对 public/ 的路径，fallback 为程序化替代生成器 */
export const TEXTURE_SPECS = {
  earthDay: { file: 'earth_day.jpg', colorSpace: THREE.SRGBColorSpace, fallback: () => makeFallbackEarthDay(1024), label: '地球白昼海陆底图' },
  earthDayHi: { file: 'earth_day_4k.jpg', colorSpace: THREE.SRGBColorSpace, fallback: null, optional: true, label: '地球白昼底图（高清）' },
  earthNight: { file: 'earth_night.jpg', colorSpace: THREE.SRGBColorSpace, fallback: () => makeFallbackEarthNight(1024), label: '地球夜面灯光' },
  earthClouds: { file: 'earth_clouds.jpg', colorSpace: THREE.SRGBColorSpace, fallback: () => makeFallbackClouds(1024), label: '地球云层' },
  earthSpec: { file: 'earth_specular.jpg', colorSpace: THREE.NoColorSpace, fallback: null, optional: true, label: '海面高光掩膜' },
  sun: { file: 'sun.jpg', colorSpace: THREE.SRGBColorSpace, fallback: () => makeFallbackSun(1024), label: '太阳光球' },
  stars: { file: 'stars_milkyway.jpg', colorSpace: THREE.SRGBColorSpace, fallback: null, optional: true, label: '银河星空背景' },
}

export class TextureManager {
  constructor() {
    this.loader = new THREE.TextureLoader()
    this.loader.setPath(BASE)
    this.map = new Map()        // key -> Texture | null
    this.failures = []          // 加载失败并已回退的纹理 label
    this.missing = []           // 可选纹理缺失（无回退，功能降级）
    this._all = []
    this._onProgress = null
    this._maxSize = 4096
  }

  setMaxTextureSize(n) { this._maxSize = n }
  onProgress(fn) { this._onProgress = fn }

  _report() {
    if (!this._onProgress) return
    const total = this._all.length || 1
    const done = [...this.map.values()].filter((v) => v !== undefined).length
    this._onProgress(Math.min(1, done / total), done, total)
  }

  async _loadOne(key, spec) {
    this.map.set(key, undefined)
    try {
      const tex = await this.loader.loadAsync(spec.file)
      tex.colorSpace = spec.colorSpace || THREE.NoColorSpace
      tex.wrapS = THREE.RepeatWrapping
      tex.wrapT = THREE.ClampToEdgeWrapping
      tex.anisotropy = this._aniso || 4
      tex.generateMipmaps = true
      tex.minFilter = THREE.LinearMipmapLinearFilter
      tex.magFilter = THREE.LinearFilter
      this.map.set(key, tex)
      this._report()
      return tex
    } catch (err) {
      if (spec.fallback) {
        const tex = spec.fallback()
        tex.colorSpace = spec.colorSpace || THREE.NoColorSpace
        tex.wrapS = THREE.RepeatWrapping
        tex.wrapT = THREE.ClampToEdgeWrapping
        tex.anisotropy = this._aniso || 4
        tex.userData.procedural = true
        this.map.set(key, tex)
        this.failures.push(spec.label)
        console.warn(`[textures] ${spec.label} (${spec.file}) 加载失败，已启用程序化替代纹理：`, err?.message || err)
      } else {
        this.map.set(key, null)
        this.missing.push(spec.label)
        console.warn(`[textures] 可选纹理 ${spec.label} (${spec.file}) 缺失，相关效果降级：`, err?.message || err)
      }
      this._report()
      return this.map.get(key)
    }
  }

  /**
   * @param {'low'|'medium'|'high'} quality 画质档位
   */
  async loadAll(quality = 'medium', anisotropy = 4) {
    this._aniso = anisotropy
    const keys = ['earthDay', 'earthNight', 'earthClouds', 'earthSpec', 'sun', 'stars']
    // 高画质且显卡支持时才加载 8k 底图
    if (quality === 'high' && this._maxSize >= 8192) keys.splice(1, 0, 'earthDayHi')
    this._all = keys
    await Promise.all(keys.map((k) => this._loadOne(k, TEXTURE_SPECS[k])))
    return this
  }

  get(key) {
    const v = this.map.get(key)
    return v === undefined ? null : v
  }

  /** 地球白昼底图：优先高清，退回标准 */
  getEarthDay() {
    return this.get('earthDayHi') || this.get('earthDay')
  }

  dispose() {
    for (const t of this.map.values()) if (t && t.dispose) t.dispose()
    this.map.clear()
  }
}
