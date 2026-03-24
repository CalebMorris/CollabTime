import { render, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { useRef } from 'react'
import { useFocusTrap } from './useFocusTrap'

function TestDialog({
  onEscape = vi.fn(),
}: {
  onEscape?: () => void
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  useFocusTrap(containerRef, onEscape)
  return (
    <div ref={containerRef} tabIndex={-1} role="dialog">
      <button>First</button>
      <button>Second</button>
      <button>Last</button>
    </div>
  )
}

function SingleButtonDialog({ onEscape = vi.fn() }: { onEscape?: () => void }) {
  const containerRef = useRef<HTMLDivElement>(null)
  useFocusTrap(containerRef, onEscape)
  return (
    <div ref={containerRef} tabIndex={-1} role="dialog">
      <button>Only Button</button>
    </div>
  )
}

describe('useFocusTrap', () => {
  it('moves focus into the dialog on mount (first focusable element)', () => {
    render(<TestDialog />)
    expect(document.activeElement?.textContent).toBe('First')
  })

  it('Escape key calls onEscape', () => {
    const onEscape = vi.fn()
    render(<TestDialog onEscape={onEscape} />)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onEscape).toHaveBeenCalledOnce()
  })

  it('Tab from the last focusable element wraps to the first', () => {
    render(<TestDialog />)
    // Manually focus the last button
    const buttons = document.querySelectorAll('button')
    const lastButton = buttons[buttons.length - 1]
    lastButton.focus()
    expect(document.activeElement).toBe(lastButton)

    fireEvent.keyDown(document, { key: 'Tab', shiftKey: false })
    expect(document.activeElement?.textContent).toBe('First')
  })

  it('Shift+Tab from the first focusable element wraps to the last', () => {
    render(<TestDialog />)
    // useFocusTrap focuses first button on mount
    expect(document.activeElement?.textContent).toBe('First')

    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true })
    expect(document.activeElement?.textContent).toBe('Last')
  })

  it('Tab mid-dialog does not wrap', () => {
    render(<TestDialog />)
    const buttons = document.querySelectorAll('button')
    buttons[1].focus() // focus middle button
    fireEvent.keyDown(document, { key: 'Tab', shiftKey: false })
    // focus should remain on second button (no wrap)
    expect(document.activeElement?.textContent).toBe('Second')
  })

  it('restores focus to the previously focused element on unmount', () => {
    const triggerButton = document.createElement('button')
    triggerButton.textContent = 'Trigger'
    document.body.appendChild(triggerButton)
    triggerButton.focus()
    expect(document.activeElement).toBe(triggerButton)

    const { unmount } = render(<TestDialog />)
    expect(document.activeElement?.textContent).toBe('First')

    unmount()
    expect(document.activeElement).toBe(triggerButton)

    document.body.removeChild(triggerButton)
  })

  it('other keys do not trigger any effect', () => {
    const onEscape = vi.fn()
    render(<TestDialog onEscape={onEscape} />)
    fireEvent.keyDown(document, { key: 'Enter' })
    fireEvent.keyDown(document, { key: 'Space' })
    expect(onEscape).not.toHaveBeenCalled()
  })
})
