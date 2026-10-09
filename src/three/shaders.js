/**
 * shaders.js — 地球 / 云层 / 大气 / 太阳的着色器
 *
 * 光照模型说明：
 *  · 太阳位于场景原点，点光源也在原点，因此**光照方向与地球受光面天然一致**；
 *    地球着色器直接接收"从地球指向太阳"的单位向量 uSunDirW（世界坐标），
 *    由 orbitMath.sunDirectionFromEarth(λ☉) 给出，与 3D 位置计算同源。
 *  · 昼夜界线（晨昏线）由 dot(N, L) 的 smoothstep 得到，过渡带略微向夜面延伸，
 *    模拟大气折射把阳光"抬"过地平线的效果。
 *  · 夜面城市灯光只在暗侧显示；海面高光用单独的高光掩膜贴图，避免陆地反光。
 *  · 大气层是稍大的球壳，用边缘光（fresnel）+ 向阳面权重叠加，背阳面自动变暗。
 *
 * 所有 shader 结尾都 include 了 three.js 的色调映射与色彩空间片段，
 * 保证与 renderer.toneMapping / outputColorSpace 设置一致，颜色不发灰或过饱和。
 */

export const EARTH_VERT = /* glsl */ `
varying vec2 vUv;
varying vec3 vNormalW;
varying vec3 vWorldPos;

void main() {
  vUv = uv;
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vWorldPos = wp.xyz;
  vNormalW = normalize(mat3(modelMatrix) * normal);
  gl_Position = projectionMatrix * viewMatrix * wp;
}
`

export const EARTH_FRAG = /* glsl */ `
uniform sampler2D uDay;
uniform sampler2D uNight;
uniform sampler2D uSpec;
uniform vec3  uSunDirW;     // 地球 → 太阳（世界坐标，单位向量）
uniform float uNightGain;   // 夜面灯光强度
uniform float uHasNight;    // 是否成功加载夜面贴图（0/1）
uniform float uHasSpec;     // 是否成功加载高光掩膜（0/1）
uniform float uOceanSpec;   // 海面高光强度

varying vec2 vUv;
varying vec3 vNormalW;
varying vec3 vWorldPos;

void main() {
  vec3 N = normalize(vNormalW);
  vec3 L = normalize(uSunDirW);
  vec3 V = normalize(cameraPosition - vWorldPos);
  float ndl = dot(N, L);

  // 晨昏线：过渡带略偏向夜面，模拟大气折射
  float day = smoothstep(-0.145, 0.205, ndl);

  vec3 dayCol = texture2D(uDay, vUv).rgb;

  // 晨昏线附近的暖色散射
  float twilight = exp(-pow(ndl / 0.20, 2.0));
  vec3 scatter = vec3(0.90, 0.44, 0.20) * twilight * 0.34;

  vec3 col = dayCol * (0.05 + 1.06 * day);
  col += scatter * (1.0 - 0.55 * day);

  // 夜面城市灯光
  if (uHasNight > 0.5) {
    vec3 nightCol = texture2D(uNight, vUv).rgb;
    float nightMask = pow(1.0 - day, 1.25);
    col += nightCol * nightMask * uNightGain;
  }

  // 海面镜面高光（只出现在昼半球）
  if (uHasSpec > 0.5) {
    float specMask = texture2D(uSpec, vUv).r;
    vec3 H = normalize(L + V);
    float sp = pow(max(dot(N, H), 0.0), 78.0) * specMask * day * uOceanSpec;
    col += vec3(1.0, 0.98, 0.92) * sp;
  } else if (uHasNight > 0.5) {
    // 没有高光掩膜时的退路：夜面灯光图的亮处即陆地，取其反作为海洋掩膜
    vec3 nl = texture2D(uNight, vUv).rgb;
    float landMask = clamp(max(max(nl.r, nl.g), nl.b) * 3.0, 0.0, 1.0);
    vec3 H = normalize(L + V);
    float sp = pow(max(dot(N, H), 0.0), 78.0) * (1.0 - landMask) * day * uOceanSpec * 0.7;
    col += vec3(1.0, 0.98, 0.92) * sp;
  }

  // 边缘大气蓝光（fresnel）；夜面也保留一点，避免地球在深色背景里"消失"
  float fres = pow(1.0 - max(dot(N, V), 0.0), 3.2);
  col += vec3(0.20, 0.42, 0.78) * fres * (0.32 + 0.78 * day);

  gl_FragColor = vec4(col, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`

