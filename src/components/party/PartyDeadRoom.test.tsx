import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { PartyDeadRoom } from './PartyDeadRoom'

describe('PartyDeadRoom', () => {
  it('shows "Room not found" message', () => {
    render(
      <PartyDeadRoom
        attemptedCode="amber-falcon-bridge"
        onTryDifferent={vi.fn()}
        onStartNew={vi.fn()}
        onBackToSolo={vi.fn()}
      />,
    )
    expect(screen.getByText(/room not found/i)).toBeDefined()
  })

  it('shows the attempted code', () => {
    render(
      <PartyDeadRoom
        attemptedCode="amber-falcon-bridge"
        onTryDifferent={vi.fn()}
        onStartNew={vi.fn()}
        onBackToSolo={vi.fn()}
      />,
    )
    expect(screen.getByText('amber-falcon-bridge')).toBeDefined()
  })

  it('renders a [Start a New Party] button', () => {
    render(
      <PartyDeadRoom
        attemptedCode="amber-falcon-bridge"
        onTryDifferent={vi.fn()}
        onStartNew={vi.fn()}
        onBackToSolo={vi.fn()}
      />,
    )
    expect(screen.getByRole('button', { name: /start a new party/i })).toBeDefined()
  })

  it('renders a [Go to Solo Mode] button', () => {
    render(
      <PartyDeadRoom
        attemptedCode="amber-falcon-bridge"
        onTryDifferent={vi.fn()}
        onStartNew={vi.fn()}
        onBackToSolo={vi.fn()}
      />,
    )
    expect(screen.getByRole('button', { name: /go to solo/i })).toBeDefined()
  })

  it('calls onStartNew when [Start a New Party] is clicked', () => {
    const onStartNew = vi.fn()
    render(
      <PartyDeadRoom
        attemptedCode="amber-falcon-bridge"
        onTryDifferent={onStartNew}
        onStartNew={onStartNew}
        onBackToSolo={vi.fn()}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: /start a new party/i }))
    expect(onStartNew).toHaveBeenCalledOnce()
  })

  it('calls onBackToSolo when [Go to Solo Mode] is clicked', () => {
    const onBackToSolo = vi.fn()
    render(
      <PartyDeadRoom
        attemptedCode="amber-falcon-bridge"
        onTryDifferent={vi.fn()}
        onStartNew={vi.fn()}
        onBackToSolo={onBackToSolo}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: /go to solo/i }))
    expect(onBackToSolo).toHaveBeenCalledOnce()
  })

  it('renders a [Try a Different Code] button', () => {
    render(
      <PartyDeadRoom
        attemptedCode="amber-falcon-bridge"
        onTryDifferent={vi.fn()}
        onStartNew={vi.fn()}
        onBackToSolo={vi.fn()}
      />,
    )
    expect(screen.getByRole('button', { name: /try a different code/i })).toBeDefined()
  })

  it('expands a code input when [Try a Different Code] is clicked', () => {
    render(
      <PartyDeadRoom
        attemptedCode="amber-falcon-bridge"
        onTryDifferent={vi.fn()}
        onStartNew={vi.fn()}
        onBackToSolo={vi.fn()}
      />,
    )
    expect(screen.queryByRole('textbox')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: /try a different code/i }))
    expect(screen.getByRole('textbox')).toBeDefined()
  })

  it('calls onTryDifferent with the entered code when submitted', () => {
    const onTryDifferent = vi.fn()
    render(
      <PartyDeadRoom
        attemptedCode="amber-falcon-bridge"
        onTryDifferent={onTryDifferent}
        onStartNew={vi.fn()}
        onBackToSolo={vi.fn()}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: /try a different code/i }))
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'bold-crane-valley' } })
    fireEvent.click(screen.getByRole('button', { name: /^join$/i }))
    expect(onTryDifferent).toHaveBeenCalledWith('bold-crane-valley')
  })
})
