import { describe, it, expect, vi, afterEach } from 'vitest'
import { fetchPartyCapacity } from './fetchPartyCapacity'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('fetchPartyCapacity', () => {
  it('returns true when server responds accepting_rooms: true', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ accepting_rooms: true, reason: null }),
    }))
    expect(await fetchPartyCapacity('http://localhost:3000')).toBe(true)
  })

  it('returns false when server responds accepting_rooms: false', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ accepting_rooms: false, reason: 'HIGH_LOAD' }),
    }))
    expect(await fetchPartyCapacity('http://localhost:3000')).toBe(false)
  })

  it('returns false on network error (server unreachable)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')))
    expect(await fetchPartyCapacity('http://localhost:3000')).toBe(false)
  })

  it('fails open (returns true) on 429 rate limit', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
      json: () => Promise.resolve({ error: 'Too Many Requests' }),
    }))
    expect(await fetchPartyCapacity('http://localhost:3000')).toBe(true)
  })

  it('calls the correct URL', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ accepting_rooms: true, reason: null }),
    })
    vi.stubGlobal('fetch', mockFetch)
    await fetchPartyCapacity('http://example.com')
    expect(mockFetch).toHaveBeenCalledWith('http://example.com/capacity')
  })
})
