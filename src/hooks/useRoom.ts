import { useState, useEffect, useRef, useCallback } from 'react'
import { RoomSocket } from '../room/RoomSocket'
import type { RoomSocketCallbacks, RoomSocketFactory } from '../room/RoomSocket'
import type { Participant, Proposal, RoomPhase, ServerErrorCode, ServerMessage } from '../room/roomProtocol'
import {
  saveSessionToken,
  loadSessionToken,
  saveParticipantToken,
  clearRoomSession,
  saveLockedParticipants,
} from '../room/roomSession'

// ─── Types ────────────────────────────────────────────────────────────────────

export type ConnectionPhase =
  | 'idle'
  | 'connecting'
  | 'joining'
  | 'connected'
  | 'reconnecting'
  | 'connection_failed'
  | 'expired'

interface RoomState {
  connectionPhase: ConnectionPhase
  ownParticipantToken: string | null
  ownNickname: string | null
  roomPhase: RoomPhase | null
  participants: Participant[]
  proposals: Proposal[]
  lockedEpochMs: number | null
  gracePeriodStartedAt: number | null
  errorCode: ServerErrorCode | null
}

const INITIAL_STATE: RoomState = {
  connectionPhase: 'idle',
  ownParticipantToken: null,
  ownNickname: null,
  roomPhase: null,
  participants: [],
  proposals: [],
  lockedEpochMs: null,
  gracePeriodStartedAt: null,
  errorCode: null,
}

