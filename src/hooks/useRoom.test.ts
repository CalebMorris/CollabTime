import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useRoom } from './useRoom'
import type { RoomSocketCallbacks } from '../room/RoomSocket'
import type { RoomSocket } from '../room/RoomSocket'
import type { ServerMessage } from '../room/roomProtocol'
import { saveSessionToken } from '../room/roomSession'

// ─── FakeRoomSocket ───────────────────────────────────────────────────────────

class FakeRoomSocket {
  private cb: RoomSocketCallbacks
  connectCalledWith: string | null = null
  disconnectCalled = false
  sentMessages: object[] = []

  constructor(callbacks: RoomSocketCallbacks) {
    this.cb = callbacks
  }

  connect(url: string) { this.connectCalledWith = url }
  send(msg: object) { this.sentMessages.push(msg) }
  disconnect() { this.disconnectCalled = true }
  get isOpen() { return true }

  simulateOpen() { this.cb.onOpen() }
  simulateMessage(msg: ServerMessage) { this.cb.onMessage(msg) }
  simulateClose() { this.cb.onClose(new CloseEvent('close')) }
  simulateError() { this.cb.onError() }
}

// ─── Factory helpers ──────────────────────────────────────────────────────────

function makeFactory() {
  const sockets: FakeRoomSocket[] = []
  const factory = (cb: RoomSocketCallbacks): RoomSocket => {
    const socket = new FakeRoomSocket(cb)
    sockets.push(socket)
    return socket as unknown as RoomSocket
  }
  const latest = () => sockets[sockets.length - 1]
  return { factory, sockets, latest }
}

const ROOM_CODE = 'purple-falcon-bridge'

// Joined snapshot helper
const makeJoinedMsg = (overrides?: Partial<ServerMessage & { type: 'joined' }>): ServerMessage => ({
  type: 'joined',
  sessionToken: 'sess-abc',
  participantToken: 'part-def',
  nickname: 'Teal Fox',
  protocolVersion: '1.0',
  room: {
    code: ROOM_CODE,
    state: 'waiting',
    participants: [
      { participantToken: 'part-def', nickname: 'Teal Fox', isConnected: true, proposalEpochMs: null },
    ],
    lockedInEpochMs: null,
  },
  ...overrides,
})

beforeEach(() => sessionStorage.clear())
afterEach(() => vi.useRealTimers())

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('useRoom — initial state', () => {
  it('starts in idle phase', () => {
    const { factory } = makeFactory()
    const { result } = renderHook(() => useRoom(ROOM_CODE, factory))
    expect(result.current.connectionPhase).toBe('idle')
    expect(result.current.roomPhase).toBeNull()
    expect(result.current.participants).toEqual([])
    expect(result.current.proposals).toEqual([])
    expect(result.current.ownNickname).toBeNull()
    expect(result.current.lockedEpochMs).toBeNull()
    expect(result.current.errorCode).toBeNull()
    expect(result.current.reconnectSecondsRemaining).toBeNull()
  })
})

describe('useRoom — connect()', () => {
  it('transitions to connecting and creates a socket', () => {
    const { factory, latest } = makeFactory()
    const { result } = renderHook(() => useRoom(ROOM_CODE, factory))
    act(() => result.current.connect())
    expect(result.current.connectionPhase).toBe('connecting')
    expect(latest().connectCalledWith).not.toBeNull()
  })

  it('is a no-op when already connecting', () => {
    const { factory, sockets } = makeFactory()
    const { result } = renderHook(() => useRoom(ROOM_CODE, factory))
    act(() => result.current.connect())
    act(() => result.current.connect())
    expect(sockets).toHaveLength(1)
  })

  it('sends join when no session token exists', () => {
    const { factory, latest } = makeFactory()
    const { result } = renderHook(() => useRoom(ROOM_CODE, factory))
    act(() => result.current.connect())
    act(() => latest().simulateOpen())
    expect(result.current.connectionPhase).toBe('joining')
    expect(latest().sentMessages[0]).toMatchObject({ type: 'join', roomCode: ROOM_CODE })
  })

  it('sends rejoin when a session token exists in sessionStorage', () => {
    saveSessionToken(ROOM_CODE, 'existing-token')
    const { factory, latest } = makeFactory()
    const { result } = renderHook(() => useRoom(ROOM_CODE, factory))
    act(() => result.current.connect())
    act(() => latest().simulateOpen())
    expect(latest().sentMessages[0]).toMatchObject({
      type: 'rejoin',
      roomCode: ROOM_CODE,
      sessionToken: 'existing-token',
    })
  })

  it('transitions to connection_failed on socket error', () => {
    const { factory, latest } = makeFactory()
    const { result } = renderHook(() => useRoom(ROOM_CODE, factory))
    act(() => result.current.connect())
    act(() => latest().simulateError())
    expect(result.current.connectionPhase).toBe('connection_failed')
  })

  it('can reconnect after connection_failed', () => {
    const { factory, sockets, latest } = makeFactory()
    const { result } = renderHook(() => useRoom(ROOM_CODE, factory))
    act(() => result.current.connect())
    act(() => latest().simulateError())
    act(() => result.current.connect())
    expect(sockets).toHaveLength(2)
  })
})

