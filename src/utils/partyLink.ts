// ─── Room code generation ─────────────────────────────────────────────────────

const WORDS_A = [
  'amber', 'azure', 'bold', 'bright', 'calm', 'clear', 'cool', 'crisp',
  'dark', 'deep', 'dim', 'dusk', 'fast', 'fierce', 'gentle', 'golden',
  'grand', 'green', 'grey', 'high', 'jade', 'keen', 'kind', 'large',
  'light', 'loud', 'misty', 'modest', 'noble', 'pale', 'plain', 'proud',
  'pure', 'quiet', 'rapid', 'rare', 'red', 'rich', 'rough', 'sharp',
  'silent', 'silver', 'slow', 'smart', 'soft', 'still', 'strong', 'swift',
  'tall', 'tiny', 'vast', 'warm', 'wild', 'wise', 'young',
]

const WORDS_B = [
  'bear', 'bird', 'brook', 'cloud', 'crane', 'crow', 'deer', 'dove',
  'eagle', 'elk', 'falcon', 'finch', 'fish', 'fox', 'frog', 'hawk',
  'heron', 'horse', 'ibis', 'jay', 'kite', 'lark', 'lion', 'lynx',
  'mink', 'mole', 'moose', 'moth', 'newt', 'otter', 'owl', 'panda',
  'pike', 'puma', 'quail', 'raven', 'robin', 'seal', 'shark', 'snail',
  'sparrow', 'stag', 'swan', 'swift', 'tiger', 'toad', 'trout', 'vole',
  'wasp', 'whale', 'wolf', 'wren', 'yak', 'zebra',
]

const WORDS_C = [
  'bank', 'bay', 'bend', 'bluff', 'bridge', 'brook', 'canyon', 'cave',
  'cliff', 'coast', 'cove', 'creek', 'delta', 'dune', 'falls', 'fen',
  'fjord', 'ford', 'forge', 'glen', 'gorge', 'grove', 'gulf', 'haven',
  'hill', 'inlet', 'island', 'lake', 'marsh', 'mead', 'mesa', 'moor',
  'peak', 'plain', 'pond', 'port', 'range', 'reach', 'reef', 'ridge',
  'river', 'rock', 'shore', 'slope', 'spring', 'stone', 'stream', 'vale',
  'valley', 'vent', 'view', 'weald', 'wood',
]

function pick(list: string[]): string {
  return list[Math.floor(Math.random() * list.length)]
}

export function generateRoomCode(): string {
  return `${pick(WORDS_A)}-${pick(WORDS_B)}-${pick(WORDS_C)}`
}

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
