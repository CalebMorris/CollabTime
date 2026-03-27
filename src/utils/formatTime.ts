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

export function formatCompactInTimezone(ms: number, timezone: string): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
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

export function formatCountdown(targetMs: number, nowMs: number): string | null {
  const totalSeconds = Math.floor(Math.abs(targetMs - nowMs) / 1000)
  if (totalSeconds < 1) return null

  const days = Math.floor(totalSeconds / 86400)
  const hours = Math.floor((totalSeconds % 86400) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  if (totalSeconds >= 86400) {
    return `${days}d ${hours}h ${minutes}m`
  }
  if (totalSeconds >= 3600) {
    return `${hours}h ${minutes}m`
  }
  return `${minutes}m ${String(seconds).padStart(2, '0')}s`
}
