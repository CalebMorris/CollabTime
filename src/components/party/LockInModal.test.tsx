import { render, screen, fireEvent, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { LockInModal } from './LockInModal'

// 2024-03-23 16:00:00 UTC = 12:00 PM EDT
const EPOCH_MS = 1711209600000
const TIMEZONE = 'America/New_York'

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('LockInModal', () => {
  it('has role="alertdialog" and aria-modal="true"', () => {
    render(
      <LockInModal
        confirmedMs={EPOCH_MS}
        participantCount={2}
        timezone={TIMEZONE}
        onDismiss={vi.fn()}
      />,
    )
    const dialog = screen.getByRole('alertdialog')
    expect(dialog.getAttribute('aria-modal')).toBe('true')
  })

  it('shows the locked-in time in the viewer timezone', () => {
    render(
      <LockInModal
        confirmedMs={EPOCH_MS}
        participantCount={2}
        timezone={TIMEZONE}
        onDismiss={vi.fn()}
      />,
    )
    // 16:00 UTC = 12:00 PM EDT
    expect(screen.getByText(/12:00/)).toBeDefined()
  })

  it('shows participant count', () => {
    render(
      <LockInModal
        confirmedMs={EPOCH_MS}
        participantCount={3}
        timezone={TIMEZONE}
        onDismiss={vi.fn()}
      />,
    )
    expect(screen.getByText(/all 3 on board/i)).toBeDefined()
  })

  it('calls onDismiss when clicked', () => {
    const onDismiss = vi.fn()
    render(
      <LockInModal
        confirmedMs={EPOCH_MS}
        participantCount={2}
        timezone={TIMEZONE}
        onDismiss={onDismiss}
      />,
    )
    fireEvent.click(screen.getByRole('alertdialog'))
    expect(onDismiss).toHaveBeenCalledOnce()
  })

  it('auto-dismisses after 2500ms', () => {
    const onDismiss = vi.fn()
    render(
      <LockInModal
        confirmedMs={EPOCH_MS}
        participantCount={2}
        timezone={TIMEZONE}
        onDismiss={onDismiss}
      />,
    )
    expect(onDismiss).not.toHaveBeenCalled()
    act(() => { vi.advanceTimersByTime(2500) })
    expect(onDismiss).toHaveBeenCalledOnce()
  })

  it('does not call onDismiss before 2500ms', () => {
    const onDismiss = vi.fn()
    render(
      <LockInModal
        confirmedMs={EPOCH_MS}
        participantCount={2}
        timezone={TIMEZONE}
        onDismiss={onDismiss}
      />,
    )
    act(() => { vi.advanceTimersByTime(2499) })
    expect(onDismiss).not.toHaveBeenCalled()
  })

  it('clears the timer on unmount', () => {
    const onDismiss = vi.fn()
    const { unmount } = render(
      <LockInModal
        confirmedMs={EPOCH_MS}
        participantCount={2}
        timezone={TIMEZONE}
        onDismiss={onDismiss}
      />,
    )
    unmount()
    act(() => { vi.advanceTimersByTime(2500) })
    expect(onDismiss).not.toHaveBeenCalled()
  })

  it('shows a "Locked In" heading', () => {
    render(
      <LockInModal
        confirmedMs={EPOCH_MS}
        participantCount={2}
        timezone={TIMEZONE}
        onDismiss={vi.fn()}
      />,
    )
    expect(screen.getByText(/locked in/i)).toBeDefined()
  })
})
