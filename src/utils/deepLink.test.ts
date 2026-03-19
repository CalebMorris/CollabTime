import { describe, it, expect } from 'vitest'
import { encodeDeepLink, decodeDeepLink } from './deepLink'

describe('encodeDeepLink', () => {
  it('encodes UTC ms as unix seconds in the query string', () => {
    expect(encodeDeepLink(1543392060000)).toBe('?t=1543392060')
  })

  it('floors fractional seconds', () => {
    expect(encodeDeepLink(1543392060999)).toBe('?t=1543392060')
  })
})

describe('decodeDeepLink', () => {
  it('returns ms for a valid ?t= param', () => {
    expect(decodeDeepLink('?t=1543392060')).toBe(1543392060000)
  })

  it('returns null when ?t= is absent', () => {
    expect(decodeDeepLink('')).toBeNull()
    expect(decodeDeepLink('?foo=bar')).toBeNull()
  })

  it('returns null for a non-numeric value', () => {
    expect(decodeDeepLink('?t=abc')).toBeNull()
  })

  it('round-trips encode → decode', () => {
    const ms = 1543402860000
    expect(decodeDeepLink(encodeDeepLink(ms))).toBe(ms)
  })
})
