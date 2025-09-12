'use client'

import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslations } from 'next-intl'
import { Loader2, Save, Check } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useClinic, useUpdateClinic } from '@/hooks/use-clinics'
import { useAuthStore } from '@/store/auth'
import countries from 'world-countries'
import {
  parsePhoneNumberWithError,
  isValidPhoneNumber,
} from 'libphonenumber-js'

// Helper function to get phone code for a country
const getPhoneCode = (countryCode: string): string => {
  const country = countries.find(c => c.cca3 === countryCode)
  if (!country || !country.idd?.root) return ''

  const root = country.idd.root
  const suffix = country.idd.suffixes?.[0] || ''
  return root + suffix
}

// Sort countries alphabetically by name for better UX
const sortedCountries = countries
  .filter(country => country.independent !== false) // Only independent countries
  .sort((a, b) => a.name.common.localeCompare(b.name.common))

// Helper function to clean phone number (remove non-digits and leading zeros)
const cleanPhoneNumber = (number: string): string => {
  return number.replace(/\D/g, '').replace(/^0+/, '')
}

// Helper function to validate phone number with country code
const validatePhoneNumber = (
  countryCode: string,
  phoneNumber: string
): boolean => {
  if (!countryCode || !phoneNumber) return true // Allow empty values

  try {
    const fullNumber = `${countryCode}${phoneNumber}`
    return isValidPhoneNumber(fullNumber)
  } catch (error) {
    return false
  }
}

const clinicSchema = (t: (key: string) => string) =>
  z
    .object({
      name: z.string().min(1, t('nameRequired')),
      address: z.string().optional(),
      country: z.string().min(1, t('countryRequired')),
      phoneCountryCode: z.string().optional(),
      phone: z.string().optional(),
      email: z.string().email(t('invalidEmail')).optional().or(z.literal('')),
    })
    .refine(
      data => {
        if (!data.phoneCountryCode || !data.phone) return true
        return validatePhoneNumber(data.phoneCountryCode, data.phone)
      },
      {
        message: t('invalidPhoneNumber'),
        path: ['phone'],
      }
    )

type ClinicFormValues = z.infer<ReturnType<typeof clinicSchema>>

export function ClinicSettingsForm() {
  const t = useTranslations('settings.clinic')
  const tCommon = useTranslations('common')
  const { clinicId } = useAuthStore()

  const [isSuccess, setIsSuccess] = useState(false)

  const {
    data: clinic,
    isLoading: isLoadingClinic,
    error,
  } = useClinic(clinicId || '')

  // Debug logging
  React.useEffect(() => {}, [clinic, clinicId, isLoadingClinic, error])
  const updateClinicMutation = useUpdateClinic()

  const form = useForm<ClinicFormValues>({
    resolver: zodResolver(clinicSchema(t)),
    defaultValues: {
      name: '',
      address: '',
      country: 'ECU',
      phoneCountryCode: '+593',
      phone: '',
      email: '',
    },
  })

  // Update form when clinic data loads
  React.useEffect(() => {
    if (clinic) {
      form.reset({
        name: clinic.name || '',
        address: clinic.address || '',
        country: clinic.country || 'ECU',
        phoneCountryCode: clinic.phoneCountryCode || '+593',
        phone: clinic.phone || '',
        email: clinic.email || '',
      })
    }
  }, [clinic, form])

  // Show loading state if no clinic data yet
  if (!clinic && !isLoadingClinic) {
    return (
      <div className="flex items-center justify-center py-8">
        <p className="text-muted-foreground">No clinic data available</p>
      </div>
    )
  }

  const onSubmit = async (data: ClinicFormValues) => {
    if (!clinicId) return

    try {
      await updateClinicMutation.mutateAsync({
        id: clinicId,
        data: {
          name: data.name,
          address: data.address || undefined,
          country: data.country,
          phoneCountryCode: data.phoneCountryCode || undefined,
          phone: data.phone ? cleanPhoneNumber(data.phone) : undefined,
          email: data.email || undefined,
        },
      })

      setIsSuccess(true)
      setTimeout(() => setIsSuccess(false), 3000)
    } catch (error) {
      console.error('Failed to update clinic:', error)
    }
  }

  if (isLoadingClinic) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="ml-2">{tCommon('loading')}</span>
      </div>
    )
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('name')}</FormLabel>
                <FormControl>
                  <Input placeholder={t('namePlaceholder')} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="country"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('country')}</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={t('selectCountry')} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="max-h-[300px]">
                    {sortedCountries.map(country => (
                      <SelectItem key={country.cca3} value={country.cca3}>
                        {country.name.common}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="phoneCountryCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('phoneCountryCode')}</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('selectCountryCode')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="max-h-[200px]">
                      {sortedCountries.map(country => {
                        const phoneCode = getPhoneCode(country.cca3)
                        return phoneCode ? (
                          <SelectItem key={country.cca3} value={phoneCode}>
                            {country.name.common} ({phoneCode})
                          </SelectItem>
                        ) : null
                      })}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('phone')}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t('phonePlaceholder')}
                      {...field}
                      onChange={e => {
                        // Only allow digits
                        const value = e.target.value.replace(/\D/g, '')
                        field.onChange(value)
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('email')}</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder={t('emailPlaceholder')}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>{t('address')}</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder={t('addressPlaceholder')}
                    rows={3}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={updateClinicMutation.isPending}
            className="min-w-[120px]"
          >
            {updateClinicMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                {t('saving')}
              </>
            ) : isSuccess ? (
              <>
                <Check className="h-4 w-4 mr-2" />
                {t('saved')}
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                {t('save')}
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  )
}
