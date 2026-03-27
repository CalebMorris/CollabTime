import { useId, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { getSortedTimezones } from '../utils/timezones'

interface Props {
  value: string
  onChange: (tz: string) => void
  autoFocus?: boolean
  initialQuery?: string
}

const ALL_ENTRIES = getSortedTimezones()

function filterEntries(query: string) {
  if (!query) return []
  const q = query.toLowerCase()
  return ALL_ENTRIES.filter(e => e.label.toLowerCase().includes(q))
}

export function TimezoneSelect({ value, onChange, autoFocus, initialQuery }: Props) {
  const { t } = useTranslation()
  const [query, setQuery] = useState(initialQuery !== undefined ? initialQuery : value)
  const [focusedIndex, setFocusedIndex] = useState(-1)

  const listboxId = useId()
  const optionIdPrefix = useId()

  const isDirty = query !== value
  const filtered = isDirty ? filterEntries(query) : []
  const safeIndex = focusedIndex >= 0 ? Math.min(focusedIndex, filtered.length - 1) : -1
  const focusedTz = safeIndex >= 0 ? filtered[safeIndex]?.tz : null
  const focusedOptionId = focusedTz
    ? `${optionIdPrefix}-${focusedTz.replace(/[^a-zA-Z0-9]/g, '-')}`
    : undefined

  const commit = (tz: string | null | undefined) => {
    if (tz && tz !== value) {
      onChange(tz)
      setQuery(tz)
    }
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
        setFocusedIndex(prev => (prev <= 0 ? prev : prev - 1))
        break
      case 'Enter':
        commit(focusedTz ?? (filtered.length === 1 ? filtered[0]?.tz : null))
        break
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <input
        type="text"
        role="combobox"
        aria-label={t('timezoneSelect.searchAriaLabel')}
        aria-expanded={filtered.length > 0}
        aria-controls={listboxId}
        aria-activedescendant={focusedOptionId}
        aria-haspopup="listbox"
        placeholder={t('timezoneSelect.placeholder')}
        value={query}
        onChange={handleQueryChange}
        onKeyDown={handleKeyDown}
        autoFocus={autoFocus}
        className="rounded bg-gray-800 px-2 py-1 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
      />
      {isDirty && !query && (
        <p className="px-2 py-1 text-sm text-gray-500">{t('timezoneSelect.typeToSearch')}</p>
      )}
      {isDirty && query && filtered.length === 0 && (
        <p className="px-2 py-1 text-sm text-gray-500">{t('timezoneSelect.noResults', { query })}</p>
      )}
      {filtered.length > 0 && (
      <div
        id={listboxId}
        role="listbox"
        aria-label={t('timezoneSelect.listboxAriaLabel')}
        className="rounded bg-gray-900 overflow-y-auto max-h-40"
      >
        {filtered.map(({ tz, label }, index) => {
          const optionId = `${optionIdPrefix}-${tz.replace(/[^a-zA-Z0-9]/g, '-')}`
          const isSelected = tz === value
          const isFocused = index === safeIndex
          const isSearchNarrowed = filtered.length === 1 && !isSelected && !isFocused
          return (
            // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/interactive-supports-focus
            <div
              key={tz}
              id={optionId}
              role="option"
              aria-selected={isSelected}
              onClick={() => commit(tz)}
              className={`px-2 py-1 text-sm cursor-pointer ${
                isFocused
                  ? 'bg-indigo-600 text-white'
                  : isSelected
                    ? 'bg-gray-600 text-gray-100'
                    : 'text-gray-100 hover:bg-gray-700'
              } ${isSearchNarrowed ? 'ring-1 ring-inset ring-indigo-400' : ''}`}
            >
              {label}
            </div>
          )
        })}
      </div>
      )}
      {query && (
        <p role="status" aria-live="polite" className="sr-only">
          {t('timezoneSelect.resultCount', { count: filtered.length })}
        </p>
      )}
    </div>
  )
}
