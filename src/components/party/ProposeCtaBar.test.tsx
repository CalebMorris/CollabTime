import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { ProposeCtaBar } from './ProposeCtaBar'

const EPOCH_MS = 1711209600000

describe('ProposeCtaBar', () => {
  it('renders the propose button', () => {
    render(
      <ProposeCtaBar
        timestamp={EPOCH_MS}
        roomPhase="active"
        onPropose={vi.fn()}
      />,
    )
    expect(screen.getByRole('button', { name: /propose this time/i })).toBeDefined()
  })

  it('button is disabled when timestamp is null', () => {
    render(
      <ProposeCtaBar
        timestamp={null}
        roomPhase="active"
        onPropose={vi.fn()}
      />,
    )
    expect((screen.getByRole('button', { name: /propose this time/i }) as HTMLButtonElement).disabled).toBe(true)
  })

  it('button is disabled when roomPhase is not active', () => {
    render(
      <ProposeCtaBar
        timestamp={EPOCH_MS}
        roomPhase="waiting"
        onPropose={vi.fn()}
      />,
    )
    expect((screen.getByRole('button', { name: /propose this time/i }) as HTMLButtonElement).disabled).toBe(true)
  })

  it('button is disabled when roomPhase is null', () => {
    render(
      <ProposeCtaBar
        timestamp={EPOCH_MS}
        roomPhase={null}
        onPropose={vi.fn()}
      />,
    )
    expect((screen.getByRole('button', { name: /propose this time/i }) as HTMLButtonElement).disabled).toBe(true)
  })

  it('button is enabled when timestamp is set and roomPhase is active', () => {
    render(
      <ProposeCtaBar
        timestamp={EPOCH_MS}
        roomPhase="active"
        onPropose={vi.fn()}
      />,
    )
    expect((screen.getByRole('button', { name: /propose this time/i }) as HTMLButtonElement).disabled).toBe(false)
  })

  it('calls onPropose when clicked', () => {
    const onPropose = vi.fn()
    render(
      <ProposeCtaBar
        timestamp={EPOCH_MS}
        roomPhase="active"
        onPropose={onPropose}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: /propose this time/i }))
    expect(onPropose).toHaveBeenCalledOnce()
  })

  it('has large prominent button styling', () => {
    render(
      <ProposeCtaBar
        timestamp={EPOCH_MS}
        roomPhase="active"
        onPropose={vi.fn()}
      />,
    )
    const btn = screen.getByRole('button', { name: /propose this time/i })
    expect(btn.className).toContain('min-h-[56px]')
    expect(btn.className).toContain('text-lg')
  })
})
