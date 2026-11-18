/**
 * 阅读区内容：历史渊源 / 文化价值 / 节气歌 / 天文科普 / 参考来源（双语）
 * 关键年代与文献均已核对；节气歌逐字映射按所在位置区分重复字。
 */

export const HISTORY = [
  {
    era: { zh: '上古 · 观象授时', en: 'Antiquity · Reading the Sky' },
    year: { zh: '传说时代—西周', en: 'Legendary era – Western Zhou' },
    zh: '先民通过观察星象与日影确定季节。《尚书·尧典》记载以“鸟、火、虚、昴”四组星象定四季仲月，是二分二至的雏形；“土圭测影”则以日影长短变化判断时节。',
    en: 'Early communities fixed the seasons by stars and gnomon shadows. The Shangshu (Book of Documents, “Canon of Yao”) records four star groups — Bird, Fire, Xu and Mao — marking the mid-season months, the embryo of the equinoxes and solstices; the earth-gnomon measured the sun’s shadow to tell the time of year.'
  },
  {
    era: { zh: '春秋战国 · 八节形成', en: 'Spring & Autumn – Warring States · Eight Nodes' },
    year: { zh: '公元前 770—前 221 年', en: '770–221 BCE' },
    zh: '二分（春分、秋分）、二至（夏至、冬至）与四立（立春、立夏、立秋、立冬）逐步确立。约成书于公元前 239 年的《吕氏春秋》“十二纪”已系统记载八节与相应物候、政令。',
    en: 'The two equinoxes, two solstices and four “starts” took shape. The Lüshi Chunqiu (c. 239 BCE) systematically records these eight nodes with their phenology and seasonal ordinances in its “Twelve Almanacs.”'
  },
  {
    era: { zh: '西汉 · 二十四节气完备', en: 'Western Han · The Full Twenty-Four' },
    year: { zh: '约公元前 139 年', en: 'c. 139 BCE' },
    zh: '《淮南子·天文训》首次完整记载二十四节气的全部名称与顺序，与今天使用的名称基本一致，标志节气体系定型。',
    en: 'The Huainanzi (“Treatise on Astronomy”) gives the first complete record of all twenty-four names in order — essentially the names still used today — marking the system’s maturity.'
  },
  {
    era: { zh: '西汉 · 纳入历法', en: 'Western Han · Into the Calendar' },
    year: { zh: '公元前 104 年', en: '104 BCE' },
    zh: '《太初历》正式将二十四节气编入国家历法，并确立“无中气之月为闰月”的置闰规则，使阴阳合历与太阳周年运动协调，节气自此成为历法核心成分。',
    en: 'The Taichu calendar officially incorporated the solar terms and set the rule that a lunar month without a “mid-climate” term becomes a leap month — harmonizing the lunisolar calendar with the sun’s annual motion.'
  },
  {
    era: { zh: '汉—元 · 七十二候完善', en: 'Han–Yuan · The Seventy-Two Pentads' },
    year: { zh: '约公元前 1 世纪—公元 14 世纪', en: 'c. 1st century BCE – 14th century CE' },
    zh: '每个节气再分三候，形成“七十二候”物候历。《逸周书·时训解》载其早期形态，元代吴澄《月令七十二候集解》系统解释各候，成为后世理解节气物候的经典。',
    en: 'Each term was divided into three pentads, forming a 72-pentad phenological calendar. The Yizhoushu preserves its early form; Wu Cheng’s Yuan-dynasty commentary on the seventy-two pentads became the classic reference.'
  },
  {
    era: { zh: '清 · 定气注历', en: 'Qing · True-Solar Terms' },
    year: { zh: '公元 1645 年', en: '1645 CE' },
    zh: '《时宪历》改用“定气”：以太阳在黄道上实际位置每行 15° 定一个节气（此前“平气”将一年时间均分）。因地球公转速度不均，节气间隔从此有长有短，此法沿用至今。',
    en: 'The Shixian calendar switched to “true terms”: one term per 15° of the sun’s actual motion along the ecliptic, replacing the old equal-time division. Because Earth’s orbital speed varies, term lengths now differ — the method still in use.'
  },
  {
    era: { zh: '当代 · 国家级非遗', en: 'Modern · National Heritage' },
    year: { zh: '公元 2006 年', en: '2006 CE' },
    zh: '“农历二十四节气”列入第一批国家级非物质文化遗产名录，相关民俗实践得到系统保护。',
    en: '“The Twenty-Four Solar Terms of the traditional calendar” were inscribed on China’s first national list of intangible cultural heritage, giving related folk practices systematic protection.'
  },
  {
    era: { zh: '当代 · 人类非遗', en: 'Modern · World Heritage' },
    year: { zh: '公元 2016 年 11 月 30 日', en: '30 November 2016' },
    zh: '联合国教科文组织将“二十四节气——中国人通过观察太阳周年运动而形成的时间知识体系及其实践”列入人类非物质文化遗产代表作名录。',
    en: 'UNESCO inscribed “The Twenty-Four Solar Terms — knowledge of time and practices developed in China through observation of the sun’s annual motion” on the Representative List of the Intangible Cultural Heritage of Humanity.'
  }
]

