import { useState } from 'react'

const ROOM_CODE_RE = /^[a-z]+-[a-z]+-[a-z]+$/

interface Props {
  attemptedCode: string
  onTryDifferent: (code: string) => void
  onStartNew: () => void
  onBackToSolo: () => void
}

export function PartyDeadRoom({ attemptedCode, onTryDifferent, onStartNew, onBackToSolo }: Props) {
  const [showInput, setShowInput] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const isValid = ROOM_CODE_RE.test(inputValue)

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm flex flex-col gap-6 text-center">

        {/* Error message */}
        <div className="flex flex-col gap-2">
          <span className="text-4xl" aria-hidden="true">🚪</span>
          <h1 className="text-2xl font-bold text-gray-100">Room not found</h1>
          <p className="text-sm text-gray-400">
            It may have expired or the code could be incorrect.
          </p>
          <p className="text-xs font-mono text-gray-500 mt-1">{attemptedCode}</p>
        </div>

        {/* Inline code entry (expands on demand) */}
        {showInput && (
          <div className="flex flex-col gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value.toLowerCase())}
              placeholder="word-word-word"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              inputMode="url"
              aria-label="Party room code"
              autoFocus
              className="min-h-[44px] w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm font-mono text-gray-100 placeholder-gray-500 focus:outline-none focus:border-indigo-500"
            />
            <button
              onClick={() => { if (isValid) onTryDifferent(inputValue) }}
              disabled={!isValid}
              className="min-h-[44px] w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Join
            </button>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-3">
          {!showInput && (
            <button
              onClick={() => setShowInput(true)}
              className="min-h-[44px] w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-sm text-gray-200 hover:bg-gray-700"
            >
              Try a Different Code
            </button>
          )}
          <button
            onClick={onStartNew}
            className="min-h-[44px] w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
          >
            Start a New Party
          </button>
          <button
            onClick={onBackToSolo}
            className="min-h-[44px] w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-sm text-gray-300 hover:bg-gray-700"
          >
            Go to Solo Mode
          </button>
        </div>

      </div>
    </div>
  )
}
