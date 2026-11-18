import * as THREE from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { TERMS } from '../terms-data.js';
import { CARDINAL_INDEXES } from '../astro.js';
import { earthPosition, eclipticDir, COLORS } from './constants.js';

const ARC_SEGMENTS = 48;

export function createOrbit(onTermClick) {
  const group = new THREE.Group();

  // Orbit ellipse (real eccentricity, near-circular).
  const ringPts = [];
  for (let i = 0; i <= 256; i++) ringPts.push(earthPosition((i / 256) * 360));
  const ring = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(ringPts),
    new THREE.LineBasicMaterial({ color: COLORS.orbit, transparent: true, opacity: 0.7 }),
  );
  group.add(ring);

  // Highlighted arc spanning the current term interval.
  const arcGeo = new THREE.BufferGeometry();
  arcGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array((ARC_SEGMENTS + 1) * 3), 3));
  const arc = new THREE.Line(arcGeo, new THREE.LineBasicMaterial({ color: COLORS.arc, transparent: true, opacity: 0.95 }));
  group.add(arc);

  const markers = [];
  const hitMeshes = [];
  const labels = [];
  const hitMat = new THREE.MeshBasicMaterial({ visible: false });

  for (const term of TERMS) {
    const earthLon = (term.lon + 180) % 360;
    const pos = earthPosition(earthLon);
    const cardinal = CARDINAL_INDEXES.has(term.index);

    const baseColor = cardinal ? COLORS.cardinal : COLORS.marker;
    const mat = new THREE.MeshBasicMaterial({ color: baseColor });
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(cardinal ? 0.7 : 0.45, 16, 16), mat);
    mesh.position.copy(pos);
    mesh.userData.termIndex = term.index;
    group.add(mesh);
    markers.push({ mesh, mat, baseColor, cardinal, index: term.index });

    const hit = new THREE.Mesh(new THREE.SphereGeometry(1.9, 8, 8), hitMat);
    hit.position.copy(pos);
    hit.userData.termIndex = term.index;
    group.add(hit);
    hitMeshes.push(hit);

    const div = document.createElement('div');
    div.className = 'term-label' + (cardinal ? ' cardinal' : '');
    div.textContent = term.zh.name;
    div.setAttribute('role', 'button');
    div.tabIndex = 0;
    div.addEventListener('click', (e) => { e.stopPropagation(); onTermClick(term.index); });
    div.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onTermClick(term.index); } });
    const label = new CSS2DObject(div);
    label.position.copy(pos.clone().multiplyScalar(1.075));
    group.add(label);
    labels.push({ label, div, index: term.index, cardinal });
  }

  // Orbit-direction arrows (tangent to increasing longitude).
  const direction = new THREE.Group();
  const coneGeo = new THREE.ConeGeometry(0.5, 1.3, 12);
  const coneMat = new THREE.MeshBasicMaterial({ color: COLORS.direction });
  for (const lon of [30, 120, 210, 300]) {
    const cone = new THREE.Mesh(coneGeo, coneMat);
    cone.position.copy(earthPosition(lon));
    const tangent = eclipticDir(lon + 90).normalize();
    cone.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), tangent);
    direction.add(cone);
  }
  direction.visible = false;
  group.add(direction);

  let currentIndex = -1;
  let compact = false;
  const raycaster = new THREE.Raycaster();

  function applyLabelVisibility() {
    for (const l of labels) {
      const show = !compact || l.cardinal || l.index === currentIndex;
      l.div.style.display = show ? '' : 'none';
    }
  }

  function rebuildArc(index, nextIndex) {
    const startLon = (TERMS[index].lon + 180) % 360;
    let endLon = (TERMS[nextIndex].lon + 180) % 360;
    if (endLon <= startLon) endLon += 360;
    const attr = arcGeo.getAttribute('position');
    for (let i = 0; i <= ARC_SEGMENTS; i++) {
      const lon = startLon + (endLon - startLon) * (i / ARC_SEGMENTS);
      const p = earthPosition(lon % 360);
      attr.setXYZ(i, p.x, p.y, p.z);
    }
    attr.needsUpdate = true;
    arcGeo.computeBoundingSphere();
  }

  return {
    group,
    setLanguage(lang) {
      for (const l of labels) l.div.textContent = TERMS[l.index][lang].name;
    },
    setCurrentTerm(index, nextIndex) {
      currentIndex = index;
      for (const m of markers) {
        const isCurrent = m.index === index;
        m.mat.color.setHex(isCurrent ? COLORS.current : m.baseColor);
        m.mesh.scale.setScalar(isCurrent ? 1.6 : 1);
      }
      for (const l of labels) l.div.classList.toggle('current', l.index === index);
      if (nextIndex != null) rebuildArc(index, nextIndex);
      applyLabelVisibility();
    },
    setDirectionVisible(v) { direction.visible = v; },
    setCompact(v) { compact = v; applyLabelVisibility(); },
    pick(ndc, camera) {
      raycaster.setFromCamera(ndc, camera);
      const hits = raycaster.intersectObjects(hitMeshes, false);
      return hits.length ? hits[0].object.userData.termIndex : null;
    },
    dispose() {
      ring.geometry.dispose(); ring.material.dispose();
      arcGeo.dispose(); arc.material.dispose();
      coneGeo.dispose(); coneMat.dispose(); hitMat.dispose();
      for (const m of markers) { m.mesh.geometry.dispose(); m.mat.dispose(); }
      for (const h of hitMeshes) h.geometry.dispose();
      for (const l of labels) l.div.remove();
    },
  };
}