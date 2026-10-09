/**
 * i18n/index.js — 极简 i18n 层
 *
 * 设计：
 *  · `locale` 为 'zh' | 'en'，持久化到 localStorage，默认跟随浏览器语言；
 *  · `t(key, vars)` 查词典；zh 词典缺失时回退到 key 本身（key 即中文原文的占位名）；
 *  · 内容型数据（24 节气文案、历史、文化、节气歌、科普、来源）不走词典，
 *    而是由 `src/i18n/content.js` 按 locale 选择中/英数据集；
 *  · 切换语言时同步 <html lang> 与 document.title。
 */
import { ref, computed } from 'vue'
import zh from './zh.js'
import en from './en.js'

const LS_KEY = 'jieqi24.locale'
const dicts = { zh, en }

function detectLocale() {
  try {
    const saved = localStorage.getItem(LS_KEY)
    if (saved === 'en' || saved === 'zh') return saved
  } catch { /* 隐私模式等 */ }
  const nav = typeof navigator !== 'undefined' ? (navigator.language || '') : ''
  return /^en/i.test(nav) ? 'en' : 'zh'
}

export const locale = ref(detectLocale())
export const isEn = computed(() => locale.value === 'en')

export function setLocale(next) {
  locale.value = next === 'en' ? 'en' : 'zh'
  try { localStorage.setItem(LS_KEY, locale.value) } catch { /* ignore */ }
  applyDocMeta()
}

/**
 * 取当前语言的文案。vars 用 {name} 形式插值。
 * 英语词典缺某个 key 时回退中文，保证界面永不出现裸 key。
 */
export function t(key, vars) {
  const dict = dicts[locale.value] || dicts.zh
  let s = dict[key]
  if (s === undefined) s = dicts.zh[key]
  if (s === undefined) s = key
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      s = s.split(`{${k}}`).join(String(v))
    }
  }
  return s
}

export function useI18n() {
  return { t, locale, isEn, setLocale }
}

export function applyDocMeta() {
  if (typeof document === 'undefined') return
  document.documentElement.lang = locale.value === 'en' ? 'en' : 'zh-CN'
  document.title = t('doc.title')
}
