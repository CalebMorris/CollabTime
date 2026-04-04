import { render, screen, fireEvent, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { PartyJoinOverlay } from './PartyJoinOverlay'

const defaultProps = {
  initialCode: null as string | null,
  onJoin: vi.fn(),
  onDismiss: vi.fn(),
  accepting: true,
  loadingCapacity: false,
}

describe('PartyJoinOverlay — keyboard & validation', () => {
  it('calls onDismiss when Escape is pressed', () => {
    const onDismiss = vi.fn()
    render(<PartyJoinOverlay {...defaultProps} onDismiss={onDismiss} />)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onDismiss).toHaveBeenCalledOnce()
  })

  it('moves focus into the dialog on open', () => {
    render(<PartyJoinOverlay {...defaultProps} />)
    const dialog = screen.getByRole('dialog')
    expect(dialog.contains(document.activeElement)).toBe(true)
  })

  it('shows a validation error when input has invalid format', () => {
    render(<PartyJoinOverlay {...defaultProps} />)
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'notacode' } })
    expect(screen.getByRole('alert')).toBeDefined()
    expect(screen.getByText(/format/i)).toBeDefined()
  })

  it('hides the validation error when input becomes valid', () => {
    render(<PartyJoinOverlay {...defaultProps} />)
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'notacode' } })
    expect(screen.queryByRole('alert')).toBeDefined()
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'purple-falcon-bridge' } })
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('does not show a validation error when input is empty', () => {
    render(<PartyJoinOverlay {...defaultProps} />)
    expect(screen.queryByRole('alert')).toBeNull()
  })
})

describe('PartyJoinOverlay — default state', () => {
  it('has role="dialog" and aria-modal="true"', () => {
    render(<PartyJoinOverlay {...defaultProps} />)
    const dialog = screen.getByRole('dialog')
    expect(dialog.getAttribute('aria-modal')).toBe('true')
  })

  it('renders a code input field', () => {
    render(<PartyJoinOverlay {...defaultProps} />)
    expect(screen.getByRole('textbox')).toBeDefined()
  })

  it('[Join Party] button is disabled when input is empty', () => {
    render(<PartyJoinOverlay {...defaultProps} />)
    const joinBtn = screen.getByRole('button', { name: /join party/i })
    expect((joinBtn as HTMLButtonElement).disabled).toBe(true)
  })

  it('[Join Party] button is disabled for an invalid code format', () => {
    render(<PartyJoinOverlay {...defaultProps} />)
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'notacode' } })
    const joinBtn = screen.getByRole('button', { name: /join party/i })
    expect((joinBtn as HTMLButtonElement).disabled).toBe(true)
  })

  it('[Join Party] button enables when a valid word-word-word code is typed', () => {
    render(<PartyJoinOverlay {...defaultProps} />)
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'purple-falcon-bridge' } })
    const joinBtn = screen.getByRole('button', { name: /join party/i })
    expect((joinBtn as HTMLButtonElement).disabled).toBe(false)
  })

  it('calls onJoin with the entered code when [Join Party] is clicked', () => {
    const onJoin = vi.fn()
    render(<PartyJoinOverlay {...defaultProps} onJoin={onJoin} />)
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'purple-falcon-bridge' } })
    fireEvent.click(screen.getByRole('button', { name: /join party/i }))
    expect(onJoin).toHaveBeenCalledWith('purple-falcon-bridge')
  })

  it('calls onDismiss when the backdrop is clicked', () => {
    const onDismiss = vi.fn()
    render(<PartyJoinOverlay {...defaultProps} onDismiss={onDismiss} />)
    fireEvent.click(screen.getByTestId('overlay-backdrop'))
    expect(onDismiss).toHaveBeenCalledOnce()
  })

  it('renders a privacy notice', () => {
    render(<PartyJoinOverlay {...defaultProps} />)
    expect(screen.getByText(/privacy/i)).toBeDefined()
  })
})

