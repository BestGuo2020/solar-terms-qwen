/**
 * browser-check.mjs — 无头浏览器验收脚本
 *
 *   node .tools/browser-check.mjs
 *
 * 通过 Chrome DevTools Protocol 驱动无头 Edge，对**运行中的页面**做端到端验收：
 *   · 页面能否挂载、WebGL 能否创建、纹理是否加载成功；
 *   · 控制台有没有报错；
 *   · 节气判断（含交节时刻前后 1 秒、跨年）是否正确；
 *   · 3D 场景中地球的位置是否与节气严格对应（夏至 +Z、冬至 −Z、春分 −X、秋分 +X）；
 *   · 地轴方向在夏至与冬至是否指向同一处（不随公转转动）；
 *   · 太阳直射点纬度在四个分至点是否为 +ε / 0 / −ε / 0；
 *   · 点击节气、拖动时间轴、切换年份能否正确联动；
 *   · 24 个节气标记与时间轴刻度数量是否正确；
 * 并输出若干张截图供人工核对桌面端与移动端布局。
 */
import { spawn } from 'node:child_process'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

const EDGE = process.env.EDGE_PATH || 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
const BASE = process.env.BASE_URL || 'http://127.0.0.1:4173/'
// 验收时固定画质、关闭自动降级，保证截图与断言稳定
const BASEQ = BASE + '?nodegrade=1&q=medium'
const PORT = 9333
const ROOT = path.resolve('D:/vueprojects/jieqi24')
const SHOTS = path.join(ROOT, '.shots')
const PROFILE = path.join(SHOTS, 'cdp-profile')

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
let failures = 0
let checks = 0
const ok = (m) => { checks++; console.log(`  ✓ ${m}`) }
const bad = (m) => { failures++; checks++; console.log(`  ✗ ${m}`) }
const near = (a, b, tol) => Math.abs(a - b) <= tol
const section = (t) => console.log(`\n${t}`)

// --- 启动无头浏览器 ---------------------------------------------------------
await mkdir(PROFILE, { recursive: true })
const browser = spawn(EDGE, [
  '--headless=new',
  `--remote-debugging-port=${PORT}`,
  '--remote-allow-origins=*',
  `--user-data-dir=${PROFILE}`,
  '--no-first-run', '--no-default-browser-check', '--disable-features=msEdgeQQBrowserImporter',
  '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader',
  '--window-size=1600,1000', '--hide-scrollbars',
  'about:blank',
], { stdio: 'ignore', detached: false })

const cleanup = () => { try { browser.kill('SIGKILL') } catch {} }
process.on('exit', cleanup)

async function waitForDebugger() {
  for (let i = 0; i < 60; i++) {
    try {
      const r = await fetch(`http://127.0.0.1:${PORT}/json/version`)
      if (r.ok) return await r.json()
    } catch {}
    await sleep(300)
  }
  throw new Error('Edge 远程调试端口未就绪')
}
const version = await waitForDebugger()
console.log(`浏览器：${version.Browser}  协议：${version['Protocol-Version']}`)

// 新建标签页
let target
try {
  const r = await fetch(`http://127.0.0.1:${PORT}/json/new?${encodeURIComponent(BASE)}`, { method: 'PUT' })
  target = await r.json()
} catch {
  const r = await fetch(`http://127.0.0.1:${PORT}/json/new?${encodeURIComponent(BASE)}`)
  target = await r.json()
}

const ws = new WebSocket(target.webSocketDebuggerUrl)
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej })

let msgId = 0
const pending = new Map()
const consoleMsgs = []
const exceptions = []
const failedReq = []
const logEntries = []

ws.onmessage = (ev) => {
  const m = JSON.parse(ev.data)
  if (m.id && pending.has(m.id)) {
    const { resolve, reject } = pending.get(m.id)
    pending.delete(m.id)
    if (m.error) reject(new Error(m.error.message))
    else resolve(m.result)
    return
  }
  switch (m.method) {
    case 'Runtime.consoleAPICalled':
      consoleMsgs.push({ type: m.params.type, text: (m.params.args || []).map((a) => a.value ?? a.description ?? a.type).join(' ') })
      break
    case 'Runtime.exceptionThrown':
      exceptions.push(m.params.exceptionDetails?.exception?.description || m.params.exceptionDetails?.text || 'unknown')
      break
    case 'Log.entryAdded':
      logEntries.push(`${m.params.entry.level}: ${m.params.entry.text} ${m.params.entry.url || ''}`)
      break
    case 'Network.loadingFailed':
      failedReq.push(`${m.params.requestId} ${m.params.errorText}`)
      break
  }
}

function send(method, params = {}, timeoutMs = 30000) {
  const id = ++msgId
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      pending.delete(id)
      reject(new Error(`${method} 超时 ${timeoutMs}ms`))
    }, timeoutMs)
    pending.set(id, {
      resolve: (v) => { clearTimeout(timer); resolve(v) },
      reject: (e) => { clearTimeout(timer); reject(e) },
    })
    ws.send(JSON.stringify({ id, method, params }))
  })
}

async function evaluate(expression) {
  const r = await send('Runtime.evaluate', {
    expression, returnByValue: true, awaitPromise: true, allowException: false,
  })
  if (r.exceptionDetails) throw new Error('页面求值异常: ' + (r.exceptionDetails.exception?.description || r.exceptionDetails.text))
  return r.result.value
}

