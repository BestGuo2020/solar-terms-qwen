/**
 * 工具栏折叠回归检查
 *   node .tools/check-toolbar-collapse.mjs
 * 需要：npm run build 且 npm run preview（http://127.0.0.1:4173）
 *
 * 断言：
 *  1. 存在折叠开关按钮，且带 aria-expanded / aria-controls；
 *  2. 点击后三行控制被隐藏、开关仍可见，工具栏整体高度显著变小；
 *  3. 再点一次恢复，全部按钮重新可见（视角 5 + 辅助 7 + 标签 3 + 画质 3 + 保存 1 = 19）；
 *  4. 折叠状态写入 localStorage，刷新后保持；
 *  5. 两种状态下整页与舞台均无横向溢出；
 *  6. 移动端（390px）同样可折叠且无溢出。
 */
import { spawn } from 'node:child_process'
import { writeFile } from 'node:fs/promises'
const EDGE = process.env.EDGE_PATH || 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
const PORT = 9357
const BASE = 'http://127.0.0.1:4173/?nodegrade=1&q=medium'
const OUT = 'D:\\vueprojects\\jieqi24\\.shots'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
let failures = 0
const ok = (m) => console.log('  ✓ ' + m)
const bad = (m) => { failures++; console.log('  ✗ ' + m) }

const b = spawn(EDGE, ['--headless=new', `--remote-debugging-port=${PORT}`, '--remote-allow-origins=*',
  '--user-data-dir=D:\\vueprojects\\jieqi24\\.shots\\collapse-profile', '--no-first-run', '--no-default-browser-check',
  '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--window-size=1400,900', 'about:blank'],
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

async function state() {
  return ev(`(() => {
    const toggle = document.querySelector('.hud-tools__toggle');
    const rows = document.getElementById('hud-tools-rows');
    const tools = document.querySelector('.hud-tools');
    const btns = rows ? rows.querySelectorAll('button').length : 0;
    const rowsVisible = !!rows && rows.getClientRects().length > 0;
    return {
      hasToggle: !!toggle,
      ariaExpanded: toggle?.getAttribute('aria-expanded'),
      ariaControls: toggle?.getAttribute('aria-controls'),
      rowsVisible,
      btnCount: btns,
      toolsH: tools ? Math.round(tools.getBoundingClientRect().height) : -1,
      toggleVisible: !!toggle && toggle.getClientRects().length > 0,
      ls: localStorage.getItem('jieqi24.toolsCollapsed'),
      docOverflow: document.documentElement.scrollWidth > window.innerWidth + 1,
    };
  })()`)
}
async function clickToggle() {
  await ev(`(() => { document.querySelector('.hud-tools__toggle').click(); return 1 })()`)
  await sleep(350)
}
async function shot(name) {
  const r = await send('Page.captureScreenshot', { format: 'png' })
  await writeFile(`${OUT}/${name}.png`, Buffer.from(r.data, 'base64'))
  console.log('  📷 ' + name + '.png')
}

await send('Page.navigate', { url: BASE })
await sleep(6500)
await ev(`(() => { localStorage.removeItem('jieqi24.toolsCollapsed'); return 1 })()`)
await send('Page.navigate', { url: BASE + '&r=' + Date.now() })
await sleep(6000)

console.log('\n[1] 桌面端 1400px')
let s = await state()
if (s.hasToggle && s.ariaControls === 'hud-tools-rows') ok('折叠开关存在，aria-controls 指向控制行容器')
else bad(`开关/aria 异常：hasToggle=${s.hasToggle} ariaControls=${s.ariaControls}`)
if (s.ariaExpanded === 'true' && s.rowsVisible) ok(`默认展开：aria-expanded=true，控制行可见（${s.btnCount} 个按钮），工具栏高 ${s.toolsH}px`)
else bad(`默认状态异常：ariaExpanded=${s.ariaExpanded} rowsVisible=${s.rowsVisible}`)
const expandedH = s.toolsH
if (s.btnCount === 19) ok('展开时 19 个控制按钮齐全（视角5+辅助7+标签3+画质3+保存1）')
else bad(`展开按钮数 ${s.btnCount} ≠ 19`)
if (!s.docOverflow) ok('展开状态无横向溢出')
else bad('展开状态出现横向溢出')
await shot('toolbar-expanded')

await clickToggle()
s = await state()
if (!s.rowsVisible && s.toggleVisible) ok(`折叠后控制行隐藏、开关仍可见，工具栏高 ${s.toolsH}px（展开时 ${expandedH}px）`)
else bad(`折叠状态异常：rowsVisible=${s.rowsVisible} toggleVisible=${s.toggleVisible}`)
if (s.toolsH <= 40) ok(`折叠后工具栏高度 ${s.toolsH}px ≤ 40px，只剩一个图标`)
else bad(`折叠后工具栏仍高 ${s.toolsH}px`)
if (s.ariaExpanded === 'false') ok('aria-expanded 同步为 false')
else bad(`aria-expanded=${s.ariaExpanded}`)
if (s.ls === '1') ok('折叠状态已写入 localStorage')
else bad(`localStorage 值 = ${s.ls}`)
if (!s.docOverflow) ok('折叠状态无横向溢出')
else bad('折叠状态出现横向溢出')
await shot('toolbar-collapsed')

await clickToggle()
s = await state()
if (s.rowsVisible && s.btnCount === 19 && s.ariaExpanded === 'true') ok('再次点击恢复展开，19 个按钮全部回来')
else bad(`恢复展开异常：rowsVisible=${s.rowsVisible} btnCount=${s.btnCount}`)

console.log('\n[2] 刷新后保持折叠偏好')
await clickToggle()           // 折起来
await send('Page.navigate', { url: BASE + '&r2=' + Date.now() })
await sleep(6000)
s = await state()
if (!s.rowsVisible && s.ls === '1') ok('刷新后仍为折叠状态（偏好被记住）')
else bad(`刷新后状态异常：rowsVisible=${s.rowsVisible} ls=${s.ls}`)
await clickToggle()           // 恢复展开，避免影响其它检查
s = await state()
if (s.rowsVisible) ok('已恢复展开')

console.log('\n[3] 移动端 390px')
await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true })
await sleep(900)
await ev(`(() => { const e = document.querySelector('.hud-tools'); if (e) e.scrollIntoView({ block: 'center' }); return 1 })()`)
await sleep(400)
s = await state()
if (!s.docOverflow) ok('移动端展开状态无横向溢出')
else bad('移动端展开状态横向溢出')
await clickToggle()
s = await state()
if (!s.rowsVisible && !s.docOverflow) ok(`移动端可折叠（工具栏高 ${s.toolsH}px）且无横向溢出`)
else bad(`移动端折叠异常：rowsVisible=${s.rowsVisible} overflow=${s.docOverflow}`)
await shot('mobile-toolbar-collapsed')
await clickToggle()
await send('Emulation.clearDeviceMetricsOverride')

console.log(failures === 0 ? '\n=== 工具栏折叠检查全部通过 ===' : `\n=== ${failures} 项失败 ===`)
ws.close()
process.exit(failures === 0 ? 0 : 1)
