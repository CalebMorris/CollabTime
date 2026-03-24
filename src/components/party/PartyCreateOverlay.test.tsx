import { render, screen, fireEvent, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { PartyCreateOverlay } from './PartyCreateOverlay'

const ROOM_CODE = 'amber-falcon-bridge'

beforeEach(() => {
  vi.useFakeTimers()
  Object.defineProperty(navigator, 'clipboard', {
    value: { writeText: vi.fn().mockResolvedValue(undefined) },
    configurable: true,
  })
  Object.defineProperty(window, 'location', {
    value: { origin: 'https://collabtime.app', pathname: '/' },
    configurable: true,
  })
})

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe('PartyCreateOverlay', () => {
  it('renders the room code in a prominent display', () => {
    render(
      <PartyCreateOverlay roomCode={ROOM_CODE} onEnterRoom={vi.fn()} onDismiss={vi.fn()} />,
    )
    expect(screen.getByText(ROOM_CODE)).toBeDefined()
  })

  it('has role="dialog" and aria-modal="true"', () => {
    render(
      <PartyCreateOverlay roomCode={ROOM_CODE} onEnterRoom={vi.fn()} onDismiss={vi.fn()} />,
    )
    const dialog = screen.getByRole('dialog')
    expect(dialog.getAttribute('aria-modal')).toBe('true')
  })

  it('renders a "Copy Code" button', () => {
    render(
      <PartyCreateOverlay roomCode={ROOM_CODE} onEnterRoom={vi.fn()} onDismiss={vi.fn()} />,
    )
    expect(screen.getByRole('button', { name: /copy code/i })).toBeDefined()
  })

  it('renders a "Copy Link" button', () => {
    render(
      <PartyCreateOverlay roomCode={ROOM_CODE} onEnterRoom={vi.fn()} onDismiss={vi.fn()} />,
    )
    expect(screen.getByRole('button', { name: /copy link/i })).toBeDefined()
  })

  it('copies the room code to clipboard when "Copy Code" is clicked', async () => {
    render(
      <PartyCreateOverlay roomCode={ROOM_CODE} onEnterRoom={vi.fn()} onDismiss={vi.fn()} />,
    )
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /copy code/i }))
    })
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(ROOM_CODE)
  })

  it('copies the full party URL when "Copy Link" is clicked', async () => {
    render(
      <PartyCreateOverlay roomCode={ROOM_CODE} onEnterRoom={vi.fn()} onDismiss={vi.fn()} />,
    )
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /copy link/i }))
    })
    const written = (navigator.clipboard.writeText as ReturnType<typeof vi.fn>).mock.calls[0][0] as string
    expect(written).toContain(`?code=${ROOM_CODE}`)
  })

  it('renders an "Enter the Room" button', () => {
    render(
      <PartyCreateOverlay roomCode={ROOM_CODE} onEnterRoom={vi.fn()} onDismiss={vi.fn()} />,
    )
    expect(screen.getByRole('button', { name: /enter the room/i })).toBeDefined()
  })

  it('calls onEnterRoom when "Enter the Room" is clicked', () => {
    const onEnterRoom = vi.fn()
    render(
      <PartyCreateOverlay roomCode={ROOM_CODE} onEnterRoom={onEnterRoom} onDismiss={vi.fn()} />,
    )
    fireEvent.click(screen.getByRole('button', { name: /enter the room/i }))
    expect(onEnterRoom).toHaveBeenCalledOnce()
  })

  it('calls onDismiss when the backdrop is clicked', () => {
    const onDismiss = vi.fn()
    render(
      <PartyCreateOverlay roomCode={ROOM_CODE} onEnterRoom={vi.fn()} onDismiss={onDismiss} />,
    )
    fireEvent.click(screen.getByTestId('overlay-backdrop'))
    expect(onDismiss).toHaveBeenCalledOnce()
  })

  it('renders a privacy notice', () => {
    render(
      <PartyCreateOverlay roomCode={ROOM_CODE} onEnterRoom={vi.fn()} onDismiss={vi.fn()} />,
    )
    expect(screen.getByText(/privacy/i)).toBeDefined()
  })

  it('calls onDismiss when Escape is pressed', () => {
    const onDismiss = vi.fn()
    render(
      <PartyCreateOverlay roomCode={ROOM_CODE} onEnterRoom={vi.fn()} onDismiss={onDismiss} />,
    )
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onDismiss).toHaveBeenCalledOnce()
  })

  it('moves focus into the dialog on open', () => {
    render(
      <PartyCreateOverlay roomCode={ROOM_CODE} onEnterRoom={vi.fn()} onDismiss={vi.fn()} />,
    )
    const dialog = screen.getByRole('dialog')
    expect(dialog.contains(document.activeElement)).toBe(true)
  })
})
