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
          <div>Error: {error.message}</div>
        </AppLayout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <AppLayout>
        <div>
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">
              {t('patients')}
            </h1>
            <Button onClick={() => setIsNewPatientModalOpen(true)}>
              {t('newPatient')}
            </Button>
          </div>

          <div className="mb-4">
            <input
              type="text"
              placeholder={t('search')}
              className="w-full p-2 border border-gray-300 rounded"
            />
          </div>

          <div className="bg-white border border-gray-200 rounded-lg">
            <div className="px-6 py-3 border-b border-gray-200 bg-gray-50">
              <div className="grid grid-cols-4 gap-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <div>{t('firstName')}</div>
                <div>{t('phone')}</div>
                <div>{t('email')}</div>
                <div>Última Cita</div>
              </div>
            </div>

            <div className="divide-y divide-gray-200">
              {patients?.map(patient => (
                <Link key={patient.id} href={`/patients/${patient.id}`}>
                  <div className="px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors">
                    <div className="grid grid-cols-4 gap-4">
                      <div>
                        <p className="font-medium text-gray-900">
                          {patient.displayName}
                        </p>
                        <p className="text-sm text-gray-500">
                          {patient.age} años
                        </p>
                      </div>
                      <div className="text-sm text-gray-900">
                        {patient.person?.phone}
                      </div>
                      <div className="text-sm text-gray-900">
                        {patient.person?.email}
                      </div>
                      <div className="text-sm text-gray-500">-</div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {patients?.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No hay pacientes registrados</p>
            </div>
          )}

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
