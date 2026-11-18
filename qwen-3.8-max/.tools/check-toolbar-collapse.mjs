/**
 * 场景控制面板（⚙ 弹出面板）与紧凑天文读数的回归检查
 *   node .tools/check-toolbar-collapse.mjs
 * 需要：npm run build 且 npm run preview（http://127.0.0.1:4173）
 *
 * 断言：
 *  1. 默认只有一颗 ⚙ 圆形按钮，面板隐藏（画面干净）；
 *  2. 点开后 14 个控制齐全（辅助7 + 标签3 + 画质3 + 保存1），aria-expanded 同步；
 *     视角分段控件（5 项）则常驻可见，不随面板收合；
 *  3. 面板内开关真实生效（关掉"轨道"后 rig.ring.visible === false）；
 *  4. 再点收起，面板隐藏；开/合状态写入 localStorage 且刷新后保持；
 *  5. 左下天文读数默认单行、说明隐藏，点击展开说明；
 *  6. 面板开/合两种状态在 1400px 与 390px 下均无横向溢出。
 */
import { spawn } from 'node:child_process'
import { writeFile } from 'node:fs/promises'
const EDGE = process.env.EDGE_PATH || 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
const PORT = 9383
const BASE = 'http://127.0.0.1:4173/?nodegrade=1&q=medium'
const OUT = 'D:\\vueprojects\\jieqi24\\.shots'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
let failures = 0
const ok = (m) => console.log('  ✓ ' + m)
const bad = (m) => { failures++; console.log('  ✗ ' + m) }

const b = spawn(EDGE, ['--headless=new', `--remote-debugging-port=${PORT}`, '--remote-allow-origins=*',
  '--user-data-dir=D:\\vueprojects\\jieqi24\\.shots\\panel-profile', '--no-first-run', '--no-default-browser-check',
  '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--window-size=1400,900', 'about:blank'],
  { stdio: 'ignore' })
process.on('exit', () => { try { b.kill('SIGKILL') } catch {} })

for (let i = 0; i < 60; i++) { try { const r = await fetch(`http://127.0.0.1:${PORT}/json/version`); if (r.ok) break } catch {} await sleep(300) }
const t = await (await fetch(`http://127.0.0.1:${PORT}/json/new?${encodeURIComponent(BASE)}`, { method: 'PUT' })).json()
const ws = new WebSocket(t.webSocketDebuggerUrl)
await new Promise((r) => { ws.onopen = r })
let id = 0
const pend = new Map()
ws.onmessage = (e) => {
  const m = JSON.parse(e.data)
  const p = pend.get(m.id)
  if (!p) return
  pend.delete(m.id)
  if (m.error) p.reject(new Error(m.error.message))
  else p.resolve(m.result)
}
function send(method, params = {}, timeoutMs = 30000) {
  const i = ++id
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => { pend.delete(i); reject(new Error(method + ' 超时')) }, timeoutMs)
    pend.set(i, { resolve: (v) => { clearTimeout(timer); resolve(v) }, reject: (e) => { clearTimeout(timer); reject(e) } })
    ws.send(JSON.stringify({ id: i, method, params }))
  })
}
const ev = async (expr) => (await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true })).result.value
await send('Runtime.enable'); await send('Page.enable')
await send('Page.navigate', { url: BASE })
await sleep(3000)
await ev(`(() => { localStorage.removeItem('jieqi24.hudPanel'); return 1 })()`)
await send('Page.navigate', { url: BASE + '&r=' + Date.now() })
await sleep(3000)
const ready = await (async () => {
  const t0 = Date.now()
  while (Date.now() - t0 < 30000) {
    try { const v = await ev(`!!(window.__jieqi && window.__jieqi.scene && window.__jieqi.scene.earth)`); if (v) return true } catch {}
    await sleep(500)
  }
  return false
})()
if (!ready) { bad('场景 30 秒未就绪'); console.log('=== 提前结束 ==='); process.exit(1) }

const state = () => ev(`(() => {
  const fab = document.querySelector('.hud-fab');
  const panel = document.getElementById('hud-panel');
  const geo = document.querySelector('.hud-geo');
  return {
    hasFab: !!fab,
    ariaControls: fab?.getAttribute('aria-controls'),
    ariaExpanded: fab?.getAttribute('aria-expanded'),
    panelVisible: !!panel && panel.getClientRects().length > 0,
    panelBtns: panel ? panel.querySelectorAll('button').length : 0,
    panelW: panel ? Math.round(panel.getBoundingClientRect().width) : 0,
    viewsBtns: document.querySelectorAll('.hud-views button').length,
    viewsVisible: !!document.querySelector('.hud-views') && document.querySelector('.hud-views').getClientRects().length > 0,
    geoNoteVisible: !!geo && !!geo.querySelector('.hud-geo__note') && geo.querySelector('.hud-geo__note').getClientRects().length > 0,
    geoLines: geo ? geo.querySelectorAll('.hud-geo__line').length : 0,
    docOverflow: document.documentElement.scrollWidth > window.innerWidth + 1,
    ls: localStorage.getItem('jieqi24.hudPanel'),
  };
})()`)
const clickFab = async () => { await ev(`(() => { document.querySelector('.hud-fab').click(); return 1 })()`); await sleep(350) }

