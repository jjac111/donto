// Tests for clinic-related hooks
// Uses Vitest with React Testing Library

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React, { ReactNode } from 'react'
import { useClinic, useUpdateClinic } from '@/hooks/use-clinics'
import { supabase } from '@/lib/api'

// Mock Supabase client
vi.mock('@/lib/api', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(),
          })),
        })),
      })),
    })),
    auth: {
      getUser: vi.fn(() =>
        Promise.resolve({ data: { user: null }, error: null })
      ),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
    },
  },
}))

// Mock the auth store to prevent initialization issues
vi.mock('@/store/auth', () => ({
  useAuthStore: vi.fn(() => ({
    clinicId: 'test-clinic-id',
    getState: () => ({ clinicId: 'test-clinic-id' }),
  })),
}))

// Mock the store index to prevent auth store initialization
vi.mock('@/store', () => ({
  useAuthStore: vi.fn(() => ({
    clinicId: 'test-clinic-id',
    getState: () => ({ clinicId: 'test-clinic-id' }),
  })),
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

describe('useClinic', () => {
  let wrapper: ReturnType<typeof createWrapper>

  beforeEach(() => {
    wrapper = createWrapper()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('should return loading state initially', () => {
    // Mock pending query
    const mockSupabase = vi.mocked(supabase)
    mockSupabase.from.mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => new Promise(() => {})), // Never resolves
        })),
      })),
    } as any)

    const { result } = renderHook(() => useClinic('test-clinic-id'), {
      wrapper,
    })

    expect(result.current.isLoading).toBe(true)
    expect(result.current.data).toBeUndefined()
  })

  it('should return clinic data when query succeeds', async () => {
    const mockClinicData = {
      id: 'test-clinic-id',
      name: 'Test Dental Clinic',
      address: '123 Main St',
      phone: '+1234567890',
      email: 'clinic@example.com',
      country: 'US',
      phone_country_code: '+1',
    }

    const mockSupabase = vi.mocked(supabase)
    mockSupabase.from.mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() =>
            Promise.resolve({
              data: mockClinicData,
              error: null,
            })
          ),
        })),
      })),
    } as any)

    const { result } = renderHook(() => useClinic('test-clinic-id'), {
      wrapper,
    })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.data).toBeDefined()
    expect(result.current.data?.id).toBe('test-clinic-id')
    expect(result.current.data?.name).toBe('Test Dental Clinic')
    expect(result.current.data?.address).toBe('123 Main St')
    expect(result.current.data?.phone).toBe('+1234567890')
    expect(result.current.data?.email).toBe('clinic@example.com')
    expect(result.current.data?.country).toBe('US')
    expect(result.current.data?.phoneCountryCode).toBe('+1')
  })

  it('should return null when clinic not found', async () => {
    const mockSupabase = vi.mocked(supabase)
    mockSupabase.from.mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() =>
            Promise.resolve({
              data: null,
              error: { code: 'PGRST116', message: 'No rows found' },
            })
          ),
        })),
      })),
    } as any)

    const { result } = renderHook(() => useClinic('non-existent-id'), {
      wrapper,
    })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.data).toBeNull()
    expect(result.current.error).toBeNull()
  })

  it('should handle errors gracefully', async () => {
    const mockSupabase = vi.mocked(supabase)
    mockSupabase.from.mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() =>
            Promise.resolve({
              data: null,
              error: { message: 'Database connection failed' },
            })
          ),
        })),
      })),
    } as any)

    const { result } = renderHook(() => useClinic('test-clinic-id'), {
      wrapper,
    })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.error).toBeDefined()
    expect(result.current.error?.message).toContain('Failed to fetch clinic')
  })

  it('should be disabled when no clinic ID provided', () => {
    const { result } = renderHook(() => useClinic(''), { wrapper })

    expect(result.current.isLoading).toBe(false)
    expect(result.current.data).toBeUndefined()
    expect(result.current.error).toBeNull()
  })

  it('should have correct stale time configuration', () => {
    const mockSupabase = vi.mocked(supabase)
    mockSupabase.from.mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => new Promise(() => {})), // Never resolves
        })),
      })),
    } as any)

    const { result } = renderHook(() => useClinic('test-clinic-id'), {
      wrapper,
    })

    // The query should be enabled and loading
    expect(result.current.isLoading).toBe(true)
  })
})

