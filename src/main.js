import { createApp } from 'vue'
import App from './App.vue'
import './styles/main.css'
import { clock, ui, sim, yearTerms, selectTerm, scrubYearFraction, setYear } from './lib/simClock.js'
import { TERMS } from './data/terms.js'
import * as astro from './lib/astro.js'
import * as orbitMath from './three/orbitMath.js'

// 启动前先确认 WebGL 可用，给出可读的降级提示而不是白屏
function webglAvailable() {
  try {
    const c = document.createElement('canvas')
    return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')))
  } catch {
    return false
  }
}

/**
 * 调试/自检钩子。自动化验收脚本（.tools/browser-check.mjs）通过它读取
 * 模拟时间、节气判断结果与场景状态，从而验证 UI、时间轴、3D 场景是否真的同步。
 * 只读为主，暴露的几个动作与界面上按钮走的是同一套函数。
 */
window.__jieqi = {
  version: '1.0.0',
  clock, ui, sim, yearTerms, TERMS, astro, orbitMath,
  selectTerm, scrubYearFraction, setYear,
  scene: null,          // 由 SceneStage 挂载后填入 SceneManager 实例
  webgl: webglAvailable(),
}

const app = createApp(App)
app.provide('webgl', webglAvailable())
app.config.errorHandler = (err, _instance, info) => {
  console.error('[jieqi24] 运行时错误：', info, err)
  ;(window.__jieqi.errors ||= []).push(String(err && err.stack || err))
}
app.mount('#app')
