import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { HelpOverlay } from './HelpOverlay'

describe('HelpOverlay', () => {
  it('has role="dialog" and aria-modal="true"', () => {
    render(<HelpOverlay onDismiss={vi.fn()} />)
    const dialog = screen.getByRole('dialog')
    expect(dialog.getAttribute('aria-modal')).toBe('true')
  })

  it('renders the "Help & FAQ" title', () => {
    render(<HelpOverlay onDismiss={vi.fn()} />)
    expect(screen.getByRole('heading', { name: /help & faq/i })).toBeDefined()
  })

  it('calls onDismiss when the backdrop is clicked', () => {
    const onDismiss = vi.fn()
    render(<HelpOverlay onDismiss={onDismiss} />)
    fireEvent.click(screen.getByTestId('help-backdrop'))
    expect(onDismiss).toHaveBeenCalledOnce()
  })

  it('calls onDismiss when Escape is pressed', () => {
    const onDismiss = vi.fn()
    render(<HelpOverlay onDismiss={onDismiss} />)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onDismiss).toHaveBeenCalledOnce()
  })

  it('moves focus into the dialog on open', () => {
    render(<HelpOverlay onDismiss={vi.fn()} />)
    const dialog = screen.getByRole('dialog')
    expect(dialog.contains(document.activeElement)).toBe(true)
  })

  it('renders FAQ content for Getting Started section', () => {
    render(<HelpOverlay onDismiss={vi.fn()} />)
    expect(screen.getByText(/getting started/i)).toBeDefined()
    expect(screen.getByText(/what is collabtime/i)).toBeDefined()
  })

  it('renders FAQ content for Times & Timezones section', () => {
    render(<HelpOverlay onDismiss={vi.fn()} />)
    expect(screen.getByText(/times & timezones/i)).toBeDefined()
    expect(screen.getByText(/how do i enter a time/i)).toBeDefined()
  })

  it('renders FAQ content for Sharing & Export section', () => {
    render(<HelpOverlay onDismiss={vi.fn()} />)
    expect(screen.getByText(/sharing & export/i)).toBeDefined()
    expect(screen.getByText(/discord timestamps/i)).toBeDefined()
  })

  it('hides Party Mode section when partyModeEnabled is false', () => {
    render(<HelpOverlay onDismiss={vi.fn()} partyModeEnabled={false} />)
    expect(screen.queryByRole('heading', { name: /party mode/i })).toBeNull()
    expect(screen.queryByText(/what is party mode/i)).toBeNull()
  })

  it('shows Party Mode section when partyModeEnabled is true', () => {
    render(<HelpOverlay onDismiss={vi.fn()} partyModeEnabled={true} />)
    expect(screen.getByRole('heading', { name: /party mode/i })).toBeDefined()
    expect(screen.getByText(/what is party mode/i)).toBeDefined()
  })
})
