'use client'

import { PatientForm } from './patient-form'

interface NewPatientFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function NewPatientForm({
  open,
  onOpenChange,
  onSuccess,
}: NewPatientFormProps) {
  return (
    <PatientForm
      open={open}
      onOpenChange={onOpenChange}
      onSuccess={onSuccess}
      mode="create"
    />
  )
}
