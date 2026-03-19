import { render, screen } from '@testing-library/react'
import { useState } from 'react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { filterTimezones } from '../utils/timezones'
import { TimezoneSelect } from './TimezoneSelect'

// Helpers
function getInput() {
  return screen.getByRole('combobox', { name: /search timezones/i })
}
function getOptions() {
  return screen.queryAllByRole('option')
}

describe('TimezoneSelect', () => {
  it('renders the search input with combobox role', () => {
    render(<TimezoneSelect value="America/New_York" onChange={() => {}} />)
    expect(getInput()).toBeDefined()
  })

  it('initializes the search input with the current timezone', () => {
    render(<TimezoneSelect value="America/New_York" onChange={() => {}} />)
    expect((getInput() as HTMLInputElement).value).toBe('America/New_York')
  })

  it('does not show the listbox on mount (pre-select state)', () => {
    render(<TimezoneSelect value="America/New_York" onChange={() => {}} />)
    expect(getOptions()).toHaveLength(0)
  })

  it('shows the listbox once the query diverges from the current value', async () => {
    const user = userEvent.setup()
    render(<TimezoneSelect value="America/New_York" onChange={() => {}} />)
    await user.clear(getInput())
    await user.type(getInput(), 'london')
    expect(getOptions().some(o => o.textContent?.includes('Europe/London'))).toBe(true)
  })

  it('collapses the listbox after a timezone is selected', async () => {
    const user = userEvent.setup()
    function Controlled() {
      const [tz, setTz] = useState('America/New_York')
      return <TimezoneSelect value={tz} onChange={setTz} />
    }
    render(<Controlled />)
    await user.clear(getInput())
    await user.type(getInput(), 'Europe/London')
    await user.click(getOptions()[0]!)
    expect(getOptions()).toHaveLength(0)
  })

  it('ring is shown on the sole result when it differs from current value', async () => {
    const user = userEvent.setup()
    render(<TimezoneSelect value="America/New_York" onChange={() => {}} />)
    await user.clear(getInput())
    await user.type(getInput(), 'Europe/London')
    const option = getOptions()[0]!
    expect(option.className).toContain('ring-inset')
  })

  it('ring is not shown when sole result matches current value', async () => {
    const user = userEvent.setup()
    render(<TimezoneSelect value="Europe/London" onChange={() => {}} />)
    await user.clear(getInput())
    await user.type(getInput(), 'Europe/London')
    // query === value → isDirty is false → no options rendered at all
    expect(getOptions()).toHaveLength(0)
  })

  it('ring is not shown when sole result is keyboard-focused', async () => {
    const user = userEvent.setup()
    render(<TimezoneSelect value="America/New_York" onChange={() => {}} />)
    await user.clear(getInput())
    await user.type(getInput(), 'Europe/London')
    await user.keyboard('{ArrowDown}')
    const option = getOptions()[0]!
    expect(option.className).not.toContain('ring-inset')
  })

  it('shows no options when query is cleared', async () => {
    const user = userEvent.setup()
    render(<TimezoneSelect value="America/New_York" onChange={() => {}} />)
    await user.clear(getInput())
    expect(getOptions()).toHaveLength(0)
  })

  it('updates the search input after selecting a new timezone', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<TimezoneSelect value="America/New_York" onChange={onChange} />)
    await user.clear(getInput())
    await user.type(getInput(), 'Europe/London')
    await user.click(getOptions()[0]!)
    expect((getInput() as HTMLInputElement).value).toBe('Europe/London')
  })

  it('shows options that match the query', async () => {
    const user = userEvent.setup()
    render(<TimezoneSelect value="America/New_York" onChange={() => {}} />)
    await user.clear(getInput())
    await user.type(getInput(), 'london')
    expect(getOptions().some(o => o.textContent?.includes('Europe/London'))).toBe(true)
  })

  it('option text includes the UTC offset label', async () => {
    const user = userEvent.setup()
    render(<TimezoneSelect value="America/New_York" onChange={() => {}} />)
    await user.clear(getInput())
    await user.type(getInput(), 'Europe/London')
    const option = getOptions().find(o => o.textContent?.includes('Europe/London'))
    expect(option?.textContent).toMatch(/^\(UTC/)
  })

  it('filters out non-matching options', async () => {
    const user = userEvent.setup()
    render(<TimezoneSelect value="America/New_York" onChange={() => {}} />)
    await user.clear(getInput())
    await user.type(getInput(), 'london')
    expect(getOptions().some(o => o.textContent?.includes('America/New_York'))).toBe(false)
  })

  it('calls onChange when an option is clicked', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<TimezoneSelect value="America/New_York" onChange={onChange} />)
    await user.clear(getInput())
    await user.type(getInput(), 'london')
    const option = getOptions().find(o => o.textContent?.includes('Europe/London'))!
    await user.click(option)
    expect(onChange).toHaveBeenCalledWith('Europe/London')
  })

  it('calls onChange when the sole remaining option is clicked', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<TimezoneSelect value="America/New_York" onChange={onChange} />)
    await user.clear(getInput())
    await user.type(getInput(), 'Europe/London')
    await user.click(getOptions()[0]!)
    expect(onChange).toHaveBeenCalledWith('Europe/London')
  })

  it('marks the current value option as aria-selected', async () => {
    const user = userEvent.setup()
    render(<TimezoneSelect value="Europe/London" onChange={() => {}} />)
    await user.clear(getInput())
    await user.type(getInput(), 'london')
    const option = getOptions().find(o => o.textContent?.includes('Europe/London'))!
    expect(option.getAttribute('aria-selected')).toBe('true')
  })

  it('announces result count in a status region', async () => {
    const user = userEvent.setup()
    render(<TimezoneSelect value="America/New_York" onChange={() => {}} />)
    await user.clear(getInput())
    await user.type(getInput(), 'Europe/London')
    expect(screen.getByRole('status').textContent).toMatch(/1 timezone/)
  })

  // Enter key behaviour

  it('Enter selects the sole remaining option', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<TimezoneSelect value="America/New_York" onChange={onChange} />)
    await user.clear(getInput())
    await user.type(getInput(), 'Europe/London')
    await user.keyboard('{Enter}')
    expect(onChange).toHaveBeenCalledWith('Europe/London')
  })

  it('Enter does nothing when multiple results remain and none is highlighted', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<TimezoneSelect value="America/New_York" onChange={onChange} />)
    await user.clear(getInput())
    await user.type(getInput(), 'America/Chi')
    await user.keyboard('{Enter}')
    expect(onChange).not.toHaveBeenCalled()
  })

  it('does not call onChange on Enter when the single result is already selected', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<TimezoneSelect value="Europe/London" onChange={onChange} />)
    await user.clear(getInput())
    await user.type(getInput(), 'Europe/London')
    await user.keyboard('{Enter}')
    expect(onChange).not.toHaveBeenCalled()
  })

  // Arrow key navigation — 'America/Chi' matches Chicago + Chihuahua (2 results)
  const MULTI_QUERY = 'America/Chi'

  it('ArrowDown highlights the first item, Enter selects it', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<TimezoneSelect value="Europe/London" onChange={onChange} />)
    await user.clear(getInput())
    await user.type(getInput(), MULTI_QUERY)
    await user.keyboard('{ArrowDown}')
    await user.keyboard('{Enter}')
    expect(onChange).toHaveBeenCalledWith(filterTimezones(MULTI_QUERY)[0]!)
  })

  it('ArrowDown twice highlights the second item, Enter selects it', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<TimezoneSelect value="Europe/London" onChange={onChange} />)
    await user.clear(getInput())
    await user.type(getInput(), MULTI_QUERY)
    await user.keyboard('{ArrowDown}{ArrowDown}')
    await user.keyboard('{Enter}')
    expect(onChange).toHaveBeenCalledWith(filterTimezones(MULTI_QUERY)[1]!)
  })

  it('ArrowDown then ArrowUp returns to the first item', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<TimezoneSelect value="Europe/London" onChange={onChange} />)
    await user.clear(getInput())
    await user.type(getInput(), MULTI_QUERY)
    await user.keyboard('{ArrowDown}{ArrowDown}{ArrowUp}')
    await user.keyboard('{Enter}')
    expect(onChange).toHaveBeenCalledWith(filterTimezones(MULTI_QUERY)[0]!)
  })

  it('typing after navigation resets the highlight', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<TimezoneSelect value="Europe/London" onChange={onChange} />)
    await user.clear(getInput())
    await user.type(getInput(), 'America/New')
    await user.keyboard('{ArrowDown}{ArrowDown}')
    await user.type(getInput(), '_York')
    await user.keyboard('{Enter}')
    expect(onChange).toHaveBeenCalledWith('America/New_York')
  })
})
