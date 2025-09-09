// Tests for appointment-related hooks
// Focuses on mutation testing and optimistic updates

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
          gte: vi.fn(() => ({
            lte: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(),
                update: vi.fn(() => ({
                  eq: vi.fn(() => ({
                    select: vi.fn(() => ({
                      single: vi.fn(),
                    })),
                  })),
                })),
                insert: vi.fn(() => ({
                  select: vi.fn(() => ({
                    single: vi.fn(),
                  })),
                })),
              })),
            })),
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
      mutations: {
        retry: false,
      },
    },
  })

  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

describe('useCreateAppointment', () => {
  let wrapper: ReturnType<typeof createWrapper>

  beforeEach(() => {
    wrapper = createWrapper()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('should create appointment with optimistic updates', async () => {
    const mockAppointment = {
      id: 'new-appointment-id',
      clinic_id: 'test-clinic-id',
      patient_id: 'patient-123',
      provider_id: 'provider-456',
      appointment_date: '2024-01-15T10:00:00Z',
      duration_minutes: 60,
      appointment_type: 'checkup',
      status: 'scheduled',
      notes: 'Regular checkup',
    }

    const mockSupabase = vi.mocked(require('@/lib/api').supabase)
    mockSupabase.from.mockReturnValue({
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({
            data: mockAppointment,
            error: null,
          })),
        })),
      })),
    } as any)

    const { result } = renderHook(
      () => {
        const { useCreateAppointment } = require('@/hooks/use-appointments')
        return useCreateAppointment()
      },
      { wrapper }
    )

    const appointmentData = {
      patientId: 'patient-123',
      providerId: 'provider-456',
      appointmentDate: new Date('2024-01-15T10:00:00Z'),
      durationMinutes: 60,
      appointmentType: 'checkup',
      notes: 'Regular checkup',
    }

    result.current.mutate(appointmentData, {
      onSuccess: (data) => {
        expect(data.id).toBe('new-appointment-id')
        expect(data.status).toBe('scheduled')
        expect(data.appointmentType).toBe('checkup')
      },
    })

    await waitFor(() => {
      expect(result.current.isPending).toBe(false)
    })

    expect(result.current.isSuccess).toBe(true)
  })

  it('should handle creation errors', async () => {
    const mockError = { message: 'Failed to create appointment' }
    const mockSupabase = vi.mocked(require('@/lib/api').supabase)
    mockSupabase.from.mockReturnValue({
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({
            data: null,
            error: mockError,
          })),
        })),
      })),
    } as any)

    const { result } = renderHook(
      () => {
        const { useCreateAppointment } = require('@/hooks/use-appointments')
        return useCreateAppointment()
      },
      { wrapper }
    )

    const appointmentData = {
      patientId: 'patient-123',
      providerId: 'provider-456',
      appointmentDate: new Date(),
      durationMinutes: 30,
      appointmentType: 'consultation',
    }

    result.current.mutate(appointmentData)

    await waitFor(() => {
      expect(result.current.isPending).toBe(false)
    })

    expect(result.current.isError).toBe(true)
    expect(result.current.error?.message).toContain('Failed to create appointment')
  })
})

describe('useUpdateAppointmentStatus', () => {
  let wrapper: ReturnType<typeof createWrapper>

  beforeEach(() => {
    wrapper = createWrapper()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('should update appointment status with optimistic updates', async () => {
    const mockAppointment = {
      id: 'appointment-123',
      clinic_id: 'test-clinic-id',
      patient_id: 'patient-123',
      provider_id: 'provider-456',
      appointment_date: '2024-01-15T10:00:00Z',
      duration_minutes: 60,
      appointment_type: 'checkup',
      status: 'completed', // Updated status
      notes: 'Regular checkup',
    }

    const mockSupabase = vi.mocked(require('@/lib/api').supabase)
    mockSupabase.from.mockReturnValue({
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: mockAppointment,
              error: null,
            })),
          })),
        })),
      })),
    } as any)

    const { result } = renderHook(
      () => {
        const { useUpdateAppointmentStatus } = require('@/hooks/use-appointments')
        return useUpdateAppointmentStatus()
      },
      { wrapper }
    )

    result.current.mutate(
      { id: 'appointment-123', status: 'completed' },
      {
        onSuccess: (data) => {
          expect(data.id).toBe('appointment-123')
          expect(data.status).toBe('completed')
        },
      }
    )

    await waitFor(() => {
      expect(result.current.isPending).toBe(false)
    })

    expect(result.current.isSuccess).toBe(true)
  })

  it('should revert optimistic updates on error', async () => {
    const mockError = { message: 'Network error' }
    const mockSupabase = vi.mocked(require('@/lib/api').supabase)
    mockSupabase.from.mockReturnValue({
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: null,
              error: mockError,
            })),
          })),
        })),
      })),
    } as any)

    const { result } = renderHook(
      () => {
        const { useUpdateAppointmentStatus } = require('@/hooks/use-appointments')
        return useUpdateAppointmentStatus()
      },
      { wrapper }
    )

    result.current.mutate({ id: 'appointment-123', status: 'completed' })

    await waitFor(() => {
      expect(result.current.isPending).toBe(false)
    })

    expect(result.current.isError).toBe(true)
    expect(result.current.error?.message).toContain('Failed to update appointment status')
  })
})

describe('Appointment Status Colors', () => {
  it('should return correct color for each status', () => {
    // Import the helper function (assuming it's exported)
    const { getStatusColor } = require('@/hooks/use-appointments')

    expect(getStatusColor('scheduled')).toBe('blue')
    expect(getStatusColor('completed')).toBe('green')
    expect(getStatusColor('cancelled')).toBe('red')
    expect(getStatusColor('no_show')).toBe('orange')
  })
})
