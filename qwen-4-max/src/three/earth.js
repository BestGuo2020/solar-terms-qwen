import * as THREE from 'three';
import { EARTH_R, TILT, POLE_DIR, COLORS } from './constants.js';

const SURFACE_VERT = /* glsl */`
  varying vec2 vUv;
  varying vec3 vWorldNormal;
  void main() {
    vUv = uv;
    vWorldNormal = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const SURFACE_FRAG = /* glsl */`
  uniform sampler2D dayMap;
  uniform sampler2D nightMap;
  uniform vec3 sunDirection;
  varying vec2 vUv;
  varying vec3 vWorldNormal;
  void main() {
    vec3 n = normalize(vWorldNormal);
    float cosTheta = dot(n, normalize(sunDirection));
    float dayFactor = smoothstep(-0.10, 0.20, cosTheta);
    vec3 day = texture2D(dayMap, vUv).rgb;
    vec3 night = texture2D(nightMap, vUv).rgb;
    float diffuse = 0.30 + 0.90 * max(cosTheta, 0.0);
    vec3 lit = day * diffuse;
    vec3 dark = night * 1.8 + day * 0.02;
    vec3 color = mix(dark, lit, dayFactor);
    gl_FragColor = vec4(color, 1.0);
    #include <colorspace_fragment>
  }
`;

const ATMO_VERT = /* glsl */`
  varying vec3 vNormal;
  varying vec3 vWorldNormal;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vWorldNormal = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const ATMO_FRAG = /* glsl */`
  uniform vec3 glowColor;
  uniform vec3 sunDirection;
  varying vec3 vNormal;
  varying vec3 vWorldNormal;
  void main() {
    float rim = pow(clamp(0.68 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 0.0, 1.0), 4.0);
    float sunlit = 0.35 + 0.65 * max(dot(normalize(vWorldNormal), normalize(sunDirection)), 0.0);
    gl_FragColor = vec4(glowColor, 1.0) * rim * sunlit * 1.5;
    #include <colorspace_fragment>
  }
`;

