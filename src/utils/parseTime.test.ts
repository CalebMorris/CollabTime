import { describe, it, expect } from 'vitest'
import { parseTime } from './parseTime'

// TZ=UTC is set globally in vite.config.ts test env

describe('parseTime — Unix timestamps', () => {
  it('parses Unix seconds', () => {
    const result = parseTime('1543392060')
    expect(result).toEqual({ ok: true, timestamp: 1543392060 * 1000 })
  })

  it('parses Unix milliseconds (> 1e11)', () => {
    const result = parseTime('1543392060000')
    expect(result).toEqual({ ok: true, timestamp: 1543392060000 })
  })

  it('parses negative Unix timestamp', () => {
    const result = parseTime('-3600')
    expect(result).toEqual({ ok: true, timestamp: -3600 * 1000 })
  })
})

describe('parseTime — ISO 8601', () => {
  it('parses a UTC ISO string', () => {
    const result = parseTime('2018-11-28T11:01:00Z')
    expect(result).toEqual({ ok: true, timestamp: 1543402860000 })
  })

  it('parses an ISO string with offset', () => {
    const result = parseTime('2018-11-28T06:01:00-05:00')
    expect(result).toEqual({ ok: true, timestamp: 1543402860000 })
  })

  it('parses a date-only ISO string', () => {
    const result = parseTime('2018-11-28')
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(new Date(result.timestamp).toISOString()).toMatch(/^2018-11-28/)
    }
  })
})

describe('parseTime — natural language', () => {
  it('parses a natural language date with a reference', () => {
    const ref = new Date('2024-06-01T12:00:00Z')
    const result = parseTime('June 15 2024 at 3pm', ref)
    expect(result.ok).toBe(true)
    if (result.ok) {
      const d = new Date(result.timestamp)
      expect(d.getUTCFullYear()).toBe(2024)
      expect(d.getUTCMonth()).toBe(5) // June
      expect(d.getUTCDate()).toBe(15)
    }
  })
})

describe('parseTime — failure cases', () => {
  it('returns error for empty input', () => {
    expect(parseTime('')).toEqual({ ok: false, error: 'Input is empty' })
  })

  it('returns error for whitespace-only input', () => {
    expect(parseTime('   ')).toEqual({ ok: false, error: 'Input is empty' })
  })

  it('returns error for unparseable string', () => {
    const result = parseTime('not a date at all xyz')
    expect(result.ok).toBe(false)
  })
})
