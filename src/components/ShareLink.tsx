import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Share2 } from 'lucide-react'
import { encodeDeepLink } from '../utils/appUrl'

interface Props {
  timestamp: number | null
}

export function ShareLink({ timestamp }: Props) {
  const { t } = useTranslation()
  const [copied, setCopied] = useState(false)

  const url = timestamp !== null
    ? `${window.location.origin}${window.location.pathname}${encodeDeepLink(timestamp)}`
    : null

  const handleCopy = () => {
    if (!url) return
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="flex items-center gap-2 rounded bg-gray-800 px-3 py-2">
      <code className="flex-1 text-sm text-indigo-300 font-mono truncate">
        {url ?? `${window.location.origin}${window.location.pathname}?time=…`}
      </code>
      <button
        aria-label={t('shareLink.copyAriaLabel')}
        aria-live="polite"
        onClick={handleCopy}
        className="min-h-[44px] px-3 rounded bg-gray-700 hover:bg-gray-600 text-gray-200 text-xs shrink-0"
      >
        {copied ? t('common.copied') : <Share2 className="w-4 h-4" />}
      </button>
    </div>
  )
}