function fallbackDay() {
  const c = document.createElement('canvas'); c.width = 512; c.height = 256;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#1d4e89'; ctx.fillRect(0, 0, 512, 256);
  ctx.fillStyle = '#3f7d4f';
  for (let i = 0; i < 40; i++) {
    const x = Math.random() * 512, y = 40 + Math.random() * 176;
    ctx.beginPath(); ctx.ellipse(x, y, 20 + Math.random() * 50, 12 + Math.random() * 30, Math.random() * 3, 0, Math.PI * 2); ctx.fill();
  }
  ctx.fillStyle = '#e8f0f5'; ctx.fillRect(0, 0, 512, 16); ctx.fillRect(0, 240, 512, 16);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

function fallbackNight() {
  const c = document.createElement('canvas'); c.width = 512; c.height = 256;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#05070f'; ctx.fillRect(0, 0, 512, 256);
  ctx.fillStyle = '#ffd98a';
  for (let i = 0; i < 500; i++) {
    ctx.globalAlpha = Math.random() * 0.8;
    ctx.fillRect(Math.random() * 512, 40 + Math.random() * 176, 1.5, 1.5);
  }
  ctx.globalAlpha = 1;
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

function fallbackClouds() {
  const c = document.createElement('canvas'); c.width = 512; c.height = 256;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, 512, 256);
  ctx.fillStyle = '#fff';
  for (let i = 0; i < 120; i++) {
    ctx.globalAlpha = Math.random() * 0.5;
    ctx.beginPath(); ctx.ellipse(Math.random() * 512, Math.random() * 256, 10 + Math.random() * 40, 4 + Math.random() * 10, 0, 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha = 1;
  return new THREE.CanvasTexture(c);
}

function circleLine(radius, y, color) {
  const pts = [];
  for (let i = 0; i <= 96; i++) {
    const a = (i / 96) * Math.PI * 2;
    pts.push(new THREE.Vector3(Math.cos(a) * radius, y, Math.sin(a) * radius));
  }
  const geo = new THREE.BufferGeometry().setFromPoints(pts);
  return new THREE.Line(geo, new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.85 }));
}

export function createEarth(loader) {
  const orbitGroup = new THREE.Group();
  const tiltGroup = new THREE.Group();
  tiltGroup.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), POLE_DIR);
  orbitGroup.add(tiltGroup);

  const sunDirection = new THREE.Vector3(1, 0, 0);

  const surfaceMat = new THREE.ShaderMaterial({
    uniforms: {
      dayMap: { value: fallbackDay() },
      nightMap: { value: fallbackNight() },
      sunDirection: { value: sunDirection },
    },
    vertexShader: SURFACE_VERT,
    fragmentShader: SURFACE_FRAG,
  });
  const surface = new THREE.Mesh(new THREE.SphereGeometry(EARTH_R, 64, 64), surfaceMat);
  tiltGroup.add(surface);

  loader.load('/textures/2k_earth_daymap.jpg',
    (tex) => { tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8; surfaceMat.uniforms.dayMap.value.dispose(); surfaceMat.uniforms.dayMap.value = tex; },
    undefined, () => {},
  );
  loader.load('/textures/2k_earth_nightmap.jpg',
    (tex) => { tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8; surfaceMat.uniforms.nightMap.value.dispose(); surfaceMat.uniforms.nightMap.value = tex; },
    undefined, () => {},
  );

  const cloudMat = new THREE.MeshPhongMaterial({
    color: 0xffffff, transparent: true, opacity: 0.85, depthWrite: false, shininess: 2,
    alphaMap: fallbackClouds(),
  });
  const clouds = new THREE.Mesh(new THREE.SphereGeometry(EARTH_R * 1.012, 48, 48), cloudMat);
  tiltGroup.add(clouds);
  loader.load('/textures/2k_earth_clouds.jpg',
    (tex) => { cloudMat.alphaMap.dispose(); cloudMat.alphaMap = tex; cloudMat.needsUpdate = true; },
    undefined, () => {},
  );

  const atmoMat = new THREE.ShaderMaterial({
    uniforms: { glowColor: { value: new THREE.Color(COLORS.atmosphere) }, sunDirection: { value: sunDirection } },
    vertexShader: ATMO_VERT, fragmentShader: ATMO_FRAG,
    side: THREE.BackSide, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false,
  });
  const atmosphere = new THREE.Mesh(new THREE.SphereGeometry(EARTH_R * 1.16, 48, 48), atmoMat);
  tiltGroup.add(atmosphere);

  // Helper overlays (children of tiltGroup so they share the fixed axial tilt).
  const axisGroup = new THREE.Group();
  const axisGeo = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0, -EARTH_R * 1.8, 0), new THREE.Vector3(0, EARTH_R * 1.8, 0),
  ]);
  axisGroup.add(new THREE.Line(axisGeo, new THREE.LineBasicMaterial({ color: COLORS.axis })));
  const northCone = new THREE.Mesh(new THREE.ConeGeometry(EARTH_R * 0.12, EARTH_R * 0.3, 12),
    new THREE.MeshBasicMaterial({ color: COLORS.axis }));
  northCone.position.y = EARTH_R * 1.8;
  axisGroup.add(northCone);

  const equator = circleLine(EARTH_R * 1.03, 0, COLORS.equator);
  const tropicN = circleLine(EARTH_R * Math.cos(TILT) * 1.03, EARTH_R * Math.sin(TILT), COLORS.tropic);
  const tropicS = circleLine(EARTH_R * Math.cos(TILT) * 1.03, -EARTH_R * Math.sin(TILT), COLORS.tropic);
  const tropics = new THREE.Group(); tropics.add(tropicN, tropicS);

  axisGroup.visible = false; equator.visible = false; tropics.visible = false;
  tiltGroup.add(axisGroup, equator, tropics);

  const SIDEREAL_DAY_MS = 86164090.5;

  return {
    orbitGroup,
    surface,
    setPosition(pos) { orbitGroup.position.copy(pos); },
    setSunDirection(dir) { sunDirection.copy(dir); },
    spin(dateMs) {
      const angle = ((dateMs / SIDEREAL_DAY_MS) % 1) * Math.PI * 2;
      surface.rotation.y = angle;
      clouds.rotation.y = angle * 1.04 + 0.5;
    },
    setHelpers({ axis, equator: eq, tropics: tr }) {
      axisGroup.visible = axis; equator.visible = eq; tropics.visible = tr;
    },
    dispose() {
      surface.geometry.dispose(); surfaceMat.dispose();
      surfaceMat.uniforms.dayMap.value.dispose(); surfaceMat.uniforms.nightMap.value.dispose();
      clouds.geometry.dispose(); cloudMat.alphaMap.dispose(); cloudMat.dispose();
      atmosphere.geometry.dispose(); atmoMat.dispose();
      axisGeo.dispose(); northCone.geometry.dispose();
      equator.geometry.dispose(); tropicN.geometry.dispose(); tropicS.geometry.dispose();
    },
  };
}