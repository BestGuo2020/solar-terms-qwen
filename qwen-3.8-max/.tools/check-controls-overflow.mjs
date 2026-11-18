/**
 * 移动端时间控制区溢出回归检查
 *   node .tools/check-controls-overflow.mjs
 * 需要：npm run build 且 npm run preview（http://127.0.0.1:4173）
 *
 * 检查项：
 *  1. 390px / 768px / 1024px 三种宽度下，时间控制卡片与整页都不出现横向溢出；
 *  2. 手动改到 2033-01-01（模拟时间）后，"现在显示的是真实当前时间"提示不再出现，
 *     且与"模拟时间"徽章不再自相矛盾；
 *  3. 回到今天后提示恢复显示。
 */
import { spawn } from 'node:child_process'
const EDGE = process.env.EDGE_PATH || 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
const PORT = 9351
const BASE = 'http://127.0.0.1:4173/?nodegrade=1&q=low'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
let failures = 0
const ok = (m) => console.log('  ✓ ' + m)
const bad = (m) => { failures++; console.log('  ✗ ' + m) }

const b = spawn(EDGE, ['--headless=new', `--remote-debugging-port=${PORT}`, '--remote-allow-origins=*',
  '--user-data-dir=D:\\vueprojects\\jieqi24\\.shots\\ovf-profile', '--no-first-run', '--no-default-browser-check',
  '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--window-size=390,844', 'about:blank'],
  { stdio: 'ignore' })
process.on('exit', () => { try { b.kill('SIGKILL') } catch {} })

for (let i = 0; i < 60; i++) { try { const r = await fetch(`http://127.0.0.1:${PORT}/json/version`); if (r.ok) break } catch {} await sleep(300) }
const t = await (await fetch(`http://127.0.0.1:${PORT}/json/new?${encodeURIComponent(BASE)}`, { method: 'PUT' })).json()
const ws = new WebSocket(t.webSocketDebuggerUrl)
await new Promise((r) => { ws.onopen = r })
let id = 0
const pend = new Map()
ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && pend.has(m.id)) { pend.get(m.id)(m.result); pend.delete(m.id) } }
const send = (method, params = {}) => new Promise((res) => { const i = ++id; pend.set(i, res); ws.send(JSON.stringify({ id: i, method, params })) })
const ev = async (expr) => (await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true })).result.value
await send('Runtime.enable'); await send('Page.enable')
await send('Page.navigate', { url: BASE })
await sleep(6000)

async function setMetrics(w, h, mobile) {
  await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile })
  await sleep(700)
}

async function overflowReport(tag) {
  const r = await ev(`(() => {
    const card = document.querySelector('.controls__card');
    const row = document.querySelector('.controls__row');
    const widest = [...document.querySelectorAll('.controls__card *')]
      .map((e) => ({ e, r: e.getBoundingClientRect() }))
      .filter((x) => x.r.width > 0)
      .sort((a, b2) => b2.r.right - a.r.right)[0];
    const cardRect = card.getBoundingClientRect();
    return {
      docScrollW: document.documentElement.scrollWidth,
      innerW: window.innerWidth,
      cardScrollW: card.scrollWidth,
      cardClientW: card.clientWidth,
      worstRight: widest ? Math.round(widest.r.right) : null,
      worstTag: widest ? (widest.e.className || widest.e.tagName).toString().slice(0, 40) : null,
      cardRight: Math.round(cardRect.right),
    };
  })()`)
  const docOk = r.docScrollW <= r.innerW + 1
  const cardOk = r.cardScrollW <= r.cardClientW + 1
  const insideOk = r.worstRight === null || r.worstRight <= r.cardRight + 1
  console.log(`  · [${tag}] 页面 scrollWidth=${r.docScrollW}/innerWidth=${r.innerW}；卡片 scroll=${r.cardScrollW}/client=${r.cardClientW}；最右元素 ${r.worstTag} right=${r.worstRight} vs 卡片右缘 ${r.cardRight}`)
  if (docOk) ok(`[${tag}] 整页无横向溢出`)
  else bad(`[${tag}] 整页横向溢出：scrollWidth ${r.docScrollW} > innerWidth ${r.innerW}`)
  if (cardOk && insideOk) ok(`[${tag}] 时间控制卡片内无元素越界`)
  else bad(`[${tag}] 卡片内溢出：scroll=${r.cardScrollW}/client=${r.cardClientW}，最右 ${r.worstRight} vs ${r.cardRight}`)
  return r
}

