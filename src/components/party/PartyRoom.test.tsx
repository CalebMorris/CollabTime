import { render, screen, act } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import type { RoomSocketCallbacks } from '../../room/RoomSocket'
import type { RoomSocket } from '../../room/RoomSocket'
import { PartyRoom } from './PartyRoom'

// ─── FakeRoomSocket ────────────────────────────────────────────────────────────

class FakeRoomSocket {
  callbacks: RoomSocketCallbacks
  constructor(cb: RoomSocketCallbacks) { this.callbacks = cb }
  connect = vi.fn()
  send = vi.fn()
  disconnect = vi.fn()
  get isOpen() { return false }
  simulateOpen() { act(() => { this.callbacks.onOpen() }) }
  simulateMessage(msg: object) { act(() => { this.callbacks.onMessage(msg as never) }) }
  simulateClose() { act(() => { this.callbacks.onClose(new CloseEvent('close')) }) }
}

function makeFakeFactory() {
  let instance: FakeRoomSocket | null = null
  const factory = (cb: RoomSocketCallbacks): RoomSocket => {
    instance = new FakeRoomSocket(cb)
    return instance as unknown as RoomSocket
  }
  const getInstance = () => instance!
  return { factory, getInstance }
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('PartyRoom', () => {
  it('renders the room code', () => {
    const { factory } = makeFakeFactory()
    render(
      <PartyRoom
        roomCode="amber-falcon-bridge"
        onLeave={vi.fn()}
        socketFactory={factory}
      />,
    )
    expect(screen.getByText('amber-falcon-bridge')).toBeDefined()
  })

  it('calls connect on mount and shows connecting state', () => {
    const { factory } = makeFakeFactory()
    render(
      <PartyRoom
        roomCode="amber-falcon-bridge"
        onLeave={vi.fn()}
        socketFactory={factory}
      />,
    )
    expect(screen.getByText(/connecting/i)).toBeDefined()
  })

  it('shows joining state after socket opens', () => {
    const { factory, getInstance } = makeFakeFactory()
    render(
      <PartyRoom
        roomCode="amber-falcon-bridge"
        onLeave={vi.fn()}
        socketFactory={factory}
      />,
    )
    getInstance().simulateOpen()
    expect(screen.getByText(/joining/i)).toBeDefined()
  })

  it('shows the time picker after connected', () => {
    const { factory, getInstance } = makeFakeFactory()
    render(
      <PartyRoom
        roomCode="amber-falcon-bridge"
        onLeave={vi.fn()}
        socketFactory={factory}
      />,
    )
    getInstance().simulateOpen()
    getInstance().simulateMessage({
      type: 'joined',
      participantToken: 'pt-1',
      sessionToken: 'st-1',
      nickname: 'Teal Fox',
      protocolVersion: '1.0',
      room: { state: 'waiting', participants: [], lockedInEpochMs: null },
    })
    expect(screen.getByText(/pick a time/i)).toBeDefined()
  })

  it('displays own nickname once connected', () => {
    const { factory, getInstance } = makeFakeFactory()
    render(
      <PartyRoom
        roomCode="amber-falcon-bridge"
        onLeave={vi.fn()}
        socketFactory={factory}
      />,
    )
    getInstance().simulateOpen()
    getInstance().simulateMessage({
      type: 'joined',
      participantToken: 'pt-1',
      sessionToken: 'st-1',
      nickname: 'Teal Fox',
      protocolVersion: '1.0',
      room: { state: 'waiting', participants: [], lockedInEpochMs: null },
    })
    expect(screen.getByText(/teal fox/i)).toBeDefined()
  })

  it('shows result section when a time is selected', () => {
    const { factory, getInstance } = makeFakeFactory()
    render(
      <PartyRoom
        roomCode="amber-falcon-falcon"
        onLeave={vi.fn()}
        socketFactory={factory}
      />,
    )
    getInstance().simulateOpen()
    getInstance().simulateMessage({
      type: 'joined',
      participantToken: 'pt-1',
      sessionToken: 'st-1',
      nickname: 'Teal Fox',
      protocolVersion: '1.0',
      room: { state: 'waiting', participants: [], lockedInEpochMs: null },
    })
    expect(screen.getByText('Local time')).toBeDefined()
    expect(screen.getByText('UTC')).toBeDefined()
  })

  it('calls onLeave and disconnects when Leave is clicked', () => {
    const { factory, getInstance } = makeFakeFactory()
    const onLeave = vi.fn()
    render(
      <PartyRoom
        roomCode="amber-falcon-bridge"
        onLeave={onLeave}
        socketFactory={factory}
      />,
    )
    getInstance().simulateOpen()
    screen.getByRole('button', { name: /leave/i }).click()
    expect(onLeave).toHaveBeenCalledOnce()
    expect(getInstance().send).toHaveBeenCalledWith({ type: 'leave' })
  })
})
