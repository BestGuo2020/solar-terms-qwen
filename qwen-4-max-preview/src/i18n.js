import { ref } from 'vue'

export const locale = ref('zh')
export const setLocale = (l) => {
  locale.value = l
  document.documentElement.lang = l === 'zh' ? 'zh-CN' : 'en'
  document.title = l === 'zh'
    ? '二十四节气 · 太阳的旅程 | The 24 Solar Terms'
    : 'The 24 Solar Terms · A Journey with the Sun'
}

const S = {
  appTitle: { zh: '二十四节气', en: 'The 24 Solar Terms' },
  appSubtitle: { zh: '太阳的旅程 · 互动天文科普', en: 'A Journey with the Sun · Interactive Astronomy' },
  navScene: { zh: '3D 演示', en: '3D Scene' },
  navHistory: { zh: '历史渊源', en: 'History' },
  navCulture: { zh: '文化价值', en: 'Culture' },
  navSong: { zh: '节气歌', en: 'Song' },
  navScience: { zh: '天文科普', en: 'Science' },
  navSources: { zh: '参考来源', en: 'Sources' },
  langBtn: { zh: 'EN', en: '中文' },
  langBtnLabel: { zh: '切换为英文', en: 'Switch to Chinese' },

  beijingTime: { zh: '北京时间', en: 'Beijing Time' },
  liveBadge: { zh: '实时', en: 'LIVE' },
  simBadge: { zh: '模拟时间', en: 'SIMULATED' },
  simHint: { zh: '演示时间已偏离现实时间', en: 'Demo time differs from real time' },
  solarLon: { zh: '太阳视黄经', en: 'Solar longitude' },
  currentTermLabel: { zh: '当前节气', en: 'Current term' },
  enteredAt: { zh: '进入于', en: 'Since' },
  nextTermLabel: { zh: '下一节气', en: 'Next term' },
  beginsAt: { zh: '交节于', en: 'Begins' },
  untilNext: { zh: '距下一节气', en: 'Until next term' },
  scaleNote: { zh: '尺寸与距离不按实际比例', en: 'Sizes & distances not to scale' },
  loading: { zh: '正在加载地球纹理…', en: 'Loading Earth textures…' },
  textureFallback: { zh: '部分纹理加载失败，已使用程序化替代纹理', en: 'Some textures failed to load — procedural fallbacks in use' },
  webglFail: { zh: '当前环境不支持 WebGL，已切换为平面轨道示意（交互功能保持可用）', en: 'WebGL unavailable — showing a 2D orbit diagram (controls still work)' },

  cameraTitle: { zh: '视角', en: 'View' },
  camOverview: { zh: '轨道总览', en: 'Orbit overview' },
  camEarth: { zh: '地球近景', en: 'Earth close-up' },
  camReset: { zh: '恢复默认', en: 'Reset view' },
  helpersTitle: { zh: '辅助标识', en: 'Guides' },
  helpAxis: { zh: '地轴', en: 'Axis' },
  helpEquator: { zh: '赤道', en: 'Equator' },
  helpTropics: { zh: '回归线', en: 'Tropics' },
  helpDirection: { zh: '公转方向', en: 'Orbit direction' },
  helpSunLine: { zh: '日地连线', en: 'Sun–Earth line' },
  helpLabels: { zh: '节气标签', en: 'Term labels' },
  qualityTitle: { zh: '画质', en: 'Quality' },
  qAuto: { zh: '自动', en: 'Auto' },
  qHigh: { zh: '高', en: 'High' },
  qLow: { zh: '低', en: 'Low' },
  dragHint: { zh: '拖动旋转 · 滚轮缩放 · 点击节气标记跳转', en: 'Drag to orbit · Scroll to zoom · Click a term marker to jump' },

  play: { zh: '播放', en: 'Play' },
  pause: { zh: '暂停', en: 'Pause' },
  speed: { zh: '速度', en: 'Speed' },
  speedReal: { zh: '实时 ×1', en: 'Real time ×1' },
  speedMin: { zh: '1 分钟/秒', en: '1 min / sec' },
  speedHour: { zh: '1 小时/秒', en: '1 hour / sec' },
  speedDay: { zh: '1 天/秒', en: '1 day / sec' },
  speedWeek: { zh: '1 周/秒', en: '1 week / sec' },
  speedMonth: { zh: '30 天/秒', en: '30 days / sec' },
  dateLabel: { zh: '日期时间', en: 'Date & time' },
  yearLabel: { zh: '年份', en: 'Year' },
  today: { zh: '回到今天', en: 'Back to today' },
  timelineLabel: { zh: '年度时间轴（拖动选择日期）', en: 'Year timeline (drag to pick a date)' },
  yearRange: { zh: '支持 1900–2100 年', en: 'Years 1900–2100 supported' },

  detailTitle: { zh: '节气详情', en: 'Term Details' },
  termListTitle: { zh: '二十四节气一览', en: 'All 24 Terms' },
  termListHint: { zh: '点击跳转到该节气交节时刻', en: 'Click to jump to the term’s exact instant' },
  orderLabel: { zh: '序', en: 'No.' },
  lonLabel: { zh: '黄经', en: 'Longitude' },
  seasonLabel: { zh: '季节', en: 'Season' },
  meaningTitle: { zh: '名称含义', en: 'Meaning' },
  climateTitle: { zh: '气候', en: 'Climate' },
  phenologyTitle: { zh: '物候', en: 'Phenology' },
  farmingTitle: { zh: '农事', en: 'Farming' },
  customsTitle: { zh: '习俗 · 饮食', en: 'Customs & Food' },
  poemTitle: { zh: '诗词', en: 'Poetry' },
  prevTerm: { zh: '上一节气', en: 'Previous term' },
  nextTerm: { zh: '下一节气', en: 'Next term' },
  regionalNote: { zh: '气候、物候与习俗描述以中国中东部季风区为主要参照，各地存在差异；传统物候与习俗同现代科学解释分别表述。', en: 'Climate, phenology and customs mainly reference central-eastern monsoon China and vary by region; traditional lore is presented separately from scientific explanations.' },
  poemNote: { zh: '英译为意译', en: 'English lines are free translations' },
  majorTerm: { zh: '分至点', en: 'Equinox / Solstice' },

  historyTitle: { zh: '历史渊源', en: 'Historical Roots' },
  historySub: { zh: '从观象授时到人类非遗——二十四节气如何走过三千年', en: 'From sky-watching to world heritage — three millennia of the solar terms' },
  cultureTitle: { zh: '文化价值', en: 'Cultural Value' },
  cultureSub: { zh: '节气不只是日历，更是生活的节律', en: 'More than a calendar — a rhythm for living' },
  songSub: { zh: '四句歌诀记住二十四节气，点击简称联动 3D 场景', en: 'Four lines to remember all 24 terms — click any abbreviation to explore' },
  scienceTitle: { zh: '天文科普', en: 'The Astronomy Behind' },
  scienceSub: { zh: '用通俗语言回答五个常见问题', en: 'Five common questions, in plain language' },
  sourcesTitle: { zh: '参考来源与说明', en: 'Sources & Notes' },
  sourcesSub: { zh: '历史、科学与文化内容的依据', en: 'Basis for the history, science and culture content' },
  textureCreditTitle: { zh: '纹理与图片许可', en: 'Texture & Image Credits' },
  textureCredit: { zh: '地球日面（Blue Marble）、夜光、云层、地形与水体纹理源自 NASA Visible Earth 公有领域影像，经 three.js / three-globe 示例分发；太阳表面与星空为程序化生成。', en: 'Earth day (Blue Marble), night lights, clouds, topology and water masks derive from NASA Visible Earth public-domain imagery, distributed via three.js / three-globe examples; the sun surface and starfield are procedurally generated.' },
  footerNote: { zh: '本站为科普演示项目。天文计算为实时求解，非固定日期表。', en: 'An educational demo. Astronomical values are solved live, not read from a fixed date table.' },
  keyboardHint: { zh: '快捷键：空格 播放/暂停 · T 回到今天 · 1/2/3 切换视角', en: 'Shortcuts: Space play/pause · T today · 1/2/3 camera views' },

  dayUnit: { zh: '天', en: 'd' },
  hourUnit: { zh: '小时', en: 'h' },
  minUnit: { zh: '分', en: 'm' },
  atInstant: { zh: '交节时刻', en: 'Exact instant' },
  inProgress: { zh: '节气区间进行中', en: 'Term in progress' },
  progressLabel: { zh: '本节气进度', en: 'Term progress' },
  seasonSpring: { zh: '春季', en: 'Spring' },
  seasonSummer: { zh: '夏季', en: 'Summer' },
  seasonAutumn: { zh: '秋季', en: 'Autumn' },
  seasonWinter: { zh: '冬季', en: 'Winter' },
  monthNames: { zh: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'], en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] },
  jumpToScene: { zh: '回到 3D 场景', en: 'Back to the 3D scene' },
  termOf: { zh: '第 {n} 个节气', en: 'Term {n} of 24' }
}

export const t = (key) => {
  const e = S[key]
  if (!e) return key
  return e[locale.value] ?? e.zh
}

export const SPEED_OPTIONS = [
  { value: 1, key: 'speedReal' },
  { value: 60, key: 'speedMin' },
  { value: 3600, key: 'speedHour' },
  { value: 86400, key: 'speedDay' },
  { value: 604800, key: 'speedWeek' },
  { value: 2592000, key: 'speedMonth' }
]