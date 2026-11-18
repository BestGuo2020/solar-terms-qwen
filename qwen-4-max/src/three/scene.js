import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer } from 'three/addons/renderers/CSS2DRenderer.js';
import { createSun } from './sun.js';
import { createEarth } from './earth.js';
import { createOrbit } from './orbit.js';
import { earthPosition, COLORS } from './constants.js';

const OVERVIEW_POS = new THREE.Vector3(0, 55, 95);
const CLOSEUP_OFFSET = new THREE.Vector3(6, 3.5, 8);
const ORIGIN = new THREE.Vector3(0, 0, 0);

function easeInOut(x) { return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; }

export class SceneManager {
  constructor(container, { onTermClick, onReady, onTextureError }) {
    this.container = container;
    this.onTermClick = onTermClick;
    this.isMobile = window.matchMedia('(max-width: 768px)').matches || (navigator.maxTouchPoints > 0 && window.innerWidth < 900);

    this.renderer = new THREE.WebGLRenderer({ antialias: !this.isMobile, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, this.isMobile ? 1.5 : 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.NoToneMapping;
    this.renderer.domElement.className = 'scene-canvas';
    container.appendChild(this.renderer.domElement);

    this.labelRenderer = new CSS2DRenderer();
    this.labelRenderer.domElement.className = 'scene-labels';
    this.labelRenderer.domElement.style.pointerEvents = 'none';
    container.appendChild(this.labelRenderer.domElement);

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(COLORS.bg);

    this.camera = new THREE.PerspectiveCamera(45, 1, 0.1, 3000);
    this.camera.position.copy(OVERVIEW_POS);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.06;
    this.controls.minDistance = 7;
    this.controls.maxDistance = 400;
    this.controls.maxPolarAngle = Math.PI * 0.92;
    this.controls.target.copy(ORIGIN);

    this.scene.add(new THREE.AmbientLight(0x223349, 0.5));

    this.manager = new THREE.LoadingManager();
    this.manager.onLoad = () => onReady && onReady();
    this.manager.onError = (url) => onTextureError && onTextureError(url);
    const loader = new THREE.TextureLoader(this.manager);

    this.sun = createSun(loader);
    this.scene.add(this.sun.group);
    this.earth = createEarth(loader);
    this.scene.add(this.earth.orbitGroup);
    this.orbit = createOrbit(onTermClick);
    this.scene.add(this.orbit.group);

    this.radiusLine = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([ORIGIN.clone(), ORIGIN.clone()]),
      new THREE.LineBasicMaterial({ color: 0x3a4d75, transparent: true, opacity: 0.4 }),
    );
    this.scene.add(this.radiusLine);

    this.starfield = this.makeStars(this.isMobile ? 1300 : 2600);
    this.scene.add(this.starfield);

    this.viewMode = 'overview';
    this.tween = null;
    this.lastEarthPos = new THREE.Vector3();
    this.lastTermIndex = -1;
    this.helpers = { axis: false, equator: false, tropics: false, direction: false };

    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();
    this.bindPointer();

    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(container);
    this.resize();
  }

  makeStars(count) {
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = 700 + Math.random() * 600;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.cos(phi);
      positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({ color: 0xcdd8ff, size: 1.7, sizeAttenuation: true, transparent: true, opacity: 0.85, depthWrite: false });
    return new THREE.Points(geo, mat);
  }

  bindPointer() {
    const el = this.renderer.domElement;
    let downX = 0, downY = 0, downT = 0;
    this.onDown = (e) => { downX = e.clientX; downY = e.clientY; downT = performance.now(); };
    this.onUp = (e) => {
      const moved = Math.hypot(e.clientX - downX, e.clientY - downY);
      if (moved > 6 || performance.now() - downT > 600) return;
      const rect = el.getBoundingClientRect();
      this.pointer.set(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
      const idx = this.orbit.pick(this.pointer, this.camera);
      if (idx != null) this.onTermClick(idx);
    };
    el.addEventListener('pointerdown', this.onDown);
    el.addEventListener('pointerup', this.onUp);
  }

  setView(mode) {
    this.viewMode = mode === 'closeup' ? 'closeup' : 'overview';
    this.tween = {
      t: 0, dur: 0.9, mode: this.viewMode,
      fromPos: this.camera.position.clone(),
      fromTarget: this.controls.target.clone(),
    };
  }

  setHelpers(h) {
    this.helpers = { ...this.helpers, ...h };
    this.earth.setHelpers(this.helpers);
    this.orbit.setDirectionVisible(this.helpers.direction);
  }

  setLanguage(lang) { this.orbit.setLanguage(lang); }

  update(state, dt) {
    const earthPos = earthPosition(state.earthLon);
    this.earth.setPosition(earthPos);
    this.earth.setSunDirection(earthPos.clone().negate().normalize());
    this.earth.spin(state.simTime);

    const rp = this.radiusLine.geometry.getAttribute('position');
    rp.setXYZ(1, earthPos.x, earthPos.y, earthPos.z);
    rp.needsUpdate = true;

    if (state.currentTerm.index !== this.lastTermIndex) {
      this.orbit.setCurrentTerm(state.currentTerm.index, state.nextTerm ? state.nextTerm.index : null);
      this.lastTermIndex = state.currentTerm.index;
    }

    this.sun.update(dt);

    if (this.tween) {
      this.tween.t += dt / this.tween.dur;
      const k = easeInOut(Math.min(this.tween.t, 1));
      let toPos, toTarget;
      if (this.tween.mode === 'closeup') { toTarget = earthPos; toPos = earthPos.clone().add(CLOSEUP_OFFSET); }
      else { toTarget = ORIGIN; toPos = OVERVIEW_POS; }
      this.camera.position.lerpVectors(this.tween.fromPos, toPos, k);
      this.controls.target.lerpVectors(this.tween.fromTarget, toTarget, k);
      if (this.tween.t >= 1) this.tween = null;
    } else if (this.viewMode === 'closeup') {
      const delta = earthPos.clone().sub(this.lastEarthPos);
      this.camera.position.add(delta);
      this.controls.target.copy(earthPos);
    }
    this.lastEarthPos.copy(earthPos);

    this.controls.update();
  }

  render() {
    this.renderer.render(this.scene, this.camera);
    this.labelRenderer.render(this.scene, this.camera);
  }

  resize() {
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    if (!w || !h) return;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h, false);
    this.labelRenderer.setSize(w, h);
    this.orbit.setCompact(w < 768);
  }

  dispose() {
    this.resizeObserver.disconnect();
    const el = this.renderer.domElement;
    el.removeEventListener('pointerdown', this.onDown);
    el.removeEventListener('pointerup', this.onUp);
    this.controls.dispose();
    this.sun.dispose();
    this.earth.dispose();
    this.orbit.dispose();
    this.radiusLine.geometry.dispose(); this.radiusLine.material.dispose();
    this.starfield.geometry.dispose(); this.starfield.material.dispose();
    this.renderer.dispose();
    el.remove();
    this.labelRenderer.domElement.remove();
  }
}