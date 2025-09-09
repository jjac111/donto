'use client'

import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslations } from 'next-intl'
import { Loader2, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import {
  DentalCondition,
  DentalConditionsData,
  DentalConditionCategory,
  DentalConditionSeverity,
  DiagnosisFormData,
  SURFACE_LABELS,
  CONDITION_CATEGORY_LABELS,
} from '@/types/dental-conditions'
import dentalConditionsData from '@/lib/dental-conditions.json'

interface DiagnosisFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  toothNumber: string | null
  existingConditions?: any[] // Will be typed later
  onSave: (data: DiagnosisFormData) => Promise<void>
  isLoading?: boolean
}

const diagnosisSchema = (t: (key: string) => string) =>
  z.object({
    surfaces: z.object({
      M: z.object({
        conditionId: z.string().optional(),
        notes: z.string().optional(),
      }),
      D: z.object({
        conditionId: z.string().optional(),
        notes: z.string().optional(),
      }),
      B: z.object({
        conditionId: z.string().optional(),
        notes: z.string().optional(),
      }),
      L: z.object({
        conditionId: z.string().optional(),
        notes: z.string().optional(),
      }),
      O: z.object({
        conditionId: z.string().optional(),
        notes: z.string().optional(),
      }),
    }),
    generalNotes: z.string().optional(),
  })

type DiagnosisFormValues = z.infer<ReturnType<typeof diagnosisSchema>>

