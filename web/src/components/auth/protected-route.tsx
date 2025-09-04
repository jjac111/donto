'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/store'
import { useTranslations } from 'next-intl'
import { LoginForm } from './login-form'
import { ClinicSelection } from './clinic-selection'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, needsClinicSelection } = useAuthStore()
  const t = useTranslations('common')
  const [isHydrated, setIsHydrated] = useState(false)

  // Handle hydration to prevent SSR mismatch
  useEffect(() => {
    setIsHydrated(true)
  }, [])

  // Show loading while hydrating or checking auth state
  if (!isHydrated || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div>{t('loading')}</div>
      </div>
    )
  }

  // Show login form if not authenticated
  if (!isAuthenticated) {
    return <LoginForm />
  }

  // Show clinic selection if user needs to select a clinic
  if (needsClinicSelection) {
    return <ClinicSelection />
  }

  // Show protected content if authenticated and clinic selected
  return <>{children}</>
}
