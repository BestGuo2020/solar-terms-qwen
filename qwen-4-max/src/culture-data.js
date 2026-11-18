// History, cultural value, the interactive solar-term song, science explanations,
// and references. Key dates and sources are verified against standard references.

export const HISTORY = [
  {
    era: { zh: '上古 · 约公元前2000年以前', en: 'High antiquity · before ~2000 BCE' },
    zh: { title: '观象授时', desc: '先民观察日影、星象与物候以定季节。《尚书·尧典》记载以“鸟、火、虚、昴”四仲中星昏见来确定春分、夏至、秋分、冬至的雏形。' },
    en: { title: 'Observing the sky to keep time', desc: 'Early peoples watched shadows, stars, and phenology to fix the seasons. The Book of Documents (Yao Dian) records using four "mid-season" stars at dusk to mark the equinoxes and solstices in embryo.' },
  },
  {
    era: { zh: '春秋战国 · 前770–前221', en: 'Spring & Autumn / Warring States · 770–221 BCE' },
    zh: { title: '分至启闭与圭表测影', desc: '《左传》已见“分、至、启、闭”（二分、二至、四立）的记载。人们用圭表测量正午日影长短，确定冬至与夏至，进而推算其余节气。' },
    en: { title: 'Equinoxes, solstices, and the gnomon', desc: 'The Zuo Zhuan already mentions "divisions, arrivals, openings, closings" (the equinoxes, solstices, and four starts). Noon shadow lengths measured with a gnomon fixed the solstices, from which other terms were reckoned.' },
  },
  {
    era: { zh: '西汉 · 《淮南子》约前139年', en: 'Western Han · Huainanzi, ~139 BCE' },
    zh: { title: '二十四节气首次完整记载', desc: '《淮南子·天文训》完整列出与现代一致的二十四节气全部名称，是现存最早的系统记载，标志节气体系基本定型。' },
    en: { title: 'First complete record of all 24 terms', desc: 'The "Tianwen Xun" chapter of the Huainanzi lists all twenty-four names matching the modern set — the earliest surviving systematic record, marking the system’s consolidation.' },
  },
  {
    era: { zh: '西汉 · 太初历 前104年', en: 'Western Han · Taichu Calendar, 104 BCE' },
    zh: { title: '节气正式纳入历法', desc: '汉武帝颁行《太初历》，将二十四节气纳入历法体系，并以“无中气之月”置闰，使节气与月份协调，指导农事。' },
    en: { title: 'Terms incorporated into the calendar', desc: 'Emperor Wu promulgated the Taichu Calendar, embedding the terms into the calendar and inserting leap months where no "mid-climate" term fell, aligning terms with months to guide farming.' },
  },
  {
    era: { zh: '元 · 授时历 1281年', en: 'Yuan · Shoushi Calendar, 1281 CE' },
    zh: { title: '精密测定回归年', desc: '郭守敬、王恂等编成《授时历》，测定回归年长度为365.2425日，与现行公历所用数值相同，领先世界三百余年。' },
    en: { title: 'A precise tropical year', desc: 'Guo Shoujing, Wang Xun, and others compiled the Shoushi Calendar, measuring the tropical year as 365.2425 days — the same value the Gregorian calendar uses, centuries ahead of its time.' },
  },
  {
    era: { zh: '清 · 时宪历 1645年', en: 'Qing · Shixian Calendar, 1645 CE' },
    zh: { title: '由“平气”改用“定气”', desc: '《时宪历》改用“定气”注历：按太阳黄经每15°确定一个节气，而非把一年平均分成24段。这一方法更准确反映太阳位置，沿用至今。' },
    en: { title: 'From "mean" to "true" terms', desc: 'The Shixian Calendar adopted "true terms": each term is fixed by the sun reaching a multiple of 15° of ecliptic longitude, rather than dividing the year into 24 equal time spans. This reflects the sun’s position more accurately and is still used today.' },
  },
  {
    era: { zh: '2016年11月30日', en: '30 November 2016' },
    zh: { title: '列入人类非物质文化遗产', desc: '联合国教科文组织将“二十四节气——中国人通过观察太阳周年运动而形成的时间知识体系及其实践”列入人类非物质文化遗产代表作名录。' },
    en: { title: 'Inscribed as intangible cultural heritage', desc: 'UNESCO inscribed "The Twenty-Four Solar Terms — knowledge in China of time and practices developed through observation of the sun’s annual motion" on the Representative List of the Intangible Cultural Heritage of Humanity.' },
  },
];

