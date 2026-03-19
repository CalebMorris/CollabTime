import { render, screen, fireEvent, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ShareLink } from './ShareLink'

describe('ShareLink', () => {
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

  it('renders a placeholder URL when timestamp is null', () => {
    render(<ShareLink timestamp={null} />)
    expect(screen.getByText(/\?t=…/)).toBeDefined()
  })

  it('displays the share URL', () => {
    render(<ShareLink timestamp={1543392060000} />)
    expect(screen.getByText(/t=1543392060/)).toBeDefined()
  })

  it('renders a copy button', () => {
    render(<ShareLink timestamp={1543392060000} />)
    expect(screen.getByRole('button', { name: /copy link/i })).toBeDefined()
  })

  it('copies the full URL to clipboard on click', async () => {
    render(<ShareLink timestamp={1543392060000} />)
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /copy link/i }))
    })
    const written = (navigator.clipboard.writeText as ReturnType<typeof vi.fn>).mock.calls[0][0] as string
    expect(written).toContain('t=1543392060')
  })

  it('shows "Copied!" for 2 seconds then reverts', async () => {
    render(<ShareLink timestamp={1543392060000} />)
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /copy link/i }))
    })
    expect(screen.getByText('Copied!')).toBeDefined()
    act(() => { vi.advanceTimersByTime(2000) })
    expect(screen.queryByText('Copied!')).toBeNull()
  })
})
