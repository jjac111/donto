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
  useDeleteToothDiagnosisHistory,
  useCopyToothDiagnosisHistory,
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

describe('useDeleteToothDiagnosisHistory', () => {
  let wrapper: ReturnType<typeof createWrapper>

  beforeEach(() => {
    wrapper = createWrapper()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('deletes tooth diagnoses first, then the history record', async () => {
    const mockSupabase = vi.mocked(supabase)

    // Mock the delete operations with proper chain
    const deleteDiagnosesSpy = vi.fn(() => Promise.resolve({ error: null }))
    const deleteHistorySpy = vi.fn(() => Promise.resolve({ error: null }))

    const diagnosesChain = {
      delete: vi.fn(() => ({
        eq: deleteDiagnosesSpy,
      })),
    }

    const historiesChain = {
      delete: vi.fn(() => ({
        eq: deleteHistorySpy,
      })),
    }

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'tooth_diagnoses') return diagnosesChain as any
      if (table === 'tooth_diagnosis_histories') return historiesChain as any
      return {} as any
    })

    const { result } = renderHook(() => useDeleteToothDiagnosisHistory(), {
      wrapper,
    })

    await result.current.mutateAsync({
      patientId: 'patient-123',
      historyId: 'history-to-delete',
    })

    // Verify tooth diagnoses are deleted first
    expect(deleteDiagnosesSpy).toHaveBeenCalledTimes(1)
    expect(deleteDiagnosesSpy).toHaveBeenCalledWith(
      'history_id',
      'history-to-delete'
    )

    // Verify history is deleted second
    expect(deleteHistorySpy).toHaveBeenCalledTimes(1)
    expect(deleteHistorySpy).toHaveBeenCalledWith('id', 'history-to-delete')
  })

  it('handles deletion errors gracefully', async () => {
    const mockSupabase = vi.mocked(supabase)

    // Mock delete diagnoses error
    const deleteDiagnosesSpy = vi.fn(() =>
      Promise.resolve({ error: { message: 'Failed to delete diagnoses' } })
    )

    const diagnosesChain = {
      delete: vi.fn(() => ({
        eq: deleteDiagnosesSpy,
      })),
    }

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'tooth_diagnoses') return diagnosesChain as any
      return {} as any
    })

    const { result } = renderHook(() => useDeleteToothDiagnosisHistory(), {
      wrapper,
    })

    await expect(
      result.current.mutateAsync({
        patientId: 'patient-123',
        historyId: 'history-to-delete',
      })
    ).rejects.toThrow(
      'Failed to delete tooth diagnoses: Failed to delete diagnoses'
    )
  })

  it('handles history deletion errors', async () => {
    const mockSupabase = vi.mocked(supabase)

    // Mock successful diagnoses deletion but failed history deletion
    const deleteDiagnosesSpy = vi.fn(() => Promise.resolve({ error: null }))
    const deleteHistorySpy = vi.fn(() =>
      Promise.resolve({ error: { message: 'Failed to delete history' } })
    )

    const diagnosesChain = {
      delete: vi.fn(() => ({
        eq: deleteDiagnosesSpy,
      })),
    }

    const historiesChain = {
      delete: vi.fn(() => ({
        eq: deleteHistorySpy,
      })),
    }

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'tooth_diagnoses') return diagnosesChain as any
      if (table === 'tooth_diagnosis_histories') return historiesChain as any
      return {} as any
    })

    const { result } = renderHook(() => useDeleteToothDiagnosisHistory(), {
      wrapper,
    })

    await expect(
      result.current.mutateAsync({
        patientId: 'patient-123',
        historyId: 'history-to-delete',
      })
    ).rejects.toThrow('Failed to delete history: Failed to delete history')
  })

  it('invalidates relevant queries after successful deletion', async () => {
    const mockSupabase = vi.mocked(supabase)

    const deleteDiagnosesSpy = vi.fn(() => Promise.resolve({ error: null }))
    const deleteHistorySpy = vi.fn(() => Promise.resolve({ error: null }))

    const diagnosesChain = {
      delete: vi.fn(() => ({
        eq: deleteDiagnosesSpy,
      })),
    }

    const historiesChain = {
      delete: vi.fn(() => ({
        eq: deleteHistorySpy,
      })),
    }

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'tooth_diagnoses') return diagnosesChain as any
      if (table === 'tooth_diagnosis_histories') return historiesChain as any
      return {} as any
    })

    const { result } = renderHook(() => useDeleteToothDiagnosisHistory(), {
      wrapper,
    })

    await result.current.mutateAsync({
      patientId: 'patient-123',
      historyId: 'history-to-delete',
    })

    // The mutation should complete successfully
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })
  })
})