await send('Runtime.enable')
await send('Page.enable')
await send('Log.enable')
await send('Network.enable')
// 先落一次页面，把上一次运行（包括被中断的运行）残留的偏好清掉，保证验收从确定状态开始
await send('Page.navigate', { url: BASE })
await sleep(2500)
await send('Runtime.evaluate', {
  expression: `(() => { localStorage.setItem('jieqi24.locale','zh'); localStorage.removeItem('jieqi24.toolsCollapsed'); return 1 })()`,
  returnByValue: true,
})

async function goto(url, settleMs = 3500) {
  await send('Page.navigate', { url })
  await sleep(settleMs)
}

/** 轮询直到页面表达式为真（包变大后固定 sleep 不够稳） */
async function waitUntil(expr, ms = 30000) {
  const t0 = Date.now()
  while (Date.now() - t0 < ms) {
    try { const v = await evaluate(expr); if (v) return true } catch { /* 页面还在加载 */ }
    await sleep(500)
  }
  return false
}
const HOOK_READY = '!!(window.__jieqi && window.__jieqi.scene && window.__jieqi.scene.earth && window.__jieqi.scene.rig)'

async function shot(name, w, h, mobile = false, scrollToSelector = null) {
  try {
    await send('Emulation.setDeviceMetricsOverride', {
      width: w, height: h, deviceScaleFactor: 1, mobile,
    })
    await sleep(900)
    if (scrollToSelector) {
      try {
        await evaluate(`(() => { const e = document.querySelector('${scrollToSelector}'); if (e) e.scrollIntoView({block:'start'}); return e ? 1 : 0 })()`)
      } catch { /* 选择器失效不致命 */ }
      await sleep(700)
    }
    const r = await Promise.race([
      send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false }),
      new Promise((_, rej) => setTimeout(() => rej(new Error('screenshot timeout 20s')), 20000)),
    ])
    const f = path.join(SHOTS, name + '.png')
    await writeFile(f, Buffer.from(r.data, 'base64'))
    console.log(`  📷 ${name}.png (${w}×${h}${scrollToSelector ? ' @' + scrollToSelector : ''})`)
    return f
  } catch (e) {
    console.log(`  ⚠ 截图失败 ${name}: ${e.message}`)
    return null
  }
}

