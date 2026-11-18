<script setup>
import { SONG } from '../../data/content.js'
import { TERMS } from '../../data/terms.js'
import { locale, t } from '../../i18n.js'
import { selectTerm, sim } from '../../state/simulation.js'

function pick (termIndex) {
  if (termIndex == null) return
  selectTerm(termIndex)
  document.getElementById('scene')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}
function tokenTitle (token) {
  if (token.term == null) return ''
  const term = TERMS[token.term]
  return `${term[locale.value].name} · λ ${term.lon}°`
}
</script>

<template>
  <section id="song" class="reading-section song-section">
    <header class="section-head reveal">
      <span class="section-kicker">SONG</span>
      <h2>{{ SONG.title[locale] }}</h2>
      <p class="section-sub">{{ SONG.note[locale] }}</p>
    </header>
    <div class="song-card reveal">
      <div v-for="(line, li) in SONG.lines" :key="li" class="song-line-block">
        <div class="song-line" :lang="locale === 'zh' ? 'zh-CN' : 'en'">
          <template v-for="(token, ti) in line.tokens" :key="ti">
            <button v-if="token.term != null" type="button" class="song-token"
              :class="{ active: sim.termCtx.current.index === token.term }"
              :title="tokenTitle(token)" :aria-label="tokenTitle(token)"
              @click="pick(token.term)">{{ token.ch }}</button>
            <span v-else class="song-token filler" aria-hidden="true">{{ token.ch }}</span>
          </template>
        </div>
        <p class="song-explain">{{ line.explain[locale] }}</p>
      </div>
    </div>
  </section>
</template>