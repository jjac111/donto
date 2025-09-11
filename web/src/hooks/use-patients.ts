// TanStack Query hooks for patients
// Handles patient data fetching, mutations, and cache management

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys, invalidatePatientData } from '@/lib/query-client'
import { supabase } from '@/lib/api'
import {
  Patient,
  Person,
  DbPatient,
  DbPerson,
  PaginatedResponse,
} from '@/types'
import { useAuthStore } from '@/store/auth'

// Data transformation utilities
const transformPatient = (
  dbPatient: DbPatient,
  dbPerson: DbPerson
): Patient => ({
  id: dbPatient.id,
  personId: dbPatient.person_id,
  clinicId: dbPatient.clinic_id,
  medicalHistory: dbPatient.medical_history || undefined,
  allergies: dbPatient.allergies || undefined,
  emergencyContactName: dbPatient.emergency_contact_name || undefined,
  emergencyContactPhone: dbPatient.emergency_contact_phone || undefined,
  emergency_contact_phone_country_code:
    dbPatient.emergency_contact_phone_country_code || undefined,
  createdAt: dbPatient.created_at,
  updatedAt: dbPatient.updated_at,

  // Person data
  person: {
    id: dbPerson.id,
    clinicId: dbPerson.clinic_id,
    nationalId: dbPerson.national_id,
    country: dbPerson.country,
    firstName: dbPerson.first_name,
    lastName: dbPerson.last_name,
    dateOfBirth: new Date(dbPerson.date_of_birth),
    sex: dbPerson.sex || undefined,
    phone: dbPerson.phone || undefined,
    phone_country_code: dbPerson.phone_country_code || undefined,
    email: dbPerson.email || undefined,
    address: dbPerson.address || undefined,
    displayName: `${dbPerson.first_name} ${dbPerson.last_name}`,
    age:
      new Date().getFullYear() - new Date(dbPerson.date_of_birth).getFullYear(),
    initials: `${dbPerson.first_name[0]}${dbPerson.last_name[0]}`.toUpperCase(),
  },

  // Computed fields
  displayName: `${dbPerson.first_name} ${dbPerson.last_name}`,
  age:
    new Date().getFullYear() - new Date(dbPerson.date_of_birth).getFullYear(),
  initials: `${dbPerson.first_name[0]}${dbPerson.last_name[0]}`.toUpperCase(),
})

// Get paginated patients
export const usePatientsPage = (page: number, pageSize: number) => {
  return useQuery({
    queryKey: queryKeys.patientsPage(page, pageSize),
    queryFn: async (): Promise<PaginatedResponse<Patient>> => {
      const clinicId = useAuthStore.getState().clinicId
      if (!clinicId) throw new Error('No clinic selected')

      const { data, error, count } = await supabase
        .from('patients')
        .select(
          `
          *,
          person:person_id(*)
        `,
          { count: 'exact' }
        )
        .range((page - 1) * pageSize, page * pageSize - 1)
        .order('created_at', { ascending: false })

      if (error) {
        throw new Error(`Failed to fetch patients: ${error.message}`)
      }

      return {
        data: (data || []).map((item: any) =>
          transformPatient(item, item.person)
        ),
        total: count || 0,
        page,
        pageSize,
        hasMore: page * pageSize < (count || 0),
      }
    },
    staleTime: 60 * 1000, // 1 minute - patients list doesn't change frequently
  })
}

// Get recent patients for dashboard
export const useRecentPatients = (limit: number = 10) => {
  // Use the reactive auth store state
  const { clinicId } = useAuthStore()

  return useQuery({
    queryKey: queryKeys.recentPatients(limit),
    queryFn: async (): Promise<Patient[]> => {
      if (!clinicId) {
        return [] // Return empty array instead of throwing
      }
      const { data, error } = await supabase
        .from('patients')
        .select(
          `
          *,
          person:person_id(*)
        `
        )
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) {
        throw new Error(`Failed to fetch recent patients: ${error.message}`)
      }
      return (data || []).map((item: any) =>
        transformPatient(item, item.person)
      )
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - recent patients change occasionally
    enabled: !!clinicId, // Reactive: re-enables when clinicId becomes available
    refetchOnWindowFocus: false, // Prevent unnecessary refetches on window focus
    refetchOnReconnect: false, // Prevent refetches on network reconnect
  })
}

