import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { RoomCodePill } from './RoomCodePill'

describe('RoomCodePill', () => {
  it('renders the room code', () => {
    render(<RoomCodePill roomCode="purple-falcon-bridge" />)
    expect(screen.getByText('purple-falcon-bridge')).toBeDefined()
  })

  it('renders with a monospace font class', () => {
    render(<RoomCodePill roomCode="purple-falcon-bridge" />)
    const el = screen.getByText('purple-falcon-bridge')
    expect(el.className).toContain('font-mono')
  })
})
