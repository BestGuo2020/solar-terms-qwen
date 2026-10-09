#!/usr/bin/env node
/**
 * fetch-textures.mjs — download the planet textures this site vendors locally.
 *
 * Every asset is fetched once at build-prep time and committed under public/textures/,
 * so the running site never depends on a third-party CDN. Each entry records its source
 * URL and license; public/textures/CREDITS.json is written from the same table.
 *
 *   npm run fetch:textures
 */
import { mkdir, writeFile, readFile, stat } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const OUT = path.join(ROOT, 'public', 'textures')

const SSS = 'https://www.solarsystemscope.com/textures/download'
const JD = [
  'https://gcore.jsdelivr.net',
  'https://cdn.jsdelivr.net',
  'https://fastly.jsdelivr.net',
].map((h) => `${h}/gh/mrdoob/three.js@r186/examples/textures/planets`)

const SSS_LICENCE =
  'Solar System Scope / INOVE, https://www.solarsystemscope.com/textures/ — CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/). 底图源自 NASA 等公开影像。'
const THREE_LICENCE =
  'three.js examples/textures (MIT licensed project); NASA Blue Marble / 城市灯光影像为公有领域（public domain）。'

const ASSETS = [
  { file: 'earth_day.jpg', size: 2048, required: true, sources: [`${SSS}/2k_earth_daymap.jpg`], credit: SSS_LICENCE, desc: '地球白昼海陆底图（2048×1024，默认与移动端画质）' },
  { file: 'earth_day_4k.jpg', size: 4096, required: false, sources: [`${SSS}/8k_earth_daymap.jpg`], credit: SSS_LICENCE, desc: '地球白昼海陆底图（8192×4096 原图，高画质桌面端按需加载；仅当 WebGL MAX_TEXTURE_SIZE ≥ 8192 时启用）' },
  { file: 'earth_night.jpg', size: 2048, required: true, sources: [`${SSS}/2k_earth_nightmap.jpg`], credit: SSS_LICENCE, desc: '地球夜面城市灯光图' },
  { file: 'earth_clouds.jpg', size: 2048, required: true, sources: [`${SSS}/2k_earth_clouds.jpg`], credit: SSS_LICENCE, desc: '地球云层（用作透明云图）' },
  { file: 'earth_specular.jpg', size: 2048, required: false, sources: [`${JD[0]}/earth_specular_2048.jpg`, `${JD[1]}/earth_specular_2048.jpg`, `${JD[2]}/earth_specular_2048.jpg`], credit: THREE_LICENCE, desc: '地球高光/海洋掩膜（海面反光）' },
  { file: 'sun.jpg', size: 2048, required: true, sources: [`${SSS}/2k_sun.jpg`], credit: SSS_LICENCE, desc: '太阳光球表面纹理' },
  { file: 'stars_milkyway.jpg', size: 2048, required: true, sources: [`${SSS}/2k_stars_milky_way.jpg`], credit: SSS_LICENCE, desc: '银河星空背景（等距柱状投影，贴到天球内侧）' },
]

async function fetchOne(url, timeoutMs = 900000) {
  const res = await fetch(url, { redirect: 'follow', signal: AbortSignal.timeout(timeoutMs) })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const buf = Buffer.from(await res.arrayBuffer())
  return buf
}

function looksLikeImage(buf) {
  if (buf.length < 1024) return false
  const isJpeg = buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff
  const isPng = buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47
  return isJpeg || isPng
}

async function main() {
  await mkdir(OUT, { recursive: true })
  const manifest = { generatedAt: new Date().toISOString(), textures: [] }
  let ok = 0
  let failed = 0

  for (const a of ASSETS) {
    const dest = path.join(OUT, a.file)
    try {
      await stat(dest)
      const existing = await readFile(dest)
      if (looksLikeImage(existing)) {
        console.log(`SKIP ${a.file} (already present, ${existing.length} bytes)`)
        manifest.textures.push({ file: a.file, bytes: existing.length, sources: a.sources, credit: a.credit, desc: a.desc, required: a.required, status: 'cached' })
        ok++
        continue
      }
    } catch { /* not present, download */ }

    let buf = null
    let used = null
    let lastErr = null
    for (const url of a.sources) {
      try {
        buf = await fetchOne(url)
        if (!looksLikeImage(buf)) throw new Error('payload is not a JPEG/PNG')
        used = url
        break
      } catch (e) {
        lastErr = e
        console.log(`  retry-next ${a.file} <- ${url} :: ${String(e.message).slice(0, 70)}`)
      }
    }

    if (buf) {
      await writeFile(dest, buf)
      console.log(`OK   ${a.file} ${buf.length} bytes <- ${used}`)
      manifest.textures.push({ file: a.file, bytes: buf.length, sources: a.sources, used, credit: a.credit, desc: a.desc, required: a.required, status: 'downloaded' })
      ok++
    } else {
      console.log(`FAIL ${a.file} :: ${lastErr ? String(lastErr.message).slice(0, 90) : 'no source'}${a.required ? ' (REQUIRED)' : ' (optional)'}`)
      manifest.textures.push({ file: a.file, sources: a.sources, credit: a.credit, desc: a.desc, required: a.required, status: 'missing' })
      failed++
    }
  }

  manifest.summary = {
    total: ASSETS.length,
    ok,
    failed,
    note: '运行时若某张纹理缺失，three/TextureLoader2 会回退到程序化生成的等效纹理（见 src/three/proceduralTextures.js），页面仍可正常使用，仅真实感下降。',
  }
  await writeFile(path.join(OUT, 'CREDITS.json'), JSON.stringify(manifest, null, 2), 'utf8')
  console.log(`\nWrote ${path.join(OUT, 'CREDITS.json')}  ok=${ok} failed=${failed}`)
  if (failed > 0) process.exitCode = 2
}

main().catch((e) => {
  console.error('fatal', e)
  process.exitCode = 1
})
