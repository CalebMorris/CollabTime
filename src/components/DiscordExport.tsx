import { useState } from 'react'
import { getAllFormats } from '../utils/discordTimestamp'

interface Props {
  timestamp: number | null
  timezone: string
}

export function DiscordExport({ timestamp, timezone }: Props) {
  const [copiedFlag, setCopiedFlag] = useState<string | null>(null)

  if (timestamp === null) return null

  const unixSeconds = Math.floor(timestamp / 1000)
  const formats = getAllFormats(unixSeconds, timezone)

  const handleCopy = (code: string, flag: string) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopiedFlag(flag)
      setTimeout(() => setCopiedFlag(null), 2000)
    })
  }

  return (
    <div className="flex flex-col gap-2">
      {formats.map(({ flag, code, label, preview }) => (
        <div key={flag} className="flex items-center gap-3 rounded bg-gray-800 px-3 py-2">
          <span className="w-28 text-xs text-gray-400 shrink-0">{label}</span>
          <div className="flex-1 min-w-0">
            <p data-testid={`preview-${flag}`} className="text-sm text-gray-100 truncate">
              {preview}
            </p>
            <code className="text-xs text-indigo-400 font-mono truncate block">{code}</code>
          </div>
          <button
            aria-label={`Copy ${label}`}
            onClick={() => handleCopy(code, flag)}
            className="text-xs px-2 py-0.5 rounded bg-gray-700 hover:bg-gray-600 text-gray-200 shrink-0"
          >
            {copiedFlag === flag ? 'Copied!' : 'Copy'}
          </button>
        </div>
      ))}
    </div>
  )
}
