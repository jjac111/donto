'use client'

import { ClinicSelection } from '@/components/auth/clinic-selection'
import { useAuthStore } from '@/store'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function SelectClinicPage() {
  const { isAuthenticated, needsClinicSelection } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    if (!isAuthenticated) router.replace('/login')
    if (isAuthenticated && !needsClinicSelection) router.replace('/dashboard')
  }, [isAuthenticated, needsClinicSelection, router])

  return <ClinicSelection />
}
