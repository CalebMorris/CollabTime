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

  it('syncs selected time when manual picker changes', () => {
    render(<App />)

    fireEvent.change(screen.getByLabelText(/date and time/i), {
      target: { value: '2018-11-28T11:01' },
    })

    // ConversionDisplay should appear with the formatted date
    expect(screen.getByTestId('utc-time').textContent).toContain('11:01')
  })
})
