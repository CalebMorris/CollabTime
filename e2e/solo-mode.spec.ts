/**
 * Solo mode integration tests.
 *
 * Tests the full user journey: load page → enter time → see conversion → export.
 * All tests run against a live dev server (BASE_URL env, default localhost:5173).
 */
import { test, expect } from 'playwright/test'

test.describe('Page load', () => {
  test('renders the app header and "Pick a Time" section', async ({ page }) => {
    await page.goto('.')
    await expect(page.getByRole('heading', { level: 1, name: 'CollabTime' })).toBeVisible()
    await expect(page.getByRole('heading', { name: /pick a time/i })).toBeVisible()
  })

  test('shows the timezone selector in the header', async ({ page }) => {
    await page.goto('.')
    // Button has aria-haspopup="listbox" and shows a timezone string
    const timezoneButton = page.locator('header button[aria-haspopup="listbox"]')
    await expect(timezoneButton).toBeVisible()
  })

  test('result panel shows placeholder dashes before any time is set', async ({ page }) => {
    await page.goto('.')
    const resultPlaceholder = page.getByTestId('result-placeholder')
    await expect(resultPlaceholder).toBeVisible()
  })

  test('Share & Export section is hidden before a time is set', async ({ page }) => {
    await page.goto('.')
    await expect(page.getByRole('heading', { name: /share & export/i })).not.toBeVisible()
  })
})

test.describe('TextImport — natural language parsing', () => {
  test('parses an ISO 8601 timestamp and shows the result', async ({ page }) => {
    await page.goto('.')
    await page.getByLabel('Enter time').fill('2025-06-15T14:00:00Z')
    await page.getByRole('button', { name: 'Parse' }).click()

    await expect(page.getByTestId('utc-time')).toContainText('2:00')
    await expect(page.getByTestId('local-time')).toBeVisible()
  })

  test('parses a Unix timestamp (seconds)', async ({ page }) => {
    await page.goto('.')
    // 2025-01-01T00:00:00Z = 1735689600
    await page.getByLabel('Enter time').fill('1735689600')
    await page.getByRole('button', { name: 'Parse' }).click()

    await expect(page.getByTestId('utc-time')).toContainText('2025')
  })

  test('shows an error for unrecognised input', async ({ page }) => {
    await page.goto('.')
    await page.getByLabel('Enter time').fill('not a date at all xyz')
    await page.getByRole('button', { name: 'Parse' }).click()

    await expect(page.getByRole('alert')).toBeVisible()
    // Result should stay as placeholder
    await expect(page.getByTestId('result-placeholder')).toBeVisible()
  })

  test('submits on Enter key (without Shift)', async ({ page }) => {
    await page.goto('.')
    const timeInput = page.getByLabel('Enter time')
    await timeInput.fill('2025-06-15T14:00:00Z')
    await timeInput.press('Enter')

    await expect(page.getByTestId('utc-time')).toContainText('2:00')
  })

  test('Shift+Enter does not submit', async ({ page }) => {
    await page.goto('.')
    const timeInput = page.getByLabel('Enter time')
    await timeInput.fill('2025-06-15T14:00:00Z')
    await timeInput.press('Shift+Enter')

    // Result should still be placeholder
    await expect(page.getByTestId('result-placeholder')).toBeVisible()
  })
})

test.describe('ConversionDisplay', () => {
  test('shows local time, UTC, and countdown after parsing', async ({ page }) => {
    await page.goto('.')
    // Use a fixed future timestamp: 2099-01-01T00:00:00Z
    await page.getByLabel('Enter time').fill('2099-01-01T00:00:00Z')
    await page.getByRole('button', { name: 'Parse' }).click()

    await expect(page.getByTestId('utc-time')).toBeVisible()
    await expect(page.getByTestId('local-time')).toBeVisible()
    await expect(page.getByTestId('countdown')).toBeVisible()
    // Should say "In …" for a future date
    await expect(page.getByTestId('countdown')).toContainText('In', { ignoreCase: false })
  })

  test('shows "Ago" countdown for a past timestamp', async ({ page }) => {
    await page.goto('.')
    // 2000-01-01T00:00:00Z — safely in the past
    await page.getByLabel('Enter time').fill('2000-01-01T00:00:00Z')
    await page.getByRole('button', { name: 'Parse' }).click()

    await expect(page.getByTestId('countdown')).toContainText('Ago', { ignoreCase: false })
  })
})

test.describe('ManualSelector', () => {
  test('setting a datetime-local value updates the result', async ({ page }) => {
    await page.goto('.')
    const dateTimeInput = page.locator('input[type="datetime-local"]')
    // Set to a specific date; value format is YYYY-MM-DDTHH:MM
    await dateTimeInput.fill('2025-06-15T14:00')
    // Trigger change event (some browsers need blur)
    await dateTimeInput.press('Tab')

    await expect(page.getByTestId('utc-time')).toBeVisible()
    await expect(page.getByTestId('local-time')).toBeVisible()
  })
})

