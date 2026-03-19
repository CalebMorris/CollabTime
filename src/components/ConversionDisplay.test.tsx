import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
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
