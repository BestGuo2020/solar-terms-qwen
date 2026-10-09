// Science Q&A (English) — why the seasons, term spacing, Gregorian stability, hemispheres; with glossary and notes on computation precision

export const qa = [
  {
    id: "why-seasons",
    q: "Why are there four seasons?",
    a: [
      "The fundamental cause of the seasons is that Earth's rotation axis is tilted by about 23.4° relative to the plane of its orbit around the Sun (the ecliptic plane), and the axis keeps pointing in essentially the same direction throughout the year, roughly toward Polaris. As Earth revolves around the Sun, the point where the Sun stands directly overhead — the sub-solar point — therefore moves across Earth's surface with the changing position.",
      "The sub-solar point is not fixed: it travels back and forth between the Tropics of Cancer and Capricorn (about 23.4° N and 23.4° S), completing one cycle per year. In the hemisphere the sub-solar point leans toward, the noon Sun stands higher, days are longer, and each unit area of ground receives more solar radiation, so it is warmer and that hemisphere is in summer; the other hemisphere is the opposite and is in winter. When the sub-solar point is near the equator, the two hemispheres receive nearly the same amount of heat, giving spring or autumn.",
      "The 24 solar terms map exactly this cycle: starting from the spring equinox, the ecliptic of the Sun's apparent annual motion is divided into 24 equal segments, one solar term every 15°. Start of Spring, Spring Equinox, Start of Summer, Summer Solstice… essentially mark different positions of Earth on its orbit, and so they correspond to the rhythm of cold and heat through the year.",
      "The seasons also show a 'lag effect': the ground and atmosphere need time to accumulate and release heat, so the hottest period of the year usually falls not at the Summer Solstice but a month or more later, around Minor Heat and Major Heat; the coldest period likewise falls at Minor Cold and Major Cold, not at the Winter Solstice. Oceans, monsoons, terrain and other factors also make the seasons as felt in different regions drift out of step with the astronomical rhythm."
    ],
    keyPoints: [
      "The ~23.4° tilt of Earth's axis, with its direction essentially unchanged, is the root cause of the four seasons.",
      "The sub-solar point shuttles between the two tropics, determining each hemisphere's solar altitude and day length.",
      "The seasons are essentially the annual cycle of solar radiation received at one place; the solar terms divide it every 15° of solar ecliptic longitude.",
      "Air temperature lags behind solar radiation: the hottest and coldest periods usually come around Major Heat and Minor Cold, not at the Summer and Winter Solstices."
    ],
    myth: "A common misconception is that 'the seasons are caused by Earth's changing distance from the Sun'. In fact Earth's orbital eccentricity is only about 0.0167, so the distance variation affects the received solar radiation very little; moreover, the Northern Hemisphere's summer occurs when Earth is near aphelion (early July) and its winter when Earth is near perihelion (early January) — exactly the opposite of the 'nearer means hotter' guess."
  },
  {
    id: "why-not-15-days",
    q: "Why don't the solar terms come exactly every 15 days?",
    a: [
      "The solar terms are defined by equal divisions of solar ecliptic longitude: starting from the Spring Equinox (longitude 0°), a new term begins each time the Sun's apparent ecliptic longitude increases by 15°. The angular spacing between neighbouring terms is therefore strictly equal, but the time needed to cover each 15° is not. Averaged over the 24 terms of a year, one term lasts about 15.22 days; in reality the spacings vary between roughly 14.7 and 15.7 days.",
      "The first reason comes from Kepler's second law: Earth's orbit is an ellipse and Earth sweeps out equal areas in equal times, so it revolves faster near perihelion (around early January each year) and slower near aphelion (around early July). Correspondingly, the Sun's apparent motion along the ecliptic is faster in the winter half-year and slower in the summer half-year: in the winter half-year (roughly November to January, when Earth is near perihelion) neighbouring terms are only about 14.7 days apart, while in the summer half-year they are about 15.7 days apart — a difference of nearly a full day.",
      "The second reason comes from the calendar itself: a Gregorian year can only have 365 or 366 days, month lengths are whole numbers such as 28, 30 or 31 days, yet the tropical year is about 365.2422 days; the leftover fraction is patched up by the 'leap every 4 years, skip at 100, leap again at 400' rule. Whether a year is a leap year, and in which month the leap day falls, pushes term dates forward or backward, so the Gregorian date of the same term can differ by 1–2 days between adjacent years.",
      "History knew two ways of computing the terms. The mean-solar-terms method (pingqi fa, 平气法) divided the tropical year into 24 equal intervals of time, making every spacing identical — simple to calculate, but out of step with the Sun's real position. The true-solar-terms method (dingqi fa, 定气法) divides the ecliptic by apparent solar longitude, one term per 15°, faithfully reflecting the Sun's actual motion. The Shixian Calendar, promulgated in the early Qing dynasty and put into effect in 1645, formally adopted the true-solar-terms method, which has been used ever since — this is the direct institutional origin of the unequal term spacings.",
      "Putting the two reasons together: the number of days between terms swings between roughly 14.7 and 15.7, and the Gregorian date of a given term also drifts by 1–2 days from year to year. That is just what the sequel to the Solar Terms Song means by 'at most a day or two off'."
    ],
    keyPoints: [
      "The solar terms divide the Sun's ecliptic longitude every 15° — an equal division of angle, not of time.",
      "Kepler's second law: Earth revolves faster near perihelion and slower near aphelion, so terms are ~14.7 days apart in the winter half-year and ~15.7 days in the summer half-year.",
      "Gregorian month lengths and leap-year placement make the date of the same term shift by 1–2 days between adjacent years.",
      "Mean solar terms divide time equally; true solar terms divide ecliptic longitude equally. China has used true solar terms since the Shixian Calendar of 1645, and still does today."
    ],
    myth: "Some people work out the terms by assuming 'each term is a fixed 15 days, so 24 × 15 = 360 days' — the results drift further and further off. In reality the 24 terms span one tropical year of about 365.2422 days, an average spacing of about 15.22 days; and because Earth's orbital speed is uneven, the individual spacings are inherently unequal."
  },
  {
    id: "why-gregorian-stable",
    q: "Why are solar-term dates so stable in the Gregorian calendar?",
    a: [
      "A solar term is essentially a 'mark' on the Sun's position: whether a term has arrived depends only on whether the Sun's apparent ecliptic longitude has reached the prescribed degree, and the cycle repeats with the tropical year (about 365.2422 days). In other words, the solar terms are themselves a 'solar calendar' built on the Sun's motion.",
      "The Gregorian calendar is likewise a solar calendar: it is arranged around the tropical year, with 365-day common years and leap days inserted by the 'leap every 4 years, skip at 100, leap again at 400' rule, giving an average calendar year of 365.2425 days — only about 26 seconds off the tropical year. The two systems reference the same astronomical cycle, so they naturally keep in step.",
      "That is why term dates in the Gregorian calendar are nearly the same every year: in the first half of the year they mostly fall around the 6th and 21st of each month, in the second half around the 8th and 23rd, generally varying by no more than 1–2 days. The main disturbance comes from leap years — the leap day pulls that year's term dates from March onward about one day earlier than the previous year's, and they are then pulled back again, so the same term oscillates slightly between leap and common years; in the 21st century, for example, Start of Spring mostly falls on 3 or 4 February.",
      "By contrast, the traditional Chinese calendar is lunisolar: its months are determined by the phases of the Moon (a synodic month is about 29.53 days), and its years are realigned to the tropical year by intercalation, so Chinese-calendar dates have no fixed correspondence to the solar terms — the same term can differ by more than half a month in Chinese-calendar date from year to year. This is why old almanacs, when marking a solar term, usually write the Gregorian date alongside it."
    ],
    keyPoints: [
      "The solar terms and the Gregorian calendar share the same baseline — the tropical year — so the two are naturally in sync.",
      "The Gregorian rule 'leap every 4 years, skip at 100, leap again at 400' approaches 365.2425 days, differing from the tropical year by only about 26 seconds per year.",
      "Term dates in the Gregorian calendar mostly drift within 1–2 days; leap years are the main source of disturbance.",
      "The traditional Chinese calendar is lunisolar, so its dates have no fixed correspondence with the solar terms."
    ],
    myth: "'The solar terms are part of the Chinese (lunar) calendar, so their dates must be read from it' is a misconception. Under the true-solar-terms method a term is determined solely by solar ecliptic longitude and has nothing to do with the Moon's phases; the terms are relatively fixed in the Gregorian calendar yet drift widely in the Chinese calendar — which shows precisely that they share their astronomical cycle with the Gregorian calendar."
  },
  {
    id: "hemispheres",
    q: "Why are the seasons opposite in the northern and southern hemispheres?",
    a: [
      "Earth is a sphere whose axis is tilted with an essentially fixed direction, so at any position on the orbit one hemisphere always leans toward the Sun while the other leans away. The hemisphere leaning toward the Sun has a higher solar altitude, longer days and more heat — it is in summer; the hemisphere leaning away is in winter. The two hemispheres are therefore forever 'your summer, my winter'.",
      "Take the Summer Solstice as an example: the Sun then stands directly over the Tropic of Cancer, the Northern Hemisphere has long days and short nights in the height of summer, while the Southern Hemisphere has short days and long nights in the depth of winter; half a year later, at the Winter Solstice, the Sun stands over the Tropic of Capricorn and the two hemispheres' seasons swap completely. At the Spring and Autumn Equinoxes the Sun is over the equator, day and night are nearly equal worldwide, and the two hemispheres are each in the spring–autumn transition.",
      "So when the Northern Hemisphere enters the dog days of summer (sanfu), Australia, southern Africa and South America are in winter; when Beijing holds ice-and-snow events at the Winter Solstice, many places in the Southern Hemisphere are just beginning their midsummer holidays. The 24 solar terms were born in China's Yellow River basin, and their names and phenological descriptions (Minor Heat, Major Heat, Minor Snow, Major Snow, the hibernating insects among the three pentads, etc.) all reflect the Northern Hemisphere's rhythm of cold and warmth.",
      "But the astronomical meaning of the terms is the same worldwide: the Summer Solstice is exactly the instant the Sun stands over the Tropic of Cancer, and for the Southern Hemisphere that same day is its 'winter-solstice day', the shortest daylight of its year. Hence when the two hemispheres use the same system of solar terms, the astronomical instants the terms correspond to are identical while the seasons they correspond to are opposite; when arranging farm work, Southern-Hemisphere regions usually 'mirror' the meanings of the terms to fit their own hemisphere's actual season.",
      "There is one more asymmetric detail: the Southern Hemisphere has a much larger share of ocean, and seawater's high heat capacity makes it warm up and cool down slowly, so the annual temperature range at the same latitude is generally milder in the Southern Hemisphere than in the Northern. The seasons are exactly opposite in mechanism, but not symmetric in intensity."
    ],
    keyPoints: [
      "The axial tilt makes the two hemispheres alternately lean toward and away from the Sun, so their seasons are opposite.",
      "The solstices are precisely the two nodes where the hemispheres' seasons swap: one hemisphere's summer-solstice day is the other's winter-solstice day.",
      "The names and phenological descriptions of the 24 solar terms reflect the seasonal rhythm of the Northern Hemisphere.",
      "The astronomical definition of a term (solar ecliptic longitude) is the same worldwide, independent of the observer's hemisphere.",
      "With its larger ocean share, the Southern Hemisphere usually has a milder annual temperature range than the same latitudes in the north."
    ],
    myth: "One claim is that 'since Earth is near perihelion during the Southern Hemisphere's summer, the south must be hotter than the north'. It is true that when Earth passes perihelion in early January the Southern Hemisphere is in summer, but the south is dominated by ocean, which buffers temperature changes strongly, so its summers are not hotter overall than the north's; the dominant controls of seasonal warmth and cold have always been solar altitude and day length, not the Earth–Sun distance."
  }
];

