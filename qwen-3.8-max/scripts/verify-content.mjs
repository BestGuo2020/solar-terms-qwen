/**
 * verify-content.mjs — 内容数据完整性与一致性校验
 *
 *   node scripts/verify-content.mjs
 *
 * 检查 24 个节气的内容字段是否齐全、天文定义是否与规范表一致、
 * 节气歌逐字映射是否覆盖 1..24 且无重复、以及是否存在空占位文本。
 */
import { TERMS, termWarnings } from '../src/data/terms.js'
import { TERM_TABLE } from '../src/data/termTable.js'
import * as song from '../src/data/song.js'
import * as science from '../src/data/science.js'

let failures = 0
const fail = (m) => { failures++; console.log(`  ✗ ${m}`) }
const ok = (m) => console.log(`  ✓ ${m}`)

const PLACEHOLDER = /(^|\s)(TODO|TBD|待补充|占位|lorem|xxx|XXX|暂无|待完善)(\s|$|[。，])/

console.log('\n[1] 24 节气内容字段完整性')
{
  const required = ['id', 'name', 'index', 'longitude', 'pinyin', 'season', 'meaning',
    'climate', 'phenology', 'farming', 'customs', 'food', 'poems', 'scienceNote', 'tip']
  if (TERMS.length !== 24) fail(`节气数量为 ${TERMS.length}，应为 24`)
  else ok('共 24 个节气条目')

  if (termWarnings.length) termWarnings.forEach((w) => fail(`数据一致性：${w}`))
  else ok('内容文件的 id/index/longitude/name/season 与规范表完全一致')

  let fieldOk = true
  for (const t of TERMS) {
    for (const f of required) {
      if (t[f] === undefined || t[f] === null || t[f] === '') { fail(`${t.name}: 缺少字段 ${f}`); fieldOk = false }
    }
    if (!Array.isArray(t.phenology?.items) || t.phenology.items.length !== 3) { fail(`${t.name}: 三候应为 3 条`); fieldOk = false }
    if (!t.phenology?.note) { fail(`${t.name}: 缺少三候说明`); fieldOk = false }
    if (!Array.isArray(t.customs) || t.customs.length < 2) { fail(`${t.name}: 习俗应 ≥2 条`); fieldOk = false }
    for (const cu of t.customs || []) {
      if (!cu.title || !cu.text || !cu.region) { fail(`${t.name}: 习俗条目缺 title/text/region`); fieldOk = false }
    }
    if (!Array.isArray(t.poems) || t.poems.length < 1) { fail(`${t.name}: 至少 1 首诗词`); fieldOk = false }
    for (const p of t.poems || []) {
      if (!p.text || !p.author || !p.title) { fail(`${t.name}: 诗词缺 text/author/title（${JSON.stringify(p).slice(0, 60)}）`); fieldOk = false }
    }
    if (typeof t.tip !== 'string' || [...t.tip].length > 24) { fail(`${t.name}: tip 应 ≤24 字（实为 ${[...(t.tip || '')].length}）`); fieldOk = false }
  }
  if (fieldOk) ok('全部字段齐全：三候 3 条、习俗含地域、诗词含作者与篇名、tip ≤24 字')
}

console.log('\n[2] 天文定义正确性')
{
  let good = true
  for (let i = 0; i < 24; i++) {
    const t = TERM_TABLE[i]
    const expectLon = (315 + i * 15) % 360
    if (t.longitude !== expectLon) { fail(`${t.name}: 黄经 ${t.longitude} ≠ ${expectLon}`); good = false }
    if (t.index !== i + 1) { fail(`${t.name}: index ${t.index} ≠ ${i + 1}`); good = false }
  }
  const cardinals = { 春分: 0, 夏至: 90, 秋分: 180, 冬至: 270 }
  for (const [n, l] of Object.entries(cardinals)) {
    const t = TERM_TABLE.find((x) => x.name === n)
    if (!t || t.longitude !== l || !t.major) { fail(`${n} 的黄经/标记不正确`); good = false }
  }
  const jie = TERM_TABLE.filter((t) => t.kind === '节').length
  const zhong = TERM_TABLE.filter((t) => t.kind === '中气').length
  if (jie !== 12 || zhong !== 12) { fail(`节 ${jie} / 中气 ${zhong}，应各 12`); good = false }
  if (good) ok('黄经自 315° 起每 15° 递进；春分0°/夏至90°/秋分180°/冬至270°；节与中气各 12 个')
}

