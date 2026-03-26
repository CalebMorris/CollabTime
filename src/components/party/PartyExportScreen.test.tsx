import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { PartyExportScreen } from './PartyExportScreen'
import type { Participant } from '../../room/roomProtocol'

// 2024-03-23 16:00:00 UTC = 12:00 PM EDT
const EPOCH_MS = 1711209600000
const TIMEZONE = 'America/New_York'

const participants: Participant[] = [
  { participantToken: 'pt-1', nickname: 'Teal Fox', isConnected: true },
  { participantToken: 'pt-2', nickname: 'Bold Crane', isConnected: true },
]

describe('PartyExportScreen', () => {
  it('shows the locked-in time in the viewer timezone', () => {
    render(
      <PartyExportScreen
        confirmedMs={EPOCH_MS}
        participants={participants}
        timezone={TIMEZONE}
        onNewSession={vi.fn()}
        onBackToSolo={vi.fn()}
      />,
    )
    expect(screen.getByText(/12:00/)).toBeDefined()
  })

  it('lists participant nicknames with a checkmark', () => {
    render(
      <PartyExportScreen
        confirmedMs={EPOCH_MS}
        participants={participants}
        timezone={TIMEZONE}
        onNewSession={vi.fn()}
        onBackToSolo={vi.fn()}
      />,
    )
    expect(screen.getByText(/teal fox/i)).toBeDefined()
    expect(screen.getByText(/bold crane/i)).toBeDefined()
    expect(screen.getAllByText('✓').length).toBe(2)
  })

  it('renders a [Back to Solo Mode] button', () => {
    render(
      <PartyExportScreen
        confirmedMs={EPOCH_MS}
        participants={participants}
        timezone={TIMEZONE}
        onNewSession={vi.fn()}
        onBackToSolo={vi.fn()}
      />,
    )
    expect(screen.getByRole('button', { name: /back to solo/i })).toBeDefined()
  })

  it('renders a [New Session] button', () => {
    render(
      <PartyExportScreen
        confirmedMs={EPOCH_MS}
        participants={participants}
        timezone={TIMEZONE}
        onNewSession={vi.fn()}
        onBackToSolo={vi.fn()}
      />,
    )
    expect(screen.getByRole('button', { name: /new session/i })).toBeDefined()
  })

  it('calls onBackToSolo when [Back to Solo Mode] is clicked', () => {
    const onBackToSolo = vi.fn()
    render(
      <PartyExportScreen
        confirmedMs={EPOCH_MS}
        participants={participants}
        timezone={TIMEZONE}
        onNewSession={vi.fn()}
        onBackToSolo={onBackToSolo}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: /back to solo/i }))
    expect(onBackToSolo).toHaveBeenCalledOnce()
  })

  it('calls onNewSession when [New Session] is clicked', () => {
    const onNewSession = vi.fn()
    render(
      <PartyExportScreen
        confirmedMs={EPOCH_MS}
        participants={participants}
        timezone={TIMEZONE}
        onNewSession={onNewSession}
        onBackToSolo={vi.fn()}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: /new session/i }))
    expect(onNewSession).toHaveBeenCalledOnce()
  })

  it('renders without participants gracefully (deep-link load)', () => {
    render(
      <PartyExportScreen
        confirmedMs={EPOCH_MS}
        participants={[]}
        timezone={TIMEZONE}
        onNewSession={vi.fn()}
        onBackToSolo={vi.fn()}
      />,
    )
    expect(screen.getByText(/12:00/)).toBeDefined()
  })
})
