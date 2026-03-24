import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useKeyboardInset } from './useKeyboardInset'

function mockVisualViewport(height: number, offsetTop: number = 0) {
  const listeners: Record<string, EventListener> = {}
  const vv = {
    height,
    offsetTop,
    addEventListener: vi.fn((event: string, handler: EventListener) => {
      listeners[event] = handler
    }),
    removeEventListener: vi.fn(),
  }
  Object.defineProperty(window, 'visualViewport', { value: vv, configurable: true })
  Object.defineProperty(window, 'innerHeight', { value: 844, configurable: true })
  return { vv, listeners }
}

beforeEach(() => {
  Object.defineProperty(window, 'innerHeight', { value: 844, configurable: true })
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('useKeyboardInset', () => {
  it('returns 0 when visualViewport fills the full window height', () => {
    mockVisualViewport(844, 0)
    const { result } = renderHook(() => useKeyboardInset())
    expect(result.current).toBe(0)
  })

  it('returns the keyboard height when viewport is shrunk by keyboard', () => {
    mockVisualViewport(500, 0) // keyboard takes 344px
    const { result } = renderHook(() => useKeyboardInset())
    expect(result.current).toBe(344)
  })

  it('accounts for offsetTop in the calculation', () => {
    mockVisualViewport(800, 20) // innerHeight=844, height=800, offsetTop=20 → 844-800-20=24
    const { result } = renderHook(() => useKeyboardInset())
    expect(result.current).toBe(24)
  })

  it('updates when the viewport resizes', () => {
    const { vv, listeners } = mockVisualViewport(844, 0)
    const { result } = renderHook(() => useKeyboardInset())
    expect(result.current).toBe(0)

    // Simulate keyboard appearing
    vv.height = 500
    act(() => {
      listeners['resize']?.({} as Event)
    })
    expect(result.current).toBe(344)
  })

  it('returns 0 when visualViewport is not available', () => {
    Object.defineProperty(window, 'visualViewport', { value: null, configurable: true })
    const { result } = renderHook(() => useKeyboardInset())
    expect(result.current).toBe(0)
  })

  it('removes event listeners on unmount', () => {
    const { vv } = mockVisualViewport(844, 0)
    const { unmount } = renderHook(() => useKeyboardInset())
    unmount()
    expect(vv.removeEventListener).toHaveBeenCalled()
  })
})
