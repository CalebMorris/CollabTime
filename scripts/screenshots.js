import { spawn, execSync } from 'child_process'
import { mkdirSync, existsSync } from 'fs'
import { setTimeout as sleep } from 'timers/promises'

// ── Config ────────────────────────────────────────────────────────────────────

const PREVIEW_PORT = 4173
const BASE_URL = `http://localhost:${PREVIEW_PORT}/CollabTime/`
const OUTPUT_DIR = process.env.SCREENSHOT_DIR ?? 'docs/screenshots'
const DEEP_LINK_TIMESTAMP_S = 1543392060   // 2018-11-28 ~00:01 UTC

const FORM_FACTORS = [
  { name: 'mobile-sm',    width: 375,  height: 667  },
  { name: 'mobile-lg',   width: 390,  height: 844  },
  { name: 'tablet',      width: 768,  height: 1024 },
  { name: 'desktop',     width: 1280, height: 900  },
  { name: 'desktop-wide', width: 1920, height: 1080 },
]

// ── Party fixtures ────────────────────────────────────────────────────────────

const TEST_CODE = 'amber-falcon-bridge'
const LOCKED_MS = new Date('2025-06-15T14:00:00Z').getTime()

// Participant tokens match the shape expected by useRoom / roomProtocol.ts
const TOKEN_P1 = 'tok-p1-swift-otter'
const TOKEN_P2 = 'tok-p2-calm-badger'

function joinedMsg({ extraParticipants = [] } = {}) {
  return {
    type: 'joined',
    sessionToken: 'session-abc',
    participantToken: TOKEN_P1,
    nickname: 'swift-otter',
    protocolVersion: '1.0',
    room: {
      code: TEST_CODE,
      state: 'waiting',
      participants: [
        { participantToken: TOKEN_P1, nickname: 'swift-otter', isConnected: true, proposalEpochMs: null },
        ...extraParticipants,
      ],
      lockedInEpochMs: null,
    },
  }
}

/** Route WebSocket; respond to the app's `join` / `rejoin` message with `responseMsg`. */
async function routeWsAndRespond(page, responseMsg) {
  await page.routeWebSocket(/.*/, (socket) => {
    socket.onMessage((rawMessage) => {
      const message = JSON.parse(typeof rawMessage === 'string' ? rawMessage : rawMessage.toString())
      if (message.type === 'join' || message.type === 'rejoin') {
        socket.send(JSON.stringify(responseMsg))
      }
    })
  })
}

/** Navigate + open create overlay + enter room. WS must be routed before calling. */
async function enterRoomAndWait(page) {
  await page.goto(BASE_URL, { waitUntil: 'networkidle' })
  await page.getByRole('button', { name: /start a party/i }).click()
  await page.getByRole('button', { name: /enter the room/i }).click()
  await page.getByRole('button', { name: /leave/i }).waitFor({ timeout: 2000 })
}

// ── Scenarios ─────────────────────────────────────────────────────────────────

