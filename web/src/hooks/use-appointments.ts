// TanStack Query hooks for appointments
// Handles scheduling, status updates, and calendar views

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys, invalidateAppointmentData } from '@/lib/query-client'
import { appointmentsApi } from '@/lib/api'
import { Appointment } from '@/types'

// Get all appointments
export const useAppointments = () => {
  return useQuery({
    queryKey: queryKeys.appointments,
    queryFn: appointmentsApi.getAll,
    staleTime: 30 * 1000, // 30 seconds - appointments change frequently
  })
}

// Get appointments for a specific date (for calendar view)
export const useAppointmentsByDate = (date: string) => {
  return useQuery({
    queryKey: queryKeys.appointmentsByDate(date),
    queryFn: () => appointmentsApi.getByDate(date),
    staleTime: 15 * 1000, // 15 seconds - very fresh for today's schedule
  })
}

// Get appointments for a specific patient
export const useAppointmentsByPatient = (patientId: string) => {
  return useQuery({
    queryKey: queryKeys.appointmentsByPatient(patientId),
    queryFn: () => appointmentsApi.getByPatient(patientId),
    enabled: !!patientId,
    staleTime: 60 * 1000, // 1 minute - patient history doesn't change often
  })
}

// Get today's appointments (common use case)
export const useTodaysAppointments = () => {
  const today = new Date().toISOString().split('T')[0]
  return useAppointmentsByDate(today)
}

// Create appointment mutation
export const useCreateAppointment = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: appointmentsApi.create,
    onSuccess: (newAppointment) => {
      // Update appointments list
      queryClient.setQueryData(queryKeys.appointments, (old: Appointment[] = []) => {
        return [...old, newAppointment].sort((a, b) => 
          a.appointmentDate.getTime() - b.appointmentDate.getTime()
        )
      })
      
      // Update date-specific cache
      const appointmentDate = newAppointment.appointmentDate.toISOString().split('T')[0]
      queryClient.setQueryData(
        queryKeys.appointmentsByDate(appointmentDate), 
        (old: Appointment[] = []) => {
          return [...old, newAppointment].sort((a, b) => 
            a.appointmentDate.getTime() - b.appointmentDate.getTime()
          )
        }
      )
      
      // Update patient-specific cache
      queryClient.setQueryData(
        queryKeys.appointmentsByPatient(newAppointment.patientId),
        (old: Appointment[] = []) => {
          return [...old, newAppointment].sort((a, b) => 
            b.appointmentDate.getTime() - a.appointmentDate.getTime()
          )
        }
      )
    },
  })
}

// Update appointment mutation
export const useUpdateAppointment = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string, data: Partial<Appointment> }) => 
      appointmentsApi.update(id, data),
    onSuccess: (updatedAppointment) => {
      // Update all relevant caches
      invalidateAppointmentData()
      
      // Also update patient-specific cache
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.appointmentsByPatient(updatedAppointment.patientId) 
      })
    },
  })
}

// Quick status update mutation (for appointment check-in)
export const useUpdateAppointmentStatus = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, status }: { id: string, status: Appointment['status'] }) => 
      appointmentsApi.updateStatus(id, status),
    onMutate: async ({ id, status }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.appointments })
      
      // Optimistically update the appointment status
      queryClient.setQueryData(queryKeys.appointments, (old: Appointment[] = []) => {
        return old.map(appointment => 
          appointment.id === id 
            ? { ...appointment, status, statusColor: getStatusColor(status) }
            : appointment
        )
      })
      
      // Also update today's appointments if it's today
      const today = new Date().toISOString().split('T')[0]
      queryClient.setQueryData(queryKeys.appointmentsByDate(today), (old: Appointment[] = []) => {
        return old.map(appointment => 
          appointment.id === id 
            ? { ...appointment, status, statusColor: getStatusColor(status) }
            : appointment
        )
      })
    },
    onError: () => {
      // Revert optimistic updates on error
      invalidateAppointmentData()
    },
  })
}

// Helper function for status colors
const getStatusColor = (status: Appointment['status']): string => {
  const colors = {
    scheduled: 'blue',
    completed: 'green',
    cancelled: 'red',
    no_show: 'orange'
  }
  return colors[status]
}

// Get appointment conflicts (for scheduling validation)
export const useAppointmentConflicts = (
  providerId: string, 
  date: Date, 
  duration: number,
  excludeId?: string
) => {
  const dateStr = date.toISOString().split('T')[0]
  const { data: dayAppointments } = useAppointmentsByDate(dateStr)
  
  if (!dayAppointments) return []
  
  const appointmentStart = date.getTime()
  const appointmentEnd = appointmentStart + (duration * 60000)
  
  return dayAppointments.filter(apt => {
    if (apt.id === excludeId) return false // Exclude current appointment when editing
    if (apt.providerId !== providerId) return false // Different provider, no conflict
    if (apt.status === 'cancelled') return false // Cancelled appointments don't conflict
    
    const aptStart = apt.appointmentDate.getTime()
    const aptEnd = apt.endTime.getTime()
    
    // Check for overlap
    return (appointmentStart < aptEnd && appointmentEnd > aptStart)
  })
}
