// Dental condition types and interfaces

export type DentalConditionCategory =
  | 'orthodontics'
  | 'surgery'
  | 'endodontics'
  | 'general'
  | 'periodontics'
  | 'prosthetics'
  | 'pediatrics'
  | 'emergencies'

export type DentalConditionSeverity = 'low' | 'medium' | 'high' | 'critical'

export interface DentalCondition {
  id: string
  category: DentalConditionCategory
  name: string
  description: string
  color: string
  severity: DentalConditionSeverity
}

export interface DentalConditionsData {
  [category: string]: DentalCondition[]
}

// Tooth condition entity (matches database structure)
export interface ToothCondition {
  id: string // Database ID
  conditionType: string // Maps to dental-conditions.json
  surfaces: ('M' | 'D' | 'B' | 'L' | 'O')[] // Surfaces this condition applies to
  notes?: string
  recordedDate: Date
  recordedByProfileId: string
}

// General condition entity (mouth-wide conditions)
export interface GeneralCondition {
  id: string // Database ID
  conditionType: string // Maps to dental-conditions.json
  notes?: string
  recordedDate: Date
  recordedByProfileId: string
}

// Extended entity types for odontogram (condition-centric)
export interface ToothWithConditions {
  number: string // FDI notation: "11", "21", etc.
  conditions: ToothCondition[]
  isPresent: boolean
  hasTreatments?: boolean
  requiresExtraction?: boolean
  generalNotes?: string
  lastUpdated?: Date
}

// Form data for diagnosis entry (new multi-surface approach)
export interface DiagnosisFormData {
  toothNumber: string
  conditions: {
    conditionId: string
    surfaces: ('M' | 'D' | 'B' | 'L' | 'O')[] // Array of surfaces this condition applies to
    notes?: string
  }[]
  isPresent?: boolean
  isTreated?: boolean
  requiresExtraction?: boolean
  generalNotes?: string
}

// Form data for general conditions (mouth-wide)
export interface GeneralConditionFormData {
  conditionId: string
  notes?: string
}

// General conditions data for a history
export interface GeneralConditionsData {
  conditions: GeneralCondition[]
  lastUpdated?: Date
}

// Category display names (i18n keys)
export const CONDITION_CATEGORY_LABELS: Record<
  DentalConditionCategory,
  string
> = {
  orthodontics: 'categories.orthodontics',
  surgery: 'categories.surgery',
  endodontics: 'categories.endodontics',
  general: 'categories.general',
  periodontics: 'categories.periodontics',
  prosthetics: 'categories.prosthetics',
  pediatrics: 'categories.pediatrics',
  emergencies: 'categories.emergencies',
}

// Severity display names (i18n keys)
export const CONDITION_SEVERITY_LABELS: Record<
  DentalConditionSeverity,
  string
> = {
  low: 'severity.low',
  medium: 'severity.medium',
  high: 'severity.high',
  critical: 'severity.critical',
}

// Surface display names (i18n keys)
export const SURFACE_LABELS: Record<'M' | 'D' | 'B' | 'L' | 'O', string> = {
  M: 'surfaces.mesial',
  D: 'surfaces.distal',
  B: 'surfaces.buccal',
  L: 'surfaces.lingual',
  O: 'surfaces.occlusal',
}

// FDI tooth numbering quadrants (i18n keys)
export const FDI_QUADRANTS = {
  upperRight: { range: [11, 18], label: 'quadrants.upperRight' },
  upperLeft: { range: [21, 28], label: 'quadrants.upperLeft' },
  lowerLeft: { range: [31, 38], label: 'quadrants.lowerLeft' },
  lowerRight: { range: [41, 48], label: 'quadrants.lowerRight' },
} as const

// Helper function to get all tooth numbers
export function getAllToothNumbers(): string[] {
  return [
    ...Array.from({ length: 8 }, (_, i) => (11 + i).toString()), // 11-18
    ...Array.from({ length: 8 }, (_, i) => (21 + i).toString()), // 21-28
    ...Array.from({ length: 8 }, (_, i) => (31 + i).toString()), // 31-38
    ...Array.from({ length: 8 }, (_, i) => (41 + i).toString()), // 41-48
  ]
}

// Helper function to get quadrant for tooth number
export function getToothQuadrant(
  toothNumber: string
): keyof typeof FDI_QUADRANTS | null {
  const num = parseInt(toothNumber)
  if (num >= 11 && num <= 18) return 'upperRight'
  if (num >= 21 && num <= 28) return 'upperLeft'
  if (num >= 31 && num <= 38) return 'lowerLeft'
  if (num >= 41 && num <= 48) return 'lowerRight'
  return null
}
