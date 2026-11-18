import './styles.css';
import { TimeController } from './time.js';
import { SceneManager } from './three/scene.js';
import { UI } from './ui.js';
import { solarLongitude, termAt, termInstant } from './astro.js';

const root = document.getElementById('app');
const time = new TimeController();
let lang = 'zh';

function jumpToTerm(index) {
  const ms = termInstant(time.year, index);
  if (ms != null) time.setTime(ms);
}

const ui = new UI(root, {
  onLang: (l) => setLanguage(l),
  onPlayToggle: () => time.toggle(),
  onSpeed: (k) => time.setSpeed(k),
  onDate: (ms) => time.setTime(ms),
  onBackToday: () => time.backToToday(),
  onYear: (y) => time.setYear(y),
  onTimeline: (ms) => time.setTime(ms),
  onTermClick: (index) => jumpToTerm(index),
  onView: (mode) => scene.setView(mode === 'default' ? 'overview' : mode),
  onHelper: (key, val) => scene.setHelpers({ [key]: val }),
});

const scene = new SceneManager(ui.sceneContainer, {
  onTermClick: (index) => jumpToTerm(index),
  onReady: () => ui.setLoading(true),
  onTextureError: () => ui.showTextureError(),
});

function setLanguage(l) {
  lang = l;
  ui.applyLanguage(l);
  scene.setLanguage(l);
}

ui.applyLanguage(lang);
scene.setLanguage(lang);
setTimeout(() => ui.setLoading(true), 8000);

let currentState = null;
function step(dtMs, render3D) {
  time.tick(dtMs);
  const simTime = time.simTime;
  const solarLon = solarLongitude(simTime);
  const earthLon = (solarLon + 180) % 360;
  const { current, next } = termAt(simTime);
  const state = {
    simTime, solarLon, earthLon,
    currentTerm: current, nextTerm: next,
    year: time.year, simulated: time.isSimulated(),
    mode: time.mode, speedKey: time.speedKey,
  };
  currentState = state;
  ui.update(state);
  if (render3D) {
    scene.update(state, dtMs / 1000);
    scene.render();
  }
}

// Populate the page immediately on load, even if the tab starts hidden.
step(0, true);

window.addEventListener('keydown', (e) => {
  const tag = (e.target.tagName || '').toLowerCase();
  if (tag === 'input' || tag === 'select' || tag === 'textarea') return;
  if (e.code === 'Space') { e.preventDefault(); time.toggle(); }
  else if (e.key === 'ArrowLeft') { e.preventDefault(); time.nudge(-(e.shiftKey ? 3600e3 : 86400e3)); }
  else if (e.key === 'ArrowRight') { e.preventDefault(); time.nudge(e.shiftKey ? 3600e3 : 86400e3); }
  else if (e.key === 't' || e.key === 'T') { time.backToToday(); }
});

let last = performance.now();
let disposed = false;
function frame(now) {
  if (disposed) return;
  requestAnimationFrame(frame);
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;
  // Keep time/UI live in the background, but skip the costly 3D render while hidden.
  step(dt * 1000, !document.hidden);
}
requestAnimationFrame(frame);

document.addEventListener('visibilitychange', () => {
  last = performance.now();
  if (!document.hidden) step(0, true);
});

function cleanup() {
  if (disposed) return;
  disposed = true;
  scene.dispose();
}
window.addEventListener('pagehide', cleanup);

// Dev-only inspection hook for automated verification.
if (import.meta.env.DEV) {
  window.__jieqi = {
    step: (ms = 16) => step(ms, true),
    get state() { return currentState; },
    time, scene, ui,
    jumpToTerm, setLanguage,
  };
}