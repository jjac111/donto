'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { AppLayout } from '@/components/layout/app-layout'
import { Button } from '@/components/ui/button'
import { NewPatientForm } from '@/components/patients/new-patient-form'

export default function DashboardPage() {
  const t = useTranslations()
  const [isNewPatientModalOpen, setIsNewPatientModalOpen] = useState(false)

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl font-bold text-foreground">
                {t('dashboard.welcome')}
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                {t('dashboard.welcomeDescription')}
              </p>
            </div>

            <Button
              variant="hero"
              size="lg"
              onClick={() => setIsNewPatientModalOpen(true)}
              className="mx-auto"
            >
              {t('patients.newPatient')}
            </Button>

            <div className="text-sm text-muted-foreground">
              <p>{t('dashboard.comingSoon')}</p>
            </div>
          </div>

          <NewPatientForm
            open={isNewPatientModalOpen}
            onOpenChange={setIsNewPatientModalOpen}
          />
        </div>
      </AppLayout>
    </ProtectedRoute>
  )
}
