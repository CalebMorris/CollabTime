// ─── AppMode ──────────────────────────────────────────────────────────────────
// Defined here (pure util, no React) so partyLink and usePartyMode can share it.

export type AppMode =
  | { kind: 'solo' }
  | { kind: 'party-create-overlay' }
  | { kind: 'party-join-overlay'; code: string | null }
  | { kind: 'party-room'; roomCode: string }
  | { kind: 'party-locked'; roomCode: string; confirmedMs: number }
  | { kind: 'party-dead'; attemptedCode: string }

// ─── URL encoding ─────────────────────────────────────────────────────────────

export function encodePartyRoomUrl(roomCode: string): string {
  return `?code=${roomCode}`
}

export function encodePartyLockedUrl(roomCode: string, epochMs: number): string {
  return `?locked-in=${roomCode}&time=${epochMs}`
}

// ─── URL decoding ─────────────────────────────────────────────────────────────

export function decodePartyCode(search: string): string | null {
  const value = new URLSearchParams(search).get('code')
  if (!value) return null
  return value
}

export function decodeLockedInParams(
  search: string
): { roomCode: string; epochMs: number } | null {
  const params = new URLSearchParams(search)
  const roomCode = params.get('locked-in')
  const timeStr = params.get('time')
  if (!roomCode || !timeStr) return null
  const epochMs = Number(timeStr)
  if (!Number.isFinite(epochMs) || isNaN(epochMs)) return null
  return { roomCode, epochMs }
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
