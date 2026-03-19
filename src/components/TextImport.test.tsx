import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { act } from '@testing-library/react'
import { TextImport } from './TextImport'

describe('TextImport', () => {
  it('renders a textarea and parse button', () => {
    render(<TextImport onTime={() => {}} />)
    expect(screen.getByRole('textbox', { name: /enter time/i })).toBeDefined()
    expect(screen.getByRole('button', { name: /parse/i })).toBeDefined()
  })

  it('calls onTime with UTC ms for a valid ISO input', async () => {
    const user = userEvent.setup()
    const onTime = vi.fn()
    render(<TextImport onTime={onTime} />)
    await user.type(screen.getByRole('textbox', { name: /enter time/i }), '2018-11-28T11:01:00Z')
    await user.click(screen.getByRole('button', { name: /parse/i }))
    expect(onTime).toHaveBeenCalledWith(1543402860000)
  })

  it('calls onTime for a Unix timestamp', async () => {
    const user = userEvent.setup()
    const onTime = vi.fn()
    render(<TextImport onTime={onTime} />)
    await user.type(screen.getByRole('textbox', { name: /enter time/i }), '1543392060')
    await user.click(screen.getByRole('button', { name: /parse/i }))
    expect(onTime).toHaveBeenCalledWith(1543392060000)
  })

  it('shows an inline error for invalid input', async () => {
    const user = userEvent.setup()
    render(<TextImport onTime={() => {}} />)
    await user.type(screen.getByRole('textbox', { name: /enter time/i }), 'not a date xyz')
    await user.click(screen.getByRole('button', { name: /parse/i }))
    expect(screen.getByRole('alert')).toBeDefined()
  })

  it('shows an error for empty input', async () => {
    const user = userEvent.setup()
    render(<TextImport onTime={() => {}} />)
    await user.click(screen.getByRole('button', { name: /parse/i }))
    expect(screen.getByRole('alert')).toBeDefined()
  })

  it('Enter key triggers parse', async () => {
    const user = userEvent.setup()
    const onTime = vi.fn()
    render(<TextImport onTime={onTime} />)
    await user.type(screen.getByRole('textbox', { name: /enter time/i }), '1543392060')
    await user.keyboard('{Enter}')
    expect(onTime).toHaveBeenCalledWith(1543392060000)
  })

  it('Shift+Enter inserts a newline instead of parsing', async () => {
    const user = userEvent.setup()
    const onTime = vi.fn()
    render(<TextImport onTime={onTime} />)
    await user.type(screen.getByRole('textbox', { name: /enter time/i }), 'hello')
    await user.keyboard('{Shift>}{Enter}{/Shift}')
    const textarea = screen.getByRole('textbox', { name: /enter time/i }) as HTMLTextAreaElement
    expect(textarea.value).toContain('\n')
    expect(onTime).not.toHaveBeenCalled()
  })

  it('populates the textarea when externalValue is provided', () => {
    const { rerender } = render(<TextImport onTime={() => {}} externalValue={null} />)
    const textarea = screen.getByRole('textbox', { name: /enter time/i }) as HTMLTextAreaElement
    expect(textarea.value).toBe('')
    act(() => {
      rerender(<TextImport onTime={() => {}} externalValue="November 28, 2018 at 8:01 AM" />)
    })
    expect(textarea.value).toBe('November 28, 2018 at 8:01 AM')
  })

  it('does not reset the textarea when externalValue becomes null', async () => {
    const user = userEvent.setup()
    const { rerender } = render(
      <TextImport onTime={() => {}} externalValue="November 28, 2018 at 8:01 AM" />,
    )
    const textarea = screen.getByRole('textbox', { name: /enter time/i }) as HTMLTextAreaElement
    await user.clear(textarea)
    await user.type(textarea, 'user typed this')
    act(() => {
      rerender(<TextImport onTime={() => {}} externalValue={null} />)
    })
    expect(textarea.value).toBe('user typed this')
  })

  it('clears the error after a successful parse', async () => {
    const user = userEvent.setup()
    render(<TextImport onTime={() => {}} />)
    // First make it error
    await user.click(screen.getByRole('button', { name: /parse/i }))
    expect(screen.getByRole('alert')).toBeDefined()
    // Then fix it
    await user.type(screen.getByRole('textbox', { name: /enter time/i }), '1543392060')
    await user.click(screen.getByRole('button', { name: /parse/i }))
    expect(screen.queryByRole('alert')).toBeNull()
  })
})
