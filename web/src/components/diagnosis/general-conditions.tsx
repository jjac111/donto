'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslations } from 'next-intl'
import { Loader2, Plus, X, Save } from 'lucide-react'

import { Button } from '@/components/ui/button'
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
import {
  DentalCondition,
  DentalConditionsData,
  DentalConditionCategory,
  GeneralConditionFormData,
} from '@/types/dental-conditions'
import dentalConditionsData from '@/lib/dental-conditions.json'
import {
  useGeneralConditions,
  useSaveGeneralConditions,
} from '@/hooks/use-tooth-conditions'

interface GeneralConditionsProps {
  patientId: string
  historyId: string | null
}

const generalConditionsSchema = (t: (key: string) => string) =>
  z.object({
    conditions: z.array(
      z.object({
        conditionId: z.string().min(1, t('condition') + ' ' + t('required')),
        notes: z.string().optional(),
        selectedCategory: z.string().optional(),
      })
    ),
  })

type GeneralConditionsFormValues = z.infer<
  ReturnType<typeof generalConditionsSchema>
>

export function GeneralConditions({
  patientId,
  historyId,
}: GeneralConditionsProps) {
  const t = useTranslations('diagnosis')
  const tCategories = useTranslations('categories')
  const tConditions = useTranslations('conditions')

  // Transform JSON data to match TypeScript interface
  const dentalConditions: DentalConditionsData = useMemo(
    () =>
      Object.entries(dentalConditionsData).reduce(
        (acc, [category, conditions]) => ({
          ...acc,
          [category]: conditions.map(condition => ({
            ...condition,
            category: category as DentalConditionCategory,
            severity: condition.severity as any,
          })),
        }),
        {} as DentalConditionsData
      ),
    []
  )

  const form = useForm<GeneralConditionsFormValues>({
    resolver: zodResolver(generalConditionsSchema(t)),
    defaultValues: {
      conditions: [],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'conditions',
  })

  // Fetch existing general conditions
  const { data: generalConditionsData, isLoading } = useGeneralConditions(
    patientId,
    historyId || ''
  )

  // Save mutation
  const saveGeneralConditions = useSaveGeneralConditions()

  // Load existing conditions when data changes
  useEffect(() => {
    if (generalConditionsData?.conditions) {
      const conditionsArray = generalConditionsData.conditions.map(
        condition => {
          // Find the category for this condition
          let conditionData: any = undefined
          for (const category of Object.values(dentalConditions)) {
            const found = category.find(
              (c: any) => c.id === condition.conditionType
            )
            if (found) {
              conditionData = found
              break
            }
          }

          return {
            conditionId: condition.conditionType,
            notes: condition.notes || '',
            selectedCategory: conditionData?.category || '',
          }
        }
      )

      form.reset({ conditions: conditionsArray })
    }
  }, [generalConditionsData, dentalConditions, form])

  const getAllCategories = useMemo((): DentalConditionCategory[] => {
    return Object.keys(dentalConditions) as DentalConditionCategory[]
  }, [dentalConditions])

  const getConditionsForCategory = useMemo(
    () =>
      (category: string | undefined): DentalCondition[] => {
        return category ? dentalConditions[category] || [] : []
      },
    [dentalConditions]
  )

  const handleCategoryChange = (conditionIndex: number, category: string) => {
    const currentConditionId = form.getValues(
      `conditions.${conditionIndex}.conditionId`
    )
    const currentCategory = form.getValues(
      `conditions.${conditionIndex}.selectedCategory`
    )

    // Clear condition if category changes
    if (currentConditionId && currentCategory && currentCategory !== category) {
      form.setValue(`conditions.${conditionIndex}.conditionId`, '')
    }

    form.setValue(`conditions.${conditionIndex}.selectedCategory`, category)
  }

  const addCondition = () => {
    append({
      conditionId: '',
      notes: '',
      selectedCategory: '',
    })
  }

  const removeCondition = (index: number) => {
    remove(index)
  }

  const onSubmit = async (data: GeneralConditionsFormValues) => {
    if (!historyId) return

    const conditions: GeneralConditionFormData[] = data.conditions
      .filter(c => c.conditionId)
      .map(c => ({
        conditionId: c.conditionId,
        notes: c.notes || undefined,
      }))

    await saveGeneralConditions.mutateAsync({
      patientId,
      historyId,
      conditions,
    })
  }

  if (!historyId) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>{t('selectHistory')}</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div></div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addCondition}
        >
          <Plus className="h-4 w-4 mr-2" />
          {t('addGeneralCondition')}
        </Button>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-4">
            {fields.map((fieldItem, conditionIndex) => (
              <div
                key={fieldItem.id}
                className="p-4 border rounded-lg bg-muted/30"
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
                  {/* Desktop: All fields in one row, Mobile: stacked */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* Category Selection */}
                    <FormField
                      control={form.control}
                      name={`conditions.${conditionIndex}.selectedCategory`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('category')}</FormLabel>
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
                                <SelectItem key={category} value={category}>
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
                                {conditionsForCategory.map(condition => (
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
                            <FormMessage />
                          </FormItem>
                        )
                      }}
                    />

                    {/* Notes */}
                    <FormField
                      control={form.control}
                      name={`conditions.${conditionIndex}.notes`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('generalConditionNotes')}</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder={t(
                                'generalConditionNotesPlaceholder'
                              )}
                              className="min-h-[80px] lg:min-h-[40px]"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>
            ))}

            {fields.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <p>{t('noGeneralConditions')}</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={addCondition}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {t('addGeneralCondition')}
                </Button>
              </div>
            )}
          </div>

          {fields.length > 0 && (
            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={saveGeneralConditions.isPending || isLoading}
              >
                {saveGeneralConditions.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('saving')}
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    {t('saveGeneralConditions')}
                  </>
                )}
              </Button>
            </div>
          )}
        </form>
      </Form>
    </div>
  )
}
