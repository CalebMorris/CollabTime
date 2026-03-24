import { describe, it, expect } from 'vitest'
import {
  encodePartyRoomUrl,
  encodePartyLockedUrl,
  decodePartyCode,
  decodeLockedInParams,
  detectInitialMode,
  generateRoomCode,
} from './partyLink'

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

describe('encodePartyRoomUrl', () => {
  it('encodes a room code as a ?code= query string', () => {
    expect(encodePartyRoomUrl('purple-falcon-bridge')).toBe('?code=purple-falcon-bridge')
  })
})

describe('encodePartyLockedUrl', () => {
  it('encodes room code and epochMs as query params', () => {
    expect(encodePartyLockedUrl('purple-falcon-bridge', 1711209600000)).toBe(
      '?locked-in=purple-falcon-bridge&time=1711209600000'
    )
  })
})

describe('decodePartyCode', () => {
  it('returns the room code from a ?code= param', () => {
    expect(decodePartyCode('?code=purple-falcon-bridge')).toBe('purple-falcon-bridge')
  })

  it('returns null when ?code= is absent', () => {
    expect(decodePartyCode('')).toBeNull()
    expect(decodePartyCode('?t=12345')).toBeNull()
  })

  it('returns null for an empty code value', () => {
    expect(decodePartyCode('?code=')).toBeNull()
  })

  it('round-trips encodePartyRoomUrl → decodePartyCode', () => {
    const code = 'purple-falcon-bridge'
    expect(decodePartyCode(encodePartyRoomUrl(code))).toBe(code)
  })
})

describe('decodeLockedInParams', () => {
  it('returns roomCode and epochMs from a ?locked-in= URL', () => {
    const result = decodeLockedInParams('?locked-in=purple-falcon-bridge&time=1711209600000')
    expect(result).toEqual({ roomCode: 'purple-falcon-bridge', epochMs: 1711209600000 })
  })

  it('returns null when ?locked-in= is absent', () => {
    expect(decodeLockedInParams('')).toBeNull()
    expect(decodeLockedInParams('?code=purple-falcon-bridge')).toBeNull()
  })

  it('returns null when ?time= is absent', () => {
    expect(decodeLockedInParams('?locked-in=purple-falcon-bridge')).toBeNull()
  })

  it('returns null when ?time= is not a valid number', () => {
    expect(decodeLockedInParams('?locked-in=purple-falcon-bridge&time=abc')).toBeNull()
  })

  it('round-trips encodePartyLockedUrl → decodeLockedInParams', () => {
    const code = 'purple-falcon-bridge'
    const epochMs = 1711209600000
    expect(decodeLockedInParams(encodePartyLockedUrl(code, epochMs))).toEqual({ roomCode: code, epochMs })
  })
})

describe('detectInitialMode', () => {
  it('returns solo for an empty search string', () => {
    expect(detectInitialMode('')).toEqual({ kind: 'solo' })
  })

  it('returns solo for an unrelated query param', () => {
    expect(detectInitialMode('?t=12345')).toEqual({ kind: 'solo' })
  })

  it('returns party-join-overlay for a ?code= param', () => {
    expect(detectInitialMode('?code=purple-falcon-bridge')).toEqual({
      kind: 'party-join-overlay',
      code: 'purple-falcon-bridge',
    })
  })

  it('returns party-locked for a ?locked-in= + ?time= param', () => {
    expect(detectInitialMode('?locked-in=purple-falcon-bridge&time=1711209600000')).toEqual({
      kind: 'party-locked',
      roomCode: 'purple-falcon-bridge',
      confirmedMs: 1711209600000,
    })
  })

  it('prefers ?locked-in= over ?code= if both present', () => {
    const result = detectInitialMode('?code=some-code&locked-in=purple-falcon-bridge&time=1711209600000')
    expect(result).toEqual({
      kind: 'party-locked',
      roomCode: 'purple-falcon-bridge',
      confirmedMs: 1711209600000,
    })
  })
})
