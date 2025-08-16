import { describe, it, expect } from 'vitest'
import { routing } from '@/i18n/routing'

describe('i18n routing configuration', () => {
  it('has correct supported locales', () => {
    expect(routing.locales).toEqual(['en', 'cs'])
  })

  it('has correct default locale', () => {
    expect(routing.defaultLocale).toBe('en')
  })

  it('includes both English and Czech locales', () => {
    expect(routing.locales).toContain('en')
    expect(routing.locales).toContain('cs')
  })

  it('has exactly 2 supported locales', () => {
    expect(routing.locales).toHaveLength(2)
  })

  it('default locale is included in supported locales', () => {
    expect(routing.locales).toContain(routing.defaultLocale)
  })
})