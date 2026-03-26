import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { ReconnectingBanner } from './ReconnectingBanner'

describe('ReconnectingBanner', () => {
  it('renders nothing when secondsRemaining is null', () => {
    const { container } = render(<ReconnectingBanner secondsRemaining={null} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders when secondsRemaining is a number', () => {
    render(<ReconnectingBanner secondsRemaining={24} />)
    expect(screen.getByRole('alert')).toBeDefined()
  })

  it('shows the seconds remaining in the message', () => {
    render(<ReconnectingBanner secondsRemaining={24} />)
    expect(screen.getByText(/24s/)).toBeDefined()
  })

  it('shows "Reconnecting" in the message', () => {
    render(<ReconnectingBanner secondsRemaining={24} />)
    expect(screen.getByText(/reconnecting/i)).toBeDefined()
  })

  it('shows "Your slot is held" reassurance', () => {
    render(<ReconnectingBanner secondsRemaining={24} />)
    expect(screen.getByText(/slot is held/i)).toBeDefined()
  })

  it('shows 0s when secondsRemaining is 0', () => {
    render(<ReconnectingBanner secondsRemaining={0} />)
    expect(screen.getByText(/0s/)).toBeDefined()
  })
})