const TERMINAL_ERRORS: ServerErrorCode[] = [
  'ROOM_NOT_FOUND',
  'ROOM_FULL',
  'REJOIN_FAILED',
  'INVALID_TOKEN',
  'PROTOCOL_VERSION_MISMATCH',
  'SERVER_AT_CAPACITY',
]

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useRoom(
  roomCode: string,
  socketFactory?: RoomSocketFactory,
) {
  const [state, setStateRaw] = useState<RoomState>(INITIAL_STATE)
  const [nowMs, setNowMs] = useState(() => Date.now())
  const socketRef = useRef<RoomSocket | null>(null)
  // Keep a ref so callbacks always see latest state without stale closures
  const stateRef = useRef<RoomState>(INITIAL_STATE)
  stateRef.current = state

  // Countdown ticker — only runs while reconnecting
  useEffect(() => {
    if (state.connectionPhase !== 'reconnecting') return
    const id = setInterval(() => setNowMs(Date.now()), 1000)
    return () => clearInterval(id)
  }, [state.connectionPhase])

  // Batching-safe setState that also keeps stateRef in sync during updater
  const setState = useCallback((updater: (s: RoomState) => RoomState) => {
    setStateRaw((prev) => {
      const next = updater(prev)
      stateRef.current = next
      return next
    })
  }, [])

  // openConnectionRef allows onClose to call openConnection without a stale closure
  const openConnectionRef = useRef<() => void>(() => {})

  // openConnection creates a socket and connects — does NOT set connectionPhase.
  // Callers are responsible for setting the appropriate phase before calling this.
  const openConnection = useCallback(() => {
    if (socketRef.current !== null) return

    const factory = socketFactory ?? ((cb: RoomSocketCallbacks) => new RoomSocket(cb))

    // Declared before callbacks so the closures can guard against stale socket events.
    // A stale socket (e.g. from a React StrictMode double-invoke cleanup) may fire
    // onClose/onError after a new socket has already been created — those callbacks
    // must be ignored or they will null out socketRef and clobber the live socket.
    // eslint-disable-next-line prefer-const
    let thisSocket: RoomSocket
    // Tracks whether onOpen sent a rejoin (vs a fresh join). Used by onClose to
    // decide whether a drop during the joining phase should trigger a reconnect:
    // a rejoin failure is worth retrying (session still valid); a fresh join failure is not.
    let isRejoinAttempt = false

    const callbacks: RoomSocketCallbacks = {
      onOpen: () => {
        if (socketRef.current !== thisSocket) {
          console.log('[useRoom] onOpen from stale socket — ignoring')
          return
        }
        const existingToken = loadSessionToken(roomCode)
        if (existingToken) {
          isRejoinAttempt = true
          console.log('[useRoom] onOpen — sending rejoin for room:', roomCode)
          socketRef.current.send({
            type: 'rejoin',
            roomCode,
            sessionToken: existingToken,
            protocolVersion: '1.0',
          })
        } else {
          console.log('[useRoom] onOpen — sending join for room:', roomCode)
          socketRef.current.send({ type: 'join', roomCode, protocolVersion: '1.0' })
        }
        setState((s) => ({ ...s, connectionPhase: 'joining' }))
      },

      onMessage: (msg: ServerMessage) => {
        if (socketRef.current !== thisSocket) {
          console.log('[useRoom] onMessage from stale socket — ignoring', msg.type)
          return
        }
        handleMessage(msg)
      },

      onClose: () => {
        if (socketRef.current !== thisSocket) {
          console.log('[useRoom] onClose from stale socket — ignoring')
          return
        }
        socketRef.current = null
        const currentPhase = stateRef.current.connectionPhase
        console.log('[useRoom] onClose — phase was:', currentPhase, '| isRejoinAttempt:', isRejoinAttempt)

        if (currentPhase === 'connected' || (currentPhase === 'joining' && isRejoinAttempt)) {
          console.log('[useRoom] onClose — was connected or rejoin mid-handshake, attempting reconnect')
          setState((s) => ({
            ...s,
            connectionPhase: 'reconnecting',
            gracePeriodStartedAt: Date.now(),
          }))
          openConnectionRef.current()
        } else {
          setState((s) => ({ ...s, connectionPhase: 'connection_failed' }))
        }
      },

      onError: () => {
        if (socketRef.current !== thisSocket) {
          console.log('[useRoom] onError from stale socket — ignoring')
          return
        }
        console.log('[useRoom] onError')
        socketRef.current = null
        setState((s) => ({ ...s, connectionPhase: 'connection_failed' }))
      },
    }

    thisSocket = factory(callbacks)
    socketRef.current = thisSocket
    thisSocket.connect(import.meta.env.VITE_WS_URL ?? '')
  }, [roomCode, socketFactory, setState])

  openConnectionRef.current = openConnection

  function handleMessage(msg: ServerMessage) {
    console.log('[useRoom] handleMessage', msg.type)
    switch (msg.type) {
      case 'joined': {
        saveSessionToken(roomCode, msg.sessionToken)
        saveParticipantToken(roomCode, msg.participantToken)
        const proposals: Proposal[] = msg.room.participants
          .filter((p) => p.proposalEpochMs != null)
          .map((p) => ({ participantToken: p.participantToken, epochMs: p.proposalEpochMs! }))
        setState((s) => ({
          ...s,
          connectionPhase: 'connected',
          ownParticipantToken: msg.participantToken,
          ownNickname: msg.nickname,
          roomPhase: msg.room.state,
          participants: msg.room.participants.map((p) => ({
            participantToken: p.participantToken,
            nickname: p.nickname,
            isConnected: p.isConnected,
          })),
          proposals,
          lockedEpochMs: msg.room.lockedInEpochMs ?? null,
          gracePeriodStartedAt: null,
          errorCode: null,
        }))
        break
      }

      case 'participant_joined':
        console.log('[useRoom] participant_joined — adding', msg.nickname, 'to', stateRef.current.participants.map(p => p.nickname))
        setState((s) => ({
          ...s,
          participants: [
            ...s.participants,
            { participantToken: msg.participantToken, nickname: msg.nickname, isConnected: true },
          ],
        }))
        break

      case 'room_activated':
        console.log('[useRoom] room_activated — participants:', msg.participants.map(p => p.nickname))
        setState((s) => ({
          ...s,
          roomPhase: 'active',
          participants: msg.participants.map((p) => ({
            participantToken: p.participantToken,
            nickname: p.nickname,
            isConnected: true,
          })),
        }))
        break

      case 'room_deactivated':
        setState((s) => ({ ...s, roomPhase: 'waiting' }))
        break

      case 'participant_left':
        setState((s) => ({
          ...s,
          participants: s.participants.filter((p) => p.participantToken !== msg.participantToken),
          proposals: s.proposals.filter((p) => p.participantToken !== msg.participantToken),
        }))
        break

      case 'participant_disconnected':
        setState((s) => ({
          ...s,
          participants: s.participants.map((p) =>
            p.participantToken === msg.participantToken ? { ...p, isConnected: false } : p,
          ),
        }))
        break

      case 'participant_reconnected':
        setState((s) => ({
          ...s,
          participants: s.participants.map((p) =>
            p.participantToken === msg.participantToken ? { ...p, isConnected: true } : p,
          ),
        }))
        break

      case 'proposal_updated': {
        console.log('[useRoom] proposal_updated — from', msg.participantToken, 'epoch', msg.epochMs)
        setState((s) => {
          const idx = s.proposals.findIndex((p) => p.participantToken === msg.participantToken)
          const updated: Proposal = { participantToken: msg.participantToken, epochMs: msg.epochMs }
          const proposals =
            idx >= 0
              ? s.proposals.map((p, i) => (i === idx ? updated : p))
              : [...s.proposals, updated]
          return { ...s, proposals }
        })
        break
      }

      case 'locked_in':
        clearRoomSession(roomCode)
        saveLockedParticipants(roomCode, stateRef.current.participants)
        setState((s) => ({ ...s, roomPhase: 'locked_in', lockedEpochMs: msg.epochMs }))
        break

      case 'room_expired':
        clearRoomSession(roomCode)
        socketRef.current?.disconnect()
        socketRef.current = null
        setState((s) => ({ ...s, connectionPhase: 'expired' }))
        break

      case 'error':
        if (TERMINAL_ERRORS.includes(msg.code)) {
          clearRoomSession(roomCode)
          socketRef.current?.disconnect()
          socketRef.current = null
          setState((s) => ({ ...s, connectionPhase: 'connection_failed', errorCode: msg.code }))
        } else {
          setState((s) => ({ ...s, errorCode: msg.code }))
        }
        break
    }
  }

  // Cleanup on unmount — also resets state so a remount (e.g. React StrictMode) can reconnect
  useEffect(() => {
    return () => {
      console.log('[useRoom] cleanup — disconnecting and resetting state')
      socketRef.current?.disconnect()
      socketRef.current = null
      setState(() => INITIAL_STATE)
    }
  }, [setState])

  // ─── Public actions ──────────────────────────────────────────────────────────

  const connect = useCallback(() => {
    console.log('[useRoom] connect() called — current phase:', state.connectionPhase)
    if (state.connectionPhase !== 'idle' && state.connectionPhase !== 'connection_failed') {
      console.log('[useRoom] connect() blocked — phase is not idle/connection_failed')
      return
    }
    setState((s) => ({ ...s, connectionPhase: 'connecting' }))
    openConnectionRef.current()
  }, [state.connectionPhase, setState])

  const disconnect = useCallback(() => {
    socketRef.current?.send({ type: 'leave' })
    socketRef.current?.disconnect()
    socketRef.current = null
    clearRoomSession(roomCode)
    setState(() => INITIAL_STATE)
  }, [roomCode, setState])

  const propose = useCallback(
    (epochMs: number) => {
      if (state.connectionPhase !== 'connected') return
      if (state.roomPhase === 'locked_in') return
      socketRef.current?.send({ type: 'propose', epochMs })
    },
    [state.connectionPhase, state.roomPhase],
  )

  // ─── Derived values ──────────────────────────────────────────────────────────

  const ownProposal =
    state.ownParticipantToken !== null
      ? (state.proposals.find((p) => p.participantToken === state.ownParticipantToken) ?? null)
      : null

  const reconnectSecondsRemaining =
    state.gracePeriodStartedAt === null
      ? null
      : Math.max(0, Math.ceil(30 - (nowMs - state.gracePeriodStartedAt) / 1000))

  return {
    connectionPhase: state.connectionPhase,
    ownParticipantToken: state.ownParticipantToken,
    ownNickname: state.ownNickname,
    roomPhase: state.roomPhase,
    participants: state.participants,
    proposals: state.proposals,
    lockedEpochMs: state.lockedEpochMs,
    errorCode: state.errorCode,
    ownProposal,
    reconnectSecondsRemaining,
    connect,
    disconnect,
    propose,
  }
}
