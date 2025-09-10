'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslations } from 'next-intl'
import { Loader2, X, Plus } from 'lucide-react'

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
    conditions: z
      .array(
        z.object({
          conditionId: z.string().min(1, t('condition') + ' ' + t('required')),
          surfaces: z
            .array(z.enum(['M', 'D', 'B', 'L', 'O']))
            .min(1, t('surfaces') + ' ' + t('required')),
          notes: z.string().optional(),
          selectedCategory: z.string().optional(),
        })
      )
      .min(1, t('atLeastOneCondition')),
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
  const tCategories = useTranslations('categories')
  const tConditions = useTranslations('conditions')
  const tSurfaces = useTranslations('surfaces')

  // Transform JSON data to match TypeScript interface
  const dentalConditions: DentalConditionsData = useMemo(
    () =>
      Object.entries(dentalConditionsData).reduce(
        (acc, [category, conditions]) => ({
          ...acc,
          [category]: conditions.map(condition => ({
            ...condition,
            category: category as DentalConditionCategory,
            severity: condition.severity as DentalConditionSeverity,
          })),
        }),
        {} as DentalConditionsData
      ),
    []
  )

  const form = useForm<DiagnosisFormValues>({
    resolver: zodResolver(diagnosisSchema(t)),
    defaultValues: {
      conditions: [],
      generalNotes: '',
    },
  })

  const onSubmit = async (data: DiagnosisFormValues) => {
    if (!toothNumber) return

    const diagnosisData: DiagnosisFormData = {
      toothNumber,
      conditions: data.conditions,
      generalNotes: data.generalNotes,
    }

    await onSave(diagnosisData)
    onOpenChange(false)
  }

  const getConditionById = useMemo(
    () =>
      (conditionId: string): DentalCondition | undefined => {
        for (const category of Object.values(dentalConditions)) {
          const condition = category.find(c => c.id === conditionId)
          if (condition) return condition
        }
        return undefined
      },
    [dentalConditions]
  )

  const getAllConditions = useMemo((): DentalCondition[] => {
    return Object.values(dentalConditions).flat()
  }, [dentalConditions])

  const getConditionsForCategory = useMemo(
    () =>
      (category: string | undefined): DentalCondition[] => {
        return category ? dentalConditions[category] || [] : []
      },
    [dentalConditions]
  )

  const getAllCategories = useMemo((): DentalConditionCategory[] => {
    return Object.keys(dentalConditions) as DentalConditionCategory[]
  }, [dentalConditions])

  const handleCategoryChange = useMemo(
    () => (conditionIndex: number, category: string) => {
      // Clear the condition selection when category changes
      form.setValue(`conditions.${conditionIndex}.conditionId`, '')
      form.setValue(`conditions.${conditionIndex}.selectedCategory`, category)
    },
    [form]
  )

  // Load existing conditions when dialog opens
  useEffect(() => {
    if (open && toothNumber && existingConditions.length > 0) {
      // Group conditions by condition_type and collect surfaces
      const conditionsByType = existingConditions.reduce(
        (acc, condition: any) => {
          const key = condition.condition_type
          if (!acc[key]) {
            // Find the category for this condition
            const conditionData = getConditionById(condition.condition_type)
            const category = conditionData?.category || ''

            acc[key] = {
              conditionId: condition.condition_type,
              surfaces: [],
              notes: condition.notes || '',
              selectedCategory: category,
            }
          }
          // Add surfaces from this condition (handle both old single surface and new array format)
          if (condition.surfaces && Array.isArray(condition.surfaces)) {
            acc[key].surfaces.push(...condition.surfaces)
          } else if (condition.surface) {
            acc[key].surfaces.push(condition.surface)
          }
          return acc
        },
        {} as Record<
          string,
          {
            conditionId: string
            surfaces: string[]
            notes: string
            selectedCategory: string
          }
        >
      )

      // Extract general notes from first condition (they should be the same)
      const generalNotes = existingConditions[0]?.notes || ''

      const existingValues: Partial<DiagnosisFormValues> = {
        conditions: Object.values(conditionsByType),
        generalNotes,
      }

      form.reset(existingValues)
    } else if (open) {
      // Reset form for new diagnosis
      form.reset({
        conditions: [],
        generalNotes: '',
      })
    }
  }, [open, toothNumber, existingConditions, form, getConditionById])

  const addCondition = () => {
    const currentConditions = form.getValues('conditions')
    form.setValue('conditions', [
      ...currentConditions,
      {
        conditionId: '',
        surfaces: [],
        notes: '',
        selectedCategory: '', // Add selected category tracking
      },
    ])
  }

  const removeCondition = (index: number) => {
    const currentConditions = form.getValues('conditions')
    form.setValue(
      'conditions',
      currentConditions.filter((_, i) => i !== index)
    )
  }

  const toggleSurface = (
    conditionIndex: number,
    surface: 'M' | 'D' | 'B' | 'L' | 'O'
  ) => {
    const currentConditions = form.getValues('conditions')
    const condition = currentConditions[conditionIndex]
    const surfaces = condition.surfaces

    const newSurfaces = surfaces.includes(surface)
      ? surfaces.filter(s => s !== surface)
      : [...surfaces, surface]

    form.setValue(`conditions.${conditionIndex}.surfaces`, newSurfaces)
  }

  if (!toothNumber) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        blurOnly
        className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto overflow-x-hidden rounded-lg p-4 sm:p-6 w-[calc(100vw-2rem)] sm:w-[calc(100vw-3rem)] lg:w-full"
      >
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
            {/* Conditions List */}
            <div className="conditions-list">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-medium text-foreground">
                  {t('conditions')}
                </h4>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addCondition}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {t('addCondition')}
                </Button>
              </div>

              <FormField
                control={form.control}
                name="conditions"
                render={() => (
                  <div className="space-y-4">
                    {form.watch('conditions').map((_, conditionIndex) => (
                      <div
                        key={conditionIndex}
                        className="condition-item p-4 border rounded-lg bg-muted/30"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <h5 className="text-sm font-medium">
                            {t('condition')} {conditionIndex + 1}
                          </h5>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeCondition(conditionIndex)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="space-y-4">
                          {/* Category and Condition Row */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Category Selection */}
                            <FormField
                              control={form.control}
                              name={`conditions.${conditionIndex}.selectedCategory`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>{t('category')}</FormLabel>
                                  <Select
                                    onValueChange={value =>
                                      handleCategoryChange(
                                        conditionIndex,
                                        value
                                      )
                                    }
                                    value={field.value}
                                  >
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue
                                          placeholder={t('selectCategory')}
                                        />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {getAllCategories.map(category => (
                                        <SelectItem
                                          key={category}
                                          value={category}
                                        >
                                          {tCategories(category)}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            {/* Condition Selection */}
                            <FormField
                              control={form.control}
                              name={`conditions.${conditionIndex}.conditionId`}
                              render={({ field }) => {
                                const selectedCategory = form.watch(
                                  `conditions.${conditionIndex}.selectedCategory`
                                )
                                const conditionsForCategory =
                                  getConditionsForCategory(selectedCategory)

                                return (
                                  <FormItem>
                                    <FormLabel>{t('condition')}</FormLabel>
                                    <Select
                                      onValueChange={field.onChange}
                                      value={field.value}
                                      disabled={!selectedCategory}
                                    >
                                      <FormControl>
                                        <SelectTrigger>
                                          <SelectValue
                                            placeholder={
                                              selectedCategory
                                                ? t('selectCondition')
                                                : t('selectCategoryFirst')
                                            }
                                          />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        {conditionsForCategory.map(
                                          condition => (
                                            <SelectItem
                                              key={condition.id}
                                              value={condition.id}
                                            >
                                              <div className="flex items-center gap-2">
                                                <div
                                                  className="w-3 h-3 rounded"
                                                  style={{
                                                    backgroundColor:
                                                      condition.color,
                                                  }}
                                                />
                                                <span>
                                                  {tConditions(condition.name, {
                                                    defaultValue:
                                                      condition.name,
                                                  })}
                                                </span>
                                              </div>
                                            </SelectItem>
                                          )
                                        )}
                                      </SelectContent>
                                    </Select>
                                    <FormMessage />
                                  </FormItem>
                                )
                              }}
                            />
                          </div>

                          {/* Notes */}
                          <FormField
                            control={form.control}
                            name={`conditions.${conditionIndex}.notes`}
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

                        {/* Surface Selection */}
                        <div className="mt-4">
                          <FormLabel className="text-sm font-medium mb-2 block">
                            {t('toothSurfaces')}
                          </FormLabel>
                          <div className="grid grid-cols-5 gap-2">
                            {(['M', 'D', 'B', 'L', 'O'] as const).map(
                              surface => {
                                const isSelected = form
                                  .watch(
                                    `conditions.${conditionIndex}.surfaces`
                                  )
                                  .includes(surface)

                                return (
                                  <button
                                    key={surface}
                                    type="button"
                                    className={`p-2 border rounded text-center text-sm transition-colors ${
                                      isSelected
                                        ? 'border-primary bg-primary/10 text-primary'
                                        : 'border-muted hover:border-primary/50'
                                    }`}
                                    onClick={() =>
                                      toggleSurface(conditionIndex, surface)
                                    }
                                  >
                                    {tSurfaces(surface.toLowerCase())}
                                  </button>
                                )
                              }
                            )}
                          </div>
                          <FormField
                            control={form.control}
                            name={`conditions.${conditionIndex}.surfaces`}
                            render={() => <FormMessage />}
                          />
                        </div>
                      </div>
                    ))}

                    {form.watch('conditions').length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        <p>{t('noConditionsAdded')}</p>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="mt-2"
                          onClick={addCondition}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          {t('addFirstCondition')}
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              />
            </div>

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
