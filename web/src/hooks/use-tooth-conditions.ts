// TanStack Query hooks for tooth conditions
// Handles tooth condition data fetching, mutations, and cache management

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-client'
import { supabase } from '@/lib/api'
import { useAuthStore } from '@/store/auth'
import {
  ToothWithConditions,
  ToothSurfaceCondition,
  DiagnosisFormData,
  getAllToothNumbers,
} from '@/types/dental-conditions'

// Transform database tooth conditions to frontend format
const transformToothConditions = (
  dbConditions: any[]
): ToothWithConditions[] => {
  const allTeeth = getAllToothNumbers().map(number => ({
    number,
    surfaces: [
      { surface: 'M' as const, recordedDate: new Date() },
      { surface: 'D' as const, recordedDate: new Date() },
      { surface: 'B' as const, recordedDate: new Date() },
      { surface: 'L' as const, recordedDate: new Date() },
      { surface: 'O' as const, recordedDate: new Date() },
    ] as ToothSurfaceCondition[],
    isPresent: true,
    hasTreatments: false,
  }))

  // Group conditions by tooth
  const conditionsByTooth = dbConditions.reduce((acc, condition) => {
    const toothNumber = condition.tooth_number
    if (!acc[toothNumber]) {
      acc[toothNumber] = []
    }
    acc[toothNumber].push(condition)
    return acc
  }, {} as Record<string, any[]>)

  // Update teeth with actual conditions
  return allTeeth.map(tooth => {
    const toothConditions = conditionsByTooth[tooth.number] || []

    const surfacesWithConditions = tooth.surfaces.map(surface => {
      // Find condition that applies to this surface
      const condition = toothConditions.find(
        (c: any) => c.surfaces && c.surfaces.includes(surface.surface)
      )
      if (condition) {
        return {
          ...surface,
          condition: {
            id: condition.condition_type,
            category: 'general' as const, // Will be determined from condition type
            name: condition.condition_type,
            description: '',
            color: '#FF8C00', // Default orange for caries
            severity: 'medium' as const,
          },
          notes: condition.notes,
          recordedDate: new Date(condition.recorded_date),
          recordedByProfileId: condition.recorded_by_profile_id,
        }
      }
      return surface
    })

    return {
      ...tooth,
      surfaces: surfacesWithConditions,
      lastUpdated:
        toothConditions.length > 0
          ? new Date(
              Math.max(
                ...toothConditions.map((c: any) =>
                  new Date(c.created_at).getTime()
                )
              )
            )
          : undefined,
    }
  })
}

// Get tooth conditions for a patient
export const usePatientToothConditions = (patientId: string) => {
  return useQuery({
    queryKey: queryKeys.patientToothConditions(patientId),
    queryFn: async (): Promise<ToothWithConditions[]> => {
      const clinicId = useAuthStore.getState().clinicId
      if (!clinicId) throw new Error('No clinic selected')

      const { data, error } = await supabase
        .from('tooth_conditions')
        .select('*')
        .eq('patient_id', patientId)
        .order('recorded_date', { ascending: false })

      if (error) {
        throw new Error(`Failed to fetch tooth conditions: ${error.message}`)
      }

      return transformToothConditions(data || [])
    },
    enabled: !!patientId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

// Get tooth conditions for a specific tooth
export const useToothConditions = (patientId: string, toothNumber: string) => {
  return useQuery({
    queryKey: queryKeys.toothConditionsByTooth(patientId, toothNumber),
    queryFn: async (): Promise<any[]> => {
      const clinicId = useAuthStore.getState().clinicId
      if (!clinicId) throw new Error('No clinic selected')

      const { data, error } = await supabase
        .from('tooth_conditions')
        .select('*')
        .eq('patient_id', patientId)
        .eq('tooth_number', toothNumber)
        .order('recorded_date', { ascending: false })

      if (error) {
        throw new Error(`Failed to fetch tooth conditions: ${error.message}`)
      }

      return data || []
    },
    enabled: !!patientId && !!toothNumber,
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

// Save tooth condition diagnosis
export const useSaveToothDiagnosis = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      patientId,
      diagnosisData,
    }: {
      patientId: string
      diagnosisData: DiagnosisFormData
    }): Promise<void> => {
      const clinicId = useAuthStore.getState().clinicId
      if (!clinicId) throw new Error('No clinic selected')

      // Get current user profile for recording
      const { data: authUser } = await supabase.auth.getUser()
      const userId = authUser.user?.id
      if (!userId) throw new Error('No authenticated user found')

      // Get the user's profile for the current clinic
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', userId)
        .eq('clinic_id', clinicId)
        .eq('is_active', true)
        .single()

      if (profileError || !profile) {
        throw new Error('Could not find user profile')
      }

      const profileId = profile.id

      // Prepare conditions to save (new multi-surface format)
      const conditionsToSave = diagnosisData.conditions
        .filter(
          condition => condition.conditionId && condition.surfaces.length > 0
        )
        .map(condition => ({
          patient_id: patientId,
          tooth_number: diagnosisData.toothNumber,
          surfaces: condition.surfaces,
          condition_type: condition.conditionId,
          notes: condition.notes || null,
          recorded_date: new Date().toISOString().split('T')[0],
          recorded_by_profile_id: profileId,
        }))

      // First, delete existing conditions for this tooth
      const { error: deleteError } = await supabase
        .from('tooth_conditions')
        .delete()
        .eq('patient_id', patientId)
        .eq('tooth_number', diagnosisData.toothNumber)

      if (deleteError) {
        throw new Error(
          `Failed to delete existing conditions: ${deleteError.message}`
        )
      }

      // Then insert new conditions
      if (conditionsToSave.length > 0) {
        const { error: insertError } = await supabase
          .from('tooth_conditions')
          .insert(conditionsToSave)

        if (insertError) {
          throw new Error(`Failed to save conditions: ${insertError.message}`)
        }
      }
    },
    onSuccess: (_, { patientId }) => {
      // Invalidate related queries
      queryClient.invalidateQueries({
        queryKey: queryKeys.patientToothConditions(patientId),
      })
      queryClient.invalidateQueries({
        queryKey: queryKeys.toothConditionsByTooth(patientId, ''),
      })
    },
  })
}

// Update tooth condition
export const useUpdateToothCondition = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      conditionId,
      updates,
    }: {
      conditionId: string
      updates: Partial<{
        surfaces: ('M' | 'D' | 'B' | 'L' | 'O')[]
        condition_type: string
        notes: string
        recorded_date: string
      }>
    }): Promise<void> => {
      const { error } = await supabase
        .from('tooth_conditions')
        .update(updates)
        .eq('id', conditionId)

      if (error) {
        throw new Error(`Failed to update condition: ${error.message}`)
      }
    },
    onSuccess: () => {
      // Invalidate tooth conditions queries
      queryClient.invalidateQueries({
        queryKey: queryKeys.toothConditionsByTooth('', ''),
      })
    },
  })
}

// Delete tooth condition
export const useDeleteToothCondition = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (conditionId: string): Promise<void> => {
      const { error } = await supabase
        .from('tooth_conditions')
        .delete()
        .eq('id', conditionId)

      if (error) {
        throw new Error(`Failed to delete condition: ${error.message}`)
      }
    },
    onSuccess: () => {
      // Invalidate tooth conditions queries
      queryClient.invalidateQueries({
        queryKey: queryKeys.toothConditionsByTooth('', ''),
      })
    },
  })
}
