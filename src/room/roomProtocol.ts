// ─── Room / Participant shapes ───────────────────────────────────────────────

export type RoomPhase = 'waiting' | 'active' | 'locked_in'

export interface Participant {
  participantToken: string
  nickname: string
  isConnected: boolean
}

export interface Proposal {
  participantToken: string
  epochMs: number
}

export interface RoomSnapshot {
  code: string
  state: RoomPhase
  participants: Array<{
    participantToken: string
    nickname: string
    isConnected: boolean
    proposalEpochMs: number | null
  }>
  lockedInEpochMs: number | null
}

// ─── Client → Server messages ─────────────────────────────────────────────────

export interface JoinMessage {
  type: 'join'
  roomCode: string
  protocolVersion?: '1.0'
}

export interface RejoinMessage {
  type: 'rejoin'
  roomCode: string
  sessionToken: string
  protocolVersion?: '1.0'
}

export interface ProposeMessage {
  type: 'propose'
  epochMs: number
}

export interface LeaveMessage {
  type: 'leave'
}

export type ClientMessage = JoinMessage | RejoinMessage | ProposeMessage | LeaveMessage

// ─── Server → Client messages ─────────────────────────────────────────────────

export interface JoinedMessage {
  type: 'joined'
  sessionToken: string
  participantToken: string
  nickname: string
  protocolVersion: string
  room: RoomSnapshot
}

export interface ParticipantJoinedMessage {
  type: 'participant_joined'
  participantToken: string
  nickname: string
}

export interface RoomActivatedMessage {
  type: 'room_activated'
  participants: Array<{ participantToken: string; nickname: string }>
}

export interface RoomDeactivatedMessage {
  type: 'room_deactivated'
}

export interface ParticipantLeftMessage {
  type: 'participant_left'
  participantToken: string
}

export interface ParticipantDisconnectedMessage {
  type: 'participant_disconnected'
  participantToken: string
}

export interface ParticipantReconnectedMessage {
  type: 'participant_reconnected'
  participantToken: string
}

export interface ProposalUpdatedMessage {
  type: 'proposal_updated'
  participantToken: string
  epochMs: number
}

export interface LockedInMessage {
  type: 'locked_in'
  epochMs: number
}

export interface RoomExpiredMessage {
  type: 'room_expired'
}

export type ServerErrorCode =
  | 'ROOM_NOT_FOUND'
  | 'ROOM_NOT_ACTIVE'
  | 'ROOM_FULL'
  | 'RATE_LIMITED'
  | 'INVALID_PROPOSAL'
  | 'REJOIN_FAILED'
  | 'INVALID_TOKEN'

export interface ErrorMessage {
  type: 'error'
  code: ServerErrorCode
  message?: string
}

export type ServerMessage =
  | JoinedMessage
  | ParticipantJoinedMessage
  | RoomActivatedMessage
  | RoomDeactivatedMessage
  | ParticipantLeftMessage
  | ParticipantDisconnectedMessage
  | ParticipantReconnectedMessage
  | ProposalUpdatedMessage
  | LockedInMessage
  | RoomExpiredMessage
  | ErrorMessage

// ─── Parsing ──────────────────────────────────────────────────────────────────

/**
 * Parse a raw WebSocket frame into a typed ServerMessage.
 * Returns null for malformed JSON, messages with no `type` field, or messages
 * with required fields missing/wrong-typed (guards against server bugs that
 * would cause downstream crashes, e.g. participants: null crashing .map()).
 * Unknown types are passed through for forward-compatibility.
 */
export function parseServerMessage(raw: string): ServerMessage | null {
  try {
    const parsed: unknown = JSON.parse(raw)
    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      !('type' in parsed) ||
      typeof (parsed as Record<string, unknown>).type !== 'string'
    ) {
      return null
    }
    const msg = parsed as Record<string, unknown>
    const type = msg.type as string

    if (type === 'room_activated') {
      if (!Array.isArray(msg.participants)) return null
    }

    if (type === 'proposal_updated') {
      if (typeof msg.epochMs !== 'number' || !Number.isFinite(msg.epochMs)) return null
    }

    if (type === 'locked_in') {
      if (typeof msg.epochMs !== 'number' || !Number.isFinite(msg.epochMs)) return null
    }

    if (type === 'joined') {
      const room = msg.room as Record<string, unknown> | undefined
      if (typeof room !== 'object' || room === null || !Array.isArray(room.participants)) return null
    }

    return parsed as ServerMessage
  } catch {
    return null
  }
}