export const glossary = [
  {
    term: "Ecliptic",
    hanzi: "黄道",
    en: "ecliptic",
    explain: "The great circle where the plane of Earth's orbit around the Sun meets the celestial sphere; equivalently, the apparent path the Sun traces against the background stars over a year. It is the reference plane for measuring solar ecliptic longitude and defining the 24 solar terms."
  },
  {
    term: "Ecliptic Longitude of the Sun",
    hanzi: "太阳黄经",
    en: "ecliptic longitude of the Sun",
    explain: "The angular distance measured eastward along the ecliptic from the vernal equinox to the Sun's apparent position, ranging from 0° to 360°. The 24 solar terms are the 24 instants when this longitude reaches integer multiples of 15°: Spring Equinox 0°, Summer Solstice 90°, Autumn Equinox 180°, Winter Solstice 270°, and Start of Spring 315°."
  },
  {
    term: "Vernal Equinox",
    hanzi: "春分点",
    en: "vernal equinox",
    explain: "Of the two intersections of the ecliptic and the celestial equator, the one where the Sun crosses the equator from south to north; by convention its longitude is fixed at 0°, and it is also the starting point for measuring the tropical year. Because of precession, the vernal equinox drifts slowly westward along the ecliptic against the background stars."
  },
  {
    term: "Tropical Year",
    hanzi: "回归年",
    en: "tropical year",
    explain: "The interval between two successive passages of the Sun's apparent ecliptic longitude through 0° (two spring equinoxes), about 365.2422 days. It is the cycle of the seasons, and both the Gregorian calendar and the solar terms are arranged by reference to it; because the equinox drifts westward, the tropical year is about 20 minutes shorter than the sidereal year."
  },
  {
    term: "Obliquity of the Ecliptic",
    hanzi: "黄赤交角",
    en: "obliquity of the ecliptic",
    explain: "The angle between the ecliptic plane and the celestial equator, currently about 23.4°, arising from the tilt of Earth's rotation axis relative to its orbital plane. The sub-solar point therefore moves between 23.4° N and 23.4° S (the two tropics), which produces the seasons; the angle is slowly decreasing on a scale of tens of thousands of years."
  },
  {
    term: "Apparent Geocentric Ecliptic Longitude",
    hanzi: "地心视黄经",
    en: "apparent geocentric ecliptic longitude",
    explain: "The ecliptic longitude of the direction in which the Sun 'actually appears' as seen from Earth's centre: the geometric position corrected for nutation, aberration and light time (sunlight takes about 8 minutes 20 seconds to reach Earth). Solar terms should be defined by this apparent longitude, not by the mean longitude or the uncorrected geometric longitude."
  },
  {
    term: "True / Mean Solar Terms",
    hanzi: "定气法 / 平气法",
    en: "true / mean solar terms",
    explain: "Two methods of computing the solar terms. The mean method (pingqi fa) divides the tropical year into 24 equal intervals of time, giving constant spacings; the true method (dingqi fa) places one term per 15° of apparent solar longitude, reflecting the Sun's real motion, so the spacings are unequal because orbital speed varies. China has used the true method since the Shixian Calendar (in effect from 1645), and still does today."
  },
  {
    term: "Instant of a Solar Term",
    hanzi: "交节时刻",
    en: "instant of a solar term",
    explain: "The precise moment when the Sun's apparent geocentric ecliptic longitude reaches the degree assigned to a given term. It is an instant, not a whole day, and can be given to the hour, minute and second. Saying in daily life that 'a term falls on such-and-such a day' refers to the date on which that instant lands after conversion to Beijing Time."
  },
  {
    term: "Perihelion and Aphelion",
    hanzi: "近日点与远日点",
    en: "perihelion and aphelion",
    explain: "The two points of Earth's orbit closest to and farthest from the Sun, currently reached in early January and early July respectively. Earth revolves faster near perihelion and slower near aphelion — the direct reason why term spacings in the winter half-year are shorter than in the summer half-year."
  },
  {
    term: "Leap Month without a Mid-Climate",
    hanzi: "无中气置闰",
    en: "intercalary month rule (leap month without a mid-term)",
    explain: "The traditional Chinese rule for placing leap months: of the 24 solar terms, the 12 in even-numbered positions are the 'mid-climates' (zhongqi: Rain Water, Spring Equinox, Grain Rain, …), and any synodic month that contains no mid-climate is made a leap month. Established by the Taichu Calendar of the Western Han, this rule keeps the Chinese-calendar year aligned with the tropical year."
  }
];