export const CLOUD_FRAG = /* glsl */ `
uniform sampler2D uCloud;
uniform vec2  uCloudShift;   // 云层相对地面的缓慢漂移（UV 偏移）
uniform vec3  uSunDirW;
uniform float uOpacity;

varying vec2 vUv;
varying vec3 vNormalW;
varying vec3 vWorldPos;

void main() {
  vec3 N = normalize(vNormalW);
  vec3 L = normalize(uSunDirW);
  float ndl = dot(N, L);
  float day = smoothstep(-0.20, 0.30, ndl);

  vec2 uv = vUv + vec2(uCloudShift.x, uCloudShift.y);
  uv.x = fract(uv.x);
  vec4 c = texture2D(uCloud, uv);
  // 兼容两种云图：带 alpha 通道的 PNG，以及白底黑天的 JPEG
  float a = min(c.a, max(max(c.r, c.g), c.b));

  vec3 tint = mix(vec3(0.13, 0.16, 0.26), vec3(1.0, 0.99, 0.96), day);
  tint += vec3(0.42, 0.19, 0.06) * exp(-pow(ndl / 0.19, 2.0)) * 0.55;   // 晨昏线上的云偏暖

  float alpha = a * uOpacity * (0.05 + 0.95 * day);
  if (alpha < 0.003) discard;
  gl_FragColor = vec4(tint, alpha);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`

/** 大气层外壳：视空间法线的经典边缘光，再按向阳程度调制 */
export const ATMO_VERT = /* glsl */ `
varying vec3 vNormalV;
varying vec3 vSunDirV;
uniform vec3 uSunDirW;

void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vNormalV = normalize(normalMatrix * normal);
  vSunDirV = normalize((viewMatrix * vec4(uSunDirW, 0.0)).xyz);
  gl_Position = projectionMatrix * viewMatrix * wp;
}
`

export const ATMO_FRAG = /* glsl */ `
uniform vec3  uColor;
uniform float uIntensity;
uniform float uPower;
uniform float uBias;

varying vec3 vNormalV;
varying vec3 vSunDirV;

void main() {
  float rim = pow(max(uBias - dot(vNormalV, vec3(0.0, 0.0, 1.0)), 0.0), uPower);
  float facing = clamp(dot(normalize(vNormalV), normalize(vSunDirV)) * 0.5 + 0.5, 0.0, 1.0);
  rim *= mix(0.08, 1.0, pow(facing, 1.25));      // 背阳面大气暗，向阳面亮
  rim *= uIntensity;
  gl_FragColor = vec4(uColor, rim);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`

export const SUN_VERT = /* glsl */ `
varying vec2 vUv;
varying vec3 vNormalW;
varying vec3 vWorldPos;

void main() {
  vUv = uv;
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vWorldPos = wp.xyz;
  vNormalW = normalize(mat3(modelMatrix) * normal);
  gl_Position = projectionMatrix * viewMatrix * wp;
}
`

/**
 * 太阳光球：自发光，不受场景光照影响。
 * 用两次不同尺度、反向漂移的采样叠加出米粒组织的流动感，
 * 并做临边昏暗（limb darkening），边缘略暗、中心更亮。
 */
export const SUN_FRAG = /* glsl */ `
uniform sampler2D uMap;
uniform float uTime;
uniform vec3  uColorCore;
uniform vec3  uColorEdge;
uniform float uBrightness;

varying vec2 vUv;
varying vec3 vNormalW;
varying vec3 vWorldPos;

void main() {
  vec3 N = normalize(vNormalW);
  vec3 V = normalize(cameraPosition - vWorldPos);
  float mu = clamp(dot(N, V), 0.0, 1.0);

  vec2 uv1 = vec2(fract(vUv.x * 2.0 + uTime * 0.0055), vUv.y);
  vec2 uv2 = vec2(fract(vUv.x * 3.0 - uTime * 0.0081), fract(vUv.y * 1.5 + uTime * 0.0026));
  float g = texture2D(uMap, uv1).r * 0.62 + texture2D(uMap, uv2).r * 0.38;

  float limb = pow(mu, 0.42);                    // 临边昏暗
  vec3 col = mix(uColorEdge, uColorCore, clamp(g * 1.45, 0.0, 1.0));
  col *= (0.66 + 0.52 * limb) * uBrightness;

  // 边缘一圈极薄的色球层红晕
  float chromo = pow(1.0 - mu, 6.0) * 0.55;
  col += vec3(1.0, 0.36, 0.12) * chromo;

  gl_FragColor = vec4(col, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`

/** 星空点云的着色器：按 aSize 属性控制点大小，并做轻微闪烁 */
export const STAR_VERT = /* glsl */ `
attribute float aSize;
uniform float uPixelRatio;
uniform float uTime;
uniform float uSizeScale;
varying vec3 vColor;

void main() {
  vColor = color;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  float tw = 0.82 + 0.18 * sin(uTime * 1.6 + position.x * 0.05 + position.z * 0.04);
  gl_PointSize = aSize * uSizeScale * uPixelRatio * tw;
  gl_Position = projectionMatrix * mv;
}
`

export const STAR_FRAG = /* glsl */ `
uniform sampler2D uDot;
varying vec3 vColor;

void main() {
  vec4 d = texture2D(uDot, gl_PointCoord);
  float a = d.a * d.r;
  if (a < 0.02) discard;
  gl_FragColor = vec4(vColor, a);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`
