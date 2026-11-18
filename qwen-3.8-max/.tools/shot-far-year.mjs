/** 一次性截图：公元 8800 年、TT 时标下的界面（展示千年档精度披露） */
import { spawn } from 'node:child_process'
import { writeFile } from 'node:fs/promises'
const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
const PORT = 9361
const BASE = 'http://127.0.0.1:4173/?nodegrade=1&q=medium'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const b = spawn(EDGE, ['--headless=new', `--remote-debugging-port=${PORT}`, '--remote-allow-origins=*',
  '--user-data-dir=D:\\vueprojects\\jieqi24\\.shots\\faryear-profile', '--no-first-run', '--no-default-browser-check',
  '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--window-size=1600,1000', 'about:blank'],
  { stdio: 'ignore' })
process.on('exit', () => { try { b.kill('SIGKILL') } catch {} })
for (let i = 0; i < 60; i++) { try { const r = await fetch(`http://127.0.0.1:${PORT}/json/version`); if (r.ok) break } catch {} await sleep(300) }
const t = await (await fetch(`http://127.0.0.1:${PORT}/json/new?${encodeURIComponent(BASE)}`, { method: 'PUT' })).json()
const ws = new WebSocket(t.webSocketDebuggerUrl)
await new Promise((r) => { ws.onopen = r })
let id = 0
const pend = new Map()
ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && pend.has(m.id)) { pend.get(m.id)(m.result); pend.delete(m.id) } }
const send = (m, p = {}) => new Promise((res) => { const i = ++id; pend.set(i, res); ws.send(JSON.stringify({ id: i, method: m, params: p })) })
const ev = async (x) => (await send('Runtime.evaluate', { expression: x, returnByValue: true, awaitPromise: true })).result.value
await send('Runtime.enable'); await send('Page.enable')
await send('Page.navigate', { url: BASE })
await sleep(7000)
const info = await ev(`(() => {
  const j = window.__jieqi;
  j.setYear(8800);
  j.clock.setDisplayMode('tt');
  j.scene._updateScene();
  const s = j.sim.value;
  return { year: s.year, tier: s.tierLabel, unc: s.uncertaintyText, shown: s.shownDateTime, label: s.shownScaleLabel, dT: Math.round(s.deltaT), term: s.current.name };
})()`)
console.log(JSON.stringify(info))
await sleep(1500)
const r = await send('Page.captureScreenshot', { format: 'png' })
await writeFile('D:\\vueprojects\\jieqi24\\.shots\\desktop-year8800-tt.png', Buffer.from(r.data, 'base64'))
console.log('shot desktop-year8800-tt.png')
ws.close()
process.exit(0)