export const CULTURE = [
  {
    icon: 'grain',
    title: { zh: '农业之纲', en: 'Guide to Farming' },
    zh: '节气是传统农业的时间坐标。“清明前后，种瓜点豆”“白露早，寒露迟，秋分种麦正当时”等农谚把播种、田管、收获与天象绑定，至今仍在指导农事安排与农业气候区划。',
    en: 'The terms are agriculture’s timetable. Proverbs like “Around Qingming, plant melons and beans” and “White Dew is early, Cold Dew late — Autumn Equinox is just right for wheat” bind sowing, field care and harvest to the sky, and still guide farming decisions today.'
  },
  {
    icon: 'bowl',
    title: { zh: '生活之节', en: 'Rhythm of Daily Life' },
    zh: '饮食起居顺应四时：立春“咬春”、清明青团、立秋“贴秋膘”、冬至北方饺子南方汤圆。节气提醒人们添减衣物、调整饮食，是中国人安排生活的天然节律。',
    en: 'Food and daily routines follow the seasons: “biting spring” at Lichun, qingtuan at Qingming, “autumn fat” at Liqiu, dumplings in the north and tangyuan in the south at Dongzhi. The terms cue when to add layers and change the menu — a natural rhythm for living.'
  },
  {
    icon: 'brush',
    title: { zh: '文艺之源', en: 'Wellspring of Arts' },
    zh: '节气入诗入画：杜牧《清明》、杜甫《小至》传诵千年；历代《月令图》描绘岁时风物；《红楼梦》写芒种日大观园“送花神”。节气为文学艺术提供了共享的时间意象。',
    en: 'The terms live in poetry and painting: Du Mu’s “Qingming” and Du Fu’s “Xiaozhi” have been recited for a millennium; seasonal “Yueling” paintings depict the year’s scenery; Dream of the Red Chamber stages the flower-goddess farewell on Mangzhong. They give the arts a shared imagery of time.'
  },
  {
    icon: 'lantern',
    title: { zh: '地方之俗', en: 'Local Customs' },
    zh: '各地衍生出鲜活的节气实践：浙江衢州九华立春祭、贵州石阡“说春”、浙江三门祭冬、广西天等壮族霜降节、湖南安仁“赶分社”等，都是列入非遗保护的代表性社区活动。',
    en: 'Regions have grown vivid term customs: the Jiuhua Start-of-Spring rite in Quzhou, Zhejiang; “Speaking Spring” in Shiqian, Guizhou; the Winter Sacrifice in Sanmen, Zhejiang; the Zhuang Frost’s Descent Festival in Tiandeng, Guangxi; and the “Ganfenshe” fair in Anren, Hunan — all heritage-protected community events.'
  },
  {
    icon: 'seal',
    title: { zh: '非遗传承', en: 'Living Heritage' },
    zh: '2016 年列入联合国教科文组织人类非遗代表作名录后，节气知识通过社区实践、学校教育、文创设计与现代农业品牌持续活化，成为连接传统与当代生活的文化纽带。',
    en: 'Since the 2016 UNESCO inscription, solar-term knowledge stays alive through community practice, school education, creative design and modern farm brands — a cultural bridge linking tradition with contemporary life.'
  }
]

