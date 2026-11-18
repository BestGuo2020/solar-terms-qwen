// Date/number formatting. All user-facing times use Asia/Shanghai (UTC+8).
const TZ = 'Asia/Shanghai';

function fmt(dateMs, lang, options) {
  return new Intl.DateTimeFormat(lang === 'zh' ? 'zh-CN' : 'en-GB', {
    timeZone: TZ,
    ...options,
  }).format(new Date(dateMs));
}

export function formatDate(dateMs, lang) {
  return fmt(dateMs, lang, { year: 'numeric', month: 'long', day: 'numeric' });
}

export function formatShortDate(dateMs, lang) {
  return fmt(dateMs, lang, { month: 'short', day: 'numeric' });
}

export function formatTime(dateMs, lang) {
  return fmt(dateMs, lang, { hour: '2-digit', minute: '2-digit', hour12: false });
}

export function formatDateTime(dateMs, lang) {
  return fmt(dateMs, lang, {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: false,
  });
}

export function formatFullDateTime(dateMs, lang) {
  return fmt(dateMs, lang, {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  });
}

// Parts in Beijing time, for <input type="datetime-local"> values.
export function beijingInputValue(dateMs) {
  const d = new Date(dateMs + 8 * 3600 * 1000);
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())}T${p(d.getUTCHours())}:${p(d.getUTCMinutes())}`;
}

// Parse a datetime-local value (interpreted as Beijing time) back to ms UTC.
export function parseBeijingInput(value) {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);
  if (!m) return null;
  const [, y, mo, d, h, mi] = m.map(Number);
  return Date.UTC(y, mo - 1, d, h, mi) - 8 * 3600 * 1000;
}

export function beijingYearOf(dateMs) {
  return new Date(dateMs + 8 * 3600 * 1000).getUTCFullYear();
}

export function formatDeg(deg, digits = 1) {
  return `${deg.toFixed(digits)}°`;
}

export function formatDuration(ms, lang) {
  const totalMin = Math.round(ms / 60000);
  const days = Math.floor(totalMin / 1440);
  const hours = Math.floor((totalMin % 1440) / 60);
  const mins = totalMin % 60;
  if (lang === 'zh') {
    if (days > 0) return `${days} 天 ${hours} 小时`;
    if (hours > 0) return `${hours} 小时 ${mins} 分`;
    return `${mins} 分钟`;
  }
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}