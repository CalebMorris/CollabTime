import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { NicknameDisplay } from './NicknameDisplay'

describe('NicknameDisplay', () => {
  it('renders the nickname', () => {
    render(<NicknameDisplay nickname="Teal Fox" />)
    expect(screen.getByText(/teal fox/i)).toBeDefined()
  })

  it('includes a label indicating it is the user\'s nickname', () => {
    render(<NicknameDisplay nickname="Teal Fox" />)
    expect(screen.getByText(/your nickname/i)).toBeDefined()
  })
})
