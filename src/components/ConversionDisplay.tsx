import { formatInTimezone, formatUtc } from '../utils/formatTime'

interface Props {
  timestamp: number | null
  timezone: string
}

export function ConversionDisplay({ timestamp, timezone }: Props) {
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

  return (
    <div className="rounded bg-gray-800 p-4 flex flex-col gap-3">
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
