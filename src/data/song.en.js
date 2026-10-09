// Song of the 24 Solar Terms — the traditional version, annotated character by character (English)
// termIndex runs from 1 to 24 (Start of Spring = 1, Rain Water = 2, …, Major Cold = 24); filler characters are null.
// When one token covers two solar terms ("暑相连", "小大寒"), the plural fields termIndexes / termNames are used.

export const fullText = "春雨惊春清谷天，夏满芒夏暑相连。\n秋处露秋寒霜降，冬雪雪冬小大寒。";

export const lines = [
  {
    text: "春雨惊春清谷天",
    tokens: [
      {
        chars: "春",
        termIndex: 1,
        termName: "Start of Spring",
        explain: "春 chun = Start of Spring (Lichun): the first 春 in the song heads the 24 solar terms and marks the beginning of spring; folk custom treated 'striking the spring ox' (da chun) as the starting gun of the farming year."
      },
      {
        chars: "雨",
        termIndex: 2,
        termName: "Rain Water",
        explain: "雨 yu = Rain Water (Yushui): rain takes the place of snow as precipitation increases, temperatures rise and moisture returns, greening the overwintering crops — the character 雨 'rain' names this turning point."
      },
      {
        chars: "惊",
        termIndex: 3,
        termName: "Awakening of Insects",
        explain: "惊 jing = Awakening of Insects (Jingzhe): the first spring thunder was thought to startle (惊) the insects hibernating in the soil — hence the name, anciently called Qizhe, 'the opening of hibernation'."
      },
      {
        chars: "春",
        termIndex: 4,
        termName: "Spring Equinox",
        explain: "春 chun = Spring Equinox (Chunfen): the second 春 is the equinox — the Sun stands directly over the equator, day and night are nearly equal worldwide, and 分 fen 'to divide' halves spring into two equal parts."
      },
      {
        chars: "清",
        termIndex: 5,
        termName: "Pure Brightness",
        explain: "清 qing = Pure Brightness (Qingming): the character evokes 'clear, bright weather and sprouting plants'; Qingming is both a solar term and the traditional festival of tomb-sweeping and spring outings."
      },
      {
        chars: "谷",
        termIndex: 6,
        termName: "Grain Rain",
        explain: "谷 gu = Grain Rain (Guyu): 'rain brings forth the hundred grains' — rainfall increases markedly, making this the best season for sowing, transplanting seedlings and planting melons and beans."
      },
      {
        chars: "天",
        termIndex: null,
        termName: null,
        explain: "天 tian is a filler character (termIndex null): it stands for no solar term; it merely completes the seven-character line and keeps the rhyme."
      }
    ]
  },
  {
    text: "夏满芒夏暑相连",
    tokens: [
      {
        chars: "夏",
        termIndex: 7,
        termName: "Start of Summer",
        explain: "夏 xia = Start of Summer (Lixia): the first 夏 marks summer's beginning — temperatures climb noticeably and the spring-sown crops enter their most vigorous growth."
      },
      {
        chars: "满",
        termIndex: 8,
        termName: "Grain Buds",
        explain: "满 man = Grain Buds (Xiaoman, 'Lesser Fullness'): the grains of summer-ripening cereals begin to swell and fill (满) but are not yet ripe — only 'slightly full', hence the name."
      },
      {
        chars: "芒",
        termIndex: 9,
        termName: "Grain in Ear",
        explain: "芒 mang = Grain in Ear (Mangzhong, 'Awninged Grain'): awn-bearing cereals such as wheat ripen for harvest while late rice and millet must be sown in haste — harvest and sowing overlap, as the farm proverb says, 'at Grain in Ear, plant in a flurry'."
      },
      {
        chars: "夏",
        termIndex: 10,
        termName: "Summer Solstice",
        explain: "夏 xia = Summer Solstice (Xiazhi): the second 夏 is the solstice — the Sun stands over the Tropic of Cancer, the Northern Hemisphere has its longest day and shortest night, and summer reaches its extreme here."
      },
      {
        chars: "暑相连",
        termIndexes: [11, 12],
        termNames: ["Minor Heat", "Major Heat"],
        explain: "暑相连 shu xiang lian = 'the heats come back to back': these three characters jointly name two consecutive terms, Minor Heat (Xiaoshu) and Major Heat (Dashu) — the heat builds step by step, and around Major Heat falls the hottest stretch of the year."
      }
    ]
  },
  {
    text: "秋处露秋寒霜降",
    tokens: [
      {
        chars: "秋",
        termIndex: 13,
        termName: "Start of Autumn",
        explain: "秋 qiu = Start of Autumn (Liqiu): the first 秋 marks autumn's beginning, but the summer heat has not yet gone — the south often endures an 'autumn tiger', a late heat wave, before it truly cools."
      },
      {
        chars: "处",
        termIndex: 14,
        termName: "End of Heat",
        explain: "处 chu = End of Heat (Chushu): 处 means 'to stop, to withdraw' — the scorching summer heat comes to an end here, and temperatures begin to fall noticeably."
      },
      {
        chars: "露",
        termIndex: 15,
        termName: "White Dew",
        explain: "露 lu = White Dew (Bailu): as the day-night temperature gap widens, night-time moisture condenses on grass and leaves into glistening, whitish dewdrops — hence 'White Dew'."
      },
      {
        chars: "秋",
        termIndex: 16,
        termName: "Autumn Equinox",
        explain: "秋 qiu = Autumn Equinox (Qiufen): the second 秋 is the equinox — the Sun again stands over the equator, day and night are equal, and autumn is halved."
      },
      {
        chars: "寒",
        termIndex: 17,
        termName: "Cold Dew",
        explain: "寒 han = Cold Dew (Hanlu): the dew grows heavier and colder, all but freezing into frost — the cold deepens one more step beyond White Dew."
      },
      {
        chars: "霜降",
        termIndex: 18,
        termName: "Frost's Descent",
        explain: "霜降 shuang jiang = Frost's Descent: the two characters simply are the term's name — cold-air surges strengthen and the first frost appears in the north; it is the last solar term of autumn."
      }
    ]
  },
  {
    text: "冬雪雪冬小大寒",
    tokens: [
      {
        chars: "冬",
        termIndex: 19,
        termName: "Start of Winter",
        explain: "冬 dong = Start of Winter (Lidong): the first 冬 marks winter's beginning — all things are gathered in and sheltered from the cold, and farm work enters its resting period."
      },
      {
        chars: "雪",
        termIndex: 20,
        termName: "Minor Snow",
        explain: "雪 xue = Minor Snow (Xiaoxue): the first 雪 — cold air turns active and snow begins, but lightly, and it does not yet settle on the ground: hence 'Minor Snow'."
      },
      {
        chars: "雪",
        termIndex: 21,
        termName: "Major Snow",
        explain: "雪 xue = Major Snow (Daxue): the second 雪 — snow covers a wider area and falls more heavily than at Minor Snow; in the north the fields keep a snow blanket that 'quilts' the wheat seedlings through the winter."
      },
      {
        chars: "冬",
        termIndex: 22,
        termName: "Winter Solstice",
        explain: "冬 dong = Winter Solstice (Dongzhi): the second 冬 is the solstice — the Sun stands over the Tropic of Capricorn, the Northern Hemisphere has its shortest day and longest night, after which the days gradually lengthen again."
      },
      {
        chars: "小大寒",
        termIndexes: [23, 24],
        termNames: ["Minor Cold", "Major Cold"],
        explain: "小大寒 xiao da han = 'Minor and Major Cold': these three characters jointly name the year's last two terms, Minor Cold (Xiaohan) and Major Cold (Dahan) — around Major Cold falls the coldest stretch, and once the cold runs its course spring returns: Start of Spring follows close behind."
      }
    ]
  }
];

