'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { AppLayout } from '@/components/layout/app-layout'
import { DiagnosisSection } from '@/components/diagnosis/diagnosis-section'
import { PatientForm } from '@/components/patients/patient-form'
import { usePatient } from '@/hooks/use-patients'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import countries from 'world-countries'

// Helper function to get country name from code
const getCountryName = (countryCode: string): string => {
  const country = countries.find(c => c.cca3 === countryCode)
  return country ? country.name.common : countryCode
}

// Helper function to get phone code for a country
const getPhoneCode = (countryCode: string): string => {
  const country = countries.find(c => c.cca3 === countryCode)
  if (!country || !country.idd?.root) return ''
  const root = country.idd.root
  const suffix = country.idd.suffixes?.[0] || ''
  return root + suffix
}

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
import {
  Calendar,
  Mail,
  MapPin,
  Phone,
  User,
  AlertCircle,
  Edit,
} from 'lucide-react'

export default function PatientDetailPage() {
  const params = useParams()
  const patientId = params.id as string
  const t = useTranslations('patients')
  const tCommon = useTranslations('common')
  const [isEditFormOpen, setIsEditFormOpen] = useState(false)

  // Use TanStack Query hook instead of manual state management
  const { data: patient, isLoading, error } = usePatient(patientId)

  if (isLoading) {
    return (
      <ProtectedRoute>
        <AppLayout>
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <LoadingSpinner size="lg" className="mx-auto" />
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
                {error ? t('loadingError') : t('patientNotFound')}
              </h2>
              <p className="text-muted-foreground mb-4">
                {error?.message || t('patientNotFoundDescription')}
              </p>
              <Button onClick={() => window.history.back()}>
                {tCommon('back')}
              </Button>
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
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                {patient.displayName}
              </h1>
              <p className="text-muted-foreground mt-1">
                ID: {person.nationalId} • {patient.age} años
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => setIsEditFormOpen(true)}
              className="flex items-center gap-2 sm:self-start"
            >
              <Edit className="h-4 w-4" />
              {t('edit')}
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Personal Information */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <User className="h-5 w-5 mr-2" />
                    {t('personalInformation')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        {t('fullName')}
                      </label>
                      <p className="text-foreground">
                        {person.firstName} {person.lastName}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        {t('dateOfBirth')}
                      </label>
                      <p className="text-foreground">
                        {person.dateOfBirth.toLocaleDateString('es-MX')}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        {t('gender')}
                      </label>
                      <p className="text-foreground">
                        {person.sex === 'F' ? t('female') : t('male')}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        {t('country')}
                      </label>
                      <p className="text-foreground">
                        {getCountryName(person.country)}
                      </p>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    {person.phone && person.phoneCountryCode && (
                      <div className="flex items-center">
                        <Phone className="h-4 w-4 text-muted-foreground mr-2" />
                        <span className="text-foreground">
                          {person.phoneCountryCode} {person.phone}
                        </span>
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
                    <CardTitle>{t('medicalInformation')}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {patient.medicalHistory && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          {t('medicalHistory')}
                        </label>
                        <p className="text-foreground mt-1">
                          {patient.medicalHistory}
                        </p>
                      </div>
                    )}
                    {patient.allergies && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          {t('allergies')}
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
                    <CardTitle>{t('emergencyContact')}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {patient.emergencyContactName && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          {t('name')}
                        </label>
                        <p className="text-foreground">
                          {patient.emergencyContactName}
                        </p>
                      </div>
                    )}
                    {patient.emergencyContactPhone &&
                      patient.emergency_contact_phone_country_code && (
                        <div className="flex items-center">
                          <Phone className="h-4 w-4 text-muted-foreground mr-2" />
                          <span className="text-foreground">
                            {patient.emergency_contact_phone_country_code}{' '}
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
                  <CardTitle>{t('patientStatus')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Badge variant="secondary" className="w-full justify-center">
                    {t('active')}
                  </Badge>
                  <div className="text-center text-sm text-muted-foreground">
                    {t('registered')}:{' '}
                    {patient.createdAt
                      ? new Date(patient.createdAt).toLocaleDateString('es-MX')
                      : 'N/A'}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{t('quickActions')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    variant="outline"
                    className="w-full"
                    size="sm"
                    disabled
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    {t('newAppointment')}
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    size="sm"
                    disabled
                  >
                    {t('newTreatment')}
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    size="sm"
                    disabled
                  >
                    {t('viewHistory')}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Diagnosis Section - Full Width at Bottom */}

          <DiagnosisSection patientId={patientId} />
        </div>

        {/* Edit Patient Form */}
        <PatientForm
          open={isEditFormOpen}
          onOpenChange={setIsEditFormOpen}
          patient={patient}
          mode="edit"
          onSuccess={() => {
            // Patient data will be refreshed automatically by the mutation
          }}
        />
      </AppLayout>
    </ProtectedRoute>
  )
}
