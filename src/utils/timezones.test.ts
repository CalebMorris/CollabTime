import { describe, it, expect } from 'vitest'
import { getAllTimezones, filterTimezones } from './timezones'

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