export const dateMnemonic = {
  text: "每月两节不变更，最多相差一两天。\n上半年来六廿一，下半年是八廿三。",
  explain: [
    "Two terms each month, never changing: every Gregorian month normally contains two solar terms — a 'jie' sectional term (such as Start of Spring or Awakening of Insects) in the first half of the month, and a 'zhongqi' mid-climate (such as Rain Water or Spring Equinox) in the second half.",
    "First half of the year: the 6th and the 21st — from January to June the terms fall roughly around the 6th and the 21st of each month.",
    "Second half of the year: the 8th and the 23rd — from July to December they fall roughly around the 8th and the 23rd.",
    "At most a day or two off: because the tropical year is about 365.2422 days and the Gregorian calendar corrects it with leap years, the actual dates fluctuate within a range of 1–2 days."
  ],
  caveat: "These four lines are an approximate mnemonic meant for easy recitation: they only say 'roughly which days', not the exact dates. On this project's pages, the term instants shown are computed astronomically from the Sun's apparent ecliptic longitude and converted uniformly to Beijing Time (UTC+8), accurate to the minute. Because of leap-year placement and changes in Earth's orbital speed, in particular years an individual term may deviate from the mnemonic by more than two days — always rely on the precise term instants."
};

export const about = {
  title: "About the Solar Terms Song",
  text: "The Song of the 24 Solar Terms is a folk seven-character mnemonic verse compiled to help people memorise the 24 solar terms. Its author is unknown, and it circulated in several versions with slight differences of wording; this page adopts the four most commonly transmitted lines, plus the four sequel lines giving Gregorian dates. Each character (or group of two or three characters) corresponds in order to one solar term: the 28 characters embed all 24 terms, and only 天, the last character of the first line, is a filler for metre and rhyme. Repeated characters point to different terms in order — the two 春 are Start of Spring and Spring Equinox, and the two 雪 are Minor Snow and Major Snow. Worth noting is the distinction between jie and zhongqi: of the 24 solar terms, the 12 in odd-numbered positions — Start of Spring, Awakening of Insects, Pure Brightness and so on — are called jie, 'sectional terms' (solar terms in the narrow sense), while the 12 in even-numbered positions — Rain Water, Spring Equinox, Grain Rain and so on — are called zhongqi, 'mid-climates'. The traditional Chinese calendar fixes its months by the mid-climates: a lunisolar month that contains no mid-climate is made a leap month. This 'no mid-climate, leap month' rule was established by the Taichu Calendar of the Western Han and has been in use ever since."
};
