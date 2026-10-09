<script setup>
/**
 * SectionSong.vue — 二十四节气歌（中/英双语）
 *
 * 逐字切分并映射到节气。重复的字（两个"春"、两个"夏"、两个"雪"、两个"冬"）
 * 按**所在位置**分别映射，点击任意简称都会联动 3D 场景与详情面板。
 * 歌诀原文在两种语言下都保留汉字；英文界面额外给出每个字的解释与节气英文名。
 */
import { ref, computed } from 'vue'
import { selectTerm, sim } from '../lib/simClock.js'
import { useI18n, isEn } from '../i18n/index.js'
import { content } from '../i18n/content.js'

const { t } = useI18n()
const song = computed(() => content.value.song)
const termsByIndex = computed(() => content.value.termsByIndex)
const activeIdx = ref(null)

function indexesOf(tok) {
  return tok.termIndexes || (tok.termIndex == null ? [] : [tok.termIndex])
}
function namesOf(tok) {
  return indexesOf(tok).map((i) => termsByIndex.value.get(i)?.title).filter(Boolean)
}

function onPick(tok) {
  const idxs = indexesOf(tok)
  if (!idxs.length) return
  activeIdx.value = tok
  selectTerm(idxs[0])
  document.getElementById('top')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

const activeExplain = computed(() => {
  if (!activeIdx.value) return null
  const tok = activeIdx.value
  return { chars: tok.chars, explain: tok.explain, terms: indexesOf(tok).map((i) => termsByIndex.value.get(i)).filter(Boolean) }
})

/** 每句的 tokens 覆盖的字数应与原句去标点后的字数一致，否则说明切分有问题 */
const integrity = computed(() =>
  song.value.lines.map((l) => {
    const tokChars = l.tokens.reduce((s, tk) => s + [...tk.chars].length, 0)
    const rawChars = [...l.text.replace(/[，。、；：！？\s]/g, '')].length
    return { text: l.text, ok: tokChars === rawChars, tokChars, rawChars }
  }),
)
const allOk = computed(() => integrity.value.every((x) => x.ok))
</script>

<template>
  <section class="sec" id="song" aria-labelledby="song-t">
    <div class="sec__head">
      <span class="sec__no">{{ t('sec.song.no') }}</span>
      <h2 class="sec__title" id="song-t">{{ t('sec.song.title') }}</h2>
    </div>
    <p class="sec__lede">
      {{ t('sec.song.lede') }}
      <b>{{ t('sec.song.lede.b') }}</b>{{ t('sec.song.lede2') }}
    </p>

    <div class="song">
      <div class="song__line" v-for="(line, li) in song.lines" :key="li">
        <button
          v-for="(tok, ti) in line.tokens"
          :key="ti"
          type="button"
          class="song__tok"
          :class="{ 'is-active': activeIdx === tok, 'is-major': indexesOf(tok).some((i) => termsByIndex.get(i)?.major) }"
          :disabled="!indexesOf(tok).length"
          :title="indexesOf(tok).length ? t('sec.song.tokTitle', { c: tok.chars, names: namesOf(tok).join(' / ') }) : t('sec.song.fillerTitle', { e: tok.explain })"
          :aria-label="indexesOf(tok).length ? t('sec.song.tokAria', { c: tok.chars, names: namesOf(tok).join(' / ') }) : `${tok.chars}, ${tok.explain}`"
          @click="onPick(tok)"
        >{{ tok.chars }}</button>
        <span class="song__punct" v-if="li < song.lines.length - 1" aria-hidden="true">{{ li % 2 === 0 ? '，' : '。' }}</span>
      </div>

      <div class="song__explain" v-if="activeExplain">
        <b>「{{ activeExplain.chars }}」</b>
        <template v-if="activeExplain.terms.length">
          {{ t('sec.song.explainActive') }}
          <b v-for="(tt, i) in activeExplain.terms" :key="tt.index">
            {{ tt.title }}<template v-if="!isEn">（第 {{ tt.index }} 个，太阳黄经 {{ tt.longitude }}°）</template><template v-else> (term {{ tt.index }}, λ☉ {{ tt.longitude }}°)</template><template v-if="i < activeExplain.terms.length - 1">, </template>
          </b>
        </template>
        <br />{{ activeExplain.explain }}
      </div>
      <div class="song__explain" v-else>
        {{ t('sec.song.hint') }}
        <b>{{ sim.current.name }}</b>{{ t('sec.song.hint2', { t: sim.shownDateTime }) }}
      </div>

      <div class="song__legend">
        <span class="song__chip" v-for="l in song.lines" :key="l.text">
          <b>{{ l.text.slice(0, 1) }}</b>
          {{ l.tokens.map((tk) => (indexesOf(tk).length ? namesOf(tk).join('+') : '—')).join(' · ') }}
        </span>
      </div>
    </div>

    <h3 class="sub-title">{{ t('sec.song.subCompare') }}</h3>
    <div class="cards">
      <div class="card" v-for="(line, li) in song.lines" :key="li">
        <div class="card__title" lang="zh-Hans">{{ line.text }}</div>
        <ul class="card__list">
          <li v-for="(tok, ti) in line.tokens" :key="ti">
            <b lang="zh-Hans">{{ tok.chars }}</b>
            <template v-if="indexesOf(tok).length">
              → {{ namesOf(tok).join(isEn ? ', ' : '、') }}
              <button type="button" class="link-btn" @click="onPick(tok)">{{ t('sec.song.view') }}</button>
            </template>
            <template v-else> {{ t('sec.song.filler') }}</template>
            <span class="card__note">{{ tok.explain }}</span>
          </li>
        </ul>
      </div>
    </div>

    <h3 class="sub-title">{{ t('sec.song.subMnemonic') }}</h3>
    <div class="song" style="padding:16px 18px">
      <p style="font-family:var(--font-serif);font-size:19px;letter-spacing:0.1em;line-height:2;margin:0 0 10px;color:var(--ink-text);white-space:pre-line" lang="zh-Hans">{{ song.dateMnemonic.text }}</p>
      <ul class="card__list">
        <li v-for="(e, i) in song.dateMnemonic.explain" :key="i">{{ e }}</li>
      </ul>
      <div class="callout callout--warn" style="margin:12px 0 0">
        <div class="callout__t">{{ t('sec.song.mnemonicCallout') }}</div>
        {{ song.dateMnemonic.caveat }}
      </div>
    </div>

    <div class="callout callout--gold">
      <div class="callout__t">{{ song.about.title }}</div>
      {{ song.about.text }}
    </div>

    <p v-if="!allOk" class="callout callout--warn">
      <b>{{ t('sec.song.integrityBad') }}</b>
      <span v-for="x in integrity.filter((i) => !i.ok)" :key="x.text">
        「{{ x.text }}」{{ x.tokChars }} / {{ x.rawChars }};
      </span>
    </p>
    <p v-else class="integrity-ok">{{ t('sec.song.integrityOk') }}</p>
  </section>
</template>

<style scoped>
.sub-title {
  font-family: var(--font-serif); font-size: 17px; letter-spacing: 0.1em;
  color: var(--ink-accent); margin: 26px 0 6px; font-weight: 600;
}
.link-btn {
  border: 0; background: transparent; color: var(--ink-accent); cursor: pointer;
  font-size: 12px; text-decoration: underline; padding: 0 2px; font-family: inherit;
}
.link-btn:hover { color: var(--vermilion); }
.integrity-ok { font-size: 12.5px; color: var(--ink-text-soft); margin-top: 14px; line-height: 1.8; }
</style>
