'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { AppLayout } from '@/components/layout/app-layout'
import { patientsApi } from '@/lib/api'
import { Patient } from '@/types'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Calendar, Mail, MapPin, Phone, User, AlertCircle } from 'lucide-react'

export default function PatientDetailPage() {
  const params = useParams()
  const patientId = params.id as string
  const t = useTranslations('patients')
  const tCommon = useTranslations('common')
  const [patient, setPatient] = useState<Patient | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPatient = async () => {
      try {
        setIsLoading(true)
        const patientData = await patientsApi.getById(patientId)
        setPatient(patientData)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido')
      } finally {
        setIsLoading(false)
      }
    }

    if (patientId) {
      fetchPatient()
    }
  }, [patientId])

  if (isLoading) {
    return (
      <ProtectedRoute>
        <AppLayout>
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-muted-foreground">{tCommon('loading')}</p>
            </div>
          </div>
        </AppLayout>
      </ProtectedRoute>
    )
  }

  if (error || !patient) {
    return (
      <ProtectedRoute>
        <AppLayout>
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-foreground mb-2">
                {error ? 'Error al cargar paciente' : t('patientNotFound')}
              </h2>
              <p className="text-muted-foreground mb-4">
                {error || t('patientNotFoundDescription')}
              </p>
              <Button onClick={() => window.history.back()}>{t('back')}</Button>
            </div>
          </div>
        </AppLayout>
      </ProtectedRoute>
    )
  }

  // At this point, patient is guaranteed to be non-null
  const person = patient.person!

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                {patient.displayName}
              </h1>
              <p className="text-muted-foreground mt-1">
                ID: {person.nationalId} • {patient.age} años
              </p>
            </div>
            <div className="flex space-x-3">
              <Button variant="outline">
                <Calendar className="h-4 w-4 mr-2" />
                {t('patients.newAppointment')}
              </Button>
              <Button variant="outline">{t('patients.edit')}</Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Personal Information */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <User className="h-5 w-5 mr-2" />
                    {t('patients.personalInformation')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        {t('patients.fullName')}
                      </label>
                      <p className="text-foreground">
                        {person.firstName} {person.lastName}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        {t('patients.dateOfBirth')}
                      </label>
                      <p className="text-foreground">
                        {person.dateOfBirth.toLocaleDateString('es-MX')}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        {t('patients.gender')}
                      </label>
                      <p className="text-foreground">
                        {person.sex === 'F' ? 'Femenino' : 'Masculino'}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        {t('patients.country')}
                      </label>
                      <p className="text-foreground">{person.country}</p>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    {person.phone && (
                      <div className="flex items-center">
                        <Phone className="h-4 w-4 text-muted-foreground mr-2" />
                        <span className="text-foreground">{person.phone}</span>
                      </div>
                    )}
                    {person.email && (
                      <div className="flex items-center">
                        <Mail className="h-4 w-4 text-muted-foreground mr-2" />
                        <span className="text-foreground">{person.email}</span>
                      </div>
                    )}
                    {person.address && (
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 text-muted-foreground mr-2" />
                        <span className="text-foreground">
                          {person.address}
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Medical Information */}
              {(patient.medicalHistory || patient.allergies) && (
                <Card>
                  <CardHeader>
                    <CardTitle>{t('patients.medicalInformation')}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {patient.medicalHistory && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          {t('patients.medicalHistory')}
                        </label>
                        <p className="text-foreground mt-1">
                          {patient.medicalHistory}
                        </p>
                      </div>
                    )}
                    {patient.allergies && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          {t('patients.allergies')}
                        </label>
                        <p className="text-foreground mt-1">
                          {patient.allergies}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Emergency Contact */}
              {(patient.emergencyContactName ||
                patient.emergencyContactPhone) && (
                <Card>
                  <CardHeader>
                    <CardTitle>{t('patients.emergencyContact')}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {patient.emergencyContactName && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          {t('patients.name')}
                        </label>
                        <p className="text-foreground">
                          {patient.emergencyContactName}
                        </p>
                      </div>
                    )}
                    {patient.emergencyContactPhone && (
                      <div className="flex items-center">
                        <Phone className="h-4 w-4 text-muted-foreground mr-2" />
                        <span className="text-foreground">
                          {patient.emergencyContactPhone}
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>{t('patients.patientStatus')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Badge variant="secondary" className="w-full justify-center">
                    {t('patients.active')}
                  </Badge>
                  <div className="text-center text-sm text-muted-foreground">
                    {t('patients.registered')}:{' '}
                    {patient.createdAt
                      ? new Date(patient.createdAt).toLocaleDateString('es-MX')
                      : 'N/A'}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{t('patients.quickActions')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button variant="outline" className="w-full" size="sm">
                    <Calendar className="h-4 w-4 mr-2" />
                    {t('patients.newAppointment')}
                  </Button>
                  <Button variant="outline" className="w-full" size="sm">
                    Nuevo Tratamiento
                  </Button>
                  <Button variant="outline" className="w-full" size="sm">
                    Ver Historial
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </AppLayout>
    </ProtectedRoute>
  )
}
