import { useEffect } from 'react'
import { formatInTimezone } from '../../utils/formatTime'

interface Props {
  confirmedMs: number
  participantCount: number
  timezone: string
  onDismiss: () => void
}

const AUTO_DISMISS_MS = 2500

export function LockInModal({ confirmedMs, participantCount, timezone, onDismiss }: Props) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, AUTO_DISMISS_MS)
    return () => clearTimeout(timer)
  }, [onDismiss])

  const formattedTime = formatInTimezone(confirmedMs, timezone)

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="lock-in-heading"
      onClick={onDismiss}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-gray-950/95 backdrop-blur-sm cursor-pointer animate-fade-in"
    >
      <div className="flex flex-col items-center gap-6 p-8 text-center max-w-sm">
        {/* Heading */}
        <div className="flex flex-col items-center gap-2">
          <span className="text-5xl select-none" aria-hidden="true">🎉</span>
          <h2
            id="lock-in-heading"
            className="text-3xl font-bold text-white"
          >
            Locked In!
          </h2>
        </div>

        {/* Agreed time */}
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/50 px-6 py-4">
          <p className="text-lg font-semibold text-emerald-300">{formattedTime}</p>
        </div>

        {/* Participant count */}
        <p className="text-sm text-gray-400">
          All {participantCount} on board
        </p>

        {/* Tap to dismiss hint */}
        <p className="text-xs text-gray-600">Tap anywhere to continue</p>
      </div>
    </div>
  )
}
