export interface TimezoneEntry {
  tz: string
  label: string
  offsetMinutes: number
}

export function getAllTimezones(): string[] {
  return Intl.supportedValuesOf('timeZone')
}

/** Returns the UTC offset in minutes for a timezone at a fixed reference point. */
function getOffsetMinutes(tz: string): number {
  // Format a known UTC timestamp in the target timezone and diff against UTC
  const ref = 0 // Unix epoch — avoids DST ambiguity for sorting purposes
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
  const parts = fmt.formatToParts(new Date(ref))
  const get = (type: string) => parseInt(parts.find(p => p.type === type)!.value)
  const localMs = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour') % 24, get('minute'))
  return (localMs - ref) / 60000
}

function formatOffset(minutes: number): string {
  const sign = minutes >= 0 ? '+' : '-'
  const abs = Math.abs(minutes)
  const h = Math.floor(abs / 60)
  const m = abs % 60
  return `${sign}${h}:${String(m).padStart(2, '0')}`
}

let _sorted: TimezoneEntry[] | null = null

export function getSortedTimezones(): TimezoneEntry[] {
  if (_sorted) return _sorted
  _sorted = getAllTimezones()
    .map(tz => {
      const offsetMinutes = getOffsetMinutes(tz)
      const label = `(UTC${formatOffset(offsetMinutes)}) ${tz}`
      return { tz, label, offsetMinutes }
    })
    .sort((a, b) => a.offsetMinutes - b.offsetMinutes || a.tz.localeCompare(b.tz))
  return _sorted
}

export function filterTimezones(
  query: string,
  zones: string[] = getAllTimezones(),
): string[] {
  if (!query) return zones
  const q = query.toLowerCase()
  return zones.filter(tz => tz.toLowerCase().includes(q))
}
