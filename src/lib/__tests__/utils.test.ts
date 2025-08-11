import { describe, it, expect } from 'vitest'
import { cn } from '../utils'

describe('cn utility function', () => {
  it('merges class names correctly', () => {
    const result = cn('px-2 py-1', 'text-sm')
    expect(result).toBe('px-2 py-1 text-sm')
  })

  it('handles conditional classes', () => {
    const result = cn('base-class', 'conditional-class', 'hidden-class')
    expect(result).toBe('base-class conditional-class')
  })

  it('resolves Tailwind conflicts correctly', () => {
    // twMerge should resolve conflicting padding classes
    const result = cn('px-2', 'px-4')
    expect(result).toBe('px-4')
  })

  it('handles empty and undefined inputs', () => {
    const result = cn('', undefined, null, 'valid-class')
    expect(result).toBe('valid-class')
  })

  it('handles complex object syntax', () => {
    const result = cn({
      'active': true,
      'disabled': false,
      'error': undefined
    })
    expect(result).toBe('active')
  })

  it('combines arrays and objects', () => {
    const result = cn(['flex', 'items-center'], { 'justify-center': true })
    expect(result).toBe('flex items-center justify-center')
  })
})