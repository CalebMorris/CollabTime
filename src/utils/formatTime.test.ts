import { describe, it, expect } from 'vitest'
import { formatInTimezone, formatUtc } from './formatTime'

// TZ=UTC is set globally — all Intl output is deterministic

const NOV_28_2018_UTC_MS = 1543402860000 // 2018-11-28T11:01:00Z

describe('formatInTimezone', () => {
  it('formats a timestamp in UTC', () => {
    const result = formatInTimezone(NOV_28_2018_UTC_MS, 'UTC')
    expect(result).toContain('2018')
    expect(result).toContain('11:01')
  })

  it('formats a timestamp in America/New_York (UTC-5 in November)', () => {
    const result = formatInTimezone(NOV_28_2018_UTC_MS, 'America/New_York')
    expect(result).toContain('6:01')
    expect(result).toContain('2018')
  })

  it('formats a timestamp in Asia/Tokyo (UTC+9)', () => {
    const result = formatInTimezone(NOV_28_2018_UTC_MS, 'Asia/Tokyo')
    expect(result).toContain('8:01') // 11:01 UTC + 9h = 20:01, but 12h → 8:01 PM
    expect(result).toContain('2018')
  })
})

describe('formatUtc', () => {
  it('is equivalent to formatInTimezone with UTC', () => {
    expect(formatUtc(NOV_28_2018_UTC_MS)).toBe(formatInTimezone(NOV_28_2018_UTC_MS, 'UTC'))
  })
})
