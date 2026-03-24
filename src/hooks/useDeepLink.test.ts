import { renderHook } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useDeepLink } from './useDeepLink'

describe('useDeepLink', () => {
  const originalLocation = window.location

  beforeEach(() => {
    vi.spyOn(history, 'replaceState').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
    Object.defineProperty(window, 'location', { value: originalLocation, configurable: true })
  })

  it('calls onLoad with ms when ?t= is present on mount', () => {
    Object.defineProperty(window, 'location', {
      value: { ...originalLocation, search: '?t=1543392060' },
      configurable: true,
    })
    const onLoad = vi.fn()
    renderHook(() => useDeepLink(onLoad, null))
    expect(onLoad).toHaveBeenCalledWith(1543392060000)
  })

  it('does not call onLoad when ?t= is absent', () => {
    Object.defineProperty(window, 'location', {
      value: { ...originalLocation, search: '' },
      configurable: true,
    })
    const onLoad = vi.fn()
    renderHook(() => useDeepLink(onLoad, null))
    expect(onLoad).not.toHaveBeenCalled()
  })

  it('calls history.replaceState when timestamp changes', () => {
    Object.defineProperty(window, 'location', {
      value: { ...originalLocation, search: '' },
      configurable: true,
    })
    renderHook(() => useDeepLink(() => {}, 1543392060000))
    expect(history.replaceState).toHaveBeenCalledWith(null, '', '?t=1543392060')
  })

  it('does not call history.replaceState when timestamp is null', () => {
    renderHook(() => useDeepLink(() => {}, null))
    expect(history.replaceState).not.toHaveBeenCalled()
  })

  it('does not call onLoad when enabled is false, even with ?t= present', () => {
    Object.defineProperty(window, 'location', {
      value: { ...originalLocation, search: '?t=1543392060' },
      configurable: true,
    })
    const onLoad = vi.fn()
    renderHook(() => useDeepLink(onLoad, null, false))
    expect(onLoad).not.toHaveBeenCalled()
  })

  it('does not call history.replaceState when enabled is false, even with a timestamp', () => {
    Object.defineProperty(window, 'location', {
      value: { ...originalLocation, search: '' },
      configurable: true,
    })
    renderHook(() => useDeepLink(() => {}, 1543392060000, false))
    expect(history.replaceState).not.toHaveBeenCalled()
  })
})
