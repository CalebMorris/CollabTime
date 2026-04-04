interface CapacityResponse {
  accepting_rooms: boolean
  reason: string | null
}

export async function fetchPartyCapacity(serverUrl: string): Promise<boolean> {
  try {
    const response = await fetch(`${serverUrl}/capacity`)
    if (response.status === 429) return true
    if (!response.ok) return false
    const data = await response.json() as CapacityResponse
    return data.accepting_rooms
  } catch {
    return false
  }
}
