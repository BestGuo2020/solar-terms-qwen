/**
 * terms.js — 节气内容数据的合并入口
 *
 * 规范表（src/data/termTable.js）提供天文定义：id / 名称 / index / 黄经 / 季节 /
 * 节或中气 / 是否二分二至；内容文件（terms.part1.js、terms.part2.js）提供科普文案。
 * 这里把两者按 id 合并，并做一致性校验——**天文定义以规范表为准**，
 * 内容文件里若有不一致会被覆盖并在开发期打印警告，避免文案与黄经错位。
 */

import { TERM_TABLE, SEASON_COLOR } from './termTable.js'
import part1 from './terms.part1.js'
import part2 from './terms.part2.js'

const content = new Map()
for (const c of [...part1, ...part2]) content.set(c.id, c)

const warnings = []

export const TERMS = TERM_TABLE.map((def) => {
  const c = content.get(def.id)
  if (!c) {
    warnings.push(`缺少节气内容：${def.name} (${def.id})`)
    return { ...def, color: SEASON_COLOR[def.season], missing: true }
  }
  // 一致性校验：内容文件里的 index / longitude / name / season 必须与规范表相同
  if (c.index !== def.index) warnings.push(`${def.name}: index ${c.index} ≠ 规范表 ${def.index}`)
  if (c.longitude !== def.longitude) warnings.push(`${def.name}: longitude ${c.longitude} ≠ 规范表 ${def.longitude}`)
  if (c.name !== def.name) warnings.push(`${def.name}: name 内容文件写作 ${c.name}`)
  if (c.season !== def.season) warnings.push(`${def.name}: season ${c.season} ≠ 规范表 ${def.season}`)

  const merged = {
    ...def,                 // 天文定义优先（后展开的会覆盖同名字段，所以放在前面）
    ...c,
    // 覆盖回规范值，确保任何情况下都不会错位
    id: def.id,
    name: def.name,
    index: def.index,
    longitude: def.longitude,
    season: def.season,
    kind: def.kind,
    major: def.major,
    pinyin: c.pinyin || def.pinyin,
    color: SEASON_COLOR[def.season],
  }
  return merged
})

/** 未使用的多余内容条目（拼写错误的 id 会在这里暴露） */
for (const c of content.values()) {
  if (!TERM_TABLE.some((d) => d.id === c.id)) warnings.push(`内容文件出现未知节气 id：${c.id}`)
}

export const TERM_COUNT = TERMS.length

if (warnings.length && typeof console !== 'undefined') {
  console.warn('[terms] 数据一致性警告：\n' + warnings.map((w) => '  · ' + w).join('\n'))
}

export const termWarnings = warnings

export const TERMS_BY_INDEX = new Map(TERMS.map((t) => [t.index, t]))
export const TERMS_BY_ID = new Map(TERMS.map((t) => [t.id, t]))
export const getTerm = (index) => TERMS_BY_INDEX.get(((index - 1 + 24) % 24) + 1)
