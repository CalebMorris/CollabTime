interface Props {
  onStartParty: () => void
  onJoinParty: () => void
  accepting: boolean
  loadingCapacity: boolean
}

export function CoordinateSection({ onStartParty, onJoinParty, accepting, loadingCapacity }: Props) {
  const disabled = loadingCapacity || !accepting

  function handleStartParty() {
    if (!disabled) onStartParty()
  }

  function handleJoinParty() {
    if (!disabled) onJoinParty()
  }

  return (
    <section aria-labelledby="coordinate-heading" className="flex flex-col gap-3">
      <h2
        id="coordinate-heading"
        className="text-xs font-semibold tracking-widest uppercase text-gray-400"
      >
        Coordinate
      </h2>
      {!loadingCapacity && !accepting && (
        <p className="text-sm text-gray-400">Party rooms are temporarily unavailable.</p>
      )}
      <div className="flex flex-col gap-2">
        <button
          onClick={handleStartParty}
          aria-disabled={disabled || undefined}
          className={`min-h-[44px] w-full rounded-lg px-4 py-2 text-sm font-semibold focus-visible:outline focus-visible:outline-2 ${
            disabled
              ? 'cursor-not-allowed bg-indigo-900 text-indigo-400 focus-visible:outline-indigo-900'
              : 'bg-indigo-600 text-white hover:bg-indigo-500 focus-visible:outline-indigo-500'
          }`}
        >
          Start a Party
        </button>
        <button
          onClick={handleJoinParty}
          aria-disabled={disabled || undefined}
          className={`min-h-[44px] w-full rounded-lg border px-4 py-2 text-sm font-semibold focus-visible:outline focus-visible:outline-2 ${
            disabled
              ? 'cursor-not-allowed border-gray-800 bg-gray-900 text-gray-600 focus-visible:outline-gray-800'
              : 'border-gray-700 bg-gray-800 text-gray-200 hover:bg-gray-700 focus-visible:outline-gray-500'
          }`}
        >
          Join a Party
        </button>
      </div>
    </section>
  )
}