export const CULTURE = [
  {
    zh: { title: '农业生产', desc: '节气是传统农时的标尺。农谚如“清明前后，种瓜点豆”“白露早，寒露迟，秋分种麦正当时”（华北），把天文规律转化为可操作的播种、收获时机，至今仍在指导农耕。' },
    en: { title: 'Agriculture', desc: 'The terms are a ruler of traditional farming time. Proverbs such as "around Qingming, plant melons and beans" and "White Dew is early, Cold Dew late — sowing wheat at Autumn Equinox is just right" (North China) turn astronomical patterns into actionable sowing and harvest times still used today.' },
    icon: '🌾',
  },
  {
    zh: { title: '日常生活', desc: '饮食起居顺时而变：立春“咬春”、清明青团、冬至北方饺子南方汤圆。人们依节气安排衣食养生，形成富有地方色彩的生活节奏。' },
    en: { title: 'Daily life', desc: 'Food and routine follow the season: "biting spring" at Lichun, green rice balls at Qingming, dumplings in the north and tangyuan in the south at Winter Solstice. People arrange diet and wellness by the terms, forming locally flavored rhythms of life.' },
    icon: '🏮',
  },
  {
    zh: { title: '文学艺术', desc: '节气入诗入画，寄寓时序之感。元稹《咏廿四气诗》逐节吟咏，杜甫“露从今夜白，月是故乡明”借白露抒怀，成为中华文化独特的时间美学。' },
    en: { title: 'Literature & art', desc: 'The terms enter poetry and painting as markers of time’s passage. Yuan Zhen’s "Poems on the Twenty-Four Solar Terms" chants each one, and Du Fu’s "from tonight the dew turns white; the moon is brightest in my homeland" turns White Dew into longing — a distinctive aesthetics of time.' },
    icon: '📜',
  },
  {
    zh: { title: '地方习俗', desc: '清明踏青扫墓、芒种送花神、冬至祭祖数九、霜降赏菊食柿。同一节气在不同地域衍生出多样习俗，体现文化的丰富与包容。' },
    en: { title: 'Local customs', desc: 'Spring outings and tomb-sweeping at Qingming, bidding farewell to the flower goddess at Mangzhong, ancestor worship and counting nines at Winter Solstice, chrysanthemums and persimmons at Frost’s Descent. One term spawns diverse customs across regions, showing cultural richness.' },
    icon: '🎎',
  },
  {
    zh: { title: '非遗传承', desc: '2016年列入联合国教科文组织非遗名录后，节气知识通过社区实践、节庆活动与学校教育代际相传，成为连接传统与现代生活的活态文化遗产。' },
    en: { title: 'Heritage transmission', desc: 'Since the 2016 UNESCO inscription, term knowledge is passed down through community practice, festivals, and schooling — a living heritage linking tradition with modern life.' },
    icon: '🧧',
  },
];

