import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { RoomSocket } from './RoomSocket'
import type { ServerMessage } from './roomProtocol'

// Minimal WebSocket mock
class MockWebSocket {
  static OPEN = 1
  static CLOSING = 2
  static CLOSED = 3

  readyState = MockWebSocket.OPEN
  url: string

  onopen: (() => void) | null = null
  onclose: ((e: CloseEvent) => void) | null = null
  onerror: (() => void) | null = null
  onmessage: ((e: MessageEvent) => void) | null = null

  sentMessages: string[] = []

  constructor(url: string) {
    this.url = url
  }

  send(data: string) {
    this.sentMessages.push(data)
  }

  close() {
    this.readyState = MockWebSocket.CLOSED
    this.onclose?.({ type: 'close' } as CloseEvent)
  }

  // Test helper: simulate the server sending a message
  simulateMessage(data: string) {
    this.onmessage?.({ data } as MessageEvent)
  }

  // Test helper: simulate open completing
  simulateOpen() {
    this.onopen?.()
  }

  // Test helper: simulate an error
  simulateError() {
    this.onerror?.()
  }
}

let mockWsInstance: MockWebSocket | null = null

beforeEach(() => {
  mockWsInstance = null
  vi.stubGlobal('WebSocket', class extends MockWebSocket {
    constructor(url: string) {
      super(url)
      // eslint-disable-next-line @typescript-eslint/no-this-alias
      mockWsInstance = this
    }
  })
})

afterEach(() => {
  vi.unstubAllGlobals()
})

function getMock(): MockWebSocket {
  if (!mockWsInstance) throw new Error('WebSocket not instantiated')
  return mockWsInstance
}

describe('RoomSocket', () => {
  describe('connect()', () => {
    it('creates a WebSocket with the given URL', () => {
      const socket = new RoomSocket({ onOpen: vi.fn(), onMessage: vi.fn(), onClose: vi.fn(), onError: vi.fn() })
      socket.connect('ws://localhost:3000/ws')
      expect(getMock().url).toBe('ws://localhost:3000/ws')
    })

    it('calls onOpen when the socket opens', () => {
      const onOpen = vi.fn()
      const socket = new RoomSocket({ onOpen, onMessage: vi.fn(), onClose: vi.fn(), onError: vi.fn() })
      socket.connect('ws://localhost:3000/ws')
      getMock().simulateOpen()
      expect(onOpen).toHaveBeenCalledOnce()
    })

    it('does not open a second socket if already connected (double-connect guard)', () => {
      const socket = new RoomSocket({ onOpen: vi.fn(), onMessage: vi.fn(), onClose: vi.fn(), onError: vi.fn() })
      socket.connect('ws://localhost:3000/ws')
      const firstInstance = mockWsInstance

      socket.connect('ws://localhost:3000/ws')
      expect(mockWsInstance).toBe(firstInstance)
    })
  })

  describe('send()', () => {
    it('sends a JSON-serialised message when the socket is open', () => {
      const socket = new RoomSocket({ onOpen: vi.fn(), onMessage: vi.fn(), onClose: vi.fn(), onError: vi.fn() })
      socket.connect('ws://localhost:3000/ws')
      getMock().simulateOpen()

      socket.send({ type: 'join', roomCode: 'purple-falcon-bridge' })
      expect(getMock().sentMessages).toEqual([JSON.stringify({ type: 'join', roomCode: 'purple-falcon-bridge' })])
    })

    it('is a no-op when the socket is not open', () => {
      const socket = new RoomSocket({ onOpen: vi.fn(), onMessage: vi.fn(), onClose: vi.fn(), onError: vi.fn() })
      socket.connect('ws://localhost:3000/ws')
      getMock().readyState = MockWebSocket.CLOSED

      socket.send({ type: 'leave' })
      expect(getMock().sentMessages).toHaveLength(0)
    })
  })

  describe('onMessage', () => {
    it('dispatches parsed ServerMessage to the onMessage callback', () => {
      const onMessage = vi.fn()
      const socket = new RoomSocket({ onOpen: vi.fn(), onMessage, onClose: vi.fn(), onError: vi.fn() })
      socket.connect('ws://localhost:3000/ws')

      getMock().simulateMessage(JSON.stringify({ type: 'room_expired' }))

      expect(onMessage).toHaveBeenCalledOnce()
      const msg = onMessage.mock.calls[0][0] as ServerMessage
      expect(msg.type).toBe('room_expired')
    })

    it('silently drops unparseable frames', () => {
      const onMessage = vi.fn()
      const socket = new RoomSocket({ onOpen: vi.fn(), onMessage, onClose: vi.fn(), onError: vi.fn() })
      socket.connect('ws://localhost:3000/ws')

      getMock().simulateMessage('not valid json')
      expect(onMessage).not.toHaveBeenCalled()
    })
  })

  describe('disconnect()', () => {
    it('closes the WebSocket', () => {
      const onClose = vi.fn()
      const socket = new RoomSocket({ onOpen: vi.fn(), onMessage: vi.fn(), onClose, onError: vi.fn() })
      socket.connect('ws://localhost:3000/ws')
      socket.disconnect()
      expect(onClose).toHaveBeenCalledOnce()
    })

    it('allows reconnecting after disconnect', () => {
      const socket = new RoomSocket({ onOpen: vi.fn(), onMessage: vi.fn(), onClose: vi.fn(), onError: vi.fn() })
      socket.connect('ws://localhost:3000/ws')
      const first = mockWsInstance

      socket.disconnect()
      socket.connect('ws://localhost:3000/ws')
      expect(mockWsInstance).not.toBe(first)
    })
  })

  describe('onError', () => {
    it('calls onError callback when the socket errors', () => {
      const onError = vi.fn()
      const socket = new RoomSocket({ onOpen: vi.fn(), onMessage: vi.fn(), onClose: vi.fn(), onError })
      socket.connect('ws://localhost:3000/ws')
      getMock().simulateError()
      expect(onError).toHaveBeenCalledOnce()
    })
  })

  describe('isOpen', () => {
    it('returns false before connecting', () => {
      const socket = new RoomSocket({ onOpen: vi.fn(), onMessage: vi.fn(), onClose: vi.fn(), onError: vi.fn() })
      expect(socket.isOpen).toBe(false)
    })

    it('returns true when readyState is OPEN', () => {
      const socket = new RoomSocket({ onOpen: vi.fn(), onMessage: vi.fn(), onClose: vi.fn(), onError: vi.fn() })
      socket.connect('ws://localhost:3000/ws')
      getMock().readyState = MockWebSocket.OPEN
      expect(socket.isOpen).toBe(true)
    })
  })
})
