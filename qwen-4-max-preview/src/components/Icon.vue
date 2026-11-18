<script setup>
defineProps({ name: String, size: { type: [Number, String], default: 18 } })
const PATHS = {
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5"/><circle cx="12" cy="7.6" r="0.6" fill="currentColor"/>',
  cloud: '<path d="M6.5 18a4 4 0 0 1-.4-8A5.5 5.5 0 0 1 16.7 8.6 4.2 4.2 0 0 1 17.5 18z"/><path d="M12 3v2M4.5 6.5l1.4 1.4M19.5 6.5l-1.4 1.4"/>',
  leaf: '<path d="M5 19c0-8 5-13 14-14-1 9-6 14-14 14z"/><path d="M5 19c3-5 7-9 11-11"/>',
  wheat: '<path d="M12 21V9"/><path d="M12 9c-3 0-4.5-1.8-4.5-4.5C10.5 4.5 12 6.3 12 9zM12 9c3 0 4.5-1.8 4.5-4.5C13.5 4.5 12 6.3 12 9zM12 14c-3 0-4.5-1.8-4.5-4.5 3 0 4.5 1.8 4.5 4.5zM12 14c3 0 4.5-1.8 4.5-4.5-3 0-4.5 1.8-4.5 4.5z"/>',
  lantern: '<ellipse cx="12" cy="12" rx="6" ry="7"/><path d="M9 5h6M9 19h6M12 2v3M12 19v3M8.5 8.5c2 2.2 5 2.2 7 0M8.5 15.5c2-2.2 5-2.2 7 0"/>',
  brush: '<path d="M4 20c3 0 5-1.5 5-4l8.5-8.5a2.1 2.1 0 0 0-3-3L6 13c-2.5 0-4 2-2 7z"/><path d="M13 6l5 5"/>',
  bowl: '<path d="M4 11h16a8 8 0 0 1-16 0z"/><path d="M9 7c0-1.5 1.5-1.5 1.5-3M13.5 7c0-1.5 1.5-1.5 1.5-3"/>',
  seal: '<rect x="4.5" y="4.5" width="15" height="15" rx="2"/><path d="M8.5 9h7M8.5 12h7M8.5 15h4"/>',
  tilt: '<circle cx="12" cy="12" r="6.5"/><path d="M9 3.5l6 17"/><path d="M3 12h2.5M18.5 12H21"/>',
  ellipse: '<ellipse cx="12" cy="12" rx="9" ry="5.5"/><circle cx="12" cy="12" r="1.6" fill="currentColor"/><circle cx="20" cy="9" r="1.4"/>',
  calendar: '<rect x="4" y="5.5" width="16" height="15" rx="2"/><path d="M4 10h16M8.5 3v4M15.5 3v4M8 14h2.5M13.5 14H16M8 17h2.5"/>',
  angle: '<path d="M5 19V5M5 19h14"/><path d="M5 12a7 7 0 0 1 7 7"/><path d="M17 5l2 2-2 2"/>',
  thermo: '<path d="M10 4a2 2 0 0 1 4 0v9.5a4 4 0 1 1-4 0z"/><circle cx="12" cy="17" r="1.6" fill="currentColor"/><path d="M12 15V8"/>',
  play: '<path d="M7 4.5l12 7.5-12 7.5z" fill="currentColor" stroke="none"/>',
  pause: '<rect x="6" y="4.5" width="4" height="15" rx="1" fill="currentColor" stroke="none"/><rect x="14" y="4.5" width="4" height="15" rx="1" fill="currentColor" stroke="none"/>',
  prev: '<path d="M15 5l-7 7 7 7"/>',
  next: '<path d="M9 5l7 7-7 7"/>',
  today: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="2.4" fill="currentColor" stroke="none"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>',
  camera: '<path d="M4 8h3l2-2.5h6L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z"/><circle cx="12" cy="13" r="3.4"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
  sun: '<circle cx="12" cy="12" r="4.5"/><path d="M12 2.5v2.5M12 19v2.5M2.5 12H5M19 12h2.5M5 5l1.8 1.8M17.2 17.2L19 19M19 5l-1.8 1.8M6.8 17.2L5 19"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 6.5V12l3.5 2.5"/>'
}
</script>

<template>
  <svg :width="size" :height="size" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"
    v-html="PATHS[name] || ''" />
</template>