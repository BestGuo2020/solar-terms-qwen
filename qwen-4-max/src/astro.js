// Astronomical engine wrapper.
// Solar ecliptic longitude and the 24 solar-term instants are computed with
// `astronomy-engine` (VSOP87-based, apparent geocentric longitude of date).
// Verified against known equinox/solstice instants to within a few seconds.
import * as Astronomy from 'astronomy-engine';

export const MIN_YEAR = 1900;
export const MAX_YEAR = 2100;
export const BEIJING_OFFSET_MS = 8 * 3600 * 1000; // Asia/Shanghai = UTC+8, no DST

// Traditional order starting at 立春. lon = geocentric apparent solar longitude (deg).
export const TERM_ORDER = [
  { index: 0, lon: 315 }, // 立春
  { index: 1, lon: 330 }, // 雨水
  { index: 2, lon: 345 }, // 惊蛰
  { index: 3, lon: 0 },   // 春分
  { index: 4, lon: 15 },  // 清明
  { index: 5, lon: 30 },  // 谷雨
  { index: 6, lon: 45 },  // 立夏
  { index: 7, lon: 60 },  // 小满
  { index: 8, lon: 75 },  // 芒种
  { index: 9, lon: 90 },  // 夏至
  { index: 10, lon: 105 },// 小暑
  { index: 11, lon: 120 },// 大暑
  { index: 12, lon: 135 },// 立秋
  { index: 13, lon: 150 },// 处暑
  { index: 14, lon: 165 },// 白露
  { index: 15, lon: 180 },// 秋分
  { index: 16, lon: 195 },// 寒露
  { index: 17, lon: 210 },// 霜降
  { index: 18, lon: 225 },// 立冬
  { index: 19, lon: 240 },// 小雪
  { index: 20, lon: 255 },// 大雪
  { index: 21, lon: 270 },// 冬至
  { index: 22, lon: 285 },// 小寒
  { index: 23, lon: 300 },// 大寒
];

export const CARDINAL_INDEXES = new Set([3, 9, 15, 21]); // 春分 夏至 秋分 冬至

// Calendar order of the terms within one Gregorian year (小寒 first, 冬至 last).
const CALENDAR_ORDER = [22, 23, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21];
const LON_BY_INDEX = new Map(TERM_ORDER.map((t) => [t.index, t.lon]));

const yearCache = new Map();

export function clampYear(year) {
  return Math.min(MAX_YEAR, Math.max(MIN_YEAR, Math.round(year)));
}

export function beijingYear(dateMs) {
  return new Date(dateMs + BEIJING_OFFSET_MS).getUTCFullYear();
}

// Apparent geocentric ecliptic longitude of the Sun, degrees in [0, 360).
export function solarLongitude(dateMs) {
  const t = Astronomy.MakeTime(new Date(dateMs));
  return Astronomy.SunPosition(t).elon;
}

// Earth's heliocentric ecliptic longitude = solar longitude + 180°.
export function earthLongitude(dateMs) {
  return (solarLongitude(dateMs) + 180) % 360;
}

// Compute the 24 term instants (ms UTC) whose dates fall in the given Gregorian year.
export function yearTerms(year) {
  year = clampYear(year);
  if (yearCache.has(year)) return yearCache.get(year);

  const entries = [];
  let cursor = new Date(Date.UTC(year, 0, 1, 0, 0, 0));
  for (let k = 0; k < CALENDAR_ORDER.length; k++) {
    const index = CALENDAR_ORDER[k];
    const lon = LON_BY_INDEX.get(index);
    const limit = k === 0 ? 20 : 40;
    const found = Astronomy.SearchSunLongitude(lon, cursor, limit);
    if (!found) throw new Error(`Failed to find term ${index} (lon ${lon}) in ${year}`);
    const ms = found.date.getTime();
    entries.push({ index, lon, year, timeMs: ms });
    cursor = found.date;
  }
  entries.sort((a, b) => a.timeMs - b.timeMs);
  yearCache.set(year, entries);
  return entries;
}

// The term interval containing dateMs, plus the next term instant.
// Looks across year boundaries so early January correctly resolves to 冬至 of the prior year.
const poolCache = new Map();
function getPool(y) {
  if (poolCache.has(y)) return poolCache.get(y);
  const pool = [];
  for (let yy = y - 1; yy <= y + 1; yy++) {
    if (yy < MIN_YEAR || yy > MAX_YEAR) continue;
    for (const e of yearTerms(yy)) pool.push(e);
  }
  pool.sort((a, b) => a.timeMs - b.timeMs);
  poolCache.set(y, pool);
  return pool;
}

export function termAt(dateMs) {
  const pool = getPool(beijingYear(dateMs));
  let lo = 0, hi = pool.length - 1, idx = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (pool[mid].timeMs <= dateMs) { idx = mid; lo = mid + 1; } else hi = mid - 1;
  }
  if (idx < 0) return { current: pool[0], next: pool[1] || pool[0] };
  return { current: pool[idx], next: pool[idx + 1] || null };
}

// Convenience: term instant for a specific index within a specific year.
export function termInstant(year, index) {
  const e = yearTerms(year).find((t) => t.index === index);
  return e ? e.timeMs : null;
}