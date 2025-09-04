// API client with Supabase integration
// This will be the bridge between TanStack Query and Supabase

import { createClient } from '@supabase/supabase-js'
import {
  Patient,
  Appointment,
  Provider,
  Procedure,
  Person,
  DbPatient,
  DbAppointment,
  DbProvider,
  DbProcedure,
  DbPerson,
  PaginatedResponse,
} from '@/types'

// Supabase client - will be configured with actual credentials later
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'mock-key'

export const supabase = createClient(supabaseUrl, supabaseKey)

// Data transformation utilities
export const transformPatient = (
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

export const transformAppointment = (
  dbAppointment: DbAppointment
): Appointment => ({
  id: dbAppointment.id,
  clinicId: dbAppointment.clinic_id,
  patientId: dbAppointment.patient_id,
  providerId: dbAppointment.provider_id,
  appointmentDate: new Date(dbAppointment.appointment_date),
  durationMinutes: dbAppointment.duration_minutes,
  appointmentType: dbAppointment.appointment_type,
  status: dbAppointment.status,
  notes: dbAppointment.notes || undefined,

  // Computed fields
  endTime: new Date(
    new Date(dbAppointment.appointment_date).getTime() +
      dbAppointment.duration_minutes * 60000
  ),
  isToday:
    new Date(dbAppointment.appointment_date).toDateString() ===
    new Date().toDateString(),
  isPast: new Date(dbAppointment.appointment_date) < new Date(),
  statusColor: {
    scheduled: 'blue',
    completed: 'green',
    cancelled: 'red',
    no_show: 'orange',
  }[dbAppointment.status],
})

export const transformProvider = (
  dbProvider: DbProvider,
  dbPerson: DbPerson
): Provider => ({
  id: dbProvider.id,
  personId: dbProvider.person_id,
  clinicId: dbProvider.clinic_id,
  specialty: dbProvider.specialty || undefined,
  isActive: dbProvider.is_active,

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
    email: dbPerson.email || undefined,
    address: dbPerson.address || undefined,
    displayName: `${dbPerson.first_name} ${dbPerson.last_name}`,
    age:
      new Date().getFullYear() - new Date(dbPerson.date_of_birth).getFullYear(),
    initials: `${dbPerson.first_name[0]}${dbPerson.last_name[0]}`.toUpperCase(),
  },

  // Computed fields
  displayName: `${dbPerson.first_name} ${dbPerson.last_name}`,
})

export const transformProcedure = (dbProcedure: DbProcedure): Procedure => ({
  id: dbProcedure.id,
  clinicId: dbProcedure.clinic_id,
  code: dbProcedure.code || undefined,
  name: dbProcedure.name,
  description: dbProcedure.description || undefined,
  defaultCost: dbProcedure.default_cost || undefined,
  estimatedDurationMinutes: dbProcedure.estimated_duration_minutes || undefined,
  category: dbProcedure.category || undefined,
  isActive: dbProcedure.is_active,
  displayName: dbProcedure.code
    ? `${dbProcedure.code} - ${dbProcedure.name}`
    : dbProcedure.name,
})

// API functions - these will be used by TanStack Query

