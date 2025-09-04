'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/store'
import { useTranslations } from 'next-intl'
import { LoginForm } from './login-form'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuthStore()
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

  // Show protected content if authenticated
  return <>{children}</>
}
