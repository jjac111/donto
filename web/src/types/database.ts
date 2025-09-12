// Raw database types - mirror the actual Supabase schema
// These should match exactly what comes from the database

export interface DbClinic {
  id: string
  name: string
  address: string | null
  phone: string | null
  email: string | null
  country: string
  phone_country_code: string
  created_at: string
  updated_at: string
}

export interface DbPerson {
  id: string
  clinic_id: string
  national_id: string
  country: string
  first_name: string
  last_name: string
  date_of_birth: string // Date string from database
  sex: string | null
  phone: string | null
  phone_country_code: string | null
  email: string | null
  address: string | null
  created_at: string
  updated_at: string
}

export interface DbProfile {
  id: string
  user_id: string
  clinic_id: string
  provider_id: string | null
  role: 'admin' | 'provider' | 'staff'
  is_active: boolean
  invited_by: string | null
  invited_at: string | null
  joined_at: string | null
  created_at: string
  updated_at: string
}

export interface DbUserSession {
  id: string
  user_id: string
  active_clinic_id: string
  session_token: string
  expires_at: string
  created_at: string
  updated_at: string
}

export interface DbProvider {
  id: string
  person_id: string
  clinic_id: string
  specialty: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface DbPatient {
  id: string
  person_id: string
  clinic_id: string
  medical_history: string | null
  allergies: string | null
  emergency_contact_name: string | null
  emergency_contact_phone: string | null
  emergency_contact_phone_country_code: string | null
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
  surfaces: ('M' | 'D' | 'B' | 'L' | 'O')[] // Array of surfaces: mesial, distal, buccal, lingual, occlusal
  condition_type: string
  notes: string | null
  recorded_date: string
  recorded_by_profile_id: string | null
  created_at: string
  updated_at: string
}