// Patients API
export const patientsApi = {
  // Paginated approach for large datasets
  getPage: async (
    page: number,
    pageSize: number
  ): Promise<PaginatedResponse<Patient>> => {
    // Real Supabase implementation
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

  // Recent patients for dashboard
  getRecent: async (limit: number = 10): Promise<Patient[]> => {
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

    return (data || []).map((item: any) => transformPatient(item, item.person))
  },

  // Frequent patients for quick access
  getFrequent: async (limit: number = 15): Promise<Patient[]> => {
    const { data, error } = await supabase
      .from('patients')
      .select(
        `
        *,
        person:person_id(*),
        appointments!inner(id)
      `
      )
      .order('appointments.count', { ascending: false })
      .limit(limit)

    if (error) {
      throw new Error(`Failed to fetch frequent patients: ${error.message}`)
    }

    return (data || []).map((item: any) => transformPatient(item, item.person))
  },

  getById: async (id: string): Promise<Patient | null> => {
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

  search: async (query: string, limit: number = 20): Promise<Patient[]> => {
    const { data, error } = await supabase.rpc('search_patients', {
      search_query: query,
      result_limit: limit,
    })

    if (error) {
      throw new Error(`Failed to search patients: ${error.message}`)
    }

    return (data || []).map((item: any) => transformPatient(item, item.person))
  },

  create: async (
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
      email: patientData.person.email,
      address: patientData.person.address,
      national_id: patientData.person.nationalId!,
      country: patientData.person.country!,
      clinic_id: 'clinic-1', // TODO: Get from auth store
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
      clinic_id: 'clinic-1', // TODO: Get from auth store
      emergency_contact_name: patientData.emergencyContactName,
      emergency_contact_phone: patientData.emergencyContactPhone,
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

  update: async (
    id: string,
    patientData: Partial<Patient> & { person?: Partial<Person> }
  ): Promise<Patient> => {
    // Get current patient to access person_id
    const currentPatient = await patientsApi.getById(id)
    if (!currentPatient) {
      throw new Error('Patient not found')
    }

    // Update person data if provided
    if (patientData.person) {
      const dbPersonData: any = {}

      if (patientData.person.firstName)
        dbPersonData.first_name = patientData.person.firstName
      if (patientData.person.lastName)
        dbPersonData.last_name = patientData.person.lastName
      if (patientData.person.dateOfBirth)
        dbPersonData.date_of_birth = patientData.person.dateOfBirth
          .toISOString()
          .split('T')[0]
      if (patientData.person.sex !== undefined)
        dbPersonData.sex = patientData.person.sex
      if (patientData.person.phone !== undefined)
        dbPersonData.phone = patientData.person.phone
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
      dbPatientData.emergency_contact_phone = patientData.emergencyContactPhone
    if (patientData.medicalHistory !== undefined)
      dbPatientData.medical_history = patientData.medicalHistory
    if (patientData.allergies !== undefined)
      dbPatientData.allergies = patientData.allergies

    const { data, error } = await supabase
      .from('patients')
      .update(dbPatientData)
      .eq('id', id)
      .select(
        `
        *,
        person:person_id(*)
      `
      )
      .single()

    if (error) {
      throw new Error(`Failed to update patient: ${error.message}`)
    }

    return transformPatient(data, data.person)
  },

  delete: async (id: string): Promise<void> => {
    const { error } = await supabase.from('patients').delete().eq('id', id)

    if (error) {
      throw new Error(`Failed to delete patient: ${error.message}`)
    }
  },
}

// Appointments API
export const appointmentsApi = {
  getAll: async (): Promise<Appointment[]> => {
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .order('appointment_date', { ascending: true })

    if (error) {
      throw new Error(`Failed to fetch appointments: ${error.message}`)
    }

    return (data || []).map(transformAppointment)
  },

  getByDate: async (date: string): Promise<Appointment[]> => {
    const startOfDay = `${date}T00:00:00.000Z`
    const endOfDay = `${date}T23:59:59.999Z`

    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .gte('appointment_date', startOfDay)
      .lte('appointment_date', endOfDay)
      .order('appointment_date', { ascending: true })

    if (error) {
      throw new Error(`Failed to fetch appointments by date: ${error.message}`)
    }

    return (data || []).map(transformAppointment)
  },

  getByPatient: async (patientId: string): Promise<Appointment[]> => {
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .eq('patient_id', patientId)
      .order('appointment_date', { ascending: false })

    if (error) {
      throw new Error(`Failed to fetch patient appointments: ${error.message}`)
    }

    return (data || []).map(transformAppointment)
  },

  create: async (
    appointmentData: Partial<Appointment>
  ): Promise<Appointment> => {
    const dbAppointmentData = {
      clinic_id: 'clinic-1', // TODO: Get from auth store
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

    return transformAppointment(data)
  },

  update: async (
    id: string,
    appointmentData: Partial<Appointment>
  ): Promise<Appointment> => {
    const dbAppointmentData: any = {}

    if (appointmentData.appointmentDate)
      dbAppointmentData.appointment_date =
        appointmentData.appointmentDate.toISOString()
    if (appointmentData.durationMinutes)
      dbAppointmentData.duration_minutes = appointmentData.durationMinutes
    if (appointmentData.appointmentType)
      dbAppointmentData.appointment_type = appointmentData.appointmentType
    if (appointmentData.status)
      dbAppointmentData.status = appointmentData.status
    if (appointmentData.notes !== undefined)
      dbAppointmentData.notes = appointmentData.notes

    const { data, error } = await supabase
      .from('appointments')
      .update(dbAppointmentData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update appointment: ${error.message}`)
    }

    return transformAppointment(data)
  },

  updateStatus: async (
    id: string,
    status: Appointment['status']
  ): Promise<Appointment> => {
    const { data, error } = await supabase
      .from('appointments')
      .update({ status })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update appointment status: ${error.message}`)
    }

    return transformAppointment(data)
  },
}

// Providers API
export const providersApi = {
  getAll: async (): Promise<Provider[]> => {
    const { data, error } = await supabase
      .from('providers')
      .select(
        `
        *,
        person:person_id(*)
      `
      )
      .eq('is_active', true)
      .order('person.first_name', { ascending: true })

    if (error) {
      throw new Error(`Failed to fetch providers: ${error.message}`)
    }

    return (data || []).map((item: any) => transformProvider(item, item.person))
  },
}

// Procedures API
export const proceduresApi = {
  getAll: async (): Promise<Procedure[]> => {
    const { data, error } = await supabase
      .from('procedures')
      .select('*')
      .eq('is_active', true)
      .order('category', { ascending: true })

    if (error) {
      throw new Error(`Failed to fetch procedures: ${error.message}`)
    }

    return (data || []).map(transformProcedure)
  },
}
