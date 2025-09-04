'use client'

import { useTranslations } from 'next-intl'
import { usePatientSearch } from '@/hooks/use-patients'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { AppLayout } from '@/components/layout/app-layout'

export default function PatientsPage() {
  const t = useTranslations('patients')
  const tCommon = useTranslations('common')
  const { data: patients, isLoading, error } = usePatientSearch('')

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
            <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
              {t('newPatient')}
            </button>
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
                <div key={patient.id} className="px-6 py-4 hover:bg-gray-50">
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
              ))}
            </div>
          </div>

          {patients?.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No hay pacientes registrados</p>
            </div>
          )}
        </div>
      </AppLayout>
    </ProtectedRoute>
  )
}
