// TanStack Query hooks for the new tooth diagnoses structure
// Handles fetching aggregated tooth data and saving diagnoses using the new tables

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-client'
import { supabase } from '@/lib/api'
import { useAuthStore } from '@/store/auth'
import {
  ToothWithConditions,
  ToothCondition,
  DiagnosisFormData,
  getAllToothNumbers,
} from '@/types/dental-conditions'

// Transform rows from tooth_diagnoses (JSONB tooth_conditions) to ToothWithConditions
const transformToothDiagnoses = (rows: any[]): ToothWithConditions[] => {
  const allTeeth = getAllToothNumbers().map(number => ({
    number,
    conditions: [] as ToothCondition[],
    isPresent: true,
    hasTreatments: false,
  }))

  const byToothNumber = rows.reduce((acc, row) => {
    // Only set if we don't have this tooth number yet (first occurrence is the latest due to ORDER BY updated_at DESC)
    if (!acc[row.tooth_number]) {
      acc[row.tooth_number] = row
    }
    return acc
  }, {} as Record<string, any>)

  return allTeeth.map(tooth => {
    const row = byToothNumber[tooth.number]
    const jsonbConditions: any[] = row?.tooth_conditions || []

    const conditions: ToothCondition[] = jsonbConditions.map(
      (c: any, index: number) => ({
        id: `${row?.tooth_number || tooth.number}-${index}`,
        conditionType: c.condition_type,
        surfaces: Array.isArray(c.surfaces) ? (c.surfaces as any[]) : [],
        notes: c.notes ?? undefined,
        recordedDate: new Date(c.diagnosis_date || c.created_at || Date.now()),
        recordedByProfileId: c.recorded_by_profile_id || '',
      })
    )

    const lastUpdated = (() => {
      const times: number[] = []
      if (row?.updated_at) times.push(new Date(row.updated_at).getTime())
      for (const c of jsonbConditions) {
        const ts = c.created_at || c.diagnosis_date
        if (ts) times.push(new Date(ts).getTime())
      }
      return times.length ? new Date(Math.max(...times)) : undefined
    })()

    return {
      ...tooth,
      isPresent: row?.is_present ?? true,
      hasTreatments: row?.is_treated ?? false,
      requiresExtraction: row?.requires_extraction ?? false,
      generalNotes: row?.general_notes || undefined,
      conditions,
      lastUpdated,
    }
  })
}

// Get aggregated tooth diagnoses for a patient (for odontogram and summaries)
export const usePatientToothConditions = (patientId: string) => {
  return useQuery({
    queryKey: queryKeys.patientToothConditions(patientId),
    queryFn: async (): Promise<ToothWithConditions[]> => {
      const clinicId = useAuthStore.getState().clinicId
      if (!clinicId) throw new Error('No clinic selected')

      const { data, error } = await supabase
        .from('tooth_diagnoses')
        .select(
          `
          *,
          tooth_diagnosis_histories!inner(patient_id)
        `
        )
        .eq('tooth_diagnosis_histories.patient_id', patientId)
        .order('updated_at', { ascending: false })

      if (error) {
        throw new Error(`Failed to fetch tooth diagnoses: ${error.message}`)
      }

      return transformToothDiagnoses(data || [])
    },
    enabled: !!patientId,
    staleTime: 2 * 60 * 1000,
  })
}

// Get raw JSONB conditions for a specific tooth (for editing in the form)
export const useToothConditions = (patientId: string, toothNumber: string) => {
  return useQuery({
    queryKey: queryKeys.toothConditionsByTooth(patientId, toothNumber),
    queryFn: async (): Promise<any[]> => {
      const clinicId = useAuthStore.getState().clinicId
      if (!clinicId) throw new Error('No clinic selected')

      const { data, error } = await supabase
        .from('tooth_diagnoses')
        .select(
          `
          tooth_conditions,
          tooth_diagnosis_histories!inner(patient_id)
        `
        )
        .eq('tooth_diagnosis_histories.patient_id', patientId)
        .eq('tooth_number', toothNumber)
        .limit(1)

      if (error) {
        throw new Error(`Failed to fetch tooth diagnosis: ${error.message}`)
      }

      const row = (data || [])[0]
      return row?.tooth_conditions || []
    },
    enabled: !!patientId && !!toothNumber,
    staleTime: 2 * 60 * 1000,
  })
}

// Save diagnosis: create history row, then upsert tooth_diagnoses with JSONB conditions
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

      // Auth user
      const { data: authUser } = await supabase.auth.getUser()
      const userId = authUser.user?.id
      if (!userId) throw new Error('No authenticated user found')

      // Profile in clinic
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

      // Create a history entry for this save
      const { data: historyInsert, error: historyError } = await supabase
        .from('tooth_diagnosis_histories')
        .insert({
          patient_id: patientId,
          recorded_by_profile_id: profileId,
        })
        .select('id')
        .single()

      if (historyError || !historyInsert) {
        throw new Error(
          `Failed to create diagnosis history: ${historyError?.message}`
        )
      }

      const historyId = historyInsert.id as string

      // Prepare JSONB conditions array (no id field per schema)
      const nowIso = new Date().toISOString()
      const today = nowIso.split('T')[0]
      const toothConditions = diagnosisData.conditions
        .filter(c => c.conditionId)
        .map(c => ({
          surfaces: c.surfaces,
          condition_type: c.conditionId,
          notes: c.notes || null,
          diagnosis_date: today,
          recorded_by_profile_id: profileId,
          created_at: nowIso,
        }))

      // Upsert into tooth_diagnoses using unique (history_id, tooth_number)
      const { error: upsertError } = await supabase
        .from('tooth_diagnoses')
        .upsert(
          [
            {
              tooth_number: diagnosisData.toothNumber,
              is_present: diagnosisData.isPresent ?? true,
              is_treated: diagnosisData.isTreated ?? false,
              requires_extraction: diagnosisData.requiresExtraction ?? false,
              general_notes: diagnosisData.generalNotes || null,
              tooth_conditions: toothConditions,
              history_id: historyId,
            },
          ],
          { onConflict: 'history_id,tooth_number' }
        )

      if (upsertError) {
        throw new Error(`Failed to save diagnosis: ${upsertError.message}`)
      }
    },
    onSuccess: (_, { patientId, diagnosisData }) => {
      // Invalidate aggregated view and specific tooth
      queryClient.invalidateQueries({
        queryKey: queryKeys.patientToothConditions(patientId),
      })
      queryClient.invalidateQueries({
        queryKey: queryKeys.toothConditionsByTooth(
          patientId,
          diagnosisData.toothNumber
        ),
      })
    },
  })
}
