'use client'

import React, { useState, useEffect, useMemo, useRef } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslations } from 'next-intl'
import { Loader2, X, Plus, Edit2, Check, X as XIcon } from 'lucide-react'

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
import { Toggle } from '@/components/ui/toggle'
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
import { Tooth } from './odontogram/tooth'

interface DiagnosisFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  toothNumber: string | null
  existingConditions?: any[] // Will be typed later
  existingToothData?: {
    isPresent?: boolean
    isTreated?: boolean
    requiresExtraction?: boolean
    generalNotes?: string
  }
  onSave: (data: DiagnosisFormData) => Promise<void>
  isLoading?: boolean
}

const diagnosisSchema = (t: (key: string) => string) =>
  z.object({
    conditions: z.array(
      z.object({
        conditionId: z.string().min(1, t('condition') + ' ' + t('required')),
        surfaces: z.array(z.enum(['M', 'D', 'B', 'L', 'O'])), // Removed mandatory validation
        notes: z.string().optional(),
        selectedCategory: z.string().optional(),
      })
    ),
    isPresent: z.boolean(),
    isTreated: z.boolean(),
    requiresExtraction: z.boolean(),
    generalNotes: z.string().optional(),
  })

type DiagnosisFormValues = z.infer<ReturnType<typeof diagnosisSchema>>