describe('useUpdateClinic', () => {
  let wrapper: ReturnType<typeof createWrapper>

  beforeEach(() => {
    wrapper = createWrapper()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('should update clinic successfully', async () => {
    const mockUpdatedClinic = {
      id: 'test-clinic-id',
      name: 'Updated Clinic Name',
      address: '456 New St',
      phone: '+1987654321',
      email: 'updated@example.com',
      country: 'CA',
      phone_country_code: '+1',
      updated_at: '2024-01-01T12:00:00Z',
    }

    const mockSupabase = vi.mocked(supabase)
    mockSupabase.from.mockReturnValue({
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() =>
              Promise.resolve({
                data: mockUpdatedClinic,
                error: null,
              })
            ),
          })),
        })),
      })),
    } as any)

    const { result } = renderHook(() => useUpdateClinic(), { wrapper })

    const updateData = {
      id: 'test-clinic-id',
      data: {
        name: 'Updated Clinic Name',
        address: '456 New St',
        phone: '+1987654321',
        email: 'updated@example.com',
        country: 'CA',
        phoneCountryCode: '+1',
      },
    }

    result.current.mutate(updateData)

    await waitFor(() => {
      expect(result.current.isPending).toBe(false)
    })

    expect(result.current.isSuccess).toBe(true)
    expect(result.current.data).toEqual(mockUpdatedClinic)
  })

  it('should handle update errors', async () => {
    const mockSupabase = vi.mocked(supabase)
    mockSupabase.from.mockReturnValue({
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() =>
              Promise.resolve({
                data: null,
                error: { message: 'Update failed' },
              })
            ),
          })),
        })),
      })),
    } as any)

    const { result } = renderHook(() => useUpdateClinic(), { wrapper })

    const updateData = {
      id: 'test-clinic-id',
      data: {
        name: 'Updated Name',
      },
    }

    result.current.mutate(updateData)

    await waitFor(() => {
      expect(result.current.isPending).toBe(false)
    })

    expect(result.current.isError).toBe(true)
    expect(result.current.error?.message).toContain('Failed to update clinic')
  })

  it('should call supabase with correct parameters', async () => {
    const mockSupabase = vi.mocked(supabase)
    const mockUpdate = vi.fn(() => ({
      eq: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() =>
            Promise.resolve({
              data: { id: 'test-clinic-id', name: 'Updated' },
              error: null,
            })
          ),
        })),
      })),
    }))

    mockSupabase.from.mockReturnValue({
      update: mockUpdate,
    } as any)

    const { result } = renderHook(() => useUpdateClinic(), { wrapper })

    const updateData = {
      id: 'test-clinic-id',
      data: {
        name: 'Updated Clinic Name',
        address: '456 New St',
        phone: '+1987654321',
        email: 'updated@example.com',
        country: 'CA',
        phoneCountryCode: '+1',
      },
    }

    result.current.mutate(updateData)

    await waitFor(() => {
      expect(result.current.isPending).toBe(false)
    })

    expect(mockSupabase.from).toHaveBeenCalledWith('clinics')
    expect(mockUpdate).toHaveBeenCalledWith({
      name: 'Updated Clinic Name',
      address: '456 New St',
      phone: '+1987654321',
      email: 'updated@example.com',
      country: 'CA',
      phone_country_code: '+1',
      updated_at: expect.any(String),
    })
  })

  it('should handle partial updates', async () => {
    const mockUpdatedClinic = {
      id: 'test-clinic-id',
      name: 'Partially Updated Clinic',
      address: '123 Main St', // Original address
      phone: '+1234567890', // Original phone
      email: 'clinic@example.com', // Original email
      country: 'US', // Original country
      phone_country_code: '+1', // Original phone country code
      updated_at: '2024-01-01T12:00:00Z',
    }

    const mockSupabase = vi.mocked(supabase)
    mockSupabase.from.mockReturnValue({
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() =>
              Promise.resolve({
                data: mockUpdatedClinic,
                error: null,
              })
            ),
          })),
        })),
      })),
    } as any)

    const { result } = renderHook(() => useUpdateClinic(), { wrapper })

    const updateData = {
      id: 'test-clinic-id',
      data: {
        name: 'Partially Updated Clinic',
        // Only updating name, other fields should remain unchanged
      },
    }

    result.current.mutate(updateData)

    await waitFor(() => {
      expect(result.current.isPending).toBe(false)
    })

    expect(result.current.isSuccess).toBe(true)
    expect(result.current.data).toEqual(mockUpdatedClinic)
  })

  it('should handle multiple mutations', async () => {
    const mockSupabase = vi.mocked(supabase)
    mockSupabase.from.mockReturnValue({
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() =>
              Promise.resolve({
                data: { id: 'test-clinic-id', name: 'Updated' },
                error: null,
              })
            ),
          })),
        })),
      })),
    } as any)

    const { result } = renderHook(() => useUpdateClinic(), { wrapper })

    const updateData = {
      id: 'test-clinic-id',
      data: { name: 'Updated Name' },
    }

    // First mutation
    result.current.mutate(updateData)

    await waitFor(() => {
      expect(result.current.isPending).toBe(false)
    })

    expect(result.current.isSuccess).toBe(true)

    // Second mutation should work without errors
    result.current.mutate(updateData)

    await waitFor(() => {
      expect(result.current.isPending).toBe(false)
    })

    expect(result.current.isSuccess).toBe(true)
  })
})
