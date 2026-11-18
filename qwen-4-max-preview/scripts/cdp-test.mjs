// 端到端浏览器实测：Edge headless + CDP（无第三方依赖）
// 用法：node scripts/cdp-test.mjs [url]
import { spawn, spawnSync } from 'node:child_process'
import { writeFileSync, mkdirSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const PAGE_URL = process.argv[2] || 'http://localhost:5174/'
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
const SHOTS = new URL('../test-shots/', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')
const PROFILE = join(tmpdir(), 'jieqi24-edge-profile-' + process.pid)
mkdirSync(SHOTS, { recursive: true })

const sleep = (ms) => new Promise(r => setTimeout(r, ms))
const results = []
const check = (name, ok, extra = '') => {
  results.push({ name, ok, extra })
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${extra ? '  [' + extra + ']' : ''}`)
}

const proc = spawn(EDGE, [
  '--headless=new', '--remote-debugging-port=0', '--window-size=1440,900',
  '--user-data-dir=' + PROFILE, '--no-first-run', '--no-default-browser-check',
  '--hide-scrollbars', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--disable-lcd-text',
  'about:blank'
], { stdio: 'ignore' })

let ws, msgId = 0
const pending = new Map()
const consoleErrors = []

async function connect () {
  // 从本实例独立 profile 的 DevToolsActivePort 读取随机调试端口，确保只连接自己启动的浏览器
  let port = 0
  for (let i = 0; i < 60 && !port; i++) {
    try { port = parseInt(readFileSync(join(PROFILE, 'DevToolsActivePort'), 'utf8').split('\n')[0], 10) } catch {}
    if (!port) await sleep(300)
  }
  if (!port) throw new Error('DevToolsActivePort not found')
  for (let i = 0; i < 30; i++) {
    try {
      const created = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: 'PUT' })).json()
      if (created.webSocketDebuggerUrl) {
        ws = new WebSocket(created.webSocketDebuggerUrl)
        await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej })
        ws.onmessage = (ev) => {
          const m = JSON.parse(ev.data)
          if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id) }
          if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') {
            consoleErrors.push(m.params.args.map(a => a.value || a.description || '').join(' '))
          }
          if (m.method === 'Runtime.exceptionThrown') {
            consoleErrors.push(m.params.exceptionDetails.exception?.description || 'exception')
          }
        }
        return
      }
    } catch {}
    await sleep(300)
  }
  throw new Error('cannot connect to Edge CDP')
}

function send (method, params = {}) {
  return new Promise((res, rej) => {
    const id = ++msgId
    pending.set(id, (m) => m.error ? rej(new Error(method + ': ' + JSON.stringify(m.error))) : res(m.result))
    ws.send(JSON.stringify({ id, method, params }))
  })
}
const ev = async (expression) => {
  const r = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })
  if (r.exceptionDetails) throw new Error('eval: ' + (r.exceptionDetails.exception?.description || JSON.stringify(r.exceptionDetails)))
  return r.result.value
}
const shot = async (name) => {
  const r = await send('Page.captureScreenshot', { format: 'png' })
  writeFileSync(SHOTS + '/' + name + '.png', Buffer.from(r.data, 'base64'))
  console.log('shot  ' + name)
}
async function waitFor (expr, timeout = 20000) {
  const t0 = Date.now()
  while (Date.now() - t0 < timeout) {
    if (await ev(expr)) return true
    await sleep(250)
  }
  return false
}
const hud = () => ev(`(() => {
  const q = s => document.querySelector(s)?.textContent?.trim() || ''
  return {
    datetime: q('.hud-datetime'), lon: q('.hud-lon'), term: q('.hud-term-name'),
    since: q('.hud-term-since'), badge: q('.badge'),
    cardName: q('.term-name'), instant: q('.instant-chip'), next: q('.next-term-line')
  }
})()`)

try {
  await connect()
  await send('Page.enable')
  await send('Runtime.enable')
  await send('Page.navigate', { url: PAGE_URL })
  const ready = await waitFor(`!!document.querySelector('.scene-canvas') && !document.querySelector('.loading-overlay')`)
  check('场景初始化且加载完成', ready)
  await sleep(1500)

  const labelCount = await ev(`document.querySelectorAll('.term-label').length`)
  check('24 个节气标签', labelCount === 24, String(labelCount))
  let h = await hud()
  check('默认实时 + 当前节气立冬', h.badge.includes('实时') && h.term === '立冬', JSON.stringify(h))
  await shot('01-desktop-initial')

  // 点击节气标记 → 跳转交节时刻并暂停
  await ev(`[...document.querySelectorAll('.term-label')].find(b => b.textContent.includes('冬至')).click()`)
  await sleep(400)
  h = await hud()
  check('点击冬至标记跳转 2026-12-22 04:50', h.term === '冬至' && h.datetime.includes('2026年12月22日') && h.datetime.includes('04:50'), h.datetime)
  check('模拟时间徽章', h.badge.includes('模拟'), h.badge)
  await shot('02-desktop-winter-solstice')

  await ev(`[...document.querySelectorAll('.term-label')].find(b => b.textContent.includes('春分')).click()`)
  await sleep(400)
  h = await hud()
  check('点击春分标记跳转 2026-03-20 22:45:37', h.term === '春分' && h.datetime.includes('2026年3月20日') && h.datetime.includes('22:45'), h.datetime)

  // 播放 / 暂停
  await ev(`document.querySelector('.play-btn').click()`)
  await sleep(1500)
  const t1 = (await hud()).datetime
  await sleep(1200)
  const t2 = (await hud()).datetime
  check('播放推进时间', t1 !== t2, t1 + ' -> ' + t2)
  await ev(`document.querySelector('.play-btn').click()`)
  await sleep(300)
  const t3 = (await hud()).datetime
  await sleep(900)
  check('暂停停止推进', t3 === (await hud()).datetime)

  // 时间轴拖动（先滚入视口，避开节气刻度按钮，确保按在轨道空白处）
  await ev(`document.querySelector('.time-controls').scrollIntoView({ block: 'center', behavior: 'instant' })`)
  await sleep(400)
  const rect = await ev(`(() => {
    const r = document.querySelector('.tl-track').getBoundingClientRect()
    let x = r.x + r.width * 0.2
    const y = r.y + r.height / 2
    for (let i = 0; i < 12; i++) {
      const el = document.elementFromPoint(x, y)
      if (!el || !el.closest('.tl-tick')) break
      x += 7
    }
    return { left: r.x, x, y, w: r.width, hit: String(document.elementFromPoint(x, y)?.className) }
  })()`)
  console.log('drag press at', JSON.stringify(rect))
  const endX = rect.left + rect.w * 0.6
  await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: rect.x, y: rect.y, button: 'left', clickCount: 1 })
  await sleep(120)
  console.log('after press:', (await hud()).datetime)
  for (let i = 1; i <= 8; i++) {
    await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: rect.x + (endX - rect.x) * i / 8, y: rect.y, button: 'left' })
    await sleep(40)
  }
  await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: endX, y: rect.y, button: 'left' })
  await sleep(400)
  h = await hud()
  const month = +(h.datetime.match(/年(\d+)月/) || [])[1]
  check('时间轴拖动到约 60% → 8 月前后', month >= 7 && month <= 9, h.datetime)

  // 日期输入：交节时刻边界
  const setDate = async (v) => {
    await ev(`(() => {
      const input = document.querySelector('input[type="datetime-local"]')
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set
      setter.call(input, '${v}')
      input.dispatchEvent(new Event('change', { bubbles: true }))
    })()`)
    await sleep(350)
  }
  await setDate('2025-06-21T10:43')
  h = await hud()
  check('2025-06-21 10:43 已入夏至（交节 10:42:09）', h.term === '夏至' && h.datetime.includes('2025年6月21日'), h.datetime + ' ' + h.term)
  await setDate('2025-06-21T10:41')
  h = await hud()
  check('交节前 1 分钟仍为芒种', h.term === '芒种', h.term)

  // 年份切换
  await ev(`(() => {
    const sel = [...document.querySelectorAll('.tc-field select')].find(s => [...s.options].some(o => o.value === '2024'))
    const setter = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, 'value').set
    setter.call(sel, '2024')
    sel.dispatchEvent(new Event('change', { bubbles: true }))
  })()`)
  await sleep(350)
  const gridFirst = await ev(`document.querySelector('.term-cell .term-cell-date').textContent`)
  check('切换 2024 年列表更新（小寒 01-06）', gridFirst === '01-06', gridFirst)

  // 回到今天
  await ev(`document.querySelector('.today-btn').click()`)
  await sleep(350)
  h = await hud()
  check('回到今天恢复实时', h.badge.includes('实时') && h.datetime.includes('2026年11月11日'), h.datetime)

  // 英文切换
  await ev(`document.querySelector('.lang-btn').click()`)
  await sleep(500)
  const enTitle = await ev(`document.querySelector('.brand-title').textContent`)
  const enLabel = await ev(`[...document.querySelectorAll('.term-label')].some(b => b.textContent.includes('Winter Solstice'))`)
  check('英文界面生效', enTitle === 'The 24 Solar Terms' && enLabel, enTitle)
  await shot('03-desktop-english')
  await ev(`document.querySelector('.lang-btn').click()`)
  await sleep(400)

  // 地球近景
  await ev(`[...document.querySelectorAll('.hud-group .chip')].find(b => b.textContent.includes('地球近景')).click()`)
  await sleep(1600)
  await shot('04-desktop-earth-closeup')
  const camOk = await ev(`!!document.querySelector('.scene-canvas')`)
  check('地球近景渲染', camOk)

  // 辅助标识开关
  await ev(`[...document.querySelectorAll('.hud-group .chip')].find(b => b.textContent.trim() === '赤道').click()`)
  const eqOn = await ev(`[...document.querySelectorAll('.hud-group .chip')].find(b => b.textContent.trim() === '赤道').getAttribute('aria-pressed')`)
  check('赤道开关切换', eqOn === 'true', eqOn)
  await ev(`[...document.querySelectorAll('.hud-group .chip')].find(b => b.textContent.includes('恢复默认')).click()`)
  await sleep(1200)

  // 节气歌联动
  await ev(`document.querySelector('#song').scrollIntoView()`)
  await sleep(700)
  await ev(`document.querySelectorAll('.song-token')[0].click()`)
  await sleep(600)
  h = await hud()
  check('节气歌首字联动立春 2026-02-04 04:02', h.term === '立春' && h.datetime.includes('2026年2月4日'), h.datetime)
  await shot('05-desktop-song-jump')

  // 移动端视口
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true })
  await send('Emulation.setTouchEmulationEnabled', { enabled: true })
  await sleep(1200)
  const overflow = await ev(`document.scrollingElement.scrollWidth - window.innerWidth`)
  check('移动端无横向溢出', overflow <= 1, String(overflow))
  await ev(`window.scrollTo(0, 0)`)
  await sleep(500)
  await shot('06-mobile-initial')
  await ev(`[...document.querySelectorAll('.term-cell')].find(b => b.textContent.includes('冬至')).click()`)
  await sleep(500)
  h = await hud()
  check('移动端点击节气列表联动', h.term === '冬至', h.term)
  await ev(`document.querySelector('.detail-panel').scrollIntoView()`)
  await sleep(500)
  await shot('07-mobile-detail')
  await ev(`document.querySelector('.time-controls').scrollIntoView()`)
  await sleep(400)
  await shot('08-mobile-controls')

  check('控制台无错误', consoleErrors.length === 0, consoleErrors.slice(0, 4).join(' | '))
} catch (e) {
  check('测试流程异常', false, e.message)
} finally {
  const failed = results.filter(r => !r.ok)
  console.log(`\n==== ${results.length - failed.length}/${results.length} passed ====`)
  if (consoleErrors.length) console.log('console errors:\n' + consoleErrors.join('\n'))
  try { ws.close() } catch {}
  // 按本次启动的精确 PID 结束整棵进程树，避免 headless 子进程残留
  try { spawnSync('taskkill', ['/PID', String(proc.pid), '/T', '/F'], { stdio: 'ignore' }) } catch {}
  try { rmSync(PROFILE, { recursive: true, force: true }) } catch {}
  process.exit(failed.length ? 1 : 0)
}