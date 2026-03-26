import { describe, it, expect } from 'vitest'
import {
  ROOM_CODE_RE,
  encodeDeepLink,
  decodeDeepLink,
  encodePartyRoomUrl,
  decodePartyCode,
  encodePartyLockedUrl,
  decodeLockedInParams,
  detectInitialMode,
  isPartyModeEnabled,
} from './appUrl'

// ─── ROOM_CODE_RE ─────────────────────────────────────────────────────────────

describe('ROOM_CODE_RE', () => {
  it('matches valid three-word hyphenated codes', () => {
    expect(ROOM_CODE_RE.test('purple-falcon-bridge')).toBe(true)
    expect(ROOM_CODE_RE.test('amber-bear-bank')).toBe(true)
  })

  it('rejects codes with wrong segment count', () => {
    expect(ROOM_CODE_RE.test('one-two')).toBe(false)
    expect(ROOM_CODE_RE.test('one-two-three-four')).toBe(false)
  })

  it('rejects codes with uppercase letters', () => {
    expect(ROOM_CODE_RE.test('Purple-falcon-bridge')).toBe(false)
  })

  it('rejects codes with numbers or special characters', () => {
    expect(ROOM_CODE_RE.test('purpl3-falcon-bridge')).toBe(false)
    expect(ROOM_CODE_RE.test('purple_falcon_bridge')).toBe(false)
  })

  it('rejects empty string', () => {
    expect(ROOM_CODE_RE.test('')).toBe(false)
  })
})

// ─── Solo deep-link (?time=<unix-seconds>) ───────────────────────────────────

describe('encodeDeepLink', () => {
  it('encodes UTC ms as unix seconds in the ?time= query string', () => {
    expect(encodeDeepLink(1543392060000)).toBe('?time=1543392060')
  })

  it('truncates sub-second precision', () => {
    expect(encodeDeepLink(1543392060999)).toBe('?time=1543392060')
  })
})

describe('decodeDeepLink', () => {
  it('returns ms for a valid ?time= param', () => {
    expect(decodeDeepLink('?time=1543392060')).toBe(1543392060000)
  })

  it('returns null when ?time= is absent', () => {
    expect(decodeDeepLink('')).toBeNull()
    expect(decodeDeepLink('?foo=bar')).toBeNull()
  })

  it('returns null for a non-numeric value', () => {
    expect(decodeDeepLink('?time=abc')).toBeNull()
  })

  it('round-trips encode → decode', () => {
    const ms = 1543402860000
    expect(decodeDeepLink(encodeDeepLink(ms))).toBe(ms)
  })
})

// ─── Party room URL (?code=<room-code>) ──────────────────────────────────────

describe('encodePartyRoomUrl', () => {
  it('encodes a room code as a ?code= query string', () => {
    expect(encodePartyRoomUrl('purple-falcon-bridge')).toBe('?code=purple-falcon-bridge')
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

  it('returns null for a code that does not match ROOM_CODE_RE', () => {
    expect(decodePartyCode('?code=<script>alert(1)</script>')).toBeNull()
    expect(decodePartyCode('?code=just-two')).toBeNull()
    expect(decodePartyCode('?code=UPPER-case-code')).toBeNull()
  })

  it('round-trips encodePartyRoomUrl → decodePartyCode', () => {
    const code = 'purple-falcon-bridge'
    expect(decodePartyCode(encodePartyRoomUrl(code))).toBe(code)
  })
})

// ─── Party locked-in URL (?locked-in=<code>&time=<epoch-ms>) ─────────────────

describe('encodePartyLockedUrl', () => {
  it('encodes room code and epochMs as query params', () => {
    expect(encodePartyLockedUrl('purple-falcon-bridge', 1711209600000)).toBe(
      '?locked-in=purple-falcon-bridge&time=1711209600000'
    )
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

  it('returns null for a roomCode that does not match ROOM_CODE_RE', () => {
    expect(decodeLockedInParams('?locked-in=INVALID&time=1711209600000')).toBeNull()
    expect(decodeLockedInParams('?locked-in=just-two&time=1711209600000')).toBeNull()
  })

  it('round-trips encodePartyLockedUrl → decodeLockedInParams', () => {
    const code = 'purple-falcon-bridge'
    const epochMs = 1711209600000
    expect(decodeLockedInParams(encodePartyLockedUrl(code, epochMs))).toEqual({ roomCode: code, epochMs })
  })
})

// ─── detectInitialMode ────────────────────────────────────────────────────────

describe('isPartyModeEnabled', () => {
  it('returns true when enablePartyMode param is present', () => {
    expect(isPartyModeEnabled('?enablePartyMode')).toBe(true)
  })

  it('returns true when enablePartyMode has a value', () => {
    expect(isPartyModeEnabled('?enablePartyMode=true')).toBe(true)
  })

  it('returns false when enablePartyMode param is absent', () => {
    expect(isPartyModeEnabled('')).toBe(false)
    expect(isPartyModeEnabled('?time=12345')).toBe(false)
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

  it('returns solo for a ?code= param that fails ROOM_CODE_RE', () => {
    expect(detectInitialMode('?code=INVALID')).toEqual({ kind: 'solo' })
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