// 节气歌（流传最广的四句版）。tokens 按位置映射节气索引，重复字各归其位。
export const SONG = {
  title: { zh: '二十四节气歌', en: 'The Solar Terms Song' },
  note: {
    zh: '这是流传最广的四句版本，每句对应一季。“天”为衬字，“暑相连”指小暑、大暑相连。点击任一简称，即可在 3D 场景中查看对应节气。',
    en: 'The most widespread four-line version — one line per season. “Tian” is a filler word; “shu xiang lian” means Minor and Major Heat follow each other. Click any abbreviation to see that term in the 3D scene.'
  },
  lines: [
    {
      text: '春雨惊春清谷天',
      tokens: [
        { ch: '春', term: 0 }, { ch: '雨', term: 1 }, { ch: '惊', term: 2 },
        { ch: '春', term: 3 }, { ch: '清', term: 4 }, { ch: '谷', term: 5 }, { ch: '天', term: null }
      ],
      explain: { zh: '立春 · 雨水 · 惊蛰 · 春分 · 清明 · 谷雨', en: 'Start of Spring · Rain Water · Awakening of Insects · Spring Equinox · Pure Brightness · Grain Rain' }
    },
    {
      text: '夏满芒夏暑相连',
      tokens: [
        { ch: '夏', term: 6 }, { ch: '满', term: 7 }, { ch: '芒', term: 8 },
        { ch: '夏', term: 9 }, { ch: '暑', term: 10 }, { ch: '相连', term: 11 }
      ],
      explain: { zh: '立夏 · 小满 · 芒种 · 夏至 · 小暑 · 大暑（暑相连）', en: 'Start of Summer · Grain Buds · Grain in Ear · Summer Solstice · Minor Heat · Major Heat (the two heats together)' }
    },
    {
      text: '秋处露秋寒霜降',
      tokens: [
        { ch: '秋', term: 12 }, { ch: '处', term: 13 }, { ch: '露', term: 14 },
        { ch: '秋', term: 15 }, { ch: '寒', term: 16 }, { ch: '霜降', term: 17 }
      ],
      explain: { zh: '立秋 · 处暑 · 白露 · 秋分 · 寒露 · 霜降', en: 'Start of Autumn · End of Heat · White Dew · Autumn Equinox · Cold Dew · Frost’s Descent' }
    },
    {
      text: '冬雪雪冬小大寒',
      tokens: [
        { ch: '冬', term: 18 }, { ch: '雪', term: 19 }, { ch: '雪', term: 20 },
        { ch: '冬', term: 21 }, { ch: '小', term: 22 }, { ch: '大寒', term: 23 }
      ],
      explain: { zh: '立冬 · 小雪 · 大雪 · 冬至 · 小寒 · 大寒', en: 'Start of Winter · Minor Snow · Major Snow · Winter Solstice · Minor Cold · Major Cold' }
    }
  ]
}

