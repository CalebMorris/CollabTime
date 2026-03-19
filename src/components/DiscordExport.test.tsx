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

  it('renders a toggle button', () => {
    render(<DiscordExport timestamp={TIMESTAMP_MS} timezone="UTC" />)
    expect(screen.getByRole('button', { name: /discord timestamps/i })).toBeDefined()
  })

  it('renders the Discord icon inside the toggle button', () => {
    render(<DiscordExport timestamp={TIMESTAMP_MS} timezone="UTC" />)
    const button = screen.getByRole('button', { name: /discord timestamps/i })
    expect(button.querySelector('svg')).not.toBeNull()
  })

  it('hides format rows by default', () => {
    render(<DiscordExport timestamp={TIMESTAMP_MS} timezone="UTC" />)
    expect(screen.queryAllByRole('button', { name: /copy/i })).toHaveLength(0)
  })

  it('shows format rows after clicking toggle', async () => {
    render(<DiscordExport timestamp={TIMESTAMP_MS} timezone="UTC" />)
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /discord timestamps/i }))
    })
    expect(screen.getAllByRole('button', { name: /copy/i })).toHaveLength(7)
  })

  it('collapses formats when toggle is clicked again', async () => {
    render(<DiscordExport timestamp={TIMESTAMP_MS} timezone="UTC" />)
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /discord timestamps/i }))
    })
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /discord timestamps/i }))
    })
    expect(screen.queryAllByRole('button', { name: /copy/i })).toHaveLength(0)
  })

  it('renders each Discord code when expanded', async () => {
    render(<DiscordExport timestamp={TIMESTAMP_MS} timezone="UTC" />)
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: /discord timestamps/i })) })
    expect(screen.getByText('<t:1543392060:t>')).toBeDefined()
    expect(screen.getByText('<t:1543392060:R>')).toBeDefined()
  })

  it('renders a preview for the short time format when expanded', async () => {
    render(<DiscordExport timestamp={TIMESTAMP_MS} timezone="UTC" />)
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: /discord timestamps/i })) })
    // 2018-11-28T08:01:00Z in UTC → 8:01 AM
    expect(screen.getByTestId('preview-t').textContent).toContain('8:01')
  })

  it('renders a preview for the long date format when expanded', async () => {
    render(<DiscordExport timestamp={TIMESTAMP_MS} timezone="UTC" />)
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: /discord timestamps/i })) })
    expect(screen.getByTestId('preview-D').textContent).toContain('November')
    expect(screen.getByTestId('preview-D').textContent).toContain('2018')
  })

  it('renders a preview for the long date/time format with weekday when expanded', async () => {
    render(<DiscordExport timestamp={TIMESTAMP_MS} timezone="UTC" />)
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: /discord timestamps/i })) })
    expect(screen.getByTestId('preview-F').textContent).toContain('Wednesday')
  })

  it('calls clipboard.writeText with the correct code on click', async () => {
    render(<DiscordExport timestamp={TIMESTAMP_MS} timezone="UTC" />)
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: /discord timestamps/i })) })
    await act(async () => {
      fireEvent.click(screen.getAllByRole('button', { name: /copy/i })[0])
    })
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('<t:1543392060:t>')
  })

  it('shows "Copied!" confirmation after clicking', async () => {
    render(<DiscordExport timestamp={TIMESTAMP_MS} timezone="UTC" />)
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: /discord timestamps/i })) })
    await act(async () => {
      fireEvent.click(screen.getAllByRole('button', { name: /copy/i })[0])
    })
    expect(screen.getByText('Copied!')).toBeDefined()
  })

  it('clears "Copied!" after 2 seconds', async () => {
    render(<DiscordExport timestamp={TIMESTAMP_MS} timezone="UTC" />)
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: /discord timestamps/i })) })
    await act(async () => {
      fireEvent.click(screen.getAllByRole('button', { name: /copy/i })[0])
    })
    expect(screen.getByText('Copied!')).toBeDefined()
    act(() => { vi.advanceTimersByTime(2000) })
    expect(screen.queryByText('Copied!')).toBeNull()
  })
})
