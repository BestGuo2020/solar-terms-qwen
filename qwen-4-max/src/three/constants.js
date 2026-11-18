import * as THREE from 'three';

// Scene scale is NOT to real scale (disclosed in the UI).
export const ORBIT_A = 40;        // semi-major axis of the drawn orbit (scene units)
export const ECC = 0.0167;        // Earth's real orbital eccentricity (kept near-circular)
export const PERI_LON = 102.937;  // heliocentric ecliptic longitude of perihelion (deg)
export const SUN_R = 5;
export const EARTH_R = 2.0;
export const TILT_DEG = 23.44;    // obliquity of the ecliptic
export const TILT = THREE.MathUtils.degToRad(TILT_DEG);

// Map ecliptic longitude (deg) to a direction in the scene. The ecliptic plane is XZ,
// +Y is the ecliptic north. Increasing longitude moves counterclockwise seen from +Y.
export function eclipticDir(lonDeg) {
  const r = THREE.MathUtils.degToRad(lonDeg);
  return new THREE.Vector3(Math.cos(r), 0, -Math.sin(r));
}

// Orbit radius at a given heliocentric longitude (real ellipse, e = 0.0167).
export function orbitRadius(lonDeg) {
  const nu = THREE.MathUtils.degToRad(lonDeg - PERI_LON);
  return ORBIT_A * (1 - ECC * ECC) / (1 + ECC * Math.cos(nu));
}

export function earthPosition(lonDeg) {
  return eclipticDir(lonDeg).multiplyScalar(orbitRadius(lonDeg));
}

// Earth's north-pole direction, FIXED in space (ecliptic longitude 90°, latitude 90°-tilt).
// At the June solstice the north pole tilts toward the Sun; at December it tilts away.
export const POLE_DIR = new THREE.Vector3(0, Math.cos(TILT), -Math.sin(TILT)).normalize();

export const COLORS = {
  bg: 0x04060d,
  orbit: 0x46608f,
  marker: 0x93a7cc,
  cardinal: 0xf5c66b,
  current: 0xff7a52,
  arc: 0xff9a6b,
  axis: 0xff7a52,
  equator: 0x5fae7f,
  tropic: 0xc9a24b,
  direction: 0x8fb4e0,
  atmosphere: 0x4a90d9,
};