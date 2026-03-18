import { useTimezone } from './hooks/useTimezone'
import { TimezoneSelect } from './components/TimezoneSelect'

function App() {
  const { timezone, setTimezone } = useTimezone()

  return (
    <main className="min-h-screen bg-gray-950 text-gray-100">
      <h1 className="text-2xl font-bold p-8">CollabTime</h1>
      <section className="px-8 max-w-md">
        <label className="block text-sm font-medium text-gray-400 mb-2">
          Your timezone
        </label>
        <p className="text-indigo-300 text-sm mb-3">{timezone}</p>
        <TimezoneSelect value={timezone} onChange={setTimezone} />
      </section>
    </main>
  )
}

export default App
