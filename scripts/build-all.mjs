/**
 * build-all.mjs — 聚合构建三个子项目，产出可直接部署到 EdgeOne Pages 的 dist/
 *
 *   dist/
 *   ├── index.html            ← 根路径导航页（landing/index.html）
 *   ├── qwen3.8-max/          ← qwen-3.8-max 的构建产物
 *   ├── qwen4-max-preview/    ← qwen-4-max-preview 的构建产物
 *   └── qwen4-max/            ← qwen-4-max 的构建产物
 *
 * 各子项目的 vite.config.js 在 build 时使用对应的绝对子路径 base，
 * 因此产物内的资源引用与运行时贴图路径都自带正确前缀。
 *
 * 用法：npm run build（仓库根目录）。
 * 依赖缺失时自动安装：CI（EdgeOne）上执行 npm ci；本地执行 npm install
 * （缓存置于仓库 .npm-cache/，跳过生命周期脚本以兼容受限沙箱）。
 */
import { execFileSync } from 'node:child_process'
import { cpSync, copyFileSync, existsSync, mkdirSync, rmSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm'
// Node >= 18.20/20.12 在 Windows 上 spawn .cmd 必须经过 shell，否则 EINVAL。
const spawnOpts = (cwd) => ({ cwd, stdio: 'inherit', shell: process.platform === 'win32' })

/** 目录名 → 部署子路径（与各自 vite.config.js 的 base 保持一致） */
const projects = [
  { dir: 'qwen-3.8-max', route: 'qwen3.8-max' },
  { dir: 'qwen-4-max-preview', route: 'qwen4-max-preview' },
  { dir: 'qwen-4-max', route: 'qwen4-max' },
]

const outDir = join(root, 'dist')
rmSync(outDir, { recursive: true, force: true })
mkdirSync(outDir, { recursive: true })

for (const { dir, route } of projects) {
  const cwd = join(root, dir)
  console.log(`\n=== [${route}] ${dir} ===`)

  // 以 vite 可执行文件是否真实存在为准（兼容 pnpm 布局失效 / 半装状态）。
  const viteReady = existsSync(join(cwd, 'node_modules', 'vite', 'bin', 'vite.js'))
  const needInstall = process.env.CI === 'true' || !viteReady
  if (needInstall) {
    if (process.env.CI === 'true') {
      // CI（EdgeOne）：全新检出，用锁文件精确安装。
      console.log(`--- npm ci (${dir})`)
      execFileSync(npm, ['ci', '--no-audit', '--no-fund'], spawnOpts(cwd))
    } else {
      // 本地：缓存放进工作区；跳过生命周期脚本以兼容受限沙箱
      // （esbuild 等二进制来自平台可选依赖包，不依赖 postinstall）。
      console.log(`--- npm install (${dir})`)
      execFileSync(npm, ['install', '--no-audit', '--no-fund', '--ignore-scripts', '--cache', join(root, '.npm-cache')], spawnOpts(cwd))
    }
  }

  console.log(`--- npm run build (${dir})`)
  execFileSync(npm, ['run', 'build'], spawnOpts(cwd))

  const src = join(cwd, 'dist')
  if (!existsSync(join(src, 'index.html'))) {
    throw new Error(`构建产物缺少 index.html：${src}`)
  }
  cpSync(src, join(outDir, route), { recursive: true })
  console.log(`--- 已复制到 dist/${route}/`)
}

copyFileSync(join(root, 'landing', 'index.html'), join(outDir, 'index.html'))
console.log('\n完成：dist/ 已就绪（含根导航页与三个子站点）。')