// TanStack Query hooks for patients
// These provide reactive data with caching, loading states, and optimistic updates

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys, invalidatePatientData } from '@/lib/query-client'
import { patientsApi } from '@/lib/api'
import { Patient } from '@/types'

// Get all patients
export const usePatients = () => {
  return useQuery({
    queryKey: queryKeys.patients,
    queryFn: patientsApi.getAll,
    staleTime: 2 * 60 * 1000, // 2 minutes - patients don't change often
  })
}

// Get single patient by ID
export const usePatient = (id: string) => {
  return useQuery({
    queryKey: queryKeys.patient(id),
    queryFn: () => patientsApi.getById(id),
    enabled: !!id, // Only run if ID is provided
  })
}

// Search patients
export const usePatientSearch = (query: string) => {
  return useQuery({
    queryKey: queryKeys.patientSearch(query),
    queryFn: () => patientsApi.search(query),
    enabled: query.length >= 2, // Only search if query is at least 2 chars
    staleTime: 30 * 1000, // 30 seconds - search results can be more dynamic
  })
}

// Create patient mutation
export const useCreatePatient = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: patientsApi.create,
    onSuccess: (newPatient) => {
      // Update the patients list cache
      queryClient.setQueryData(queryKeys.patients, (old: Patient[] = []) => {
        return [...old, newPatient]
      })
      
      // Also cache the individual patient
      queryClient.setQueryData(queryKeys.patient(newPatient.id), newPatient)
      
      // Clear search caches since they might be outdated
      queryClient.invalidateQueries({ 
        queryKey: ['patients', 'search'],
        exact: false 
      })
    },
  })
}

// Update patient mutation
export const useUpdatePatient = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string, data: Partial<Patient> }) => 
      patientsApi.update(id, data),
    onSuccess: (updatedPatient) => {
      // Update individual patient cache
      queryClient.setQueryData(queryKeys.patient(updatedPatient.id), updatedPatient)
      
      // Update the patient in the main list
      queryClient.setQueryData(queryKeys.patients, (old: Patient[] = []) => {
        return old.map(patient => 
          patient.id === updatedPatient.id ? updatedPatient : patient
        )
      })
      
      // Invalidate related data
      invalidatePatientData(updatedPatient.id)
    },
  })
}

// Delete patient mutation
export const useDeletePatient = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: patientsApi.delete,
    onSuccess: (_, deletedId) => {
      // Remove from patients list
      queryClient.setQueryData(queryKeys.patients, (old: Patient[] = []) => {
        return old.filter(patient => patient.id !== deletedId)
      })
      
      // Remove individual patient cache
      queryClient.removeQueries({ queryKey: queryKeys.patient(deletedId) })
      
      // Invalidate related data
      invalidatePatientData(deletedId)
    },
  })
}

// Optimistic update helper for common patient updates
export const useOptimisticPatientUpdate = () => {
  const queryClient = useQueryClient()
  
  return (patientId: string, updates: Partial<Patient>) => {
    // Immediately update the UI before the API call
    queryClient.setQueryData(queryKeys.patient(patientId), (old: Patient | undefined) => {
      if (!old) return old
      return { ...old, ...updates }
    })
    
    queryClient.setQueryData(queryKeys.patients, (old: Patient[] = []) => {
      return old.map(patient => 
        patient.id === patientId ? { ...patient, ...updates } : patient
      )
    })
  }
}