describe('PartyJoinOverlay — pre-filled code', () => {
  it('pre-fills the input with initialCode', () => {
    render(<PartyJoinOverlay {...defaultProps} initialCode="purple-falcon-bridge" />)
    const input = screen.getByRole('textbox') as HTMLInputElement
    expect(input.value).toBe('purple-falcon-bridge')
  })

  it('input is read-only when initialCode is provided', () => {
    render(<PartyJoinOverlay {...defaultProps} initialCode="purple-falcon-bridge" />)
    const input = screen.getByRole('textbox') as HTMLInputElement
    expect(input.readOnly).toBe(true)
  })

  it('[Join Party] is enabled immediately when initialCode is a valid code', () => {
    render(<PartyJoinOverlay {...defaultProps} initialCode="purple-falcon-bridge" />)
    const joinBtn = screen.getByRole('button', { name: /join party/i })
    expect((joinBtn as HTMLButtonElement).disabled).toBe(false)
  })

  it('calls onJoin with the pre-filled code', () => {
    const onJoin = vi.fn()
    render(<PartyJoinOverlay {...defaultProps} initialCode="purple-falcon-bridge" onJoin={onJoin} />)
    fireEvent.click(screen.getByRole('button', { name: /join party/i }))
    expect(onJoin).toHaveBeenCalledWith('purple-falcon-bridge')
  })
})

describe('PartyJoinOverlay — capacity unavailable', () => {
  it('shows "Party rooms are temporarily unavailable." banner when not accepting', () => {
    render(<PartyJoinOverlay {...defaultProps} initialCode="purple-falcon-bridge" accepting={false} />)
    expect(screen.getByText(/party rooms are temporarily unavailable/i)).toBeDefined()
  })

  it('does not show the banner when accepting', () => {
    render(<PartyJoinOverlay {...defaultProps} initialCode="purple-falcon-bridge" accepting={true} />)
    expect(screen.queryByText(/party rooms are temporarily unavailable/i)).toBeNull()
  })

  it('[Join Party] button has aria-disabled when not accepting', () => {
    render(<PartyJoinOverlay {...defaultProps} initialCode="purple-falcon-bridge" accepting={false} />)
    const joinBtn = screen.getByRole('button', { name: /join party/i })
    expect(joinBtn.getAttribute('aria-disabled')).toBe('true')
  })

  it('does not call onJoin when not accepting and button is clicked', () => {
    const onJoin = vi.fn()
    render(
      <PartyJoinOverlay
        {...defaultProps}
        initialCode="purple-falcon-bridge"
        accepting={false}
        onJoin={onJoin}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: /join party/i }))
    expect(onJoin).not.toHaveBeenCalled()
  })

  it('[Join Party] button has aria-disabled while loading capacity', () => {
    render(<PartyJoinOverlay {...defaultProps} initialCode="purple-falcon-bridge" loadingCapacity={true} />)
    const joinBtn = screen.getByRole('button', { name: /join party/i })
    expect(joinBtn.getAttribute('aria-disabled')).toBe('true')
  })

  it('does not show the banner while loading capacity', () => {
    render(<PartyJoinOverlay {...defaultProps} initialCode="purple-falcon-bridge" loadingCapacity={true} />)
    expect(screen.queryByText(/party rooms are temporarily unavailable/i)).toBeNull()
  })

  describe('loading hint timing', () => {
    beforeEach(() => { vi.useFakeTimers() })
    afterEach(() => { vi.useRealTimers() })

    it('shows "One moment…" after 200ms when loading', async () => {
      render(<PartyJoinOverlay {...defaultProps} initialCode="purple-falcon-bridge" loadingCapacity={true} />)
      await act(() => vi.advanceTimersByTimeAsync(200))
      expect(screen.getByText(/one moment/i)).toBeDefined()
    })

    it('does not show "One moment…" before 200ms', () => {
      render(<PartyJoinOverlay {...defaultProps} initialCode="purple-falcon-bridge" loadingCapacity={true} />)
      vi.advanceTimersByTime(199)
      expect(screen.queryByText(/one moment/i)).toBeNull()
    })
  })
})
