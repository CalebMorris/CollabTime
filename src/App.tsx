import { useRef, useState, useEffect } from 'react'
import { useTimezone } from './hooks/useTimezone'
import { useDeepLink } from './hooks/useDeepLink'
import { TextImport } from './components/TextImport'
import { ManualSelector } from './components/ManualSelector'
import { ConversionDisplay } from './components/ConversionDisplay'
import { DiscordExport } from './components/DiscordExport'
import { ShareLink } from './components/ShareLink'
import { TimezoneSelect } from './components/TimezoneSelect'
import { getAllFormats } from './utils/discordTimestamp'

function App() {
  const { timezone, setTimezone } = useTimezone()
  const [timestamp, setTimestamp] = useState<number | null>(null)
  const [importText, setImportText] = useState<string | null>(null)
  const [timezonePickerOpen, setTimezonePickerOpen] = useState(false)
  const resultRef = useRef<HTMLElement | null>(null)
  const timezonePickerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!timezonePickerOpen) return
    const handleClickOutside = (e: MouseEvent) => {
      if (timezonePickerRef.current && !timezonePickerRef.current.contains(e.target as Node)) {
        setTimezonePickerOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [timezonePickerOpen])

  const handleDeepLinkLoad = (ms: number) => {
    setTimestamp(ms)
    const preview = getAllFormats(Math.floor(ms / 1000), timezone).find(f => f.flag === 'f')?.preview ?? null
    setImportText(preview)
  }

  useDeepLink(handleDeepLinkLoad, timestamp)

  const handleSetTimestamp = (ms: number) => {
    setTimestamp(ms)
    if (resultRef.current?.scrollIntoView) {
      resultRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <main className="min-h-screen bg-gray-950 text-gray-100 overflow-x-hidden">
      <header className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
        <h1 className="text-lg font-bold tracking-tight">CollabTime</h1>
        <div className="relative" ref={timezonePickerRef}>
          <button
            aria-haspopup="listbox"
            aria-expanded={timezonePickerOpen}
            onClick={() => setTimezonePickerOpen(prev => !prev)}
            className="flex items-center gap-1.5 rounded-full border border-gray-700 bg-gray-900 px-3 py-1 text-sm text-gray-300 hover:text-gray-100 hover:border-gray-600"
          >
            <span>{timezone}</span>
            <span aria-hidden="true" className="text-xs text-gray-500">{timezonePickerOpen ? '▾' : '▸'}</span>
          </button>
          {timezonePickerOpen && (
            <div className="absolute right-0 mt-1 w-72 z-10 rounded-lg border border-gray-700 bg-gray-900 p-2 shadow-lg">
              <TimezoneSelect
                value={timezone}
                initialQuery=""
                autoFocus
                onChange={(tz) => {
                  setTimezone(tz)
                  setTimezonePickerOpen(false)
                }}
              />
            </div>
          )}
        </div>
      </header>

      <div className={`max-w-5xl mx-auto px-4 py-8 ${timestamp !== null ? 'md:flex md:items-start md:gap-8' : ''}`}>

        {/* Left column — always visible */}
        <div className={`flex flex-col gap-6 ${timestamp !== null ? 'md:w-[28rem] md:flex-shrink-0 animate-slide-to-left' : 'max-w-md mx-auto w-full'}`}>
          <section aria-labelledby="section-input">
            <h2
              id="section-input"
              className="text-xs font-semibold tracking-widest uppercase text-gray-400 mb-3"
            >
              Pick a Time
            </h2>
            <div className="rounded-lg border border-gray-800 bg-gray-900 p-4 flex flex-col gap-4">
              <TextImport onTime={handleSetTimestamp} externalValue={importText} />
              <div className="flex items-center gap-3 text-xs text-gray-400">
                <div className="flex-1 border-t border-gray-800" />
                <span>or</span>
                <div className="flex-1 border-t border-gray-800" />
              </div>
              <ManualSelector
                timezone={timezone}
                onTime={handleSetTimestamp}
                value={timestamp}
              />
            </div>
          </section>

          <section ref={resultRef} aria-labelledby="section-result">
            <h2
              id="section-result"
              className="text-xs font-semibold tracking-widest uppercase text-gray-400 mb-3"
            >
              Result
            </h2>
            <ConversionDisplay timestamp={timestamp} timezone={timezone} />
          </section>
        </div>

        {/* Right column — slides in when a time is selected */}
        {timestamp !== null && (
          <section
            aria-labelledby="section-export"
            className="flex flex-col gap-3 mt-6 md:mt-0 md:flex-1 md:sticky md:top-8 animate-slide-in-from-right"
          >
            <h2
              id="section-export"
              className="text-xs font-semibold tracking-widest uppercase text-gray-500"
            >
              Share &amp; Export
            </h2>
            <ShareLink timestamp={timestamp} />
            <div className="rounded-lg border border-gray-700 bg-gray-900 p-3">
              <DiscordExport timestamp={timestamp} timezone={timezone} />
            </div>
          </section>
        )}

      </div>
    </main>
  )
}

export default App
