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

export const transformProvider = (dbProvider: DbProvider): Provider => ({
  id: dbProvider.id,
  clinicId: dbProvider.clinic_id,
  firstName: dbProvider.first_name,
  lastName: dbProvider.last_name,
  email: dbProvider.email || undefined,
  phone: dbProvider.phone || undefined,
  specialty: dbProvider.specialty || undefined,
  isActive: dbProvider.is_active,
  displayName: `${dbProvider.first_name} ${dbProvider.last_name}`,
});

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
});

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
      .from("patients")
      .select("*", { count: "exact" })
      .range((page - 1) * pageSize, page * pageSize - 1)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch patients: ${error.message}`);
    }

    return {
      data: (data || []).map(transformPatient),
      total: count || 0,
      page,
      pageSize,
      hasMore: page * pageSize < (count || 0),
    };
  },

  // Recent patients for dashboard
  getRecent: async (limit: number = 10): Promise<Patient[]> => {
    const { data, error } = await supabase
      .from("patients")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to fetch recent patients: ${error.message}`);
    }

    return (data || []).map(transformPatient);
  },

  // Frequent patients for quick access
  getFrequent: async (limit: number = 15): Promise<Patient[]> => {
    const { data, error } = await supabase
      .from("patients")
      .select(
        `
        *,
        appointments!inner(id)
      `
      )
      .order("appointments.count", { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to fetch frequent patients: ${error.message}`);
    }

    return (data || []).map(transformPatient);
  },

  getById: async (id: string): Promise<Patient | null> => {
    const { data, error } = await supabase
      .from("patients")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null; // Patient not found
      }
      throw new Error(`Failed to fetch patient: ${error.message}`);
    }

    return transformPatient(data);
  },

  search: async (query: string, limit: number = 20): Promise<Patient[]> => {
    const { data, error } = await supabase.rpc("search_patients", {
      search_query: query,
      result_limit: limit,
    });

    if (error) {
      throw new Error(`Failed to search patients: ${error.message}`);
    }

    return (data || []).map(transformPatient);
  },

  create: async (patientData: Partial<Patient>): Promise<Patient> => {
    // Transform frontend data to database format
    const dbPatientData = {
      first_name: patientData.firstName!,
      last_name: patientData.lastName!,
      date_of_birth: patientData.dateOfBirth!.toISOString().split("T")[0],
      sex: patientData.sex,
      phone: patientData.phone,
      email: patientData.email,
      address: patientData.address,
      emergency_contact_name: patientData.emergencyContactName,
      emergency_contact_phone: patientData.emergencyContactPhone,
      medical_history: patientData.medicalHistory,
      allergies: patientData.allergies,
      // clinic_id will be set from auth context when implemented
      clinic_id: "clinic-1", // TODO: Get from auth store
    };

    const { data, error } = await supabase
      .from("patients")
      .insert(dbPatientData)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create patient: ${error.message}`);
    }

    return transformPatient(data);
  },

  update: async (
    id: string,
    patientData: Partial<Patient>
  ): Promise<Patient> => {
    // Transform frontend data to database format
    const dbPatientData: any = {};

    if (patientData.firstName) dbPatientData.first_name = patientData.firstName;
    if (patientData.lastName) dbPatientData.last_name = patientData.lastName;
    if (patientData.dateOfBirth)
      dbPatientData.date_of_birth = patientData.dateOfBirth
        .toISOString()
        .split("T")[0];
    if (patientData.sex) dbPatientData.sex = patientData.sex;
    if (patientData.phone !== undefined)
      dbPatientData.phone = patientData.phone;
    if (patientData.email !== undefined)
      dbPatientData.email = patientData.email;
    if (patientData.address !== undefined)
      dbPatientData.address = patientData.address;
    if (patientData.emergencyContactName !== undefined)
      dbPatientData.emergency_contact_name = patientData.emergencyContactName;
    if (patientData.emergencyContactPhone !== undefined)
      dbPatientData.emergency_contact_phone = patientData.emergencyContactPhone;
    if (patientData.medicalHistory !== undefined)
      dbPatientData.medical_history = patientData.medicalHistory;
    if (patientData.allergies !== undefined)
      dbPatientData.allergies = patientData.allergies;

    const { data, error } = await supabase
      .from("patients")
      .update(dbPatientData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update patient: ${error.message}`);
    }

    return transformPatient(data);
  },

  delete: async (id: string): Promise<void> => {
    const { error } = await supabase.from("patients").delete().eq("id", id);

    if (error) {
      throw new Error(`Failed to delete patient: ${error.message}`);
    }
  },
};

// Appointments API
export const appointmentsApi = {
  getAll: async (): Promise<Appointment[]> => {
    const { data, error } = await supabase
      .from("appointments")
      .select("*")
      .order("appointment_date", { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch appointments: ${error.message}`);
    }

    return (data || []).map(transformAppointment);
  },

  getByDate: async (date: string): Promise<Appointment[]> => {
    const startOfDay = `${date}T00:00:00.000Z`;
    const endOfDay = `${date}T23:59:59.999Z`;

    const { data, error } = await supabase
      .from("appointments")
      .select("*")
      .gte("appointment_date", startOfDay)
      .lte("appointment_date", endOfDay)
      .order("appointment_date", { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch appointments by date: ${error.message}`);
    }

    return (data || []).map(transformAppointment);
  },

  getByPatient: async (patientId: string): Promise<Appointment[]> => {
    const { data, error } = await supabase
      .from("appointments")
      .select("*")
      .eq("patient_id", patientId)
      .order("appointment_date", { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch patient appointments: ${error.message}`);
    }

    return (data || []).map(transformAppointment);
  },

  create: async (
    appointmentData: Partial<Appointment>
  ): Promise<Appointment> => {
    const dbAppointmentData = {
      clinic_id: "clinic-1", // TODO: Get from auth store
      patient_id: appointmentData.patientId!,
      provider_id: appointmentData.providerId!,
      appointment_date: appointmentData.appointmentDate!.toISOString(),
      duration_minutes: appointmentData.durationMinutes!,
      appointment_type: appointmentData.appointmentType!,
      notes: appointmentData.notes,
    };

    const { data, error } = await supabase
      .from("appointments")
      .insert(dbAppointmentData)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create appointment: ${error.message}`);
    }

    return transformAppointment(data);
  },

  update: async (
    id: string,
    appointmentData: Partial<Appointment>
  ): Promise<Appointment> => {
    const dbAppointmentData: any = {};

    if (appointmentData.appointmentDate)
      dbAppointmentData.appointment_date =
        appointmentData.appointmentDate.toISOString();
    if (appointmentData.durationMinutes)
      dbAppointmentData.duration_minutes = appointmentData.durationMinutes;
    if (appointmentData.appointmentType)
      dbAppointmentData.appointment_type = appointmentData.appointmentType;
    if (appointmentData.status)
      dbAppointmentData.status = appointmentData.status;
    if (appointmentData.notes !== undefined)
      dbAppointmentData.notes = appointmentData.notes;

    const { data, error } = await supabase
      .from("appointments")
      .update(dbAppointmentData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update appointment: ${error.message}`);
    }

    return transformAppointment(data);
  },

  updateStatus: async (
    id: string,
    status: Appointment["status"]
  ): Promise<Appointment> => {
    const { data, error } = await supabase
      .from("appointments")
      .update({ status })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update appointment status: ${error.message}`);
    }

    return transformAppointment(data);
  },
};

// Providers API
export const providersApi = {
  getAll: async (): Promise<Provider[]> => {
    const { data, error } = await supabase
      .from("providers")
      .select("*")
      .eq("is_active", true)
      .order("first_name", { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch providers: ${error.message}`);
    }

    return (data || []).map(transformProvider);
  },
};

// Procedures API
export const proceduresApi = {
  getAll: async (): Promise<Procedure[]> => {
    const { data, error } = await supabase
      .from("procedures")
      .select("*")
      .eq("is_active", true)
      .order("category", { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch procedures: ${error.message}`);
    }

    return (data || []).map(transformProcedure);
  },
};
