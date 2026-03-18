import { useState } from 'react'
import { filterTimezones, getAllTimezones } from '../utils/timezones'

interface Props {
  value: string
  onChange: (tz: string) => void
}

const ALL_ZONES = getAllTimezones()

export function TimezoneSelect({ value, onChange }: Props) {
  const [query, setQuery] = useState('')
  const filtered = filterTimezones(query, ALL_ZONES)

  return (
    <div className="flex flex-col gap-1">
      <input
        type="text"
        aria-label="Search timezones"
        placeholder="Search timezones…"
        value={query}
        onChange={e => setQuery(e.target.value)}
        className="rounded bg-gray-800 px-2 py-1 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
      />
      <select
        aria-label="Select timezone"
        value={value}
        onChange={e => onChange(e.target.value)}
        size={6}
        className="rounded bg-gray-800 text-sm text-gray-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
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
