import { spawn, execSync } from 'child_process'
import { mkdirSync, existsSync } from 'fs'
import { setTimeout as sleep } from 'timers/promises'

// ── Config ────────────────────────────────────────────────────────────────────

const PREVIEW_PORT = 4173
const BASE_URL = `http://localhost:${PREVIEW_PORT}/CollabTime/`
const OUTPUT_DIR = 'docs/screenshots'
const DEEP_LINK_TIMESTAMP_S = 1543392060   // 2018-11-28 ~00:01 UTC

const FORM_FACTORS = [
  { name: 'mobile-sm',    width: 375,  height: 667  },
  { name: 'mobile-lg',   width: 390,  height: 844  },
  { name: 'tablet',      width: 768,  height: 1024 },
  { name: 'desktop',     width: 1280, height: 900  },
  { name: 'desktop-wide', width: 1920, height: 1080 },
]

// ── Playwright ────────────────────────────────────────────────────────────────

if (!existsSync('node_modules/playwright')) {
  console.log('playwright not found — installing…')
  execSync('npm install --save-dev playwright', { stdio: 'inherit' })
}

const { chromium } = await import('playwright')

// ── Build ─────────────────────────────────────────────────────────────────────

console.log('Building…')
execSync('npm run build', { stdio: 'inherit' })

mkdirSync(OUTPUT_DIR, { recursive: true })

// ── Server lifecycle ──────────────────────────────────────────────────────────

// Kill any process already occupying the preview port so we always serve
// from this working directory, not a leftover server from another worktree.
try {
  const pids = execSync(`lsof -ti :${PREVIEW_PORT}`, { stdio: 'pipe' }).toString().trim()
  if (pids) {
    console.warn(`⚠ Killing existing process(es) on port ${PREVIEW_PORT} (PIDs: ${pids.replace(/\n/g, ', ')})`)
    execSync(`echo ${pids} | xargs kill -9`, { stdio: 'pipe' })
  }
} catch { /* nothing was running on that port */ }

const previewProcess = spawn(
  'node_modules/.bin/vite',
  ['preview', '--port', String(PREVIEW_PORT)],
  { stdio: 'pipe' },
)

let browser

const cleanup = () => {
  browser?.close()
  if (!previewProcess.killed) previewProcess.kill('SIGTERM')
}

process.on('exit', cleanup)
process.on('SIGINT', () => { cleanup(); process.exit(130) })
process.on('unhandledRejection', (err) => { console.error(err); cleanup(); process.exit(1) })

// ── Wait for server ───────────────────────────────────────────────────────────

async function waitForServer(timeoutMs = 15_000) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    try {
      const res = await fetch(BASE_URL)
      if (res.ok) return
    } catch { /* not ready yet */ }
    await sleep(300)
  }
  throw new Error(`Preview server did not become ready within ${timeoutMs}ms`)
}

// ── Screenshots ───────────────────────────────────────────────────────────────

await waitForServer()
browser = await chromium.launch()

for (const { name, width, height } of FORM_FACTORS) {
  const context = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: 1,
  })
  const page = await context.newPage()
  await page.goto(BASE_URL, { waitUntil: 'networkidle' })
  const outputPath = `${OUTPUT_DIR}/${name}.png`
  await page.screenshot({ path: outputPath, fullPage: false })
  console.log(`  ${name} (${width}×${height}) → ${outputPath}`)

  // Deep-link screenshot (app pre-loaded with a timestamp)
  const dlPage = await context.newPage()
  await dlPage.goto(`${BASE_URL}?t=${DEEP_LINK_TIMESTAMP_S}`, { waitUntil: 'networkidle' })
  const dlOutputPath = `${OUTPUT_DIR}/${name}-deep-link.png`
  await dlPage.screenshot({ path: dlOutputPath, fullPage: false })
  console.log(`  ${name}-deep-link (${width}×${height}) → ${dlOutputPath}`)

  await context.close()
}

await browser.close()
cleanup()
console.log(`\nScreenshots saved to ${OUTPUT_DIR}/`)
