import { useState, useEffect } from 'react'
import type { AppMode } from '../utils/partyLink'
import { detectInitialMode, encodePartyRoomUrl, encodePartyLockedUrl } from '../utils/partyLink'

// ─── Types ────────────────────────────────────────────────────────────────────

export type { AppMode }

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function usePartyMode() {
  const [appMode, setAppMode] = useState<AppMode>(() =>
    detectInitialMode(window.location.search),
  )

  // Sync URL when entering persistent party states
  useEffect(() => {
    if (appMode.kind === 'party-room') {
      window.history.replaceState({}, '', encodePartyRoomUrl(appMode.roomCode))
    } else if (appMode.kind === 'party-locked') {
      window.history.replaceState(
        {},
        '',
        encodePartyLockedUrl(appMode.roomCode, appMode.confirmedMs),
      )
    }
  }, [appMode])

  // ─── Transitions ─────────────────────────────────────────────────────────────

  const startParty = () => setAppMode({ kind: 'party-create-overlay' })

  const joinParty = (code: string | null = null) =>
    setAppMode({ kind: 'party-join-overlay', code })

  const enterRoom = (roomCode: string) => setAppMode({ kind: 'party-room', roomCode })

  const lockIn = (roomCode: string, confirmedMs: number) =>
    setAppMode({ kind: 'party-locked', roomCode, confirmedMs })

  const deadRoom = (attemptedCode: string) =>
    setAppMode({ kind: 'party-dead', attemptedCode })

  const backToSolo = () => setAppMode({ kind: 'solo' })

  return {
    appMode,
    startParty,
    joinParty,
    enterRoom,
    lockIn,
    deadRoom,
    backToSolo,
  }
}