// Get frequent patients for quick access
export const useFrequentPatients = (limit: number = 15) => {
  return useQuery({
    queryKey: queryKeys.frequentPatients(),
    queryFn: async (): Promise<Patient[]> => {
      const clinicId = useAuthStore.getState().clinicId
      if (!clinicId) throw new Error('No clinic selected')

      const { data, error } = await supabase
        .from('patients')
        .select(
          `
          *,
          person:person_id(*),
          appointments!inner(id)
        `
        )
        .eq('clinic_id', clinicId)
        .order('appointments.count', { ascending: false })
        .limit(limit)

      if (error) {
        throw new Error(`Failed to fetch frequent patients: ${error.message}`)
      }

      return (data || []).map((item: any) =>
        transformPatient(item, item.person)
      )
    },
    staleTime: 10 * 60 * 1000, // 10 minutes - frequent patients change slowly
  })
}

// Get single patient by ID
export const usePatient = (id: string) => {
  return useQuery({
    queryKey: queryKeys.patient(id),
    queryFn: async (): Promise<Patient | null> => {
      const clinicId = useAuthStore.getState().clinicId
      if (!clinicId) throw new Error('No clinic selected')

      const { data, error } = await supabase
        .from('patients')
        .select(
          `
          *,
          person:person_id(*)
        `
        )
        .eq('id', id)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return null // Patient not found
        }
        throw new Error(`Failed to fetch patient: ${error.message}`)
      }

      return transformPatient(data, data.person)
    },
    enabled: !!id,
    staleTime: 2 * 60 * 1000, // 2 minutes - individual patient data
  })
}

// Search patients
export const useSearchPatients = (query: string, limit: number = 20) => {
  return useQuery({
    queryKey: queryKeys.patientSearch(query, limit),
    queryFn: async (): Promise<Patient[]> => {
      const clinicId = useAuthStore.getState().clinicId
      if (!clinicId) throw new Error('No clinic selected')

      const { data, error } = await supabase.rpc('search_patients', {
        search_query: query,
        result_limit: limit,
        clinic_id: clinicId,
      })

      if (error) {
        throw new Error(`Failed to search patients: ${error.message}`)
      }

      return (data || []).map((item: any) =>
        transformPatient(item, item.person)
      )
    },
    enabled: !!query && query.length > 2,
    staleTime: 30 * 1000, // 30 seconds - search results are temporary
  })
}

// Create patient mutation
export const useCreatePatient = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (
      patientData: Partial<Patient> & { person: Partial<Person> }
    ): Promise<Patient> => {
      // First create the person record
      const dbPersonData = {
        first_name: patientData.person.firstName!,
        last_name: patientData.person.lastName!,
        date_of_birth: patientData.person
          .dateOfBirth!.toISOString()
          .split('T')[0],
        sex: patientData.person.sex,
        phone: patientData.person.phone,
        phone_country_code: (patientData.person as any).phoneCountryCode,
        email: patientData.person.email,
        address: patientData.person.address,
        national_id: patientData.person.nationalId!,
        country: patientData.person.country!,
        clinic_id: (() => {
          const clinicId = useAuthStore.getState().clinicId
          if (!clinicId) throw new Error('No clinic selected')
          return clinicId
        })(),
      }

      const { data: personData, error: personError } = await supabase
        .from('persons')
        .insert(dbPersonData)
        .select()
        .single()

      if (personError) {
        throw new Error(`Failed to create person: ${personError.message}`)
      }

      // Then create the patient record
      const dbPatientData = {
        person_id: personData.id,
        clinic_id: (() => {
          const clinicId = useAuthStore.getState().clinicId
          if (!clinicId) throw new Error('No clinic selected')
          return clinicId
        })(),
        emergency_contact_name: patientData.emergencyContactName,
        emergency_contact_phone: patientData.emergencyContactPhone,
        emergency_contact_phone_country_code: (patientData as any)
          .emergencyContactPhoneCountryCode,
        medical_history: patientData.medicalHistory,
        allergies: patientData.allergies,
      }

      const { data, error } = await supabase
        .from('patients')
        .insert(dbPatientData)
        .select()
        .single()

      if (error) {
        throw new Error(`Failed to create patient: ${error.message}`)
      }

      return transformPatient(data, personData)
    },
    onSuccess: newPatient => {
      // Update relevant caches
      queryClient.setQueryData(
        queryKeys.recentPatients(10),
        (old: Patient[] = []) => {
          return [newPatient, ...old.slice(0, 9)]
        }
      )

      // Invalidate other patient-related queries
      queryClient.invalidateQueries({ queryKey: queryKeys.patients })
      queryClient.invalidateQueries({
        queryKey: queryKeys.patientSearch('', 20),
      })
    },
  })
}