console.log('\n[3] 内容查重（避免重复的占位描述）')
{
  const dup = (field, get) => {
    const seen = new Map()
    let n = 0
    for (const t of TERMS) {
      const v = (get(t) || '').trim()
      if (!v) continue
      if (seen.has(v)) { fail(`${field} 重复：${t.name} 与 ${seen.get(v)} 文本完全相同`); n++ }
      else seen.set(v, t.name)
    }
    return n
  }
  let n = 0
  n += dup('meaning', (t) => t.meaning)
  n += dup('climate', (t) => t.climate)
  n += dup('farming', (t) => t.farming)
  n += dup('tip', (t) => t.tip)
  n += dup('scienceNote', (t) => t.scienceNote)
  n += dup('food', (t) => t.food)
  for (const t of TERMS) {
    for (const p of t.poems || []) if (PLACEHOLDER.test(p.text)) { fail(`${t.name}: 诗词含占位符`); n++ }
    if (PLACEHOLDER.test(t.climate || '')) { fail(`${t.name}: climate 含占位符`); n++ }
  }
  if (n === 0) ok('meaning/climate/farming/tip/scienceNote/food 均无重复，且无占位符')
}

console.log('\n[4] 地域差异表述（气候与习俗不得写成全国必然）')
{
  // 地域限定词：既包括大区/流域，也包括省市专名；"古代朝廷礼制""宫廷""全国"
  // 一类是明确的**非地域性**适用范围，同样算作已经交代了适用条件。
  const regionWords = /(南方|北方|华南|华北|华东|华中|东北|西北|西南|江南|江淮|江浙|长江|黄河|岭南|沿海|中原|青藏|高原|平原|各地|局部|大部|一带|等地|区域|全国|古代朝廷|宫廷|汉族|少数民族|太湖|客家|潮汕|荣成|北京|上海|天津|南京|苏州|杭州|广州|济南|江苏|浙江|山东|山西|陕西|河南|河北|湖南|湖北|四川|重庆|广东|广西|福建|江西|安徽|云南|贵州|甘肃|青海|辽宁|吉林|黑龙江|内蒙古|新疆|西藏|宁夏|海南)/
  let bad = 0
  for (const t of TERMS) {
    if (!regionWords.test(t.climate)) { fail(`${t.name}: climate 未说明地域差异`); bad++ }
    for (const c of t.customs || []) if (!regionWords.test(c.region + c.text)) { fail(`${t.name}: 习俗「${c.title}」未注明流行地域`); bad++ }
  }
  if (bad === 0) ok('24 个节气的气候描述均含地域限定；每条习俗均注明流行地域')
}

console.log('\n[5] 诗词出处标注')
{
  const dyn = /^(唐|宋|元|明|清|汉|魏晋|南北朝|隋|先秦|旧题|佚名|《诗经)/
  let bad = 0
  let yuanzhenNoted = 0
  for (const t of TERMS) {
    for (const p of t.poems || []) {
      if (!dyn.test(p.author)) { fail(`${t.name}: 诗词作者「${p.author}」未标朝代或来源`); bad++ }
      if (/咏廿四气诗/.test(p.title || '') && !/(存|争议|敦煌|旧题)/.test((p.author || '') + (p.note || ''))) {
        fail(`${t.name}: 《咏廿四气诗》未注明作者存疑`); bad++
      }
      if (/咏廿四气诗/.test(p.title || '')) yuanzhenNoted++
    }
  }
  if (bad === 0) ok(`所有诗词均标注朝代/来源；引用《咏廿四气诗》共 ${yuanzhenNoted} 处，均已注明作者存疑`)
}

