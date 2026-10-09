/**
 * sources.en.js — References (English version)
 *
 * Four groups: astronomy & calendrical computation, official and intangible-heritage
 * introductions, classical texts & literature, and image & code licences.
 * Each entry states its purpose so readers can verify it as needed.
 */

export const sourceGroups = [
  {
    title: 'Astronomy, Calendrical Computation & Data',
    items: [
      {
        tag: 'Library',
        text: "astronomy-engine (MIT licence) — this project uses it to compute the Sun's apparent geocentric ecliptic longitude and the Greenwich apparent sidereal time, and to cross-check the equinoxes and solstices. The library contains solar-position algorithms based on VSOP87 and the IAU 1976/1980 precession–nutation models.",
        url: 'https://github.com/cosinekitty/astronomy',
      },
      {
        tag: 'Algorithm source',
        text: "Jean Meeus, Astronomical Algorithms (2nd ed., Willmann-Bell, 1998) — the standard reference of modern practical astronomy; the apparent-solar-longitude method used here to solve for the term instants comes from this system.",
      },
      {
        tag: 'Cross-check',
        text: "Hong Kong Observatory, 'Dates and Times of the 24 Solar Terms' — its data are provided by HM Nautical Almanac Office (HMNAO, UK) and the US Naval Observatory (USNO); this project's computed instant of the 2026 Autumn Equinox differs from the published value by 0.6 seconds.",
        url: 'https://www.weather.gov.hk/tc/gts/astronomy/Solar_Term.htm',
      },
      {
        tag: 'Cross-check',
        text: "Purple Mountain Observatory, Chinese Academy of Sciences, publishes the term instants each year in the Chinese Astronomical Almanac; this project's 24 term instants for 2026 were compared one by one with the published values, and all deviations are within 1 minute.",
      },
      {
        tag: 'Axial tilt',
        text: 'IAU 2006 expression for the mean obliquity of the ecliptic (84381.406″ − 46.836769″·T − …), currently about 23.436°; the page computes it in real time for the simulated instant.',
      },
    ],
  },
  {
    title: 'Intangible Cultural Heritage & Official Introductions',
    items: [
      {
        tag: 'UNESCO',
        text: "UNESCO Representative List of the Intangible Cultural Heritage of Humanity: \"The Twenty-Four Solar Terms, knowledge in China of time and practices developed through observation of the sun's annual motion\" (No. 00647), inscribed on 30 November 2016.",
        url: 'https://ich.unesco.org/en/RL/the-twenty-four-solar-terms-knowledge-in-china-of-time-and-practices-developed-through-observation-of-the-sun-s-annual-motion-00647',
      },
      {
        tag: 'Official list',
        text: "China Intangible Cultural Heritage Web · China Intangible Cultural Heritage Digital Museum — 'The 24 Solar Terms of the Chinese Calendar' (inscribed in the first batch of the National List of Intangible Cultural Heritage in 2006) and its extension projects.",
        url: 'https://www.ihchina.cn/',
      },
      {
        tag: 'Science outreach',
        text: "Kepuchina (Science Popularisation China), China Weather Net and similar sources explaining the astronomical definition of the solar terms (one term per 15° of solar ecliptic longitude) and the true-solar-terms method.",
        url: 'https://www.kepuchina.cn/',
      },
    ],
  },
  {
    title: 'Classical Texts & Literature',
    items: [
      { tag: 'Pre-Qin', text: "Shangshu (Book of Documents), 'Canon of Yao' — 'the day is of equal length and the constellation is the Bird', 'the day is long and the constellation is the Fire', 'the night is of equal length and the constellation is the Void', 'the day is short and the constellation is Mao (the Pleiades)': early records of the equinoxes and solstices." },
      { tag: 'Pre-Qin', text: "Rites of Zhou (Zhouli), 'Earth Offices · Grand Minister of Education' — 'using the earth-gnomon to measure the depth of the earth, rectify the sun's shadow, and seek the centre of the earth'; in the 'Spring Offices', the Fengxiangshi and Baozhangshi officers were in charge of the four seasons." },
      { tag: 'Pre-Qin', text: "Da Dai Liji, 'Xia Xiaozheng' (Summer Small Calendar); Lüshi Chunqiu, 'The Twelve Annals'; Liji, 'Yueling' (Monthly Ordinances) — the monthly-ordinance system and the phenological calendar." },
      { tag: 'Western Han', text: "Huainanzi, 'Treatise on Astronomy' (compiled before c. 139 BCE) — the first complete record of the names and order of the 24 solar terms: 'fifteen days make one term, giving rise to the changes of the twenty-four seasons'." },
      { tag: 'Han–Tang', text: "Shiji (Records of the Grand Historian), 'Treatise on the Calendar'; Hanshu, 'Treatise on Rhythm and the Calendar' — the Taichu calendar reform (104 BCE) and the order of the terms in the Santong method." },
      { tag: 'Yuan', text: "Shoushi Calendar (promulgated 1281) — compiled by Guo Shoujing, Wang Xun, Xu Heng and others; it adopted a tropical year of 365.2425 days." },
      { tag: 'Qing', text: "Shixian Calendar (in effect from 1645) — formally adopted the true-solar-terms method; see Draft History of Qing, 'Biography of Tang Ruowang (Johann Adam Schall von Bell)'." },
      { tag: 'Phenology', text: "Yueling Qishi'er Hou Jijie (Collected Explanations of the Seventy-two Pentads of the Monthly Ordinances), traditionally attributed to Wu Cheng of the Yuan — the standard source of the pentad names, based on the phenology of the Yellow River basin." },
      { tag: 'Seasonal customs', text: "Dongjing Meng Hua Lu (The Eastern Capital: A Dream of Splendour), Dijing Jingwu Lüe (A Sketch of the Sights of the Imperial Capital), Qingjia Lu (Record of the Pure Festivals) and similar seasonal notebooks — the literary basis for such customs as 'whipping the spring ox' at Start of Spring, the 'nine-times-nine cold-dispelling chart', and Winter Solstice festivities." },
      { tag: 'Poetry', text: "The poems quoted follow the punctuated critical editions of Zhonghua Book Company and the standard texts of the Complete Tang Poems and Complete Song Ci; the authorship and date of the 'Poems on the Twenty-Four Solar Terms', traditionally attributed to Yuan Zhen of the Tang, are disputed in scholarship, and copies also survive among the Dunhuang manuscripts — the pages note this alongside each entry." },
    ],
  },
  {
    title: 'Images, Textures & Code Licences',
    items: [
      {
        tag: 'Textures',
        text: "Earth day side / night side / cloud layer, solar surface and Milky Way starfield background come from Solar System Scope Textures (INOVE), licensed CC BY 4.0; the base images derive from NASA and other public imagery. They were pre-downloaded to public/textures/ via npm run fetch:textures; the source and licence of each image are recorded in public/textures/CREDITS.json.",
        url: 'https://www.solarsystemscope.com/textures/',
      },
      {
        tag: 'Textures',
        text: "The sea-surface specular mask comes from the official three.js example assets (three.js is MIT-licensed; the image itself derives from NASA public-domain data).",
        url: 'https://threejs.org/',
      },
      {
        tag: 'Rendering',
        text: 'three.js (MIT licence) — 3D rendering; camera interaction uses its official OrbitControls, and the label layer uses CSS2DRenderer.',
        url: 'https://threejs.org/docs/#examples/en/controls/OrbitControls',
      },
      {
        tag: 'Fonts',
        text: "The pages use only system Chinese sans (Hei) and serif (Song) faces (PingFang SC / Microsoft YaHei / Source Han Sans, Songti SC / Source Han Serif, etc.); no third-party font files are embedded." },
      {
        tag: 'Fallback',
        text: "If a texture is missing or fails to load, an equivalent procedurally generated texture from src/three/proceduralTextures.js is used automatically, and the UI clearly states 'a substitute texture is currently in use'. The procedural Earth base map is only a schematic 'Earth-like planet' and does not represent the real distribution of continents and oceans.",
      },
    ],
  },
]
