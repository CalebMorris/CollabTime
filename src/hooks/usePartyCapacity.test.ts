import { renderHook, waitFor, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { usePartyCapacity } from './usePartyCapacity'

describe('usePartyCapacity', () => {
  it('starts in loading state', () => {
    const fetcher = vi.fn(() => new Promise<boolean>(() => {})) // never resolves
    const { result } = renderHook(() => usePartyCapacity(fetcher))
    expect(result.current.loading).toBe(true)
  })

  it('sets accepting to true and loading to false when server accepts', async () => {
    const fetcher = vi.fn().mockResolvedValue(true)
    const { result } = renderHook(() => usePartyCapacity(fetcher))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.accepting).toBe(true)
  })

  it('sets accepting to false and loading to false when server is at capacity', async () => {
    const fetcher = vi.fn().mockResolvedValue(false)
    const { result } = renderHook(() => usePartyCapacity(fetcher))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.accepting).toBe(false)
  })

  it('sets accepting to false when fetcher rejects (server unreachable)', async () => {
    const fetcher = vi.fn().mockRejectedValue(new Error('fail'))
    const { result } = renderHook(() => usePartyCapacity(fetcher))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.accepting).toBe(false)
  })

  it('calls the fetcher exactly once on mount', async () => {
    const fetcher = vi.fn().mockResolvedValue(true)
    renderHook(() => usePartyCapacity(fetcher))
    await waitFor(() => expect(fetcher).toHaveBeenCalledOnce())
  })

  describe('polling when unavailable', () => {
    beforeEach(() => { vi.useFakeTimers() })
    afterEach(() => { vi.useRealTimers() })

    it('rechecks after 30s when unavailable', async () => {
      const fetcher = vi.fn().mockResolvedValue(false)
      renderHook(() => usePartyCapacity(fetcher))
      await act(() => Promise.resolve()) // flush initial fetch
      expect(fetcher).toHaveBeenCalledTimes(1)

      await act(() => vi.advanceTimersByTimeAsync(30_000))
      expect(fetcher).toHaveBeenCalledTimes(2)
    })

    it('keeps rechecking every 30s while unavailable', async () => {
      const fetcher = vi.fn().mockResolvedValue(false)
      renderHook(() => usePartyCapacity(fetcher))
      await act(() => Promise.resolve())

      await act(() => vi.advanceTimersByTimeAsync(90_000))
      expect(fetcher).toHaveBeenCalledTimes(4) // initial + 3 intervals
    })

    it('stops polling once accepting becomes true', async () => {
      const fetcher = vi.fn()
        .mockResolvedValueOnce(false)
        .mockResolvedValueOnce(true)
      renderHook(() => usePartyCapacity(fetcher))
      await act(() => Promise.resolve())

      await act(() => vi.advanceTimersByTimeAsync(30_000))
      expect(fetcher).toHaveBeenCalledTimes(2)

      await act(() => vi.advanceTimersByTimeAsync(60_000))
      expect(fetcher).toHaveBeenCalledTimes(2) // no further calls
    })

    it('does not poll when initially accepting', async () => {
      const fetcher = vi.fn().mockResolvedValue(true)
      renderHook(() => usePartyCapacity(fetcher))
      await act(() => Promise.resolve())

      await act(() => vi.advanceTimersByTimeAsync(90_000))
      expect(fetcher).toHaveBeenCalledTimes(1)
    })
  })
})
