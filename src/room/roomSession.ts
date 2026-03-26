const sessionKey = (roomCode: string) => `collabtime:session:${roomCode}`
const participantKey = (roomCode: string) => `collabtime:participant:${roomCode}`
const lockedParticipantsKey = (roomCode: string) => `collabtime:locked-participants:${roomCode}`

export interface StoredParticipant {
  participantToken: string
  nickname: string
  isConnected: boolean
}

export function saveLockedParticipants(roomCode: string, participants: StoredParticipant[]): void {
  sessionStorage.setItem(lockedParticipantsKey(roomCode), JSON.stringify(participants))
}

export function loadLockedParticipants(roomCode: string): StoredParticipant[] | null {
  const raw = sessionStorage.getItem(lockedParticipantsKey(roomCode))
  if (!raw) return null
  try {
    return JSON.parse(raw) as StoredParticipant[]
  } catch {
    return null
  }
}

export function saveSessionToken(roomCode: string, token: string): void {
  sessionStorage.setItem(sessionKey(roomCode), token)
}

export function loadSessionToken(roomCode: string): string | null {
  return sessionStorage.getItem(sessionKey(roomCode))
}

export function saveParticipantToken(roomCode: string, token: string): void {
  sessionStorage.setItem(participantKey(roomCode), token)
}

export function loadParticipantToken(roomCode: string): string | null {
  return sessionStorage.getItem(participantKey(roomCode))
}

export function clearRoomSession(roomCode: string): void {
  sessionStorage.removeItem(sessionKey(roomCode))
  sessionStorage.removeItem(participantKey(roomCode))
}
