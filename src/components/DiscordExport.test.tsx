import { render, screen, fireEvent, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { DiscordExport } from './DiscordExport'

const TIMESTAMP_MS = 1543392060000 // unix seconds: 1543392060, 2018-11-28T08:01:00Z

describe('DiscordExport', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
      configurable: true,
    })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders nothing when timestamp is null', () => {
    const { container } = render(<DiscordExport timestamp={null} timezone="UTC" />)
    expect(container.firstChild).toBeNull()
  })

  it('renders all 7 format rows', () => {
    render(<DiscordExport timestamp={TIMESTAMP_MS} timezone="UTC" />)
    expect(screen.getAllByRole('button', { name: /copy/i })).toHaveLength(7)
  })

  it('renders each Discord code', () => {
    render(<DiscordExport timestamp={TIMESTAMP_MS} timezone="UTC" />)
    expect(screen.getByText('<t:1543392060:t>')).toBeDefined()
    expect(screen.getByText('<t:1543392060:R>')).toBeDefined()
  })

  it('renders a preview for the short time format', () => {
    render(<DiscordExport timestamp={TIMESTAMP_MS} timezone="UTC" />)
    // 2018-11-28T08:01:00Z in UTC → 8:01 AM
    expect(screen.getByTestId('preview-t').textContent).toContain('8:01')
  })

  it('renders a preview for the long date format', () => {
    render(<DiscordExport timestamp={TIMESTAMP_MS} timezone="UTC" />)
    expect(screen.getByTestId('preview-D').textContent).toContain('November')
    expect(screen.getByTestId('preview-D').textContent).toContain('2018')
  })

  it('renders a preview for the long date/time format with weekday', () => {
    render(<DiscordExport timestamp={TIMESTAMP_MS} timezone="UTC" />)
    expect(screen.getByTestId('preview-F').textContent).toContain('Wednesday')
  })

  it('calls clipboard.writeText with the correct code on click', async () => {
    render(<DiscordExport timestamp={TIMESTAMP_MS} timezone="UTC" />)
    await act(async () => {
      fireEvent.click(screen.getAllByRole('button', { name: /copy/i })[0])
    })
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('<t:1543392060:t>')
  })

  it('shows "Copied!" confirmation after clicking', async () => {
    render(<DiscordExport timestamp={TIMESTAMP_MS} timezone="UTC" />)
    await act(async () => {
      fireEvent.click(screen.getAllByRole('button', { name: /copy/i })[0])
    })
    expect(screen.getByText('Copied!')).toBeDefined()
  })

  it('clears "Copied!" after 2 seconds', async () => {
    render(<DiscordExport timestamp={TIMESTAMP_MS} timezone="UTC" />)
    await act(async () => {
      fireEvent.click(screen.getAllByRole('button', { name: /copy/i })[0])
    })
    expect(screen.getByText('Copied!')).toBeDefined()
    act(() => { vi.advanceTimersByTime(2000) })
    expect(screen.queryByText('Copied!')).toBeNull()
  })
})
