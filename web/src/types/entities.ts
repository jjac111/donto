// Frontend entity types - optimized for UI consumption
// These are transformed from database types for better UX

export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  role: 'admin' // MVP: single role
  clinicId: string
  displayName: string // computed: firstName + lastName
}

export interface Clinic {
  id: string
  name: string
  address?: string
  phone?: string
  email?: string
}

export interface Provider {
  id: string
  clinicId: string
  firstName: string
  lastName: string
  email?: string
  phone?: string
  specialty?: string
  isActive: boolean
  displayName: string // computed: firstName + lastName
}

export interface Patient {
  id: string
  clinicId: string
  firstName: string
  lastName: string
  dateOfBirth: Date // parsed Date object
  sex?: string
  phone?: string
  email?: string
  address?: string
  emergencyContactName?: string
  emergencyContactPhone?: string
  medicalHistory?: string
  allergies?: string
  patientNumber?: string
  
  // Computed fields
  displayName: string // firstName + lastName
  age: number // calculated from dateOfBirth
  initials: string // first letters of first/last name
}

export interface PatientRepresentative {
  id: string
  patientId: string
  firstName: string
  lastName: string
  relationship: string
  phone?: string
  email?: string
  consentNotes?: string
  displayName: string // computed
}

export interface Appointment {
  id: string
  clinicId: string
  patientId: string
  providerId: string
  appointmentDate: Date // parsed Date object
  durationMinutes: number
  appointmentType: string
  status: 'scheduled' | 'completed' | 'cancelled' | 'no_show'
  notes?: string
  
  // Related entities (populated when needed)
  patient?: Patient
  provider?: Provider
  
  // Computed fields
  endTime: Date // appointmentDate + duration
  isToday: boolean
  isPast: boolean
  statusColor: string // for UI styling
}

export interface Procedure {
  id: string
  clinicId: string
  code?: string
  name: string
  description?: string
  defaultCost?: number
  estimatedDurationMinutes?: number
  category?: string
  isActive: boolean
  
  // Computed
  displayName: string // code + name or just name
}

export interface TreatmentPlan {
  id: string
  patientId: string
  providerId: string
  name?: string
  status: 'active' | 'completed' | 'cancelled'
  
  // Related entities
  patient?: Patient
  provider?: Provider
  items?: TreatmentItem[]
  
  // Computed
  totalItems: number
  completedItems: number
  progressPercentage: number
  estimatedTotalCost: number
}

export interface TreatmentItem {
  id: string
  treatmentPlanId: string
  procedureId: string
  toothNumber?: string
  toothSurfaces?: string[] // parsed from comma-separated string
  priority: 'urgent' | 'recommended' | 'optional'
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled'
  customCost?: number
  providerNotes?: string
  completedDate?: Date
  completedAppointmentId?: string
  
  // Related entities
  procedure?: Procedure
  
  // Computed
  finalCost: number // customCost || procedure.defaultCost
  priorityColor: string // for UI styling
  isCompleted: boolean
}

export interface ToothCondition {
  id: string
  patientId: string
  toothNumber: string
  surface: 'M' | 'D' | 'B' | 'L' | 'O'
  conditionType: string
  notes?: string
  recordedDate: Date
  recordedByProviderId?: string
  
  // Related entities
  recordedByProvider?: Provider
  
  // Computed
  surfaceDisplay: string // full name: "Mesial", "Distal", etc.
  conditionColor: string // for odontogram styling
}

// Odontogram-specific types
export interface ToothSurface {
  surface: 'M' | 'D' | 'B' | 'L' | 'O'
  condition?: ToothCondition
  isSelected?: boolean // for UI interaction
}

export interface Tooth {
  number: string // FDI notation: "11", "21", etc.
  surfaces: ToothSurface[]
  isPresent: boolean
  hasTreatments?: boolean // any treatment items reference this tooth
}