const SCENARIOS = [
  // ── Solo ──────────────────────────────────────────────────────────────────

  {
    name: 'home',
    setup: async (page) => {
      await page.goto(BASE_URL, { waitUntil: 'networkidle' })
    },
  },

  {
    name: 'deep-link',
    setup: async (page) => {
      await page.goto(`${BASE_URL}?t=${DEEP_LINK_TIMESTAMP_S}`, { waitUntil: 'networkidle' })
    },
  },

  // ── Party overlays (no WS needed) ─────────────────────────────────────────

  {
    name: 'party-create-overlay',
    setup: async (page) => {
      await page.goto(BASE_URL, { waitUntil: 'networkidle' })
      await page.getByRole('button', { name: /start a party/i }).click()
      await page.getByRole('dialog').waitFor({ timeout: 2000 })
    },
  },

  {
    name: 'party-join-overlay',
    setup: async (page) => {
      await page.goto(`${BASE_URL}?code=${TEST_CODE}`, { waitUntil: 'networkidle' })
      await page.getByRole('dialog').waitFor({ timeout: 2000 })
    },
  },

  // ── Party room: waiting (1 participant, no proposals) ─────────────────────

  {
    name: 'party-room-waiting',
    setup: async (page) => {
      await routeWsAndRespond(page, joinedMsg())
      await enterRoomAndWait(page)
    },
  },

  // ── Party room: active proposals ──────────────────────────────────────────

  {
    name: 'party-room-proposals',
    setup: async (page) => {
      let serverSocket
      await page.routeWebSocket(/.*/, (socket) => {
        serverSocket = socket
        socket.onMessage((rawMessage) => {
          const message = JSON.parse(typeof rawMessage === 'string' ? rawMessage : rawMessage.toString())
          if (message.type === 'join' || message.type === 'rejoin') {
            socket.send(JSON.stringify(joinedMsg({
              extraParticipants: [
                { participantToken: TOKEN_P2, nickname: 'calm-badger', isConnected: true, proposalEpochMs: null },
              ],
            })))
          }
        })
      })
      await enterRoomAndWait(page)
      // Room is loaded; send proposals for both participants
      await serverSocket.send(JSON.stringify({
        type: 'proposal_updated',
        participantToken: TOKEN_P1,
        epochMs: new Date('2025-06-15T14:00:00Z').getTime(),
      }))
      await serverSocket.send(JSON.stringify({
        type: 'proposal_updated',
        participantToken: TOKEN_P2,
        epochMs: new Date('2025-06-15T15:00:00Z').getTime(),
      }))
      // Wait for proposals to appear (em-dashes should be gone)
      await page.waitForFunction(
        () => !document.body.textContent?.includes('—'),
        { timeout: 2000 },
      )
    },
  },

  // ── Lock-in modal ─────────────────────────────────────────────────────────

  {
    name: 'party-lock-in-modal',
    setup: async (page) => {
      let serverSocket
      await page.routeWebSocket(/.*/, (socket) => {
        serverSocket = socket
        socket.onMessage((rawMessage) => {
          const message = JSON.parse(typeof rawMessage === 'string' ? rawMessage : rawMessage.toString())
          if (message.type === 'join' || message.type === 'rejoin') {
            socket.send(JSON.stringify(joinedMsg({
              extraParticipants: [
                { participantToken: TOKEN_P2, nickname: 'calm-badger', isConnected: true, proposalEpochMs: null },
              ],
            })))
          }
        })
      })
      await enterRoomAndWait(page)
      await serverSocket.send(JSON.stringify({ type: 'locked_in', epochMs: LOCKED_MS }))
      await page.getByRole('alertdialog').waitFor({ timeout: 2000 })
    },
  },

  // ── Export screen (after lock-in modal dismissed) ─────────────────────────

  {
    name: 'party-export',
    setup: async (page) => {
      let serverSocket
      await page.routeWebSocket(/.*/, (socket) => {
        serverSocket = socket
        socket.onMessage((rawMessage) => {
          const message = JSON.parse(typeof rawMessage === 'string' ? rawMessage : rawMessage.toString())
          if (message.type === 'join' || message.type === 'rejoin') {
            socket.send(JSON.stringify(joinedMsg({
              extraParticipants: [
                { participantToken: TOKEN_P2, nickname: 'calm-badger', isConnected: true, proposalEpochMs: null },
              ],
            })))
          }
        })
      })
      await enterRoomAndWait(page)
      await serverSocket.send(JSON.stringify({ type: 'locked_in', epochMs: LOCKED_MS }))
      const modal = page.getByRole('alertdialog')
      await modal.waitFor({ timeout: 2000 })
      await modal.click()
      await modal.waitFor({ state: 'hidden', timeout: 2000 })
    },
  },

  // ── Dead room ─────────────────────────────────────────────────────────────

  {
    name: 'party-dead-room',
    setup: async (page) => {
      await page.routeWebSocket(/.*/, (socket) => {
        socket.onMessage((rawMessage) => {
          const message = JSON.parse(typeof rawMessage === 'string' ? rawMessage : rawMessage.toString())
          if (message.type === 'join' || message.type === 'rejoin') {
            socket.send(JSON.stringify({ type: 'error', code: 'ROOM_NOT_FOUND', message: 'Room not found' }))
          }
        })
      })
      await page.goto(`${BASE_URL}?code=${TEST_CODE}`, { waitUntil: 'networkidle' })
      await page.getByRole('dialog').waitFor({ timeout: 2000 })
      await page.getByRole('button', { name: /join party/i }).click()
      await page.getByRole('heading', { name: /room not found/i }).waitFor({ timeout: 2000 })
    },
  },
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
  for (const scenario of SCENARIOS) {
    const context = await browser.newContext({
      viewport: { width, height },
      deviceScaleFactor: 1,
    })
    const page = await context.newPage()
    await scenario.setup(page)
    mkdirSync(`${OUTPUT_DIR}/${name}`, { recursive: true })
    const outputPath = `${OUTPUT_DIR}/${name}/${scenario.name}.png`
    await page.screenshot({ path: outputPath, fullPage: false })
    console.log(`  ${name}/${scenario.name} (${width}×${height}) → ${outputPath}`)
    await context.close()
  }
}

await browser.close()
cleanup()
console.log(`\nScreenshots saved to ${OUTPUT_DIR}/`)
