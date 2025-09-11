'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/store'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

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

  // Clinic selection is now handled by individual pages

  // Show loading while hydrating or checking auth state
  if (!isHydrated || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <LoadingSpinner size="lg" className="mx-auto mb-4" />
          <p className="text-muted-foreground">{t('loading')}</p>
        </div>
      </div>
    )
  }

  // Show protected content if authenticated (clinic selection will be handled by the page itself)
  if (isAuthenticated) {
    return <>{children}</>
  }

  // Return null while redirects are happening
  return null
}
