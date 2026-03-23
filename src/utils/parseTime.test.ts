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

describe('parseTime — timezone abbreviation handling', () => {
  // US DST in 2026 starts March 8, ends November 1
  // On 2026-03-22, Eastern US is EDT (UTC-4), not EST (UTC-5)
  const refDuringDST = new Date('2026-03-22T12:00:00Z')
  // On 2026-01-15, Eastern US is EST (UTC-5) — no DST active
  const refDuringStdTime = new Date('2026-01-15T12:00:00Z')

  it('treats "EST" during DST as Eastern US time (UTC-4), not literal UTC-5', () => {
    // Regression: "Today at 8PM EST" on 2026-03-22 returned 6PM Phoenix (UTC-5 behavior)
    // Correct: "EST" colloquially means Eastern US time = EDT (UTC-4) in March
    // 8PM EDT = 2026-03-23T00:00:00Z
    const result = parseTime('Today at 8PM EST', refDuringDST)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(new Date(result.timestamp).toISOString()).toBe('2026-03-23T00:00:00.000Z')
    }
  })

  it('treats "EST" during standard time as UTC-5', () => {
    // In January, Eastern US IS on standard time, so EST = UTC-5 is correct
    // 8PM EST = 2026-01-16T01:00:00Z
    const result = parseTime('Today at 8PM EST', refDuringStdTime)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(new Date(result.timestamp).toISOString()).toBe('2026-01-16T01:00:00.000Z')
    }
  })

  it('treats "EDT" as UTC-4 regardless of DST context', () => {
    // EDT is always UTC-4 — explicit daylight abbreviation should be unambiguous
    const result = parseTime('Today at 8PM EDT', refDuringDST)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(new Date(result.timestamp).toISOString()).toBe('2026-03-23T00:00:00.000Z')
    }
  })

  it('treats "CST" during DST as Central US time (UTC-5)', () => {
    // Central US during DST is CDT (UTC-5); "CST" colloquially = Central time
    // 8PM CDT = 2026-03-23T01:00:00Z
    const result = parseTime('Today at 8PM CST', refDuringDST)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(new Date(result.timestamp).toISOString()).toBe('2026-03-23T01:00:00.000Z')
    }
  })

  it('treats "PST" during DST as Pacific US time (UTC-7)', () => {
    // Pacific US during DST is PDT (UTC-7); "PST" colloquially = Pacific time
    // 8PM PDT = 2026-03-23T03:00:00Z
    const result = parseTime('Today at 8PM PST', refDuringDST)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(new Date(result.timestamp).toISOString()).toBe('2026-03-23T03:00:00.000Z')
    }
  })

  // Round-trip tests for a DST-observing city (America/New_York).
  // If a user types "8PM EST", displaying that timestamp back in Eastern time
  // should show 8PM — not 9PM (which is what UTC-5 fixation produced before the fix).
  const localHour = (timestampMs: number, ianaZone: string): number =>
    Number(
      new Intl.DateTimeFormat('en-US', { timeZone: ianaZone, hour: '2-digit', hour12: false }).format(
        new Date(timestampMs),
      ),
    ) % 24 // Intl can return 24 for midnight; normalise to 0

  it('"EST" during DST round-trips to 8PM in a DST-observing city (America/New_York)', () => {
    // Before the fix: chrono treated EST as UTC-5, so "8PM EST" → 1AM UTC → 9PM EDT in New York
    // After the fix: "8PM EST" → midnight UTC → 8PM EDT in New York ✓
    const result = parseTime('Today at 8PM EST', refDuringDST)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(localHour(result.timestamp, 'America/New_York')).toBe(20)
    }
  })

  it('"EST" during standard time round-trips to 8PM in a DST-observing city (America/New_York)', () => {
    // In January, Eastern US is on standard time; EST = UTC-5 is correct.
    // "8PM EST" → 1AM UTC → 8PM EST in New York ✓
    const result = parseTime('Today at 8PM EST', refDuringStdTime)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(localHour(result.timestamp, 'America/New_York')).toBe(20)
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
