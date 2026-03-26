/**
 * Party overlay integration tests (no WebSocket required).
 *
 * Covers the create and join overlays — modal behaviour, form validation,
 * clipboard copy feedback, keyboard accessibility, and focus trapping.
 * These tests do not require a live WebSocket server.
 */
import { test, expect } from 'playwright/test'

// ---------------------------------------------------------------------------
// Party Create Overlay
// ---------------------------------------------------------------------------

test.describe('PartyCreateOverlay', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('.')
    await page.getByRole('button', { name: /start a party/i }).click()
    // Wait for the dialog to appear
    await expect(page.getByRole('dialog')).toBeVisible()
  })

  test('shows the "Your Party Room" dialog', async ({ page }) => {
    await expect(page.getByRole('dialog')).toContainText('Your Party Room')
  })

  test('displays a 3-word room code in the expected format', async ({ page }) => {
    const dialog = page.getByRole('dialog')
    // The code is in a mono font span — select-all class targets it
    const codeEl = dialog.locator('span.font-mono')
    const roomCodeText = await codeEl.innerText()
    expect(roomCodeText).toMatch(/^[a-z]+-[a-z]+-[a-z]+$/)
  })

  test('"Copy Code" button changes to "Copied!" and reverts', async ({ page }) => {
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write'])

    const copyCodeButton = page.getByRole('button', { name: /copy code/i })
    await copyCodeButton.click()
    await expect(copyCodeButton).toHaveText('Copied!')
    await expect(copyCodeButton).not.toHaveText('Copied!', { timeout: 4000 })
  })

  test('"Copy Link" button changes to "Copied!" and reverts', async ({ page }) => {
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write'])

    const copyLinkButton = page.getByRole('button', { name: /copy link/i })
    await copyLinkButton.click()
    await expect(copyLinkButton).toHaveText('Copied!')
    await expect(copyLinkButton).not.toHaveText('Copied!', { timeout: 4000 })
  })

  test('"Copy Link" writes a URL containing ?code= to the clipboard', async ({ page }) => {
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write'])

    await page.getByRole('button', { name: /copy link/i }).click()
    const clipboardText = await page.evaluate(() => navigator.clipboard.readText())
    expect(clipboardText).toMatch(/\?code=/)
  })

  test('Escape key dismisses the overlay', async ({ page }) => {
    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog')).not.toBeVisible()
  })

  test('clicking the backdrop dismisses the overlay', async ({ page }) => {
    await page.getByTestId('overlay-backdrop').dispatchEvent('click')
    await expect(page.getByRole('dialog')).not.toBeVisible()
  })

  test('"Enter the Room" button navigates into party-room mode', async ({ page }) => {
    // We expect the room mode to show a "Leave" button (not a dialog)
    await page.getByRole('button', { name: /enter the room/i }).click()
    // The overlay should close and a party-room UI should appear
    await expect(page.getByRole('dialog')).not.toBeVisible()
    // Party room renders a Leave button in the header
    await expect(page.getByRole('button', { name: /leave/i })).toBeVisible({ timeout: 8000 })
  })

  test('focus is trapped inside the dialog', async ({ page }) => {
    // Tab through every focusable element; focus must not leave the dialog
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('Tab')
      const focusedInsideDialog = await page.evaluate(() => {
        const dialog = document.querySelector('[role="dialog"]')
        return dialog?.contains(document.activeElement) ?? false
      })
      expect(focusedInsideDialog).toBe(true)
    }
  })

  test('focus is set inside the dialog on open', async ({ page }) => {
    const focusedInsideDialog = await page.evaluate(() => {
      const dialog = document.querySelector('[role="dialog"]')
      return dialog?.contains(document.activeElement) ?? false
    })
    expect(focusedInsideDialog).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Party Join Overlay — empty state
// ---------------------------------------------------------------------------

test.describe('PartyJoinOverlay — empty state', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('.')
    await page.getByRole('button', { name: /join a party/i }).click()
    await expect(page.getByRole('dialog')).toBeVisible()
  })

  test('shows the "Join a Party" dialog', async ({ page }) => {
    await expect(page.getByRole('dialog')).toContainText('Join a Party')
  })

  test('"Join Party" button is disabled when input is empty', async ({ page }) => {
    const joinPartyButton = page.getByRole('button', { name: /join party/i })
    await expect(joinPartyButton).toBeDisabled()
  })

  test('shows validation error for malformed code', async ({ page }) => {
    await page.getByLabel('Party room code').fill('bad code!')
    await expect(page.getByRole('alert')).toBeVisible()
    await expect(page.getByRole('alert')).toContainText('word-word-word')
  })

  test('"Join Party" is disabled while the code is invalid', async ({ page }) => {
    await page.getByLabel('Party room code').fill('bad')
    await expect(page.getByRole('button', { name: /join party/i })).toBeDisabled()
  })

  test('"Join Party" is enabled for a valid three-word code', async ({ page }) => {
    await page.getByLabel('Party room code').fill('amber-falcon-bridge')
    await expect(page.getByRole('button', { name: /join party/i })).toBeEnabled()
  })

  test('input converts to lowercase automatically', async ({ page }) => {
    const roomCodeInput = page.getByLabel('Party room code')
    await roomCodeInput.fill('AMBER-FALCON-BRIDGE')
    const inputValue = await roomCodeInput.inputValue()
    expect(inputValue).toBe('amber-falcon-bridge')
  })

  test('Escape key dismisses the overlay', async ({ page }) => {
    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog')).not.toBeVisible()
  })

  test('clicking the backdrop dismisses the overlay', async ({ page }) => {
    await page.getByTestId('overlay-backdrop').dispatchEvent('click')
    await expect(page.getByRole('dialog')).not.toBeVisible()
  })

  test('focus is trapped inside the dialog', async ({ page }) => {
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('Tab')
      const focusedInsideDialog = await page.evaluate(() => {
        const dialog = document.querySelector('[role="dialog"]')
        return dialog?.contains(document.activeElement) ?? false
      })
      expect(focusedInsideDialog).toBe(true)
    }
  })
})

