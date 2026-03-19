import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useCurrentTime } from './useCurrentTime'

describe('useCurrentTime', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns a number close to Date.now()', () => {
    const before = Date.now()
    const { result } = renderHook(() => useCurrentTime())
    expect(result.current).toBeGreaterThanOrEqual(before)
  })

  it('updates after the interval elapses', () => {
    const { result } = renderHook(() => useCurrentTime(60_000))
    const initial = result.current
    act(() => {
      vi.advanceTimersByTime(60_000)
    })
    expect(result.current).toBeGreaterThan(initial)
  })

  it('clears the interval on unmount', () => {
    const clearSpy = vi.spyOn(globalThis, 'clearInterval')
    const { unmount } = renderHook(() => useCurrentTime())
    unmount()
    expect(clearSpy).toHaveBeenCalled()
  })
})