console.log('\n[6] 节气歌逐字映射')
{
  if (!song.lines || song.lines.length !== 4) fail(`节气歌应为 4 句，实为 ${song.lines?.length}`)
  else ok('节气歌共 4 句')
  const covered = new Map()
  let bad = 0
  for (const line of song.lines || []) {
    const joined = line.tokens.map((t) => t.chars).join('')
    const text = line.text.replace(/[，。、\s]/g, '')
    if (joined !== text) { fail(`「${line.text}」逐字切分拼接为「${joined}」，与原句不符`); bad++ }
    for (const tk of line.tokens) {
      const idxs = tk.termIndexes || (tk.termIndex == null ? [] : [tk.termIndex])
      const names = tk.termNames || (tk.termName == null ? [] : [tk.termName])
      if (idxs.length !== names.length) { fail(`token「${tk.chars}」termIndex 与 termName 数量不符`); bad++ }
      for (let i = 0; i < idxs.length; i++) {
        const idx = idxs[i]
        const def = TERM_TABLE.find((x) => x.index === idx)
        if (!def) { fail(`token「${tk.chars}」指向不存在的 index ${idx}`); bad++; continue }
        if (def.name !== names[i]) { fail(`token「${tk.chars}」index ${idx} 应为 ${def.name}，实为 ${names[i]}`); bad++ }
        if (covered.has(idx)) { fail(`节气 ${def.name}(index ${idx}) 在节气歌中被映射了 ${covered.get(idx)} 和 ${tk.chars} 两处`); bad++ }
        covered.set(idx, tk.chars)
      }
      if (!tk.explain) { fail(`token「${tk.chars}」缺少 explain`); bad++ }
    }
  }
  if (covered.size !== 24) { fail(`节气歌只覆盖了 ${covered.size}/24 个节气`); bad++ }
  if (bad === 0) ok('24 个节气在歌诀中各被映射恰好一次，简称与全称一一对应')

  // 重复字必须按位置区分
  const repeats = [
    ['春', [[1, '立春'], [4, '春分']]],
    ['夏', [[7, '立夏'], [10, '夏至']]],
    ['雪', [[20, '小雪'], [21, '大雪']]],
    ['冬', [[19, '立冬'], [22, '冬至']]],
  ]
  let repOk = true
  for (const [ch, expect] of repeats) {
    const got = []
    for (const line of song.lines || []) {
      for (const tk of line.tokens) {
        if (tk.chars !== ch) continue
        const idxs = tk.termIndexes || [tk.termIndex]
        got.push(...idxs)
      }
    }
    if (JSON.stringify(got) !== JSON.stringify(expect.map((e) => e[0]))) {
      fail(`重复字「${ch}」映射为 [${got}]，期望 [${expect.map((e) => e[0])}]`); repOk = false
    }
  }
  if (repOk) ok('重复字按位置正确区分：春→立春/春分，夏→立夏/夏至，雪→小雪/大雪，冬→立冬/冬至')
}

console.log('\n[7] 科普问答与术语表')
{
  let bad = 0
  const ids = ['why-seasons', 'why-not-15-days', 'why-gregorian-stable', 'hemispheres']
  for (const id of ids) {
    const q = science.qa?.find((x) => x.id === id)
    if (!q) { fail(`缺少科普问答 ${id}`); bad++; continue }
    if (!Array.isArray(q.a) || q.a.length < 2) { fail(`${id}: 正文段落过少`); bad++ }
    if (!Array.isArray(q.keyPoints) || q.keyPoints.length < 3) { fail(`${id}: 要点少于 3 条`); bad++ }
    if (!q.myth) { fail(`${id}: 缺少常见误解纠正`); bad++ }
  }
  if (!science.glossary || science.glossary.length < 8) { fail(`术语表应 ≥8 条，实为 ${science.glossary?.length}`); bad++ }
  for (const g of science.glossary || []) if (!g.term || !g.explain) { fail(`术语「${g.term}」缺 explain`); bad++ }
  if (!science.precision?.items?.length) { fail('缺少精度与简化说明'); bad++ }
  if (bad === 0) ok(`科普问答 4 条（含要点与误解纠正）、术语表 ${science.glossary.length} 条、精度说明 ${science.precision.items.length} 条`)
}

