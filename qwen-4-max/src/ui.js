import { TERMS, TERM_BY_INDEX, SEASONS } from './terms-data.js';
import { HISTORY, CULTURE, SONG, SCIENCE, REFERENCES, DATA_NOTE } from './culture-data.js';
import { t } from './i18n.js';
import { yearTerms, MIN_YEAR, MAX_YEAR, CARDINAL_INDEXES } from './astro.js';
import { SPEED_KEYS } from './time.js';
import {
  formatDateTime, formatFullDateTime, formatDeg, formatDuration,
  beijingInputValue, parseBeijingInput,
} from './format.js';

const MONTHS_ZH = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
const MONTHS_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function esc(s) {
  return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

export class UI {
  constructor(root, cb) {
    this.root = root;
    this.cb = cb;
    this.lang = 'zh';
    this.lastDetailIndex = -1;
    this.lastTickYear = -1;
    this.dragging = false;
    this.build();
    this.bind();
  }

  build() {
    this.root.innerHTML = `
      <header class="topbar">
        <div class="brand">
          <h1 data-i18n="appTitle"></h1>
          <p class="subtitle" data-i18n="subtitle"></p>
        </div>
        <div class="topbar-right">
          <div class="time-readout">
            <span class="badge" id="time-badge"></span>
            <span class="datetime" id="datetime"></span>
            <span class="tz" data-i18n="beijingTime"></span>
          </div>
          <label class="year-wrap"><span data-i18n="yearLabel"></span><select id="year-select" aria-label="year"></select></label>
          <button id="lang-toggle" class="lang-btn" aria-label="language"></button>
        </div>
      </header>
      <main class="stage">
        <div class="scene-wrap">
          <div id="scene-container"></div>
          <div class="scene-overlay">
            <div class="overlay-top-right">
              <div class="view-buttons" role="group">
                <button data-view="overview" data-i18n="viewOverview"></button>
                <button data-view="closeup" data-i18n="viewCloseup"></button>
                <button data-view="default" data-i18n="viewDefault"></button>
              </div>
              <div class="helper-toggles">
                <label><input type="checkbox" data-helper="axis"><span data-i18n="axis"></span></label>
                <label><input type="checkbox" data-helper="equator"><span data-i18n="equator"></span></label>
                <label><input type="checkbox" data-helper="tropics"><span data-i18n="tropics"></span></label>
                <label><input type="checkbox" data-helper="direction"><span data-i18n="direction"></span></label>
              </div>
            </div>
            <div class="overlay-bottom-left">
              <span class="not-to-scale" data-i18n="notToScale"></span>
              <span class="drag-hint" data-i18n="dragHint"></span>
            </div>
            <div class="loading" id="loading"><span class="spinner"></span><span data-i18n="loading"></span></div>
            <div class="tex-error" id="tex-error" hidden data-i18n="textureFallback"></div>
          </div>
        </div>
        <aside class="details" id="details" aria-live="polite"></aside>
      </main>
      <section class="controls">
        <div class="controls-row">
          <button id="play-btn" class="play-btn"></button>
          <label class="speed-wrap"><span data-i18n="speed"></span><select id="speed-select"></select></label>
          <label class="date-wrap"><span data-i18n="dateLabel"></span><input type="datetime-local" id="date-input"></label>
          <button id="today-btn" class="today-btn" data-i18n="backToday"></button>
          <span class="keyboard-hint" data-i18n="keyboard"></span>
        </div>
        <div class="timeline-wrap">
          <div class="timeline-head"><span data-i18n="timeline"></span><span id="timeline-year"></span></div>
          <div class="timeline" id="timeline" tabindex="0" role="slider" aria-label="year timeline">
            <div class="timeline-track" id="timeline-track">
              <div class="timeline-months" id="timeline-months"></div>
              <div class="timeline-ticks" id="timeline-ticks"></div>
              <div class="timeline-thumb" id="timeline-thumb"></div>
            </div>
          </div>
        </div>
      </section>
      <div class="reading" id="reading"></div>
      <footer class="footer"><span data-i18n="footer"></span></footer>
    `;

    this.sceneContainer = this.root.querySelector('#scene-container');
    this.refs = {
      badge: this.root.querySelector('#time-badge'),
      datetime: this.root.querySelector('#datetime'),
      yearSelect: this.root.querySelector('#year-select'),
      langToggle: this.root.querySelector('#lang-toggle'),
      details: this.root.querySelector('#details'),
      playBtn: this.root.querySelector('#play-btn'),
      speedSelect: this.root.querySelector('#speed-select'),
      dateInput: this.root.querySelector('#date-input'),
      todayBtn: this.root.querySelector('#today-btn'),
      timeline: this.root.querySelector('#timeline'),
      track: this.root.querySelector('#timeline-track'),
      months: this.root.querySelector('#timeline-months'),
      ticks: this.root.querySelector('#timeline-ticks'),
      thumb: this.root.querySelector('#timeline-thumb'),
      timelineYear: this.root.querySelector('#timeline-year'),
      reading: this.root.querySelector('#reading'),
      loading: this.root.querySelector('#loading'),
      texError: this.root.querySelector('#tex-error'),
    };

    for (let y = MIN_YEAR; y <= MAX_YEAR; y++) {
      const o = document.createElement('option');
      o.value = y; o.textContent = y;
      this.refs.yearSelect.appendChild(o);
    }
    for (const key of SPEED_KEYS) {
      const o = document.createElement('option');
      o.value = key; o.dataset.i18n = 'speed' + key.charAt(0).toUpperCase() + key.slice(1);
      this.refs.speedSelect.appendChild(o);
    }
  }

  bind() {
    this.refs.langToggle.addEventListener('click', () => this.cb.onLang(this.lang === 'zh' ? 'en' : 'zh'));
    this.refs.playBtn.addEventListener('click', () => this.cb.onPlayToggle());
    this.refs.todayBtn.addEventListener('click', () => this.cb.onBackToday());
    this.refs.speedSelect.addEventListener('change', (e) => this.cb.onSpeed(e.target.value));
    this.refs.yearSelect.addEventListener('change', (e) => this.cb.onYear(Number(e.target.value)));
    this.refs.dateInput.addEventListener('change', (e) => {
      const ms = parseBeijingInput(e.target.value);
      if (ms != null) this.cb.onDate(ms);
    });

    this.root.querySelectorAll('[data-view]').forEach((b) =>
      b.addEventListener('click', () => this.cb.onView(b.dataset.view)));
    this.root.querySelectorAll('[data-helper]').forEach((inp) =>
      inp.addEventListener('change', () => this.cb.onHelper(inp.dataset.helper, inp.checked)));

    // Delegated term jumps (term list + song tokens).
    this.root.addEventListener('click', (e) => {
      const el = e.target.closest('[data-term]');
      if (el) this.cb.onTermClick(Number(el.dataset.term));
    });

    // Timeline dragging.
    const track = this.refs.track;
    const msFromEvent = (e) => {
      const rect = track.getBoundingClientRect();
      const frac = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
      const year = this.lastTickYear;
      const start = Date.UTC(year, 0, 1) - 8 * 3600 * 1000;
      const end = Date.UTC(year + 1, 0, 1) - 8 * 3600 * 1000;
      return start + frac * (end - start);
    };
    track.addEventListener('pointerdown', (e) => {
      this.dragging = true;
      track.setPointerCapture(e.pointerId);
      this.cb.onTimeline(msFromEvent(e));
    });
    track.addEventListener('pointermove', (e) => { if (this.dragging) this.cb.onTimeline(msFromEvent(e)); });
    const endDrag = (e) => { this.dragging = false; try { track.releasePointerCapture(e.pointerId); } catch (_) {} };
    track.addEventListener('pointerup', endDrag);
    track.addEventListener('pointercancel', endDrag);
  }

  applyLanguage(lang) {
    this.lang = lang;
    document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
    this.root.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = t(lang, el.dataset.i18n); });
    this.refs.langToggle.textContent = t(lang, 'langToggle');
    this.lastDetailIndex = -1; // force details re-render
    this.renderReading();
    this.buildTimelineTicks(this.lastTickYear < 0 ? new Date().getFullYear() : this.lastTickYear);
  }

  renderDetails(state) {
    const lang = this.lang;
    const term = TERM_BY_INDEX.get(state.currentTerm.index);
    const d = term[lang];
    const season = SEASONS[term.season];
    const next = state.nextTerm ? TERM_BY_INDEX.get(state.nextTerm.index)[lang].name : '—';
    const poem = d.poem;
    const poemHtml = lang === 'zh'
      ? `<div class="poem-text">${esc(poem.text)}</div><div class="poem-src">— ${esc(poem.author)} ${esc(poem.source)}</div>`
      : `<div class="poem-text">${esc(poem.text)}</div><div class="poem-gloss">${esc(poem.gloss)}</div><div class="poem-src">— ${esc(poem.author)}, ${esc(poem.source)} · ${t(lang, 'poemGloss')}</div>`;

    const field = (key, val) => `<div class="field"><h4>${t(lang, key)}</h4><p>${esc(val)}</p></div>`;

    this.refs.details.innerHTML = `
      <div class="detail-header" style="--season:${season.color}">
        <div class="detail-order">${t(lang, 'order')} ${term.index + 1} / 24 · ${formatDeg(term.lon, 0)}</div>
        <h2 class="detail-name">${esc(d.name)}</h2>
        <div class="detail-sub">${term.zh.pinyin ? esc(term.zh.pinyin) + ' · ' : ''}<span class="season-tag">${season[lang]}</span></div>
        <div class="detail-lon">${t(lang, 'solarLon')}: <b id="solar-lon"></b></div>
      </div>
      <div class="detail-instant">
        <div class="instant-row"><span>${t(lang, 'currentInterval')}</span><b>${esc(d.name)}</b></div>
        <div class="instant-row"><span>${t(lang, 'termInstant')}</span><b>${formatDateTime(state.currentTerm.timeMs, lang)}</b></div>
        <div class="instant-row"><span>${t(lang, 'nextTerm')}</span><b>${esc(next)} · <span id="next-countdown"></span></b></div>
      </div>
      <div class="detail-fields">
        ${field('meaning', d.meaning)}
        ${field('climate', d.climate)}
        ${field('farm', d.farm)}
        ${field('custom', d.custom)}
        <div class="field poem-field"><h4>${t(lang, 'poem')}</h4><div class="poem">${poemHtml}</div></div>
        <p class="region-note">${t(lang, 'regionNote')}</p>
      </div>
      <div class="term-list-wrap">
        <h3>${t(lang, 'termList')}</h3>
        <div class="term-list">
          ${TERMS.map((tm) => `<button class="term-chip${tm.index === state.currentTerm.index ? ' current' : ''}${CARDINAL_INDEXES.has(tm.index) ? ' cardinal' : ''}" data-term="${tm.index}" style="--season:${SEASONS[tm.season].color}">${esc(tm[lang].name)}</button>`).join('')}
        </div>
      </div>
    `;
    this.lastDetailIndex = state.currentTerm.index;
  }

  buildTimelineTicks(year) {
    this.lastTickYear = year;
    const lang = this.lang;
    const start = Date.UTC(year, 0, 1) - 8 * 3600 * 1000;
    const end = Date.UTC(year + 1, 0, 1) - 8 * 3600 * 1000;
    const span = end - start;
    const months = lang === 'zh' ? MONTHS_ZH : MONTHS_EN;
    this.refs.months.innerHTML = months.map((m, i) => {
      const left = ((Date.UTC(year, i, 1) - 8 * 3600 * 1000 - start) / span) * 100;
      return `<span class="month-label" style="left:${left}%">${m}</span>`;
    }).join('');
    this.refs.ticks.innerHTML = yearTerms(year).map((e) => {
      const left = ((e.timeMs - start) / span) * 100;
      const name = TERM_BY_INDEX.get(e.index)[lang].name;
      const card = CARDINAL_INDEXES.has(e.index) ? ' cardinal' : '';
      return `<span class="tick${card}" style="left:${left}%" title="${esc(name)} · ${formatDateTime(e.timeMs, lang)}"></span>`;
    }).join('');
  }

  renderReading() {
    const lang = this.lang;
    const historyHtml = HISTORY.map((h) => `
      <li class="hist-item">
        <div class="hist-era">${esc(h.era[lang])}</div>
        <div class="hist-body"><h4>${esc(h[lang].title)}</h4><p>${esc(h[lang].desc)}</p></div>
      </li>`).join('');

    const cultureHtml = CULTURE.map((c) => `
      <article class="culture-card">
        <div class="culture-icon">${c.icon}</div>
        <h4>${esc(c[lang].title)}</h4>
        <p>${esc(c[lang].desc)}</p>
      </article>`).join('');

    const songHtml = SONG.lines.map((line) => {
      const tokens = line.tokens.map((tk) => tk.term == null
        ? `<span class="song-filler">${esc(tk.ch)}</span>`
        : `<button class="song-token" data-term="${tk.term}" title="${esc(TERM_BY_INDEX.get(tk.term)[lang].name)}">${esc(tk.ch)}</button>`).join('');
      return `<div class="song-line"><div class="song-text">${tokens}</div><p class="song-explain">${esc(line.explain[lang])}</p></div>`;
    }).join('');

    const scienceHtml = SCIENCE.map((s) => `
      <details class="sci-item"${lang === 'zh' ? ' open' : ''}>
        <summary>${esc(s[lang].q)}</summary><p>${esc(s[lang].a)}</p>
      </details>`).join('');

    const refsHtml = REFERENCES.map((r) => `<li>${esc(r[lang])}${r.url ? ` <a href="${r.url}" target="_blank" rel="noopener noreferrer">${esc(r.url.replace(/^https?:\/\//, ''))}</a>` : ''}</li>`).join('');

    this.refs.reading.innerHTML = `
      <div class="reading-inner">
        <section class="read-section" id="sec-history">
          <h3 class="read-title">${t(lang, 'history')}</h3>
          <ol class="hist-list">${historyHtml}</ol>
        </section>
        <section class="read-section" id="sec-culture">
          <h3 class="read-title">${t(lang, 'culture')}</h3>
          <div class="culture-grid">${cultureHtml}</div>
        </section>
        <section class="read-section" id="sec-song">
          <h3 class="read-title">${esc(SONG.title[lang])}</h3>
          <div class="song-card">${songHtml}<p class="song-note">${esc(SONG.note[lang])}</p></div>
        </section>
        <section class="read-section" id="sec-science">
          <h3 class="read-title">${t(lang, 'science')}</h3>
          <div class="sci-list">${scienceHtml}</div>
        </section>
        <section class="read-section" id="sec-refs">
          <h3 class="read-title">${t(lang, 'references')}</h3>
          <ul class="refs-list">${refsHtml}</ul>
          <div class="data-note"><h4>${t(lang, 'dataNote')}</h4><p>${esc(DATA_NOTE[lang])}</p></div>
        </section>
      </div>
    `;
  }

  setLoading(done) { this.refs.loading.classList.toggle('hidden', done); }
  showTextureError() { this.refs.texError.hidden = false; }

  update(state) {
    const lang = this.lang;
    const r = this.refs;
    r.datetime.textContent = formatFullDateTime(state.simTime, lang);
    const sim = state.simulated;
    r.badge.textContent = t(lang, sim ? 'simulated' : 'live');
    r.badge.classList.toggle('sim', sim);
    r.badge.classList.toggle('live', !sim);

    if (document.activeElement !== r.yearSelect) r.yearSelect.value = state.year;
    r.timelineYear.textContent = state.year;

    if (state.year !== this.lastTickYear) this.buildTimelineTicks(state.year);

    const start = Date.UTC(state.year, 0, 1) - 8 * 3600 * 1000;
    const end = Date.UTC(state.year + 1, 0, 1) - 8 * 3600 * 1000;
    const frac = Math.min(1, Math.max(0, (state.simTime - start) / (end - start)));
    r.thumb.style.left = (frac * 100) + '%';
    r.timeline.setAttribute('aria-valuenow', Math.round(frac * 100));
    r.timeline.setAttribute('aria-valuetext', formatDateTime(state.simTime, lang));

    if (document.activeElement !== r.dateInput) r.dateInput.value = beijingInputValue(state.simTime);
    if (document.activeElement !== r.speedSelect) r.speedSelect.value = state.speedKey;

    const playing = state.mode === 'play';
    r.playBtn.innerHTML = `<span class="play-icon">${playing ? '❚❚' : '▶'}</span><span>${t(lang, playing ? 'pause' : 'play')}</span>`;
    r.playBtn.classList.toggle('playing', playing);

    if (state.currentTerm.index !== this.lastDetailIndex) {
      this.renderDetails(state);
      this.root.querySelectorAll('.term-chip').forEach((c) =>
        c.classList.toggle('current', Number(c.dataset.term) === state.currentTerm.index));
    }
    const lonEl = r.details.querySelector('#solar-lon');
    if (lonEl) lonEl.textContent = formatDeg(state.solarLon, 2);
    const cdEl = r.details.querySelector('#next-countdown');
    if (cdEl && state.nextTerm) cdEl.textContent = formatDuration(state.nextTerm.timeMs - state.simTime, lang);
  }
}