export function formatInTimezone(ms: number, timezone: string): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(ms))
}

export function formatUtc(ms: number): string {
  return formatInTimezone(ms, 'UTC')
}
