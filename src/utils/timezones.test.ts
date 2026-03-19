import { describe, it, expect } from 'vitest'
import { getAllTimezones, filterTimezones, getSortedTimezones } from './timezones'

describe('getAllTimezones', () => {
  it('returns a non-empty list of IANA timezone names', () => {
    const zones = getAllTimezones()
    expect(zones.length).toBeGreaterThan(0)
    expect(zones).toContain('America/New_York')
    expect(zones).toContain('Europe/London')
  })
})

describe('filterTimezones', () => {
  it('returns all timezones when query is empty', () => {
    const all = getAllTimezones()
    expect(filterTimezones('')).toHaveLength(all.length)
  })

  it('filters case-insensitively', () => {
    expect(filterTimezones('new_york')).toContain('America/New_York')
  })

  it('matches on partial timezone segment', () => {
    expect(filterTimezones('london')).toContain('Europe/London')
  })

  it('returns empty array for no matches', () => {
    expect(filterTimezones('zzznomatch')).toHaveLength(0)
  })
})

describe('getSortedTimezones', () => {
  it('returns an entry for every IANA timezone', () => {
    expect(getSortedTimezones()).toHaveLength(getAllTimezones().length)
  })

  it('each entry has tz, label, and offsetMinutes', () => {
    for (const entry of getSortedTimezones()) {
      expect(typeof entry.tz).toBe('string')
      expect(typeof entry.label).toBe('string')
      expect(typeof entry.offsetMinutes).toBe('number')
    }
  })

  it('label format is "(UTC±H:MM) Region/City"', () => {
    for (const { label } of getSortedTimezones()) {
      expect(label).toMatch(/^\(UTC[+-]\d+:\d{2}\) .+/)
    }
  })

  it('is sorted from most negative to most positive UTC offset', () => {
    const sorted = getSortedTimezones()
    for (let i = 1; i < sorted.length; i++) {
      expect(sorted[i]!.offsetMinutes).toBeGreaterThanOrEqual(sorted[i - 1]!.offsetMinutes)
    }
  })

  it('America/New_York has a negative offset', () => {
    const entry = getSortedTimezones().find(e => e.tz === 'America/New_York')!
    expect(entry.offsetMinutes).toBeLessThan(0)
  })

  it('Asia/Tokyo has a positive offset', () => {
    const entry = getSortedTimezones().find(e => e.tz === 'Asia/Tokyo')!
    expect(entry.offsetMinutes).toBeGreaterThan(0)
  })

  it('filters work on both tz name and label', () => {
    const results = filterTimezones('new_york')
    expect(results).toContain('America/New_York')
  })
})
