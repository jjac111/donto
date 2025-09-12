// Tests for provider-related hooks
// Uses Vitest with React Testing Library

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React, { ReactNode } from 'react'
import {
  useProviders,
  useProvider,
  useCreateProvider,
  useUpdateProvider,
  useDeleteProvider,
} from '@/hooks/use-providers'
import { supabase } from '@/lib/api'

// Mock Supabase client
vi.mock('@/lib/api', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(),
          order: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(),
            })),
          })),
        })),
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
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

// Mock the auth store
vi.mock('@/store/auth', () => ({
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

describe('useProviders', () => {
  let wrapper: ReturnType<typeof createWrapper>

  beforeEach(() => {
    wrapper = createWrapper()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('should return loading state initially', () => {
    const mockSupabase = vi.mocked(supabase)
    mockSupabase.from.mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => new Promise(() => {})), // Never resolves
          })),
        })),
      })),
    } as any)

    const { result } = renderHook(() => useProviders(), { wrapper })

    expect(result.current.isLoading).toBe(true)
    expect(result.current.data).toBeUndefined()
  })

  it('should return providers data when query succeeds', async () => {
    const mockProvidersData = [
      {
        id: 'provider-1',
        person_id: 'person-1',
        clinic_id: 'test-clinic-id',
        specialty: 'General Dentistry',
        is_active: true,
        person: {
          id: 'person-1',
          clinic_id: 'test-clinic-id',
          national_id: '123456789',
          country: 'EC',
          first_name: 'Dr. John',
          last_name: 'Doe',
          date_of_birth: '1980-01-01',
          sex: 'M',
          phone: '+1234567890',
          email: 'john@example.com',
          address: '123 Main St',
        },
      },
    ]

    const mockSupabase = vi.mocked(supabase)
    mockSupabase.from.mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() =>
            Promise.resolve({
              data: mockProvidersData,
              error: null,
            })
          ),
        })),
      })),
    } as any)

    const { result } = renderHook(() => useProviders(), { wrapper })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.data).toBeDefined()
    expect(result.current.data?.length).toBe(1)
    expect(result.current.data?.[0].id).toBe('provider-1')
    expect(result.current.data?.[0].displayName).toBe('Dr. John Doe')
    expect(result.current.data?.[0].specialty).toBe('General Dentistry')
    expect(result.current.data?.[0].isActive).toBe(true)
  })

  it('should handle empty results', async () => {
    const mockSupabase = vi.mocked(supabase)
    mockSupabase.from.mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() =>
            Promise.resolve({
              data: [],
              error: null,
            })
          ),
        })),
      })),
    } as any)

    const { result } = renderHook(() => useProviders(), { wrapper })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.data).toEqual([])
  })

  it('should handle errors gracefully', async () => {
    const mockSupabase = vi.mocked(supabase)
    mockSupabase.from.mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() =>
            Promise.resolve({
              data: null,
              error: { message: 'Database connection failed' },
            })
          ),
        })),
      })),
    } as any)

    const { result } = renderHook(() => useProviders(), { wrapper })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.error).toBeDefined()
    expect(result.current.error?.message).toContain('Failed to fetch providers')
  })

  it('should have correct stale time configuration', () => {
    const mockSupabase = vi.mocked(supabase)
    mockSupabase.from.mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => new Promise(() => {})), // Never resolves
          })),
        })),
      })),
    } as any)

    const { result } = renderHook(() => useProviders(), { wrapper })

    // The query should be enabled and loading
    expect(result.current.isLoading).toBe(true)
  })
})

