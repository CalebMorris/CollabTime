const sessionKey = (roomCode: string) => `collabtime:session:${roomCode}`
const participantKey = (roomCode: string) => `collabtime:participant:${roomCode}`

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
