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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Odontogram } from './odontogram'
import { DiagnosisForm } from './diagnosis-form'
import { GeneralConditions } from './general-conditions'
import {
  usePatientToothConditions,
  useToothConditions,
  useSaveToothDiagnosis,
  useToothDiagnosisHistories,
  useCreateToothDiagnosisHistory,
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
  const [selectedHistoryId, setSelectedHistoryId] = useState<string | null>(
    null
  )

  // Histories
  const { data: histories = [] } = useToothDiagnosisHistories(patientId)
  const createHistory = useCreateToothDiagnosisHistory()

  // Auto-select latest history on load
  React.useEffect(() => {
    if (histories.length > 0 && !selectedHistoryId) {
      setSelectedHistoryId(histories[0].id)
    }
  }, [histories, selectedHistoryId])

  // Fetch tooth conditions for the patient in selected history
  const {
    data: teeth = [],
    isLoading,
    error,
  } = usePatientToothConditions(patientId, selectedHistoryId || '')

  // Fetch conditions for selected tooth in selected history
  const { data: selectedToothConditions = [] } = useToothConditions(
    patientId,
    selectedTooth || '',
    selectedHistoryId || ''
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
    if (!selectedHistoryId) return
    await saveDiagnosisMutation.mutateAsync({
      patientId,
      historyId: selectedHistoryId,
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
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="flex flex-col sm:flex-row sm:items-center gap-2">
                <span>{t('diagnosis')}</span>
                <div className="flex gap-2">
                  <Badge variant="secondary">
                    {totalTeethWithConditions} {t('teethWithConditions')}
                  </Badge>
                  {urgentConditionsCount > 0 && (
                    <Badge variant="destructive">
                      {urgentConditionsCount} {t('urgent')}
                    </Badge>
                  )}
                </div>
              </CardTitle>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
              <Select
                value={selectedHistoryId || ''}
                onValueChange={value => setSelectedHistoryId(value || null)}
              >
                <SelectTrigger className="min-w-[140px] h-9">
                  <SelectValue placeholder={t('selectHistory')} />
                </SelectTrigger>
                <SelectContent>
                  {histories.map(h => (
                    <SelectItem key={h.id} value={h.id}>
                      {new Date(h.created_at).toLocaleDateString('es-MX')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (createHistory.isPending) return
                  createHistory.mutate(patientId, {
                    onSuccess: ({ id }) => setSelectedHistoryId(id),
                  })
                }}
              >
                <History className="h-4 w-4 mr-2" />
                {t('newDiagnosis')}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {selectedHistoryId ? (
            <>
              {/* Odontogram */}
              <div className="odontogram-container">
                <Odontogram
                  teeth={teeth}
                  onToothClick={handleToothClick}
                  selectedTooth={selectedTooth || undefined}
                />
              </div>

              {/* General Conditions */}
              <div className="general-conditions-container">
                <GeneralConditions
                  patientId={patientId}
                  historyId={selectedHistoryId}
                />
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">{t('selectHistory')}</h3>
              <p className="text-sm">{t('selectHistoryToViewDiagnosis')}</p>
            </div>
          )}

          {/* <Separator />

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
          </div> */}
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
