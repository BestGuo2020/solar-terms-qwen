/**
 * 二十四节气完整双语数据
 * 顺序：立春(0) → 大寒(23)；黄经为太阳地心视黄经（度）。
 * 气候/物候描述以中国中东部季风区为参照，各地存在差异（界面另有全局说明）。
 * 物候"初候"引自《月令七十二候集解》（元·吴澄）体系；诗词均注明作者与出处。
 */

export const SEASONS = {
  spring: { zh: '春', en: 'Spring', color: '#5fae7f', glow: '#7fd6a2' },
  summer: { zh: '夏', en: 'Summer', color: '#d4573b', glow: '#ff8a63' },
  autumn: { zh: '秋', en: 'Autumn', color: '#d99a3d', glow: '#ffc766' },
  winter: { zh: '冬', en: 'Winter', color: '#5b8fb9', glow: '#8fc3e8' }
}

export const TERMS = [
  {
    id: 'lichun', lon: 315, season: 'spring', major: false,
    zh: {
      name: '立春', pinyin: 'Lìchūn',
      meaning: '“立”是开始。立春标志春季的起点，万物闭藏的冬天过去，阳气初生。',
      climate: '气温总体回升，但冷空气仍频繁。北方大多仍在冰点以下，华南已明显回暖，各地差异很大。',
      phenology: '初候“东风解冻”：东风送暖，大地开始解冻。',
      farming: '备耕选种、积肥送粪；华南开始早稻育秧，北方仍以防寒保墒为主。',
      customs: '“咬春”吃春饼与萝卜，“打春牛”劝农，民间迎春、贴春字。',
      poem: { text: '春日春盘细生菜，忽忆两京梅发时。', author: '杜甫', source: '《立春》' }
    },
    en: {
      name: 'Start of Spring',
      meaning: '“Li” means “to begin.” Lichun marks spring’s start — winter’s dormancy ends and yang energy begins to rise.',
      climate: 'Temperatures trend upward, but cold snaps remain frequent. Most of the north stays below freezing while South China warms noticeably — conditions vary widely by region.',
      phenology: 'First pentad: “East winds thaw the freeze” — warming easterlies begin to loosen the frozen ground.',
      farming: 'Prepare fields, select seed and spread manure; early-rice seedlings start in South China, while the north focuses on cold protection and soil moisture.',
      customs: '“Biting spring” — eating spring pancakes and radish; whipping the clay “spring ox” to urge farming; welcoming-spring festivities.',
      poem: { text: 'Spring plates of tender greens on a spring day — suddenly I recall the plum blossoms of the two capitals.', author: 'Du Fu', source: '“Lichun”' }
    }
  },
  {
    id: 'yushui', lon: 330, season: 'spring', major: false,
    zh: {
      name: '雨水', pinyin: 'Yǔshuǐ',
      meaning: '降水开始增多，形式由雪渐转为雨，故名“雨水”。',
      climate: '南方降雨明显增多，北方仍可能降雪，“倒春寒”常见。',
      phenology: '初候“獭祭鱼”：水獭开始捕鱼，将鱼摆列岸边，如祭祀一般。',
      farming: '冬小麦返青需水，南方早稻育秧，北方顶凌耙地保墒。',
      customs: '川西“回娘屋”、女婿“接寿”；民间占稻色，祈丰收。',
      poem: { text: '好雨知时节，当春乃发生。', author: '杜甫', source: '《春夜喜雨》' }
    },
    en: {
      name: 'Rain Water',
      meaning: 'Precipitation increases and falls more as rain than snow — hence “Rain Water.”',
      climate: 'Rain picks up across the south; the north may still see snow, and late cold snaps (“reverse spring cold”) are common.',
      phenology: 'First pentad: “Otters sacrifice fish” — otters begin fishing, lining their catch on the bank as if in offering.',
      farming: 'Winter wheat greens up and needs moisture; southern farmers raise early-rice seedlings, northern farmers harrow thawing soil to keep it moist.',
      customs: 'In western Sichuan, married daughters visit their parents and sons-in-law honor elders’ longevity; folk customs divine the rice harvest.',
      poem: { text: 'Good rain knows its season; when spring arrives, it brings life.', author: 'Du Fu', source: '“Happy Rain on a Spring Night”' }
    }
  },
  {
    id: 'jingzhe', lon: 345, season: 'spring', major: false,
    zh: {
      name: '惊蛰', pinyin: 'Jīngzhé',
      meaning: '春雷始鸣，惊醒蛰伏越冬的昆虫。实际上气温回升才是昆虫苏醒的主因。',
      climate: '全国大部快速回暖，初雷多出现在南方；北方仍干燥多风。',
      phenology: '初候“桃始华”：桃花开始绽放。',
      farming: '春耕由南向北展开，果树清园、防虫育苗。',
      customs: '吃梨（寓“离”虫害）、祭白虎、蒙鼓皮，部分地区“打小人”。',
      poem: { text: '微雨众卉新，一雷惊蛰始。', author: '韦应物', source: '《观田家》' }
    },
    en: {
      name: 'Awakening of Insects',
      meaning: 'Spring thunder is said to wake hibernating insects. In reality, rising temperatures — not the thunder itself — end their dormancy.',
      climate: 'Most regions warm quickly; first thunder usually sounds in the south, while the north stays dry and windy.',
      phenology: 'First pentad: “Peaches begin to blossom.”',
      farming: 'Spring plowing advances from south to north; orchards are cleaned, pest control and seedling care begin.',
      customs: 'Eating pears (a pun on “leaving” pests behind), offerings to the White Tiger, re-covering drums; some regions perform “beating the petty person” rites.',
      poem: { text: 'Light rain refreshes every plant; one clap of thunder begins Jingzhe.', author: 'Wei Yingwu', source: '“Watching the Farmhouse”' }
    }
  },
  {
    id: 'chunfen', lon: 0, season: 'spring', major: true,
    zh: {
      name: '春分', pinyin: 'Chūnfēn',
      meaning: '太阳直射赤道，全球昼夜几乎等长；此日也平分春季三个月，故称“春分”。',
      climate: '北半球升温加快，南方进入前汛期；北方多风沙，冷暖空气交汇频繁。',
      phenology: '初候“玄鸟至”：燕子从南方飞来。',
      farming: '春播大忙，“春分麦起身，一刻值千金”；冬小麦拔节，早稻播种。',
      customs: '竖蛋游戏、吃春菜、放风筝；古代皇家有祭日礼制。',
      poem: { text: '仲春初四日，春色正中分。', author: '徐铉', source: '《春分日》' }
    },
    en: {
      name: 'Spring Equinox',
      meaning: 'The sun shines directly on the equator and day and night are nearly equal worldwide; the day also halves the three months of spring.',
      climate: 'The Northern Hemisphere warms rapidly; South China enters its early rainy season, while the north sees frequent clashes of cold and warm air and dusty winds.',
      phenology: 'First pentad: “Swallows arrive” — swallows return from the south.',
      farming: 'Peak spring sowing — “At Chunfen the wheat stands up; every moment is worth gold.” Winter wheat joints; early rice is sown.',
      customs: 'Egg-balancing games, eating spring greens, flying kites; in imperial times, sacrifices to the sun.',
      poem: { text: 'The fourth day of mid-spring: spring’s beauty is exactly halved.', author: 'Xu Xuan', source: '“The Day of Spring Equinox”' }
    }
  },
  {
    id: 'qingming', lon: 15, season: 'spring', major: false,
    zh: {
      name: '清明', pinyin: 'Qīngmíng',
      meaning: '气清景明，万物皆显，天空澄澈、大地明净。',
      climate: '南方暖湿多雨，北方干燥少雨、气温回升快，南北景象迥异。',
      phenology: '初候“桐始华”：白桐开始开花。',
      farming: '“清明前后，种瓜点豆”（北方农谚）；南方早稻插秧，植树造林。',
      customs: '扫墓祭祖与踏青郊游并行，插柳、放风筝；江南吃青团。',
      poem: { text: '清明时节雨纷纷，路上行人欲断魂。', author: '杜牧', source: '《清明》' }
    },
    en: {
      name: 'Pure Brightness',
      meaning: 'The air is clear and the scenery bright — all things emerge clean and visible.',
      climate: 'The south is warm, moist and rainy; the north is dry with fast-rising temperatures — very different scenes across regions.',
      phenology: 'First pentad: “Paulownia begins to flower.”',
      farming: '“Around Qingming, plant melons and beans” (a northern proverb); rice transplanting in the south and tree planting nationwide.',
      customs: 'Tomb-sweeping and ancestor remembrance blend with spring outings; willow branches are planted, kites flown, and green qingtuan rice balls eaten in Jiangnan.',
      poem: { text: 'Rain falls thick and fast at Qingming; travelers on the road feel their spirits break.', author: 'Du Mu', source: '“Qingming”' }
    }
  },
  {
    id: 'guyu', lon: 30, season: 'spring', major: false,
    zh: {
      name: '谷雨', pinyin: 'Gǔyǔ',
      meaning: '“雨生百谷”：降水增多，滋润谷物生长。春季最后一个节气。',
      climate: '气温升高、降水明显增多；华南进入汛期，北方仍可能出现晚霜。',
      phenology: '初候“萍始生”：浮萍开始在水面生长。',
      farming: '播种移苗、埯瓜点豆；棉花播种，茶树采制“谷雨茶”。',
      customs: '赏牡丹（“谷雨花”）、饮谷雨茶、陕西白水祭仓颉、沿海祭海祈渔。',
      poem: { text: '谷雨春光晓，山川黛色青。', author: '元稹', source: '《咏廿四气诗·谷雨春光晓》' }
    },
    en: {
      name: 'Grain Rain',
      meaning: '“Rain brings up the hundred grains” — rainfall nourishes growing crops; the last solar term of spring.',
      climate: 'Warmer with clearly more rain; South China enters its flood season while late frost is still possible in the north.',
      phenology: 'First pentad: “Duckweed begins to grow” on the water’s surface.',
      farming: 'Sowing and transplanting, planting melons and beans; cotton goes into the field and “Grain Rain tea” is picked and processed.',
      customs: 'Admiring peonies (the “Grain Rain flower”), drinking fresh tea, honoring Cangjie (legendary inventor of writing) in Baishui, Shaanxi; coastal fishing communities hold sea rituals.',
      poem: { text: 'At Grain Rain, spring light dawns; mountains and rivers turn deep green.', author: 'Yuan Zhen', source: '“Poems of the Twenty-Four Solar Terms”' }
    }
  },
  {
    id: 'lixia', lon: 45, season: 'summer', major: false,
    zh: {
      name: '立夏', pinyin: 'Lìxià',
      meaning: '夏季的开始。按现代气候学标准，此时仅南方部分地区真正入夏。',
      climate: '南方气温明显升高、雷雨增多；北方仍温和，南北温差缩小。',
      phenology: '初候“蝼蝈鸣”：蝼蛄和蛙类开始鸣叫。',
      farming: '早稻插秧进入大忙，冬小麦灌浆；茶园修剪、果树疏果。',
      customs: '“称人”祈健康、吃立夏蛋、尝“三鲜”（各地时鲜不同）。',
      poem: { text: '赤帜插城扉，东君整驾归。', author: '陆游', source: '《立夏》' }
    },
    en: {
      name: 'Start of Summer',
      meaning: 'Summer begins — though by modern climate standards, only parts of the south have truly entered summer.',
      climate: 'The south heats up with more thunderstorms; the north stays mild and the north–south temperature gap narrows.',
      phenology: 'First pentad: “Mole crickets and frogs begin to sing.”',
      farming: 'Busy rice transplanting; winter wheat fills its grain; tea gardens are pruned and fruit trees thinned.',
      customs: 'Weighing people for good health, eating “Lixia eggs,” and tasting the season’s “three fresh” foods (which vary by region).',
      poem: { text: 'Red banners are planted at the city gates; the Lord of Spring packs his carriage to leave.', author: 'Lu You', source: '“Lixia”' }
    }
  },
  {
    id: 'xiaoman', lon: 60, season: 'summer', major: false,
    zh: {
      name: '小满', pinyin: 'Xiǎomǎn',
      meaning: '北方麦类等夏熟作物籽粒开始饱满但未成熟，故称“小满”；南方则指雨水渐丰。',
      climate: '南方进入强降水集中期，“小满大满江河满”；北方干热风可能危害小麦。',
      phenology: '初候“苦菜秀”：苦菜茂盛生长。',
      farming: '小麦灌浆后期防干热风；南方稻田蓄水、防治虫害。',
      customs: '祭车神（水车）、食苦菜、关中“看麦梢黄”（出嫁女回娘家问收）。',
      poem: { text: '夜莺啼绿柳，皓月醒长空。', author: '欧阳修', source: '《小满》' }
    },
    en: {
      name: 'Grain Buds',
      meaning: 'In the north, summer grains like wheat begin to plump but are not yet ripe — “small fullness.” In the south, the name refers to rising rainfall.',
      climate: 'The south enters a concentrated rainy period — “at Xiaoman the rivers fill”; dry hot winds may threaten wheat in the north.',
      phenology: 'First pentad: “Sow thistle flourishes.”',
      farming: 'Protect filling wheat from dry hot winds; store water in southern paddies and watch for pests.',
      customs: 'Offerings to the waterwheel god, eating bitter greens; in the Guanzhong region, married daughters return home to ask about the coming harvest.',
      poem: { text: 'Orioles sing in the green willows; the bright moon wakes the vast sky.', author: 'Ouyang Xiu', source: '“Xiaoman”' }
    }
  },
  {
    id: 'mangzhong', lon: 75, season: 'summer', major: false,
    zh: {
      name: '芒种', pinyin: 'Mángzhòng',
      meaning: '“芒”指麦类等有芒作物成熟待收，“种”指晚稻等抢种。收与种同样紧迫。',
      climate: '长江中下游进入梅雨季，高温高湿；华北干热，华南处前汛期盛期。',
      phenology: '初候“螳螂生”：螳螂卵孵化。',
      farming: '“三夏”大忙：夏收、夏种、夏管；抢收小麦、抢插晚稻。',
      customs: '送花神（《红楼梦》有描写）、皖南“安苗”祈丰收、煮梅。',
      poem: { text: '时雨及芒种，四野皆插秧。', author: '陆游', source: '《时雨》' }
    },
    en: {
      name: 'Grain in Ear',
      meaning: '“Mang” refers to awned crops like wheat ready for harvest; “zhong” to urgent sowing of late rice. Harvest and planting race together.',
      climate: 'The middle and lower Yangtze enter the plum-rain season — hot and humid; North China is dry and hot, South China in peak early rains.',
      phenology: 'First pentad: “Mantises are born” — mantis eggs hatch.',
      farming: 'The “three summers” rush: harvest, sowing and field care — racing to bring in wheat and transplant late rice.',
      customs: 'Farewell rites to the flower goddess (described in Dream of the Red Chamber), “Anmiao” seedling blessings in southern Anhui, and boiling green plums.',
      poem: { text: 'Seasonal rain arrives with Mangzhong; in every field, rice seedlings are transplanted.', author: 'Lu You', source: '“Seasonal Rain”' }
    }
  },
  {
    id: 'xiazhi', lon: 90, season: 'summer', major: true,
    zh: {
      name: '夏至', pinyin: 'Xiàzhì',
      meaning: '太阳直射北回归线，北半球白昼最长、正午太阳最高；南半球相反。',
      climate: '北半球接收太阳热量最多，但最热时段因热量累积而滞后，出现在此后的“三伏”。',
      phenology: '初候“鹿角解”：鹿角开始脱落（古人观察）。',
      farming: '中耕除草、追肥；防旱防涝，双季稻区加强早稻管理。',
      customs: '“冬至饺子夏至面”，吃夏至面尝新麦；古代祭地、官员放假。',
      poem: { text: '昼晷已云极，宵漏自此长。', author: '韦应物', source: '《夏至避暑北池》' }
    },
    en: {
      name: 'Summer Solstice',
      meaning: 'The sun reaches the Tropic of Cancer: the Northern Hemisphere has its longest day and highest noon sun; the Southern Hemisphere has the opposite.',
      climate: 'The Northern Hemisphere receives the most solar energy, but accumulated heat makes the hottest days lag behind — the “sanfu” period comes later.',
      phenology: 'First pentad: “Deer shed their antlers” (an ancient observation).',
      farming: 'Cultivate, weed and top-dress; guard against both drought and flood; manage early rice in double-cropping regions.',
      customs: '“Dumplings at Dongzhi, noodles at Xiazhi” — noodles celebrate the new wheat; in ancient times, sacrifices to the earth and public holidays.',
      poem: { text: 'The daytime sundial reaches its utmost; from tonight the night clock grows longer.', author: 'Wei Yingwu', source: '“Escaping Heat at the North Pond on Summer Solstice”' }
    }
  },
  {
    id: 'xiaoshu', lon: 105, season: 'summer', major: false,
    zh: {
      name: '小暑', pinyin: 'Xiǎoshǔ',
      meaning: '天气开始炎热，但还未到极点，故称“小暑”。',
      climate: '大部地区出梅入伏，高温高湿；台风开始活跃。',
      phenology: '初候“温风至”：风中开始带着热浪。',
      farming: '双季早稻收割、晚稻插秧（“双抢”）；防高温热害与洪涝。',
      customs: '“食新”尝新米、晒伏（晒书晒衣）、吃藕与绿豆汤消暑。',
      poem: { text: '倏忽温风至，因循小暑来。', author: '元稹', source: '《咏廿四气诗·小暑六月节》' }
    },
    en: {
      name: 'Minor Heat',
      meaning: 'Heat sets in but has not yet reached its peak — “minor heat.”',
      climate: 'Most regions leave the plum rains and enter the fu days — hot and humid; typhoons become active.',
      phenology: 'First pentad: “Warm winds arrive” — the breeze now carries heat.',
      farming: 'The “double rush”: harvest early rice and transplant late rice; guard against heat stress and flooding.',
      customs: 'Tasting the new rice harvest, sunning books and clothes in the fu days, eating lotus root and mung bean soup to beat the heat.',
      poem: { text: 'Suddenly the warm winds arrive; in their course, Minor Heat comes.', author: 'Yuan Zhen', source: '“Poems of the Twenty-Four Solar Terms”' }
    }
  },
  {
    id: 'dashu', lon: 120, season: 'summer', major: false,
    zh: {
      name: '大暑', pinyin: 'Dàshǔ',
      meaning: '一年中最热的时段，“暑”之极。',
      climate: '全国大部进入高温盛期，南方台风、强对流频繁；北方处雨季主汛期。',
      phenology: '初候“腐草为萤”：古人认为萤火虫由腐草化生（实为卵生，受观察所限）。',
      farming: '抗旱排涝并重，“双抢”扫尾；棉花整枝打杈。',
      customs: '饮伏茶、晒伏姜、浙江台州“送大暑船”驱疫祈安。',
      poem: { text: '大暑三秋近，林钟九夏移。', author: '元稹', source: '《咏廿四气诗·大暑六月中》' }
    },
    en: {
      name: 'Major Heat',
      meaning: 'The hottest stretch of the year — heat at its extreme.',
      climate: 'Most of the country swelters; the south faces typhoons and severe storms, while the north is in its main rainy season.',
      phenology: 'First pentad: “Decaying grass becomes fireflies” — an ancient belief; fireflies actually hatch from eggs.',
      farming: 'Fight drought and waterlogging alike; finish the “double rush”; prune and shape cotton plants.',
      customs: 'Drinking fu tea, drying ginger in the sun; in Taizhou, Zhejiang, the “Great Heat boat” is sent off to carry away plague and pray for peace.',
      poem: { text: 'At Major Heat, autumn draws near; the ninth summer month slips away.', author: 'Yuan Zhen', source: '“Poems of the Twenty-Four Solar Terms”' }
    }
  },
  {
    id: 'liqiu', lon: 135, season: 'autumn', major: false,
    zh: {
      name: '立秋', pinyin: 'Lìqiū',
      meaning: '秋季开始，暑去凉来。但多数地区仍处盛夏，“秋老虎”常见。',
      climate: '北方早晚渐凉，南方依旧炎热；降水与台风仍可能影响东南沿海。',
      phenology: '初候“凉风至”：风开始带来凉意（北方更明显）。',
      farming: '秋收准备，棉花整枝、晚稻追肥；“立秋三场雨，秕谷变成米”。',
      customs: '“贴秋膘”吃肉补夏损、“啃秋”吃瓜、婺源等地“晒秋”。',
      poem: { text: '乳鸦啼散玉屏空，一枕新凉一扇风。', author: '刘翰', source: '《立秋》' }
    },
    en: {
      name: 'Start of Autumn',
      meaning: 'Autumn begins — heat departs and coolness arrives. Yet most regions are still in midsummer; the “autumn tiger” heat often lingers.',
      climate: 'Northern mornings and evenings turn cool while the south stays hot; rain and typhoons may still strike the southeast coast.',
      phenology: 'First pentad: “Cool winds arrive” — the breeze begins to carry a chill (more noticeable in the north).',
      farming: 'Prepare for autumn harvest; prune cotton, top-dress late rice. “Three rains after Liqiu turn empty husks into rice.”',
      customs: '“Sticking on autumn fat” — hearty meat to recover from summer; “biting autumn” melons; in Wuyuan and elsewhere, “sun-drying autumn” harvests.',
      poem: { text: 'Young crows cry and scatter, the jade screen empty; a pillow of new coolness, a fan of wind.', author: 'Liu Han', source: '“Liqiu”' }
    }
  },
  {
    id: 'chushu', lon: 150, season: 'autumn', major: false,
    zh: {
      name: '处暑', pinyin: 'Chǔshǔ',
      meaning: '“处”是终止之意，暑气至此而止，炎热离开。',
      climate: '北方秋高气爽，南方仍可能有台风与“秋老虎”；昼夜温差加大。',
      phenology: '初候“鹰乃祭鸟”：鹰开始大量捕鸟，陈列如祭。',
      farming: '秋收秋种展开，晚稻孕穗管理，棉花采摘开始。',
      customs: '放河灯悼逝祈安、沿海“开渔节”、吃鸭润燥。',
      poem: { text: '处暑无三日，新凉直万金。', author: '苏泂', source: '《长江二首》' }
    },
    en: {
      name: 'End of Heat',
      meaning: '“Chu” means to end — the heat stops here and summer’s scorch takes its leave.',
      climate: 'The north enjoys crisp autumn skies; the south may still see typhoons and late heat, with growing day–night temperature swings.',
      phenology: 'First pentad: “Hawks sacrifice birds” — hawks hunt abundantly, arraying prey as if in offering.',
      farming: 'Autumn harvest and sowing begin; late rice boots, and cotton picking starts.',
      customs: 'Floating river lanterns to remember the departed, coastal Fishing-Opening Festivals, and eating duck to moisten against autumn dryness.',
      poem: { text: 'Not three days past End of Heat — the new coolness is worth ten thousand in gold.', author: 'Su Jiong', source: '“Two Poems on the Yangtze”' }
    }
  },
  {
    id: 'bailu', lon: 165, season: 'autumn', major: false,
    zh: {
      name: '白露', pinyin: 'Báilù',
      meaning: '夜间水汽遇冷凝成白色露珠，昼夜温差加大，天气转凉。',
      climate: '北方降温快，“白露秋分夜，一夜凉一夜”；南方暑热消退，台风仍可能。',
      phenology: '初候“鸿雁来”：大雁开始南飞。',
      farming: '秋收全面展开，冬小麦备播；“白露白茫茫，谷子满田黄”。',
      customs: '饮白露茶、苏南浙北酿米酒、太湖畔祭禹王、收清露。',
      poem: { text: '露从今夜白，月是故乡明。', author: '杜甫', source: '《月夜忆舍弟》' }
    },
    en: {
      name: 'White Dew',
      meaning: 'Night moisture condenses into white dew as day–night temperature gaps widen and the weather turns cool.',
      climate: 'The north cools fast — “from White Dew to Autumn Equinox, each night cooler than the last”; the south’s heat fades, though typhoons remain possible.',
      phenology: 'First pentad: “Wild geese arrive” — geese begin flying south.',
      farming: 'Harvest in full swing; prepare winter wheat fields. “At White Dew the fields stretch pale and yellow, grain filling every row.”',
      customs: 'Drinking White Dew tea, brewing rice wine in southern Jiangsu and northern Zhejiang, honoring King Yu by Lake Tai, collecting clear dew.',
      poem: { text: 'From tonight the dew turns white; the moon is brightest in my homeland.', author: 'Du Fu', source: '“Moonlit Night, Thinking of My Brothers”' }
    }
  },
  {
    id: 'qiufen', lon: 180, season: 'autumn', major: true,
    zh: {
      name: '秋分', pinyin: 'Qiūfēn',
      meaning: '太阳再次直射赤道，昼夜等长，平分秋季。曾为传统“祭月节”，是中秋节渊源之一。',
      climate: '北半球昼短夜长开始，降温加快；南方晚稻灌浆，秋高气爽渐至。',
      phenology: '初候“雷始收声”：雷声渐息（古人认为雷因阳气盛而发声）。',
      farming: '“三秋”大忙：秋收、秋耕、秋种；冬小麦播种适期。',
      customs: '祭月（中秋渊源）、竖蛋、吃秋菜；2018 年起秋分为“中国农民丰收节”。',
      poem: { text: '秋分客尚在，竹露夕微微。', author: '杜甫', source: '《晚晴》' }
    },
    en: {
      name: 'Autumn Equinox',
      meaning: 'The sun again crosses the equator; day and night are equal, halving autumn. It was the traditional Moon-Sacrifice Festival, one root of the Mid-Autumn Festival.',
      climate: 'In the Northern Hemisphere, nights grow longer than days and cooling accelerates; late rice fills in the south.',
      phenology: 'First pentad: “Thunder begins to silence” — thunder fades (ancients linked it to waning yang energy).',
      farming: 'The “three autumns” rush: harvest, plowing and sowing — the prime window for winter wheat.',
      customs: 'Moon worship (root of Mid-Autumn), egg-balancing, eating autumn greens; since 2018, the day is China’s Farmers’ Harvest Festival.',
      poem: { text: 'At Autumn Equinox the traveler still lingers; evening dew glistens faintly on the bamboo.', author: 'Du Fu', source: '“Evening Clear”' }
    }
  },
  {
    id: 'hanlu', lon: 195, season: 'autumn', major: false,
    zh: {
      name: '寒露', pinyin: 'Hánlù',
      meaning: '露气寒冷，将凝结为霜，气温比白露时更低。',
      climate: '北方深秋、南方晚秋，冷空气频繁；华南“寒露风”可能影响晚稻。',
      phenology: '初候“鸿雁来宾”：大雁南迁途经此地，如宾客。',
      farming: '晚稻收获、冬小麦播种；“寒露到霜降，种麦日夜忙”。',
      customs: '登高赏菊、饮菊花酒、吃芝麻糕点；与重阳节俗相近。',
      poem: { text: '袅袅凉风动，凄凄寒露零。', author: '白居易', source: '《池上》' }
    },
    en: {
      name: 'Cold Dew',
      meaning: 'The dew turns cold, on the verge of frost — colder than at White Dew.',
      climate: 'Deep autumn in the north, late autumn in the south, with frequent cold fronts; “Cold Dew winds” may harm late rice in South China.',
      phenology: 'First pentad: “Wild geese come as guests” — migrating geese pass through like visiting guests.',
      farming: 'Harvest late rice and sow winter wheat — “from Cold Dew to Frost’s Descent, wheat planting keeps farmers busy day and night.”',
      customs: 'Climbing heights, admiring chrysanthemums, drinking chrysanthemum wine, eating sesame pastries — customs close to the Double Ninth Festival.',
      poem: { text: 'Soft cool winds stir; the cold dew falls, chill and clear.', author: 'Bai Juyi', source: '“On the Pond”' }
    }
  },
  {
    id: 'shuangjiang', lon: 210, season: 'autumn', major: false,
    zh: {
      name: '霜降', pinyin: 'Shuāngjiàng',
      meaning: '天气渐冷、初霜出现，是秋季最后一个节气。霜并非从天而降，而是近地面水汽凝华。',
      climate: '北方可见初霜，南方未必见霜；昼夜温差大，冷空气活跃。',
      phenology: '初候“豺乃祭兽”：豺狼捕猎储食，陈列如祭。',
      farming: '秋收扫尾、防冻保墒；“霜降见霜，米谷满仓”（北方农谚）。',
      customs: '赏红叶、吃柿子（“霜降吃丁柿，不会流鼻涕”）；广西天等壮族霜降节。',
      poem: { text: '停车坐爱枫林晚，霜叶红于二月花。', author: '杜牧', source: '《山行》' }
    },
    en: {
      name: 'Frost’s Descent',
      meaning: 'Cold deepens and first frost appears — autumn’s last term. Frost does not fall from the sky; it forms from water vapor depositing near the ground.',
      climate: 'First frost may appear in the north but rarely in the south; large day–night swings and active cold air.',
      phenology: 'First pentad: “Jackals sacrifice beasts” — jackals hunt and store prey, arraying it as if in offering.',
      farming: 'Wrap up harvest and protect against frost — “frost at Frost’s Descent, granaries full of grain” (a northern proverb).',
      customs: 'Admiring red leaves and eating persimmons (“a persimmon at Frost’s Descent keeps the nose from running”); the Zhuang people’s Frost’s Descent Festival in Tiandeng, Guangxi.',
      poem: { text: 'I stop my carriage, loving the maple woods at dusk; frosted leaves are redder than February flowers.', author: 'Du Mu', source: '“Mountain Travel”' }
    }
  },
  {
    id: 'lidong', lon: 225, season: 'winter', major: false,
    zh: {
      name: '立冬', pinyin: 'Lìdōng',
      meaning: '冬季开始，万物收藏，规避寒冷。',
      climate: '北方寒冷干燥，南方初冬常现“小阳春”；寒潮开始频繁。',
      phenology: '初候“水始冰”：水面开始结冰（北方）。',
      farming: '冬灌保墒、积肥造肥、兴修水利；南方晚稻收尾。',
      customs: '“补冬”：北方饺子、南方鸡鸭鱼肉；绍兴开酿黄酒。',
      poem: { text: '冻笔新诗懒写，寒炉美酒时温。', author: '李白', source: '《立冬》' }
    },
    en: {
      name: 'Start of Winter',
      meaning: 'Winter begins — all things store away and shelter from the cold.',
      climate: 'The north turns cold and dry; the south often enjoys a “little spring” in early winter, with cold waves growing frequent.',
      phenology: 'First pentad: “Water begins to freeze” (in the north).',
      farming: 'Winter irrigation to hold moisture, composting and waterworks; late rice wraps up in the south.',
      customs: '“Winter tonics”: dumplings in the north, rich meats in the south; Shaoxing begins brewing its yellow rice wine.',
      poem: { text: 'The brush is frozen — too lazy to write new poems; by the cold stove, fine wine is warmed again and again.', author: 'Li Bai', source: '“Lidong”' }
    }
  },
  {
    id: 'xiaoxue', lon: 240, season: 'winter', major: false,
    zh: {
      name: '小雪', pinyin: 'Xiǎoxuě',
      meaning: '开始降雪，但雪量不大，故称“小雪”。',
      climate: '北方初雪渐至，南方湿冷加重；寒潮与大风降温频繁。',
      phenology: '初候“虹藏不见”：彩虹不再出现（降雨减少、气温降低）。',
      farming: '贮藏蔬菜、果树修剪、积肥；“小雪雪满天，来年必丰年”。',
      customs: '“小雪腌菜，大雪腌肉”；南方吃糍粑、沿海晒鱼干。',
      poem: { text: '花雪随风不厌看，更多还肯失林峦。', author: '戴叔伦', source: '《小雪》' }
    },
    en: {
      name: 'Minor Snow',
      meaning: 'Snow begins to fall, but not yet heavily — “minor snow.”',
      climate: 'First snows reach the north while the south turns damp and cold; cold waves and sharp temperature drops are frequent.',
      phenology: 'First pentad: “Rainbows hide and are seen no more” — rainbows vanish as rain gives way to cold.',
      farming: 'Store vegetables, prune orchards, keep composting — “snow filling the sky at Xiaoxue promises a bumper year.”',
      customs: '“Pickling vegetables at Minor Snow, curing meat at Major Snow”; ciba rice cakes in the south, dried fish along the coast.',
      poem: { text: 'Flake-snow drifting on the wind — I never tire of watching it fall over the wooded hills.', author: 'Dai Shulun', source: '“Xiaoxue”' }
    }
  },
  {
    id: 'daxue', lon: 255, season: 'winter', major: false,
    zh: {
      name: '大雪', pinyin: 'Dàxuě',
      meaning: '降雪概率与积雪可能增大，“大者，盛也”。并非指当日必下大雪。',
      climate: '北方严寒、河流封冻，南方湿冷、道路可能结冰。',
      phenology: '初候“鹖鴠不鸣”：寒号鸟不再鸣叫（古人观察）。',
      farming: '积肥修水利、保温防冻；“瑞雪兆丰年”——积雪保温保墒。',
      customs: '腌肉备年货、北方滑冰赏封河、进补养身。',
      poem: { text: '千山鸟飞绝，万径人踪灭。', author: '柳宗元', source: '《江雪》' }
    },
    en: {
      name: 'Major Snow',
      meaning: 'The chance and depth of snow grow — “major means abundant.” It does not mean heavy snow must fall on this day.',
      climate: 'The north freezes hard and rivers ice over; the south turns damp-cold with possible icy roads.',
      phenology: 'First pentad: “The hedan bird stops calling” (an ancient observation of cold-silenced creatures).',
      farming: 'Compost, repair waterworks, protect against cold — “auspicious snow foretells a good year,” insulating soil and holding moisture.',
      customs: 'Curing meat for the New Year, ice skating and watching rivers freeze in the north, nourishing winter tonics.',
      poem: { text: 'A thousand mountains — no bird in flight; ten thousand paths — no human trace.', author: 'Liu Zongyuan', source: '“River Snow”' }
    }
  },
  {
    id: 'dongzhi', lon: 270, season: 'winter', major: true,
    zh: {
      name: '冬至', pinyin: 'Dōngzhì',
      meaning: '太阳直射南回归线，北半球白昼最短、黑夜最长；“冬至一阳生”，白昼自此渐长。',
      climate: '进入“数九寒天”，最冷时段因热量散失滞后，出现在“三九四九”。',
      phenology: '初候“蚯蚓结”：蚯蚓蜷缩如结（古人观察）。',
      farming: '农闲积肥造肥、温室管理、果树防冻。',
      customs: '北方饺子、南方汤圆与长线面；祭祖、画“九九消寒图”。',
      poem: { text: '天时人事日相催，冬至阳生春又来。', author: '杜甫', source: '《小至》' }
    },
    en: {
      name: 'Winter Solstice',
      meaning: 'The sun reaches the Tropic of Capricorn: the Northern Hemisphere’s shortest day and longest night. “At Dongzhi, yang is born” — daylight grows from here.',
      climate: 'The “counting of the nines” begins; heat loss lags, so the coldest days come later — in the third and fourth nines.',
      phenology: 'First pentad: “Earthworms coil into knots” (an ancient observation).',
      farming: 'Off-season composting, greenhouse care and frost protection for orchards.',
      customs: 'Dumplings in the north, tangyuan and long noodles in the south; ancestor rites and painting the “Nine-Nines Cold-Dispelling Chart.”',
      poem: { text: 'Seasons and human affairs press on day by day; at Winter Solstice yang is born, and spring returns again.', author: 'Du Fu', source: '“Xiaozhi (The Day Before Dongzhi)”' }
    }
  },
  {
    id: 'xiaohan', lon: 285, season: 'winter', major: false,
    zh: {
      name: '小寒', pinyin: 'Xiǎohán',
      meaning: '寒冷开始加剧。气象记录上，北方多数年份小寒比大寒更冷，“小寒胜大寒”。',
      climate: '全国大部进入严冬，北方处“三九”前后，南方亦明显寒冷。',
      phenology: '初候“雁北乡”：大雁开始感知阳气而欲北归（古人观察）。',
      farming: '防寒防冻、温室与畜禽保暖、积肥备春耕。',
      customs: '腊八粥（腊八节常近小寒）、南京菜饭、探梅赏梅。',
      poem: { text: '小寒连大吕，欢鹊垒新巢。', author: '元稹', source: '《咏廿四气诗·小寒十二月节》' }
    },
    en: {
      name: 'Minor Cold',
      meaning: 'Cold intensifies. In most years, northern records show Xiaohan colder than Dahan — “Minor Cold beats Major Cold.”',
      climate: 'Most of the country is in deep winter — around the “third nine” in the north, and distinctly cold in the south too.',
      phenology: 'First pentad: “Geese turn northward” — geese begin to sense the northward return (an ancient observation).',
      farming: 'Guard against frost, keep greenhouses and livestock warm, compost and prepare for spring.',
      customs: 'Laba porridge (the Laba Festival often falls near Xiaohan), Nanjing vegetable rice, and seeking out early plum blossoms.',
      poem: { text: 'Minor Cold joins the Dalü pitch; joyful magpies build new nests.', author: 'Yuan Zhen', source: '“Poems of the Twenty-Four Solar Terms”' }
    }
  },
  {
    id: 'dahan', lon: 300, season: 'winter', major: false,
    zh: {
      name: '大寒', pinyin: 'Dàhán',
      meaning: '寒冷至极，岁末将尽，冬去春来在即。',
      climate: '寒潮频繁，南方亦冷；北方冰天雪地，岁末年味渐浓。',
      phenology: '初候“鸡始乳”：母鸡开始孵育小鸡（古人观察）。',
      farming: '备春耕、积肥、检修农具；温室蔬菜管理。',
      customs: '闽台“尾牙”祭土地公、除尘洁物、备年货、踩岁祈福。',
      poem: { text: '腊酒自盈樽，金炉兽炭温。', author: '元稹', source: '《咏廿四气诗·大寒十二月中》' }
    },
    en: {
      name: 'Major Cold',
      meaning: 'Cold at its extreme — the year draws to its close, and spring is near.',
      climate: 'Frequent cold waves chill even the south; the north is a world of ice and snow as New Year preparations begin.',
      phenology: 'First pentad: “Hens begin to brood” (an ancient observation).',
      farming: 'Prepare for spring plowing, compost, repair tools and tend greenhouse vegetables.',
      customs: 'The “Weiya” offering to the Earth God in Fujian and Taiwan, year-end cleaning, New Year shopping, and “stepping on the year” for good fortune.',
      poem: { text: 'La-month wine fills the cup; beast-shaped charcoal warms the golden stove.', author: 'Yuan Zhen', source: '“Poems of the Twenty-Four Solar Terms”' }
    }
  }
]

export const termById = (id) => TERMS.find(t => t.id === id)
export const termName = (index, locale) => TERMS[index][locale].name