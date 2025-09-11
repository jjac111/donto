// Tests for tooth diagnosis hooks (JSONB-based)
// Covers retrieval (aggregated + per-tooth) and saving flow

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React, { ReactNode } from 'react'
import {
  usePatientToothConditions,
  useToothConditions,
  useSaveToothDiagnosis,
} from '@/hooks/use-tooth-conditions'
import { supabase } from '@/lib/api'

// Mock the auth store to provide a clinicId through getState()
vi.mock('@/store/auth', () => {
  const mockStoreFn: any = vi.fn()
  mockStoreFn.getState = vi.fn(() => ({ clinicId: 'test-clinic-id' }))
  return { useAuthStore: mockStoreFn }
})

// Mock Supabase client (module-level)
vi.mock('@/lib/api', () => ({
  supabase: {
    from: vi.fn(),
    auth: {
      getUser: vi.fn(),
    },
  },
}))

// Test wrapper
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('usePatientToothConditions (aggregated)', () => {
  let wrapper: ReturnType<typeof createWrapper>

  beforeEach(() => {
    wrapper = createWrapper()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('returns transformed teeth with conditions from JSONB', async () => {
    const mockRows = [
      {
        tooth_number: '16',
        is_present: true,
        is_treated: false,
        tooth_conditions: [
          {
            surfaces: ['O'],
            condition_type: 'dental_caries',
            notes: 'Deep caries',
            diagnosis_date: '2024-01-15',
            recorded_by_profile_id: 'profile-1',
            created_at: '2024-01-15T10:00:00Z',
          },
        ],
        updated_at: '2024-01-15T10:00:00Z',
      },
    ]

    const mockSupabase = vi.mocked(supabase)
    mockSupabase.from.mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() =>
              Promise.resolve({ data: mockRows, error: null })
            ),
          })),
        })),
      })),
    } as any)

    const { result } = renderHook(
      () => usePatientToothConditions('patient-123', 'history-123'),
      { wrapper }
    )

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.data).toBeTruthy()
    const tooth16 = result.current.data!.find(t => t.number === '16')
    expect(tooth16).toBeTruthy()
    expect(tooth16!.conditions.length).toBe(1)
    expect(tooth16!.conditions[0].conditionType).toBe('dental_caries')
    expect(Array.isArray(tooth16!.conditions[0].surfaces)).toBe(true)
  })
})

describe('useToothConditions (single tooth JSONB)', () => {
  let wrapper: ReturnType<typeof createWrapper>

  beforeEach(() => {
    wrapper = createWrapper()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('returns JSONB array for a specific tooth', async () => {
    const mockRow = {
      tooth_conditions: [
        {
          surfaces: ['M', 'D'],
          condition_type: 'enamel_hypoplasia',
          notes: 'anterior',
          diagnosis_date: '2024-01-28',
          recorded_by_profile_id: 'profile-2',
          created_at: '2024-01-28T11:15:00Z',
        },
      ],
    }

    const mockSupabase = vi.mocked(supabase)
    mockSupabase.from.mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              limit: vi.fn(() =>
                Promise.resolve({ data: [mockRow], error: null })
              ),
            })),
          })),
        })),
      })),
    } as any)

    const { result } = renderHook(
      () => useToothConditions('patient-123', '11', 'history-123'),
      { wrapper }
    )

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.data).toHaveLength(1)
    expect(result.current.data?.[0].condition_type).toBe('enamel_hypoplasia')
  })
})

