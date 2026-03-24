import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { usePartyMode } from './usePartyMode'

beforeEach(() => {
  // Reset to a clean URL before each test
  window.history.replaceState({}, '', '/')
})

afterEach(() => {
  window.history.replaceState({}, '', '/')
  vi.restoreAllMocks()
})

describe('usePartyMode — initial mode detection from URL', () => {
  it('starts in solo mode when there are no party params', () => {
    const { result } = renderHook(() => usePartyMode())
    expect(result.current.appMode).toEqual({ kind: 'solo' })
  })

  it('starts in party-join-overlay when ?code= is present', () => {
    window.history.replaceState({}, '', '/?code=purple-falcon-bridge')
    const { result } = renderHook(() => usePartyMode())
    expect(result.current.appMode).toEqual({
      kind: 'party-join-overlay',
      code: 'purple-falcon-bridge',
    })
  })

  it('starts in party-locked when ?locked-in= and ?time= are present', () => {
    window.history.replaceState({}, '', '/?locked-in=purple-falcon-bridge&time=1711209600000')
    const { result } = renderHook(() => usePartyMode())
    expect(result.current.appMode).toEqual({
      kind: 'party-locked',
      roomCode: 'purple-falcon-bridge',
      confirmedMs: 1711209600000,
    })
  })
})

describe('usePartyMode — transitions', () => {
  it('startParty transitions to party-create-overlay', () => {
    const { result } = renderHook(() => usePartyMode())
    act(() => result.current.startParty())
    expect(result.current.appMode).toEqual({ kind: 'party-create-overlay' })
  })

  it('joinParty transitions to party-join-overlay with null code', () => {
    const { result } = renderHook(() => usePartyMode())
    act(() => result.current.joinParty())
    expect(result.current.appMode).toEqual({ kind: 'party-join-overlay', code: null })
  })

  it('joinParty with a code pre-fills the code', () => {
    const { result } = renderHook(() => usePartyMode())
    act(() => result.current.joinParty('purple-falcon-bridge'))
    expect(result.current.appMode).toEqual({
      kind: 'party-join-overlay',
      code: 'purple-falcon-bridge',
    })
  })

  it('enterRoom transitions to party-room', () => {
    const { result } = renderHook(() => usePartyMode())
    act(() => result.current.enterRoom('purple-falcon-bridge'))
    expect(result.current.appMode).toEqual({ kind: 'party-room', roomCode: 'purple-falcon-bridge' })
  })

  it('lockIn transitions to party-locked', () => {
    const { result } = renderHook(() => usePartyMode())
    act(() => result.current.lockIn('purple-falcon-bridge', 1711209600000))
    expect(result.current.appMode).toEqual({
      kind: 'party-locked',
      roomCode: 'purple-falcon-bridge',
      confirmedMs: 1711209600000,
    })
  })

  it('deadRoom transitions to party-dead', () => {
    const { result } = renderHook(() => usePartyMode())
    act(() => result.current.deadRoom('purple-falcon-bridge'))
    expect(result.current.appMode).toEqual({
      kind: 'party-dead',
      attemptedCode: 'purple-falcon-bridge',
    })
  })

  it('backToSolo transitions to solo', () => {
    const { result } = renderHook(() => usePartyMode())
    act(() => result.current.enterRoom('purple-falcon-bridge'))
    act(() => result.current.backToSolo())
    expect(result.current.appMode).toEqual({ kind: 'solo' })
  })
})

describe('usePartyMode — URL sync', () => {
  it('updates URL to ?code= when entering party-room', () => {
    const replaceState = vi.spyOn(window.history, 'replaceState')
    const { result } = renderHook(() => usePartyMode())
    act(() => result.current.enterRoom('purple-falcon-bridge'))
    expect(replaceState).toHaveBeenCalledWith(
      expect.anything(),
      '',
      '?code=purple-falcon-bridge',
    )
  })

  it('updates URL to ?locked-in= when locking in', () => {
    const replaceState = vi.spyOn(window.history, 'replaceState')
    const { result } = renderHook(() => usePartyMode())
    act(() => result.current.lockIn('purple-falcon-bridge', 1711209600000))
    expect(replaceState).toHaveBeenCalledWith(
      expect.anything(),
      '',
      '?locked-in=purple-falcon-bridge&time=1711209600000',
    )
  })

  it('does not update URL for overlay modes', () => {
    const replaceState = vi.spyOn(window.history, 'replaceState')
    const { result } = renderHook(() => usePartyMode())
    act(() => result.current.startParty())
    act(() => result.current.joinParty())
    expect(replaceState).not.toHaveBeenCalled()
  })

  it('does not update URL when transitioning back to solo', () => {
    const { result } = renderHook(() => usePartyMode())
    act(() => result.current.enterRoom('purple-falcon-bridge'))
    const replaceState = vi.spyOn(window.history, 'replaceState')
    act(() => result.current.backToSolo())
    expect(replaceState).not.toHaveBeenCalled()
  })
})
