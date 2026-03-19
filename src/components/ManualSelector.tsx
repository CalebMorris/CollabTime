interface Props {
  timezone: string
  onTime: (ms: number) => void
  value?: number | null
}

/** Convert UTC ms to a "YYYY-MM-DDTHH:MM" string in the given timezone,
 *  suitable for use as a datetime-local input value. */
function utcMsToLocalDateStr(ms: number, timezone: string): string {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
  const parts = fmt.formatToParts(new Date(ms))
  const get = (type: string) => parts.find(p => p.type === type)!.value
  const h = get('hour') === '24' ? '00' : get('hour')
  return `${get('year')}-${get('month')}-${get('day')}T${h}:${get('minute')}`
}

/** Convert a naive "YYYY-MM-DDTHH:MM" string from datetime-local to UTC ms,
 *  interpreting the value as local time in `timezone`. */
function localToUtcMs(localDateStr: string, timezone: string): number {
  const [datePart, timePart = '00:00'] = localDateStr.split('T')
  const [year, month, day] = datePart.split('-').map(Number)
  const [hour, minute] = timePart.split(':').map(Number)

  // Step 1: treat the local values as if they were UTC (nominal UTC)
  const nominalUtc = Date.UTC(year, month - 1, day, hour, minute)

  // Step 2: format that nominal UTC point in the target timezone to find
  //         what local time the timezone would actually show
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
  const parts = fmt.formatToParts(new Date(nominalUtc))
  const get = (type: string) => parseInt(parts.find(p => p.type === type)!.value)

  // hour can be "24" in some locales for midnight
  const tzNominal = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour') % 24, get('minute'))

  // Step 3: the offset is the difference; apply it to get real UTC
  return nominalUtc + (nominalUtc - tzNominal)
}

export function ManualSelector({ timezone, onTime, value = null }: Props) {
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.value) return
    onTime(localToUtcMs(e.target.value, timezone))
  }

  const inputValue = value != null ? utcMsToLocalDateStr(value, timezone) : ''

  return (
    <div>
      <label htmlFor="manual-dt" className="block text-sm text-gray-300 mb-1">
        Date and time
      </label>
      <input
        id="manual-dt"
        type="datetime-local"
        value={inputValue}
        onChange={handleDateChange}
        className="rounded bg-gray-800 px-2 py-1 text-sm text-gray-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
      />
    </div>
  )
}