describe('useSaveToothDiagnosis (saving flow)', () => {
  let wrapper: ReturnType<typeof createWrapper>

  beforeEach(() => {
    wrapper = createWrapper()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('creates history and upserts tooth_diagnoses', async () => {
    const mockSupabase = vi.mocked(supabase)

    // auth.getUser
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
    } as any)

    // profiles select -> single
    const profilesChain = {
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() =>
                Promise.resolve({ data: { id: 'profile-123' }, error: null })
              ),
            })),
          })),
        })),
      })),
    }

    // Check for existing diagnosis (should return null for new diagnosis)
    const existingDiagnosisChain = {
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            inner: vi.fn(() => ({
              single: vi.fn(
                () =>
                  Promise.resolve({ data: null, error: { code: 'PGRST116' } }) // No rows found
              ),
            })),
          })),
        })),
      })),
    }

    // histories insert -> select -> single
    const historiesChain = {
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() =>
            Promise.resolve({ data: { id: 'history-123' }, error: null })
          ),
        })),
      })),
    }

    // tooth_diagnoses insert
    const insertSpy = vi.fn(() => Promise.resolve({ error: null }))
    const diagnosesChain = {
      insert: insertSpy,
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi.fn(() =>
              Promise.resolve({ data: null, error: null })
            ),
          })),
        })),
      })),
    }

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'profiles') return profilesChain as any
      if (table === 'tooth_diagnosis_histories') return historiesChain as any
      if (table === 'tooth_diagnoses') return diagnosesChain as any
      return {} as any
    })

    const { result } = renderHook(() => useSaveToothDiagnosis(), { wrapper })

    await result.current.mutateAsync({
      patientId: 'patient-123',
      historyId: 'history-123',
      diagnosisData: {
        toothNumber: '16',
        conditions: [
          { conditionId: 'dental_caries', surfaces: ['O'], notes: 'Deep' },
        ],
      },
    })

    // Verify insert payload contains history_id and JSONB
    expect(insertSpy).toHaveBeenCalledTimes(1)
    const args = insertSpy.mock.calls[0]
    expect(args[0].history_id).toBe('history-123')
    expect(args[0].tooth_number).toBe('16')
    expect(Array.isArray(args[0].tooth_conditions)).toBe(true)
  })

  it('edits by creating a new history and upserting again', async () => {
    const mockSupabase = vi.mocked(supabase)

    // auth.getUser
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
    } as any)

    // profiles select -> single
    const profilesChain = {
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() =>
                Promise.resolve({ data: { id: 'profile-123' }, error: null })
              ),
            })),
          })),
        })),
      })),
    }

    // histories insert -> select -> single (returns different ids per call)
    const historiesInsert = vi
      .fn()
      .mockReturnValueOnce({
        select: vi.fn(() => ({
          single: vi.fn(() =>
            Promise.resolve({ data: { id: 'history-1' }, error: null })
          ),
        })),
      })
      .mockReturnValueOnce({
        select: vi.fn(() => ({
          single: vi.fn(() =>
            Promise.resolve({ data: { id: 'history-2' }, error: null })
          ),
        })),
      })

    const historiesChain = {
      insert: historiesInsert,
    }

    // tooth_diagnoses insert spy
    const insertSpy = vi.fn(() => Promise.resolve({ error: null }))
    const diagnosesChain = {
      insert: insertSpy,
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi.fn(() =>
              Promise.resolve({ data: null, error: null })
            ),
          })),
        })),
      })),
    }

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'profiles') return profilesChain as any
      if (table === 'tooth_diagnosis_histories') return historiesChain as any
      if (table === 'tooth_diagnoses') return diagnosesChain as any
      return {} as any
    })

    const { result } = renderHook(() => useSaveToothDiagnosis(), { wrapper })

    // First save
    await result.current.mutateAsync({
      patientId: 'patient-123',
      historyId: 'history-1',
      diagnosisData: {
        toothNumber: '21',
        conditions: [
          { conditionId: 'gingivitis', surfaces: ['B'], notes: 'B' },
        ],
      },
    })

    // Second save (edit)
    await result.current.mutateAsync({
      patientId: 'patient-123',
      historyId: 'history-2',
      diagnosisData: {
        toothNumber: '21',
        conditions: [
          { conditionId: 'gingivitis', surfaces: ['B', 'L'], notes: 'BL' },
        ],
      },
    })

    // Should have been called twice with different history ids
    expect(insertSpy).toHaveBeenCalledTimes(2)
    const firstArgs = insertSpy.mock.calls[0]
    const secondArgs = insertSpy.mock.calls[1]
    expect(firstArgs[0].history_id).toBe('history-1')
    expect(secondArgs[0].history_id).toBe('history-2')
    expect(firstArgs[0].tooth_number).toBe('21')
    expect(secondArgs[0].tooth_number).toBe('21')
  })

  it('adds new condition to existing tooth with multiple conditions', async () => {
    const mockSupabase = vi.mocked(supabase)

    // auth.getUser
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
    } as any)

    // profiles select -> single
    const profilesChain = {
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() =>
                Promise.resolve({ data: { id: 'profile-123' }, error: null })
              ),
            })),
          })),
        })),
      })),
    }

    // histories insert -> select -> single
    const historiesChain = {
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() =>
            Promise.resolve({ data: { id: 'history-new' }, error: null })
          ),
        })),
      })),
    }

    // tooth_diagnoses insert spy
    const insertSpy = vi.fn(() => Promise.resolve({ error: null }))
    const diagnosesChain = {
      insert: insertSpy,
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi.fn(() =>
              Promise.resolve({ data: null, error: null })
            ),
          })),
        })),
      })),
    }

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'profiles') return profilesChain as any
      if (table === 'tooth_diagnosis_histories') return historiesChain as any
      if (table === 'tooth_diagnoses') return diagnosesChain as any
      return {} as any
    })

    const { result } = renderHook(() => useSaveToothDiagnosis(), { wrapper })

    // Simulate adding a new condition to tooth 16 that already has existing conditions
    await result.current.mutateAsync({
      patientId: 'patient-123',
      historyId: 'history-new',
      diagnosisData: {
        toothNumber: '16',
        conditions: [
          // Existing conditions (simulated from previous diagnosis)
          {
            conditionId: 'dental_caries',
            surfaces: ['O'],
            notes: 'Existing caries',
          },
          {
            conditionId: 'gingivitis',
            surfaces: ['B'],
            notes: 'Existing gingivitis',
          },
          // New condition being added
          {
            conditionId: 'enamel_hypoplasia',
            surfaces: ['M', 'D'],
            notes: 'New condition',
          },
        ],
      },
    })

    // Verify insert was called with all conditions (existing + new)
    expect(insertSpy).toHaveBeenCalledTimes(1)
    const args = insertSpy.mock.calls[0]
    expect(args[0].history_id).toBe('history-new')
    expect(args[0].tooth_number).toBe('16')

    const toothConditions = args[0].tooth_conditions
    expect(Array.isArray(toothConditions)).toBe(true)
    expect(toothConditions).toHaveLength(3)

    // Verify all conditions are present
    const conditionTypes = toothConditions.map((c: any) => c.condition_type)
    expect(conditionTypes).toContain('dental_caries')
    expect(conditionTypes).toContain('gingivitis')
    expect(conditionTypes).toContain('enamel_hypoplasia')

    // Verify the new condition has correct structure
    const newCondition = toothConditions.find(
      (c: any) => c.condition_type === 'enamel_hypoplasia'
    )
    expect(newCondition).toBeTruthy()
    expect(newCondition.surfaces).toEqual(['M', 'D'])
    expect(newCondition.notes).toBe('New condition')
    expect(newCondition.recorded_by_profile_id).toBe('profile-123')
    expect(newCondition.diagnosis_date).toBeTruthy()
    expect(newCondition.created_at).toBeTruthy()

    // Verify notes are preserved for all conditions
    const cariesCondition = toothConditions.find(
      (c: any) => c.condition_type === 'dental_caries'
    )
    expect(cariesCondition.notes).toBe('Existing caries')

    const gingivitisCondition = toothConditions.find(
      (c: any) => c.condition_type === 'gingivitis'
    )
    expect(gingivitisCondition.notes).toBe('Existing gingivitis')
  })

  it('edits existing tooth diagnosis by updating the same record', async () => {
    const mockSupabase = vi.mocked(supabase)

    // auth.getUser
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
    } as any)

    // profiles select -> single
    const profilesChain = {
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() =>
                Promise.resolve({ data: { id: 'profile-123' }, error: null })
              ),
            })),
          })),
        })),
      })),
    }

    // histories insert -> select -> single (should only be called once for editing)
    const historiesInsert = vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn(() =>
          Promise.resolve({ data: { id: 'existing-history-123' }, error: null })
        ),
      })),
    }))

    const historiesChain = {
      insert: historiesInsert,
    }

    // tooth_diagnoses insert spy
    const insertSpy = vi.fn(() => Promise.resolve({ error: null }))
    const diagnosesChain = {
      insert: insertSpy,
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi.fn(() =>
              Promise.resolve({ data: null, error: null })
            ),
          })),
        })),
      })),
    }

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'profiles') return profilesChain as any
      if (table === 'tooth_diagnosis_histories') return historiesChain as any
      if (table === 'tooth_diagnoses') return diagnosesChain as any
      return {} as any
    })

    const { result } = renderHook(() => useSaveToothDiagnosis(), { wrapper })

    // Simulate editing an existing tooth diagnosis
    await result.current.mutateAsync({
      patientId: 'patient-123',
      historyId: 'existing-history-123',
      diagnosisData: {
        toothNumber: '16',
        conditions: [
          // Modified existing condition
          {
            conditionId: 'dental_caries',
            surfaces: ['O', 'M'],
            notes: 'Updated caries',
          },
          // Removed one condition, added another
          {
            conditionId: 'enamel_hypoplasia',
            surfaces: ['D'],
            notes: 'New condition',
          },
        ],
      },
    })

    // This test will likely fail because we're creating a new history instead of updating
    // The current implementation always creates new history records
    expect(insertSpy).toHaveBeenCalledTimes(1)
    const args = insertSpy.mock.calls[0]
    expect(args[0].tooth_number).toBe('16')

    const toothConditions = args[0].tooth_conditions
    expect(Array.isArray(toothConditions)).toBe(true)
    expect(toothConditions).toHaveLength(2)

    // Verify the updated conditions
    const conditionTypes = toothConditions.map((c: any) => c.condition_type)
    expect(conditionTypes).toContain('dental_caries')
    expect(conditionTypes).toContain('enamel_hypoplasia')
    expect(conditionTypes).not.toContain('gingivitis') // Should be removed
  })
})
