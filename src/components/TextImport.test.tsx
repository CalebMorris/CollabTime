import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
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
