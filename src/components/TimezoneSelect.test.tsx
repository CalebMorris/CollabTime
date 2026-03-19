import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { filterTimezones } from '../utils/timezones'
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

  it('calls onChange when an option is clicked in the listbox', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<TimezoneSelect value="America/New_York" onChange={onChange} />)
    await user.type(screen.getByRole('textbox', { name: /search timezones/i }), 'london')
    await user.selectOptions(screen.getByRole('listbox', { name: /timezone/i }), 'Europe/London')
    expect(onChange).toHaveBeenCalledWith('Europe/London')
  })

  it('calls onChange when the sole remaining option is clicked', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<TimezoneSelect value="America/New_York" onChange={onChange} />)
    await user.type(screen.getByRole('textbox', { name: /search timezones/i }), 'Europe/London')
    fireEvent.click(screen.getByRole('listbox', { name: /timezone/i }))
    expect(onChange).toHaveBeenCalledWith('Europe/London')
  })

  // Enter key behaviour

  it('Enter selects the sole remaining option', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<TimezoneSelect value="America/New_York" onChange={onChange} />)
    await user.type(screen.getByRole('textbox', { name: /search timezones/i }), 'Europe/London')
    await user.keyboard('{Enter}')
    expect(onChange).toHaveBeenCalledWith('Europe/London')
  })

  it('Enter does nothing when multiple results remain and none is highlighted', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<TimezoneSelect value="America/New_York" onChange={onChange} />)
    await user.type(screen.getByRole('textbox', { name: /search timezones/i }), 'America')
    await user.keyboard('{Enter}')
    expect(onChange).not.toHaveBeenCalled()
  })

  it('does not call onChange on Enter when the single result is already selected', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<TimezoneSelect value="Europe/London" onChange={onChange} />)
    await user.type(screen.getByRole('textbox', { name: /search timezones/i }), 'Europe/London')
    await user.keyboard('{Enter}')
    expect(onChange).not.toHaveBeenCalled()
  })

  // Arrow key navigation

  // 'America/Chi' matches ['America/Chicago', 'America/Chihuahua'] — 2 known results
  const MULTI_QUERY = 'America/Chi'

  it('ArrowDown highlights the first item, Enter selects it', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<TimezoneSelect value="Europe/London" onChange={onChange} />)
    await user.type(screen.getByRole('textbox', { name: /search timezones/i }), MULTI_QUERY)
    await user.keyboard('{ArrowDown}')
    await user.keyboard('{Enter}')
    expect(onChange).toHaveBeenCalledWith(filterTimezones(MULTI_QUERY)[0]!)
  })

  it('ArrowDown twice highlights the second item, Enter selects it', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<TimezoneSelect value="Europe/London" onChange={onChange} />)
    await user.type(screen.getByRole('textbox', { name: /search timezones/i }), MULTI_QUERY)
    await user.keyboard('{ArrowDown}{ArrowDown}')
    await user.keyboard('{Enter}')
    expect(onChange).toHaveBeenCalledWith(filterTimezones(MULTI_QUERY)[1]!)
  })

  it('ArrowDown then ArrowUp returns to the first item', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<TimezoneSelect value="Europe/London" onChange={onChange} />)
    await user.type(screen.getByRole('textbox', { name: /search timezones/i }), MULTI_QUERY)
    await user.keyboard('{ArrowDown}{ArrowDown}{ArrowUp}')
    await user.keyboard('{Enter}')
    expect(onChange).toHaveBeenCalledWith(filterTimezones(MULTI_QUERY)[0]!)
  })

  it('typing after navigation resets the highlight', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<TimezoneSelect value="Europe/London" onChange={onChange} />)
    await user.type(screen.getByRole('textbox', { name: /search timezones/i }), 'America/New')
    await user.keyboard('{ArrowDown}{ArrowDown}') // highlight second item
    await user.type(screen.getByRole('textbox', { name: /search timezones/i }), '_York') // refine to 1 result
    // highlight reset — but 1 result remains so Enter still works
    await user.keyboard('{Enter}')
    expect(onChange).toHaveBeenCalledWith('America/New_York')
  })
})
