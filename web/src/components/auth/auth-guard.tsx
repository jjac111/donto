'use client'

import { useEffect } from 'react'
import { useAuthStore } from '@/store'
import { useRouter, usePathname } from 'next/navigation'

interface AuthGuardProps {
  children: React.ReactNode
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { isAuthenticated, needsClinicSelection, isLoading } = useAuthStore()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (isLoading) return // Wait for auth state to load

    // Define public routes that don't require authentication
    const publicRoutes = ['/login', '/select-clinic']
    const isPublicRoute = publicRoutes.includes(pathname)

    // If user is not authenticated and not on a public route, redirect to login
    if (!isAuthenticated && !isPublicRoute) {
      router.replace('/login')
      return
    }

    // If user is authenticated but needs clinic selection and not on select-clinic page
    if (
      isAuthenticated &&
      needsClinicSelection &&
      pathname !== '/select-clinic'
    ) {
      router.replace('/select-clinic')
      return
    }

    // If user is authenticated and has clinic selected, but on login/select-clinic pages, redirect to dashboard
    if (
      isAuthenticated &&
      !needsClinicSelection &&
      publicRoutes.includes(pathname)
    ) {
      router.replace('/dashboard')
      return
    }
  }, [isAuthenticated, needsClinicSelection, isLoading, router, pathname])

  // Show loading spinner while auth state is being determined
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
