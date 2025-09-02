// Main types export - single import point for the entire app

// Database types (raw from Supabase)
export type * from './database'

// Entity types (UI-optimized)
export type * from './entities'

// Form types for validation
export interface LoginForm {
  email: string
  password: string
}

export interface PersonForm {
  nationalId: string
  country: string
  firstName: string
  lastName: string
  dateOfBirth: string // date input string
  sex?: string
  phone?: string
  email?: string
  address?: string
}

export interface PatientForm extends PersonForm {
  emergencyContactName?: string
  emergencyContactPhone?: string
  medicalHistory?: string
  allergies?: string
}

export interface ProviderForm extends PersonForm {
  specialty?: string
}

export interface AppointmentForm {
  patientId: string
  providerId: string
  appointmentDate: string // datetime-local input string
  durationMinutes: number
  appointmentType: string
  notes?: string
}

export interface TreatmentItemForm {
  procedureId: string
  toothNumber?: string
  toothSurfaces?: string[]
  priority: 'urgent' | 'recommended' | 'optional'
  customCost?: number
  providerNotes?: string
}

// API response types
export interface ApiResponse<T> {
  data: T | null
  error: string | null
  success: boolean
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}

// Common utility types
export interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

export interface TableColumn<T> {
  key: keyof T
  label: string
  sortable?: boolean
  render?: (value: any, item: T) => React.ReactNode
}

// State types
export interface LoadingState {
  isLoading: boolean
  error: string | null
}

export interface PaginationState {
  page: number
  pageSize: number
  total: number
}

export interface FilterState {
  search?: string
  status?: string
  dateFrom?: Date
  dateTo?: Date
  [key: string]: any
}
