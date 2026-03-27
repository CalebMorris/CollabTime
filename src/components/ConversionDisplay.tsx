import { useTranslation } from 'react-i18next'
import { formatInTimezone, formatUtc, formatCountdown } from '../utils/formatTime'
import { useCurrentTime } from '../hooks/useCurrentTime'

interface Props {
  timestamp: number | null
  timezone: string
}

export function ConversionDisplay({ timestamp, timezone }: Props) {
  const { t } = useTranslation()
  const nowMs = useCurrentTime(1_000)

  if (timestamp === null) {
    return (
      <div data-testid="result-placeholder" className="rounded bg-gray-800 p-4 flex flex-col gap-3">
        <div>
          <p className="text-xs text-gray-400 mb-0.5">{t('conversionDisplay.localTime')}</p>
          <p className="text-xs text-gray-500 mb-1">&nbsp;</p>
          <p className="font-medium text-gray-400">— : —</p>
        </div>
        <div>
          <p className="text-xs text-gray-400 mb-0.5">{t('conversionDisplay.utc')}</p>
          <p className="font-medium text-gray-400">— : —</p>
        </div>
      </div>
    )
  }

  const countdownStr = formatCountdown(timestamp, nowMs)
  const isFuture = timestamp > nowMs

  const countdownAriaLabel = countdownStr
    ? countdownStr
        .replace(/(\d+)d/, `$1 ${t('conversionDisplay.days')}`)
        .replace(/(\d+)h/, `$1 ${t('conversionDisplay.hours')}`)
        .replace(/(\d+)m/, `$1 ${t('conversionDisplay.minutes')}`)
        .replace(/(\d+)s/, `$1 ${t('conversionDisplay.seconds')}`)
    : undefined

  return (
    <div className="rounded bg-gray-800 p-4 flex flex-col gap-3">
      {countdownStr !== null && (
        <div className="pb-3 border-b border-gray-700 flex items-center gap-2">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-current animate-pulse text-gray-300 shrink-0" aria-hidden="true" />
          <p
            data-testid="countdown"
            aria-label={`${isFuture ? t('conversionDisplay.in') : t('conversionDisplay.ago')} ${countdownAriaLabel}`}
            className={`font-medium tabular-nums ${
              isFuture ? 'text-emerald-400' : 'text-gray-400'
            }`}
          >
            <span className="text-xs text-gray-300 font-normal mr-1">{isFuture ? t('conversionDisplay.in') : t('conversionDisplay.ago')}</span>
            {countdownStr}
          </p>
        </div>
      )}
      <div>
        <p className="text-xs text-gray-300 mb-0.5">{t('conversionDisplay.localTime')}</p>
        <p className="text-xs text-indigo-400 mb-1">{timezone}</p>
        <p data-testid="local-time" className="font-medium text-gray-100">
          {formatInTimezone(timestamp, timezone)}
        </p>
      </div>
      <div>
        <p className="text-xs text-gray-300 mb-0.5">{t('conversionDisplay.utc')}</p>
        <p data-testid="utc-time" className="font-medium text-gray-100">
          {formatUtc(timestamp)}
        </p>
      </div>
    </div>
  )
}
