import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { ManualSelector } from './ManualSelector'

describe('ManualSelector', () => {
  it('renders a datetime-local input', () => {
    render(<ManualSelector timezone="UTC" onTimezoneChange={() => {}} onTime={() => {}} />)
    expect(screen.getByLabelText(/date and time/i)).toBeDefined()
  })

  it('renders the timezone selector', () => {
    render(<ManualSelector timezone="UTC" onTimezoneChange={() => {}} onTime={() => {}} />)
    expect(screen.getByRole('textbox', { name: /search timezones/i })).toBeDefined()
  })

  it('emits correct UTC ms for a datetime in UTC', () => {
    const onTime = vi.fn()
    render(<ManualSelector timezone="UTC" onTimezoneChange={() => {}} onTime={onTime} />)
    fireEvent.change(screen.getByLabelText(/date and time/i), {
      target: { value: '2018-11-28T11:01' },
    })
    expect(onTime).toHaveBeenCalledWith(1543402860000)
  })

  it('emits correct UTC ms for a datetime in America/New_York (UTC-5 in November)', () => {
    const onTime = vi.fn()
    render(
      <ManualSelector timezone="America/New_York" onTimezoneChange={() => {}} onTime={onTime} />,
    )
    fireEvent.change(screen.getByLabelText(/date and time/i), {
      target: { value: '2018-11-28T06:01' },
    })
    expect(onTime).toHaveBeenCalledWith(1543402860000)
  })

  it('reflects a UTC timestamp as the correct local value in UTC', () => {
    render(
      <ManualSelector
        timezone="UTC"
        onTimezoneChange={() => {}}
        onTime={() => {}}
        value={1543402860000}
      />,
    )
    const input = screen.getByLabelText(/date and time/i) as HTMLInputElement
    expect(input.value).toBe('2018-11-28T11:01')
  })

  it('reflects a UTC timestamp as the correct local value in America/New_York', () => {
    render(
      <ManualSelector
        timezone="America/New_York"
        onTimezoneChange={() => {}}
        onTime={() => {}}
        value={1543402860000}
      />,
    )
    const input = screen.getByLabelText(/date and time/i) as HTMLInputElement
    expect(input.value).toBe('2018-11-28T06:01')
  })
})
