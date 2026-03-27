import { useTranslation } from 'react-i18next'
import type { Participant, Proposal } from '../../room/roomProtocol'
import { formatInTimezone } from '../../utils/formatTime'

interface Props {
  participant: Participant
  proposal: Proposal | null
  isOwn: boolean
  viewerTimezone: string
  isLocked: boolean
}

export function ParticipantRow({ participant, proposal, isOwn, viewerTimezone, isLocked }: Props) {
  const { t } = useTranslation()
  const isReconnecting = !participant.isConnected && proposal !== null
  const isDisconnected = !participant.isConnected && proposal === null

  const rowClass = [
    'flex items-center justify-between gap-3 px-3 py-2 rounded-lg text-sm',
    isOwn ? 'border-l-2 border-indigo-500 pl-2 bg-gray-800/50' : '',
    isReconnecting || isDisconnected ? 'opacity-60' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={rowClass}>
      {/* Left: name + status */}
      <div className="flex items-center gap-2 min-w-0">
        {isOwn && (
          <span className="text-xs text-indigo-400 shrink-0">{t('participantRow.you')}</span>
        )}
        <span
          className={`truncate ${isDisconnected ? 'line-through text-gray-600' : 'text-gray-200'}`}
        >
          {participant.nickname}
        </span>
        {isReconnecting && (
          <span className="text-xs text-amber-400 shrink-0">{t('participantRow.reconnecting')}</span>
        )}
        {isDisconnected && (
          <span className="text-xs text-gray-600 shrink-0">{t('participantRow.left')}</span>
        )}
      </div>

      {/* Right: proposal time or placeholder */}
      <div className="shrink-0 text-right">
        {isLocked && (
          <span className="text-emerald-400 font-semibold">✓</span>
        )}
        {!isLocked && proposal !== null ? (
          <span className={isReconnecting ? 'text-gray-400' : 'text-gray-100'}>
            {formatInTimezone(proposal.epochMs, viewerTimezone)}
          </span>
        ) : !isLocked ? (
          <span className="text-gray-500">—</span>
        ) : null}
      </div>
    </div>
  )
}
