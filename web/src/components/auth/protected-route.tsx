'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/store'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, needsClinicSelection } = useAuthStore()
  const t = useTranslations('common')
  const [isHydrated, setIsHydrated] = useState(false)
  const router = useRouter()

  // Handle hydration to prevent SSR mismatch
  useEffect(() => {
    setIsHydrated(true)
  }, [])

  // Handle navigation redirects after render
  useEffect(() => {
    if (isHydrated && !isLoading && !isAuthenticated) {
      router.replace('/login')
    }
  }, [isHydrated, isLoading, isAuthenticated, router])

  useEffect(() => {
    if (isHydrated && !isLoading && isAuthenticated && needsClinicSelection) {
      router.replace('/select-clinic')
    }
  }, [isHydrated, isLoading, isAuthenticated, needsClinicSelection, router])

  // Show loading while hydrating or checking auth state
  if (!isHydrated || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div>{t('loading')}</div>
      </div>
    )
  }

  // Show protected content if authenticated and clinic selected
  if (isAuthenticated && !needsClinicSelection) {
    return <>{children}</>
  }

  // Return null while redirects are happening
  return null
}