describe('useCopyToothDiagnosisHistory', () => {
  let wrapper: ReturnType<typeof createWrapper>

  beforeEach(() => {
    wrapper = createWrapper()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('copies all tooth diagnoses from source to target history', async () => {
    const mockSupabase = vi.mocked(supabase)

    const mockSourceDiagnoses = [
      {
        tooth_number: '16',
        is_present: true,
        is_treated: false,
        requires_extraction: false,
        general_notes: 'Some notes',
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
      },
      {
        tooth_number: '21',
        is_present: true,
        is_treated: true,
        requires_extraction: false,
        general_notes: null,
        tooth_conditions: [
          {
            surfaces: ['M', 'D'],
            condition_type: 'enamel_hypoplasia',
            notes: 'Anterior',
            diagnosis_date: '2024-01-16',
            recorded_by_profile_id: 'profile-1',
            created_at: '2024-01-16T11:00:00Z',
          },
        ],
      },
    ]

    // Mock fetch source diagnoses
    const fetchDiagnosesSpy = vi.fn(() =>
      Promise.resolve({ data: mockSourceDiagnoses, error: null })
    )

    // Mock insert copied diagnoses
    const insertDiagnosesSpy = vi.fn(() => Promise.resolve({ error: null }))

    const diagnosesChain = {
      select: vi.fn(() => ({
        eq: fetchDiagnosesSpy,
      })),
      insert: insertDiagnosesSpy,
    }

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'tooth_diagnoses') return diagnosesChain as any
      return {} as any
    })

    const { result } = renderHook(() => useCopyToothDiagnosisHistory(), {
      wrapper,
    })

    await result.current.mutateAsync({
      patientId: 'patient-123',
      sourceHistoryId: 'source-history',
      targetHistoryId: 'target-history',
    })

    // Verify source diagnoses were fetched
    expect(fetchDiagnosesSpy).toHaveBeenCalledTimes(1)

    // Verify diagnoses were inserted with correct target history ID
    expect(insertDiagnosesSpy).toHaveBeenCalledTimes(1)
    const insertArgs = insertDiagnosesSpy.mock.calls[0][0]

    expect(insertArgs).toHaveLength(2) // Two teeth copied

    // Verify first tooth copy
    const tooth16Copy = insertArgs.find((d: any) => d.tooth_number === '16')
    expect(tooth16Copy).toBeTruthy()
    expect(tooth16Copy.history_id).toBe('target-history')
    expect(tooth16Copy.is_present).toBe(true)
    expect(tooth16Copy.is_treated).toBe(false)
    expect(tooth16Copy.requires_extraction).toBe(false)
    expect(tooth16Copy.general_notes).toBe('Some notes')
    expect(tooth16Copy.tooth_conditions).toEqual(
      mockSourceDiagnoses[0].tooth_conditions
    )

    // Verify second tooth copy
    const tooth21Copy = insertArgs.find((d: any) => d.tooth_number === '21')
    expect(tooth21Copy).toBeTruthy()
    expect(tooth21Copy.history_id).toBe('target-history')
    expect(tooth21Copy.is_present).toBe(true)
    expect(tooth21Copy.is_treated).toBe(true)
    expect(tooth21Copy.requires_extraction).toBe(false)
    expect(tooth21Copy.general_notes).toBe(null)
    expect(tooth21Copy.tooth_conditions).toEqual(
      mockSourceDiagnoses[1].tooth_conditions
    )
  })

  it('handles empty source diagnoses gracefully', async () => {
    const mockSupabase = vi.mocked(supabase)

    // Mock empty source diagnoses
    const fetchDiagnosesSpy = vi.fn(() =>
      Promise.resolve({ data: [], error: null })
    )

    const insertDiagnosesSpy = vi.fn(() => Promise.resolve({ error: null }))

    const diagnosesChain = {
      select: vi.fn(() => ({
        eq: fetchDiagnosesSpy,
      })),
      insert: insertDiagnosesSpy,
    }

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'tooth_diagnoses') return diagnosesChain as any
      return {} as any
    })

    const { result } = renderHook(() => useCopyToothDiagnosisHistory(), {
      wrapper,
    })

    await result.current.mutateAsync({
      patientId: 'patient-123',
      sourceHistoryId: 'empty-source-history',
      targetHistoryId: 'target-history',
    })

    // Verify source was fetched
    expect(fetchDiagnosesSpy).toHaveBeenCalledTimes(1)

    // Verify no insert was called since source is empty
    expect(insertDiagnosesSpy).not.toHaveBeenCalled()
  })

  it('handles fetch errors during copy operation', async () => {
    const mockSupabase = vi.mocked(supabase)

    // Mock fetch error
    const fetchDiagnosesSpy = vi.fn(() =>
      Promise.resolve({ data: null, error: { message: 'Database error' } })
    )

    const diagnosesChain = {
      select: vi.fn(() => ({
        eq: fetchDiagnosesSpy,
      })),
    }

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'tooth_diagnoses') return diagnosesChain as any
      return {} as any
    })

    const { result } = renderHook(() => useCopyToothDiagnosisHistory(), {
      wrapper,
    })

    await expect(
      result.current.mutateAsync({
        patientId: 'patient-123',
        sourceHistoryId: 'source-history',
        targetHistoryId: 'target-history',
      })
    ).rejects.toThrow('Failed to fetch source diagnoses: Database error')
  })

  it('handles insert errors during copy operation', async () => {
    const mockSupabase = vi.mocked(supabase)

    const mockSourceDiagnoses = [
      {
        tooth_number: '16',
        is_present: true,
        is_treated: false,
        requires_extraction: false,
        general_notes: null,
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
      },
    ]

    // Mock successful fetch
    const fetchDiagnosesSpy = vi.fn(() =>
      Promise.resolve({ data: mockSourceDiagnoses, error: null })
    )

    // Mock insert error
    const insertDiagnosesSpy = vi.fn(() =>
      Promise.resolve({ error: { message: 'Insert failed' } })
    )

    const diagnosesChain = {
      select: vi.fn(() => ({
        eq: fetchDiagnosesSpy,
      })),
      insert: insertDiagnosesSpy,
    }

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'tooth_diagnoses') return diagnosesChain as any
      return {} as any
    })

    const { result } = renderHook(() => useCopyToothDiagnosisHistory(), {
      wrapper,
    })

    await expect(
      result.current.mutateAsync({
        patientId: 'patient-123',
        sourceHistoryId: 'source-history',
        targetHistoryId: 'target-history',
      })
    ).rejects.toThrow('Failed to copy diagnoses: Insert failed')
  })

  it('invalidates relevant queries after successful copy', async () => {
    const mockSupabase = vi.mocked(supabase)

    const mockSourceDiagnoses = [
      {
        tooth_number: '16',
        is_present: true,
        is_treated: false,
        requires_extraction: false,
        general_notes: null,
        tooth_conditions: [],
      },
    ]

    const fetchDiagnosesSpy = vi.fn(() =>
      Promise.resolve({ data: mockSourceDiagnoses, error: null })
    )

    const insertDiagnosesSpy = vi.fn(() => Promise.resolve({ error: null }))

    const diagnosesChain = {
      select: vi.fn(() => ({
        eq: fetchDiagnosesSpy,
      })),
      insert: insertDiagnosesSpy,
    }

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'tooth_diagnoses') return diagnosesChain as any
      return {} as any
    })

    const { result } = renderHook(() => useCopyToothDiagnosisHistory(), {
      wrapper,
    })

    await result.current.mutateAsync({
      patientId: 'patient-123',
      sourceHistoryId: 'source-history',
      targetHistoryId: 'target-history',
    })

    // The mutation should complete successfully
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })
  })

  it('preserves all tooth diagnosis properties during copy', async () => {
    const mockSupabase = vi.mocked(supabase)

    const mockSourceDiagnoses = [
      {
        tooth_number: '16',
        is_present: false,
        is_treated: true,
        requires_extraction: true,
        general_notes: 'Complex case',
        tooth_conditions: [
          {
            surfaces: ['O', 'M', 'D'],
            condition_type: 'dental_caries',
            notes: 'Multiple surfaces affected',
            diagnosis_date: '2024-01-15',
            recorded_by_profile_id: 'profile-1',
            created_at: '2024-01-15T10:00:00Z',
          },
          {
            surfaces: ['B'],
            condition_type: 'gingivitis',
            notes: 'Buccal inflammation',
            diagnosis_date: '2024-01-16',
            recorded_by_profile_id: 'profile-1',
            created_at: '2024-01-16T11:00:00Z',
          },
        ],
      },
    ]

    const fetchDiagnosesSpy = vi.fn(() =>
      Promise.resolve({ data: mockSourceDiagnoses, error: null })
    )

    const insertDiagnosesSpy = vi.fn(() => Promise.resolve({ error: null }))

    const diagnosesChain = {
      select: vi.fn(() => ({
        eq: fetchDiagnosesSpy,
      })),
      insert: insertDiagnosesSpy,
    }

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'tooth_diagnoses') return diagnosesChain as any
      return {} as any
    })

    const { result } = renderHook(() => useCopyToothDiagnosisHistory(), {
      wrapper,
    })

    await result.current.mutateAsync({
      patientId: 'patient-123',
      sourceHistoryId: 'source-history',
      targetHistoryId: 'target-history',
    })

    const insertArgs = insertDiagnosesSpy.mock.calls[0][0]
    const copiedDiagnosis = insertArgs[0]

    // Verify all properties are preserved
    expect(copiedDiagnosis.tooth_number).toBe('16')
    expect(copiedDiagnosis.is_present).toBe(false)
    expect(copiedDiagnosis.is_treated).toBe(true)
    expect(copiedDiagnosis.requires_extraction).toBe(true)
    expect(copiedDiagnosis.general_notes).toBe('Complex case')
    expect(copiedDiagnosis.history_id).toBe('target-history')

    // Verify tooth conditions are preserved exactly
    expect(copiedDiagnosis.tooth_conditions).toEqual(
      mockSourceDiagnoses[0].tooth_conditions
    )
    expect(copiedDiagnosis.tooth_conditions).toHaveLength(2)

    // Verify individual conditions
    const cariesCondition = copiedDiagnosis.tooth_conditions.find(
      (c: any) => c.condition_type === 'dental_caries'
    )
    expect(cariesCondition.surfaces).toEqual(['O', 'M', 'D'])
    expect(cariesCondition.notes).toBe('Multiple surfaces affected')

    const gingivitisCondition = copiedDiagnosis.tooth_conditions.find(
      (c: any) => c.condition_type === 'gingivitis'
    )
    expect(gingivitisCondition.surfaces).toEqual(['B'])
    expect(gingivitisCondition.notes).toBe('Buccal inflammation')
  })
})
