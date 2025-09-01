// Raw database types - mirror the actual Supabase schema
// These should match exactly what comes from the database

export interface DbClinic {
  id: string
  name: string
  address: string | null
  phone: string | null
  email: string | null
  created_at: string
  updated_at: string
}

export interface DbProvider {
  id: string
  clinic_id: string
  first_name: string
  last_name: string
  email: string | null
  phone: string | null
  specialty: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface DbPatient {
  id: string
  clinic_id: string
  first_name: string
  last_name: string
  date_of_birth: string // Date string from database
  sex: string | null
  phone: string | null
  email: string | null
  address: string | null
  emergency_contact_name: string | null
  emergency_contact_phone: string | null
  medical_history: string | null
  allergies: string | null
  patient_number: string | null
  created_at: string
  updated_at: string
}

export interface DbPatientRepresentative {
  id: string
  patient_id: string
  first_name: string
  last_name: string
  relationship: string
  phone: string | null
  email: string | null
  consent_notes: string | null
  created_at: string
  updated_at: string
}

export interface DbAppointment {
  id: string
  clinic_id: string
  patient_id: string
  provider_id: string
  appointment_date: string // ISO timestamp string
  duration_minutes: number
  appointment_type: string
  status: 'scheduled' | 'completed' | 'cancelled' | 'no_show'
  notes: string | null
  created_at: string
  updated_at: string
}

export interface DbProcedure {
  id: string
  clinic_id: string
  code: string | null
  name: string
  description: string | null
  default_cost: number | null
  estimated_duration_minutes: number | null
  category: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface DbTreatmentPlan {
  id: string
  patient_id: string
  provider_id: string
  name: string | null
  status: 'active' | 'completed' | 'cancelled'
  created_at: string
  updated_at: string
}

export interface DbTreatmentItem {
  id: string
  treatment_plan_id: string
  procedure_id: string
  tooth_number: string | null
  tooth_surfaces: string | null
  priority: 'urgent' | 'recommended' | 'optional'
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled'
  custom_cost: number | null
  provider_notes: string | null
  completed_date: string | null
  completed_appointment_id: string | null
  created_at: string
  updated_at: string
}

export interface DbToothCondition {
  id: string
  patient_id: string
  tooth_number: string
  surface: 'M' | 'D' | 'B' | 'L' | 'O' // mesial, distal, buccal, lingual, occlusal
  condition_type: string
  notes: string | null
  recorded_date: string
  recorded_by_provider_id: string | null
  created_at: string
  updated_at: string
}
