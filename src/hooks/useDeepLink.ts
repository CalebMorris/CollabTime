import { useEffect, useRef } from 'react'
import { encodeDeepLink, decodeDeepLink } from '../utils/deepLink'

export function useDeepLink(
  onLoad: (ms: number) => void,
  timestamp: number | null,
  enabled: boolean = true,
): void {
  const onLoadRef = useRef(onLoad)
  onLoadRef.current = onLoad

  // Read ?t= once on mount
  useEffect(() => {
    if (!enabled) return
    const ms = decodeDeepLink(window.location.search)
    if (ms !== null) onLoadRef.current(ms)
  }, [enabled])

  // Keep URL in sync whenever timestamp changes
  useEffect(() => {
    if (!enabled) return
    if (timestamp === null) return
    history.replaceState(null, '', encodeDeepLink(timestamp))
  }, [enabled, timestamp])
}
