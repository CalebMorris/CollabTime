import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, beforeEach } from 'vitest'
import { useTimezone } from './useTimezone'

const STORAGE_KEY = 'collabtime:timezone'

describe('useTimezone', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('initialises from Intl when localStorage is empty', () => {
    const detected = Intl.DateTimeFormat().resolvedOptions().timeZone
    const { result } = renderHook(() => useTimezone())
    expect(result.current.timezone).toBe(detected)
  })

  it('initialises from localStorage when a value is persisted', () => {
    localStorage.setItem(STORAGE_KEY, 'Europe/Paris')
    const { result } = renderHook(() => useTimezone())
    expect(result.current.timezone).toBe('Europe/Paris')
  })

  it('updates the returned timezone value after setTimezone', () => {
    const { result } = renderHook(() => useTimezone())
    act(() => {
      result.current.setTimezone('Asia/Tokyo')
    })
    expect(result.current.timezone).toBe('Asia/Tokyo')
  })

  it('persists to localStorage when timezone changes', () => {
    const { result } = renderHook(() => useTimezone())
    act(() => {
      result.current.setTimezone('Asia/Tokyo')
    })
    expect(localStorage.getItem(STORAGE_KEY)).toBe('Asia/Tokyo')
  })
})
