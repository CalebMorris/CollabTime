import { formatInTimezone, formatUtc, formatCountdown } from '../utils/formatTime'
import { useCurrentTime } from '../hooks/useCurrentTime'

interface Props {
  timestamp: number | null
  timezone: string
}

export function ConversionDisplay({ timestamp, timezone }: Props) {
  const nowMs = useCurrentTime(1_000)

  if (timestamp === null) {
    return (
      <div data-testid="result-placeholder" className="rounded bg-gray-800 p-4 flex flex-col gap-3">
        <div>
          <p className="text-xs text-gray-400 mb-0.5">Local time</p>
          <p className="text-xs text-gray-500 mb-1">&nbsp;</p>
          <p className="font-medium text-gray-400">— : —</p>
        </div>
        <div>
          <p className="text-xs text-gray-400 mb-0.5">UTC</p>
          <p className="font-medium text-gray-400">— : —</p>
        </div>
      </div>
    )
  }

  const countdownStr = formatCountdown(timestamp, nowMs)
  const isFuture = timestamp > nowMs

  const countdownAriaLabel = countdownStr
    ? countdownStr
        .replace(/(\d+)d/, '$1 days')
        .replace(/(\d+)h/, '$1 hours')
        .replace(/(\d+)m/, '$1 minutes')
        .replace(/(\d+)s/, '$1 seconds')
    : undefined

  return (
    <div className="rounded bg-gray-800 p-4 flex flex-col gap-3">
      {countdownStr !== null && (
        <div className="pb-3 border-b border-gray-700 flex items-center gap-2">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-current animate-pulse text-gray-300 shrink-0" aria-hidden="true" />
          <p
            data-testid="countdown"
            aria-label={`${isFuture ? 'In' : 'Ago'} ${countdownAriaLabel}`}
            className={`font-medium tabular-nums ${
              isFuture ? 'text-emerald-400' : 'text-gray-400'
            }`}
          >
            <span className="text-xs text-gray-300 font-normal mr-1">{isFuture ? 'In' : 'Ago'}</span>
            {countdownStr}
          </p>
        </div>
      )}
      <div>
        <p className="text-xs text-gray-300 mb-0.5">Local time</p>
        <p className="text-xs text-indigo-400 mb-1">{timezone}</p>
        <p data-testid="local-time" className="font-medium text-gray-100">
          {formatInTimezone(timestamp, timezone)}
        </p>
      </div>
      <div>
        <p className="text-xs text-gray-300 mb-0.5">UTC</p>
        <p data-testid="utc-time" className="font-medium text-gray-100">
          {formatUtc(timestamp)}
        </p>
      </div>
    </div>
  )
}
