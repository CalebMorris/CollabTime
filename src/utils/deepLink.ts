export function encodeDeepLink(ms: number): string {
  return `?t=${Math.floor(ms / 1000)}`
}

export function decodeDeepLink(search: string): number | null {
  const value = new URLSearchParams(search).get('t')
  if (!value) return null
  const n = Number(value)
  if (!Number.isFinite(n) || isNaN(n)) return null
  return n * 1000
}