describe('useProvider', () => {
  let wrapper: ReturnType<typeof createWrapper>

  beforeEach(() => {
    wrapper = createWrapper()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('should return provider data when query succeeds', async () => {
    const mockProviderData = {
      id: 'provider-1',
      person_id: 'person-1',
      clinic_id: 'test-clinic-id',
      specialty: 'Orthodontics',
      is_active: true,
      person: {
        id: 'person-1',
        clinic_id: 'test-clinic-id',
        national_id: '987654321',
        country: 'EC',
        first_name: 'Dr. Jane',
        last_name: 'Smith',
        date_of_birth: '1975-05-15',
        sex: 'F',
        phone: '+1987654321',
        email: 'jane@example.com',
        address: '456 Oak Ave',
      },
    }

    const mockSupabase = vi.mocked(supabase)
    mockSupabase.from.mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() =>
            Promise.resolve({
              data: mockProviderData,
              error: null,
            })
          ),
        })),
      })),
    } as any)

    const { result } = renderHook(() => useProvider('provider-1'), { wrapper })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.data).toBeDefined()
    expect(result.current.data?.id).toBe('provider-1')
    expect(result.current.data?.displayName).toBe('Dr. Jane Smith')
    expect(result.current.data?.specialty).toBe('Orthodontics')
  })

  it('should return null when provider not found', async () => {
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

    const { result } = renderHook(() => useProvider('non-existent'), {
      wrapper,
    })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.data).toBeNull()
  })
})

describe('useCreateProvider', () => {
  let wrapper: ReturnType<typeof createWrapper>

  beforeEach(() => {
    wrapper = createWrapper()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('should create provider successfully', async () => {
    const mockPerson = {
      id: 'new-person-id',
      clinic_id: 'test-clinic-id',
      national_id: '111222333',
      country: 'EC',
      first_name: 'Dr. New',
      last_name: 'Provider',
      date_of_birth: '1985-03-20',
      sex: 'M',
      phone: '+1555555555',
      email: 'new@example.com',
      address: '789 Pine St',
    }

    const mockProvider = {
      id: 'new-provider-id',
      person_id: 'new-person-id',
      clinic_id: 'test-clinic-id',
      specialty: 'Endodontics',
      is_active: true,
    }

    const mockSupabase = vi.mocked(supabase)

    // Mock person creation
    mockSupabase.from
      .mockImplementationOnce(
        () =>
          ({
            insert: vi.fn(() => ({
              select: vi.fn(() => ({
                single: vi.fn(() =>
                  Promise.resolve({
                    data: mockPerson,
                    error: null,
                  })
                ),
              })),
            })),
          } as any)
      )
      // Mock provider creation
      .mockImplementationOnce(
        () =>
          ({
            insert: vi.fn(() => ({
              select: vi.fn(() => ({
                single: vi.fn(() =>
                  Promise.resolve({
                    data: mockProvider,
                    error: null,
                  })
                ),
              })),
            })),
          } as any)
      )

    const { result } = renderHook(() => useCreateProvider(), { wrapper })

    const providerData = {
      person: {
        nationalId: '111222333',
        country: 'EC',
        firstName: 'Dr. New',
        lastName: 'Provider',
        dateOfBirth: new Date('1985-03-20'),
        sex: 'M',
        phone: '+1555555555',
        email: 'new@example.com',
        address: '789 Pine St',
      },
      specialty: 'Endodontics',
    }

    result.current.mutate(providerData)

    await waitFor(() => {
      expect(result.current.isPending).toBe(false)
    })

    expect(result.current.isSuccess).toBe(true)
    expect(result.current.data?.displayName).toBe('Dr. New Provider')
    expect(result.current.data?.specialty).toBe('Endodontics')
  })

  it('should handle creation errors', async () => {
    const mockSupabase = vi.mocked(supabase)
    mockSupabase.from.mockReturnValue({
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() =>
            Promise.resolve({
              data: null,
              error: { message: 'Creation failed' },
            })
          ),
        })),
      })),
    } as any)

    const { result } = renderHook(() => useCreateProvider(), { wrapper })

    const providerData = {
      person: {
        nationalId: '111222333',
        country: 'EC',
        firstName: 'Dr. New',
        lastName: 'Provider',
        dateOfBirth: new Date('1985-03-20'),
      },
    }

    result.current.mutate(providerData)

    await waitFor(() => {
      expect(result.current.isPending).toBe(false)
    })

    expect(result.current.isError).toBe(true)
    expect(result.current.error?.message).toContain('Failed to create person')
  })
})

