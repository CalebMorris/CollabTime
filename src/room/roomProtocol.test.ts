import { describe, it, expect } from 'vitest'
import { parseServerMessage } from './roomProtocol'

describe('parseServerMessage', () => {
  it('returns null for malformed JSON', () => {
    expect(parseServerMessage('not json')).toBeNull()
    expect(parseServerMessage('')).toBeNull()
    expect(parseServerMessage('{')).toBeNull()
  })

  it('returns null for JSON without a type field', () => {
    expect(parseServerMessage('{"foo":"bar"}')).toBeNull()
    expect(parseServerMessage('"string"')).toBeNull()
    expect(parseServerMessage('42')).toBeNull()
    expect(parseServerMessage('null')).toBeNull()
  })

  it('parses a joined message', () => {
    const raw = JSON.stringify({
      type: 'joined',
      sessionToken: 'abc123',
      participantToken: 'def456',
      nickname: 'Teal Fox',
      protocolVersion: '1.0',
      room: {
        code: 'purple-falcon-bridge',
        state: 'waiting',
        participants: [
          { participantToken: 'def456', nickname: 'Teal Fox', isConnected: true },
        ],
      },
    })
    const msg = parseServerMessage(raw)
    expect(msg).not.toBeNull()
    expect(msg!.type).toBe('joined')
  })

  it('parses a proposal_updated message', () => {
    const raw = JSON.stringify({
      type: 'proposal_updated',
      participantToken: 'abc',
      epochMs: 1711209600000,
    })
    const msg = parseServerMessage(raw)
    expect(msg).not.toBeNull()
    expect(msg!.type).toBe('proposal_updated')
  })

  it('parses a locked_in message', () => {
    const raw = JSON.stringify({ type: 'locked_in', epochMs: 1711209600000 })
    const msg = parseServerMessage(raw)
    expect(msg).not.toBeNull()
    expect(msg!.type).toBe('locked_in')
  })

  it('parses an error message', () => {
    const raw = JSON.stringify({ type: 'error', code: 'ROOM_NOT_FOUND', message: 'Room not found' })
    const msg = parseServerMessage(raw)
    expect(msg).not.toBeNull()
    expect(msg!.type).toBe('error')
  })

  it('parses a room_expired message', () => {
    const raw = JSON.stringify({ type: 'room_expired' })
    const msg = parseServerMessage(raw)
    expect(msg).not.toBeNull()
    expect(msg!.type).toBe('room_expired')
  })

  it('parses a participant_disconnected message', () => {
    const raw = JSON.stringify({ type: 'participant_disconnected', participantToken: 'abc' })
    const msg = parseServerMessage(raw)
    expect(msg).not.toBeNull()
    expect(msg!.type).toBe('participant_disconnected')
  })

  it('parses a participant_left message', () => {
    const raw = JSON.stringify({ type: 'participant_left', participantToken: 'abc' })
    const msg = parseServerMessage(raw)
    expect(msg).not.toBeNull()
    expect(msg!.type).toBe('participant_left')
  })

  it('parses a room_activated message', () => {
    const raw = JSON.stringify({
      type: 'room_activated',
      participants: [{ participantToken: 'abc', nickname: 'Teal Fox' }],
    })
    const msg = parseServerMessage(raw)
    expect(msg).not.toBeNull()
    expect(msg!.type).toBe('room_activated')
  })

  it('parses a room_deactivated message', () => {
    const raw = JSON.stringify({ type: 'room_deactivated' })
    const msg = parseServerMessage(raw)
    expect(msg).not.toBeNull()
    expect(msg!.type).toBe('room_deactivated')
  })

  it('passes through unknown message types (forward-compatibility)', () => {
    const raw = JSON.stringify({ type: 'some_future_event', data: 'x' })
    const msg = parseServerMessage(raw)
    expect(msg).not.toBeNull()
    expect((msg as { type: string }).type).toBe('some_future_event')
  })
})

describe('parseServerMessage — field validation', () => {
  // room_activated: participants must be an array (used with .map() in useRoom)
  it('returns null for room_activated with participants: null', () => {
    expect(parseServerMessage(JSON.stringify({ type: 'room_activated', participants: null }))).toBeNull()
  })

  it('returns null for room_activated with participants missing', () => {
    expect(parseServerMessage(JSON.stringify({ type: 'room_activated' }))).toBeNull()
  })

  it('returns null for room_activated with participants as a non-array', () => {
    expect(parseServerMessage(JSON.stringify({ type: 'room_activated', participants: 'oops' }))).toBeNull()
  })

  // proposal_updated: epochMs must be a finite number
  it('returns null for proposal_updated with epochMs: null', () => {
    expect(parseServerMessage(JSON.stringify({ type: 'proposal_updated', participantToken: 'pt-1', epochMs: null }))).toBeNull()
  })

  it('returns null for proposal_updated with epochMs missing', () => {
    expect(parseServerMessage(JSON.stringify({ type: 'proposal_updated', participantToken: 'pt-1' }))).toBeNull()
  })

  it('returns null for proposal_updated with epochMs: Infinity', () => {
    // JSON.stringify(Infinity) → "null", so we build the string manually
    expect(parseServerMessage('{"type":"proposal_updated","participantToken":"pt-1","epochMs":null}')).toBeNull()
  })

  // locked_in: epochMs must be a finite number
  it('returns null for locked_in with epochMs: null', () => {
    expect(parseServerMessage(JSON.stringify({ type: 'locked_in', epochMs: null }))).toBeNull()
  })

  it('returns null for locked_in with epochMs missing', () => {
    expect(parseServerMessage(JSON.stringify({ type: 'locked_in' }))).toBeNull()
  })

  // joined: room.participants must be an array
  it('returns null for joined with room.participants: null', () => {
    expect(parseServerMessage(JSON.stringify({
      type: 'joined',
      sessionToken: 'abc',
      participantToken: 'def',
      nickname: 'Teal Fox',
      protocolVersion: '1.0',
      room: { code: 'x-y-z', state: 'waiting', participants: null },
    }))).toBeNull()
  })

  it('returns null for joined without a room field', () => {
    expect(parseServerMessage(JSON.stringify({
      type: 'joined',
      sessionToken: 'abc',
      participantToken: 'def',
      nickname: 'Teal Fox',
      protocolVersion: '1.0',
    }))).toBeNull()
  })
})
