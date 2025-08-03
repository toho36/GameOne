import { render, RenderOptions } from '@testing-library/react'
import { ReactElement, ReactNode } from 'react'
import { vi } from 'vitest'

// Mock auth context provider
export const MockAuthProvider = ({ 
  children, 
  isAuthenticated = false, 
  isLoading = false,
  user = null 
}: {
  children: ReactNode
  isAuthenticated?: boolean
  isLoading?: boolean
  user?: any
}) => {
  const mockAuthContext = {
    isAuthenticated,
    isLoading,
    user,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn()
  }

  // Mock the useAuth hook within this provider
  vi.doMock('@/components/auth/session-provider', () => ({
    useAuth: () => mockAuthContext,
    SessionProvider: ({ children }: { children: ReactNode }) => children
  }))

  return <>{children}</>
}

// Mock i18n provider
export const MockI18nProvider = ({ 
  children 
}: {
  children: ReactNode
  locale?: string
  messages?: Record<string, any>
}) => {
  return <>{children}</>
}

// Custom render function that includes providers
const AllTheProviders = ({ children }: { children: ReactNode }) => {
  return (
    <MockI18nProvider>
      <MockAuthProvider>
        {children}
      </MockAuthProvider>
    </MockI18nProvider>
  )
}

export const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options })

// Re-export everything
export * from '@testing-library/react'

// Override render method
export { customRender as render }

// Test data factories
export const createMockUser = (overrides: Partial<any> = {}) => ({
  id: 'test-user-id',
  email: 'test@example.com',
  given_name: 'Test',
  family_name: 'User',
  picture: 'https://example.com/avatar.jpg',
  ...overrides
})

export const createMockEvent = (overrides: Partial<any> = {}) => ({
  id: 'test-event-id',
  title: 'Test Event',
  description: 'A test event description',
  startDate: new Date('2024-12-01T10:00:00Z'),
  endDate: new Date('2024-12-01T18:00:00Z'),
  capacity: 100,
  status: 'PUBLISHED',
  type: 'MEETUP',
  ...overrides
})

export const createMockRegistration = (overrides: Partial<any> = {}) => ({
  id: 'test-registration-id',
  userId: 'test-user-id',
  eventId: 'test-event-id',
  status: 'CONFIRMED',
  registeredAt: new Date('2024-11-01T10:00:00Z'),
  ...overrides
})

// Mock API responses
export const mockApiResponse = <T,>(data: T, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  json: () => Promise.resolve(data),
  text: () => Promise.resolve(JSON.stringify(data)),
  headers: new Headers()
})

// Mock fetch
export const mockFetch = (response: any) => {
  global.fetch = vi.fn().mockResolvedValue(response)
}

// Wait for async operations
export const waitForLoadingToFinish = () => 
  new Promise(resolve => setTimeout(resolve, 0))

// Mock window location
export const mockWindowLocation = (url: string) => {
  Object.defineProperty(window, 'location', {
    value: new URL(url),
    writable: true
  })
}