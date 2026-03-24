import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { CoordinateSection } from './CoordinateSection'

describe('CoordinateSection', () => {
  it('renders a "Start a Party" button', () => {
    render(<CoordinateSection onStartParty={vi.fn()} onJoinParty={vi.fn()} />)
    expect(screen.getByRole('button', { name: /start a party/i })).toBeDefined()
  })

  it('renders a "Join a Party" button', () => {
    render(<CoordinateSection onStartParty={vi.fn()} onJoinParty={vi.fn()} />)
    expect(screen.getByRole('button', { name: /join a party/i })).toBeDefined()
  })

  it('calls onStartParty when "Start a Party" is clicked', () => {
    const onStartParty = vi.fn()
    render(<CoordinateSection onStartParty={onStartParty} onJoinParty={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: /start a party/i }))
    expect(onStartParty).toHaveBeenCalledOnce()
  })

  it('calls onJoinParty when "Join a Party" is clicked', () => {
    const onJoinParty = vi.fn()
    render(<CoordinateSection onStartParty={vi.fn()} onJoinParty={onJoinParty} />)
    fireEvent.click(screen.getByRole('button', { name: /join a party/i }))
    expect(onJoinParty).toHaveBeenCalledOnce()
  })

  it('both buttons have minimum 44px touch target height', () => {
    render(<CoordinateSection onStartParty={vi.fn()} onJoinParty={vi.fn()} />)
    const buttons = screen.getAllByRole('button')
    buttons.forEach((btn) => {
      expect(btn.className).toContain('min-h-[44px]')
    })
  })
})
