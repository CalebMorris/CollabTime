import { useState } from 'react'
import { useTimezone } from './hooks/useTimezone'
import { TextImport } from './components/TextImport'
import { ManualSelector } from './components/ManualSelector'

function App() {
  const { timezone, setTimezone } = useTimezone()
  const [timestamp, setTimestamp] = useState<number | null>(null)

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

        {timestamp !== null && (
          <section className="rounded bg-gray-800 p-4">
            <h2 className="text-sm font-medium text-gray-400 mb-1">Selected time</h2>
            <p className="font-mono text-indigo-300">{new Date(timestamp).toISOString()}</p>
          </section>
        )}
      </div>
    </main>
  )
}

export default App