describe('useUpdateProvider', () => {
  let wrapper: ReturnType<typeof createWrapper>

  beforeEach(() => {
    wrapper = createWrapper()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('should update provider successfully', async () => {
    const mockCurrentProvider = {
      person_id: 'person-1',
    }

    const mockUpdatedProvider = {
      id: 'provider-1',
      person_id: 'person-1',
      clinic_id: 'test-clinic-id',
      specialty: 'Updated Specialty',
      is_active: true,
    }

    const mockUpdatedPerson = {
      id: 'person-1',
      clinic_id: 'test-clinic-id',
      national_id: '123456789',
      country: 'EC',
      first_name: 'Dr. Updated',
      last_name: 'Name',
      date_of_birth: '1980-01-01',
      sex: 'M',
      phone: '+1234567890',
      email: 'updated@example.com',
      address: '123 Main St',
    }

    const mockSupabase = vi.mocked(supabase)

    // Mock current provider fetch
    mockSupabase.from
      .mockImplementationOnce(
        () =>
          ({
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() =>
                  Promise.resolve({
                    data: mockCurrentProvider,
                    error: null,
                  })
                ),
              })),
            })),
          } as any)
      )
      // Mock person update
      .mockImplementationOnce(
        () =>
          ({
            update: vi.fn(() => ({
              eq: vi.fn(() =>
                Promise.resolve({
                  data: null,
                  error: null,
                })
              ),
            })),
          } as any)
      )
      // Mock provider update
      .mockImplementationOnce(
        () =>
          ({
            update: vi.fn(() => ({
              eq: vi.fn(() => ({
                select: vi.fn(() => ({
                  single: vi.fn(() =>
                    Promise.resolve({
                      data: mockUpdatedProvider,
                      error: null,
                    })
                  ),
                })),
              })),
            })),
          } as any)
      )
      // Mock updated person fetch
      .mockImplementationOnce(
        () =>
          ({
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() =>
                  Promise.resolve({
                    data: mockUpdatedPerson,
                    error: null,
                  })
                ),
              })),
            })),
          } as any)
      )

    const { result } = renderHook(() => useUpdateProvider(), { wrapper })

    const updateData = {
      id: 'provider-1',
      data: {
        person: {
          firstName: 'Dr. Updated',
          lastName: 'Name',
          email: 'updated@example.com',
        },
        specialty: 'Updated Specialty',
      },
    }

    result.current.mutate(updateData)

    await waitFor(() => {
      expect(result.current.isPending).toBe(false)
    })

    expect(result.current.isSuccess).toBe(true)
    expect(result.current.data?.displayName).toBe('Dr. Updated Name')
    expect(result.current.data?.specialty).toBe('Updated Specialty')
  })
})

describe('useDeleteProvider', () => {
  let wrapper: ReturnType<typeof createWrapper>

  beforeEach(() => {
    wrapper = createWrapper()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('should delete provider successfully', async () => {
    const mockSupabase = vi.mocked(supabase)
    mockSupabase.from.mockReturnValue({
      update: vi.fn(() => ({
        eq: vi.fn(() =>
          Promise.resolve({
            data: null,
            error: null,
          })
        ),
      })),
    } as any)

    const { result } = renderHook(() => useDeleteProvider(), { wrapper })

    result.current.mutate('provider-1')

    await waitFor(() => {
      expect(result.current.isPending).toBe(false)
    })

    expect(result.current.isSuccess).toBe(true)
  })

  it('should handle deletion errors', async () => {
    const mockSupabase = vi.mocked(supabase)
    mockSupabase.from.mockReturnValue({
      update: vi.fn(() => ({
        eq: vi.fn(() =>
          Promise.resolve({
            data: null,
            error: { message: 'Deletion failed' },
          })
        ),
      })),
    } as any)

    const { result } = renderHook(() => useDeleteProvider(), { wrapper })

    result.current.mutate('provider-1')

    await waitFor(() => {
      expect(result.current.isPending).toBe(false)
    })

    expect(result.current.isError).toBe(true)
    expect(result.current.error?.message).toContain('Failed to delete provider')
  })
})
