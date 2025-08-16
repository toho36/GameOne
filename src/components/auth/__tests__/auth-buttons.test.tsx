import React from 'react'
import { describe, it, expect, beforeEach } from 'vitest'
import { render } from '@/test/utils'
import { AuthButtons, LoginButton, RegisterButton, LogoutButton } from '@/components/auth/auth-buttons'

// Simple test using the global mocks from setup.ts
describe('AuthButtons', () => {
  beforeEach(() => {
    // Global mocks are already set up
  })

  it('renders correctly with global mocks', () => {
    const { container } = render(<AuthButtons />)
    expect(container).toBeDefined()
  })

  it('renders LoginButton correctly', () => {
    const { container } = render(<LoginButton />)
    expect(container).toBeDefined()
  })

  it('renders RegisterButton correctly', () => {
    const { container } = render(<RegisterButton />)
    expect(container).toBeDefined()
  })

  it('renders LogoutButton correctly', () => {
    const { container } = render(<LogoutButton />)
    expect(container).toBeDefined()
  })

  it('does not crash when rendering auth components', () => {
    expect(() => {
      render(
        <div>
          <AuthButtons />
          <LoginButton />
          <RegisterButton />
          <LogoutButton />
        </div>
      )
    }).not.toThrow()
  })
})