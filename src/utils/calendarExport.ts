function toIcsDate(ms: number): string {
  const date = new Date(ms)
  const pad = (n: number) => String(n).padStart(2, '0')
  const year = date.getUTCFullYear()
  const month = pad(date.getUTCMonth() + 1)
  const day = pad(date.getUTCDate())
  const hours = pad(date.getUTCHours())
  const minutes = pad(date.getUTCMinutes())
  const seconds = pad(date.getUTCSeconds())
  return `${year}${month}${day}T${hours}${minutes}${seconds}Z`
}

export function buildGoogleCalendarUrl(timestampMs: number): string {
  const ONE_HOUR_MS = 60 * 60 * 1000
  const start = toIcsDate(timestampMs)
  const end = toIcsDate(timestampMs + ONE_HOUR_MS)
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: 'CollabTime Event',
    dates: `${start}/${end}`,
  })
  return `https://calendar.google.com/calendar/render?${params}`
}

export function buildIcsContent(timestampMs: number): string {
  const ONE_HOUR_MS = 60 * 60 * 1000
  const dtstart = toIcsDate(timestampMs)
  const dtend = toIcsDate(timestampMs + ONE_HOUR_MS)
  const dtstamp = toIcsDate(Date.now())
  const unixSeconds = Math.floor(timestampMs / 1000)
  const uid = `${unixSeconds}@collabtime`

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//CollabTime//CollabTime//EN',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${dtstamp}`,
    `DTSTART:${dtstart}`,
    `DTEND:${dtend}`,
    'SUMMARY:CollabTime Event',
    'END:VEVENT',
    'END:VCALENDAR',
    '',
  ]

  return lines.join('\r\n')
}
