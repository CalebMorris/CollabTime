import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { ConsensusMeter } from './ConsensusMeter'
import type { Proposal } from '../../room/roomProtocol'

// 1711209600000 = 2024-03-23 16:00:00 UTC
// 1711209660000 = 2024-03-23 16:01:00 UTC (different minute)
const T1 = 1711209600000
const T2 = 1711209660000

describe('ConsensusMeter', () => {
  it('shows "0 of 0 agree" with no proposals and no participants', () => {
    render(<ConsensusMeter proposals={[]} participantCount={0} />)
    expect(screen.getByText(/0 of 0 agree/i)).toBeDefined()
  })

  it('shows "0 of 2 agree" when 2 participants but no proposals yet', () => {
    render(<ConsensusMeter proposals={[]} participantCount={2} />)
    expect(screen.getByText(/0 of 2 agree/i)).toBeDefined()
  })

  it('shows "1 of 1 agree" with one proposal', () => {
    const proposals: Proposal[] = [{ participantToken: 'pt-1', epochMs: T1 }]
    render(<ConsensusMeter proposals={proposals} participantCount={1} />)
    expect(screen.getByText(/1 of 1 agree/i)).toBeDefined()
  })

  it('shows "2 of 2 agree" when all proposals match the same minute', () => {
    const proposals: Proposal[] = [
      { participantToken: 'pt-1', epochMs: T1 },
      { participantToken: 'pt-2', epochMs: T1 + 30_000 }, // same minute, different second
    ]
    render(<ConsensusMeter proposals={proposals} participantCount={2} />)
    expect(screen.getByText(/2 of 2 agree/i)).toBeDefined()
  })

  it('shows "1 of 2 agree" when proposals are on different minutes', () => {
    const proposals: Proposal[] = [
      { participantToken: 'pt-1', epochMs: T1 },
      { participantToken: 'pt-2', epochMs: T2 },
    ]
    render(<ConsensusMeter proposals={proposals} participantCount={2} />)
    expect(screen.getByText(/1 of 2 agree/i)).toBeDefined()
  })

  it('has role="status" and aria-live="polite"', () => {
    render(<ConsensusMeter proposals={[]} participantCount={0} />)
    const el = screen.getByRole('status')
    expect(el.getAttribute('aria-live')).toBe('polite')
    expect(el.getAttribute('aria-atomic')).toBe('true')
  })

  it('renders a progress bar', () => {
    render(<ConsensusMeter proposals={[]} participantCount={0} />)
    expect(screen.getByRole('progressbar')).toBeDefined()
  })

  it('progress bar is full width when all agree', () => {
    const proposals: Proposal[] = [
      { participantToken: 'pt-1', epochMs: T1 },
      { participantToken: 'pt-2', epochMs: T1 },
    ]
    render(<ConsensusMeter proposals={proposals} participantCount={2} />)
    const bar = screen.getByTestId('consensus-bar-fill')
    expect(bar.className).toContain('bg-emerald-500')
  })

  it('progress bar is partial when not all agree', () => {
    const proposals: Proposal[] = [
      { participantToken: 'pt-1', epochMs: T1 },
      { participantToken: 'pt-2', epochMs: T2 },
    ]
    render(<ConsensusMeter proposals={proposals} participantCount={2} />)
    const bar = screen.getByTestId('consensus-bar-fill')
    expect(bar.className).toContain('bg-indigo-500')
  })

  it('uses motion-safe:animate-pulse (not bare animate-pulse) when all agree', () => {
    const proposals: Proposal[] = [
      { participantToken: 'pt-1', epochMs: T1 },
      { participantToken: 'pt-2', epochMs: T1 },
    ]
    render(<ConsensusMeter proposals={proposals} participantCount={2} />)
    const bar = screen.getByTestId('consensus-bar-fill')
    expect(bar.classList.contains('animate-pulse')).toBe(false)
    expect(bar.classList.contains('motion-safe:animate-pulse')).toBe(true)
  })
})
