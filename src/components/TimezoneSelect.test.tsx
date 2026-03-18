import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { TimezoneSelect } from './TimezoneSelect'

describe('TimezoneSelect', () => {
  it('renders the search input', () => {
    render(<TimezoneSelect value="America/New_York" onChange={() => {}} />)
    expect(screen.getByRole('textbox', { name: /search timezones/i })).toBeDefined()
  })

  it('renders timezone options', () => {
    render(<TimezoneSelect value="America/New_York" onChange={() => {}} />)
    expect(screen.getByRole('option', { name: 'America/New_York' })).toBeDefined()
  })

  it('filters options when searching', async () => {
    const user = userEvent.setup()
    render(<TimezoneSelect value="America/New_York" onChange={() => {}} />)
    await user.type(screen.getByRole('textbox', { name: /search timezones/i }), 'london')
    expect(screen.getByRole('option', { name: 'Europe/London' })).toBeDefined()
    expect(screen.queryByRole('option', { name: 'America/New_York' })).toBeNull()
  })

  it('calls onChange when an option is selected', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<TimezoneSelect value="America/New_York" onChange={onChange} />)
    await user.type(screen.getByRole('textbox', { name: /search timezones/i }), 'london')
    await user.selectOptions(
      screen.getByRole('listbox', { name: /timezone/i }),
      'Europe/London',
    )
    expect(onChange).toHaveBeenCalledWith('Europe/London')
  })
})
