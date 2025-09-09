'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { AppLayout } from '@/components/layout/app-layout'
import { Button } from '@/components/ui/button'
import { NewPatientForm } from '@/components/patients/new-patient-form'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Search, Plus } from 'lucide-react'
import { useRecentPatients } from '@/hooks/use-patients'

export default function PatientsPage() {
  const t = useTranslations('patients')
  const tCommon = useTranslations('common')
  const [isNewPatientModalOpen, setIsNewPatientModalOpen] = useState(false)

  // Use TanStack Query hook instead of manual state management
  const { data: patients, isLoading, error } = useRecentPatients(50)

  if (isLoading) {
    return (
      <ProtectedRoute>
        <AppLayout>
          <div className="flex items-center justify-center min-h-[200px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-muted-foreground">{tCommon('loading')}</p>
            </div>
          </div>
        </AppLayout>
      </ProtectedRoute>
    )
  }

  if (error) {
    return (
      <ProtectedRoute>
        <AppLayout>
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <p className="text-destructive mb-4">
                {error.message.includes('No clinic selected')
                  ? t('noClinicSelected')
                  : `${t('loadingError')}: ${error.message}`}
              </p>
              <p className="text-sm text-muted-foreground">
                Please select a clinic to view patients.
              </p>
            </div>
          </div>
        </AppLayout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                {t('patients')}
              </h1>
              <p className="text-muted-foreground mt-1">
                {t('patientsDescription')}
              </p>
            </div>
            <Button onClick={() => setIsNewPatientModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              {t('newPatient')}
            </Button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input type="text" placeholder={t('search')} className="pl-10" />
          </div>

          {/* Patients List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <span>{t('patients')}</span>
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  ({patients?.length || 0})
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {patients && patients.length > 0 ? (
                <div className="space-y-1">
                  {/* Header */}
                  <div className="grid grid-cols-4 gap-4 px-4 py-2 border-b text-sm font-medium text-muted-foreground">
                    <div>{t('firstName')}</div>
                    <div>{t('phone')}</div>
                    <div>{t('email')}</div>
                    <div>{t('lastAppointment')}</div>
                  </div>

                  {/* Patients */}
                  {patients.map(patient => (
                    <Link key={patient.id} href={`/patients/${patient.id}`}>
                      <div className="grid grid-cols-4 gap-4 px-4 py-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                        <div>
                          <p className="font-medium text-foreground">
                            {patient.displayName}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {patient.age} años
                          </p>
                        </div>
                        <div className="text-sm text-foreground">
                          {patient.person?.phone || '-'}
                        </div>
                        <div className="text-sm text-foreground">
                          {patient.person?.email || '-'}
                        </div>
                        <div className="text-sm text-muted-foreground">-</div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-muted-foreground">
                    <p className="text-lg font-medium mb-2">
                      {t('noPatientsFound')}
                    </p>
                    <p className="text-sm">{t('noPatientsFoundDescription')}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <NewPatientForm
            open={isNewPatientModalOpen}
            onOpenChange={setIsNewPatientModalOpen}
          />
        </div>
      </AppLayout>
    </ProtectedRoute>
  )
}
