/**
 * Help & FAQ overlay integration tests.
 *
 * Tests the Help button in the header, overlay open/close behaviour,
 * and the party-mode feature flag gating the Party Mode FAQ section.
 */
import { test, expect } from 'playwright/test'

test.describe('Help & FAQ overlay', () => {
  test('Help button is visible in the header', async ({ page }) => {
    await page.goto('.')
    await expect(page.getByRole('button', { name: /help/i })).toBeVisible()
  })

  test('clicking Help opens the dialog', async ({ page }) => {
    await page.goto('.')
    await page.getByRole('button', { name: /help/i }).click()
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByRole('heading', { name: /help & faq/i })).toBeVisible()
  })

  test('clicking the backdrop closes the dialog', async ({ page }) => {
    await page.goto('.')
    await page.getByRole('button', { name: /help/i }).click()
    await expect(page.getByRole('dialog')).toBeVisible()
    // Use dispatchEvent to force click through any overlapping elements
    await page.getByTestId('help-backdrop').dispatchEvent('click')
    await expect(page.getByRole('dialog')).not.toBeVisible()
  })

  test('pressing Escape closes the dialog', async ({ page }) => {
    await page.goto('.')
    await page.getByRole('button', { name: /help/i }).click()
    await expect(page.getByRole('dialog')).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog')).not.toBeVisible()
  })

  test('clicking Close button closes the dialog', async ({ page }) => {
    await page.goto('.')
    await page.getByRole('button', { name: /help/i }).click()
    await expect(page.getByRole('dialog')).toBeVisible()
    await page.getByRole('button', { name: /close/i }).click()
    await expect(page.getByRole('dialog')).not.toBeVisible()
  })

  test('non-party sections are always visible', async ({ page }) => {
    await page.goto('.')
    await page.getByRole('button', { name: /help/i }).click()
    const dialog = page.getByRole('dialog')
    await expect(dialog.getByText(/getting started/i)).toBeVisible()
    await expect(dialog.getByText(/times & timezones/i)).toBeVisible()
    await expect(dialog.getByText(/sharing & export/i)).toBeVisible()
  })
})

test.describe('Help & FAQ — party mode feature flag', () => {
  test('Party Mode section is hidden without enablePartyMode param', async ({ page }) => {
    await page.goto('.')
    await page.getByRole('button', { name: /help/i }).click()
    const dialog = page.getByRole('dialog')
    await expect(dialog.getByRole('heading', { name: /party mode/i })).not.toBeVisible()
  })

  test('Party Mode section is visible with ?enablePartyMode param', async ({ page }) => {
    await page.goto('.?enablePartyMode')
    await page.getByRole('button', { name: /help/i }).click()
    const dialog = page.getByRole('dialog')
    await expect(dialog.getByRole('heading', { name: /party mode/i })).toBeVisible()
    await expect(dialog.getByText(/what is party mode/i)).toBeVisible()
  })
})
