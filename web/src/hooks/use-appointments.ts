// TanStack Query hooks for appointments
// Handles scheduling, status updates, and calendar views

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys, invalidateAppointmentData } from '@/lib/query-client'
import { supabase } from '@/lib/api'
import { Appointment } from '@/types'
import { useAuthStore } from '@/store/auth'

// Get all appointments
export const useAppointments = () => {
  return useQuery({
    queryKey: queryKeys.appointments,
    queryFn: async (): Promise<Appointment[]> => {
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .order('appointment_date', { ascending: true })

      if (error) {
        throw new Error(`Failed to fetch appointments: ${error.message}`)
      }

      return (data || []).map((item: any) => ({
        id: item.id,
        clinicId: item.clinic_id,
        patientId: item.patient_id,
        providerId: item.provider_id,
        appointmentDate: new Date(item.appointment_date),
        durationMinutes: item.duration_minutes,
        appointmentType: item.appointment_type,
        status: item.status,
        notes: item.notes || undefined,
        endTime: new Date(
          new Date(item.appointment_date).getTime() +
            item.duration_minutes * 60000
        ),
        isToday:
          new Date(item.appointment_date).toDateString() ===
          new Date().toDateString(),
        isPast: new Date(item.appointment_date) < new Date(),
        statusColor: {
          scheduled: 'blue',
          completed: 'green',
          cancelled: 'red',
          no_show: 'orange',
        }[item.status],
      }))
    },
    staleTime: 30 * 1000, // 30 seconds - appointments change frequently
  })
}

// Get appointments for a specific date (for calendar view)
export const useAppointmentsByDate = (date: string) => {
  return useQuery({
    queryKey: queryKeys.appointmentsByDate(date),
    queryFn: async (): Promise<Appointment[]> => {
      const startOfDay = `${date}T00:00:00.000Z`
      const endOfDay = `${date}T23:59:59.999Z`

      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .gte('appointment_date', startOfDay)
        .lte('appointment_date', endOfDay)
        .order('appointment_date', { ascending: true })

      if (error) {
        throw new Error(
          `Failed to fetch appointments by date: ${error.message}`
        )
      }

      return (data || []).map((item: any) => ({
        id: item.id,
        clinicId: item.clinic_id,
        patientId: item.patient_id,
        providerId: item.provider_id,
        appointmentDate: new Date(item.appointment_date),
        durationMinutes: item.duration_minutes,
        appointmentType: item.appointment_type,
        status: item.status,
        notes: item.notes || undefined,
        endTime: new Date(
          new Date(item.appointment_date).getTime() +
            item.duration_minutes * 60000
        ),
        isToday:
          new Date(item.appointment_date).toDateString() ===
          new Date().toDateString(),
        isPast: new Date(item.appointment_date) < new Date(),
        statusColor: {
          scheduled: 'blue',
          completed: 'green',
          cancelled: 'red',
          no_show: 'orange',
        }[item.status],
      }))
    },
    staleTime: 15 * 1000, // 15 seconds - very fresh for today's schedule
  })
}

