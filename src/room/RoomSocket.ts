import { parseServerMessage } from './roomProtocol'
import type { ClientMessage, ServerMessage } from './roomProtocol'

export type RoomSocketFactory = (callbacks: RoomSocketCallbacks) => RoomSocket

export interface RoomSocketCallbacks {
  onOpen: () => void
  onMessage: (msg: ServerMessage) => void
  onClose: (event: CloseEvent) => void
  onError: () => void
}

export class RoomSocket {
  private ws: WebSocket | null = null
  private callbacks: RoomSocketCallbacks

  constructor(callbacks: RoomSocketCallbacks) {
    this.callbacks = callbacks
  }

  connect(url: string): void {
    if (this.ws !== null) {
      console.log('[RoomSocket] connect() called but socket already exists — skipping')
      return
    }

    console.log('[RoomSocket] connecting to', url)
    const ws = new WebSocket(url)
    this.ws = ws

    ws.onopen = () => {
      console.log('[RoomSocket] onOpen')
      this.callbacks.onOpen()
    }
    ws.onclose = (event) => {
      console.log('[RoomSocket] onClose', { code: event.code, reason: event.reason, wasClean: event.wasClean })
      this.callbacks.onClose(event)
    }
    ws.onerror = () => {
      console.log('[RoomSocket] onError')
      this.callbacks.onError()
    }
    ws.onmessage = (event: MessageEvent) => {
      const msg = parseServerMessage(event.data as string)
      if (msg !== null) {
        console.log('[RoomSocket] onMessage', msg.type, msg)
        this.callbacks.onMessage(msg)
      } else {
        console.warn('[RoomSocket] received unparseable message', event.data)
      }
    }
  }

  send(msg: ClientMessage): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      console.log('[RoomSocket] send', msg.type, msg)
      this.ws.send(JSON.stringify(msg))
    } else {
      console.warn('[RoomSocket] send() called but socket not open (readyState:', this.ws?.readyState, ')')
    }
  }

  disconnect(): void {
    console.log('[RoomSocket] disconnect() — readyState:', this.ws?.readyState)
    this.ws?.close()
    this.ws = null
  }

  get isOpen(): boolean {
    return this.ws?.readyState === WebSocket.OPEN
  }
}