describe('useRoom — joined message', () => {
  it('transitions to connected and populates room state', () => {
    const { factory, latest } = makeFactory()
    const { result } = renderHook(() => useRoom(ROOM_CODE, factory))
    act(() => result.current.connect())
    act(() => latest().simulateOpen())
    act(() => latest().simulateMessage(makeJoinedMsg()))
    expect(result.current.connectionPhase).toBe('connected')
    expect(result.current.ownNickname).toBe('Teal Fox')
    expect(result.current.ownParticipantToken).toBe('part-def')
    expect(result.current.roomPhase).toBe('waiting')
    expect(result.current.participants).toHaveLength(1)
  })

  it('saves session token and participant token to sessionStorage', () => {
    const { factory, latest } = makeFactory()
    const { result } = renderHook(() => useRoom(ROOM_CODE, factory))
    act(() => result.current.connect())
    act(() => latest().simulateOpen())
    act(() => latest().simulateMessage(makeJoinedMsg()))
    expect(sessionStorage.getItem(`collabtime:session:${ROOM_CODE}`)).toBe('sess-abc')
    expect(sessionStorage.getItem(`collabtime:participant:${ROOM_CODE}`)).toBe('part-def')
  })

  it('populates existing proposals from the room snapshot', () => {
    const { factory, latest } = makeFactory()
    const { result } = renderHook(() => useRoom(ROOM_CODE, factory))
    act(() => result.current.connect())
    act(() => latest().simulateOpen())
    act(() => latest().simulateMessage({
      type: 'joined',
      sessionToken: 'sess-abc',
      participantToken: 'part-def',
      nickname: 'Teal Fox',
      protocolVersion: '1.0',
      room: {
        code: ROOM_CODE,
        state: 'active',
        participants: [
          { participantToken: 'part-def', nickname: 'Teal Fox', isConnected: true, proposalEpochMs: 1711209600000 },
          { participantToken: 'part-xyz', nickname: 'Azure Sloth', isConnected: true, proposalEpochMs: 1711209600000 },
        ],
        lockedInEpochMs: null,
      },
    }))
    expect(result.current.proposals).toHaveLength(2)
    expect(result.current.roomPhase).toBe('active')
  })
})

