import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { ProposalsBoard } from './ProposalsBoard'
import type { Participant, Proposal } from '../../room/roomProtocol'

const TIMEZONE = 'America/New_York'
const EPOCH_MS = 1711209600000

const p1: Participant = { participantToken: 'pt-1', nickname: 'Teal Fox', isConnected: true }
const p2: Participant = { participantToken: 'pt-2', nickname: 'Bold Crane', isConnected: true }

describe('ProposalsBoard', () => {
  it('has aria-live="polite" and aria-atomic="false"', () => {
    const { container } = render(
      <ProposalsBoard
        participants={[p1]}
        proposals={[]}
        ownParticipantToken="pt-1"
        viewerTimezone={TIMEZONE}
        isLocked={false}
      />,
    )
    const section = container.querySelector('section')!
    expect(section.getAttribute('aria-live')).toBe('polite')
    expect(section.getAttribute('aria-atomic')).toBe('false')
  })

  it('renders a row for each participant', () => {
    render(
      <ProposalsBoard
        participants={[p1, p2]}
        proposals={[]}
        ownParticipantToken="pt-1"
        viewerTimezone={TIMEZONE}
        isLocked={false}
      />,
    )
    expect(screen.getByText(/teal fox/i)).toBeDefined()
    expect(screen.getByText(/bold crane/i)).toBeDefined()
  })

  it('shows "Waiting for others" nudge when only one participant', () => {
    render(
      <ProposalsBoard
        participants={[p1]}
        proposals={[]}
        ownParticipantToken="pt-1"
        viewerTimezone={TIMEZONE}
        isLocked={false}
      />,
    )
    expect(screen.getByText(/waiting for others/i)).toBeDefined()
  })

  it('does not show the waiting nudge when multiple participants', () => {
    render(
      <ProposalsBoard
        participants={[p1, p2]}
        proposals={[]}
        ownParticipantToken="pt-1"
        viewerTimezone={TIMEZONE}
        isLocked={false}
      />,
    )
    expect(screen.queryByText(/waiting for others/i)).toBeNull()
  })

  it('shows "0 of 2 agree" when 2 connected participants but no proposals', () => {
    render(
      <ProposalsBoard
        participants={[p1, p2]}
        proposals={[]}
        ownParticipantToken="pt-1"
        viewerTimezone={TIMEZONE}
        isLocked={false}
      />,
    )
    expect(screen.getByText(/0 of 2 agree/i)).toBeDefined()
  })

  it('renders ConsensusMeter', () => {
    const proposals: Proposal[] = [{ participantToken: 'pt-1', epochMs: EPOCH_MS }]
    render(
      <ProposalsBoard
        participants={[p1, p2]}
        proposals={proposals}
        ownParticipantToken="pt-1"
        viewerTimezone={TIMEZONE}
        isLocked={false}
      />,
    )
    expect(screen.getByRole('status')).toBeDefined()
  })

  it('passes own proposal to the own participant row', () => {
    const proposals: Proposal[] = [{ participantToken: 'pt-1', epochMs: EPOCH_MS }]
    render(
      <ProposalsBoard
        participants={[p1, p2]}
        proposals={proposals}
        ownParticipantToken="pt-1"
        viewerTimezone={TIMEZONE}
        isLocked={false}
      />,
    )
    // "You" label + the time should both be present
    expect(screen.getByText(/you/i)).toBeDefined()
    expect(screen.getByText(/12:00/)).toBeDefined()
  })
})
