/**
 * sources.js — 参考来源
 *
 * 分成四类：天文历算、官方与非遗、古籍文献、图像与代码许可。
 * 每条注明用途，方便读者按需核查。
 */

export const sourceGroups = [
  {
    title: '天文历算与数据',
    items: [
      {
        tag: '计算库',
        text: 'astronomy-engine（MIT 许可）——本项目用它计算太阳地心视黄经、格林尼治视恒星时，并交叉校验分至点。库内含基于 VSOP87 与 IAU 1976/1980 岁差章动模型的太阳位置算法。',
        url: 'https://github.com/cosinekitty/astronomy',
      },
      {
        tag: '算法出处',
        text: 'Jean Meeus,《Astronomical Algorithms》(2nd ed., Willmann-Bell, 1998)——现代历算的标准参考书，交节时刻求解所用的太阳视黄经方法即出自此体系。',
      },
      {
        tag: '校验对照',
        text: '香港天文台《二十四节气的日期及时间资料》——其数据由英国皇家航海历书局（HMNAO）与美国海军天文台（USNO）提供；本项目 2026 年秋分计算值与其公布值相差 0.6 秒。',
        url: 'https://www.weather.gov.hk/tc/gts/astronomy/Solar_Term.htm',
      },
      {
        tag: '校验对照',
        text: '中国科学院紫金山天文台编算的《中国天文年历》每年发布节气交节时刻；本项目 2026 年 24 个节气与公开发布值逐一对比，偏差均在 1 分钟以内。',
      },
      {
        tag: '地轴倾角',
        text: 'IAU 2006 平黄赤交角表达式（84381.406″ − 46.836769″·T − …），当前约 23.436°，页面按模拟时刻实时计算。',
      },
    ],
  },
  {
    title: '非物质文化遗产与官方介绍',
    items: [
      {
        tag: 'UNESCO',
        text: '联合国教科文组织人类非物质文化遗产代表作名录："The Twenty-Four Solar Terms, knowledge in China of time and practices developed through observation of the sun\'s annual motion"（编号 00647），2016 年 11 月 30 日列入。',
        url: 'https://ich.unesco.org/en/RL/the-twenty-four-solar-terms-knowledge-in-china-of-time-and-practices-developed-through-observation-of-the-sun-s-annual-motion-00647',
      },
      {
        tag: '官方名录',
        text: '中国非物质文化遗产网·中国非物质文化遗产数字博物馆——"农历二十四节气"（2006 年列入第一批国家级非物质文化遗产名录）及各扩展项目。',
        url: 'https://www.ihchina.cn/',
      },
      {
        tag: '科普',
        text: '科普中国、中国天气网等关于节气天文定义（太阳黄经每 15° 一个节气）与定气法的说明。',
        url: 'https://www.kepuchina.cn/',
      },
    ],
  },
  {
    title: '古籍与文献',
    items: [
      { tag: '先秦', text: '《尚书·尧典》——"日中星鸟""日永星火""宵中星虚""日短星昴"，二分二至观念的早期记载。' },
      { tag: '先秦', text: '《周礼·地官·大司徒》——"以土圭之法测土深，正日景，以求地中"；《周礼·春官》冯相氏、保章氏掌四时。' },
      { tag: '先秦', text: '《大戴礼记·夏小正》、《吕氏春秋·十二纪》、《礼记·月令》——月令体系与物候时序。' },
      { tag: '西汉', text: '《淮南子·天文训》（约公元前 139 年前成书）——二十四节气名目与次序的首次完整记载，"十五日为一节，以生二十四时之变"。' },
      { tag: '汉唐', text: '《史记·历书》《汉书·律历志》——太初改历（公元前 104 年）与三统术的节气次序。' },
      { tag: '元代', text: '《授时历》（1281 年颁行）——郭守敬、王恂、许衡等编定，回归年取 365.2425 日。' },
      { tag: '清代', text: '《时宪历》（1645 年施行）——正式采用定气法；《清史稿·汤若望传》。' },
      { tag: '物候', text: '《月令七十二候集解》（旧题元·吴澄撰）——三候名目的通行来源，以黄河流域物候为基准。' },
      { tag: '岁时', text: '《东京梦华录》《帝京景物略》《清嘉录》等岁时笔记——立春鞭春、九九消寒图、冬至节俗等的文献依据。' },
      { tag: '诗词', text: '所引诗词以中华书局点校本及《全唐诗》《全宋词》通行文本为准；旧题唐·元稹《咏廿四气诗》的作者与年代学界存疑，敦煌遗书中亦有存本，页面已随条注明。' },
    ],
  },
  {
    title: '图像、纹理与代码许可',
    items: [
      {
        tag: '纹理',
        text: '地球白昼/夜面/云层、太阳表面、银河星空底图来自 Solar System Scope Textures（INOVE），许可为 CC BY 4.0，底图源自 NASA 等公开影像。已由 npm run fetch:textures 预先下载到 public/textures/，逐张的来源与许可记录在 public/textures/CREDITS.json。',
        url: 'https://www.solarsystemscope.com/textures/',
      },
      {
        tag: '纹理',
        text: '海面高光掩膜图取自 three.js 官方示例资源（three.js 为 MIT 许可，影像本身源自 NASA 公有领域数据）。',
        url: 'https://threejs.org/',
      },
      {
        tag: '渲染',
        text: 'three.js（MIT 许可）——三维渲染；视角交互使用其官方 OrbitControls，标签层使用 CSS2DRenderer。',
        url: 'https://threejs.org/docs/#examples/en/controls/OrbitControls',
      },
      {
        tag: '字体',
        text: '页面只使用系统自带的中文黑体与宋体（PingFang SC / 微软雅黑 / 思源黑体、Songti SC / 思源宋体等），未嵌入任何第三方字体文件。' },
      {
        tag: '替代方案',
        text: '若某张纹理缺失或加载失败，会自动改用 src/three/proceduralTextures.js 中程序化生成的等效纹理，界面会明确提示"当前为替代纹理"。程序化地球底图只是"类地行星"示意，不代表真实海陆分布。',
      },
    ],
  },
]
