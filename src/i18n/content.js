/**
 * i18n/content.js — 按当前语言选择内容数据集
 *
 * 界面 chrome 文案走 i18n/index.js 的词典；**内容型长文**（24 节气文案、
 * 历史、文化、节气歌、科普、来源）走这里：中文读 src/data/*.js，
 * 英文读 src/data/*.en.js，结构一一对应。
 *
 * 每个节气对象在两种语言下都额外规范化出：
 *   · title    该语言下的主标题（中=汉字，英=英文名）
 *   · subtitle 副标题（中=拼音，英=汉字 · 拼音）
 *   · hanzi    汉字名（两种语言都保留，轨道标签与对照用）
 *   · season   始终是中文季节字（春夏秋冬），供 SEASON_COLOR 与时间轴色带使用
 *   · seasonWord 该语言下的季节词
 */
import { computed } from 'vue'
import { locale } from './index.js'
import { TERMS as TERMS_ZH } from '../data/terms.js'
import { TERM_TABLE, SEASON_COLOR } from '../data/termTable.js'

import termsEnP1 from '../data/terms.en.part1.js'
import termsEnP2 from '../data/terms.en.part2.js'
import * as historyZh from '../data/history.js'
import * as historyEn from '../data/history.en.js'
import * as cultureZh from '../data/culture.js'
import * as cultureEn from '../data/culture.en.js'
import * as songZh from '../data/song.js'
import * as songEn from '../data/song.en.js'
import * as scienceZh from '../data/science.js'
import * as scienceEn from '../data/science.en.js'
import * as sourcesZh from '../data/sources.js'
import * as sourcesEn from '../data/sources.en.js'

const SEASON_WORD = {
  zh: { 春: '春', 夏: '夏', 秋: '秋', 冬: '冬' },
  en: { 春: 'Spring', 夏: 'Summer', 秋: 'Autumn', 冬: 'Winter' },
}
const KIND_WORD = {
  zh: { 节: '节', 中气: '中气' },
  en: { 节: 'sectional term', 中气: 'mid-climate' },
}

function buildZh() {
  const terms = TERMS_ZH.map((t) => ({
    ...t,
    hanzi: t.name,
    title: t.name,
    subtitle: t.pinyin,
    seasonWord: SEASON_WORD.zh[t.season],
    kindWord: KIND_WORD.zh[t.kind],
    color: SEASON_COLOR[t.season],
  }))
  return {
    lang: 'zh',
    terms,
    termsByIndex: new Map(terms.map((t) => [t.index, t])),
    termsById: new Map(terms.map((t) => [t.id, t])),
    history: historyZh,
    culture: cultureZh,
    song: songZh,
    science: scienceZh,
    sources: sourcesZh,
    seasonWord: (s) => SEASON_WORD.zh[s] || s,
    kindWord: (k) => KIND_WORD.zh[k] || k,
  }
}

function buildEn() {
  const byId = new Map([...termsEnP1, ...termsEnP2].map((t) => [t.id, t]))
  const terms = TERM_TABLE.map((def) => {
    const en = byId.get(def.id) || {}
    const merged = {
      ...def,
      ...en,
      // 规范字段以 termTable 为准，杜绝错位
      id: def.id, index: def.index, longitude: def.longitude,
      season: def.season, kind: def.kind, major: def.major,
      hanzi: en.hanzi || def.name,
      name: en.name || def.name,
      pinyin: en.pinyin || def.pinyin,
      title: en.name || def.name,
      subtitle: `${en.hanzi || def.name} · ${en.pinyin || def.pinyin}`,
      seasonWord: SEASON_WORD.en[def.season],
      kindWord: KIND_WORD.en[def.kind],
      color: SEASON_COLOR[def.season],
    }
    return merged
  })
  return {
    lang: 'en',
    terms,
    termsByIndex: new Map(terms.map((t) => [t.index, t])),
    termsById: new Map(terms.map((t) => [t.id, t])),
    history: historyEn,
    culture: cultureEn,
    song: songEn,
    science: scienceEn,
    sources: sourcesEn,
    seasonWord: (s) => SEASON_WORD.en[s] || s,
    kindWord: (k) => KIND_WORD.en[k] || k,
  }
}

let _zh = null
let _en = null
function zh() { return _zh || (_zh = buildZh()) }
function en() { return _en || (_en = buildEn()) }

/** 当前语言的内容数据集（响应式） */
export const content = computed(() => (locale.value === 'en' ? en() : zh()))

/** 供非组件代码（如 SceneManager 的轨道标签）读取当前内容 */
export function currentContent() {
  return locale.value === 'en' ? en() : zh()
}

export { SEASON_COLOR }
