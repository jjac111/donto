'use client'

import React, { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Plus, History } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Odontogram } from './odontogram'
import { DiagnosisForm } from './diagnosis-form'
import {
  usePatientToothConditions,
  useToothConditions,
  useSaveToothDiagnosis,
} from '@/hooks/use-tooth-conditions'
import {
  DiagnosisFormData,
  ToothWithConditions,
} from '@/types/dental-conditions'
import dentalConditionsData from '@/lib/dental-conditions.json'

interface DiagnosisSectionProps {
  patientId: string
}

export function DiagnosisSection({ patientId }: DiagnosisSectionProps) {
  const t = useTranslations('diagnosis')
  const [selectedTooth, setSelectedTooth] = useState<string | null>(null)
  const [diagnosisDialogOpen, setDiagnosisDialogOpen] = useState(false)

  // Fetch tooth conditions for the patient
  const {
    data: teeth = [],
    isLoading,
    error,
  } = usePatientToothConditions(patientId)

  // Fetch conditions for selected tooth
  const { data: selectedToothConditions = [] } = useToothConditions(
    patientId,
    selectedTooth || ''
  )

  // Get selected tooth data for status fields
  const selectedToothData = selectedTooth
    ? teeth.find(tooth => tooth.number === selectedTooth)
    : null

  // Save diagnosis mutation
  const saveDiagnosisMutation = useSaveToothDiagnosis()

  const handleToothClick = (toothNumber: string) => {
    setSelectedTooth(toothNumber)
    setDiagnosisDialogOpen(true)
  }

  const handleSaveDiagnosis = async (diagnosisData: DiagnosisFormData) => {
    await saveDiagnosisMutation.mutateAsync({
      patientId,
      diagnosisData,
    })
  }

  const handleCloseDiagnosisDialog = () => {
    setDiagnosisDialogOpen(false)
    setSelectedTooth(null)
  }

  // Calculate summary statistics
  const totalTeethWithConditions = teeth.filter(
    tooth => tooth.conditions.length > 0
  ).length

  // Helper function to get condition severity
  const getConditionSeverity = (conditionType: string): string => {
    for (const category of Object.values(dentalConditionsData)) {
      const conditionDetails = (category as any[]).find(
        c => c.id === conditionType
      )
      if (conditionDetails) {
        return conditionDetails.severity
      }
    }
    return 'low'
  }

  const urgentConditionsCount = teeth.filter(tooth =>
    tooth.conditions.some(condition =>
      ['critical', 'high'].includes(
        getConditionSeverity(condition.conditionType)
      )
    )
  ).length

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('diagnosis')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2 text-muted-foreground">{t('loading')}</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('diagnosis')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-red-600">{t('loadingError')}</p>
            <p className="text-sm text-muted-foreground mt-2">
              {error.message}
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                {t('diagnosis')}
                <Badge variant="secondary" className="ml-2">
                  {totalTeethWithConditions} {t('teethWithConditions')}
                </Badge>
                {urgentConditionsCount > 0 && (
                  <Badge variant="destructive" className="ml-1">
                    {urgentConditionsCount} {t('urgent')}
                  </Badge>
                )}
              </CardTitle>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled>
                <History className="h-4 w-4 mr-2" />
                {t('viewHistory')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedTooth(null)
                  setDiagnosisDialogOpen(true)
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                {t('newDiagnosis')}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Odontogram */}
          <div className="odontogram-container">
            <Odontogram
              teeth={teeth}
              onToothClick={handleToothClick}
              selectedTooth={selectedTooth || undefined}
            />
          </div>

          <Separator />

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {totalTeethWithConditions}
              </div>
              <div className="text-sm text-muted-foreground">
                {t('teethWithConditions')}
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {
                  teeth.filter(tooth =>
                    tooth.conditions.some(
                      condition =>
                        getConditionSeverity(condition.conditionType) ===
                        'medium'
                    )
                  ).length
                }
              </div>
              <div className="text-sm text-muted-foreground">
                {t('moderateConditions')}
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {urgentConditionsCount}
              </div>
              <div className="text-sm text-muted-foreground">
                {t('urgentConditions')}
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {32 - totalTeethWithConditions}
              </div>
              <div className="text-sm text-muted-foreground">
                {t('healthyTeeth')}
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="recent-activity">
            <h4 className="text-sm font-medium text-foreground mb-3">
              {t('recentActivity')}
            </h4>
            <div className="space-y-2">
              {teeth
                .filter(tooth => tooth.lastUpdated)
                .sort((a, b) => {
                  const aTime = a.lastUpdated?.getTime() || 0
                  const bTime = b.lastUpdated?.getTime() || 0
                  return bTime - aTime
                })
                .slice(0, 5)
                .map(tooth => (
                  <div
                    key={tooth.number}
                    className="flex items-center justify-between py-2 px-3 bg-muted/30 rounded"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Diente {tooth.number}</span>
                      <span className="text-sm text-muted-foreground">
                        {tooth.conditions.length} {t('conditions')}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {tooth.lastUpdated?.toLocaleDateString('es-MX')}
                    </span>
                  </div>
                ))}
              {teeth.filter(tooth => tooth.lastUpdated).length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  {t('noRecentActivity')}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Diagnosis Form Dialog */}
      <DiagnosisForm
        open={diagnosisDialogOpen}
        onOpenChange={handleCloseDiagnosisDialog}
        toothNumber={selectedTooth}
        existingConditions={selectedToothConditions}
        existingToothData={
          selectedToothData
            ? {
                isPresent: selectedToothData.isPresent,
                isTreated: selectedToothData.hasTreatments,
                requiresExtraction: selectedToothData.requiresExtraction,
                generalNotes: selectedToothData.generalNotes,
              }
            : undefined
        }
        onSave={handleSaveDiagnosis}
        isLoading={saveDiagnosisMutation.isPending}
      />
    </>
  )
}