console.log('\n[1] 默认收起')
let s = await state()
if (s.hasFab && s.ariaControls === 'hud-panel' && s.ariaExpanded === 'false' && !s.panelVisible) ok('默认只有一颗 ⚙ 按钮（aria-controls=hud-panel），面板隐藏')
else bad(`默认状态异常：${JSON.stringify(s)}`)
if (s.viewsVisible && s.viewsBtns === 5) ok('视角分段控件常驻可见（4 视角 + 重置 = 5 项）')
else bad(`视角常驻控件异常：visible=${s.viewsVisible} btns=${s.viewsBtns}`)
if (!s.docOverflow) ok('默认状态无横向溢出')

console.log('\n[2] 展开后控制齐全且生效')
await clickFab()
s = await state()
if (s.panelVisible && s.panelBtns === 14 && s.ariaExpanded === 'true') ok(`面板展开：14 个控制（辅助7 + 标签3 + 画质3 + 保存1），宽 ${s.panelW}px`)
else bad(`展开异常：visible=${s.panelVisible} btns=${s.panelBtns} expanded=${s.ariaExpanded}`)
const toggled = await ev(`(() => {
  const j = window.__jieqi;
  const btn = [...document.querySelectorAll('#hud-panel button')].find((b2) => b2.textContent.trim() === '轨道' || b2.textContent.trim() === 'Orbit');
  btn.click();
  const off = j.scene.rig.ring.visible;
  btn.click();
  const on = j.scene.rig.ring.visible;
  return { off, on };
})()`)
if (toggled.off === false && toggled.on === true) ok('面板内"轨道"开关真实生效（ring.visible 随点击切换）')
else bad(`面板开关无效：${JSON.stringify(toggled)}`)
if (!s.docOverflow) ok('展开状态无横向溢出')
await (async () => { const r = await send('Page.captureScreenshot', { format: 'png' }); await writeFile(OUT + '/panel-open.png', Buffer.from(r.data, 'base64')); console.log('  📷 panel-open.png') })()

console.log('\n[3] 收起与偏好持久化')
await clickFab()
s = await state()
if (!s.panelVisible && s.ariaExpanded === 'false' && s.ls === '0') ok('再次点击收起，偏好写入 localStorage=0')
else bad(`收起异常：${JSON.stringify(s)}`)
await clickFab()
await send('Page.navigate', { url: BASE + '&r2=' + Date.now() })
await sleep(3000)
await (async () => {
  const t0 = Date.now()
  while (Date.now() - t0 < 30000) {
    try { const v = await ev(`!!(window.__jieqi && window.__jieqi.scene)`); if (v) break } catch {}
    await sleep(500)
  }
})()
s = await state()
if (s.panelVisible && s.ls === '1') ok('刷新后面板保持展开（偏好被记住）')
else bad(`刷新后状态异常：visible=${s.panelVisible} ls=${s.ls}`)
await clickFab()   // 收起来，保持画面干净

console.log('\n[4] 天文读数单行 / 展开')
s = await state()
if (s.geoLines === 1 && !s.geoNoteVisible) ok('天文读数默认单行、映射说明隐藏')
else bad(`读数默认状态异常：lines=${s.geoLines} note=${s.geoNoteVisible}`)
await ev(`(() => { document.querySelector('.hud-geo').click(); return 1 })()`)
await sleep(300)
s = await state()
if (s.geoNoteVisible) ok('点击读数条后展开映射说明')
else bad('读数说明未展开')
await ev(`(() => { document.querySelector('.hud-geo').click(); return 1 })()`)
await sleep(200)

console.log('\n[5] 移动端 390px')
await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true })
await sleep(900)
s = await state()
if (!s.docOverflow && !s.panelVisible) ok('移动端默认无溢出且面板收起')
else bad(`移动端异常：overflow=${s.docOverflow} panel=${s.panelVisible}`)
await clickFab()
s = await state()
if (s.panelVisible && !s.docOverflow && s.panelW <= 390) ok(`移动端面板展开宽 ${s.panelW}px ≤ 视口，无溢出`)
else bad(`移动端展开异常：w=${s.panelW} overflow=${s.docOverflow}`)
await (async () => { const r = await send('Page.captureScreenshot', { format: 'png' }); await writeFile(OUT + '/panel-mobile-open.png', Buffer.from(r.data, 'base64')); console.log('  📷 panel-mobile-open.png') })()
await send('Emulation.clearDeviceMetricsOverride')

console.log(failures === 0 ? '\n=== 面板与读数检查全部通过 ===' : `\n=== ${failures} 项失败 ===`)
ws.close()
process.exit(failures === 0 ? 0 : 1)
