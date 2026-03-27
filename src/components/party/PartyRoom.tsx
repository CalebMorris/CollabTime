import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { RoomSocketFactory } from '../../room/RoomSocket'
import type { Participant } from '../../room/roomProtocol'
import { useRoom } from '../../hooks/useRoom'
import { useTimezone } from '../../hooks/useTimezone'
import { useKeyboardInset } from '../../hooks/useKeyboardInset'
import { TextImport } from '../TextImport'
import { ManualSelector } from '../ManualSelector'
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
  const { t } = useTranslation()
  const room = useRoom(roomCode, socketFactory)
  const { timezone } = useTimezone()
  const keyboardInset = useKeyboardInset()
  const [timestamp, setTimestamp] = useState<number | null>(null)

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
          aria-label={t('partyRoom.leaveAriaLabel')}
          className="min-h-[44px] rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-gray-100"
        >
          {t('partyRoom.leaveButton')}
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
                <p className="text-sm text-red-400">{t('partyRoom.errorCode', { errorCode: room.errorCode })}</p>
              )}
            </div>
          ) : (
            <div className="max-w-md mx-auto px-4 py-6 pb-24 flex flex-col gap-6">
              <section aria-labelledby="party-pick-heading">
                <h2
                  id="party-pick-heading"
                  className="text-xs font-semibold tracking-widest uppercase text-gray-400 mb-3"
                >
                  {t('common.pickATime')}
                </h2>
                <div className="rounded-lg border border-gray-800 bg-gray-900 p-4 flex flex-col gap-4">
                  <TextImport onTime={setTimestamp} externalValue={null} />
                  <div className="flex items-center gap-3 text-xs text-gray-400">
                    <div className="flex-1 border-t border-gray-800" />
                    <span>{t('common.or')}</span>
                    <div className="flex-1 border-t border-gray-800" />
                  </div>
                  <ManualSelector timezone={timezone} onTime={setTimestamp} value={timestamp} />
                </div>
              </section>

              {room.ownProposal && (
                <p className="text-xs text-gray-500 text-center">
                  {t('partyRoom.ownProposalHint')}
                </p>
              )}
            </div>
          )}
        </div>

      </div>

      {/* Sticky propose CTA — only shown when connected */}
      {isConnected && (
        <ProposeCtaBar
          timestamp={timestamp}
          roomPhase={room.roomPhase}
          keyboardInset={keyboardInset}
          onPropose={handlePropose}
        />
      )}
    </div>
  )
}

function ConnectionStatus({ phase }: { phase: string }) {
  const { t } = useTranslation()
  const phaseKey: Record<string, string> = {
    idle: 'partyRoom.connectionIdle',
    connecting: 'partyRoom.connectionConnecting',
    joining: 'partyRoom.connectionJoining',
    connected: 'partyRoom.connectionConnected',
    reconnecting: 'partyRoom.connectionReconnecting',
    connection_failed: 'partyRoom.connectionFailed',
    expired: 'partyRoom.connectionExpired',
  }
  return (
    <p className="text-sm text-gray-400" aria-live="polite">
      {phaseKey[phase] ? t(phaseKey[phase]) : phase}
    </p>
  )
}
