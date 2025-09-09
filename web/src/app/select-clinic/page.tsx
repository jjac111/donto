'use client'

import { ClinicSelection } from '@/components/auth/clinic-selection'
import { ProtectedRoute } from '@/components/auth/protected-route'

export default function SelectClinicPage() {
  return (
    <ProtectedRoute>
      <ClinicSelection />
    </ProtectedRoute>
  )
}
