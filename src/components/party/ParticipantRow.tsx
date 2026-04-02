import type { Participant, Proposal } from '../../room/roomProtocol'
import { formatCompactInTimezone } from '../../utils/formatTime'

interface Props {
  participant: Participant
  proposal: Proposal | null
  isOwn: boolean
  viewerTimezone: string
  isLocked: boolean
  isRecentlyProposed?: boolean
}

export function ParticipantRow({ participant, proposal, isOwn, viewerTimezone, isLocked, isRecentlyProposed }: Props) {
  const isReconnecting = !participant.isConnected && proposal !== null
  const isDisconnected = !participant.isConnected && proposal === null

  const rowClass = [
    'flex items-start justify-between gap-3 px-3 py-2 rounded-lg text-sm transition-colors duration-300',
    isOwn ? 'border-l-2 border-indigo-500 pl-2 bg-gray-800/50' : '',
    isReconnecting || isDisconnected ? 'opacity-60' : '',
    isRecentlyProposed ? 'bg-indigo-500/20 ring-2 ring-indigo-400 ring-opacity-50' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={rowClass}>
      {/* Left: name + status */}
      <div className="flex flex-col min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className={`truncate ${isDisconnected ? 'line-through text-gray-600' : 'text-gray-200'}`}
          >
            {participant.nickname}
          </span>
          {isReconnecting && (
            <span className="text-xs text-amber-400 shrink-0">Reconnecting...</span>
          )}
          {isDisconnected && (
            <span className="text-xs text-gray-600 shrink-0">(left)</span>
          )}
        </div>
        {isOwn && (
          <span className="text-xs text-indigo-400">(You)</span>
        )}
      </div>

      {/* Right: proposal time or placeholder */}
      <div className="shrink-0 text-right">
        {isLocked && (
          <span className="text-emerald-400 font-semibold">✓</span>
        )}
        {!isLocked && proposal !== null ? (
          <span className={isReconnecting ? 'text-gray-400' : 'text-gray-100'}>
            {formatCompactInTimezone(proposal.epochMs, viewerTimezone)}
          </span>
        ) : !isLocked ? (
          <span className="text-gray-500">—</span>
        ) : null}
      </div>
    </div>
  )
}
