import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import { axe } from 'jest-axe'

import { TextImport } from './components/TextImport'
import { ManualSelector } from './components/ManualSelector'
import { ConversionDisplay } from './components/ConversionDisplay'
import { DiscordExport } from './components/DiscordExport'
import { ShareLink } from './components/ShareLink'
import { CalendarExport } from './components/CalendarExport'
import { TimezoneSelect } from './components/TimezoneSelect'
import { CoordinateSection } from './components/party/CoordinateSection'
import { PartyCreateOverlay } from './components/party/PartyCreateOverlay'
import { PartyJoinOverlay } from './components/party/PartyJoinOverlay'
import { ProposalsBoard } from './components/party/ProposalsBoard'
import { ConsensusMeter } from './components/party/ConsensusMeter'
import { ReconnectingBanner } from './components/party/ReconnectingBanner'
import { LockInModal } from './components/party/LockInModal'
import { PartyDeadRoom } from './components/party/PartyDeadRoom'
import { PartyExportScreen } from './components/party/PartyExportScreen'
import type { Participant, Proposal } from './room/roomProtocol'

// Nov 28 2018 11:01:00 UTC — a fixed, well-known timestamp
const FIXED_MS = 1543392060000
const TIMEZONE = 'America/New_York'

const PARTICIPANTS: Participant[] = [
  { participantToken: 'pt-1', nickname: 'Teal Fox', isConnected: true },
  { participantToken: 'pt-2', nickname: 'Bold Crane', isConnected: true },
]

const PROPOSALS: Proposal[] = [
  { participantToken: 'pt-1', epochMs: FIXED_MS },
  { participantToken: 'pt-2', epochMs: FIXED_MS },
]

describe('Accessibility: no axe violations', () => {
  it('TextImport — idle state', async () => {
    const { container } = render(<TextImport onTime={() => {}} />)
    expect(await axe(container)).toHaveNoViolations()
  })

  it('TextImport — error state', async () => {
    const { container, getByRole } = render(<TextImport onTime={() => {}} />)
    // Trigger a parse error by clicking Parse with empty input
    getByRole('button', { name: /parse/i }).click()
    expect(await axe(container)).toHaveNoViolations()
  })

  it('ManualSelector', async () => {
    const { container } = render(
      <ManualSelector
        timezone={TIMEZONE}
        onTime={() => {}}
        value={FIXED_MS}
      />,
    )
    expect(await axe(container)).toHaveNoViolations()
  })

  it('TimezoneSelect', async () => {
    const { container } = render(
      <TimezoneSelect value={TIMEZONE} onChange={() => {}} />,
    )
    expect(await axe(container)).toHaveNoViolations()
  })

  it('ConversionDisplay — past timestamp', async () => {
    const { container } = render(
      <ConversionDisplay timestamp={FIXED_MS} timezone={TIMEZONE} />,
    )
    expect(await axe(container)).toHaveNoViolations()
  })

  it('ConversionDisplay — future timestamp', async () => {
    // Use a real future timestamp to avoid fake-timer conflicts with axe internals
    const futureTimestamp = Date.now() + 60_000
    const { container } = render(
      <ConversionDisplay timestamp={futureTimestamp} timezone={TIMEZONE} />,
    )
    expect(await axe(container)).toHaveNoViolations()
  })

  it('DiscordExport', async () => {
    Object.assign(navigator, {
      clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
    })
    const { container } = render(
      <DiscordExport timestamp={FIXED_MS} timezone={TIMEZONE} />,
    )
    expect(await axe(container)).toHaveNoViolations()
  })

  it('ShareLink', async () => {
    Object.assign(navigator, {
      clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
    })
    const { container } = render(<ShareLink timestamp={FIXED_MS} />)
    expect(await axe(container)).toHaveNoViolations()
  })

  it('CalendarExport — renders download button with accessible label', async () => {
    vi.stubGlobal('URL', {
      createObjectURL: vi.fn(() => 'blob:fake-url'),
      revokeObjectURL: vi.fn(),
    })
    const { container, getByRole } = render(<CalendarExport timestamp={FIXED_MS} />)
    const button = getByRole('button', { name: /download .ics/i })
    expect(button).toBeDefined()
    // Meets minimum 44px touch target via min-h-[44px] Tailwind class
    expect(button.className).toContain('min-h-[44px]')
    expect(await axe(container)).toHaveNoViolations()
    vi.unstubAllGlobals()
  })
})

