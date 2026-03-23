import * as chrono from 'chrono-node'

export type ParseResult =
  | { ok: true; timestamp: number }
  | { ok: false; error: string }

// chrono-node treats "EST"/"CST"/"PST"/"MST" as fixed offsets (e.g. EST = UTC-5 always).
// Users colloquially write "EST" year-round to mean "Eastern Time", even during DST.
// Normalize to chrono's DST-aware region abbreviations (ET/CT/MT/PT) so the correct
// offset is used based on the actual date.
const US_STD_ABBR_TO_REGION: Record<string, string> = {
  EST: 'ET',
  CST: 'CT',
  MST: 'MT',
  PST: 'PT',
}

function normalizeTimezoneAbbreviations(input: string): string {
  return input.replace(/\b(EST|CST|MST|PST)\b/g, match => US_STD_ABBR_TO_REGION[match] ?? match)
}

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

  // Natural language via chrono-node.
  // Normalize US standard-time abbreviations to DST-aware region codes first.
  const normalizedInput = normalizeTimezoneAbbreviations(trimmed)
  const parsed = chrono.parseDate(normalizedInput, referenceDate)
  if (parsed) {
    return { ok: true, timestamp: parsed.getTime() }
  }

  return { ok: false, error: `Could not parse "${trimmed}"` }
}
