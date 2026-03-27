import { useTranslation } from 'react-i18next'

interface Props {
  secondsRemaining: number | null
}

export function ReconnectingBanner({ secondsRemaining }: Props) {
  const { t } = useTranslation()
  if (secondsRemaining === null) return null

  return (
    <div
      role="alert"
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center gap-3 bg-amber-500/95 px-4 py-3 text-sm font-medium text-amber-950 shadow-md animate-slide-down"
    >
      <span>{t('reconnectingBanner.reconnecting', { secondsRemaining })}</span>
      <span className="opacity-70">—</span>
      <span>{t('reconnectingBanner.slotHeld')}</span>
    </div>
  )
}