export function DiagnosisForm({
  open,
  onOpenChange,
  toothNumber,
  existingConditions = [],
  onSave,
  isLoading = false,
}: DiagnosisFormProps) {
  const t = useTranslations('diagnosis')
  const [selectedSurface, setSelectedSurface] = useState<
    'M' | 'D' | 'B' | 'L' | 'O' | null
  >(null)

  // Transform JSON data to match TypeScript interface
  const dentalConditions: DentalConditionsData = Object.entries(
    dentalConditionsData
  ).reduce(
    (acc, [category, conditions]) => ({
      ...acc,
      [category]: conditions.map(condition => ({
        ...condition,
        category: category as DentalConditionCategory,
        severity: condition.severity as DentalConditionSeverity,
      })),
    }),
    {} as DentalConditionsData
  )

  const form = useForm<DiagnosisFormValues>({
    resolver: zodResolver(diagnosisSchema(t)),
    defaultValues: {
      surfaces: {
        M: { conditionId: undefined, notes: '' },
        D: { conditionId: undefined, notes: '' },
        B: { conditionId: undefined, notes: '' },
        L: { conditionId: undefined, notes: '' },
        O: { conditionId: undefined, notes: '' },
      },
      generalNotes: '',
    },
  })

  // Load existing conditions when dialog opens
  useEffect(() => {
    if (open && toothNumber && existingConditions.length > 0) {
      const existingValues: Partial<DiagnosisFormValues> = {
        surfaces: {
          M: { conditionId: undefined, notes: '' },
          D: { conditionId: undefined, notes: '' },
          B: { conditionId: undefined, notes: '' },
          L: { conditionId: undefined, notes: '' },
          O: { conditionId: undefined, notes: '' },
        },
        generalNotes: '',
      }

      // Populate form with existing conditions
      existingConditions.forEach((condition: any) => {
        if (
          existingValues.surfaces &&
          existingValues.surfaces[
            condition.surface as keyof typeof existingValues.surfaces
          ]
        ) {
          existingValues.surfaces[
            condition.surface as keyof typeof existingValues.surfaces
          ] = {
            conditionId: condition.condition_type,
            notes: condition.notes || '',
          }
        }
      })

      form.reset(existingValues)
    } else if (open) {
      // Reset form for new diagnosis
      form.reset({
        surfaces: {
          M: { conditionId: undefined, notes: '' },
          D: { conditionId: undefined, notes: '' },
          B: { conditionId: undefined, notes: '' },
          L: { conditionId: undefined, notes: '' },
          O: { conditionId: undefined, notes: '' },
        },
        generalNotes: '',
      })
    }
  }, [open, toothNumber, existingConditions, form])

  const onSubmit = async (data: DiagnosisFormValues) => {
    if (!toothNumber) return

    const diagnosisData: DiagnosisFormData = {
      toothNumber,
      surfaces: data.surfaces,
      generalNotes: data.generalNotes,
    }

    await onSave(diagnosisData)
    onOpenChange(false)
  }

  const getConditionById = (
    conditionId: string
  ): DentalCondition | undefined => {
    for (const category of Object.values(dentalConditions)) {
      const condition = category.find(c => c.id === conditionId)
      if (condition) return condition
    }
    return undefined
  }

  const getAllConditions = (): DentalCondition[] => {
    return Object.values(dentalConditions).flat()
  }

  if (!toothNumber) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {t('diagnosisForTooth')} {toothNumber}
          </DialogTitle>
          <DialogDescription>
            {t('selectConditionsForSurfaces')}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Surface selection grid */}
            <div className="surface-grid">
              <h4 className="text-sm font-medium text-foreground mb-3">
                {t('toothSurfaces')}
              </h4>
              <div className="grid grid-cols-3 gap-2 mb-4">
                {(['M', 'D', 'B', 'L', 'O'] as const).map(surface => {
                  const conditionId = form.watch(
                    `surfaces.${surface}.conditionId`
                  )
                  const condition = conditionId
                    ? getConditionById(conditionId)
                    : undefined

                  return (
                    <button
                      key={surface}
                      type="button"
                      className={`p-3 border rounded-lg text-center transition-colors ${
                        selectedSurface === surface
                          ? 'border-primary bg-primary/5'
                          : 'border-muted hover:border-primary/50'
                      }`}
                      onClick={() =>
                        setSelectedSurface(
                          selectedSurface === surface ? null : surface
                        )
                      }
                      style={{
                        backgroundColor: condition
                          ? `${condition.color}20`
                          : undefined,
                        borderColor: condition ? condition.color : undefined,
                      }}
                    >
                      <div className="text-sm font-medium">
                        {SURFACE_LABELS[surface]}
                      </div>
                      {condition && (
                        <div className="text-xs text-muted-foreground mt-1 truncate">
                          {condition.name}
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Selected surface details */}
            {selectedSurface && (
              <div className="surface-details p-4 bg-muted/30 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-medium">
                    {t('conditionFor')} {SURFACE_LABELS[selectedSurface]}
                  </h4>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedSurface(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name={`surfaces.${selectedSurface}.conditionId`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('condition')}</FormLabel>
                        <div className="flex gap-2">
                          <Select
                            onValueChange={field.onChange}
                            value={field.value || undefined}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue
                                  placeholder={t('selectCondition')}
                                />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {getAllConditions().map(condition => (
                                <SelectItem
                                  key={condition.id}
                                  value={condition.id}
                                >
                                  <div className="flex items-center gap-2">
                                    <div
                                      className="w-3 h-3 rounded"
                                      style={{
                                        backgroundColor: condition.color,
                                      }}
                                    />
                                    <span>{condition.name}</span>
                                    <span className="text-xs text-muted-foreground">
                                      (
                                      {
                                        CONDITION_CATEGORY_LABELS[
                                          condition.category
                                        ]
                                      }
                                      )
                                    </span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {field.value && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => field.onChange(undefined)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`surfaces.${selectedSurface}.notes`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('notes')}</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder={t('surfaceNotesPlaceholder')}
                            className="min-h-[80px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            )}

            <Separator />

            {/* General notes */}
            <FormField
              control={form.control}
              name="generalNotes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('generalNotes')}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t('generalNotesPlaceholder')}
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                {t('cancel')}
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('saving')}
                  </>
                ) : (
                  t('saveDiagnosis')
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
