import { describe, it, expect } from 'vitest'
import { getAllFormats } from './discordTimestamp'

// TZ=UTC set globally — Intl output is deterministic
const UNIX = 1543392060     // 2018-11-28T08:01:00Z
const UNIX_MS = UNIX * 1000
// Reference "now" 1 year after the timestamp so relative preview is deterministic
const NOW_MS = UNIX_MS + 365 * 24 * 60 * 60 * 1000

describe('getAllFormats', () => {
  it('returns exactly 7 formats', () => {
    expect(getAllFormats(UNIX, 'UTC', NOW_MS)).toHaveLength(7)
  })

  it('each format has flag, code, label, and preview', () => {
    for (const fmt of getAllFormats(UNIX, 'UTC', NOW_MS)) {
      expect(fmt.flag).toBeTruthy()
      expect(fmt.code).toBeTruthy()
      expect(fmt.label).toBeTruthy()
      expect(fmt.preview).toBeTruthy()
    }
  })

  it('produces correct code for each flag', () => {
    const formats = getAllFormats(UNIX, 'UTC', NOW_MS)
    for (const flag of ['t', 'T', 'd', 'D', 'f', 'F', 'R']) {
      expect(formats.find(f => f.flag === flag)!.code).toBe(`<t:${UNIX}:${flag}>`)
    }
  })

  it('preview for short time (t) contains the hour and minute', () => {
    const fmt = getAllFormats(UNIX, 'UTC', NOW_MS).find(f => f.flag === 't')!
    expect(fmt.preview).toContain('8:01')
  })

  it('preview for long time (T) contains seconds', () => {
    const fmt = getAllFormats(UNIX, 'UTC', NOW_MS).find(f => f.flag === 'T')!
    expect(fmt.preview).toMatch(/8:01:\d{2}/)
  })

  it('preview for short date (d) contains the date parts', () => {
    const fmt = getAllFormats(UNIX, 'UTC', NOW_MS).find(f => f.flag === 'd')!
    expect(fmt.preview).toContain('11')
    expect(fmt.preview).toContain('28')
    expect(fmt.preview).toContain('2018')
  })

  it('preview for long date (D) contains month name and year', () => {
    const fmt = getAllFormats(UNIX, 'UTC', NOW_MS).find(f => f.flag === 'D')!
    expect(fmt.preview).toContain('November')
    expect(fmt.preview).toContain('2018')
  })

  it('preview for short date/time (f) contains both date and time', () => {
    const fmt = getAllFormats(UNIX, 'UTC', NOW_MS).find(f => f.flag === 'f')!
    expect(fmt.preview).toContain('November')
    expect(fmt.preview).toContain('8:01')
  })

  it('preview for long date/time (F) contains weekday', () => {
    const fmt = getAllFormats(UNIX, 'UTC', NOW_MS).find(f => f.flag === 'F')!
    expect(fmt.preview).toContain('Wednesday')
  })

  it('preview for relative (R) is a non-empty string', () => {
    const fmt = getAllFormats(UNIX, 'UTC', NOW_MS).find(f => f.flag === 'R')!
    expect(fmt.preview.length).toBeGreaterThan(0)
  })
})