export const SCIENCE = [
  {
    icon: 'tilt',
    q: { zh: '为什么会有四季？', en: 'Why do we have seasons?' },
    zh: '地轴相对公转轨道面倾斜约 23.4°，且一年中指向基本不变。地球绕太阳公转时，太阳直射点在南北回归线之间往返移动，各地正午太阳高度与昼夜长短随之变化，接收的太阳热量出现周年起伏，形成四季。四季并非由日地距离造成——北半球冬季时，地球反而接近轨道近日点。南北半球季节正好相反。',
    en: 'Earth’s axis is tilted about 23.4° from the orbital plane and keeps nearly the same direction in space all year. As Earth orbits, the sun’s direct rays migrate between the two tropics, changing each place’s noon sun height and day length — and thus its annual heat budget. That produces the seasons. Distance is not the cause: Earth is actually near perihelion during northern winter. The two hemispheres experience opposite seasons.',
    jump: { term: 9, zh: '在 3D 场景中看夏至', en: 'See Summer Solstice in 3D' }
  },
  {
    icon: 'ellipse',
    q: { zh: '为什么节气不是固定每 15 天一次？', en: 'Why isn’t each term exactly 15 days apart?' },
    zh: '节气按太阳视黄经每 15° 划分，而地球轨道是椭圆。根据开普勒第二定律，地球在近日点（1 月初）附近运行快，太阳黄经变化快，相邻节气间隔可短至约 14.7 天；在远日点（7 月初）附近运行慢，间隔可长达约 15.7 天。所以冬季节气密、夏季节气疏。',
    en: 'Terms are spaced by 15° of solar longitude, but Earth’s orbit is an ellipse. By Kepler’s second law, Earth moves faster near perihelion (early January), so terms there can be as short as ~14.7 days; near aphelion (early July) it moves slower, stretching gaps to ~15.7 days. Winter terms cluster; summer terms spread out.',
    jump: { term: 21, zh: '在 3D 场景中看冬至', en: 'See Winter Solstice in 3D' }
  },
  {
    icon: 'calendar',
    q: { zh: '为什么节气在公历中的日期比较稳定？', en: 'Why are term dates so stable in the Gregorian calendar?' },
    zh: '节气本质是太阳历成分：一个回归年约 365.2422 天。公历平年 365 天、闰年 366 天，平均 365.2425 天，与回归年几乎一致，因此每个节气的公历日期只在 1—2 天内波动（如春分总在 3 月 20—21 日）。而农历是阴阳合历，月份跟随月相，节气的农历日期每年变化很大。',
    en: 'The terms are inherently solar: a tropical year is ~365.2422 days. The Gregorian calendar averages 365.2425 days (365 or 366 with leap years), almost identical — so each term’s Gregorian date wobbles by only a day or two (the Spring Equinox always falls on March 20–21). The traditional Chinese calendar is lunisolar, so term dates there shift widely from year to year.',
    jump: { term: 3, zh: '在 3D 场景中看春分', en: 'See Spring Equinox in 3D' }
  },
  {
    icon: 'angle',
    q: { zh: '什么是太阳黄经？', en: 'What is solar (ecliptic) longitude?' },
    zh: '从地球上看，太阳一年在恒星背景上走过的路径叫“黄道”。以春分点为 0° 起点，沿黄道向东度量 0°—360°，就是太阳视黄经。太阳每前进 15° 就是一个节气：春分 0°、夏至 90°、秋分 180°、冬至 270°。本站 3D 场景中的轨道角度与黄经严格对应。',
    en: 'Seen from Earth, the sun traces a path against the stars over a year — the ecliptic. Measuring eastward from the Spring Equinox point (0°) to 360° gives the sun’s apparent ecliptic longitude. Every 15° is one term: Spring Equinox 0°, Summer Solstice 90°, Autumn Equinox 180°, Winter Solstice 270°. The orbit angles in this site’s 3D scene map exactly to these longitudes.',
    jump: { term: 15, zh: '在 3D 场景中看秋分', en: 'See Autumn Equinox in 3D' }
  },
  {
    icon: 'thermo',
    q: { zh: '为什么最热、最冷不在夏至、冬至？', en: 'Why aren’t the hottest and coldest days at the solstices?' },
    zh: '地面与大气储存热量需要时间：夏至后虽然白昼渐短，但收入仍大于支出，热量继续累积，最热出现在此后的“三伏”；冬至后热量继续亏缺，最冷出现在“三九四九”。就像一天中最热通常在午后两点，而不是正午。',
    en: 'Land and air take time to store and release heat. After the Summer Solstice, days shorten but income still exceeds loss, so heat keeps building — the hottest “sanfu” days come later. After the Winter Solstice, the deficit continues, and the coldest days arrive in the “third and fourth nines.” Just as the hottest part of a day is usually mid-afternoon, not noon.',
    jump: { term: 12, zh: '在 3D 场景中看大暑', en: 'See Major Heat in 3D' }
  }
]

