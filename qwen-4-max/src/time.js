import { MIN_YEAR, MAX_YEAR, beijingYear, clampYear } from './astro.js';
import { beijingInputValue } from './format.js';

// Single source of truth for simulation time. Everything (3D, timeline, details)
// reads from this controller so nothing can drift out of sync.
export const SPEEDS = {
  realtime: 1,
  hour: 3600,
  day: 86400,
  week: 604800,
  month: 2592000,
};
export const SPEED_KEYS = ['realtime', 'hour', 'day', 'week', 'month'];

const MIN_MS = Date.UTC(MIN_YEAR, 0, 1) - 8 * 3600 * 1000;
const MAX_MS = Date.UTC(MAX_YEAR, 11, 31, 23, 59, 59) - 8 * 3600 * 1000;

export class TimeController {
  constructor() {
    this.mode = 'live';        // 'live' | 'play' | 'pause'
    this.simTime = Date.now();
    this.speedKey = 'day';
    this.speed = SPEEDS.day;
  }

  tick(dtMs) {
    if (this.mode === 'live') {
      this.simTime = Date.now();
    } else if (this.mode === 'play') {
      this.simTime += this.speed * dtMs;
      if (this.simTime >= MAX_MS) { this.simTime = MAX_MS; this.mode = 'pause'; }
      if (this.simTime <= MIN_MS) { this.simTime = MIN_MS; this.mode = 'pause'; }
    }
  }

  toggle() {
    if (this.mode === 'play') this.mode = 'pause';
    else this.mode = 'play';
  }

  play() { this.mode = 'play'; }
  pause() { this.mode = 'pause'; }

  setSpeed(key) {
    if (SPEEDS[key] != null) { this.speedKey = key; this.speed = SPEEDS[key]; }
  }

  setTime(ms) {
    this.simTime = Math.min(MAX_MS, Math.max(MIN_MS, ms));
    this.mode = 'pause';
  }

  backToToday() {
    this.simTime = Date.now();
    this.mode = 'live';
  }

  setYear(year) {
    year = clampYear(year);
    const v = beijingInputValue(this.simTime); // YYYY-MM-DDTHH:mm in Beijing
    const [, mo, d, h, mi] = v.split(/[-T:]/).map(Number);
    const day = Math.min(d, daysInMonth(year, mo));
    this.simTime = Date.UTC(year, mo - 1, day, h, mi) - 8 * 3600 * 1000;
    this.mode = 'pause';
  }

  nudge(ms) { this.setTime(this.simTime + ms); }

  get year() { return beijingYear(this.simTime); }

  isSimulated() {
    return this.mode !== 'live' || Math.abs(this.simTime - Date.now()) > 60000;
  }
}

function daysInMonth(year, month) {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}