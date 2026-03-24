import { describe, it, expect, beforeEach } from 'vitest'
import {
  saveSessionToken,
  loadSessionToken,
  saveParticipantToken,
  loadParticipantToken,
  clearRoomSession,
} from './roomSession'

describe('roomSession', () => {
  beforeEach(() => {
    sessionStorage.clear()
  })

  describe('sessionToken', () => {
    it('saves and loads a session token', () => {
      saveSessionToken('purple-falcon-bridge', 'tok123')
      expect(loadSessionToken('purple-falcon-bridge')).toBe('tok123')
    })

    it('returns null when no token stored', () => {
      expect(loadSessionToken('purple-falcon-bridge')).toBeNull()
    })

    it('namespaces by roomCode — different rooms do not conflict', () => {
      saveSessionToken('room-a-one', 'tokenA')
      saveSessionToken('room-b-two', 'tokenB')
      expect(loadSessionToken('room-a-one')).toBe('tokenA')
      expect(loadSessionToken('room-b-two')).toBe('tokenB')
    })
  })

  describe('participantToken', () => {
    it('saves and loads a participant token', () => {
      saveParticipantToken('purple-falcon-bridge', 'part789')
      expect(loadParticipantToken('purple-falcon-bridge')).toBe('part789')
    })

    it('returns null when no token stored', () => {
      expect(loadParticipantToken('purple-falcon-bridge')).toBeNull()
    })

    it('namespaces independently from sessionToken', () => {
      saveSessionToken('purple-falcon-bridge', 'session-tok')
      saveParticipantToken('purple-falcon-bridge', 'participant-tok')
      expect(loadSessionToken('purple-falcon-bridge')).toBe('session-tok')
      expect(loadParticipantToken('purple-falcon-bridge')).toBe('participant-tok')
    })
  })

  describe('clearRoomSession', () => {
    it('clears both tokens for the given room', () => {
      saveSessionToken('purple-falcon-bridge', 'tok123')
      saveParticipantToken('purple-falcon-bridge', 'part789')
      clearRoomSession('purple-falcon-bridge')
      expect(loadSessionToken('purple-falcon-bridge')).toBeNull()
      expect(loadParticipantToken('purple-falcon-bridge')).toBeNull()
    })

    it('only clears the specified room — other rooms are unaffected', () => {
      saveSessionToken('room-a-one', 'tokenA')
      saveSessionToken('room-b-two', 'tokenB')
      clearRoomSession('room-a-one')
      expect(loadSessionToken('room-a-one')).toBeNull()
      expect(loadSessionToken('room-b-two')).toBe('tokenB')
    })
  })
})
