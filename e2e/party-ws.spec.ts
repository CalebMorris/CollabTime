/**
 * Party room WebSocket integration tests.
 *
 * Uses Playwright's page.routeWebSocket() to intercept and simulate the
 * WebSocket server, allowing full end-to-end UI coverage without a real
 * server. Each test controls the message sequence manually.
 *
 * Protocol reference: src/room/roomProtocol.ts
 */
import { test, expect } from 'playwright/test'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Room code used across tests — never matches a real auto-generated code. */
const TEST_CODE = 'amber-falcon-bridge'

/** Stable participant tokens used in test fixtures. */
const TOKEN_P1 = 'tok-p1-swift-otter'
const TOKEN_P2 = 'tok-p2-calm-badger'

type Page = import('playwright/test').Page
type WebSocketRoute = import('playwright/test').WebSocketRoute

/**
 * Navigate to the app, open the create overlay, and enter the room.
 * The caller is responsible for routing the WebSocket before calling this.
 */
async function enterRoomViaCreateOverlay(page: Page) {
  await page.goto('.')
  await page.getByRole('button', { name: /start a party/i }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.getByRole('button', { name: /enter the room/i }).click()
}

/**
 * Waits until the room WebSocket handshake completes and the room UI is visible.
 * Uses the Leave button as the sentinel — it is unique to the connected room UI.
 */
async function waitForRoomConnected(page: Page) {
  await expect(page.getByRole('button', { name: /leave/i })).toBeVisible({ timeout: 6000 })
}

/**
 * Navigate to the app and join via ?code= URL.
 */
async function enterRoomViaUrl(page: Page, roomCode = TEST_CODE) {
  await page.goto(`.?code=${roomCode}`)
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.getByRole('button', { name: /join party/i }).click()
}

/**
 * Registers a WebSocket route that responds to join/rejoin with the given
 * server message. MUST be awaited before navigating so the interception is
 * in place before the page opens its WebSocket connection.
 *
 * Returns a getter `() => Promise<WebSocketRoute>`. Call and await it AFTER
 * `waitForRoomConnected` to get a handle for sending further server messages.
 * The getter returns the most-recently opened WebSocket — important because
 * React StrictMode (used in dev) double-invokes effects, creating two
 * connections: the first is immediately cleaned up, the second is the live one.
 *
 * @example
 *   const serverWs$ = await mockServer(page, joinedMsg())
 *   await enterRoomViaCreateOverlay(page)
 *   await waitForRoomConnected(page)
 *   const serverWs = await serverWs$()
 *   await serverWs.send(JSON.stringify({ type: 'proposal_updated', ... }))
 */
async function mockServer(
  page: Page,
  response: object,
  onMessage?: (msg: string) => void,
): Promise<() => Promise<WebSocketRoute>> {
  // Always track the most recently opened WebSocket. React StrictMode
  // double-invokes effects, so the first WS may be closed immediately by
  // cleanup — we need the latest (active) one.
  let latestWs: WebSocketRoute | null = null

  await page.routeWebSocket(/.*/, (wsRoute) => {
    latestWs = wsRoute
    wsRoute.onMessage((wsMessage) => {
      const messageString = typeof wsMessage === 'string' ? wsMessage : wsMessage.toString()
      const parsedMessage = JSON.parse(messageString)
      if (parsedMessage.type === 'join' || parsedMessage.type === 'rejoin') {
        wsRoute.send(JSON.stringify(response))
      }
      onMessage?.(messageString)
    })
  })

  return async () => {
    // Poll until a WebSocket has connected (virtually immediate after connecting)
    while (latestWs === null) {
      await new Promise(resolve => setTimeout(resolve, 10))
    }
    return latestWs
  }
}

/** Builds a valid JoinedMessage payload matching src/room/roomProtocol.ts */
function joinedMsg(overrides: {
  nickname?: string
  participantToken?: string
  roomState?: 'waiting' | 'active' | 'locked_in'
  extraParticipants?: Array<{ participantToken: string; nickname: string }>
} = {}) {
  const {
    nickname = 'swift-otter',
    participantToken = TOKEN_P1,
    roomState = 'waiting',
    extraParticipants = [],
  } = overrides
  return {
    type: 'joined',
    sessionToken: 'session-abc',
    participantToken,
    nickname,
    protocolVersion: '1.0',
    room: {
      code: TEST_CODE,
      state: roomState,
      participants: [
        { participantToken, nickname, isConnected: true, proposalEpochMs: null },
        ...extraParticipants.map(p => ({ ...p, isConnected: true, proposalEpochMs: null })),
      ],
      lockedInEpochMs: null,
    },
  }
}

// ---------------------------------------------------------------------------
// Connection states
// ---------------------------------------------------------------------------

test.describe('Party room — connection lifecycle', () => {
  test('shows connecting state while WebSocket is pending', async ({ page }) => {
    // Route WebSocket but do not send any messages — stays in "connecting"
    await page.routeWebSocket(/.*/, () => {
      // Do nothing — connection just hangs
    })
    await enterRoomViaCreateOverlay(page)

    await expect(page.getByRole('main').or(page.locator('body'))).toContainText(
      /connecting|joining/i,
      { timeout: 6000 }
    )
  })

  test('shows the room UI after a successful join', async ({ page }) => {
    await mockServer(page, joinedMsg())
    await enterRoomViaCreateOverlay(page)

    await waitForRoomConnected(page)
    // Nickname should appear in the proposals board
    await expect(page.getByRole('region', { name: /proposals/i }).getByText('swift-otter')).toBeVisible()
  })

  test('shows ROOM_NOT_FOUND error as the dead room screen', async ({ page }) => {
    await mockServer(page, { type: 'error', code: 'ROOM_NOT_FOUND' })
    await enterRoomViaUrl(page)

    await expect(page.getByRole('heading', { name: /room not found/i })).toBeVisible({ timeout: 6000 })
    await expect(page.locator('body')).not.toContainText('ROOM_NOT_FOUND')
  })

  test('shows reconnecting banner after unexpected disconnect', async ({ page }) => {
    // Use a manual route so we can stop responding after the close, preventing
    // the reconnect from completing instantly and hiding the banner.
    let currentWs: WebSocketRoute | null = null
    let shouldRespond = true

    await page.routeWebSocket(/.*/, (wsRoute) => {
      currentWs = wsRoute
      wsRoute.onMessage((wsMessage) => {
        const messageString = typeof wsMessage === 'string' ? wsMessage : wsMessage.toString()
        const parsedMessage = JSON.parse(messageString)
        if ((parsedMessage.type === 'join' || parsedMessage.type === 'rejoin') && shouldRespond) {
          wsRoute.send(JSON.stringify(joinedMsg()))
        }
      })
    })

    await enterRoomViaCreateOverlay(page)
    await waitForRoomConnected(page)

    // Disable responses before closing so the reconnect WS hangs
    shouldRespond = false
    await currentWs!.close()

    await expect(page.getByRole('alert').getByText(/reconnecting/i)).toBeVisible({ timeout: 6000 })
  })
})

// ---------------------------------------------------------------------------
// Proposals board
// ---------------------------------------------------------------------------

test.describe('Party room — proposals board', () => {
  const twoParticipants = joinedMsg({
    extraParticipants: [{ participantToken: TOKEN_P2, nickname: 'calm-badger' }],
  })

  async function setupRoom(page: Page) {
    await mockServer(page, twoParticipants)
    await enterRoomViaCreateOverlay(page)
    await waitForRoomConnected(page)
  }

  test('shows all participants in the proposals board', async ({ page }) => {
    await setupRoom(page)
    const board = page.getByRole('region', { name: /proposals/i })
    await expect(board.getByText('swift-otter')).toBeVisible()
    await expect(board.getByText('calm-badger')).toBeVisible()
  })

  test('labels own participant with "(You)"', async ({ page }) => {
    await setupRoom(page)
    await expect(page.getByRole('region', { name: /proposals/i }).getByText('(You)')).toBeVisible()
  })

  test('shows "—" placeholder for participants without a proposal', async ({ page }) => {
    await setupRoom(page)
    await expect(page.getByText('—').first()).toBeVisible()
  })

  test('proposal appears in the board after participant proposes', async ({ page }) => {
    const serverWs$ = await mockServer(page, twoParticipants)
    await enterRoomViaCreateOverlay(page)
    await waitForRoomConnected(page)

    const serverWs = await serverWs$()
    await serverWs.send(JSON.stringify({
      type: 'proposal_updated',
      participantToken: TOKEN_P2,
      epochMs: new Date('2025-06-15T14:00:00Z').getTime(),
    }))

    // Dash for calm-badger should be replaced by a time string
    await expect(page.getByText('calm-badger').locator('..')).not.toContainText('—', { timeout: 4000 })
  })

  test('nickname is not visually truncated when a proposal time is shown', async ({ page }) => {
    // Use realistic server-style nicknames (title case, 2 words) to stress the layout
    const realisticNicknameMsg = joinedMsg({
      nickname: 'Rocky Snow',
      participantToken: TOKEN_P1,
      extraParticipants: [{ participantToken: TOKEN_P2, nickname: 'Hefty Sand' }],
    })
    const serverWs$ = await mockServer(page, realisticNicknameMsg)
    await enterRoomViaCreateOverlay(page)
    await waitForRoomConnected(page)

    const serverWs = await serverWs$()
    // Send proposals for both — including the own (You) row which has the tightest layout
    await serverWs.send(JSON.stringify({
      type: 'proposal_updated',
      participantToken: TOKEN_P1,
      epochMs: new Date('2025-03-27T20:00:00Z').getTime(),
    }))
    await serverWs.send(JSON.stringify({
      type: 'proposal_updated',
      participantToken: TOKEN_P2,
      epochMs: new Date('2025-03-26T17:14:00Z').getTime(),
    }))

    // Wait for both times to appear
    await expect(page.getByText('Hefty Sand').locator('..')).not.toContainText('—', { timeout: 4000 })

    await page.screenshot({ path: 'test-results/ux004-proposals-with-time.png' })

    // Neither nickname span should be overflowing (scrollWidth > clientWidth = truncated)
    const board = page.getByRole('region', { name: /proposals/i })
    for (const nickname of ['Rocky Snow', 'Hefty Sand']) {
      const nicknameEl = board.getByText(nickname)
      const isOverflowing = await nicknameEl.evaluate(
        (el) => el.scrollWidth > el.clientWidth
      )
      expect(isOverflowing, `${nickname} should not be truncated`).toBe(false)
    }
  })

  test('a new participant joining updates the proposals board', async ({ page }) => {
    const serverWs$ = await mockServer(page, joinedMsg())
    await enterRoomViaCreateOverlay(page)
    await waitForRoomConnected(page)

    const serverWs = await serverWs$()
    await serverWs.send(JSON.stringify({
      type: 'participant_joined',
      participantToken: TOKEN_P2,
      nickname: 'calm-badger',
    }))

    await expect(page.getByText('calm-badger')).toBeVisible({ timeout: 4000 })
  })
})

// ---------------------------------------------------------------------------
// Proposing a time
// ---------------------------------------------------------------------------

test.describe('Party room — proposing a time', () => {
  test('sends a "propose" message when submitting via text import', async ({ page }) => {
    const sentMessages: string[] = []

    // roomState must be 'active' for the Propose button to be enabled
    await mockServer(page, joinedMsg({ roomState: 'active' }), (msg) => sentMessages.push(msg))
    await enterRoomViaCreateOverlay(page)
    await waitForRoomConnected(page)

    await page.getByLabel('Enter time').fill('2025-06-15T14:00:00Z')
    await page.getByRole('button', { name: 'Parse' }).click()
    // Wait for the propose button to become enabled after the parse
    await expect(page.getByRole('button', { name: /propose/i })).toBeEnabled({ timeout: 3000 })
    await page.getByRole('button', { name: /propose/i }).click()

    await expect.poll(() =>
      sentMessages.some(sentMessage => {
        try { return JSON.parse(sentMessage).type === 'propose' } catch { return false }
      })
    ).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Lock-in flow
// ---------------------------------------------------------------------------

test.describe('Party room — lock-in flow', () => {
  const lockedMs = new Date('2025-06-15T14:00:00Z').getTime()

  async function setupAndLockIn(page: Page) {
    const serverWs$ = await mockServer(page, joinedMsg({
      extraParticipants: [{ participantToken: TOKEN_P2, nickname: 'calm-badger' }],
    }))
    await enterRoomViaCreateOverlay(page)
    await waitForRoomConnected(page)

    const serverWs = await serverWs$()
    await serverWs.send(JSON.stringify({ type: 'locked_in', epochMs: lockedMs }))
  }

  test('shows the LockInModal after receiving locked_in', async ({ page }) => {
    await setupAndLockIn(page)
    // LockInModal uses role="alertdialog" (not role="dialog")
    await expect(page.getByRole('alertdialog')).toBeVisible({ timeout: 4000 })
    await expect(page.getByRole('alertdialog')).toContainText(/locked in/i)
  })

  test('LockInModal auto-dismisses and shows export screen', async ({ page }) => {
    await setupAndLockIn(page)
    await expect(page.getByRole('alertdialog')).toBeVisible({ timeout: 4000 })

    // Wait for auto-dismiss (2500ms + buffer)
    await expect(page.getByRole('alertdialog')).not.toBeVisible({ timeout: 5000 })
    await expect(page.getByRole('heading', { name: /locked in/i })).toBeVisible()
  })

  test('clicking the LockInModal dismisses it early', async ({ page }) => {
    await setupAndLockIn(page)
    const modal = page.getByRole('alertdialog')
    await expect(modal).toBeVisible({ timeout: 4000 })

    await modal.click()
    await expect(modal).not.toBeVisible({ timeout: 2000 })
  })

  test('export screen shows participant list', async ({ page }) => {
    await setupAndLockIn(page)
    await page.getByRole('alertdialog').click()
    await expect(page.getByRole('alertdialog')).not.toBeVisible({ timeout: 2000 })

    // Scope to the "On Board" region to avoid matching the party room's Proposals board
    const onBoard = page.getByRole('region', { name: /on board/i })
    await expect(onBoard.getByText('swift-otter')).toBeVisible()
    await expect(onBoard.getByText('calm-badger')).toBeVisible()
  })

  test('"Back to Solo Mode" on export screen returns to solo mode', async ({ page }) => {
    await setupAndLockIn(page)
    await page.getByRole('alertdialog').click()
    await expect(page.getByRole('alertdialog')).not.toBeVisible({ timeout: 2000 })

    await page.getByRole('button', { name: /back to solo mode/i }).click()

    await expect(page.getByRole('heading', { level: 1, name: 'CollabTime' })).toBeVisible()
    await expect(page.getByLabel('Enter time')).toBeVisible()
  })
})

// ---------------------------------------------------------------------------
// Dead room screen
// ---------------------------------------------------------------------------

test.describe('PartyDeadRoom', () => {
  async function gotoDeadRoom(page: Page, roomCode = TEST_CODE) {
    await mockServer(page, { type: 'error', code: 'ROOM_NOT_FOUND' })
    await enterRoomViaUrl(page, roomCode)
    await expect(page.getByRole('heading', { name: /room not found/i })).toBeVisible({ timeout: 6000 })
  }

  test('displays the attempted room code', async ({ page }) => {
    await gotoDeadRoom(page, TEST_CODE)
    await expect(page.getByText(TEST_CODE)).toBeVisible()
  })

  test('"Try a Different Code" reveals an input field', async ({ page }) => {
    await gotoDeadRoom(page)
    await page.getByRole('button', { name: /try a different code/i }).click()
    await expect(page.getByLabel('Party room code')).toBeVisible()
  })

  test('"Join" is disabled for an invalid code in the dead room input', async ({ page }) => {
    await gotoDeadRoom(page)
    await page.getByRole('button', { name: /try a different code/i }).click()
    await page.getByLabel('Party room code').fill('bad')
    await expect(page.getByRole('button', { name: 'Join' })).toBeDisabled()
  })

  test('"Start a New Party" opens the create overlay', async ({ page }) => {
    await gotoDeadRoom(page)
    await page.getByRole('button', { name: /start a new party/i }).click()
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByRole('dialog')).toContainText('Your Party Room')
  })

  test('"Go to Solo Mode" returns to the solo UI', async ({ page }) => {
    await gotoDeadRoom(page)
    await page.getByRole('button', { name: /go to solo mode/i }).click()
    await expect(page.getByRole('heading', { level: 1, name: 'CollabTime' })).toBeVisible()
    await expect(page.getByLabel('Enter time')).toBeVisible()
  })
})

// ---------------------------------------------------------------------------
// Leave room
// ---------------------------------------------------------------------------

test.describe('Party room — leaving', () => {
  test('"Leave" button returns to solo mode', async ({ page }) => {
    await mockServer(page, joinedMsg())
    await enterRoomViaCreateOverlay(page)
    await waitForRoomConnected(page)

    await page.getByRole('button', { name: /leave/i }).click()

    await expect(page.getByRole('heading', { level: 1, name: 'CollabTime' })).toBeVisible()
    await expect(page.getByLabel('Enter time')).toBeVisible()
  })
})
