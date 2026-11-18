import * as THREE from 'three';
import { SUN_R } from './constants.js';

function makeGlowTexture(inner, outer) {
  const size = 256;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, inner);
  g.addColorStop(0.25, outer);
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// Procedural fallback sun surface if the texture fails to load.
function makeSunFallback() {
  const size = 512;
  const c = document.createElement('canvas');
  c.width = size; c.height = size / 2;
  const ctx = c.getContext('2d');
  const g = ctx.createLinearGradient(0, 0, 0, c.height);
  g.addColorStop(0, '#ffd27a');
  g.addColorStop(0.5, '#ff9b3d');
  g.addColorStop(1, '#f57f2c');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, c.width, c.height);
  for (let i = 0; i < 1400; i++) {
    const x = Math.random() * c.width;
    const y = Math.random() * c.height;
    const r = Math.random() * 6 + 1;
    ctx.fillStyle = `rgba(255,${180 + Math.random() * 60 | 0},90,${Math.random() * 0.25})`;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createSun(loader) {
  const group = new THREE.Group();

  const material = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const core = new THREE.Mesh(new THREE.SphereGeometry(SUN_R, 48, 48), material);
  group.add(core);

  loader.load('/textures/2k_sun.jpg',
    (tex) => { tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4; material.map = tex; material.needsUpdate = true; },
    undefined,
    () => { material.map = makeSunFallback(); material.needsUpdate = true; },
  );

  const glowTex = makeGlowTexture('rgba(255,236,190,0.95)', 'rgba(255,170,80,0.35)');
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({
    map: glowTex, color: 0xffdca8, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false,
  }));
  glow.scale.setScalar(SUN_R * 6.5);
  group.add(glow);

  const coronaTex = makeGlowTexture('rgba(255,210,150,0.25)', 'rgba(255,140,60,0.10)');
  const corona = new THREE.Sprite(new THREE.SpriteMaterial({
    map: coronaTex, color: 0xffb877, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.7,
  }));
  corona.scale.setScalar(SUN_R * 11);
  group.add(corona);

  const light = new THREE.PointLight(0xfff1d6, 2600, 0, 2);
  group.add(light);

  return {
    group,
    light,
    update(dt) {
      core.rotation.y += dt * 0.02;
      const pulse = 1 + Math.sin(performance.now() * 0.0006) * 0.02;
      glow.scale.setScalar(SUN_R * 6.5 * pulse);
    },
    dispose() {
      core.geometry.dispose(); material.dispose();
      glow.material.map.dispose(); glow.material.dispose();
      corona.material.map.dispose(); corona.material.dispose();
    },
  };
}