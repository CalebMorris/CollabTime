import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, beforeEach } from 'vitest'
import App from './App'

describe('App', () => {
  beforeEach(() => localStorage.clear())

  it('renders without crashing', () => {
    render(<App />)
    expect(screen.getByRole('main')).toBeDefined()
  })

  it('renders the timezone chip in the header', () => {
    render(<App />)
    // The timezone chip button should show the current timezone (UTC in test env)
    // Accessible name must match visible text (WCAG 2.5.3)
    expect(screen.getByRole('button', { name: /utc/i })).toBeDefined()
  })

  it('timezone chip accessible name contains the visible timezone text (WCAG 2.5.3)', () => {
    render(<App />)
    // aria-label must not override visible text with a generic "Timezone" label
    const button = screen.getByRole('button', { name: /utc/i })
    expect(button.getAttribute('aria-label')).not.toBe('Timezone')
  })

  it('renders both input methods simultaneously', () => {
    render(<App />)
    expect(screen.getByRole('textbox', { name: /enter time/i })).toBeDefined()
    expect(screen.getByLabelText(/date and time/i)).toBeDefined()
  })

  it('renders the or divider between input methods', () => {
    render(<App />)
    expect(screen.getByText(/\bor\b/i)).toBeDefined()
  })

  it('renders the result placeholder before any time is set', () => {
    render(<App />)
    expect(screen.getByTestId('result-placeholder')).toBeDefined()
  })

  it('does not render the exports section before a time is selected', () => {
    render(<App />)
    expect(screen.queryByRole('region', { name: /share & export/i })).toBeNull()
  })

  it('renders the exports section after a time is selected', () => {
    render(<App />)
    fireEvent.change(screen.getByLabelText(/date and time/i), {
      target: { value: '2018-11-28T11:01' },
    })
    expect(screen.getByRole('region', { name: /share & export/i })).toBeDefined()
  })

  it('exports section has the slide-in animation class when it appears', () => {
    render(<App />)
    fireEvent.change(screen.getByLabelText(/date and time/i), {
      target: { value: '2018-11-28T11:01' },
    })
    const exportSection = screen.getByRole('region', { name: /share & export/i })
    expect(exportSection.className).toContain('animate-slide-in-from-right')
  })

  it('syncs manual picker when TextImport parses a time', async () => {
    // TZ=UTC is set globally so the auto-detected timezone is UTC — no need to change it
    const user = userEvent.setup()
    render(<App />)

    await user.type(screen.getByRole('textbox', { name: /enter time/i }), '2018-11-28T11:01:00Z')
    await user.click(screen.getByRole('button', { name: /parse/i }))

    // ManualSelector datetime-local input should now reflect that time in UTC
    const dtInput = screen.getByLabelText(/date and time/i) as HTMLInputElement
    expect(dtInput.value).toBe('2018-11-28T11:01')
  })

  it('populates text input with short date/time format when deep link loads', () => {
    Object.defineProperty(window, 'location', {
      value: { ...window.location, search: '?time=1543392060' },
      configurable: true,
    })
    render(<App />)
    const textarea = screen.getByRole('textbox', { name: /enter time/i }) as HTMLTextAreaElement
    // Discord 'f' format in UTC → "November 28, 2018 at 8:01 AM"
    expect(textarea.value).toContain('November')
    expect(textarea.value).toContain('2018')
    expect(textarea.value).toContain('8:01')
  })

  it('syncs selected time when manual picker changes', () => {
    render(<App />)

    fireEvent.change(screen.getByLabelText(/date and time/i), {
      target: { value: '2018-11-28T11:01' },
    })

    // ConversionDisplay should appear with the formatted date
    expect(screen.getByTestId('utc-time').textContent).toContain('11:01')
  })
})