export const REFERENCES = [
  {
    zh: '联合国教科文组织：二十四节气（人类非物质文化遗产代表作名录，2016）',
    en: 'UNESCO: The Twenty-Four Solar Terms (Representative List of Intangible Cultural Heritage, 2016)',
    url: 'https://ich.unesco.org/en/RL/00647'
  },
  {
    zh: 'Jean Meeus,《Astronomical Algorithms》第 2 版, Willmann-Bell, 1998（VSOP87 截断级数、章动、光行差）',
    en: 'Jean Meeus, Astronomical Algorithms, 2nd ed., Willmann-Bell, 1998 (truncated VSOP87, nutation, aberration)',
    url: null
  },
  {
    zh: 'Espenak & Meeus, Five Millennium Canon of Solar Eclipses, NASA, 2006（ΔT 多项式）',
    en: 'Espenak & Meeus, Five Millennium Canon of Solar Eclipses, NASA, 2006 (ΔT polynomials)',
    url: null
  },
  {
    zh: '中国科学院紫金山天文台《中国天文年历》（交节时刻参照）',
    en: 'Purple Mountain Observatory, Chinese Astronomical Almanac (reference for term instants)',
    url: null
  },
  {
    zh: '《淮南子·天文训》《尚书·尧典》《吕氏春秋·十二纪》《月令七十二候集解》（元·吴澄）',
    en: 'Huainanzi · Shangshu · Lüshi Chunqiu · Wu Cheng’s Commentary on the Seventy-Two Pentads (Yuan dynasty)',
    url: null
  },
  {
    zh: 'NASA Visible Earth / Blue Marble 地球影像（公有领域），经 three.js / three-globe 示例纹理分发',
    en: 'NASA Visible Earth / Blue Marble imagery (public domain), distributed via three.js / three-globe example textures',
    url: 'https://visibleearth.nasa.gov/collection/1484/blue-marble'
  },
  {
    zh: 'Three.js OrbitControls 交互文档',
    en: 'Three.js OrbitControls documentation',
    url: 'https://threejs.org/docs/#examples/en/controls/OrbitControls'
  }
]

export const ACCURACY_NOTE = {
  zh: '交节时刻由 VSOP87 截断级数 + 章动/光行差 + ΔT 修正实时计算（非固定日期表），与权威历书偏差通常在 1 分钟以内；支持年份 1900–2100；界面时间均为北京时间（Asia/Shanghai, UTC+8）。1645 年《时宪历》起采用“定气”注历，此前为“平气”，本站按现代定气方法计算。',
  en: 'Term instants are computed live from a truncated VSOP87 series with nutation, aberration and ΔT corrections (not a fixed date table); agreement with authoritative almanacs is typically within one minute. Supported years: 1900–2100. All displayed times are Beijing time (Asia/Shanghai, UTC+8). Since the Shixian calendar of 1645, terms follow the sun’s true longitude (“true terms”); this site uses that modern method.'
}

export const SCALE_NOTE = {
  zh: '为便于观察，天体尺寸与日地距离经过放大调整，不按实际比例；轨道偏心率被夸大显示，实际地球轨道接近正圆。',
  en: 'Body sizes and the Sun–Earth distance are enlarged for visibility and not to scale; orbital eccentricity is exaggerated for display — Earth’s real orbit is nearly circular.'
}