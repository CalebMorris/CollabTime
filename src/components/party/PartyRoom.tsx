import { useEffect } from 'react'
import type { RoomSocketFactory } from '../../room/RoomSocket'
import { useRoom } from '../../hooks/useRoom'
import { RoomCodePill } from './RoomCodePill'
import { NicknameDisplay } from './NicknameDisplay'

interface Props {
  roomCode: string
  onLeave: () => void
  socketFactory?: RoomSocketFactory
}

export function PartyRoom({ roomCode, onLeave, socketFactory }: Props) {
  const room = useRoom(roomCode, socketFactory)

  // Connect on mount
  useEffect(() => {
    room.connect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleLeave = () => {
    room.disconnect()
    onLeave()
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
        <RoomCodePill roomCode={roomCode} />
        <button
          onClick={handleLeave}
          aria-label="Leave room"
          className="min-h-[44px] rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-gray-100"
        >
          Leave
        </button>
      </header>

      {/* Connection status */}
      <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8">
        <ConnectionStatus phase={room.connectionPhase} />
        {room.ownNickname && <NicknameDisplay nickname={room.ownNickname} />}
        {room.errorCode && (
          <p className="text-sm text-red-400">Error: {room.errorCode}</p>
        )}
      </div>
    </div>
  )
}

function ConnectionStatus({ phase }: { phase: string }) {
  const labels: Record<string, string> = {
    idle: 'Idle',
    connecting: 'Connecting...',
    joining: 'Joining...',
    connected: 'Connected',
    reconnecting: 'Reconnecting...',
    connection_failed: 'Connection failed',
    expired: 'Room expired',
  }
  return (
    <p className="text-sm text-gray-400" aria-live="polite">
      {labels[phase] ?? phase}
    </p>
  )
}
