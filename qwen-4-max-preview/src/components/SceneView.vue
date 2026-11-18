<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { SolarScene } from '../three/SolarScene.js'
import { sim, isSimulated, selectTerm, setCameraPreset, setHelper, setQuality, tick } from '../state/simulation.js'
import { locale, t } from '../i18n.js'
import { TERMS, SEASONS } from '../data/terms.js'
import { formatBeijing, formatBeijingShort } from '../astro/solar.js'
import Icon from './Icon.vue'

const container = ref(null)
const loading = ref(true)
const loadPct = ref(0)
const toast = ref('')
const webglFailed = ref(false)
let scene = null
let fallbackRaf = 0
let toastTimer = 0

const timeStr = computed(() => formatBeijing(sim.simTime, locale.value))
const lonStr = computed(() => sim.lambda.toFixed(1) + '°')
const curTerm = computed(() => TERMS[sim.termCtx.current.index])
const curName = computed(() => curTerm.value[locale.value].name)
const curSince = computed(() => formatBeijingShort(sim.termCtx.current.ms, locale.value))
const seasonColor = computed(() => SEASONS[curTerm.value.season].color)

const CAMS = [
  { key: 'overview', label: 'camOverview', icon: 'globe' },
  { key: 'earth', label: 'camEarth', icon: 'camera' },
  { key: 'default', label: 'camReset', icon: 'sun' }
]
const HELPERS = [
  { key: 'axis', label: 'helpAxis' },
  { key: 'equator', label: 'helpEquator' },
  { key: 'tropics', label: 'helpTropics' },
  { key: 'direction', label: 'helpDirection' },
  { key: 'sunLine', label: 'helpSunLine' },
  { key: 'labels', label: 'helpLabels' }
]

function showToast (msg) {
  toast.value = msg
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => { toast.value = '' }, 6000)
}

function onTermClick (i) { selectTerm(i) }

// WebGL 不可用时的平面轨道示意（仍由统一时钟驱动）
const fbMarkers = computed(() => TERMS.map((term, i) => {
  const a = term.lon * Math.PI / 180
  const r = 92
  return { i, x: -r * Math.cos(a), y: r * Math.sin(a), lx: -110 * Math.cos(a), ly: 110 * Math.sin(a), term }
}))
const fbEarth = computed(() => {
  const a = sim.lambda * Math.PI / 180
  return { x: -92 * Math.cos(a), y: 92 * Math.sin(a) }
})

onMounted(() => {
  try {
    scene = new SolarScene(container.value, {
      locale: locale.value,
      onTermClick,
      onProgress: (p) => { loadPct.value = Math.round(p * 100) },
      onReady: () => { loading.value = false },
      onTextureError: () => showToast(t('textureFallback'))
    })
  } catch (e) {
    webglFailed.value = true
    loading.value = false
    let last = performance.now()
    const loop = (now) => {
      fallbackRaf = requestAnimationFrame(loop)
      tick(Math.min(100, now - last))
      last = now
    }
    fallbackRaf = requestAnimationFrame(loop)
  }
})

watch(locale, (l) => { if (scene) scene.setLocale(l) })

onBeforeUnmount(() => {
  if (scene) scene.dispose()
  cancelAnimationFrame(fallbackRaf)
  clearTimeout(toastTimer)
})
</script>