// Update patient mutation
export const useUpdatePatient = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      patientData,
    }: {
      id: string
      patientData: Partial<Patient> & { person?: Partial<Person> }
    }): Promise<Patient> => {
      // Get current patient to access person_id
      const currentPatient = await queryClient.fetchQuery({
        queryKey: queryKeys.patient(id),
        queryFn: async (): Promise<Patient | null> => {
          const clinicId = useAuthStore.getState().clinicId
          if (!clinicId) throw new Error('No clinic selected')

          const { data, error } = await supabase
            .from('patients')
            .select(`*, person:person_id(*)`)
            .eq('id', id)
            .single()

          if (error)
            throw new Error(`Failed to fetch patient: ${error.message}`)
          return transformPatient(data, data.person)
        },
      })

      if (!currentPatient) {
        throw new Error('Patient not found')
      }

      // Update person data if provided
      if (patientData.person) {
        const dbPersonData: any = {}

        if (patientData.person.nationalId !== undefined)
          dbPersonData.national_id = patientData.person.nationalId
        if (patientData.person.country !== undefined)
          dbPersonData.country = patientData.person.country
        if (patientData.person.firstName !== undefined)
          dbPersonData.first_name = patientData.person.firstName
        if (patientData.person.lastName !== undefined)
          dbPersonData.last_name = patientData.person.lastName
        if (patientData.person.dateOfBirth)
          dbPersonData.date_of_birth = patientData.person.dateOfBirth
            .toISOString()
            .split('T')[0]
        if (patientData.person.sex !== undefined)
          dbPersonData.sex = patientData.person.sex
        if (patientData.person.phone !== undefined)
          dbPersonData.phone = patientData.person.phone
        if ((patientData.person as any).phoneCountryCode !== undefined)
          dbPersonData.phone_country_code = (
            patientData.person as any
          ).phoneCountryCode
        if (patientData.person.email !== undefined)
          dbPersonData.email = patientData.person.email
        if (patientData.person.address !== undefined)
          dbPersonData.address = patientData.person.address

        const { error: personError } = await supabase
          .from('persons')
          .update(dbPersonData)
          .eq('id', currentPatient.personId)

        if (personError) {
          throw new Error(`Failed to update person: ${personError.message}`)
        }
      }

      // Update patient data
      const dbPatientData: any = {}

      if (patientData.emergencyContactName !== undefined)
        dbPatientData.emergency_contact_name = patientData.emergencyContactName
      if (patientData.emergencyContactPhone !== undefined)
        dbPatientData.emergency_contact_phone =
          patientData.emergencyContactPhone
      if ((patientData as any).emergencyContactPhoneCountryCode !== undefined)
        dbPatientData.emergency_contact_phone_country_code = (
          patientData as any
        ).emergencyContactPhoneCountryCode
      if (patientData.medicalHistory !== undefined)
        dbPatientData.medical_history = patientData.medicalHistory
      if (patientData.allergies !== undefined)
        dbPatientData.allergies = patientData.allergies

      const clinicId = useAuthStore.getState().clinicId
      if (!clinicId) throw new Error('No clinic selected')

      const { data, error } = await supabase
        .from('patients')
        .update(dbPatientData)
        .eq('clinic_id', clinicId)
        .eq('id', id)
        .select(`*, person:person_id(*)`)
        .single()

      if (error) {
        throw new Error(`Failed to update patient: ${error.message}`)
      }

      return transformPatient(data, data.person)
    },
    onSuccess: updatedPatient => {
      // Update the specific patient cache
      queryClient.setQueryData(
        queryKeys.patient(updatedPatient.id),
        updatedPatient
      )

      // Invalidate related queries
      invalidatePatientData(updatedPatient.id)
    },
  })
}

// Delete patient mutation
export const useDeletePatient = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const clinicId = useAuthStore.getState().clinicId
      if (!clinicId) throw new Error('No clinic selected')

      const { error } = await supabase
        .from('patients')
        .delete()
        .eq('clinic_id', clinicId)
        .eq('id', id)

      if (error) {
        throw new Error(`Failed to delete patient: ${error.message}`)
      }
    },
    onSuccess: (_, deletedId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: queryKeys.patient(deletedId) })

      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: queryKeys.patients })
      queryClient.invalidateQueries({ queryKey: queryKeys.recentPatients(10) })
      queryClient.invalidateQueries({ queryKey: queryKeys.frequentPatients() })
    },
  })
}
