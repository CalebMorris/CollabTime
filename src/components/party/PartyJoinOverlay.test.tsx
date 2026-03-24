import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { PartyJoinOverlay } from './PartyJoinOverlay'

describe('PartyJoinOverlay — default state', () => {
  it('has role="dialog" and aria-modal="true"', () => {
    render(<PartyJoinOverlay initialCode={null} onJoin={vi.fn()} onDismiss={vi.fn()} />)
    const dialog = screen.getByRole('dialog')
    expect(dialog.getAttribute('aria-modal')).toBe('true')
  })

  it('renders a code input field', () => {
    render(<PartyJoinOverlay initialCode={null} onJoin={vi.fn()} onDismiss={vi.fn()} />)
    expect(screen.getByRole('textbox')).toBeDefined()
  })

  it('[Join Party] button is disabled when input is empty', () => {
    render(<PartyJoinOverlay initialCode={null} onJoin={vi.fn()} onDismiss={vi.fn()} />)
    const joinBtn = screen.getByRole('button', { name: /join party/i })
    expect((joinBtn as HTMLButtonElement).disabled).toBe(true)
  })

  it('[Join Party] button is disabled for an invalid code format', () => {
    render(<PartyJoinOverlay initialCode={null} onJoin={vi.fn()} onDismiss={vi.fn()} />)
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'notacode' } })
    const joinBtn = screen.getByRole('button', { name: /join party/i })
    expect((joinBtn as HTMLButtonElement).disabled).toBe(true)
  })

  it('[Join Party] button enables when a valid word-word-word code is typed', () => {
    render(<PartyJoinOverlay initialCode={null} onJoin={vi.fn()} onDismiss={vi.fn()} />)
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'purple-falcon-bridge' } })
    const joinBtn = screen.getByRole('button', { name: /join party/i })
    expect((joinBtn as HTMLButtonElement).disabled).toBe(false)
  })

  it('calls onJoin with the entered code when [Join Party] is clicked', () => {
    const onJoin = vi.fn()
    render(<PartyJoinOverlay initialCode={null} onJoin={onJoin} onDismiss={vi.fn()} />)
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'purple-falcon-bridge' } })
    fireEvent.click(screen.getByRole('button', { name: /join party/i }))
    expect(onJoin).toHaveBeenCalledWith('purple-falcon-bridge')
  })

  it('calls onDismiss when the backdrop is clicked', () => {
    const onDismiss = vi.fn()
    render(<PartyJoinOverlay initialCode={null} onJoin={vi.fn()} onDismiss={onDismiss} />)
    fireEvent.click(screen.getByTestId('overlay-backdrop'))
    expect(onDismiss).toHaveBeenCalledOnce()
  })

  it('renders a privacy notice', () => {
    render(<PartyJoinOverlay initialCode={null} onJoin={vi.fn()} onDismiss={vi.fn()} />)
    expect(screen.getByText(/privacy/i)).toBeDefined()
  })
})

describe('PartyJoinOverlay — pre-filled code', () => {
  it('pre-fills the input with initialCode', () => {
    render(
      <PartyJoinOverlay
        initialCode="purple-falcon-bridge"
        onJoin={vi.fn()}
        onDismiss={vi.fn()}
      />,
    )
    const input = screen.getByRole('textbox') as HTMLInputElement
    expect(input.value).toBe('purple-falcon-bridge')
  })

  it('input is read-only when initialCode is provided', () => {
    render(
      <PartyJoinOverlay
        initialCode="purple-falcon-bridge"
        onJoin={vi.fn()}
        onDismiss={vi.fn()}
      />,
    )
    const input = screen.getByRole('textbox') as HTMLInputElement
    expect(input.readOnly).toBe(true)
  })

  it('[Join Party] is enabled immediately when initialCode is a valid code', () => {
    render(
      <PartyJoinOverlay
        initialCode="purple-falcon-bridge"
        onJoin={vi.fn()}
        onDismiss={vi.fn()}
      />,
    )
    const joinBtn = screen.getByRole('button', { name: /join party/i })
    expect((joinBtn as HTMLButtonElement).disabled).toBe(false)
  })

  it('calls onJoin with the pre-filled code', () => {
    const onJoin = vi.fn()
    render(
      <PartyJoinOverlay
        initialCode="purple-falcon-bridge"
        onJoin={onJoin}
        onDismiss={vi.fn()}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: /join party/i }))
    expect(onJoin).toHaveBeenCalledWith('purple-falcon-bridge')
  })
})
