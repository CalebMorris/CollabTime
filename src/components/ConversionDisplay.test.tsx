import { render, screen, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ConversionDisplay } from './ConversionDisplay'

const NOV_28_2018_UTC_MS = 1543402860000 // 2018-11-28T11:01:00Z

describe('ConversionDisplay', () => {
  it('renders a placeholder when timestamp is null', () => {
    render(<ConversionDisplay timestamp={null} timezone="America/New_York" />)
    expect(screen.getByTestId('result-placeholder')).toBeDefined()
  })

  it('shows the local time label', () => {
    render(<ConversionDisplay timestamp={NOV_28_2018_UTC_MS} timezone="America/New_York" />)
    expect(screen.getByText(/local time/i)).toBeDefined()
  })

  it('shows the UTC label', () => {
    render(<ConversionDisplay timestamp={NOV_28_2018_UTC_MS} timezone="America/New_York" />)
    expect(screen.getByText(/utc/i)).toBeDefined()
  })

  it('displays the time in the given timezone', () => {
    render(<ConversionDisplay timestamp={NOV_28_2018_UTC_MS} timezone="America/New_York" />)
    // 11:01 UTC = 6:01 AM Eastern
    expect(screen.getByTestId('local-time').textContent).toContain('6:01')
  })

  it('displays the UTC equivalent', () => {
    render(<ConversionDisplay timestamp={NOV_28_2018_UTC_MS} timezone="America/New_York" />)
    expect(screen.getByTestId('utc-time').textContent).toContain('11:01')
  })

  it('shows the timezone name', () => {
    render(<ConversionDisplay timestamp={NOV_28_2018_UTC_MS} timezone="America/New_York" />)
    expect(screen.getByText(/america\/new_york/i)).toBeDefined()
  })
})

describe('countdown display', () => {
  const FIXED_NOW = 1_700_000_000_000

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(FIXED_NOW)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders data-testid="countdown" for a future timestamp', () => {
    render(<ConversionDisplay timestamp={FIXED_NOW + 90_000} timezone="UTC" />)
    expect(screen.getByTestId('countdown')).toBeDefined()
  })

  it('shows "In" label for future timestamp', () => {
    render(<ConversionDisplay timestamp={FIXED_NOW + 90_000} timezone="UTC" />)
    expect(screen.getByTestId('countdown').textContent).toContain('In')
  })

  it('shows "Ago" label for past timestamp', () => {
    render(<ConversionDisplay timestamp={FIXED_NOW - 90_000} timezone="UTC" />)
    expect(screen.getByTestId('countdown').textContent).toContain('Ago')
  })

  it('hides the countdown row when timestamp is null', () => {
    render(<ConversionDisplay timestamp={null} timezone="UTC" />)
    expect(screen.queryByTestId('countdown')).toBeNull()
  })

  it('hides the countdown row when delta < 1s', () => {
    render(<ConversionDisplay timestamp={FIXED_NOW + 500} timezone="UTC" />)
    expect(screen.queryByTestId('countdown')).toBeNull()
  })

  it('renders a border-b separator when countdown is shown', () => {
    const { container } = render(
      <ConversionDisplay timestamp={FIXED_NOW + 90_000} timezone="UTC" />,
    )
    const separator = container.querySelector('.border-b')
    expect(separator).not.toBeNull()
  })

  it('updates after 1000ms', async () => {
    render(<ConversionDisplay timestamp={FIXED_NOW + 65_000} timezone="UTC" />)
    const initial = screen.getByTestId('countdown').textContent
    await act(async () => { vi.advanceTimersByTime(1000) })
    const updated = screen.getByTestId('countdown').textContent
    expect(updated).not.toBe(initial)
  })
})
