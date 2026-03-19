import { useEffect, useRef } from 'react'
import { encodeDeepLink, decodeDeepLink } from '../utils/deepLink'

export function useDeepLink(
  onLoad: (ms: number) => void,
  timestamp: number | null,
): void {
  const onLoadRef = useRef(onLoad)
  onLoadRef.current = onLoad

  // Read ?t= once on mount
  useEffect(() => {
    const ms = decodeDeepLink(window.location.search)
    if (ms !== null) onLoadRef.current(ms)
  }, [])

  // Keep URL in sync whenever timestamp changes
  useEffect(() => {
    if (timestamp === null) return
    history.replaceState(null, '', encodeDeepLink(timestamp))
  }, [timestamp])
}
