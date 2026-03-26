import type { AppMode } from './partyLink'

// ─── Room code validation ─────────────────────────────────────────────────────

/** Single source of truth for the room-code format: three lowercase words separated by hyphens. */
export const ROOM_CODE_RE = /^[a-z]+-[a-z]+-[a-z]+$/

// ─── Solo deep-link (?time=<unix-seconds>) ───────────────────────────────────

export function encodeDeepLink(ms: number): string {
  return `?time=${Math.floor(ms / 1000)}`
}

export function decodeDeepLink(search: string): number | null {
  const value = new URLSearchParams(search).get('time')
  if (!value) return null
  const n = Number(value)
  if (!Number.isFinite(n) || isNaN(n)) return null
  return n * 1000
}

// ─── Party room URL (?code=<room-code>) ──────────────────────────────────────

export function encodePartyRoomUrl(roomCode: string): string {
  return `?code=${roomCode}`
}

export function decodePartyCode(search: string): string | null {
  const value = new URLSearchParams(search).get('code')
  if (!value) return null
  if (!ROOM_CODE_RE.test(value)) return null
  return value
}

// ─── Party locked-in URL (?locked-in=<room-code>&time=<epoch-ms>) ─────────────

export function encodePartyLockedUrl(roomCode: string, epochMs: number): string {
  return `?locked-in=${roomCode}&time=${epochMs}`
}

export function decodeLockedInParams(
  search: string,
): { roomCode: string; epochMs: number } | null {
  const params = new URLSearchParams(search)
  const roomCode = params.get('locked-in')
  const timeStr = params.get('time')
  if (!roomCode || !timeStr) return null
  if (!ROOM_CODE_RE.test(roomCode)) return null
  const epochMs = Number(timeStr)
  if (!Number.isFinite(epochMs) || isNaN(epochMs)) return null
  return { roomCode, epochMs }
}

// ─── Feature flags ────────────────────────────────────────────────────────────

/** Returns true when the `enablePartyMode` query param is present in the URL. */
export function isPartyModeEnabled(search: string): boolean {
  return new URLSearchParams(search).has('enablePartyMode')
}

// ─── Initial mode detection (called once on App mount) ────────────────────────

export function detectInitialMode(search: string): AppMode {
  const locked = decodeLockedInParams(search)
  if (locked !== null) {
    return { kind: 'party-locked', roomCode: locked.roomCode, confirmedMs: locked.epochMs }
  }

  const code = decodePartyCode(search)
  if (code !== null) {
    return { kind: 'party-join-overlay', code }
  }

  return { kind: 'solo' }
}
