import { useEffect, useState, useRef } from 'react'
import type { RoomSocketFactory } from '../../room/RoomSocket'
import type { Participant } from '../../room/roomProtocol'
import { useRoom } from '../../hooks/useRoom'
import { useTimezone } from '../../hooks/useTimezone'
import { useKeyboardInset } from '../../hooks/useKeyboardInset'
import { TextImport } from '../TextImport'
import { ManualSelector } from '../ManualSelector'
import { ConversionDisplay } from '../ConversionDisplay'
import { RoomCodePill } from './RoomCodePill'
import { NicknameDisplay } from './NicknameDisplay'
import { ProposalsBoard } from './ProposalsBoard'
import { ProposeCtaBar } from './ProposeCtaBar'
import { ReconnectingBanner } from './ReconnectingBanner'
import { LockInModal } from './LockInModal'

interface Props {
  roomCode: string
  onLeave: () => void
  onLockIn?: (confirmedMs: number, participants: Participant[]) => void
  onDeadRoom?: (roomCode: string) => void
  socketFactory?: RoomSocketFactory
}

export function PartyRoom({ roomCode, onLeave, onLockIn, onDeadRoom, socketFactory }: Props) {
  const room = useRoom(roomCode, socketFactory)
  const { timezone } = useTimezone()
  const keyboardInset = useKeyboardInset()
  const resultRef = useRef<HTMLElement | null>(null)
  const [timestamp, setTimestamp] = useState<number | null>(null)

  const handleSetTimestamp = (ms: number) => {
    setTimestamp(ms)
    if (resultRef.current?.scrollIntoView) {
      resultRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  // Connect on mount
  useEffect(() => {
    room.connect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleLeave = () => {
    room.disconnect()
    onLeave()
  }

  const handlePropose = () => {
    if (timestamp !== null) room.propose(timestamp)
  }

  const isConnected = room.connectionPhase === 'connected'
  const isReconnecting = room.connectionPhase === 'reconnecting'
  const isLockedIn = room.roomPhase === 'locked_in'
  const [lockInDismissed, setLockInDismissed] = useState(false)
  const showLockInModal = isLockedIn && !lockInDismissed && room.lockedEpochMs !== null

  // Transition to export screen after modal is dismissed
  useEffect(() => {
    if (lockInDismissed && room.lockedEpochMs !== null) {
      onLockIn?.(room.lockedEpochMs, room.participants)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lockInDismissed])

  // Transition to dead room on ROOM_NOT_FOUND
  useEffect(() => {
    if (room.errorCode === 'ROOM_NOT_FOUND') {
      onDeadRoom?.(roomCode)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room.errorCode])

  return (
    <div className={`min-h-screen bg-gray-950 text-gray-100 flex flex-col ${isReconnecting ? 'pt-[52px]' : ''}`}>
      <ReconnectingBanner secondsRemaining={room.reconnectSecondsRemaining} />

      {showLockInModal && (
        <LockInModal
          confirmedMs={room.lockedEpochMs!}
          participantCount={room.participants.length}
          timezone={timezone}
          onDismiss={() => setLockInDismissed(true)}
        />
      )}

      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-gray-800 shrink-0">
        <div className="flex items-center gap-3">
          <RoomCodePill roomCode={roomCode} />
          {room.ownNickname && <NicknameDisplay nickname={room.ownNickname} />}
        </div>
        <button
          onClick={handleLeave}
          aria-label="Leave room"
          className="min-h-[44px] rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-gray-100"
        >
          Leave
        </button>
      </header>

      {/* Body */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">

        {/* Proposals column — left */}
        {isConnected && (
          <aside className="md:w-72 md:flex-shrink-0 overflow-y-auto border-b md:border-b-0 md:border-r border-gray-800 p-4">
            <ProposalsBoard
              participants={room.participants}
              proposals={room.proposals}
              ownParticipantToken={room.ownParticipantToken}
              viewerTimezone={timezone}
              isLocked={room.roomPhase === 'locked_in'}
            />
          </aside>
        )}

        {/* Center — time picker + status */}
        <div className="flex-1 overflow-y-auto">
          {!isConnected ? (
            <div className="flex flex-col items-center justify-center gap-4 h-full p-8">
              <ConnectionStatus phase={room.connectionPhase} />
              {room.errorCode && (
                <p className="text-sm text-red-400">Error: {room.errorCode}</p>
              )}
            </div>
          ) : (
            <div className="max-w-md mx-auto px-4 pt-6 pb-28 md:py-6 flex flex-col gap-6">
              <section aria-labelledby="party-pick-heading">
                <h2
                  id="party-pick-heading"
                  className="text-xs font-semibold tracking-widest uppercase text-gray-400 mb-3"
                >
                  Pick a Time
                </h2>
                <div className="rounded-lg border border-gray-800 bg-gray-900 p-4 flex flex-col gap-4">
                  <TextImport onTime={handleSetTimestamp} externalValue={null} />
                  <div className="flex items-center gap-3 text-xs text-gray-400">
                    <div className="flex-1 border-t border-gray-800" />
                    <span>or</span>
                    <div className="flex-1 border-t border-gray-800" />
                  </div>
                  <ManualSelector timezone={timezone} onTime={handleSetTimestamp} value={timestamp} />
                  {/* Desktop: inline CTA inside the card */}
                  <div className="hidden md:block">
                    <ProposeCtaBar
                      timestamp={timestamp}
                      roomPhase={room.roomPhase}
                      onPropose={handlePropose}
                    />
                  </div>
                </div>
              </section>

              <section ref={resultRef} aria-labelledby="party-result-heading">
                <h2
                  id="party-result-heading"
                  className="text-xs font-semibold tracking-widest uppercase text-gray-400 mb-3"
                >
                  Result
                </h2>
                <ConversionDisplay timestamp={timestamp} timezone={timezone} />
              </section>

              {room.ownProposal && (
                <p className="hidden md:block text-xs text-gray-500 text-center">
                  Your current proposal is on the board. Pick a new time to update it.
                </p>
              )}
            </div>
          )}
        </div>

      </div>

      {/* Mobile: pinned CTA bar, floats above the virtual keyboard */}
      {isConnected && (
        <div
          className="md:hidden fixed left-0 right-0 z-20 border-t border-gray-800 bg-gray-950/95 backdrop-blur-sm px-4 py-3"
          style={{ bottom: keyboardInset }}
        >
          {room.ownProposal && (
            <p className="text-xs text-gray-500 text-center mb-2">
              Your current proposal is on the board. Pick a new time to update it.
            </p>
          )}
          <ProposeCtaBar
            timestamp={timestamp}
            roomPhase={room.roomPhase}
            onPropose={handlePropose}
          />
        </div>
      )}
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