test.describe('Timezone selector', () => {
  test('opens the timezone picker on click', async ({ page }) => {
    await page.goto('.')
    await page.locator('header button[aria-haspopup="listbox"]').click()

    // The search combobox should appear
    await expect(page.getByRole('combobox', { name: /search timezones/i })).toBeVisible()
  })

  test('filtering the list narrows down options', async ({ page }) => {
    await page.goto('.')
    await page.locator('header button[aria-haspopup="listbox"]').click()

    // Type to filter
    await page.keyboard.type('Tokyo')
    await expect(page.getByText('Asia/Tokyo', { exact: false })).toBeVisible()
  })

  test('selecting a timezone closes the picker and updates the button label', async ({ page }) => {
    await page.goto('.')
    await page.locator('header button[aria-haspopup="listbox"]').click()
    await page.keyboard.type('Tokyo')

    const tokyoOption = page.getByText('Asia/Tokyo').first()
    await tokyoOption.click()

    // Picker should close
    await expect(page.locator('[role="listbox"]')).not.toBeVisible()
    // Button label should reflect the new timezone
    await expect(page.locator('header button[aria-haspopup="listbox"]')).toContainText('Asia/Tokyo')
  })

  test('clicking outside closes the timezone picker', async ({ page }) => {
    await page.goto('.')
    await page.locator('header button[aria-haspopup="listbox"]').click()
    await expect(page.getByRole('combobox', { name: /search timezones/i })).toBeVisible()

    // Click-outside triggers the mousedown handler that closes the picker
    await page.locator('h1').click()
    await expect(page.getByRole('combobox', { name: /search timezones/i })).not.toBeVisible()
  })
})

test.describe('Share & Export panel', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('.')
    await page.getByLabel('Enter time').fill('2099-06-15T14:00:00Z')
    await page.getByRole('button', { name: 'Parse' }).click()
  })

  test('Share & Export section appears after a time is set', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /share & export/i })).toBeVisible()
  })

  test('deep link copy button changes to "Copied!" and reverts', async ({ page }) => {
    if (test.info().project.name === 'firefox') {
      test.skip(true, 'Clipboard tests not supported in Firefox')
    }
    // Grant clipboard permissions
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write'])

    const copyButton = page.getByRole('button', { name: /copy link/i }).first()
    await copyButton.click()
    await expect(copyButton).toHaveText('Copied!')
    // After 2s it should revert
    await expect(copyButton).not.toHaveText('Copied!', { timeout: 4000 })
  })

  test('deep link URL contains the ?time= parameter', async ({ page }) => {
    if (test.info().project.name === 'firefox') {
      test.skip(true, 'Clipboard tests not supported in Firefox')
    }
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write'])

    // The URL is shown inline as a <code> element
    const codeEl = page.locator('code').filter({ hasText: '?time=' })
    await expect(codeEl).toBeVisible()
    const linkText = await codeEl.innerText()
    expect(linkText).toMatch(/\?time=\d+/)
  })

  test('Discord timestamps section expands on click', async ({ page }) => {
    const discordButton = page.getByRole('button', { name: /discord timestamps/i })
    await discordButton.click()

    // At least one format row should be visible (Short Time flag 't')
    await expect(page.getByTestId('preview-t')).toBeVisible()
  })

  test('Discord timestamps section collapses on second click', async ({ page }) => {
    const discordButton = page.getByRole('button', { name: /discord timestamps/i })
    await discordButton.click()
    await expect(page.getByTestId('preview-t')).toBeVisible()

    await discordButton.click()
    await expect(page.getByTestId('preview-t')).not.toBeVisible()
  })

  test('Discord copy button changes to "Copied!" for the clicked format', async ({ page }) => {
    if (test.info().project.name === 'firefox') {
      test.skip(true, 'Clipboard tests not supported in Firefox')
    }
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write'])

    await page.getByRole('button', { name: /discord timestamps/i }).click()
    const copyBtn = page.getByRole('button', { name: /copy short time/i }).first()
    await copyBtn.click()
    await expect(copyBtn).toHaveText('Copied!')
  })

  test('Google Calendar link is present', async ({ page }) => {
    const gcalLink = page.getByRole('link', { name: /google calendar/i })
    await expect(gcalLink).toBeVisible()
    const href = await gcalLink.getAttribute('href')
    expect(href).toContain('calendar.google.com')
  })
})

test.describe('Deep link navigation', () => {
  test('?time= param pre-fills a timestamp on load', async ({ page }) => {
    // 2025-01-01T00:00:00Z = unix 1735689600
    await page.goto('.?time=1735689600')

    await expect(page.getByTestId('utc-time')).toContainText('2025')
    // Share & Export should already be visible
    await expect(page.getByRole('heading', { name: /share & export/i })).toBeVisible()
  })

  test('?time= param with invalid value does not crash the page', async ({ page }) => {
    await page.goto('.?time=notanumber')
    // App should still load normally in solo mode
    await expect(page.getByRole('heading', { level: 1, name: 'CollabTime' })).toBeVisible()
    await expect(page.getByTestId('result-placeholder')).toBeVisible()
  })
})

test.describe('CoordinateSection — party entry points', () => {
  test('shows "Start a Party" and "Join a Party" buttons', async ({ page }) => {
    await page.goto('.')
    await expect(page.getByRole('button', { name: /start a party/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /join a party/i })).toBeVisible()
  })
})
