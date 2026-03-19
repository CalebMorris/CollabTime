import { useState } from 'react'
import { useTimezone } from './hooks/useTimezone'
import { useDeepLink } from './hooks/useDeepLink'
import { TextImport } from './components/TextImport'
import { ManualSelector } from './components/ManualSelector'
import { ConversionDisplay } from './components/ConversionDisplay'
import { DiscordExport } from './components/DiscordExport'
import { ShareLink } from './components/ShareLink'

function App() {
  const { timezone, setTimezone } = useTimezone()
  const [timestamp, setTimestamp] = useState<number | null>(null)

  useDeepLink(setTimestamp, timestamp)

  return (
    <main className="min-h-screen bg-gray-950 text-gray-100 p-8">
      <h1 className="text-2xl font-bold mb-8">CollabTime</h1>

      <div className="max-w-md flex flex-col gap-8">
        <section>
          <h2 className="text-sm font-medium text-gray-400 mb-2">Paste or type a time</h2>
          <TextImport onTime={setTimestamp} />
        </section>

        <section>
          <h2 className="text-sm font-medium text-gray-400 mb-2">Pick a time manually</h2>
          <ManualSelector
            timezone={timezone}
            onTimezoneChange={setTimezone}
            onTime={setTimestamp}
            value={timestamp}
          />
        </section>

        <ConversionDisplay timestamp={timestamp} timezone={timezone} />

        {timestamp !== null && (
          <>
            <section>
              <h2 className="text-sm font-medium text-gray-400 mb-2">Discord timestamps</h2>
              <DiscordExport timestamp={timestamp} timezone={timezone} />
            </section>

            <section>
              <h2 className="text-sm font-medium text-gray-400 mb-2">Share link</h2>
              <ShareLink timestamp={timestamp} />
            </section>
          </>
        )}
      </div>
    </main>
  )
}

export default App