try {
  // --- 加载页面 ---------------------------------------------------------
  section('[A] 页面加载与场景初始化')
  await goto(BASEQ + '&t=' + Date.now(), 4000)
  const hooked = await waitUntil(HOOK_READY, 30000)
  if (!hooked) bad('30 秒内场景仍未就绪（window.__jieqi.scene 缺失）')

  const boot = await evaluate(`(() => {
    const j = window.__jieqi || {};
    const c = document.querySelector('.stage canvas');
    return {
      hasHook: !!window.__jieqi,
      webgl: !!j.webgl,
      canvas: !!c,
      canvasW: c ? c.width : 0, canvasH: c ? c.height : 0,
      sceneReady: !!(j.scene && j.scene.earth && j.scene.rig),
      loaderHidden: document.querySelector('.loader')?.hidden ?? null,
      bootFallback: !!document.querySelector('.boot-fallback'),
      termName: j.sim?.value?.current?.name,
      simTime: j.sim?.value?.beijingDateTime,
      solarLongitude: j.sim?.value?.solarLongitude,
      axialTilt: j.sim?.value?.axialTilt,
      markerCount: j.scene?.rig?.markers?.length ?? 0,
      labelButtons: document.querySelectorAll('button.marker--term').length,
      timelineTicks: document.querySelectorAll('.timeline__tick').length,
      timelineBands: document.querySelectorAll('.timeline__bands i').length,
      termCells: document.querySelectorAll('.tcell').length,
      songTokens: document.querySelectorAll('.song__tok').length,
      tlineItems: document.querySelectorAll('.tline__item').length,
      qaItems: document.querySelectorAll('.qa__item').length,
      quality: j.scene?.quality,
      playing: j.clock?.playing,
      isSim: j.sim?.value?.isSimulated,
      textureFailures: j.scene?.textures?.failures ?? [],
      textureMissing: j.scene?.textures?.missing ?? [],
      maxTex: j.scene?.maxTextureSize,
    };
  })()`)

  boot.hasHook ? ok('调试钩子 window.__jieqi 已就绪') : bad('缺少 window.__jieqi（应用未挂载）')
  boot.bootFallback ? bad('仍停留在 boot-fallback，Vue 未挂载') : ok('Vue 应用已挂载')
  boot.webgl ? ok('WebGL 可用（SwiftShader 软件渲染）') : bad('WebGL 不可用')
  boot.canvas ? ok(`画布已创建 ${boot.canvasW}×${boot.canvasH}`) : bad('未找到 WebGL 画布')
  boot.sceneReady ? ok('SceneManager 构建完成（地球与轨道标记就位）') : bad('SceneManager 未就绪')
  boot.loaderHidden === true ? ok('加载遮罩已隐藏') : bad(`加载遮罩状态异常：${boot.loaderHidden}`)
  boot.markerCount === 24 ? ok('轨道上 24 个节气标记') : bad(`节气标记数量 ${boot.markerCount}`)
  boot.labelButtons === 24 ? ok('24 个可点击/可聚焦的节气标签按钮') : bad(`标签按钮数量 ${boot.labelButtons}`)
  boot.timelineTicks === 24 ? ok('时间轴 24 个节气刻度') : bad(`时间轴刻度 ${boot.timelineTicks}`)
  boot.timelineBands === 25 ? ok('时间轴 25 段季节色带（按真实交节时刻切分）') : bad(`季节色带 ${boot.timelineBands}`)
  boot.termCells === 24 ? ok('节气列表 24 格') : bad(`列表格数 ${boot.termCells}`)
  boot.songTokens === 23 ? ok(`节气歌 ${boot.songTokens} 个可点击字/词块`) : bad(`节气歌 token 数 ${boot.songTokens}`)
  boot.tlineItems >= 7 ? ok(`历史时间线 ${boot.tlineItems} 条`) : bad(`历史时间线条数 ${boot.tlineItems}`)
  boot.qaItems === 4 ? ok('科普问答 4 条') : bad(`科普问答条数 ${boot.qaItems}`)
  console.log(`  · 画质档位 = ${boot.quality}，WebGL MAX_TEXTURE_SIZE = ${boot.maxTex}`)
  console.log(`  · 纹理回退 = [${boot.textureFailures.join(', ')}]，可选纹理缺失 = [${boot.textureMissing.join(', ')}]`)
  if (boot.textureFailures.length) bad(`有纹理加载失败并回退：${boot.textureFailures.join('、')}`)
  else ok('全部纹理加载成功，未触发程序化回退')
  console.log(`  · 打开页面即显示：${boot.termName}（${boot.simTime}，太阳黄经 ${boot.solarLongitude?.toFixed?.(3)}°，地轴倾角 ${boot.axialTilt?.toFixed?.(4)}°）`)
  boot.termName ? ok('默认使用当前真实日期，并显示对应节气') : bad('未能显示当前节气')
  boot.playing === false && boot.isSim === false
    ? ok('打开页面时暂停在真实当前时间，标注为"当前真实时间"而非"模拟时间"')
    : bad(`初始状态异常：playing=${boot.playing} isSimulated=${boot.isSim}`)

  // 验收期间固定画质，避免软件渲染触发的自动降级干扰截图与断言
  await evaluate(`(() => { const j = window.__jieqi; j.scene.setAutoDegrade(false); j.scene.setQuality('medium'); return 1 })()`)

  // --- 控制台错误 -------------------------------------------------------
  section('[B] 控制台与网络')
  const errs = consoleMsgs.filter((c) => c.type === 'error')
  const warns = consoleMsgs.filter((c) => c.type === 'warning')
  console.log(`  · console: ${consoleMsgs.length} 条（error ${errs.length} / warning ${warns.length}），exception ${exceptions.length}，网络失败 ${failedReq.length}`)
  for (const e of errs.slice(0, 8)) console.log(`    [error] ${String(e.text).slice(0, 240)}`)
  for (const e of exceptions.slice(0, 8)) console.log(`    [exception] ${String(e).slice(0, 240)}`)
  for (const w of warns.slice(0, 8)) console.log(`    [warn] ${String(w.text).slice(0, 200)}`)
  for (const f of failedReq.slice(0, 8)) console.log(`    [net-fail] ${f}`)
  errs.length === 0 ? ok('控制台无 error') : bad(`控制台有 ${errs.length} 条 error`)
  exceptions.length === 0 ? ok('无未捕获异常') : bad(`有 ${exceptions.length} 个未捕获异常`)

  // --- 节气判断：分至点、边界、跨年 --------------------------------------
  section('[C] 节气判断（含交节时刻前后 1 秒与跨年）')
  const cases = [
    // [北京时间, 期望节气, 说明]（交节时刻取自 verify-astro 已核对过的计算值）
    [[2026, 3, 21, 12, 0, 0], '春分', '春分次日'],
    [[2026, 6, 22, 12, 0, 0], '夏至', '夏至次日'],
    [[2026, 9, 24, 12, 0, 0], '秋分', '秋分次日'],
    [[2026, 12, 23, 12, 0, 0], '冬至', '冬至次日'],
    // 交节"当刻"含毫秒小数，用整秒去凑会落在前一秒；精确到毫秒的当刻检验
    // 由下面的"页面内全量边界扫描"覆盖，这里只测整秒可表达的 ±1 秒。
    [[2026, 10, 8, 14, 29, 57], '秋分', '寒露交节前约 1 秒'],
    [[2026, 10, 8, 14, 29, 59], '寒露', '寒露交节后约 1 秒'],
    [[2026, 1, 1, 0, 0, 0], '冬至', '跨年：元旦零点仍属上一年冬至'],
    [[2026, 1, 5, 16, 23, 2], '冬至', '小寒交节前约 1 秒（仍属上年冬至）'],
    [[2026, 1, 5, 16, 23, 4], '小寒', '小寒交节后约 1 秒'],
    [[2026, 12, 31, 23, 59, 59], '冬至', '年末'],
    [[1900, 1, 1, 0, 0, 0], '冬至', '支持范围最早一年'],
    [[2100, 12, 31, 23, 0, 0], '冬至', '支持范围最晚一年'],
  ]
  let cBad = 0
  for (const [bj, expect, desc] of cases) {
    const got = await evaluate(`(() => {
      const j = window.__jieqi;
      const ms = j.astro.fromBeijing(${bj.join(',')});
      j.clock.setMs(ms, { pause: true });
      j.scene._updateScene();
      const s = j.sim.value;
      const p = j.scene.earth.system.position;
      const tilt = j.scene.earth.tiltGroup.quaternion;
      const V = Object.getPrototypeOf(p).constructor;
      const Q = Object.getPrototypeOf(tilt).constructor;
      const pole = new V(0, 1, 0).applyQuaternion(new Q(tilt._x, tilt._y, tilt._z, tilt._w));
      return {
        name: s.current.name, index: s.current.index, year: s.current.year,
        lon: s.solarLongitude, next: s.next.name, nextYear: s.next.year,
        pos: [p.x, p.y, p.z],
        pole: [pole.x, pole.y, pole.z],
        subLat: j.orbitMath.subSolarLatitude(s.solarLongitude, s.axialTilt),
        playing: j.clock.playing,
      };
    })()`)
    if (got.name !== expect) { bad(`${bj.join('-')} 期望「${expect}」实得「${got.name}」（${desc}）`); cBad++; continue }
    checks++
    console.log(`  ✓ ${String(got.year).padStart(4)}-${String(bj[1]).padStart(2, '0')}-${String(bj[2]).padStart(2, '0')} ${String(bj[3]).padStart(2, '0')}:${String(bj[4]).padStart(2, '0')}:${String(bj[5]).padStart(2, '0')} → ${got.name.padEnd(2)} λ☉=${got.lon.toFixed(3)}° 位置=(${got.pos.map((v) => v.toFixed(1)).join(', ')}) 直射点纬度=${got.subLat >= 0 ? '+' : ''}${got.subLat.toFixed(2)}° 下一节气=${got.nextYear}年${got.next}  [${desc}]`)
  }
  if (cBad === 0) ok(`${cases.length} 个时间点（含边界、跨年与年份边界）的节气判断全部正确`)

  // 全量边界扫描：2026 年 24 个节气，各测 T−1s / T / T+1s
  const edgeScan = await evaluate(`(() => {
    const j = window.__jieqi;
    const t = j.astro.termInstants(2026);
    const bad = [];
    for (const it of t.byIndex) {
      const prevIdx = ((it.index - 2 + 24) % 24) + 1;
      const at = [
        [it.ms - 1000, prevIdx], [it.ms, it.index], [it.ms + 1000, it.index],
      ];
      for (const [ms, expect] of at) {
        j.clock.setMs(ms, { pause: true });
        j.scene._updateScene();
        const got = j.sim.value.current.index;
        if (got !== expect) bad.push(it.name + '@' + (ms - it.ms) + 'ms 期望' + expect + ' 实得' + got);
      }
    }
    j.clock.backToToday(); j.scene._updateScene();
    return { total: t.byIndex.length * 3, bad };
  })()`)
  edgeScan.bad.length === 0
    ? ok(`页面内全量边界扫描：2026 年 24 个节气 × (T−1s, T, T+1s) 共 ${edgeScan.total} 次判断全部正确`)
    : bad(`边界扫描有 ${edgeScan.bad.length} 处不符：${edgeScan.bad.slice(0, 6).join('；')}`)

  // --- 地球位置与节气严格对应 -------------------------------------------
  section('[D] 分至点的地球位置、地轴方向与受光关系')
  // 用各分至点的**准确交节时刻**做检验（而不是随便取当天中午），
  // 这样 λ☉ 才恰好等于 0/90/180/270，期望位置才是精确的 (±R, 0, 0) / (0, 0, ±R)。
  const cardinals = [
    [4, '春分', 0, [-62, 0, 0], 0],
    [10, '夏至', 90, [0, 0, 62], +1],
    [16, '秋分', 180, [62, 0, 0], 0],
    [22, '冬至', 270, [0, 0, -62], -1],
  ]
  const poles = []
  let dBad = 0
  for (const [index, name, lonExpect, posExpect, latExpect] of cardinals) {
    const r = await evaluate(`(() => {
      const j = window.__jieqi;
      const t = j.clock.jumpToTerm(2026, ${index});   // 跳到该节气的准确交节时刻并暂停
      j.scene._updateScene();
      const s = j.sim.value;
      const p = j.scene.earth.system.position;
      const q = j.scene.earth.tiltGroup.quaternion;
      const V = Object.getPrototypeOf(p).constructor;
      const Q = Object.getPrototypeOf(q).constructor;
      const pole = new V(0, 1, 0).applyQuaternion(new Q(q._x, q._y, q._z, q._w));
      const toSun = new V(-p.x, -p.y, -p.z).normalize();
      return {
        instant: j.astro.fmtBeijing(t.ms, { seconds: true }),
        name: s.current.name,
        lon: s.solarLongitude, pos: [p.x, p.y, p.z], pole: [pole.x, pole.y, pole.z],
        poleDotSun: pole.dot(toSun),
        subLat: j.orbitMath.subSolarLatitude(s.solarLongitude, s.axialTilt),
        axisVsNormal: Math.acos(Math.min(1, Math.max(-1, pole.y))) * 180 / Math.PI,
        earthLonScene: s.earthHeliocentricLongitude,
      };
    })()`)
    poles.push(r.pole)
    const posOk = r.pos.every((v, i) => near(v, posExpect[i], 0.02))
    // latExpect 是 ±1 / 0 的符号，期望值 = 符号 × 当年的黄赤交角
    const latTarget = latExpect * r.axisVsNormal
    const latOk = near(r.subLat, latTarget, 0.002)
    const lonOk = near(Math.abs(((r.lon - lonExpect + 540) % 360) - 180), 0, 0.002)
    const tiltOk = near(r.axisVsNormal, 23.44, 0.05)
    if (!lonOk) { bad(`${name}: 交节时刻的 λ☉ = ${r.lon.toFixed(5)}°，应恰为 ${lonExpect}°`); dBad++ }
    if (!posOk) { bad(`${name}: 地球位置 (${r.pos.map((v) => v.toFixed(3)).join(',')}) ≠ 期望 (${posExpect.join(',')})`); dBad++ }
    if (!latOk) { bad(`${name}: 太阳直射点纬度 ${r.subLat.toFixed(4)}° ≠ 期望 ${latTarget.toFixed(4)}°`); dBad++ }
    if (!tiltOk) { bad(`${name}: 地轴与轨道法线夹角 ${r.axisVsNormal.toFixed(3)}° ≠ 23.44°`); dBad++ }
    const sunSideExpect = latExpect > 0 ? 1 : latExpect < 0 ? -1 : 0
    const sunSideOk = sunSideExpect === 0 ? Math.abs(r.poleDotSun) < 0.002
      : sunSideExpect > 0 ? r.poleDotSun > 0.39 : r.poleDotSun < -0.39
    if (!sunSideOk) { bad(`${name}: 北极与日地方向点积 ${r.poleDotSun.toFixed(4)} 不符合期望`); dBad++ }
    checks++
    console.log(`  ✓ ${name}（${r.instant}）: λ☉=${r.lon.toFixed(4)}° L⊕=${r.earthLonScene.toFixed(2)}° 位置=(${r.pos.map((v) => v.toFixed(2)).join(',')}) 直射点=${r.subLat >= 0 ? '+' : ''}${r.subLat.toFixed(3)}° 地轴倾角=${r.axisVsNormal.toFixed(3)}° 北极·向日=${r.poleDotSun >= 0 ? '+' : ''}${r.poleDotSun.toFixed(4)}`)
  }
  const poleSpread = Math.max(
    ...poles.map((p) => Math.hypot(p[0] - poles[0][0], p[1] - poles[0][1], p[2] - poles[0][2])),
  )
  if (poleSpread < 1e-4) ok(`地轴在四个分至点指向完全一致（最大偏差 ${poleSpread.toExponential(2)}），即地轴不随公转转动`)
  else bad(`地轴指向在一年中发生变化 ${poleSpread.toExponential(2)}`)
  if (dBad === 0) ok('四个分至点的地球位置、直射点纬度、地轴倾角与受光方向全部正确')

  // --- 交互联动 ---------------------------------------------------------
  section('[E] 交互联动：点击节气 / 拖动时间轴 / 切换年份')
  const before = await evaluate(`(() => { const j = window.__jieqi; return { ms: j.clock.nowMs, playing: j.clock.playing }; })()`)
  const clickRes = await evaluate(`(() => {
    const j = window.__jieqi;
    j.clock.setMs(j.astro.fromBeijing(2026, 5, 1, 0, 0, 0), { pause: false });
    j.scene._updateScene();
    // 模拟"点击冬至标记"：与按钮点击走的是同一个 selectTerm
    const btn = document.querySelector('button.marker--term[data-term-index="22"]');
    btn.click();
    j.scene._updateScene();
    const s = j.sim.value;
    return {
      name: s.current.name, year: s.current.year,
      beijing: s.beijingDateTime, atExact: s.atExactInstant,
      playing: j.clock.playing,
      activeLabels: document.querySelectorAll('button.marker--term.is-active').length,
      activeCells: document.querySelectorAll('.tcell.is-active').length,
      detailTitle: document.querySelector('.detail__title')?.textContent?.trim(),
      pos: (() => { const p = j.scene.earth.system.position; return [p.x,p.y,p.z].map(v=>+v.toFixed(2)); })(),
    };
  })()`)
  clickRes.name === '冬至' && clickRes.year === 2026 ? ok(`点击「冬至」标记后跳到 ${clickRes.year} 年冬至交节时刻（${clickRes.beijing}）`) : bad(`点击冬至后为 ${clickRes.year}年${clickRes.name} ${clickRes.beijing}`)
  clickRes.atExact ? ok('跳转后正好落在交节时刻上（详情区标注"此刻正是交节时刻"）') : bad(`跳转后未落在交节时刻（atExact=${clickRes.atExact}，${clickRes.beijing}）`)
  clickRes.playing === false ? ok('点击节气后自动播放已暂停') : bad('点击节气后仍在播放')
  clickRes.detailTitle === '冬至' ? ok('详情区同步显示「冬至」') : bad(`详情区显示「${clickRes.detailTitle}」`)
  clickRes.activeLabels === 1 && clickRes.activeCells === 1 ? ok('轨道标签与列表各有一项高亮为当前节气') : bad(`高亮数量异常：标签 ${clickRes.activeLabels}，列表 ${clickRes.activeCells}`)
  near(clickRes.pos[2], -62, 0.6) ? ok(`地球已移动到冬至位置 (0,0,−62)，实得 (${clickRes.pos.join(',')})`) : bad(`冬至时地球位置异常 (${clickRes.pos.join(',')})`)

  const scrubRes = await evaluate(`(() => {
    const j = window.__jieqi;
    j.scrubYearFraction(0.5);
    j.scene._updateScene();
    const s = j.sim.value;
    return { beijing: s.beijingDateTime, name: s.current.name, frac: 0.5, playing: j.clock.playing };
  })()`)
  const midOk = new RegExp('^2026-07-0[123]').test(scrubRes.beijing)
  midOk ? ok(`时间轴拖到中点 → ${scrubRes.beijing}（${scrubRes.name}）`) : bad(`时间轴中点异常：${scrubRes.beijing}`)
  scrubRes.playing === false ? ok('拖动时间轴时自动暂停') : bad('拖动时间轴未暂停')

  const yearRes = await evaluate(`(() => {
    const j = window.__jieqi;
    j.setYear(1985);
    j.scene._updateScene();
    const s = j.sim.value;
    const yt = j.yearTerms.value;
    return { year: s.year, listYear: yt.year, name: s.current.name, first: yt.chronological[0].name + ' ' + j.astro.fmtBeijing(yt.chronological[0].ms), cells: document.querySelectorAll('.tcell').length };
  })()`)
  yearRes.year === 1985 && yearRes.listYear === 1985 ? ok(`切换年份到 1985 → 列表与场景同为 ${yearRes.listYear} 年（首节气 ${yearRes.first}）`) : bad(`年份切换异常：sim=${yearRes.year} list=${yearRes.listYear}`)

  const rangeRes = await evaluate(`(() => {
    const j = window.__jieqi;
    const sel = document.querySelector('#year');
    return { options: sel ? sel.options.length : 0, first: sel?.options[0]?.value, last: sel?.options[sel.options.length-1]?.value };
  })()`)
  rangeRes.first === '1901' && rangeRes.last === '2200' ? ok(`年份下拉只开放实际支持范围：${rangeRes.first}–${rangeRes.last}（共 ${rangeRes.options} 项）`) : bad(`年份范围异常：${rangeRes.first}–${rangeRes.last}`)

  // 外推区间要有明确提示（改状态与读 DOM 之间必须等 Vue 刷新）
  await evaluate(`(() => { const j = window.__jieqi; j.setYear(3000); j.scene._updateScene(); return 1 })()`)
  await sleep(400)
  const extrap = await evaluate(`(() => {
    const j = window.__jieqi;
    const badges = [...document.querySelectorAll('.controls__row .badge--warn')].map((e) => e.textContent.replace(/\\s+/g, ' ').trim());
    return { tier: j.sim.value.precisionTier, badges, note: j.sim.value.precisionNote.slice(0, 46) };
  })()`)
  extrap.tier === 'moderate' && extrap.badges.length >= 1
    ? ok(`选择 3000 年时显示外推精度提示：「${extrap.badges[0].slice(0, 40)}…」`)
    : bad(`3000 年未显示外推提示：tier=${extrap.tier} badges=${extrap.badges.length}`)
  await evaluate(`(() => { const j = window.__jieqi; j.setYear(2026); j.scene._updateScene(); return 1 })()`)
  await sleep(400)
  const backVal = await evaluate(`(() => {
    const j = window.__jieqi;
    return { tier: j.sim.value.precisionTier, warn: document.querySelectorAll('.controls__row .badge--warn').length };
  })()`)
  backVal.tier === 'validated' && backVal.warn === 0
    ? ok('回到 1901–2100 比对区间后外推提示自动消失')
    : bad(`回到比对区间后仍有提示：${JSON.stringify(backVal)}`)

  // "赛博永生"档：任意年份输入 + TT 时标 + 越界夹取
  const immortal = await evaluate(`(() => {
    const j = window.__jieqi;
    const input = document.querySelector('#any-year');
    input.value = '8800';
    input.dispatchEvent(new Event('change', { bubbles: true }));
    j.scene._updateScene();
    const s = j.sim.value;
    return { year: s.year, tier: s.precisionTier, unc: s.uncertaintyText, cells: document.querySelectorAll('.tcell').length, name: s.current.name };
  })()`)
  immortal.year === 8800 && immortal.tier === 'millennium' && immortal.cells === 24
    ? ok(`任意年份 8800 可用：tier=${immortal.tier}、不确定度 ${immortal.unc}、列表 24 格（当前 ${immortal.name}）`)
    : bad(`8800 年异常：${JSON.stringify(immortal)}`)

  const ttMode = await evaluate(`(() => {
    const j = window.__jieqi;
    j.clock.setDisplayMode('tt');
    const s1 = j.sim.value;
    const out = { ttShown: s1.shownDateTime, dT: Math.round(s1.deltaT), label: s1.shownScaleLabel };
    j.clock.setDisplayMode('civil');
    out.civShown = j.sim.value.shownDateTime;
    return out;
  })()`)
  ttMode.ttShown !== ttMode.civShown && ttMode.dT > 1000
    ? ok(`TT 时标可切换：8800 年 ΔT≈${ttMode.dT}s，TT 读数（${ttMode.ttShown}）与民用时读数不同`)
    : bad(`TT 模式异常：${JSON.stringify(ttMode)}`)

  const clampRes = await evaluate(`(() => {
    const j = window.__jieqi;
    const input = document.querySelector('#any-year');
    input.value = '99999'; input.dispatchEvent(new Event('change', { bubbles: true }));
    const hi = j.sim.value.year;
    input.value = '0'; input.dispatchEvent(new Event('change', { bubbles: true }));
    const lo = j.sim.value.year;
    j.setYear(2026); j.scene._updateScene();
    return { hi, lo };
  })()`)
  clampRes.hi === 8800 && clampRes.lo === 1
    ? ok('越界年份输入被夹到 [1, 8800]')
    : bad(`夹取异常：${JSON.stringify(clampRes)}`)

  // --- 中/英切换 -----------------------------------------------------------
  section('[E2] 中 / 英 语言切换')
  await evaluate(`(() => { localStorage.setItem('jieqi24.locale', 'en'); return 1 })()`)
  await goto(BASEQ + '&lang=en&t=' + Date.now(), 4000)
  await waitUntil(HOOK_READY, 25000)
  const enState = await evaluate(`(() => ({
    lang: document.documentElement.lang,
    title: document.title,
    h1: document.querySelector('.site-title')?.textContent?.replace(/\\s+/g, ' ').trim(),
    navFirst: document.querySelector('.site-nav a')?.textContent?.trim(),
    blocks: [...document.querySelectorAll('.block__title')].map((e) => e.textContent.trim()).slice(0, 4),
    marker22: document.querySelector('button.marker--term[data-term-index="22"] .marker__name')?.textContent?.trim(),
    marker4: document.querySelector('button.marker--term[data-term-index="4"] .marker__name')?.textContent?.trim(),
    listTitle: document.querySelector('.termlist__title')?.textContent?.trim(),
    play: [...document.querySelectorAll('.controls__row .btn')].map((e) => e.textContent.trim()).find((x) => /Play/.test(x)) || null,
    songToks: document.querySelectorAll('.song__tok').length,
    songFirstChar: document.querySelector('.song__tok')?.textContent?.trim(),
    secTitle: document.querySelector('#history .sec__title')?.textContent?.trim(),
  }))()`)
  enState.lang === 'en' ? ok('<html lang="en"> 已切换') : bad(`lang=${enState.lang}`)
  const titleEn = new RegExp('Solar Terms').test(enState.title || '')
  titleEn ? ok(`document.title 已英文化：${enState.title}`) : bad(`title 未英文化：${enState.title}`)
  enState.marker22 === 'Winter Solstice' && enState.marker4 === 'Spring Equinox'
    ? ok('轨道标签已英文化（Winter Solstice / Spring Equinox）')
    : bad(`轨道标签：22=${enState.marker22} 4=${enState.marker4}`)
  enState.blocks.includes('What the name means') ? ok('详情区栏目名已英文化') : bad(`详情栏目：${enState.blocks.join('|')}`)
  enState.play ? ok('播放按钮已英文化（▶ Play）') : bad('未找到英文播放按钮')
  enState.songToks === 23 && enState.songFirstChar === '春'
    ? ok('节气歌在英文界面仍保留汉字歌诀（23 个可点字块，首字「春」）')
    : bad(`歌诀 token：${enState.songToks} / ${enState.songFirstChar}`)
  enState.secTitle === 'Historical Origins' ? ok('阅读区标题已英文化') : bad(`阅读区标题：${enState.secTitle}`)
  console.log(`  · EN 页头：${enState.h1} ｜ 列表标题：${enState.listTitle} ｜ 导航首项：${enState.navFirst}`)
  await shot('desktop-en-top', 1600, 1000)
  await shot('desktop-en-song', 1400, 1100, false, '#song')
  await shot('desktop-en-detail', 1400, 1000, false, '.termlist')

  // 切回中文（轮询等待 Vue 重渲染与 3D 标签刷新，避免固定 sleep 的偶发失败）
  await evaluate(`(() => { document.querySelectorAll('.lang-switch button')[0].click(); return 1 })()`)
  const backOk = await waitUntil(
    `document.documentElement.lang === 'zh-CN' && document.querySelector('button.marker--term[data-term-index="22"] .marker__name')?.textContent?.trim() === '冬至'`,
    8000,
  )
  const zhState = await evaluate(`(() => ({
    lang: document.documentElement.lang,
    marker22: document.querySelector('button.marker--term[data-term-index="22"] .marker__name')?.textContent?.trim(),
    block: document.querySelector('.block__title')?.textContent?.trim(),
    ls: localStorage.getItem('jieqi24.locale'),
  }))()`)
  if (!backOk) bad('切回中文后 8 秒内界面未还原')
  zhState.lang === 'zh-CN' && zhState.marker22 === '冬至' && zhState.block === '名称含义'
    ? ok('切回中文：lang、轨道标签、详情栏目全部还原')
    : bad(`切回中文异常：${JSON.stringify(zhState)}`)
  zhState.ls === 'zh' ? ok('语言偏好已持久化到 localStorage') : bad(`localStorage locale=${zhState.ls}`)

  // 回到今天
  const todayRes = await evaluate(`(() => {
    const j = window.__jieqi;
    j.clock.backToToday(); j.scene._updateScene();
    const s = j.sim.value;
    return { beijing: s.beijingDateTime, name: s.current.name, isSim: s.isSimulated };
  })()`)
  todayRes.isSim === false ? ok(`「回到今天」后恢复为真实时间（${todayRes.beijing}，${todayRes.name}），不再标注"模拟时间"`) : bad('回到今天后仍标注为模拟时间')

  // 视角与辅助线开关
  const viewRes = await evaluate(`(() => {
    const j = window.__jieqi; const s = j.scene;
    const out = {};
    for (const v of ['overview','top','earth','default']) { s.setView(v); out[v] = s.currentView; }
    s.setHelpers({ axis:false, equator:false, tropics:false, polarCircles:true, direction:false, markers:false, orbit:false, labels:'major' });
    out.helpers = JSON.parse(JSON.stringify(s.helpers));
    out.markerGroupVisible = s.rig.markerGroup.visible;
    out.ringVisible = s.rig.ring.visible;
    s.setHelpers({ axis:true, equator:true, tropics:true, polarCircles:false, direction:true, markers:true, orbit:true, labels:'all' });
    out.restored = s.rig.markerGroup.visible && s.rig.ring.visible;
    return out;
  })()`)
  viewRes.overview === 'overview' && viewRes.top === 'top' && viewRes.earth === 'earth' ? ok('四种视角（默认/轨道总览/北极俯视/地球近景）均可切换') : bad('视角切换异常')
  viewRes.markerGroupVisible === false && viewRes.ringVisible === false ? ok('辅助标识开关生效（可关闭节气标记与轨道）') : bad('辅助标识开关未生效')
  viewRes.restored === true ? ok('辅助标识可恢复显示') : bad('辅助标识恢复失败')

  // --- 截图 -------------------------------------------------------------
  section('[F] 截图（人工核对布局与视觉）')
  await goto(BASEQ + '&t=' + Date.now(), 4000)
  await waitUntil(HOOK_READY, 25000)
  await evaluate(`(() => { const j = window.__jieqi; j.clock.setMs(j.astro.fromBeijing(2026,6,22,12,0,0), {pause:true}); j.scene.setView('default'); j.scene._updateScene(); return 1 })()`)
  await sleep(1500)
  await shot('desktop-summer', 1600, 1000)
  await evaluate(`(() => { const j = window.__jieqi; j.clock.setMs(j.astro.fromBeijing(2026,12,23,12,0,0), {pause:true}); j.scene.setView('earth'); j.scene._updateScene(); return 1 })()`)
  await sleep(1800)
  await shot('desktop-winter-earthview', 1600, 1000)
  await evaluate(`(() => { const j = window.__jieqi; j.clock.setMs(j.astro.fromBeijing(2026,3,21,12,0,0), {pause:true}); j.scene.setView('top'); j.scene._updateScene(); return 1 })()`)
  await sleep(1800)
  await shot('desktop-topview-equinox', 1600, 1000)
  await goto(BASE + '?t=' + Date.now(), 5000)
  await shot('section-history', 1400, 1000, false, '#history')
  await shot('section-culture', 1400, 1000, false, '#culture')
  await shot('section-song', 1400, 1100, false, '#song')
  await shot('section-science', 1400, 1000, false, '#science')
  await shot('section-sources', 1400, 1000, false, '#sources')
  await goto(BASEQ + '&m=' + Date.now(), 4000)
  await waitUntil(HOOK_READY, 25000)
  await shot('mobile-top', 390, 844, true)
  await shot('mobile-controls', 390, 844, true, '.controls')
  await shot('mobile-song', 390, 844, true, '#song')
  await send('Emulation.clearDeviceMetricsOverride')

  // --- 资源释放 ---------------------------------------------------------
  section('[G] 资源释放')
  const disposeRes = await evaluate(`(() => {
    const j = window.__jieqi; const s = j.scene;
    let geos = 0, mats = 0;
    s.scene.traverse((o) => { if (o.geometry) geos++; if (o.material) mats++; });
    s.dispose();
    return { before: { geos, mats }, disposed: s.disposed, raf: s._raf, canvasLeft: !!document.querySelector('.stage canvas') };
  })()`)
  disposeRes.disposed === true ? ok(`dispose() 已执行（此前场景含 ${disposeRes.before.geos} 个几何体、${disposeRes.before.mats} 个材质）`) : bad('dispose() 未标记完成')
  disposeRes.raf === null ? ok('requestAnimationFrame 循环已取消') : bad('动画循环未取消')
  disposeRes.canvasLeft === false ? ok('画布已从 DOM 移除') : bad('画布仍留在 DOM 中')

  const postErrs = consoleMsgs.filter((c) => c.type === 'error')
  const postExc = exceptions
  console.log(`  · 全流程累计 console error ${postErrs.length} 条，未捕获异常 ${postExc.length} 个`)
  for (const e of postErrs.slice(0, 10)) console.log(`    [error] ${String(e.text).slice(0, 260)}`)
  for (const e of postExc.slice(0, 10)) console.log(`    [exception] ${String(e).slice(0, 260)}`)
  if (postErrs.length === 0 && postExc.length === 0) ok('整个验收流程无控制台错误与异常')
  else bad('验收流程中出现控制台错误或异常')
} catch (e) {
  bad('验收脚本自身出错：' + (e?.stack || e))
} finally {
  await writeFile(path.join(SHOTS, 'console-log.json'), JSON.stringify({ consoleMsgs, exceptions, failedReq, logEntries }, null, 2))
  console.log(`\n=== 共 ${checks} 项检查，${failures} 项失败 ===`)
  try { ws.close() } catch {}
  cleanup()
  process.exit(failures === 0 ? 0 : 1)
}
