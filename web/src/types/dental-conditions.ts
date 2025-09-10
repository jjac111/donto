// Dental condition types and interfaces

export type DentalConditionCategory =
  | 'ortodoncia'
  | 'cirugia'
  | 'endodoncia'
  | 'general'
  | 'periodoncia'
  | 'protesis'
  | 'pediatria'
  | 'urgencias'

export type DentalConditionSeverity = 'bajo' | 'medio' | 'alto' | 'critico'

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

export interface ToothSurfaceCondition {
  surface: 'M' | 'D' | 'B' | 'L' | 'O' // Mesial, Distal, Buccal, Lingual, Occlusal
  condition?: DentalCondition
  notes?: string
  recordedDate: Date
  recordedByProfileId?: string
}

// Extended entity types for odontogram
export interface ToothWithConditions {
  number: string // FDI notation: "11", "21", etc.
  surfaces: ToothSurfaceCondition[]
  isPresent: boolean
  hasTreatments?: boolean
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
  generalNotes?: string
}

// Legacy form data structure (for backward compatibility during transition)
export interface LegacyDiagnosisFormData {
  toothNumber: string
  surfaces: {
    [surface in 'M' | 'D' | 'B' | 'L' | 'O']: {
      conditionId?: string
      notes?: string
    }
  }
  generalNotes?: string
}

// Category display names in Spanish
export const CONDITION_CATEGORY_LABELS: Record<
  DentalConditionCategory,
  string
> = {
  ortodoncia: 'Ortodoncia',
  cirugia: 'Cirugía',
  endodoncia: 'Endodoncia',
  general: 'General',
  periodoncia: 'Periodoncia',
  protesis: 'Prótesis',
  pediatria: 'Pediatría',
  urgencias: 'Urgencias',
}

// Severity display names in Spanish
export const CONDITION_SEVERITY_LABELS: Record<
  DentalConditionSeverity,
  string
> = {
  bajo: 'Bajo',
  medio: 'Medio',
  alto: 'Alto',
  critico: 'Crítico',
}

// Surface display names in Spanish
export const SURFACE_LABELS: Record<'M' | 'D' | 'B' | 'L' | 'O', string> = {
  M: 'Mesial',
  D: 'Distal',
  B: 'Buccal',
  L: 'Lingual',
  O: 'Oclusal',
}

// FDI tooth numbering quadrants
export const FDI_QUADRANTS = {
  upperRight: { range: [11, 18], label: 'Superior Derecha' },
  upperLeft: { range: [21, 28], label: 'Superior Izquierda' },
  lowerLeft: { range: [31, 38], label: 'Inferior Izquierda' },
  lowerRight: { range: [41, 48], label: 'Inferior Derecha' },
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
