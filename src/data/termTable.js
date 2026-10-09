/**
 * termTable.js — 二十四节气的基础天文定义（规范表）
 *
 * 这是全站唯一的"节气 ↔ 太阳黄经"权威映射，3D 场景、时间轴、列表、详情、
 * 节气歌全部从这里取值，避免各处各算一套导致错位。
 *
 * 约定：
 *  - longitude 为**太阳地心视黄经**（apparent geocentric ecliptic longitude），
 *    以春分点为 0°，沿黄道向东度量；春分 0°、夏至 90°、秋分 180°、冬至 270°。
 *  - index 1..24 从立春起算（这是中国现行通行的排序）。
 *  - kind：奇数序位为"节"，偶数序位为"中气"（传统历法以中气定月、无中气之月置闰）。
 *  - major：二分二至，是季节转折的天文节点，在轨道上重点突出。
 *  - seedMonth/seedDay 只是**求交节时刻时的搜索起点近似值**，
 *    真实的交节时刻由 lib/astro.js 的天文搜索得出，绝不直接使用本表日期。
 */

export const TERM_TABLE = [
  { index: 1,  id: 'lichun',     name: '立春', pinyin: 'Lì Chūn',   longitude: 315, season: '春', kind: '节',  major: false, seedMonth: 2,  seedDay: 4  },
  { index: 2,  id: 'yushui',     name: '雨水', pinyin: 'Yǔ Shuǐ',   longitude: 330, season: '春', kind: '中气', major: false, seedMonth: 2,  seedDay: 19 },
  { index: 3,  id: 'jingzhe',    name: '惊蛰', pinyin: 'Jīng Zhé',  longitude: 345, season: '春', kind: '节',  major: false, seedMonth: 3,  seedDay: 6  },
  { index: 4,  id: 'chunfen',    name: '春分', pinyin: 'Chūn Fēn',  longitude: 0,   season: '春', kind: '中气', major: true,  seedMonth: 3,  seedDay: 21 },
  { index: 5,  id: 'qingming',   name: '清明', pinyin: 'Qīng Míng', longitude: 15,  season: '春', kind: '节',  major: false, seedMonth: 4,  seedDay: 5  },
  { index: 6,  id: 'guyu',       name: '谷雨', pinyin: 'Gǔ Yǔ',     longitude: 30,  season: '春', kind: '中气', major: false, seedMonth: 4,  seedDay: 20 },

  { index: 7,  id: 'lixia',      name: '立夏', pinyin: 'Lì Xià',    longitude: 45,  season: '夏', kind: '节',  major: false, seedMonth: 5,  seedDay: 6  },
  { index: 8,  id: 'xiaoman',    name: '小满', pinyin: 'Xiǎo Mǎn',  longitude: 60,  season: '夏', kind: '中气', major: false, seedMonth: 5,  seedDay: 21 },
  { index: 9,  id: 'mangzhong',  name: '芒种', pinyin: 'Máng Zhòng',longitude: 75,  season: '夏', kind: '节',  major: false, seedMonth: 6,  seedDay: 6  },
  { index: 10, id: 'xiazhi',     name: '夏至', pinyin: 'Xià Zhì',   longitude: 90,  season: '夏', kind: '中气', major: true,  seedMonth: 6,  seedDay: 21 },
  { index: 11, id: 'xiaoshu',    name: '小暑', pinyin: 'Xiǎo Shǔ',  longitude: 105, season: '夏', kind: '节',  major: false, seedMonth: 7,  seedDay: 7  },
  { index: 12, id: 'dashu',      name: '大暑', pinyin: 'Dà Shǔ',    longitude: 120, season: '夏', kind: '中气', major: false, seedMonth: 7,  seedDay: 23 },

  { index: 13, id: 'liqiu',      name: '立秋', pinyin: 'Lì Qiū',    longitude: 135, season: '秋', kind: '节',  major: false, seedMonth: 8,  seedDay: 7  },
  { index: 14, id: 'chushu',     name: '处暑', pinyin: 'Chǔ Shǔ',   longitude: 150, season: '秋', kind: '中气', major: false, seedMonth: 8,  seedDay: 23 },
  { index: 15, id: 'bailu',      name: '白露', pinyin: 'Bái Lù',    longitude: 165, season: '秋', kind: '节',  major: false, seedMonth: 9,  seedDay: 8  },
  { index: 16, id: 'qiufen',     name: '秋分', pinyin: 'Qiū Fēn',   longitude: 180, season: '秋', kind: '中气', major: true,  seedMonth: 9,  seedDay: 23 },
  { index: 17, id: 'hanlu',      name: '寒露', pinyin: 'Hán Lù',    longitude: 195, season: '秋', kind: '节',  major: false, seedMonth: 10, seedDay: 8  },
  { index: 18, id: 'shuangjiang',name: '霜降', pinyin: 'Shuāng Jiàng', longitude: 210, season: '秋', kind: '中气', major: false, seedMonth: 10, seedDay: 23 },

  { index: 19, id: 'lidong',     name: '立冬', pinyin: 'Lì Dōng',   longitude: 225, season: '冬', kind: '节',  major: false, seedMonth: 11, seedDay: 7  },
  { index: 20, id: 'xiaoxue',    name: '小雪', pinyin: 'Xiǎo Xuě',  longitude: 240, season: '冬', kind: '中气', major: false, seedMonth: 11, seedDay: 22 },
  { index: 21, id: 'daxue',      name: '大雪', pinyin: 'Dà Xuě',    longitude: 255, season: '冬', kind: '节',  major: false, seedMonth: 12, seedDay: 7  },
  { index: 22, id: 'dongzhi',    name: '冬至', pinyin: 'Dōng Zhì',  longitude: 270, season: '冬', kind: '中气', major: true,  seedMonth: 12, seedDay: 22 },
  { index: 23, id: 'xiaohan',    name: '小寒', pinyin: 'Xiǎo Hán',  longitude: 285, season: '冬', kind: '节',  major: false, seedMonth: 1,  seedDay: 6  },
  { index: 24, id: 'dahan',      name: '大寒', pinyin: 'Dà Hán',    longitude: 300, season: '冬', kind: '中气', major: false, seedMonth: 1,  seedDay: 20 },
]

export const SEASON_COLOR = {
  春: '#7bd389',
  夏: '#f2b64c',
  秋: '#e08a4b',
  冬: '#7fb3e0',
}

export const SEASON_ORDER = ['春', '夏', '秋', '冬']

export const TERM_BY_INDEX = new Map(TERM_TABLE.map((t) => [t.index, t]))
export const TERM_BY_ID = new Map(TERM_TABLE.map((t) => [t.id, t]))

export function termByIndex(i) {
  return TERM_BY_INDEX.get(((i - 1 + 24) % 24) + 1)
}

export function termById(id) {
  return TERM_BY_ID.get(id)
}
