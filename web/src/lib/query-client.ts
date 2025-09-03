import { QueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/store'

// Global query client configuration
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Default to 5 minutes cache
      staleTime: 5 * 60 * 1000,

      // Keep data in cache for 10 minutes
      gcTime: 10 * 60 * 1000,

      // Retry on failure, but not for auth errors
      retry: (failureCount, error: any) => {
        // Don't retry auth errors (401, 403)
        if (error?.status === 401 || error?.status === 403) {
          return false
        }
        // Retry up to 3 times for other errors
        return failureCount < 3
      },

      // Refetch on window focus for real-time updates
      refetchOnWindowFocus: true,

      // Don't refetch on reconnect for offline scenarios
      refetchOnReconnect: false,
    },
    mutations: {
      // Default mutation error handling
      onError: (error: any) => {
        console.error('Mutation error:', error)

        // Handle auth errors globally
        if (error?.status === 401) {
          useAuthStore.getState().logout()
        }
      },
    },
  },
})

// Query key factory for consistent naming
export const queryKeys = {
  // Auth
  auth: ['auth'] as const,

  // Patients
  patients: ['patients'] as const,
  patient: (id: string) => ['patients', id] as const,
  patientSearch: (query: string, limit?: number) =>
    ['patients', 'search', query, limit] as const,
  patientsPage: (page: number, pageSize: number) =>
    ['patients', 'page', page, pageSize] as const,
  recentPatients: (limit: number) => ['patients', 'recent', limit] as const,
  frequentPatients: () => ['patients', 'frequent'] as const,

  // Appointments
  appointments: ['appointments'] as const,
  appointment: (id: string) => ['appointments', id] as const,
  appointmentsByDate: (date: string) =>
    ['appointments', 'by-date', date] as const,
  appointmentsByPatient: (patientId: string) =>
    ['appointments', 'by-patient', patientId] as const,

  // Providers
  providers: ['providers'] as const,
  provider: (id: string) => ['providers', id] as const,

  // Treatment Plans
  treatmentPlans: ['treatment-plans'] as const,
  treatmentPlan: (id: string) => ['treatment-plans', id] as const,
  treatmentPlansByPatient: (patientId: string) =>
    ['treatment-plans', 'by-patient', patientId] as const,

  // Procedures
  procedures: ['procedures'] as const,
  procedure: (id: string) => ['procedures', id] as const,

  // Tooth Conditions
  toothConditions: ['tooth-conditions'] as const,
  toothConditionsByPatient: (patientId: string) =>
    ['tooth-conditions', 'by-patient', patientId] as const,
}

// Utility to invalidate related queries
export const invalidatePatientData = (patientId: string) => {
  queryClient.invalidateQueries({ queryKey: queryKeys.patient(patientId) })
  queryClient.invalidateQueries({
    queryKey: queryKeys.appointmentsByPatient(patientId),
  })
  queryClient.invalidateQueries({
    queryKey: queryKeys.treatmentPlansByPatient(patientId),
  })
  queryClient.invalidateQueries({
    queryKey: queryKeys.toothConditionsByPatient(patientId),
  })
}

export const invalidateAppointmentData = () => {
  queryClient.invalidateQueries({ queryKey: queryKeys.appointments })
  // Also invalidate today's appointments specifically
  const today = new Date().toISOString().split('T')[0]
  queryClient.invalidateQueries({
    queryKey: queryKeys.appointmentsByDate(today),
  })
}
