export interface DiscordFormat {
  flag: string
  code: string
  label: string
  preview: string
}

function buildPreview(flag: string, ms: number, timezone: string, nowMs: number): string {
  const date = new Date(ms)
  const opts: Intl.DateTimeFormatOptions = { timeZone: timezone }

  switch (flag) {
    case 't':
      return new Intl.DateTimeFormat('en-US', { ...opts, hour: 'numeric', minute: '2-digit', hour12: true }).format(date)
    case 'T':
      return new Intl.DateTimeFormat('en-US', { ...opts, hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true }).format(date)
    case 'd':
      return new Intl.DateTimeFormat('en-US', { ...opts, month: 'numeric', day: 'numeric', year: 'numeric' }).format(date)
    case 'D':
      return new Intl.DateTimeFormat('en-US', { ...opts, month: 'long', day: 'numeric', year: 'numeric' }).format(date)
    case 'f':
      return new Intl.DateTimeFormat('en-US', { ...opts, month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true }).format(date)
    case 'F':
      return new Intl.DateTimeFormat('en-US', { ...opts, weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true }).format(date)
    case 'R': {
      const diffMs = ms - nowMs
      const diffSec = diffMs / 1000
      const rtf = new Intl.RelativeTimeFormat('en-US', { numeric: 'auto' })
      const abs = Math.abs(diffSec)
      if (abs < 60)   return rtf.format(Math.round(diffSec), 'second')
      if (abs < 3600) return rtf.format(Math.round(diffSec / 60), 'minute')
      if (abs < 86400) return rtf.format(Math.round(diffSec / 3600), 'hour')
      if (abs < 2592000) return rtf.format(Math.round(diffSec / 86400), 'day')
      if (abs < 31536000) return rtf.format(Math.round(diffSec / 2592000), 'month')
      return rtf.format(Math.round(diffSec / 31536000), 'year')
    }
    default:
      return ''
  }
}

export function getAllFormats(
  unixSeconds: number,
  timezone = 'UTC',
  nowMs = Date.now(),
): DiscordFormat[] {
  const ms = unixSeconds * 1000
  const flags = ['t', 'T', 'd', 'D', 'f', 'F', 'R']
  const labels = ['Short time', 'Long time', 'Short date', 'Long date', 'Short date/time', 'Long date/time', 'Relative']

  return flags.map((flag, i) => ({
    flag,
    code: `<t:${unixSeconds}:${flag}>`,
    label: labels[i]!,
    preview: buildPreview(flag, ms, timezone, nowMs),
  }))
}
