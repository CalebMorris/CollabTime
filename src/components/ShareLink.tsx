import { useState } from 'react'
import { encodeDeepLink } from '../utils/deepLink'

interface Props {
  timestamp: number | null
}

export function ShareLink({ timestamp }: Props) {
  const [copied, setCopied] = useState(false)

  if (timestamp === null) return null

  const url = `${window.location.origin}${window.location.pathname}${encodeDeepLink(timestamp)}`

  const handleCopy = () => {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="flex items-center gap-2 rounded bg-gray-800 px-3 py-2">
      <code className="flex-1 text-sm text-indigo-300 font-mono truncate">{url}</code>
      <button
        aria-label="Copy link"
        onClick={handleCopy}
        className="text-xs px-2 py-0.5 rounded bg-gray-700 hover:bg-gray-600 text-gray-200 shrink-0"
      >
        {copied ? 'Copied!' : 'Copy link'}
      </button>
    </div>
  )
}