export function DiagnosisForm({
  open,
  onOpenChange,
  toothNumber,
  existingConditions = [],
  existingToothData,
  onSave,
  isLoading = false,
}: DiagnosisFormProps) {
  const t = useTranslations('diagnosis')
  const tCategories = useTranslations('categories')
  const tConditions = useTranslations('conditions')
  const tSurfaces = useTranslations('surfaces')

  const isInitializingRef = useRef(false)
  const preventFocusRef = useRef(false)
  const [editingConditions, setEditingConditions] = useState<Set<number>>(
    new Set()
  )
  const [isExistingData, setIsExistingData] = useState(false)
  const [newlyAddedConditions, setNewlyAddedConditions] = useState<Set<number>>(
    new Set()
  )

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
      isPresent: true,
      isTreated: false,
      requiresExtraction: false,
      generalNotes: '',
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'conditions',
  })

  const onSubmit = async (data: DiagnosisFormValues) => {
    if (!toothNumber) return

    const diagnosisData: DiagnosisFormData = {
      toothNumber,
      conditions: data.conditions,
      isPresent: data.isPresent,
      isTreated: data.isTreated,
      requiresExtraction: data.requiresExtraction,
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
      // Don't interfere during form initialization
      if (isInitializingRef.current) {
        form.setValue(`conditions.${conditionIndex}.selectedCategory`, category)
        return
      }

      const currentConditionId = form.getValues(
        `conditions.${conditionIndex}.conditionId`
      )
      const currentCategory = form.getValues(
        `conditions.${conditionIndex}.selectedCategory`
      )

      // Only clear condition if it's a user-initiated change
      // Check if the category is actually changing from a non-empty value
      if (
        currentConditionId &&
        currentCategory &&
        currentCategory !== category
      ) {
        form.setValue(`conditions.${conditionIndex}.conditionId`, '')
      }

      form.setValue(`conditions.${conditionIndex}.selectedCategory`, category)
    },
    [form]
  )

  // Load existing conditions when dialog opens
  useEffect(() => {
    if (open && toothNumber) {
      isInitializingRef.current = true

      if (existingConditions.length > 0) {
        // Convert to array while preserving order
        const conditionsArray = existingConditions.map(condition => {
          // Inline the getConditionById logic to avoid dependency issues
          let conditionData: any = undefined
          for (const category of Object.values(dentalConditions)) {
            const found = category.find(
              (c: any) => c.id === condition.condition_type
            )
            if (found) {
              conditionData = found
              break
            }
          }

          return {
            conditionId: condition.condition_type,
            surfaces:
              condition.surfaces ||
              (condition.surface ? [condition.surface] : []),
            notes: condition.notes || '',
            selectedCategory: conditionData?.category || '',
          }
        })

        // Reset form with existing values
        form.reset({
          conditions: conditionsArray,
          isPresent: existingToothData?.isPresent ?? true,
          isTreated: existingToothData?.isTreated ?? false,
          requiresExtraction: existingToothData?.requiresExtraction ?? false,
          generalNotes: existingToothData?.generalNotes || '',
        })

        // Mark as existing data and clear editing state
        setIsExistingData(true)
        setEditingConditions(new Set())
        setNewlyAddedConditions(new Set())
      } else {
        // No existing conditions - start with empty conditions array
        form.reset({
          conditions: [],
          isPresent: existingToothData?.isPresent ?? true,
          isTreated: existingToothData?.isTreated ?? false,
          requiresExtraction: existingToothData?.requiresExtraction ?? false,
          generalNotes: '',
        })

        // Mark as new data
        setIsExistingData(false)
        setEditingConditions(new Set())
        setNewlyAddedConditions(new Set())
      }

      // Clear initialization flag after a short delay to allow form to settle
      setTimeout(() => {
        isInitializingRef.current = false
      }, 100)
    }
  }, [
    open,
    toothNumber,
    existingConditions,
    existingToothData,
    dentalConditions,
    form,
  ])

  const addCondition = () => {
    preventFocusRef.current = true
    const newIndex = fields.length
    append({
      conditionId: '',
      surfaces: [],
      notes: '',
      selectedCategory: '',
    })
    // Mark this condition as newly added
    setNewlyAddedConditions(prev => new Set(prev).add(newIndex))
    // Reset the flag after a short delay
    setTimeout(() => {
      preventFocusRef.current = false
    }, 100)
  }

  const removeCondition = (index: number) => {
    remove(index)
    // Clean up tracking for removed conditions
    setNewlyAddedConditions(prev => {
      const newSet = new Set(prev)
      newSet.delete(index)
      // Adjust indices for conditions after the removed one
      const adjustedSet = new Set<number>()
      newSet.forEach(idx => {
        if (idx > index) {
          adjustedSet.add(idx - 1)
        } else if (idx < index) {
          adjustedSet.add(idx)
        }
      })
      return adjustedSet
    })
    setEditingConditions(prev => {
      const newSet = new Set(prev)
      newSet.delete(index)
      // Adjust indices for conditions after the removed one
      const adjustedSet = new Set<number>()
      newSet.forEach(idx => {
        if (idx > index) {
          adjustedSet.add(idx - 1)
        } else if (idx < index) {
          adjustedSet.add(idx)
        }
      })
      return adjustedSet
    })
  }

  const startEditingCondition = (index: number) => {
    setEditingConditions(prev => new Set(prev).add(index))
  }

  const cancelEditingCondition = (index: number) => {
    setEditingConditions(prev => {
      const newSet = new Set(prev)
      newSet.delete(index)
      return newSet
    })
  }

  const finishEditingCondition = (index: number) => {
    setEditingConditions(prev => {
      const newSet = new Set(prev)
      newSet.delete(index)
      return newSet
    })
  }

  // Helper function to determine if a condition should be read-only
  const isConditionReadOnly = (conditionIndex: number) => {
    // If it's newly added, it should be editable
    if (newlyAddedConditions.has(conditionIndex)) {
      return false
    }
    // If it's existing data and not being edited, it should be read-only
    if (isExistingData && !editingConditions.has(conditionIndex)) {
      return true
    }
    // Otherwise, it should be editable
    return false
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

  // Helper to determine jaw and side from tooth number
  const getToothOrientation = (toothNum: string) => {
    const num = parseInt(toothNum)
    if (num >= 11 && num <= 18)
      return { jaw: 'upper' as const, side: 'left' as const }
    if (num >= 21 && num <= 28)
      return { jaw: 'upper' as const, side: 'right' as const }
    if (num >= 31 && num <= 38)
      return { jaw: 'lower' as const, side: 'left' as const }
    if (num >= 41 && num <= 48)
      return { jaw: 'lower' as const, side: 'right' as const }
    // Default fallback
    return { jaw: 'upper' as const, side: 'right' as const }
  }

  if (!toothNumber) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        blurOnly
        className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto overflow-x-hidden rounded-lg p-4 sm:p-6 w-[calc(100vw-2rem)] sm:w-[calc(100vw-3rem)] lg:w-full transition-all duration-300 ease-in-out data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
      >
        <DialogHeader>
          <DialogTitle>
            {t('diagnosisForTooth')} {toothNumber}
          </DialogTitle>
          <DialogDescription>
            {t('selectConditionsForSurfaces')}
          </DialogDescription>
        </DialogHeader>

        {/* Tooth Visualization */}
        <div className="flex justify-center py-8">
          <div className="scale-[2] my-6 origin-center h-24 w-24 flex items-center justify-center">
            <Tooth
              tooth={{
                number: toothNumber!,
                isPresent: form.watch('isPresent'),
                hasTreatments: form.watch('isTreated'),
                conditions: form
                  .watch('conditions')
                  .map((condition, index) => ({
                    id: `temp-${index}`,
                    conditionType: condition.conditionId,
                    surfaces: condition.surfaces,
                    notes: condition.notes,
                    recordedDate: new Date(),
                    recordedByProfileId: '',
                  }))
                  .filter(condition => condition.conditionType), // Only include conditions with IDs
              }}
              onClick={() => {}} // No-op since this is just for visualization
              isSelected={true}
              {...getToothOrientation(toothNumber!)}
            />
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Tooth Status */}
            <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
              <h4 className="text-sm font-medium text-foreground">
                {t('toothStatus')}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="isPresent"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                      <FormControl>
                        <Toggle
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          className={field.value ? 'bg-primary' : ''}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="text-sm font-medium">
                          {t('toothPresent')}
                        </FormLabel>
                      </div>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="isTreated"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                      <FormControl>
                        <Toggle
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          className={field.value ? 'bg-primary' : ''}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="text-sm font-medium">
                          {t('toothTreated')}
                        </FormLabel>
                      </div>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="requiresExtraction"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                      <FormControl>
                        <Toggle
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          className={field.value ? 'bg-destructive' : ''}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="text-sm font-medium">
                          {t('requiresExtraction')}
                        </FormLabel>
                      </div>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* General Notes */}
            <FormField
              control={form.control}
              name="generalNotes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">
                    {t('generalNotes')}
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t('generalNotesPlaceholder')}
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Conditions List */}
            <div className="conditions-list">
              <div className="flex items-center justify-between mb-4">
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

              <div className="space-y-4">
                {fields.map((fieldItem, conditionIndex) => (
                  <div
                    key={fieldItem.id}
                    className="condition-item p-4 border rounded-lg bg-muted/30"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h5 className="text-sm font-medium">
                        {t('condition')} {conditionIndex + 1}
                      </h5>
                      <div className="flex gap-2">
                        {isConditionReadOnly(conditionIndex) ? (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              startEditingCondition(conditionIndex)
                            }
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                        ) : isExistingData &&
                          editingConditions.has(conditionIndex) ? (
                          <>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                finishEditingCondition(conditionIndex)
                              }
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                cancelEditingCondition(conditionIndex)
                              }
                            >
                              <XIcon className="h-4 w-4" />
                            </Button>
                          </>
                        ) : (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeCondition(conditionIndex)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>

                    <div className="space-y-4">
                      {/* Category and Condition Row */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {/* Category Selection */}
                        <FormField
                          control={form.control}
                          name={`conditions.${conditionIndex}.selectedCategory`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t('category')}</FormLabel>
                              {isConditionReadOnly(conditionIndex) ? (
                                <div className="px-3 py-2 border rounded-md bg-muted text-sm">
                                  {field.value
                                    ? tCategories(field.value)
                                    : t('selectCategory')}
                                </div>
                              ) : (
                                <Select
                                  onValueChange={value =>
                                    handleCategoryChange(conditionIndex, value)
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
                              )}
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
                                {isConditionReadOnly(conditionIndex) ? (
                                  <div className="px-3 py-2 border rounded-md bg-muted text-sm">
                                    {field.value ? (
                                      <div className="flex items-center gap-2">
                                        {(() => {
                                          const condition =
                                            conditionsForCategory.find(
                                              c => c.id === field.value
                                            )
                                          return condition ? (
                                            <>
                                              <div
                                                className="w-3 h-3 rounded"
                                                style={{
                                                  backgroundColor:
                                                    condition.color,
                                                }}
                                              />
                                              <span>
                                                {tConditions(condition.name, {
                                                  defaultValue: condition.name,
                                                })}
                                              </span>
                                            </>
                                          ) : (
                                            field.value
                                          )
                                        })()}
                                      </div>
                                    ) : selectedCategory ? (
                                      t('selectCondition')
                                    ) : (
                                      t('selectCategoryFirst')
                                    )}
                                  </div>
                                ) : (
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
                                      {conditionsForCategory.map(condition => (
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
                                                defaultValue: condition.name,
                                              })}
                                            </span>
                                          </div>
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                )}
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
                            {isConditionReadOnly(conditionIndex) ? (
                              <div className="px-3 py-2 border rounded-md bg-muted text-sm min-h-[80px]">
                                {field.value || (
                                  <span className="text-muted-foreground">
                                    {t('surfaceNotesPlaceholder')}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <FormControl>
                                <Textarea
                                  placeholder={t('surfaceNotesPlaceholder')}
                                  className="min-h-[80px]"
                                  onFocus={e => {
                                    if (preventFocusRef.current) {
                                      e.target.blur()
                                    }
                                  }}
                                  {...field}
                                />
                              </FormControl>
                            )}
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
                      {isConditionReadOnly(conditionIndex) ? (
                        <div className="px-3 py-2 border rounded-md bg-muted text-sm">
                          {form.watch(`conditions.${conditionIndex}.surfaces`)
                            .length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {form
                                .watch(`conditions.${conditionIndex}.surfaces`)
                                .map(surface => (
                                  <span
                                    key={surface}
                                    className="px-2 py-1 bg-primary/10 text-primary rounded text-xs"
                                  >
                                    {tSurfaces(surface.toLowerCase())}
                                  </span>
                                ))}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">
                              {t('noSurfacesSelected')}
                            </span>
                          )}
                        </div>
                      ) : (
                        <>
                          {/* Mobile: Three rows */}
                          <div className="space-y-2 md:hidden">
                            {/* Mesial-Distal row */}
                            <div className="flex gap-2 justify-center">
                              {(['M', 'D'] as const).map(surface => {
                                const isSelected = form
                                  .watch(
                                    `conditions.${conditionIndex}.surfaces`
                                  )
                                  .includes(surface)

                                return (
                                  <button
                                    key={surface}
                                    type="button"
                                    className={`h-10 px-4 py-2 border rounded-md text-center text-sm transition-colors flex-1 max-w-[100px] md:h-9 md:max-w-[80px] ${
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
                              })}
                            </div>
                            {/* Buccal-Lingual row */}
                            <div className="flex gap-2 justify-center">
                              {(['B', 'L'] as const).map(surface => {
                                const isSelected = form
                                  .watch(
                                    `conditions.${conditionIndex}.surfaces`
                                  )
                                  .includes(surface)

                                return (
                                  <button
                                    key={surface}
                                    type="button"
                                    className={`h-10 px-4 py-2 border rounded-md text-center text-sm transition-colors flex-1 max-w-[100px] md:h-9 md:max-w-[80px] ${
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
                              })}
                            </div>
                            {/* Occlusal row */}
                            <div className="flex gap-2 justify-center">
                              {(['O'] as const).map(surface => {
                                const isSelected = form
                                  .watch(
                                    `conditions.${conditionIndex}.surfaces`
                                  )
                                  .includes(surface)

                                return (
                                  <button
                                    key={surface}
                                    type="button"
                                    className={`h-10 px-4 py-2 border rounded-md text-center text-sm transition-colors flex-1 max-w-[100px] md:h-9 md:max-w-[80px] ${
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
                              })}
                            </div>
                          </div>
                          {/* Desktop: Flat grid */}
                          <div className="hidden md:grid md:grid-cols-5 gap-2">
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
                                    className={`h-10 px-4 py-2 border rounded-md text-center text-sm transition-colors md:h-9 ${
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
                        </>
                      )}
                    </div>
                  </div>
                ))}

                {fields.length === 0 && (
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
            </div>

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
