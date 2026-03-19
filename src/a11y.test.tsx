import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import { axe } from 'jest-axe'

import { TextImport } from './components/TextImport'
import { ManualSelector } from './components/ManualSelector'
import { ConversionDisplay } from './components/ConversionDisplay'
import { DiscordExport } from './components/DiscordExport'
import { ShareLink } from './components/ShareLink'
import { TimezoneSelect } from './components/TimezoneSelect'

// Nov 28 2018 11:01:00 UTC — a fixed, well-known timestamp
const FIXED_MS = 1543392060000
const TIMEZONE = 'America/New_York'

describe('Accessibility: no axe violations', () => {
  it('TextImport — idle state', async () => {
    const { container } = render(<TextImport onTime={() => {}} />)
    expect(await axe(container)).toHaveNoViolations()
  })

  it('TextImport — error state', async () => {
    const { container, getByRole } = render(<TextImport onTime={() => {}} />)
    // Trigger a parse error by clicking Parse with empty input
    getByRole('button', { name: /parse/i }).click()
    expect(await axe(container)).toHaveNoViolations()
  })

  it('ManualSelector', async () => {
    const { container } = render(
      <ManualSelector
        timezone={TIMEZONE}
        onTime={() => {}}
        value={FIXED_MS}
      />,
    )
    expect(await axe(container)).toHaveNoViolations()
  })

  it('TimezoneSelect', async () => {
    const { container } = render(
      <TimezoneSelect value={TIMEZONE} onChange={() => {}} />,
    )
    expect(await axe(container)).toHaveNoViolations()
  })

  it('ConversionDisplay', async () => {
    const { container } = render(
      <ConversionDisplay timestamp={FIXED_MS} timezone={TIMEZONE} />,
    )
    expect(await axe(container)).toHaveNoViolations()
  })

  it('DiscordExport', async () => {
    Object.assign(navigator, {
      clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
    })
    const { container } = render(
      <DiscordExport timestamp={FIXED_MS} timezone={TIMEZONE} />,
    )
    expect(await axe(container)).toHaveNoViolations()
  })

  it('ShareLink', async () => {
    Object.assign(navigator, {
      clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
    })
    const { container } = render(<ShareLink timestamp={FIXED_MS} />)
    expect(await axe(container)).toHaveNoViolations()
  })
})