console.log('\n[1] 各宽度下的横向溢出检查（真实当前时间）')
for (const [w, h, mob] of [[390, 844, true], [768, 1024, true], [1024, 900, false]]) {
  await setMetrics(w, h, mob)
  await ev(`(() => { const e = document.querySelector('.controls'); if (e) e.scrollIntoView({ block: 'center' }); return 1 })()`)
  await sleep(400)
  await overflowReport(`${w}px`)
}

console.log('\n[2] 改为 2033-01-01（模拟时间）后提示与徽章的一致性')
await setMetrics(390, 844, true)
await ev(`(() => {
  const j = window.__jieqi;
  j.clock.setMs(j.astro.fromBeijing(2033, 1, 1, 0, 0, 0), { pause: true });
  j.scene._updateScene();
  return 1;
})()`)
await sleep(400)   // 等 Vue 完成一次渲染刷新后再读 DOM
const sim = await ev(`(() => {
  const j = window.__jieqi;
  const hint = document.querySelector('.badge--hint');
  const badges = [...document.querySelectorAll('.controls__row .badge')].map((e) => e.textContent.replace(/\\s+/g, ' ').trim());
  return { hintVisible: !!hint, isSim: j.sim.value.isSimulated, badges };
})()`)
if (sim.isSim && !sim.hintVisible) ok('模拟时间下不再显示"现在显示的是真实当前时间"提示')
else bad(`模拟时间下提示状态错误：isSim=${sim.isSim} hintVisible=${sim.hintVisible}`)
if (sim.badges.some((t) => t.startsWith('模拟时间'))) ok('存在"模拟时间"徽章：' + sim.badges.find((t) => t.startsWith('模拟时间')))
else bad('缺少模拟时间徽章')
await ev(`(() => { const e = document.querySelector('.controls'); if (e) e.scrollIntoView({ block: 'center' }); return 1 })()`)
await sleep(400)
await overflowReport('390px 模拟时间')
const r1 = await send('Page.captureScreenshot', { format: 'png' })
const { writeFile } = await import('node:fs/promises')
await writeFile('D:\\vueprojects\\jieqi24\\.shots\\mobile-controls-sim.png', Buffer.from(r1.data, 'base64'))
console.log('  📷 mobile-controls-sim.png')

console.log('\n[3] 回到今天后提示恢复')
await ev(`(() => { const j = window.__jieqi; j.clock.backToToday(); j.scene._updateScene(); return 1 })()`)
await sleep(400)   // 等 Vue 刷新
const back = await ev(`(() => {
  const j = window.__jieqi;
  return { hintVisible: !!document.querySelector('.badge--hint'), isSim: j.sim.value.isSimulated };
})()`)
if (!back.isSim && back.hintVisible) ok('回到今天后提示恢复显示，且不再标注模拟时间')
else bad(`回到今天后状态错误：isSim=${back.isSim} hintVisible=${back.hintVisible}`)
await sleep(400)
await overflowReport('390px 真实时间')
const r2 = await send('Page.captureScreenshot', { format: 'png' })
await writeFile('D:\\vueprojects\\jieqi24\\.shots\\mobile-controls-real.png', Buffer.from(r2.data, 'base64'))
console.log('  📷 mobile-controls-real.png')

console.log(failures === 0 ? '\n=== 溢出与一致性检查全部通过 ===' : `\n=== ${failures} 项失败 ===`)
ws.close()
process.exit(failures === 0 ? 0 : 1)
