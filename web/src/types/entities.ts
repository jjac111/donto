// Frontend entity types - optimized for UI consumption
// These are transformed from database types for better UX

export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  role: 'admin' | 'provider' | 'staff'
  clinicId: string
  displayName: string // computed: firstName + lastName
}

export interface UserSession {
  id: string
  userId: string
  activeClinicId: string
  sessionToken: string
  expiresAt: Date
}

export interface Profile {
  id: string
  userId: string
  clinicId: string
  providerId?: string
  role: 'admin' | 'provider' | 'staff'
  isActive: boolean
  invitedBy?: string
  invitedAt?: Date
  joinedAt?: Date
}

export interface Person {
  id: string
  clinicId: string
  nationalId: string
  country: string
  firstName: string
  lastName: string
  dateOfBirth: Date
  sex?: string
  phone?: string
  email?: string
  address?: string

  // Computed fields
  displayName: string // firstName + lastName
  age: number // calculated from dateOfBirth
  initials: string // first letters of first/last name
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
  personId: string
  clinicId: string
  specialty?: string
  isActive: boolean

  // Person data (populated via join)
  person?: Person

  // Computed fields (from person)
  displayName: string // person.firstName + person.lastName
}

export interface Patient {
  id: string
  personId: string
  clinicId: string
  medicalHistory?: string
  allergies?: string
  emergencyContactName?: string
  emergencyContactPhone?: string
  createdAt: string
  updatedAt: string

  // Person data (populated via join)
  person?: Person

  // Computed fields (from person)
  displayName: string // person.firstName + person.lastName
  age: number // calculated from person.dateOfBirth
  initials: string // first letters of person names
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
  surfaces: ('M' | 'D' | 'B' | 'L' | 'O')[] // Array of surfaces that this condition applies to
  conditionType: string
  notes?: string
  recordedDate: Date
  recordedByProfileId?: string

  // Related entities
  recordedByProfile?: Profile

  // Computed
  surfacesDisplay: string[] // full names: ["Mesial", "Distal", etc.]
  conditionColor: string // for odontogram styling
  appliesToAllSurfaces: boolean // true if condition applies to all surfaces (or none specified)
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
