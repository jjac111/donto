'use client'

import { ProtectedRoute } from '@/components/auth/protected-route'
import { AppLayout } from '@/components/layout/app-layout'

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <AppLayout>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h2 className="text-lg font-medium text-gray-900 mb-2">
                Citas de Hoy
              </h2>
              <p className="text-3xl font-bold text-blue-600">12</p>
              <p className="text-sm text-gray-500">3 pendientes</p>
            </div>

            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h2 className="text-lg font-medium text-gray-900 mb-2">
                Pacientes Nuevos
              </h2>
              <p className="text-3xl font-bold text-green-600">4</p>
              <p className="text-sm text-gray-500">Esta semana</p>
            </div>

            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h2 className="text-lg font-medium text-gray-900 mb-2">
                Tratamientos Activos
              </h2>
              <p className="text-3xl font-bold text-purple-600">27</p>
              <p className="text-sm text-gray-500">En progreso</p>
            </div>
          </div>

          <div className="mt-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Próximas Citas
            </h2>
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="p-4 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium text-gray-900">María González</p>
                    <p className="text-sm text-gray-500">Limpieza dental</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">10:30</p>
                    <p className="text-sm text-gray-500">Dr. García</p>
                  </div>
                </div>
              </div>
              <div className="p-4 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium text-gray-900">
                      Carlos Rodríguez
                    </p>
                    <p className="text-sm text-gray-500">Empaste</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">11:15</p>
                    <p className="text-sm text-gray-500">Dr. García</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </AppLayout>
    </ProtectedRoute>
  )
}
