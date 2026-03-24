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
    if (this.ws !== null) return

    const ws = new WebSocket(url)
    this.ws = ws

    ws.onopen = () => this.callbacks.onOpen()
    ws.onclose = (event) => this.callbacks.onClose(event)
    ws.onerror = () => this.callbacks.onError()
    ws.onmessage = (event: MessageEvent) => {
      const msg = parseServerMessage(event.data as string)
      if (msg !== null) this.callbacks.onMessage(msg)
    }
  }

  send(msg: ClientMessage): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg))
    }
  }

  disconnect(): void {
    this.ws?.close()
    this.ws = null
  }

  get isOpen(): boolean {
    return this.ws?.readyState === WebSocket.OPEN
  }
}
