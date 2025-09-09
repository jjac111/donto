// Tests for patient-related hooks
// Uses Vitest with React Testing Library

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactNode } from 'react'

// Mock the auth store
vi.mock('@/store/auth', () => ({
  useAuthStore: vi.fn(() => ({
    clinicId: 'test-clinic-id',
    getState: () => ({ clinicId: 'test-clinic-id' }),
  })),
}))

// Mock Supabase client
vi.mock('@/lib/api', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        order: vi.fn(() => ({
          limit: vi.fn(() => ({
            single: vi.fn(),
          })),
        })),
      })),
    })),
  },
}))

// Test wrapper component
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })

  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('useRecentPatients', () => {
  let wrapper: ReturnType<typeof createWrapper>

  beforeEach(() => {
    wrapper = createWrapper()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('should return loading state initially', () => {
    // Mock pending query
    const mockSupabase = vi.mocked(require('@/lib/api').supabase)
    mockSupabase.from.mockReturnValue({
      select: vi.fn(() => ({
        order: vi.fn(() => ({
          limit: vi.fn(() => new Promise(() => {})), // Never resolves
        })),
      })),
    } as any)

    const { result } = renderHook(
      () => {
        const { useRecentPatients } = require('@/hooks/use-patients')
        return useRecentPatients(10)
      },
      { wrapper }
    )

    expect(result.current.isLoading).toBe(true)
    expect(result.current.data).toBeUndefined()
  })

  it('should return patients data when query succeeds', async () => {
    const mockPatients = [
      {
        id: '1',
        person_id: 'person-1',
        clinic_id: 'test-clinic-id',
        created_at: '2024-01-01T00:00:00Z',
        person: {
          id: 'person-1',
          first_name: 'John',
          last_name: 'Doe',
          date_of_birth: '1990-01-01',
          email: 'john@example.com',
        },
      },
    ]

    const mockSupabase = vi.mocked(require('@/lib/api').supabase)
    mockSupabase.from.mockReturnValue({
      select: vi.fn(() => ({
        order: vi.fn(() => ({
          limit: vi.fn(() =>
            Promise.resolve({
              data: mockPatients,
              error: null,
            })
          ),
        })),
      })),
    } as any)

    const { result } = renderHook(
      () => {
        const { useRecentPatients } = require('@/hooks/use-patients')
        return useRecentPatients(10)
      },
      { wrapper }
    )

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.data).toBeDefined()
    expect(result.current.data?.length).toBe(1)
    expect(result.current.data?.[0].id).toBe('1')
    expect(result.current.data?.[0].displayName).toBe('John Doe')
  })

  it('should handle empty results', async () => {
    const mockSupabase = vi.mocked(require('@/lib/api').supabase)
    mockSupabase.from.mockReturnValue({
      select: vi.fn(() => ({
        order: vi.fn(() => ({
          limit: vi.fn(() =>
            Promise.resolve({
              data: [],
              error: null,
            })
          ),
        })),
      })),
    } as any)

    const { result } = renderHook(
      () => {
        const { useRecentPatients } = require('@/hooks/use-patients')
        return useRecentPatients(10)
      },
      { wrapper }
    )

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.data).toEqual([])
  })

  it('should handle errors gracefully', async () => {
    const mockError = new Error('Database connection failed')
    const mockSupabase = vi.mocked(require('@/lib/api').supabase)
    mockSupabase.from.mockReturnValue({
      select: vi.fn(() => ({
        order: vi.fn(() => ({
          limit: vi.fn(() =>
            Promise.resolve({
              data: null,
              error: { message: 'Database connection failed' },
            })
          ),
        })),
      })),
    } as any)

    const { result } = renderHook(
      () => {
        const { useRecentPatients } = require('@/hooks/use-patients')
        return useRecentPatients(10)
      },
      { wrapper }
    )

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.error).toBeDefined()
    expect(result.current.error?.message).toContain(
      'Failed to fetch recent patients'
    )
  })

  it('should handle missing clinic ID', async () => {
    // Mock auth store to return no clinic
    const mockAuthStore = vi.mocked(require('@/store/auth').useAuthStore)
    mockAuthStore.mockReturnValue({
      clinicId: null,
      getState: () => ({ clinicId: null }),
    })

    const { result } = renderHook(
      () => {
        const { useRecentPatients } = require('@/hooks/use-patients')
        return useRecentPatients(10)
      },
      { wrapper }
    )

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.data).toEqual([])
    expect(result.current.error).toBeUndefined()
  })
})

describe('useCreatePatient', () => {
  let wrapper: ReturnType<typeof createWrapper>

  beforeEach(() => {
    wrapper = createWrapper()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('should create patient successfully', async () => {
    const mockPatient = {
      id: 'new-patient-id',
      person_id: 'new-person-id',
      clinic_id: 'test-clinic-id',
      created_at: '2024-01-01T00:00:00Z',
      person: {
        id: 'new-person-id',
        first_name: 'Jane',
        last_name: 'Smith',
        date_of_birth: '1995-01-01',
        email: 'jane@example.com',
      },
    }

    const mockSupabase = vi.mocked(require('@/lib/api').supabase)

    // Mock person creation
    mockSupabase.from
      .mockImplementationOnce(
        () =>
          ({
            insert: vi.fn(() => ({
              select: vi.fn(() => ({
                single: vi.fn(() =>
                  Promise.resolve({
                    data: mockPatient.person,
                    error: null,
                  })
                ),
              })),
            })),
          } as any)
      )
      // Mock patient creation
      .mockImplementationOnce(
        () =>
          ({
            insert: vi.fn(() => ({
              select: vi.fn(() => ({
                single: vi.fn(() =>
                  Promise.resolve({
                    data: mockPatient,
                    error: null,
                  })
                ),
              })),
            })),
          } as any)
      )

    const { result } = renderHook(
      () => {
        const { useCreatePatient } = require('@/hooks/use-patients')
        return useCreatePatient()
      },
      { wrapper }
    )

    const patientData = {
      person: {
        firstName: 'Jane',
        lastName: 'Smith',
        dateOfBirth: new Date('1995-01-01'),
        nationalId: '123456789',
        country: 'EC',
      },
    }

    result.current.mutate(patientData, {
      onSuccess: data => {
        expect(data.id).toBe('new-patient-id')
        expect(data.displayName).toBe('Jane Smith')
      },
    })

    await waitFor(() => {
      expect(result.current.isPending).toBe(false)
    })
  })
})