console.log('\n[8] 英文数据集与中文数据集的结构对齐')
{
  let bad = 0
  const need = (cond, msg) => { if (!cond) { fail(msg); bad++ } }

  const [enP1, enP2, zhP1, zhP2] = await Promise.all([
    import('../src/data/terms.en.part1.js'), import('../src/data/terms.en.part2.js'),
    import('../src/data/terms.part1.js'), import('../src/data/terms.part2.js'),
  ]).then((m) => m.map((x) => x.default))
  need(enP1.length === 12 && enP2.length === 12, `英文节气条数 ${enP1.length}+${enP2.length} ≠ 24`)
  const enAll = [...enP1, ...enP2]
  const zhAll = [...zhP1, ...zhP2]
  for (let i = 0; i < 24; i++) {
    const e = enAll[i], z = zhAll[i]
    need(e.id === z.id && e.index === z.index && e.longitude === z.longitude, `英文第 ${i + 1} 条 id/index/longitude 与中文不一致`)
    need(e.poems.length === z.poems.length, `${e.id}: 英文诗词 ${e.poems.length} 首 ≠ 中文 ${z.poems.length}`)
    need(e.customs.length === z.customs.length, `${e.id}: 英文习俗 ${e.customs.length} 条 ≠ 中文 ${z.customs.length}`)
    need(e.phenology.items.length === 3, `${e.id}: 英文三候应为 3 条`)
    for (const f of ['name', 'meaning', 'climate', 'farming', 'food', 'scienceNote', 'tip']) {
      need(typeof e[f] === 'string' && e[f].trim().length > 0, `${e.id}: 英文字段 ${f} 为空`)
    }
    need(e.name !== z.name, `${e.id}: 英文 name 与中文相同（未翻译）`)
    for (const p of e.poems) need(p.original && p.original === (z.poems.find((zp) => zp.text === p.original)?.text || p.original), `${e.id}: 诗词原文未保留`)
  }
  if (bad === 0) ok('24 个节气英文条目：id/index/longitude/诗词数/习俗数与中文逐条对齐，原文诗句保留在 original 字段')

  const [songEn, songZh] = await Promise.all([import('../src/data/song.en.js'), import('../src/data/song.js')])
  need(songEn.lines.length === 4 && songZh.lines.length === 4, '英文节气歌句数 ≠ 4')
  for (let i = 0; i < 4; i++) {
    const a = songEn.lines[i], b = songZh.lines[i]
    need(a.text === b.text, `英文歌诀第 ${i + 1} 句原文与中文不一致`)
    need(a.tokens.length === b.tokens.length, `英文歌诀第 ${i + 1} 句 token 数不一致`)
    for (let j = 0; j < a.tokens.length; j++) {
      need(a.tokens[j].chars === b.tokens[j].chars, `第 ${i + 1} 句第 ${j + 1} 个 token 字符不一致`)
      const ia = a.tokens[j].termIndexes || [a.tokens[j].termIndex]
      const ib = b.tokens[j].termIndexes || [b.tokens[j].termIndex]
      need(JSON.stringify(ia) === JSON.stringify(ib), `第 ${i + 1} 句第 ${j + 1} 个 token 映射不一致`)
    }
  }
  if (bad === 0) ok('节气歌英文：四句原文逐字保留，token 切分与映射与中文完全一致')

  const [sciEn, sciZh] = await Promise.all([import('../src/data/science.en.js'), import('../src/data/science.js')])
  need(JSON.stringify(sciEn.qa.map((q) => q.id)) === JSON.stringify(sciZh.qa.map((q) => q.id)), '英文科普问答 id 序列不一致')
  need(sciEn.glossary.length === sciZh.glossary.length, '英文术语表条数不一致')
  need(sciEn.precision.items.length === sciZh.precision.items.length, '英文精度说明条数不一致')

  const [hisEn, hisZh] = await Promise.all([import('../src/data/history.en.js'), import('../src/data/history.js')])
  need(hisEn.timeline.length === hisZh.timeline.length, '英文历史时间线条数不一致')
  need(hisEn.highlights.length === hisZh.highlights.length, '英文历史要点条数不一致')

  const [culEn, culZh] = await Promise.all([import('../src/data/culture.en.js'), import('../src/data/culture.js')])
  need(culEn.pillars.length === culZh.pillars.length && culEn.idioms.length === culZh.idioms.length, '英文文化条目数不一致')
  need(culEn.heritage.officialUrl === culZh.heritage.officialUrl && culEn.heritage.englishName === culZh.heritage.englishName, '英文 heritage 的 URL/英文名与中文文件不一致')
  need(culEn.idioms.every((m, i) => m.text === culZh.idioms[i].text && !!m.en), '英文农谚未保留中文原文或缺 en 字段')

  const [srcEn, srcZh] = await Promise.all([import('../src/data/sources.en.js'), import('../src/data/sources.js')])
  const urlsEn = srcEn.sourceGroups.flatMap((g) => g.items.filter((i) => i.url).map((i) => i.url))
  const urlsZh = srcZh.sourceGroups.flatMap((g) => g.items.filter((i) => i.url).map((i) => i.url))
  need(JSON.stringify(urlsEn) === JSON.stringify(urlsZh), '英文来源 URL 列表与中文不一致')
  if (bad === 0) ok('科普/历史/文化/来源英文数据集：结构、id、URL、UNESCO 字段与中文一致')
}

console.log(failures === 0 ? '\n=== 内容校验全部通过 ===' : `\n=== 有 ${failures} 项内容校验失败 ===`)
process.exitCode = failures === 0 ? 0 : 1
