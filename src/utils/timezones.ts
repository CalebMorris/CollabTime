export function getAllTimezones(): string[] {
  return Intl.supportedValuesOf('timeZone')
}

export function filterTimezones(
  query: string,
  zones: string[] = getAllTimezones(),
): string[] {
  if (!query) return zones
  const q = query.toLowerCase()
  return zones.filter(tz => tz.toLowerCase().includes(q))
}