describe('Accessibility: party system components', () => {
  beforeEach(() => {
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
      configurable: true,
    })
    Object.defineProperty(window, 'location', {
      value: { origin: 'https://collabtime.app', pathname: '/' },
      configurable: true,
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('CoordinateSection', async () => {
    const { container } = render(
      <CoordinateSection onStartParty={vi.fn()} onJoinParty={vi.fn()} />,
    )
    expect(await axe(container)).toHaveNoViolations()
  })

  it('PartyCreateOverlay', async () => {
    const { container } = render(
      <PartyCreateOverlay
        roomCode="amber-falcon-bridge"
        onEnterRoom={vi.fn()}
        onDismiss={vi.fn()}
      />,
    )
    expect(await axe(container)).toHaveNoViolations()
  })

  it('PartyJoinOverlay — empty state', async () => {
    const { container } = render(
      <PartyJoinOverlay initialCode={null} onJoin={vi.fn()} onDismiss={vi.fn()} />,
    )
    expect(await axe(container)).toHaveNoViolations()
  })

  it('PartyJoinOverlay — pre-filled code', async () => {
    const { container } = render(
      <PartyJoinOverlay
        initialCode="amber-falcon-bridge"
        onJoin={vi.fn()}
        onDismiss={vi.fn()}
      />,
    )
    expect(await axe(container)).toHaveNoViolations()
  })

  it('PartyJoinOverlay — valid code entered', async () => {
    const { container, getByRole } = render(
      <PartyJoinOverlay initialCode={null} onJoin={vi.fn()} onDismiss={vi.fn()} />,
    )
    fireEvent.change(getByRole('textbox'), { target: { value: 'amber-falcon-bridge' } })
    expect(await axe(container)).toHaveNoViolations()
  })

  it('ProposalsBoard — waiting (1 participant)', async () => {
    const { container } = render(
      <ProposalsBoard
        participants={[PARTICIPANTS[0]]}
        proposals={[]}
        ownParticipantToken="pt-1"
        viewerTimezone={TIMEZONE}
        isLocked={false}
      />,
    )
    expect(await axe(container)).toHaveNoViolations()
  })

  it('ProposalsBoard — active with proposals', async () => {
    const { container } = render(
      <ProposalsBoard
        participants={PARTICIPANTS}
        proposals={PROPOSALS}
        ownParticipantToken="pt-1"
        viewerTimezone={TIMEZONE}
        isLocked={false}
      />,
    )
    expect(await axe(container)).toHaveNoViolations()
  })

  it('ProposalsBoard — with disconnected participant', async () => {
    const withDisconnected: Participant[] = [
      PARTICIPANTS[0],
      { ...PARTICIPANTS[1], isConnected: false },
    ]
    const { container } = render(
      <ProposalsBoard
        participants={withDisconnected}
        proposals={PROPOSALS}
        ownParticipantToken="pt-1"
        viewerTimezone={TIMEZONE}
        isLocked={false}
      />,
    )
    expect(await axe(container)).toHaveNoViolations()
  })

  it('ProposalsBoard — locked state', async () => {
    const { container } = render(
      <ProposalsBoard
        participants={PARTICIPANTS}
        proposals={PROPOSALS}
        ownParticipantToken="pt-1"
        viewerTimezone={TIMEZONE}
        isLocked={true}
      />,
    )
    expect(await axe(container)).toHaveNoViolations()
  })

  it('ConsensusMeter — partial agreement', async () => {
    const { container } = render(
      <ConsensusMeter
        proposals={[
          { participantToken: 'pt-1', epochMs: FIXED_MS },
          { participantToken: 'pt-2', epochMs: FIXED_MS + 60_000 },
        ]}
        participantCount={2}
      />,
    )
    expect(await axe(container)).toHaveNoViolations()
  })

  it('ConsensusMeter — full agreement', async () => {
    const { container } = render(<ConsensusMeter proposals={PROPOSALS} participantCount={PROPOSALS.length} />)
    expect(await axe(container)).toHaveNoViolations()
  })

  it('ReconnectingBanner', async () => {
    const { container } = render(<ReconnectingBanner secondsRemaining={24} />)
    expect(await axe(container)).toHaveNoViolations()
  })

  it('LockInModal', async () => {
    const { container } = render(
      <LockInModal
        confirmedMs={FIXED_MS}
        participantCount={2}
        timezone={TIMEZONE}
        onDismiss={vi.fn()}
      />,
    )
    expect(await axe(container)).toHaveNoViolations()
  })

  it('PartyDeadRoom — initial state', async () => {
    const { container } = render(
      <PartyDeadRoom
        attemptedCode="amber-falcon-bridge"
        onTryDifferent={vi.fn()}
        onStartNew={vi.fn()}
        onBackToSolo={vi.fn()}
      />,
    )
    expect(await axe(container)).toHaveNoViolations()
  })

  it('PartyDeadRoom — with code input expanded', async () => {
    const { container, getByRole } = render(
      <PartyDeadRoom
        attemptedCode="amber-falcon-bridge"
        onTryDifferent={vi.fn()}
        onStartNew={vi.fn()}
        onBackToSolo={vi.fn()}
      />,
    )
    fireEvent.click(getByRole('button', { name: /try a different code/i }))
    expect(await axe(container)).toHaveNoViolations()
  })

  it('PartyExportScreen — with participants', async () => {
    vi.stubGlobal('URL', {
      createObjectURL: vi.fn(() => 'blob:fake-url'),
      revokeObjectURL: vi.fn(),
    })
    const { container } = render(
      <PartyExportScreen
        confirmedMs={FIXED_MS}
        participants={PARTICIPANTS}
        timezone={TIMEZONE}
        onNewSession={vi.fn()}
        onBackToSolo={vi.fn()}
      />,
    )
    expect(await axe(container)).toHaveNoViolations()
    vi.unstubAllGlobals()
  })

  it('PartyExportScreen — no participants (deep-link load)', async () => {
    vi.stubGlobal('URL', {
      createObjectURL: vi.fn(() => 'blob:fake-url'),
      revokeObjectURL: vi.fn(),
    })
    const { container } = render(
      <PartyExportScreen
        confirmedMs={FIXED_MS}
        participants={[]}
        timezone={TIMEZONE}
        onNewSession={vi.fn()}
        onBackToSolo={vi.fn()}
      />,
    )
    expect(await axe(container)).toHaveNoViolations()
    vi.unstubAllGlobals()
  })
})