// The common four-line song. Each token maps a character (or pair) to a term index
// by its position, so repeated 春/夏/雪/冬 resolve correctly. `null` = non-term filler.
export const SONG = {
  title: { zh: '二十四节气歌', en: 'The Song of the Twenty-Four Solar Terms' },
  lines: [
    {
      text: '春雨惊春清谷天',
      tokens: [
        { ch: '春', term: 0 }, { ch: '雨', term: 1 }, { ch: '惊', term: 2 },
        { ch: '春', term: 3 }, { ch: '清', term: 4 }, { ch: '谷', term: 5 }, { ch: '天', term: null },
      ],
      explain: {
        zh: '立春、雨水、惊蛰、春分、清明、谷雨。“天”为衬字，无实义。',
        en: 'Start of Spring, Rain Water, Awakening of Insects, Spring Equinox, Pure Brightness, Grain Rain. "天" is a filler word with no term meaning.',
      },
    },
    {
      text: '夏满芒夏暑相连',
      tokens: [
        { ch: '夏', term: 6 }, { ch: '满', term: 7 }, { ch: '芒', term: 8 },
        { ch: '夏', term: 9 }, { ch: '暑', term: 10 }, { ch: '相连', term: 11 },
      ],
      explain: {
        zh: '立夏、小满、芒种、夏至、小暑、大暑。“暑相连”指小暑、大暑相接，此处“相连”代指大暑。',
        en: 'Start of Summer, Grain Buds, Grain in Ear, Summer Solstice, Minor Heat, Major Heat. "暑相连" means Minor and Major Heat follow one another; here "相连" stands for Major Heat.',
      },
    },
    {
      text: '秋处露秋寒霜降',
      tokens: [
        { ch: '秋', term: 12 }, { ch: '处', term: 13 }, { ch: '露', term: 14 },
        { ch: '秋', term: 15 }, { ch: '寒', term: 16 }, { ch: '霜降', term: 17 },
      ],
      explain: {
        zh: '立秋、处暑、白露、秋分、寒露、霜降。',
        en: 'Start of Autumn, End of Heat, White Dew, Autumn Equinox, Cold Dew, Frost’s Descent.',
      },
    },
    {
      text: '冬雪雪冬小大寒',
      tokens: [
        { ch: '冬', term: 18 }, { ch: '雪', term: 19 }, { ch: '雪', term: 20 },
        { ch: '冬', term: 21 }, { ch: '小', term: 22 }, { ch: '大寒', term: 23 },
      ],
      explain: {
        zh: '立冬、小雪、大雪、冬至、小寒、大寒。两个“雪”分别指小雪与大雪。',
        en: 'Start of Winter, Minor Snow, Major Snow, Winter Solstice, Minor Cold, Major Cold. The two "雪" stand for Minor Snow and Major Snow respectively.',
      },
    },
  ],
  note: {
    zh: '点击歌中任意简称，即可跳转到对应节气并联动 3D 场景。重复出现的“春”“夏”“雪”“冬”按所在顺序分别对应不同节气。',
    en: 'Click any abbreviation to jump to that term and sync the 3D scene. Repeated "春/夏/雪/冬" map to different terms by their position.',
  },
};

