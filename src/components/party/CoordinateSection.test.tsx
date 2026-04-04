import { render, screen, fireEvent, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { CoordinateSection } from './CoordinateSection'

const defaultProps = {
  onStartParty: vi.fn(),
  onJoinParty: vi.fn(),
  accepting: true,
  loadingCapacity: false,
}

describe('CoordinateSection', () => {
  it('renders a "Start a Party" button', () => {
    render(<CoordinateSection {...defaultProps} />)
    expect(screen.getByRole('button', { name: /start a party/i })).toBeDefined()
  })

  it('renders a "Join a Party" button', () => {
    render(<CoordinateSection {...defaultProps} />)
    expect(screen.getByRole('button', { name: /join a party/i })).toBeDefined()
  })

  it('calls onStartParty when "Start a Party" is clicked', () => {
    const onStartParty = vi.fn()
    render(<CoordinateSection {...defaultProps} onStartParty={onStartParty} />)
    fireEvent.click(screen.getByRole('button', { name: /start a party/i }))
    expect(onStartParty).toHaveBeenCalledOnce()
  })

  it('calls onJoinParty when "Join a Party" is clicked', () => {
    const onJoinParty = vi.fn()
    render(<CoordinateSection {...defaultProps} onJoinParty={onJoinParty} />)
    fireEvent.click(screen.getByRole('button', { name: /join a party/i }))
    expect(onJoinParty).toHaveBeenCalledOnce()
  })

  it('both buttons have minimum 44px touch target height', () => {
    render(<CoordinateSection {...defaultProps} />)
    const buttons = screen.getAllByRole('button')
    buttons.forEach((btn) => {
      expect(btn.className).toContain('min-h-[44px]')
    })
  })

  describe('capacity unavailable', () => {
    it('shows "Party rooms are temporarily unavailable." banner when not accepting', () => {
      render(<CoordinateSection {...defaultProps} accepting={false} />)
      expect(screen.getByText(/party rooms are temporarily unavailable/i)).toBeDefined()
    })

    it('does not show the banner when accepting', () => {
      render(<CoordinateSection {...defaultProps} accepting={true} />)
      expect(screen.queryByText(/party rooms are temporarily unavailable/i)).toBeNull()
    })

    it('disables both buttons when not accepting', () => {
      render(<CoordinateSection {...defaultProps} accepting={false} />)
      const buttons = screen.getAllByRole('button')
      buttons.forEach((btn) => {
        expect(btn.getAttribute('aria-disabled')).toBe('true')
      })
    })

    it('does not fire onStartParty when not accepting and button is clicked', () => {
      const onStartParty = vi.fn()
      render(<CoordinateSection {...defaultProps} accepting={false} onStartParty={onStartParty} />)
      fireEvent.click(screen.getByRole('button', { name: /start a party/i }))
      expect(onStartParty).not.toHaveBeenCalled()
    })

    it('does not fire onJoinParty when not accepting and button is clicked', () => {
      const onJoinParty = vi.fn()
      render(<CoordinateSection {...defaultProps} accepting={false} onJoinParty={onJoinParty} />)
      fireEvent.click(screen.getByRole('button', { name: /join a party/i }))
      expect(onJoinParty).not.toHaveBeenCalled()
    })
  })

  describe('loading state', () => {
    it('disables both buttons while loading', () => {
      render(<CoordinateSection {...defaultProps} loadingCapacity={true} />)
      const buttons = screen.getAllByRole('button')
      buttons.forEach((btn) => {
        expect(btn.getAttribute('aria-disabled')).toBe('true')
      })
    })

    it('does not show the unavailable banner while loading', () => {
      render(<CoordinateSection {...defaultProps} loadingCapacity={true} />)
      expect(screen.queryByText(/party rooms are temporarily unavailable/i)).toBeNull()
    })

    it('buttons do not have unavailable dark style when loading', () => {
      render(<CoordinateSection {...defaultProps} loadingCapacity={true} />)
      const startBtn = screen.getByRole('button', { name: /start a party/i })
      expect(startBtn.className).not.toContain('bg-indigo-900')
    })

    describe('loading hint timing', () => {
      beforeEach(() => { vi.useFakeTimers() })
      afterEach(() => { vi.useRealTimers() })

      it('does not show "One moment…" before 200ms', () => {
        render(<CoordinateSection {...defaultProps} loadingCapacity={true} />)
        vi.advanceTimersByTime(199)
        expect(screen.queryByText(/one moment/i)).toBeNull()
      })

      it('shows "One moment…" after 200ms when loading', async () => {
        render(<CoordinateSection {...defaultProps} loadingCapacity={true} />)
        await act(() => vi.advanceTimersByTimeAsync(200))
        expect(screen.getByText(/one moment/i)).toBeDefined()
      })

      it('does not show "One moment…" when not loading', async () => {
        render(<CoordinateSection {...defaultProps} loadingCapacity={false} />)
        await act(() => vi.advanceTimersByTimeAsync(200))
        expect(screen.queryByText(/one moment/i)).toBeNull()
      })
    })
  })
})
