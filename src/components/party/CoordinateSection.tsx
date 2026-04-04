import { useEffect, useState } from 'react'

interface Props {
  onStartParty: () => void
  onJoinParty: () => void
  accepting: boolean
  loadingCapacity: boolean
}

export function CoordinateSection({ onStartParty, onJoinParty, accepting, loadingCapacity }: Props) {
  const functionallyDisabled = loadingCapacity || !accepting
  const visuallyDisabled = !loadingCapacity && !accepting

  const [showLoadingHint, setShowLoadingHint] = useState(false)
  useEffect(() => {
    if (!loadingCapacity) { setShowLoadingHint(false); return }
    const t = setTimeout(() => setShowLoadingHint(true), 200)
    return () => clearTimeout(t)
  }, [loadingCapacity])

  function handleStartParty() {
    if (!functionallyDisabled) onStartParty()
  }

  function handleJoinParty() {
    if (!functionallyDisabled) onJoinParty()
  }

  return (
    <section aria-labelledby="coordinate-heading" className="flex flex-col gap-3">
      <h2
        id="coordinate-heading"
        className="text-xs font-semibold tracking-widest uppercase text-gray-400"
      >
        Coordinate
      </h2>
      {showLoadingHint && (
        <p id="capacity-loading-hint" className="text-sm text-gray-400">One moment…</p>
      )}
      {!loadingCapacity && !accepting && (
        <p className="text-sm text-gray-400">Party rooms are temporarily unavailable.</p>
      )}
      <div className="flex flex-col gap-2">
        <button
          onClick={handleStartParty}
          aria-disabled={functionallyDisabled || undefined}
          aria-describedby={showLoadingHint ? 'capacity-loading-hint' : undefined}
          className={`min-h-[44px] w-full rounded-lg px-4 py-2 text-sm font-semibold focus-visible:outline focus-visible:outline-2 ${
            visuallyDisabled
              ? 'cursor-not-allowed bg-indigo-900 text-indigo-400 focus-visible:outline-indigo-900'
              : loadingCapacity
                ? 'cursor-wait opacity-60 bg-indigo-600 text-white focus-visible:outline-indigo-500'
                : 'bg-indigo-600 text-white hover:bg-indigo-500 focus-visible:outline-indigo-500'
          }`}
        >
          Start a Party
        </button>
        <button
          onClick={handleJoinParty}
          aria-disabled={functionallyDisabled || undefined}
          aria-describedby={showLoadingHint ? 'capacity-loading-hint' : undefined}
          className={`min-h-[44px] w-full rounded-lg border px-4 py-2 text-sm font-semibold focus-visible:outline focus-visible:outline-2 ${
            visuallyDisabled
              ? 'cursor-not-allowed border-gray-800 bg-gray-900 text-gray-600 focus-visible:outline-gray-800'
              : loadingCapacity
                ? 'cursor-wait opacity-60 border-gray-700 bg-gray-800 text-gray-200 focus-visible:outline-gray-500'
                : 'border-gray-700 bg-gray-800 text-gray-200 hover:bg-gray-700 focus-visible:outline-gray-500'
          }`}
        >
          Join a Party
        </button>
      </div>
    </section>
  )
}
