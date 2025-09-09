'use client'

import { useEffect } from 'react'
import { useAuthStore } from '@/store'
import { useRouter } from 'next/navigation'

export default function Home() {
  const { isAuthenticated, needsClinicSelection, isLoading } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    if (isLoading) return // Wait for auth state to load

    if (!isAuthenticated) {
      router.replace('/login')
    } else if (needsClinicSelection) {
      router.replace('/select-clinic')
    } else {
      router.replace('/dashboard')
    }
  }, [isAuthenticated, needsClinicSelection, isLoading, router])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-muted-foreground">Loading...</p>
      </div>
    </div>
  )
}
