'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { patientsApi } from '@/lib/api'
import { Patient } from '@/types'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { AppLayout } from '@/components/layout/app-layout'
import { Button } from '@/components/ui/button'
import { NewPatientForm } from '@/components/patients/new-patient-form'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Search, Plus } from 'lucide-react'

export default function PatientsPage() {
  const t = useTranslations('patients')
  const tCommon = useTranslations('common')
  const [patients, setPatients] = useState<Patient[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isNewPatientModalOpen, setIsNewPatientModalOpen] = useState(false)

  const fetchPatients = async () => {
    try {
      setIsLoading(true)
      // For now, just get recent patients - you can modify this to search
      const patientData = await patientsApi.getRecent(50)
      setPatients(patientData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchPatients()
  }, [])

  if (isLoading) {
    return (
      <ProtectedRoute>
        <AppLayout>
          <div>{tCommon('loading')}</div>
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
              <p className="text-destructive">
                {t('loadingError')}: {error}
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
              {patients?.length > 0 ? (
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
            onSuccess={fetchPatients}
          />
        </div>
      </AppLayout>
    </ProtectedRoute>
  )
}