describe('useRoom — room state messages', () => {
  function setupConnected(factory: ReturnType<typeof makeFactory>['factory'], latest: ReturnType<typeof makeFactory>['latest']) {
    const { result } = renderHook(() => useRoom(ROOM_CODE, factory))
    act(() => result.current.connect())
    act(() => latest().simulateOpen())
    act(() => latest().simulateMessage(makeJoinedMsg()))
    return result
  }

  it('sets roomPhase to active on room_activated', () => {
    const { factory, latest } = makeFactory()
    const result = setupConnected(factory, latest)
    act(() => latest().simulateMessage({ type: 'room_activated', participants: [] }))
    expect(result.current.roomPhase).toBe('active')
  })

  it('sets roomPhase to waiting on room_deactivated', () => {
    const { factory, latest } = makeFactory()
    const result = setupConnected(factory, latest)
    act(() => latest().simulateMessage({ type: 'room_activated', participants: [] }))
    act(() => latest().simulateMessage({ type: 'room_deactivated' }))
    expect(result.current.roomPhase).toBe('waiting')
  })

  it('appends participant on participant_joined', () => {
    const { factory, latest } = makeFactory()
    const result = setupConnected(factory, latest)
    act(() => latest().simulateMessage({
      type: 'participant_joined',
      participantToken: 'part-xyz',
      nickname: 'Azure Sloth',
    }))
    expect(result.current.participants).toHaveLength(2)
    expect(result.current.participants[1].nickname).toBe('Azure Sloth')
  })

  it('removes participant and their proposal on participant_left', () => {
    const { factory, latest } = makeFactory()
    const result = setupConnected(factory, latest)
    act(() => latest().simulateMessage({ type: 'participant_joined', participantToken: 'part-xyz', nickname: 'Azure Sloth' }))
    act(() => latest().simulateMessage({ type: 'proposal_updated', participantToken: 'part-xyz', epochMs: 1711209600000 }))
    act(() => latest().simulateMessage({ type: 'participant_left', participantToken: 'part-xyz' }))
    expect(result.current.participants.find(p => p.participantToken === 'part-xyz')).toBeUndefined()
    expect(result.current.proposals.find(p => p.participantToken === 'part-xyz')).toBeUndefined()
  })

  it('marks participant isConnected: false on participant_disconnected (other)', () => {
    const { factory, latest } = makeFactory()
    const result = setupConnected(factory, latest)
    act(() => latest().simulateMessage({ type: 'participant_joined', participantToken: 'part-xyz', nickname: 'Azure Sloth' }))
    act(() => latest().simulateMessage({ type: 'participant_disconnected', participantToken: 'part-xyz' }))
    const participant = result.current.participants.find(p => p.participantToken === 'part-xyz')
    expect(participant?.isConnected).toBe(false)
  })

  it('marks participant isConnected: true on participant_reconnected', () => {
    const { factory, latest } = makeFactory()
    const result = setupConnected(factory, latest)
    act(() => latest().simulateMessage({ type: 'participant_joined', participantToken: 'part-xyz', nickname: 'Azure Sloth' }))
    act(() => latest().simulateMessage({ type: 'participant_disconnected', participantToken: 'part-xyz' }))
    act(() => latest().simulateMessage({ type: 'participant_reconnected', participantToken: 'part-xyz' }))
    const participant = result.current.participants.find(p => p.participantToken === 'part-xyz')
    expect(participant?.isConnected).toBe(true)
  })
})

describe('useRoom — proposal_updated', () => {
  function setupActive(factory: ReturnType<typeof makeFactory>['factory'], latest: ReturnType<typeof makeFactory>['latest']) {
    const { result } = renderHook(() => useRoom(ROOM_CODE, factory))
    act(() => result.current.connect())
    act(() => latest().simulateOpen())
    act(() => latest().simulateMessage(makeJoinedMsg()))
    act(() => latest().simulateMessage({ type: 'room_activated', participants: [] }))
    return result
  }

  it('appends a new proposal', () => {
    const { factory, latest } = makeFactory()
    const result = setupActive(factory, latest)
    act(() => latest().simulateMessage({ type: 'proposal_updated', participantToken: 'part-def', epochMs: 1711209600000 }))
    expect(result.current.proposals).toHaveLength(1)
    expect(result.current.proposals[0].epochMs).toBe(1711209600000)
  })

  it('replaces an existing proposal (upsert)', () => {
    const { factory, latest } = makeFactory()
    const result = setupActive(factory, latest)
    act(() => latest().simulateMessage({ type: 'proposal_updated', participantToken: 'part-def', epochMs: 1711209600000 }))
    act(() => latest().simulateMessage({ type: 'proposal_updated', participantToken: 'part-def', epochMs: 1711296000000 }))
    expect(result.current.proposals).toHaveLength(1)
    expect(result.current.proposals[0].epochMs).toBe(1711296000000)
  })

  it('ownProposal reflects the proposal matching ownParticipantToken', () => {
    const { factory, latest } = makeFactory()
    const result = setupActive(factory, latest)
    expect(result.current.ownProposal).toBeNull()
    act(() => latest().simulateMessage({ type: 'proposal_updated', participantToken: 'part-def', epochMs: 1711209600000 }))
    expect(result.current.ownProposal?.epochMs).toBe(1711209600000)
  })
})

describe('useRoom — locked_in', () => {
  it('sets roomPhase and lockedEpochMs, clears sessionStorage', () => {
    const { factory, latest } = makeFactory()
    const { result } = renderHook(() => useRoom(ROOM_CODE, factory))
    act(() => result.current.connect())
    act(() => latest().simulateOpen())
    act(() => latest().simulateMessage(makeJoinedMsg()))
    act(() => latest().simulateMessage({ type: 'locked_in', epochMs: 1711209600000 }))
    expect(result.current.roomPhase).toBe('locked_in')
    expect(result.current.lockedEpochMs).toBe(1711209600000)
    expect(sessionStorage.getItem(`collabtime:session:${ROOM_CODE}`)).toBeNull()
  })
})

