interface Props {
  onStartParty: () => void
  onJoinParty: () => void
}

export function CoordinateSection({ onStartParty, onJoinParty }: Props) {
  return (
    <section aria-labelledby="coordinate-heading" className="flex flex-col gap-3">
      <h2
        id="coordinate-heading"
        className="text-xs font-semibold tracking-widest uppercase text-gray-400"
      >
        Coordinate
      </h2>
      <div className="flex flex-col gap-2">
        <button
          onClick={onStartParty}
          className="min-h-[44px] w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-500"
        >
          Start a Party
        </button>
        <button
          onClick={onJoinParty}
          className="min-h-[44px] w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-sm font-semibold text-gray-200 hover:bg-gray-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-gray-500"
        >
          Join a Party
        </button>
      </div>
    </section>
  )
}
