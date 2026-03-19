import { describe, it, expect } from 'vitest'
import { buildIcsContent, buildGoogleCalendarUrl } from './calendarExport'

// Nov 28 2018 11:01:00 UTC — 1543392060 unix seconds
const FIXED_MS = 1543392060000

describe('buildIcsContent', () => {
  it('wraps content in VCALENDAR and VEVENT blocks', () => {
    const ics = buildIcsContent(FIXED_MS)
    expect(ics).toContain('BEGIN:VCALENDAR')
    expect(ics).toContain('END:VCALENDAR')
    expect(ics).toContain('BEGIN:VEVENT')
    expect(ics).toContain('END:VEVENT')
  })

  it('DTSTART matches the input timestamp in UTC', () => {
    const ics = buildIcsContent(FIXED_MS)
    // Nov 28 2018 08:01:00 UTC → 20181128T080100Z
    expect(ics).toContain('DTSTART:20181128T080100Z')
  })

  it('DTEND is exactly 1 hour after DTSTART', () => {
    const ics = buildIcsContent(FIXED_MS)
    // 08:01:00 + 1h → 09:01:00
    expect(ics).toContain('DTEND:20181128T090100Z')
  })

  it('UID contains the unix seconds', () => {
    const ics = buildIcsContent(FIXED_MS)
    expect(ics).toContain('UID:1543392060@collabtime')
  })

  it('uses CRLF line endings throughout', () => {
    const ics = buildIcsContent(FIXED_MS)
    // Every line should end with \r\n
    const lines = ics.split('\r\n')
    // Last element will be empty string after final CRLF
    expect(lines.length).toBeGreaterThan(5)
    // Ensure there are no bare \n (i.e., no line ends with just \n without \r before it)
    expect(ics).not.toMatch(/(?<!\r)\n/)
  })

  it('includes the CollabTime Event summary', () => {
    const ics = buildIcsContent(FIXED_MS)
    expect(ics).toContain('SUMMARY:CollabTime Event')
  })
})

describe('buildGoogleCalendarUrl', () => {
  it('returns a Google Calendar render URL', () => {
    const url = buildGoogleCalendarUrl(FIXED_MS)
    expect(url).toContain('https://calendar.google.com/calendar/render')
  })

  it('includes action=TEMPLATE', () => {
    const url = buildGoogleCalendarUrl(FIXED_MS)
    expect(url).toContain('action=TEMPLATE')
  })

  it('sets text to CollabTime Event', () => {
    const url = buildGoogleCalendarUrl(FIXED_MS)
    expect(url).toContain('text=CollabTime+Event')
  })

  it('encodes dates with DTSTART in UTC', () => {
    const url = buildGoogleCalendarUrl(FIXED_MS)
    // dates param starts with the UTC datetime of FIXED_MS
    expect(url).toContain('20181128T080100Z')
  })

  it('sets DTEND to 1 hour after DTSTART', () => {
    const url = buildGoogleCalendarUrl(FIXED_MS)
    expect(url).toContain('20181128T090100Z')
  })

  it('separates start and end with a slash in the dates param', () => {
    const url = buildGoogleCalendarUrl(FIXED_MS)
    const params = new URL(url).searchParams
    const dates = params.get('dates') ?? ''
    expect(dates).toMatch(/^[0-9T]+Z\/[0-9T]+Z$/)
  })
})
