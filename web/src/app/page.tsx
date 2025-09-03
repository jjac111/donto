'use client'

import { ProtectedRoute } from '@/components/auth/protected-route'
import { AppLayout } from '@/components/layout/app-layout'
import { redirect } from 'next/navigation'
import { useEffect } from 'react'

export default function Home() {
  useEffect(() => {
    redirect('/dashboard')
  }, [])

  return (
    <ProtectedRoute>
      <AppLayout>
        <div>Redirecting to dashboard...</div>
      </AppLayout>
    </ProtectedRoute>
  )
}