export const precision = {
  title: "Computation precision and simplifications on this page",
  items: [
    "Solar ecliptic longitudes are computed with the open-source library astronomy-engine, which implements the algorithms of Meeus's Astronomical Algorithms on the basis of the VSOP87 planetary theory and the IAU 1980 nutation model. This site uses the apparent geocentric ecliptic longitude (including aberration and light-time corrections); the term instants are accurate to about 1 minute — far better than needed for naked-eye observation or popular display.",
    "All term instants shown on the pages are converted uniformly to Beijing Time (Asia/Shanghai, UTC+8). A solar term is itself a single global astronomical instant, but converted into different time zones the calendar 'date' it lands on may differ by one day.",
    "In the 3D scene, body sizes and the Sun–Earth distance are not drawn to scale: the true mean Sun–Earth distance is about 149.6 million km (1 AU), the Sun's diameter is about 109 times Earth's, and the Sun–Earth distance is about 23481 Earth radii; at true scale Earth would be a single pixel in the frame, and the Sun and planets could never be shown on one screen. The scene keeps only the two features directly relevant to the cause of the seasons — the nearly circular orbit and the ~23.4° obliquity of the ecliptic.",
    "Earth's real orbit is an ellipse with an eccentricity of about 0.0167 — perihelion in early January, aphelion in early July; to highlight the main thread that 'the axial tilt determines the seasons', the scene draws the orbit as nearly circular. This simplification does not affect the solar terms — a term depends only on solar ecliptic longitude, not on the Earth–Sun distance.",
    "Precession makes the vernal equinox drift slowly westward along the ecliptic at a rate of about 1° per 71.6 years (a full circuit in about 25800 years). Over a few thousand years the 'starry background of the terms' therefore changes markedly — today's vernal equinox, for instance, no longer lies in Aries. But the tropical year is itself defined by reference to the moving equinox, so its length, and the Gregorian dates of the terms, are unaffected by precession.",
    "The extrapolation accuracy of astronomical algorithms decreases the further they reach in time: for the modern era (about 1800–2200) this site's results can be used with confidence; for more distant historical or future years, the irregular variation of Earth's rotation (ΔT) brings uncertainties of more than a minute, so those results are for reference only.",
    "The historical, folkloric and phenological content on this page is written for popular science, to help explain the cultural background of the solar terms; for specific dates, original source texts and scholarly conclusions, please rely on the authoritative references."
  ]
};