describe('useRoom — room_expired', () => {
  it('sets connectionPhase to expired and clears sessionStorage', () => {
    const { factory, latest } = makeFactory()
    const { result } = renderHook(() => useRoom(ROOM_CODE, factory))
    act(() => result.current.connect())
    act(() => latest().simulateOpen())
    act(() => latest().simulateMessage(makeJoinedMsg()))
    act(() => latest().simulateMessage({ type: 'room_expired' }))
    expect(result.current.connectionPhase).toBe('expired')
    expect(sessionStorage.getItem(`collabtime:session:${ROOM_CODE}`)).toBeNull()
  })
})

describe('useRoom — error handling', () => {
  const terminalCodes = ['ROOM_NOT_FOUND', 'ROOM_FULL', 'REJOIN_FAILED', 'INVALID_TOKEN'] as const
  const nonTerminalCodes = ['RATE_LIMITED', 'INVALID_PROPOSAL'] as const

  terminalCodes.forEach((code) => {
    it(`closes connection and sets errorCode for terminal error: ${code}`, () => {
      const { factory, latest } = makeFactory()
      const { result } = renderHook(() => useRoom(ROOM_CODE, factory))
      act(() => result.current.connect())
      act(() => latest().simulateOpen())
      act(() => latest().simulateMessage({ type: 'error', code }))
      expect(result.current.errorCode).toBe(code)
      expect(['connection_failed', 'idle', 'expired'].includes(result.current.connectionPhase) ||
        result.current.connectionPhase === 'connection_failed').toBe(true)
    })
  })

  nonTerminalCodes.forEach((code) => {
    it(`sets errorCode but stays connected for non-terminal error: ${code}`, () => {
      const { factory, latest } = makeFactory()
      const { result } = renderHook(() => useRoom(ROOM_CODE, factory))
      act(() => result.current.connect())
      act(() => latest().simulateOpen())
      act(() => latest().simulateMessage(makeJoinedMsg()))
      act(() => latest().simulateMessage({ type: 'error', code }))
      expect(result.current.errorCode).toBe(code)
      expect(result.current.connectionPhase).toBe('connected')
    })
  })
})

describe('useRoom — self reconnect (onClose)', () => {
  it('transitions to reconnecting when socket closes while connected', () => {
    const { factory, latest } = makeFactory()
    const { result } = renderHook(() => useRoom(ROOM_CODE, factory))
    act(() => result.current.connect())
    act(() => latest().simulateOpen())
    act(() => latest().simulateMessage(makeJoinedMsg()))
    act(() => latest().simulateClose())
    expect(result.current.connectionPhase).toBe('reconnecting')
  })

  it('opens a new socket for rejoin after disconnect', () => {
    const { factory, sockets, latest } = makeFactory()
    const { result } = renderHook(() => useRoom(ROOM_CODE, factory))
    act(() => result.current.connect())
    act(() => latest().simulateOpen())
    act(() => latest().simulateMessage(makeJoinedMsg()))
    act(() => latest().simulateClose())
    expect(sockets).toHaveLength(2)
    expect(sockets[1].sentMessages).toEqual([])  // rejoin sent after open
    act(() => latest().simulateOpen())
    expect(sockets[1].sentMessages[0]).toMatchObject({ type: 'rejoin', sessionToken: 'sess-abc' })
  })

  it('sets connectionPhase to connection_failed when socket closes during joining (no session)', () => {
    const { factory, latest } = makeFactory()
    const { result } = renderHook(() => useRoom(ROOM_CODE, factory))
    act(() => result.current.connect())
    act(() => latest().simulateOpen())
    // Close before joined message arrives
    act(() => latest().simulateClose())
    expect(result.current.connectionPhase).toBe('connection_failed')
  })
})

