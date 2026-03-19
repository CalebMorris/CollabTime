import { render, screen, fireEvent, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { CalendarExport } from './CalendarExport'

const FIXED_MS = 1543392060000

describe('CalendarExport', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.stubGlobal('URL', {
      createObjectURL: vi.fn(() => 'blob:fake-url'),
      revokeObjectURL: vi.fn(),
    })
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('renders nothing when timestamp is null', () => {
    const { container } = render(<CalendarExport timestamp={null} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders a download button when timestamp is set', () => {
    render(<CalendarExport timestamp={FIXED_MS} />)
    expect(screen.getByRole('button', { name: /download .ics/i })).toBeDefined()
  })

  it('calls URL.createObjectURL on click', async () => {
    render(<CalendarExport timestamp={FIXED_MS} />)
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /download .ics/i }))
    })
    expect(URL.createObjectURL).toHaveBeenCalledOnce()
  })

  it('shows "Downloaded!" after click', async () => {
    render(<CalendarExport timestamp={FIXED_MS} />)
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /download .ics/i }))
    })
    expect(screen.getByText('Downloaded!')).toBeDefined()
  })

  it('clears "Downloaded!" after 2 seconds', async () => {
    render(<CalendarExport timestamp={FIXED_MS} />)
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /download .ics/i }))
    })
    expect(screen.getByText('Downloaded!')).toBeDefined()
    act(() => { vi.advanceTimersByTime(2000) })
    expect(screen.queryByText('Downloaded!')).toBeNull()
  })

  it('renders a Google Calendar link when timestamp is set', () => {
    render(<CalendarExport timestamp={FIXED_MS} />)
    const link = screen.getByRole('link', { name: /google calendar/i })
    expect(link).toBeDefined()
  })

  it('Google Calendar link opens calendar.google.com in a new tab', () => {
    render(<CalendarExport timestamp={FIXED_MS} />)
    const link = screen.getByRole('link', { name: /google calendar/i }) as HTMLAnchorElement
    expect(link.href).toContain('calendar.google.com')
    expect(link.target).toBe('_blank')
  })

  it('Google Calendar link href encodes the correct timestamp', () => {
    render(<CalendarExport timestamp={FIXED_MS} />)
    const link = screen.getByRole('link', { name: /google calendar/i }) as HTMLAnchorElement
    expect(link.href).toContain('20181128T080100Z')
  })
})