<template>
  <div class="scene-block">
    <div class="scene-wrap">
    <div ref="container" class="scene-container" :class="{ 'no-webgl': webglFailed }">
      <!-- WebGL 失败时的平面示意 -->
      <svg v-if="webglFailed" class="orbit-fallback" viewBox="-130 -130 260 260" role="img" :aria-label="t('webglFail')">
        <circle r="92" fill="none" stroke="#33465f" stroke-width="1" />
        <circle r="11" fill="#ffb63e" />
        <circle r="17" fill="none" stroke="#ffb63e" stroke-opacity="0.3" stroke-width="4" />
        <g v-for="m in fbMarkers" :key="m.i">
          <circle :cx="m.x" :cy="m.y" :r="m.term.major ? 3 : 1.8"
            :fill="m.term.major ? '#e8c476' : SEASONS[m.term.season].color" />
          <text :x="m.lx" :y="m.ly" text-anchor="middle" dominant-baseline="middle"
            :class="['fb-label', { major: m.term.major, current: sim.termCtx.current.index === m.i }]"
            @click="onTermClick(m.i)">{{ m.term[locale].name }}</text>
        </g>
        <g :transform="`translate(${fbEarth.x}, ${fbEarth.y})`">
          <line x1="0" y1="8" x2="0" y2="-8" stroke="#e8c476" stroke-width="1.2" transform="rotate(-23.4)" />
          <circle r="5" fill="#3f7fbf" stroke="#8fc3e8" stroke-width="0.8" />
        </g>
      </svg>
    </div>

    <!-- 左上：时间 / 黄经 / 当前节气 -->
    <div class="hud hud-time">
      <div class="hud-clock">
        <span class="hud-tz">{{ t('beijingTime') }}</span>
        <span class="badge" :class="isSimulated ? 'badge-sim' : 'badge-live'">
          {{ isSimulated ? t('simBadge') : t('liveBadge') }}
        </span>
      </div>
      <div class="hud-datetime">{{ timeStr }}</div>
      <div class="hud-row">
        <span class="hud-lon">{{ t('solarLon') }} <b>{{ lonStr }}</b></span>
      </div>
      <div class="hud-term" :style="{ borderColor: seasonColor }">
        <span class="hud-term-name" :style="{ color: seasonColor }">{{ curName }}</span>
        <span class="hud-term-since">{{ t('enteredAt') }} {{ curSince }}</span>
      </div>
      <div v-if="isSimulated" class="hud-simhint">{{ t('simHint') }}</div>
    </div>

    <!-- 右上：比例说明 -->
    <div class="hud hud-scale">{{ t('scaleNote') }}</div>

    <!-- 底部提示 -->
    <div class="hud hud-hint">{{ t('dragHint') }}</div>

    <!-- 加载状态 -->
    <transition name="fade">
      <div v-if="loading" class="loading-overlay">
        <div class="loading-sun"></div>
        <div class="loading-text">{{ t('loading') }} {{ loadPct }}%</div>
      </div>
    </transition>

    <transition name="fade">
      <div v-if="toast" class="toast" role="status">{{ toast }}</div>
    </transition>
    <div v-if="webglFailed" class="webgl-note">{{ t('webglFail') }}</div>
    </div>

    <!-- 场景工具栏：视角 / 辅助标识 / 画质（不遮挡 3D 画面） -->
    <div class="scene-toolbar">
      <div class="hud-group">
        <span class="hud-group-title">{{ t('cameraTitle') }}</span>
        <button v-for="c in CAMS" :key="c.key" type="button" class="chip"
          :class="{ active: sim.cameraPreset === c.key }"
          :aria-pressed="sim.cameraPreset === c.key"
          @click="setCameraPreset(c.key)">
          <Icon :name="c.icon" :size="14" />{{ t(c.label) }}
        </button>
      </div>
      <div class="hud-group">
        <span class="hud-group-title">{{ t('helpersTitle') }}</span>
        <button v-for="h in HELPERS" :key="h.key" type="button" class="chip"
          :class="{ active: sim.helpers[h.key] }"
          :aria-pressed="sim.helpers[h.key]"
          @click="setHelper(h.key, !sim.helpers[h.key])">
          {{ t(h.label) }}
        </button>
        <label class="chip quality-chip">
          {{ t('qualityTitle') }}
          <select :value="sim.quality" @change="setQuality($event.target.value)" :aria-label="t('qualityTitle')">
            <option value="auto">{{ t('qAuto') }}</option>
            <option value="high">{{ t('qHigh') }}</option>
            <option value="low">{{ t('qLow') }}</option>
          </select>
        </label>
      </div>
    </div>
  </div>
</template>