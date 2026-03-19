import { describe, it, expect } from 'vitest'
import { formatInTimezone, formatUtc, formatCountdown } from './formatTime'

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

describe('formatCountdown', () => {
  const NOW = 1_000_000_000_000

  it('returns null when delta < 1s', () => {
    expect(formatCountdown(NOW + 500, NOW)).toBeNull()
    expect(formatCountdown(NOW - 500, NOW)).toBeNull()
    expect(formatCountdown(NOW, NOW)).toBeNull()
  })

  it('shows "0m Xs" for delta < 60s', () => {
    expect(formatCountdown(NOW + 52_000, NOW)).toBe('0m 52s')
    expect(formatCountdown(NOW - 52_000, NOW)).toBe('0m 52s')
  })

  it('shows "Xm Xs" zero-padded for delta < 1h (e.g. "45m 09s")', () => {
    expect(formatCountdown(NOW + 45 * 60_000 + 9_000, NOW)).toBe('45m 09s')
    expect(formatCountdown(NOW + 59 * 60_000 + 59_000, NOW)).toBe('59m 59s')
  })

  it('shows "Xh Xm" and suppresses seconds for delta between 1h and 24h', () => {
    expect(formatCountdown(NOW + 2 * 3_600_000 + 30 * 60_000, NOW)).toBe('2h 30m')
    expect(formatCountdown(NOW + 3_600_000 + 1_000, NOW)).toBe('1h 0m')
  })

  it('shows "Xd Xh Xm" for delta >= 24h', () => {
    expect(formatCountdown(NOW + 2 * 86_400_000 + 3 * 3_600_000 + 45 * 60_000, NOW)).toBe('2d 3h 45m')
    expect(formatCountdown(NOW + 86_400_000 + 1_000, NOW)).toBe('1d 0h 0m')
  })

  it('handles exact unit boundaries correctly', () => {
    // exactly 1 hour
    expect(formatCountdown(NOW + 3_600_000, NOW)).toBe('1h 0m')
    // exactly 24 hours
    expect(formatCountdown(NOW + 86_400_000, NOW)).toBe('1d 0h 0m')
    // exactly 60 seconds
    expect(formatCountdown(NOW + 60_000, NOW)).toBe('1m 00s')
  })
})
