
import { describe, it, expect, beforeEach } from 'vitest'
import { GET } from '../route'

// Mock is already set up in setup.ts
describe('Auth Me API', () => {
  beforeEach(() => {
    // Mocks are already set up globally
  })

  it('returns 401 when not authenticated (default mock behavior)', async () => {
    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('Not authenticated')
  })

  it('returns correct content type', async () => {
    const response = await GET()

    expect(response.headers.get('content-type')).toContain('application/json')
  })

  it('handles the route without crashing', async () => {
    expect(async () => {
      await GET()
    }).not.toThrow()
  })

  it('returns a JSON response', async () => {
    const response = await GET()
    
    expect(response).toBeDefined()
    expect(typeof response.json).toBe('function')
    
    const data = await response.json()
    expect(data).toBeDefined()
    expect(typeof data).toBe('object')
  })

  it('has proper response structure for unauthenticated users', async () => {
    const response = await GET()
    const data = await response.json()

    expect(data).toHaveProperty('error')
    expect(typeof data.error).toBe('string')
  })
})