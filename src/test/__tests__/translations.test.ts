import { describe, it, expect } from 'vitest'
import enMessages from '../../../messages/en.json'
import csMessages from '../../../messages/cs.json'

describe('Translation files', () => {
  describe('English translations', () => {
    it('has required HomePage keys', () => {
      expect(enMessages.HomePage).toHaveProperty('title')
      expect(enMessages.HomePage).toHaveProperty('description')
      expect(enMessages.HomePage).toHaveProperty('getStarted')
      expect(enMessages.HomePage).toHaveProperty('learnMore')
    })

    it('has required Dashboard keys', () => {
      expect(enMessages.Dashboard).toHaveProperty('title')
      expect(enMessages.Dashboard).toHaveProperty('welcome')
      expect(enMessages.Dashboard).toHaveProperty('userInfo')
    })

    it('has required Auth keys', () => {
      expect(enMessages.Auth).toHaveProperty('signIn')
      expect(enMessages.Auth).toHaveProperty('signUp')
      expect(enMessages.Auth).toHaveProperty('signOut')
    })

    it('has required Navigation keys', () => {
      expect(enMessages.Navigation).toHaveProperty('home')
      expect(enMessages.Navigation).toHaveProperty('dashboard')
    })

    it('has required Language keys', () => {
      expect(enMessages.Language).toHaveProperty('switchTo')
      expect(enMessages.Language).toHaveProperty('currentLanguage')
    })

    it('has required Common keys', () => {
      expect(enMessages.Common).toHaveProperty('loading')
      expect(enMessages.Common).toHaveProperty('error')
      expect(enMessages.Common).toHaveProperty('retry')
    })
  })

  describe('Czech translations', () => {
    it('has required HomePage keys', () => {
      expect(csMessages.HomePage).toHaveProperty('title')
      expect(csMessages.HomePage).toHaveProperty('description')
      expect(csMessages.HomePage).toHaveProperty('getStarted')
      expect(csMessages.HomePage).toHaveProperty('learnMore')
    })

    it('has required Dashboard keys', () => {
      expect(csMessages.Dashboard).toHaveProperty('title')
      expect(csMessages.Dashboard).toHaveProperty('welcome')
      expect(csMessages.Dashboard).toHaveProperty('userInfo')
    })

    it('has required Auth keys', () => {
      expect(csMessages.Auth).toHaveProperty('signIn')
      expect(csMessages.Auth).toHaveProperty('signUp')
      expect(csMessages.Auth).toHaveProperty('signOut')
    })

    it('has required Navigation keys', () => {
      expect(csMessages.Navigation).toHaveProperty('home')
      expect(csMessages.Navigation).toHaveProperty('dashboard')
    })

    it('has required Language keys', () => {
      expect(csMessages.Language).toHaveProperty('switchTo')
      expect(csMessages.Language).toHaveProperty('currentLanguage')
    })

    it('has required Common keys', () => {
      expect(csMessages.Common).toHaveProperty('loading')
      expect(csMessages.Common).toHaveProperty('error')
      expect(csMessages.Common).toHaveProperty('retry')
    })
  })

  describe('Translation consistency', () => {
    const getKeysRecursively = (obj: any, prefix = ''): string[] => {
      const keys: string[] = []
      for (const key in obj) {
        const fullKey = prefix ? `${prefix}.${key}` : key
        if (typeof obj[key] === 'object' && obj[key] !== null) {
          keys.push(...getKeysRecursively(obj[key], fullKey))
        } else {
          keys.push(fullKey)
        }
      }
      return keys
    }

    it('has same keys in both languages', () => {
      const enKeys = getKeysRecursively(enMessages).sort()
      const csKeys = getKeysRecursively(csMessages).sort()

      expect(enKeys).toEqual(csKeys)
    })

    it('has same nested structure in both languages', () => {
      const enStructure = Object.keys(enMessages).sort()
      const csStructure = Object.keys(csMessages).sort()

      expect(enStructure).toEqual(csStructure)
    })

    it('both languages have non-empty values', () => {
      const checkNonEmptyValues = (obj: any, path = ''): void => {
        for (const key in obj) {
          const currentPath = path ? `${path}.${key}` : key
          if (typeof obj[key] === 'object' && obj[key] !== null) {
            checkNonEmptyValues(obj[key], currentPath)
          } else {
            expect(obj[key], `${currentPath} should not be empty`).toBeTruthy()
            expect(typeof obj[key], `${currentPath} should be a string`).toBe('string')
          }
        }
      }

      checkNonEmptyValues(enMessages)
      checkNonEmptyValues(csMessages)
    })

    it('placeholder syntax is consistent between languages', () => {
      const getPlaceholders = (text: string): string[] => {
        const matches = text.match(/\{[^}]+\}/g)
        return matches || []
      }

      const checkPlaceholders = (enObj: any, csObj: any, path = ''): void => {
        for (const key in enObj) {
          const currentPath = path ? `${path}.${key}` : key
          if (typeof enObj[key] === 'object' && enObj[key] !== null) {
            checkPlaceholders(enObj[key], csObj[key], currentPath)
          } else if (typeof enObj[key] === 'string') {
            const enPlaceholders = getPlaceholders(enObj[key]).sort()
            const csPlaceholders = getPlaceholders(csObj[key]).sort()
            
            expect(enPlaceholders, `Placeholders should match for ${currentPath}`)
              .toEqual(csPlaceholders)
          }
        }
      }

      checkPlaceholders(enMessages, csMessages)
    })
  })

  describe('Specific translation content', () => {
    it('has appropriate Czech translations', () => {
      expect(csMessages.HomePage.title).toContain('GameOne')
      expect(csMessages.Auth.signIn).toBe('Přihlásit se')
      expect(csMessages.Auth.signUp).toBe('Registrovat se')
      expect(csMessages.Navigation.home).toBe('Domů')
      expect(csMessages.Navigation.dashboard).toBe('Nástěnka')
    })

    it('maintains consistent terminology', () => {
      // Check that "GameOne" brand name is consistent
      expect(enMessages.HomePage.title).toContain('GameOne')
      expect(csMessages.HomePage.title).toContain('GameOne')
    })
  })
})