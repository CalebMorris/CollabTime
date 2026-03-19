import { useState } from 'react'
import { filterTimezones, getAllTimezones } from '../utils/timezones'

interface Props {
  value: string
  onChange: (tz: string) => void
}

const ALL_ZONES = getAllTimezones()

export function TimezoneSelect({ value, onChange }: Props) {
  const [query, setQuery] = useState('')
  const [focusedIndex, setFocusedIndex] = useState(-1)

  const filtered = filterTimezones(query, ALL_ZONES)

  // Clamp focusedIndex to the current list length so stale indices stay valid
  const safeIndex = Math.min(focusedIndex, filtered.length - 1)
  const highlightedTz = safeIndex >= 0 ? filtered[safeIndex] : null

  const commit = (tz: string | null | undefined) => {
    if (tz && tz !== value) onChange(tz)
  }

  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value)
    setFocusedIndex(-1)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setFocusedIndex(prev => Math.min(prev + 1, filtered.length - 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        // ArrowUp from -1 or 0 stays put; otherwise move up
        setFocusedIndex(prev => (prev <= 0 ? prev : prev - 1))
        break
      case 'Enter':
        // Commit the keyboard-highlighted item, or the sole remaining item
        commit(highlightedTz ?? (filtered.length === 1 ? filtered[0] : null))
        break
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <input
        type="text"
        aria-label="Search timezones"
        placeholder="Search timezones…"
        value={query}
        onChange={handleQueryChange}
        onKeyDown={handleKeyDown}
        className="rounded bg-gray-800 px-2 py-1 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
      />
      <select
        aria-label="Select timezone"
        value={highlightedTz ?? value}
        onClick={e => commit((e.target as HTMLSelectElement).value)}
        onChange={() => {}}
        size={6}
        className={`rounded bg-gray-800 text-sm text-gray-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 ${filtered.length === 1 ? 'ring-1 ring-indigo-400' : ''}`}
      >
        {filtered.map(tz => (
          <option key={tz} value={tz}>
            {tz}
          </option>
        ))}
      </select>
    </div>
  )
}
