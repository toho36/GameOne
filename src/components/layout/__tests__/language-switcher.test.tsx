import React from 'react'
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@/test/utils'
import { LanguageSwitcher } from '@/components/layout/language-switcher'

// Since we're using globals, let's rely on the global mocks from setup.ts
describe('LanguageSwitcher', () => {
  beforeEach(() => {
    // The mocks are already set up globally, so we don't need to mock here
  })

  it('renders both language options', () => {
    render(<LanguageSwitcher currentLocale="en" />)
    
    expect(screen.getByText('EN')).toBeInTheDocument()
    expect(screen.getByText('CS')).toBeInTheDocument()
  })

  it('highlights current locale', () => {
    render(<LanguageSwitcher currentLocale="en" />)
    
    const enButton = screen.getByText('EN')
    const csButton = screen.getByText('CS')
    
    expect(enButton).toHaveClass('bg-blue-600', 'text-white')
    expect(csButton).not.toHaveClass('bg-blue-600', 'text-white')
  })

  it('renders compact version correctly', () => {
    render(<LanguageSwitcher currentLocale="en" variant="compact" />)
    
    const container = screen.getByText('EN').closest('div')
    expect(container).toHaveClass('p-0.5')
  })

  it('applies custom className', () => {
    const { container } = render(
      <LanguageSwitcher currentLocale="en" className="custom-class" />
    )
    
    expect(container.firstChild).toHaveClass('custom-class')
  })

  it('highlights Czech when it is current locale', () => {
    render(<LanguageSwitcher currentLocale="cs" />)
    
    const enButton = screen.getByText('EN')
    const csButton = screen.getByText('CS')
    
    expect(csButton).toHaveClass('bg-blue-600', 'text-white')
    expect(enButton).not.toHaveClass('bg-blue-600', 'text-white')
  })
})