export const SCIENCE = [
  {
    zh: { q: '为什么会有四季？', a: '地球自转轴相对公转轨道面倾斜约23.4°，且一年中指向基本不变。绕太阳公转时，太阳直射点在南北回归线之间移动，使各地正午太阳高度与昼夜长短发生周期变化，从而形成四季。南北半球季节相反：北半球夏至时，南半球正值冬季。' },
    en: { q: 'Why do we have seasons?', a: 'Earth’s spin axis is tilted about 23.4° from its orbital plane and keeps nearly the same direction in space all year. As Earth orbits, the sun’s direct point moves between the tropics, changing the noon sun height and day length at each place — producing the seasons. The hemispheres are opposite: at the northern Summer Solstice, the south is in winter.' },
  },
  {
    zh: { q: '为什么节气不是固定每15天一次？', a: '节气按太阳黄经每15°划分，而地球公转速度并不均匀（开普勒第二定律）：1月初过近日点时最快，7月初过远日点时最慢。因此太阳走过15°所需时间不同，相邻节气间隔约14.7～15.7天，冬季短、夏季长。' },
    en: { q: 'Why aren’t terms exactly 15 days apart?', a: 'Terms are defined by each 15° of solar longitude, but Earth’s orbital speed is not uniform (Kepler’s second law): fastest at perihelion in early January, slowest at aphelion in early July. So the time to cover 15° varies — gaps range about 14.7–15.7 days, shorter in winter and longer in summer.' },
  },
  {
    zh: { q: '为什么节气的公历日期比较稳定？', a: '公历是阳历，通过闰年规则使历年长度接近回归年（约365.2425日）。节气由太阳黄经决定，与回归年同步，因此同一节气的公历日期基本固定，前后仅差1～2天；而农历以月相定月，节气在农历中的日期浮动较大。' },
    en: { q: 'Why are term dates stable in the Gregorian calendar?', a: 'The Gregorian calendar is solar: leap-year rules keep the year close to the tropical year (~365.2425 days). Since terms are fixed by solar longitude and thus sync with the tropical year, a given term falls on nearly the same Gregorian date (within 1–2 days). The lunar-based Chinese calendar, by contrast, lets term dates drift widely.' },
  },
  {
    zh: { q: '“平气”与“定气”有何不同？', a: '古代历法曾把一个回归年按时间平均分成24段来注节气，称“平气”。清《时宪历》（1645年）起改用“定气”，按太阳黄经每15°确定节气。定气能真实反映太阳在黄道上的位置，因此各节气间隔不等，也更贴合季节变化。' },
    en: { q: 'What is the difference between "mean" and "true" terms?', a: 'Older calendars divided the tropical year into 24 equal time spans ("mean terms"). From the Qing Shixian Calendar (1645), "true terms" fix each term by 15° of solar longitude. True terms reflect the sun’s actual position on the ecliptic, so gaps are unequal and better match the seasons.' },
  },
];

export const REFERENCES = [
  { zh: '联合国教科文组织《保护非物质文化遗产公约》名录：二十四节气（2016年列入）。', en: 'UNESCO Representative List of the Intangible Cultural Heritage of Humanity: The Twenty-Four Solar Terms (inscribed 2016).', url: 'https://ich.unesco.org/en/lists' },
  { zh: '天文计算：astronomy-engine（基于 VSOP87 与 Jean Meeus《天文算法》），太阳视黄经精度约角秒级。', en: 'Astronomical computation: astronomy-engine (VSOP87 / Jean Meeus, Astronomical Algorithms), apparent solar longitude accurate to ~arcseconds.', url: 'https://github.com/cosinekitty/astronomy' },
  { zh: '视角交互：Three.js OrbitControls 官方文档。', en: 'Camera interaction: Three.js OrbitControls documentation.', url: 'https://threejs.org/docs/#examples/en/controls/OrbitControls' },
  { zh: '历史文献：《尚书·尧典》《左传》《淮南子·天文训》及《太初历》《授时历》《时宪历》相关记载。', en: 'Historical sources: Book of Documents (Yao Dian), Zuo Zhuan, Huainanzi (Tianwen Xun), and records of the Taichu, Shoushi, and Shixian calendars.', url: '' },
  { zh: '地球与太阳纹理：Solar System Scope，CC BY 4.0 许可。', en: 'Earth and Sun textures: Solar System Scope, licensed CC BY 4.0.', url: 'https://www.solarsystemscope.com/textures/' },
];

export const DATA_NOTE = {
  zh: '交节时刻由 astronomy-engine 按太阳视黄经实时计算（非固定日期表），支持年份 1900–2100，界面时间统一为北京时间（Asia/Shanghai, UTC+8）。在该年份范围内，交节时刻精度约 ±1 分钟。3D 场景中天体大小与日地距离不按实际比例。',
  en: 'Term instants are computed live from apparent solar longitude by astronomy-engine (not a fixed date table), for years 1900–2100, with all interface times in Beijing time (Asia/Shanghai, UTC+8). Within this range, term instants are accurate to about ±1 minute. Body sizes and the Sun–Earth distance in the 3D scene are not to scale.',
};