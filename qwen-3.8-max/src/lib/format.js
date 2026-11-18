/**
 * format.js — 与语言相关的时刻格式化
 *
 * 天文计算内部一律用 UTC 毫秒；展示时才按语言格式化：
 *  · zh：2026-10-08 14:29:58 / 2026年10月8日 14:29:58（星期四）
 *  · en：08 Oct 2026 14:29:58 / Thursday 8 Oct 2026, 14:29:58
 * 两者都固定按 Asia/Shanghai 时区解释。
 */
import { fmtBeijing, fmtBeijingLong } from './astro.js'

const enShort = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Asia/Shanghai', year: 'numeric', month: 'short', day: '2-digit',
  hour: '2-digit', minute: '2-digit', hour12: false,
})
const enShortSec = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Asia/Shanghai', year: 'numeric', month: 'short', day: '2-digit',
  hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
})
const enLong = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Asia/Shanghai', weekday: 'long', year: 'numeric', month: 'short', day: '2-digit',
  hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
})

function clean(s) {
  // en-GB 输出形如 "08 Oct 2026, 14:29:58"；统一成空格分隔，避免出现 ",," 之类
  return s.replace(/,\s*/g, ' ').replace(/\s+/g, ' ').trim()
}

/** 短格式：日期 + 时:分[:秒] */
export function fmtInstant(ms, locale, { seconds = false } = {}) {
  if (locale !== 'en') return fmtBeijing(ms, { seconds })
  return clean((seconds ? enShortSec : enShort).format(new Date(ms)))
}

/** 长格式：含星期 */
export function fmtInstantLong(ms, locale, { seconds = true } = {}) {
  if (locale !== 'en') return fmtBeijingLong(ms, { seconds })
  return clean(enLong.format(new Date(ms)))
}
