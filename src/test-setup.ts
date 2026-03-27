import './i18n'
import { afterEach, expect } from 'vitest'
import { cleanup } from '@testing-library/react'
import { toHaveNoViolations } from 'jest-axe'

afterEach(cleanup)
expect.extend(toHaveNoViolations)