// Get appointments for a specific patient
export const useAppointmentsByPatient = (patientId: string) => {
  return useQuery({
    queryKey: queryKeys.appointmentsByPatient(patientId),
    queryFn: async (): Promise<Appointment[]> => {
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('patient_id', patientId)
        .order('appointment_date', { ascending: false })

      if (error) {
        throw new Error(
          `Failed to fetch patient appointments: ${error.message}`
        )
      }

      return (data || []).map((item: any) => ({
        id: item.id,
        clinicId: item.clinic_id,
        patientId: item.patient_id,
        providerId: item.provider_id,
        appointmentDate: new Date(item.appointment_date),
        durationMinutes: item.duration_minutes,
        appointmentType: item.appointment_type,
        status: item.status,
        notes: item.notes || undefined,
        endTime: new Date(
          new Date(item.appointment_date).getTime() +
            item.duration_minutes * 60000
        ),
        isToday:
          new Date(item.appointment_date).toDateString() ===
          new Date().toDateString(),
        isPast: new Date(item.appointment_date) < new Date(),
        statusColor: {
          scheduled: 'blue',
          completed: 'green',
          cancelled: 'red',
          no_show: 'orange',
        }[item.status],
      }))
    },
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
    mutationFn: async (
      appointmentData: Partial<Appointment>
    ): Promise<Appointment> => {
      const dbAppointmentData = {
        clinic_id: (() => {
          const clinicId = useAuthStore.getState().clinicId
          if (!clinicId) throw new Error('No clinic selected')
          return clinicId
        })(),
        patient_id: appointmentData.patientId!,
        provider_id: appointmentData.providerId!,
        appointment_date: appointmentData.appointmentDate!.toISOString(),
        duration_minutes: appointmentData.durationMinutes!,
        appointment_type: appointmentData.appointmentType!,
        notes: appointmentData.notes,
      }

      const { data, error } = await supabase
        .from('appointments')
        .insert(dbAppointmentData)
        .select()
        .single()

      if (error) {
        throw new Error(`Failed to create appointment: ${error.message}`)
      }

      return {
        id: data.id,
        clinicId: data.clinic_id,
        patientId: data.patient_id,
        providerId: data.provider_id,
        appointmentDate: new Date(data.appointment_date),
        durationMinutes: data.duration_minutes,
        appointmentType: data.appointment_type,
        status: data.status,
        notes: data.notes || undefined,
        endTime: new Date(
          new Date(data.appointment_date).getTime() +
            data.duration_minutes * 60000
        ),
        isToday:
          new Date(data.appointment_date).toDateString() ===
          new Date().toDateString(),
        isPast: new Date(data.appointment_date) < new Date(),
        statusColor: {
          scheduled: 'blue',
          completed: 'green',
          cancelled: 'red',
          no_show: 'orange',
        }[data.status],
      }
    },
    onSuccess: newAppointment => {
      // Update appointments list
      queryClient.setQueryData(
        queryKeys.appointments,
        (old: Appointment[] = []) => {
          return [...old, newAppointment].sort(
            (a, b) => a.appointmentDate.getTime() - b.appointmentDate.getTime()
          )
        }
      )

      // Update date-specific cache
      const appointmentDate = newAppointment.appointmentDate
        .toISOString()
        .split('T')[0]
      queryClient.setQueryData(
        queryKeys.appointmentsByDate(appointmentDate),
        (old: Appointment[] = []) => {
          return [...old, newAppointment].sort(
            (a, b) => a.appointmentDate.getTime() - b.appointmentDate.getTime()
          )
        }
      )

      // Update patient-specific cache
      queryClient.setQueryData(
        queryKeys.appointmentsByPatient(newAppointment.patientId),
        (old: Appointment[] = []) => {
          return [...old, newAppointment].sort(
            (a, b) => b.appointmentDate.getTime() - a.appointmentDate.getTime()
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
    mutationFn: async ({
      id,
      data,
    }: {
      id: string
      data: Partial<Appointment>
    }): Promise<Appointment> => {
      const dbAppointmentData: any = {}

      if (data.appointmentDate)
        dbAppointmentData.appointment_date = data.appointmentDate.toISOString()
      if (data.durationMinutes)
        dbAppointmentData.duration_minutes = data.durationMinutes
      if (data.appointmentType)
        dbAppointmentData.appointment_type = data.appointmentType
      if (data.status) dbAppointmentData.status = data.status
      if (data.notes !== undefined) dbAppointmentData.notes = data.notes

      const { data: result, error } = await supabase
        .from('appointments')
        .update(dbAppointmentData)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        throw new Error(`Failed to update appointment: ${error.message}`)
      }

      return {
        id: result.id,
        clinicId: result.clinic_id,
        patientId: result.patient_id,
        providerId: result.provider_id,
        appointmentDate: new Date(result.appointment_date),
        durationMinutes: result.duration_minutes,
        appointmentType: result.appointment_type,
        status: result.status,
        notes: result.notes || undefined,
        endTime: new Date(
          new Date(result.appointment_date).getTime() +
            result.duration_minutes * 60000
        ),
        isToday:
          new Date(result.appointment_date).toDateString() ===
          new Date().toDateString(),
        isPast: new Date(result.appointment_date) < new Date(),
        statusColor: {
          scheduled: 'blue',
          completed: 'green',
          cancelled: 'red',
          no_show: 'orange',
        }[result.status],
      }
    },
    onSuccess: updatedAppointment => {
      // Update all relevant caches
      invalidateAppointmentData()

      // Also update patient-specific cache
      queryClient.invalidateQueries({
        queryKey: queryKeys.appointmentsByPatient(updatedAppointment.patientId),
      })
    },
  })
}

// Quick status update mutation (for appointment check-in)
export const useUpdateAppointmentStatus = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      status,
    }: {
      id: string
      status: Appointment['status']
    }): Promise<Appointment> => {
      const { data, error } = await supabase
        .from('appointments')
        .update({ status })
        .eq('id', id)
        .select()
        .single()

      if (error) {
        throw new Error(`Failed to update appointment status: ${error.message}`)
      }

      return {
        id: data.id,
        clinicId: data.clinic_id,
        patientId: data.patient_id,
        providerId: data.provider_id,
        appointmentDate: new Date(data.appointment_date),
        durationMinutes: data.duration_minutes,
        appointmentType: data.appointment_type,
        status: data.status,
        notes: data.notes || undefined,
        endTime: new Date(
          new Date(data.appointment_date).getTime() +
            data.duration_minutes * 60000
        ),
        isToday:
          new Date(data.appointment_date).toDateString() ===
          new Date().toDateString(),
        isPast: new Date(data.appointment_date) < new Date(),
        statusColor: {
          scheduled: 'blue',
          completed: 'green',
          cancelled: 'red',
          no_show: 'orange',
        }[data.status],
      }
    },
    onMutate: async ({ id, status }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.appointments })

      // Optimistically update the appointment status
      queryClient.setQueryData(
        queryKeys.appointments,
        (old: Appointment[] = []) => {
          return old.map(appointment =>
            appointment.id === id
              ? { ...appointment, status, statusColor: getStatusColor(status) }
              : appointment
          )
        }
      )

      // Also update today's appointments if it's today
      const today = new Date().toISOString().split('T')[0]
      queryClient.setQueryData(
        queryKeys.appointmentsByDate(today),
        (old: Appointment[] = []) => {
          return old.map(appointment =>
            appointment.id === id
              ? { ...appointment, status, statusColor: getStatusColor(status) }
              : appointment
          )
        }
      )
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
    no_show: 'orange',
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
  const appointmentEnd = appointmentStart + duration * 60000

  return dayAppointments.filter(apt => {
    if (apt.id === excludeId) return false // Exclude current appointment when editing
    if (apt.providerId !== providerId) return false // Different provider, no conflict
    if (apt.status === 'cancelled') return false // Cancelled appointments don't conflict

    const aptStart = apt.appointmentDate.getTime()
    const aptEnd = apt.endTime.getTime()

    // Check for overlap
    return appointmentStart < aptEnd && appointmentEnd > aptStart
  })
}
