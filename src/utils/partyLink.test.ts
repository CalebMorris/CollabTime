import { describe, it, expect } from 'vitest'
import { generateRoomCode } from './partyLink'

describe('generateRoomCode', () => {
  it('returns a string matching the three-word hyphen pattern', () => {
    const code = generateRoomCode()
    expect(code).toMatch(/^[a-z]+-[a-z]+-[a-z]+$/)
  })

  it('returns a different code on each call (probabilistic)', () => {
    const codes = new Set(Array.from({ length: 10 }, generateRoomCode))
    expect(codes.size).toBeGreaterThan(1)
  })
})