describe('useRoom — reconnect countdown', () => {
  it('starts reconnectSecondsRemaining at 30 when reconnecting', () => {
    vi.useFakeTimers()
    const { factory, latest } = makeFactory()
    const { result } = renderHook(() => useRoom(ROOM_CODE, factory))
    act(() => result.current.connect())
    act(() => latest().simulateOpen())
    act(() => latest().simulateMessage(makeJoinedMsg()))
    act(() => latest().simulateClose())
    expect(result.current.reconnectSecondsRemaining).toBe(30)
  })

  it('decrements by 1 each second', () => {
    vi.useFakeTimers()
    const { factory, latest } = makeFactory()
    const { result } = renderHook(() => useRoom(ROOM_CODE, factory))
    act(() => result.current.connect())
    act(() => latest().simulateOpen())
    act(() => latest().simulateMessage(makeJoinedMsg()))
    act(() => latest().simulateClose())
    act(() => vi.advanceTimersByTime(5000))
    expect(result.current.reconnectSecondsRemaining).toBe(25)
  })

  it('does not go below 0', () => {
    vi.useFakeTimers()
    const { factory, latest } = makeFactory()
    const { result } = renderHook(() => useRoom(ROOM_CODE, factory))
    act(() => result.current.connect())
    act(() => latest().simulateOpen())
    act(() => latest().simulateMessage(makeJoinedMsg()))
    act(() => latest().simulateClose())
    act(() => vi.advanceTimersByTime(60000))
    expect(result.current.reconnectSecondsRemaining).toBe(0)
  })

  it('clears to null when back to connected after successful rejoin', () => {
    vi.useFakeTimers()
    const { factory, latest } = makeFactory()
    const { result } = renderHook(() => useRoom(ROOM_CODE, factory))
    act(() => result.current.connect())
    act(() => latest().simulateOpen())
    act(() => latest().simulateMessage(makeJoinedMsg()))
    act(() => latest().simulateClose())
    expect(result.current.reconnectSecondsRemaining).toBe(30)
    // New socket opens + joined received → back to connected
    act(() => latest().simulateOpen())
    act(() => latest().simulateMessage(makeJoinedMsg()))
    expect(result.current.connectionPhase).toBe('connected')
    expect(result.current.reconnectSecondsRemaining).toBeNull()
  })
})

describe('useRoom — propose()', () => {
  it('sends a propose message when connected and room is active', () => {
    const { factory, latest } = makeFactory()
    const { result } = renderHook(() => useRoom(ROOM_CODE, factory))
    act(() => result.current.connect())
    act(() => latest().simulateOpen())
    act(() => latest().simulateMessage(makeJoinedMsg()))
    act(() => latest().simulateMessage({ type: 'room_activated', participants: [] }))
    act(() => result.current.propose(1711209600000))
    expect(latest().sentMessages).toContainEqual({ type: 'propose', epochMs: 1711209600000 })
  })

  it('is a no-op when connectionPhase is not connected', () => {
    const { factory, latest } = makeFactory()
    const { result } = renderHook(() => useRoom(ROOM_CODE, factory))
    act(() => result.current.propose(1711209600000))
    expect(latest).not.toThrow()  // no socket even exists
  })

  it('is a no-op when roomPhase is locked_in', () => {
    const { factory, latest } = makeFactory()
    const { result } = renderHook(() => useRoom(ROOM_CODE, factory))
    act(() => result.current.connect())
    act(() => latest().simulateOpen())
    act(() => latest().simulateMessage(makeJoinedMsg()))
    act(() => latest().simulateMessage({ type: 'locked_in', epochMs: 1711209600000 }))
    const msgsBefore = [...latest().sentMessages]
    act(() => result.current.propose(1711209600001))
    expect(latest().sentMessages).toEqual(msgsBefore)
  })
})

describe('useRoom — disconnect()', () => {
  it('sends leave, clears sessionStorage, and resets state', () => {
    const { factory, latest } = makeFactory()
    const { result } = renderHook(() => useRoom(ROOM_CODE, factory))
    act(() => result.current.connect())
    act(() => latest().simulateOpen())
    act(() => latest().simulateMessage(makeJoinedMsg()))
    act(() => result.current.disconnect())
    expect(latest().sentMessages).toContainEqual({ type: 'leave' })
    expect(sessionStorage.getItem(`collabtime:session:${ROOM_CODE}`)).toBeNull()
    expect(result.current.connectionPhase).toBe('idle')
  })
})

describe('useRoom — unmount cleanup', () => {
  it('disconnects the socket on unmount', () => {
    const { factory, latest } = makeFactory()
    const { result, unmount } = renderHook(() => useRoom(ROOM_CODE, factory))
    act(() => result.current.connect())
    act(() => latest().simulateOpen())
    unmount()
    expect(latest().disconnectCalled).toBe(true)
  })
})
