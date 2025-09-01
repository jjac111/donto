// API client with Supabase integration
// This will be the bridge between TanStack Query and Supabase

import { createClient } from "@supabase/supabase-js";
import {
  Patient,
  Appointment,
  Provider,
  TreatmentPlan,
  Procedure,
  ToothCondition,
  DbPatient,
  DbAppointment,
  DbProvider,
  DbTreatmentPlan,
  DbProcedure,
  DbToothCondition,
  ApiResponse,
  PaginatedResponse,
} from "@/types";

// Supabase client - will be configured with actual credentials later
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "http://localhost:54321";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "mock-key";

export const supabase = createClient(supabaseUrl, supabaseKey);

// Data transformation utilities
export const transformPatient = (dbPatient: DbPatient): Patient => ({
  id: dbPatient.id,
  clinicId: dbPatient.clinic_id,
  firstName: dbPatient.first_name,
  lastName: dbPatient.last_name,
  dateOfBirth: new Date(dbPatient.date_of_birth),
  sex: dbPatient.sex || undefined,
  phone: dbPatient.phone || undefined,
  email: dbPatient.email || undefined,
  address: dbPatient.address || undefined,
  emergencyContactName: dbPatient.emergency_contact_name || undefined,
  emergencyContactPhone: dbPatient.emergency_contact_phone || undefined,
  medicalHistory: dbPatient.medical_history || undefined,
  allergies: dbPatient.allergies || undefined,
  patientNumber: dbPatient.patient_number || undefined,

  // Computed fields
  displayName: `${dbPatient.first_name} ${dbPatient.last_name}`,
  age:
    new Date().getFullYear() - new Date(dbPatient.date_of_birth).getFullYear(),
  initials: `${dbPatient.first_name[0]}${dbPatient.last_name[0]}`.toUpperCase(),
});

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
    scheduled: "blue",
    completed: "green",
    cancelled: "red",
    no_show: "orange",
  }[dbAppointment.status],
});

// API functions - these will be used by TanStack Query

// Patients API
export const patientsApi = {
  // ⚠️ DEPRECATED: Don't use for large datasets
  getAll: async (): Promise<Patient[]> => {
    // TODO: Remove this for production - only for small clinics
    console.warn("patientsApi.getAll() should not be used for large datasets");
    return patientsApi.getPage(1, 50).then((result) => result.data);
  },

  // Paginated approach for large datasets
  getPage: async (
    page: number,
    pageSize: number
  ): Promise<PaginatedResponse<Patient>> => {
    // TODO: Replace with actual Supabase call
    // const { data, error, count } = await supabase
    //   .from('patients')
    //   .select('*', { count: 'exact' })
    //   .range((page - 1) * pageSize, page * pageSize - 1)
    //   .order('created_at', { ascending: false })

    // Mock paginated data
    const mockPatients: DbPatient[] = [
      {
        id: "1",
        clinic_id: "clinic-1",
        first_name: "María",
        last_name: "González",
        date_of_birth: "1985-03-15",
        sex: "F",
        phone: "+34 600 123 456",
        email: "maria.gonzalez@email.com",
        address: "Calle Mayor 123, Madrid",
        emergency_contact_name: "Juan González",
        emergency_contact_phone: "+34 600 654 321",
        medical_history: "Sin antecedentes relevantes",
        allergies: "Penicilina",
        patient_number: "P001",
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
      },
    ];

    return {
      data: mockPatients.map(transformPatient),
      total: 5000, // Mock total
      page,
      pageSize,
      hasMore: page * pageSize < 5000,
    };
  },

  // Recent patients for dashboard
  getRecent: async (limit: number = 10): Promise<Patient[]> => {
    // TODO: Replace with actual Supabase call
    // const { data, error } = await supabase
    //   .from('patients')
    //   .select('*')
    //   .order('created_at', { ascending: false })
    //   .limit(limit)

    return patientsApi.getPage(1, limit).then((result) => result.data);
  },

  // Frequent patients for quick access
  getFrequent: async (limit: number = 15): Promise<Patient[]> => {
    // TODO: Replace with actual Supabase call with appointment count join
    // const { data, error } = await supabase
    //   .from('patients')
    //   .select('*, appointments(count)')
    //   .order('appointments.count', { ascending: false })
    //   .limit(limit)

    return patientsApi.getPage(1, limit).then((result) => result.data);
  },

  getById: async (id: string): Promise<Patient | null> => {
    // TODO: Replace with actual Supabase call
    const patients = await patientsApi.getAll();
    return patients.find((p) => p.id === id) || null;
  },

  search: async (query: string, limit: number = 20): Promise<Patient[]> => {
    // TODO: Replace with actual Supabase call with full-text search
    // const { data, error } = await supabase
    //   .from('patients')
    //   .select('*')
    //   .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,phone.ilike.%${query}%,email.ilike.%${query}%`)
    //   .limit(limit)
    //   .order('created_at', { ascending: false })

    // Mock search - in real app this would be much faster with DB indexes
    const allPatients = await patientsApi.getPage(1, 100); // Search in first 100 for demo
    return allPatients.data
      .filter(
        (p) =>
          p.displayName.toLowerCase().includes(query.toLowerCase()) ||
          p.phone?.includes(query) ||
          p.email?.toLowerCase().includes(query.toLowerCase()) ||
          p.patientNumber?.toLowerCase().includes(query.toLowerCase())
      )
      .slice(0, limit);
  },

  create: async (patientData: Partial<Patient>): Promise<Patient> => {
    // TODO: Replace with actual Supabase call
    throw new Error("Not implemented yet");
  },

  update: async (
    id: string,
    patientData: Partial<Patient>
  ): Promise<Patient> => {
    // TODO: Replace with actual Supabase call
    throw new Error("Not implemented yet");
  },

  delete: async (id: string): Promise<void> => {
    // TODO: Replace with actual Supabase call
    throw new Error("Not implemented yet");
  },
};

// Appointments API
export const appointmentsApi = {
  getAll: async (): Promise<Appointment[]> => {
    // TODO: Replace with actual Supabase call
    return [];
  },

  getByDate: async (date: string): Promise<Appointment[]> => {
    // TODO: Replace with actual Supabase call
    return [];
  },

  getByPatient: async (patientId: string): Promise<Appointment[]> => {
    // TODO: Replace with actual Supabase call
    return [];
  },

  create: async (
    appointmentData: Partial<Appointment>
  ): Promise<Appointment> => {
    // TODO: Replace with actual Supabase call
    throw new Error("Not implemented yet");
  },

  update: async (
    id: string,
    appointmentData: Partial<Appointment>
  ): Promise<Appointment> => {
    // TODO: Replace with actual Supabase call
    throw new Error("Not implemented yet");
  },

  updateStatus: async (
    id: string,
    status: Appointment["status"]
  ): Promise<Appointment> => {
    // TODO: Replace with actual Supabase call
    throw new Error("Not implemented yet");
  },
};

// Providers API
export const providersApi = {
  getAll: async (): Promise<Provider[]> => {
    // TODO: Replace with actual Supabase call
    return [];
  },
};

// Procedures API
export const proceduresApi = {
  getAll: async (): Promise<Procedure[]> => {
    // TODO: Replace with actual Supabase call
    return [];
  },
};
