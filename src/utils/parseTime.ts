import * as chrono from 'chrono-node'

export type ParseResult =
  | { ok: true; timestamp: number }
  | { ok: false; error: string }

export function parseTime(input: string, referenceDate?: Date): ParseResult {
  const trimmed = input.trim()
  if (!trimmed) return { ok: false, error: 'Input is empty' }

  // Unix timestamp — pure integer, positive or negative
  if (/^-?\d+$/.test(trimmed)) {
    const n = Number(trimmed)
    // > 1e11 is unambiguously milliseconds; smaller values are seconds
    const ms = Math.abs(n) > 1e11 ? n : n * 1000
    return { ok: true, timestamp: ms }
  }

  // ISO 8601 / RFC 2822 — let Date.parse handle it
  const iso = Date.parse(trimmed)
  if (!isNaN(iso)) {
    return { ok: true, timestamp: iso }
  }

  // Natural language via chrono-node
  const parsed = chrono.parseDate(trimmed, referenceDate)
  if (parsed) {
    return { ok: true, timestamp: parsed.getTime() }
  }

  return { ok: false, error: `Could not parse "${trimmed}"` }
}
