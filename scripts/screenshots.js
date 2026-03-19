import { chromium } from 'playwright'
import { spawn, execSync } from 'child_process'
import { mkdirSync } from 'fs'
import { setTimeout as sleep } from 'timers/promises'

// ── Config ────────────────────────────────────────────────────────────────────

const PREVIEW_PORT = 4173
const BASE_URL = `http://localhost:${PREVIEW_PORT}/CollabTime/`
const OUTPUT_DIR = 'docs/screenshots'

const FORM_FACTORS = [
  { name: 'mobile-sm',    width: 375,  height: 667  },
  { name: 'mobile-lg',   width: 390,  height: 844  },
  { name: 'tablet',      width: 768,  height: 1024 },
  { name: 'desktop',     width: 1280, height: 900  },
  { name: 'desktop-wide', width: 1920, height: 1080 },
]

// ── Build ─────────────────────────────────────────────────────────────────────

console.log('Building…')
execSync('npm run build', { stdio: 'inherit' })

mkdirSync(OUTPUT_DIR, { recursive: true })

// ── Server lifecycle ──────────────────────────────────────────────────────────

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
  await context.close()
}

await browser.close()
cleanup()
console.log(`\nScreenshots saved to ${OUTPUT_DIR}/`)
