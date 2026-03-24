import { RefObject, useEffect, useRef } from 'react'

const FOCUSABLE_SELECTORS =
  'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'

/**
 * Traps keyboard focus within a dialog container.
 *
 * On mount: focuses the first focusable element (or the container itself).
 * While mounted: Tab/Shift+Tab cycle within the container; Escape calls onEscape.
 * On unmount: restores focus to the element that was active before the trap.
 */
export function useFocusTrap(
  containerRef: RefObject<HTMLElement | null>,
  onEscape: () => void,
): void {
  const onEscapeRef = useRef(onEscape)
  onEscapeRef.current = onEscape

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null

    const focusableElements = containerRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS)
    if (focusableElements && focusableElements.length > 0) {
      focusableElements[0].focus()
    } else {
      containerRef.current?.focus()
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onEscapeRef.current()
        return
      }

      if (event.key !== 'Tab') return

      const elements = containerRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS)
      if (!elements || elements.length === 0) return

      const firstElement = elements[0]
      const lastElement = elements[elements.length - 1]

      if (event.shiftKey) {
        if (document.activeElement === firstElement) {
          event.preventDefault()
          lastElement.focus()
        }
      } else {
        if (document.activeElement === lastElement) {
          event.preventDefault()
          firstElement.focus()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      previouslyFocused?.focus()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps -- intentional: run once on mount; onEscape accessed via ref
}