// ---------------------------------------------------------------------------
// Party Join Overlay — pre-filled via ?code= URL
// ---------------------------------------------------------------------------

test.describe('PartyJoinOverlay — pre-filled via URL', () => {
  test('?code= param opens the join overlay with the code pre-filled', async ({ page }) => {
    await page.goto('.?code=amber-falcon-bridge')
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await expect(page.getByLabel('Party room code')).toHaveValue('amber-falcon-bridge')
  })

  test('pre-filled input is read-only', async ({ page }) => {
    await page.goto('.?code=amber-falcon-bridge')
    const input = page.getByLabel('Party room code')
    await expect(input).toHaveAttribute('readonly')
  })

  test('"Join Party" button is enabled for a valid pre-filled code', async ({ page }) => {
    await page.goto('.?code=amber-falcon-bridge')
    await expect(page.getByRole('button', { name: /join party/i })).toBeEnabled()
  })
})

// ---------------------------------------------------------------------------
// Overlay accessibility
// ---------------------------------------------------------------------------

test.describe('Overlay accessibility', () => {
  test('create overlay has aria-modal and aria-labelledby', async ({ page }) => {
    await page.goto('.')
    await page.getByRole('button', { name: /start a party/i }).click()

    const dialog = page.getByRole('dialog')
    await expect(dialog).toHaveAttribute('aria-modal', 'true')
    const labelId = await dialog.getAttribute('aria-labelledby')
    expect(labelId).toBeTruthy()
    // The element it points to must exist and contain meaningful text
    await expect(page.locator(`#${labelId}`)).toContainText(/.+/)
  })

  test('join overlay has aria-modal and aria-labelledby', async ({ page }) => {
    await page.goto('.')
    await page.getByRole('button', { name: /join a party/i }).click()

    const dialog = page.getByRole('dialog')
    await expect(dialog).toHaveAttribute('aria-modal', 'true')
    const labelId = await dialog.getAttribute('aria-labelledby')
    expect(labelId).toBeTruthy()
    await expect(page.locator(`#${labelId}`)).toContainText(/.+/)
  })
})
