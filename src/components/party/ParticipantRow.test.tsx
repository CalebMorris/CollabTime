import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { ParticipantRow } from './ParticipantRow'
import type { Participant, Proposal } from '../../room/roomProtocol'

// 2024-03-23 16:00:00 UTC — in America/New_York (EDT, UTC-4) = 12:00 PM
const EPOCH_MS = 1711209600000
const TIMEZONE = 'America/New_York'

const connectedParticipant: Participant = {
  participantToken: 'pt-1',
  nickname: 'Teal Fox',
  isConnected: true,
}

const disconnectedParticipant: Participant = {
  participantToken: 'pt-2',
  nickname: 'Bold Crane',
  isConnected: false,
}

const proposal: Proposal = { participantToken: 'pt-1', epochMs: EPOCH_MS }

describe('ParticipantRow — connected with proposal', () => {
  it('renders the participant nickname', () => {
    render(
      <ParticipantRow
        participant={connectedParticipant}
        proposal={proposal}
        isOwn={false}
        viewerTimezone={TIMEZONE}
        isLocked={false}
      />,
    )
    expect(screen.getByText(/teal fox/i)).toBeDefined()
  })

  it('renders the proposal time in the viewer timezone', () => {
    render(
      <ParticipantRow
        participant={connectedParticipant}
        proposal={proposal}
        isOwn={false}
        viewerTimezone={TIMEZONE}
        isLocked={false}
      />,
    )
    // 16:00 UTC = 12:00 PM EDT
    expect(screen.getByText(/12:00/)).toBeDefined()
  })
})

describe('ParticipantRow — connected without proposal', () => {
  it('renders a dash placeholder when no proposal', () => {
    render(
      <ParticipantRow
        participant={connectedParticipant}
        proposal={null}
        isOwn={false}
        viewerTimezone={TIMEZONE}
        isLocked={false}
      />,
    )
    expect(screen.getByText('—')).toBeDefined()
  })
})

describe('ParticipantRow — own row', () => {
  it('shows "(You)" label', () => {
    render(
      <ParticipantRow
        participant={connectedParticipant}
        proposal={proposal}
        isOwn={true}
        viewerTimezone={TIMEZONE}
        isLocked={false}
      />,
    )
    expect(screen.getByText(/you/i)).toBeDefined()
  })

  it('has an indigo left border class', () => {
    const { container } = render(
      <ParticipantRow
        participant={connectedParticipant}
        proposal={proposal}
        isOwn={true}
        viewerTimezone={TIMEZONE}
        isLocked={false}
      />,
    )
    expect(container.firstChild?.toString()).toBeDefined()
    // Check border-l-2 class is present on the row element
    const row = container.querySelector('[class*="border-l-2"]')
    expect(row).not.toBeNull()
  })
})

describe('ParticipantRow — reconnecting (disconnected with proposal)', () => {
  it('renders with reduced opacity when disconnected', () => {
    const { container } = render(
      <ParticipantRow
        participant={disconnectedParticipant}
        proposal={{ participantToken: 'pt-2', epochMs: EPOCH_MS }}
        isOwn={false}
        viewerTimezone={TIMEZONE}
        isLocked={false}
      />,
    )
    const row = container.querySelector('[class*="opacity"]')
    expect(row).not.toBeNull()
  })

  it('shows "Reconnecting..." label when disconnected', () => {
    render(
      <ParticipantRow
        participant={disconnectedParticipant}
        proposal={{ participantToken: 'pt-2', epochMs: EPOCH_MS }}
        isOwn={false}
        viewerTimezone={TIMEZONE}
        isLocked={false}
      />,
    )
    expect(screen.getByText(/reconnecting/i)).toBeDefined()
  })

  it('still shows the last proposal time while reconnecting', () => {
    render(
      <ParticipantRow
        participant={disconnectedParticipant}
        proposal={{ participantToken: 'pt-2', epochMs: EPOCH_MS }}
        isOwn={false}
        viewerTimezone={TIMEZONE}
        isLocked={false}
      />,
    )
    expect(screen.getByText(/12:00/)).toBeDefined()
  })
})

describe('ParticipantRow — locked state', () => {
  it('shows a checkmark when locked', () => {
    render(
      <ParticipantRow
        participant={connectedParticipant}
        proposal={proposal}
        isOwn={false}
        viewerTimezone={TIMEZONE}
        isLocked={true}
      />,
    )
    expect(screen.getByText('✓')).toBeDefined()
  })
})

describe('ParticipantRow — +1 button', () => {
  it('shows +1 button for another participant with a proposal', () => {
    render(
      <ParticipantRow
        participant={connectedParticipant}
        proposal={proposal}
        isOwn={false}
        viewerTimezone={TIMEZONE}
        isLocked={false}
        onAgree={vi.fn()}
      />,
    )
    expect(screen.getByRole('button', { name: /agree/i })).toBeDefined()
  })

  it('calls onAgree with the proposal epochMs when clicked', () => {
    const onAgree = vi.fn()
    render(
      <ParticipantRow
        participant={connectedParticipant}
        proposal={proposal}
        isOwn={false}
        viewerTimezone={TIMEZONE}
        isLocked={false}
        onAgree={onAgree}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: /agree/i }))
    expect(onAgree).toHaveBeenCalledWith(EPOCH_MS)
  })

  it('does not show +1 button on own row', () => {
    render(
      <ParticipantRow
        participant={connectedParticipant}
        proposal={proposal}
        isOwn={true}
        viewerTimezone={TIMEZONE}
        isLocked={false}
        onAgree={vi.fn()}
      />,
    )
    expect(screen.queryByRole('button', { name: /agree/i })).toBeNull()
  })

  it('does not show +1 button when room is locked', () => {
    render(
      <ParticipantRow
        participant={connectedParticipant}
        proposal={proposal}
        isOwn={false}
        viewerTimezone={TIMEZONE}
        isLocked={true}
        onAgree={vi.fn()}
      />,
    )
    expect(screen.queryByRole('button', { name: /agree/i })).toBeNull()
  })

  it('does not show +1 button when participant has no proposal', () => {
    render(
      <ParticipantRow
        participant={connectedParticipant}
        proposal={null}
        isOwn={false}
        viewerTimezone={TIMEZONE}
        isLocked={false}
        onAgree={vi.fn()}
      />,
    )
    expect(screen.queryByRole('button', { name: /agree/i })).toBeNull()
  })

  it('shows agreed state when viewer already agreed with this proposal', () => {
    render(
      <ParticipantRow
        participant={connectedParticipant}
        proposal={proposal}
        isOwn={false}
        viewerTimezone={TIMEZONE}
        isLocked={false}
        onAgree={vi.fn()}
        isAlreadyAgreed={true}
      />,
    )
    expect(screen.getByRole('button', { name: /agreed/i })).toBeDefined()
  })
})
