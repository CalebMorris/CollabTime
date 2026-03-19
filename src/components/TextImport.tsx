import { useState } from 'react'
import { parseTime } from '../utils/parseTime'

interface Props {
  onTime: (ms: number) => void
}

export function TextImport({ onTime }: Props) {
  const [input, setInput] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleParse = () => {
    const result = parseTime(input)
    if (result.ok) {
      setError(null)
      onTime(result.timestamp)
    } else {
      setError(result.error)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleParse()
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <textarea
        aria-label="Enter time"
        rows={2}
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="e.g. tomorrow at 3pm, 2024-01-15T09:00:00Z, 1543392060"
        className="rounded bg-gray-800 px-2 py-1 text-sm text-gray-100 placeholder-gray-500 resize-none focus:outline-none focus:ring-1 focus:ring-indigo-500"
      />
      <button
        onClick={handleParse}
        className="self-start rounded bg-indigo-600 px-3 py-1 text-sm font-medium hover:bg-indigo-500"
      >
        Parse
      </button>
      {error && (
        <p role="alert" className="text-sm text-red-400">
          {error}
        </p>
      )}
    </div>
  )
}
