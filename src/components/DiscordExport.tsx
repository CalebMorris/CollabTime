import { useState, useRef, useEffect } from 'react'
import { getAllFormats } from '../utils/discordTimestamp'
import { DiscordIcon } from './DiscordIcon'

interface Props {
  timestamp: number | null
  timezone: string
}

export function DiscordExport({ timestamp, timezone }: Props) {
  const [copiedFlag, setCopiedFlag] = useState<string | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) return
    if (!containerRef.current) return

    const prefersReducedMotion =
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false

    containerRef.current.scrollIntoView?.({
      behavior: prefersReducedMotion ? 'instant' : 'smooth',
      block: 'nearest',
    })
  }, [isOpen])

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
    <div ref={containerRef} className="flex flex-col gap-2">
      <button
        aria-label="Discord timestamps"
        aria-expanded={isOpen}
        onClick={() => setIsOpen(prev => !prev)}
        className="flex items-center justify-between w-full text-sm text-gray-300 hover:text-gray-100 py-1"
      >
        <span className="flex items-center gap-1.5">
          <DiscordIcon aria-hidden="true" className="w-4 h-4 text-indigo-400" />
          Discord timestamps
        </span>
        <span aria-hidden="true">{isOpen ? '▾' : '▸'}</span>
      </button>
      {isOpen && formats.map(({ flag, code, label, preview }) => (
        <div key={flag} className="flex items-center gap-3 rounded bg-gray-800 px-3 py-2 animate-fade-slide-up">
          <span className="w-28 text-xs text-gray-300 shrink-0">{label}</span>
          <div className="flex-1 min-w-0">
            <p data-testid={`preview-${flag}`} className="text-sm text-gray-100 truncate">
              {preview}
            </p>
            <code className="text-xs text-indigo-400 font-mono truncate block">{code}</code>
          </div>
          <button
            aria-label={`Copy ${label}`}
            aria-live="polite"
            onClick={() => handleCopy(code, flag)}
            className="min-h-[44px] px-3 rounded bg-gray-700 hover:bg-gray-600 text-gray-200 text-xs shrink-0"
          >
            {copiedFlag === flag ? 'Copied!' : 'Copy'}
          </button>
        </div>
      ))}
    </div>
  )
}
