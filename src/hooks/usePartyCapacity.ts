import { useEffect, useRef, useState } from 'react'
import { fetchPartyCapacity } from '../utils/fetchPartyCapacity'

const POLL_INTERVAL_MS = 30_000

function wsUrlToHttpBase(wsUrl: string): string {
  return wsUrl.replace(/^ws/, 'http').replace(/\/ws$/, '')
}

export function usePartyCapacity(
  fetcher: (serverUrl: string) => Promise<boolean> = fetchPartyCapacity
): { accepting: boolean; loading: boolean } {
  const [accepting, setAccepting] = useState(true)
  const [loading, setLoading] = useState(true)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    const serverUrl = wsUrlToHttpBase(import.meta.env.VITE_WS_URL ?? '')
    let cancelled = false

    function clearPoll() {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }

    function startPolling() {
      intervalRef.current = setInterval(() => {
        fetcher(serverUrl)
          .then((result) => {
            if (cancelled) return
            setAccepting(result)
            if (result) clearPoll()
          })
          .catch(() => { /* stay unavailable, keep polling */ })
      }, POLL_INTERVAL_MS)
    }

    fetcher(serverUrl)
      .then((result) => {
        if (cancelled) return
        setAccepting(result)
        if (!result) startPolling()
      })
      .catch(() => {
        if (cancelled) return
        setAccepting(false)
        startPolling()
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
      clearPoll()
    }
  }, [fetcher])

  return { accepting, loading }
}
