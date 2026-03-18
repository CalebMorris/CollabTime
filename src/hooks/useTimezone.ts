import { useState, useEffect } from 'react'

const STORAGE_KEY = 'collabtime:timezone'

function getInitialTimezone(): string {
  return (
    localStorage.getItem(STORAGE_KEY) ??
    Intl.DateTimeFormat().resolvedOptions().timeZone
  )
}

export function useTimezone() {
  const [timezone, setTimezoneState] = useState<string>(getInitialTimezone)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, timezone)
  }, [timezone])

  return { timezone, setTimezone: setTimezoneState }
}
