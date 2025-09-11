'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Loader2 } from 'lucide-react'

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
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useCreatePatient, useUpdatePatient } from '@/hooks/use-patients'
import { Patient } from '@/types'
import countries from 'world-countries'

// Helper function to get phone code for a country
const getPhoneCode = (countryCode: string): string => {
  const country = countries.find(c => c.cca3 === countryCode)
  if (!country || !country.idd?.root) return ''

  const root = country.idd.root
  const suffix = country.idd.suffixes?.[0] || ''
  return root + suffix
}

// Helper function to parse existing phone number
const parsePhoneNumber = (
  phone: string | undefined
): { countryCode: string; number: string } => {
  if (!phone) return { countryCode: '+593', number: '' }

  // Try to parse E.164 format or existing format
  const match = phone.match(/^(\+\d{1,3})(.*)$/)
  if (match) {
    return { countryCode: match[1], number: match[2].replace(/\D/g, '') }
  }

  return { countryCode: '+593', number: phone.replace(/\D/g, '') }
}

// Helper function to clean phone number (remove non-digits and trailing zeros)
const cleanPhoneNumber = (number: string): string => {
  return number.replace(/\D/g, '').replace(/^0+/, '')
}

// Sort countries alphabetically by name for better UX
const sortedCountries = countries
  .filter(country => country.independent !== false) // Only independent countries
  .sort((a, b) => a.name.common.localeCompare(b.name.common))

const patientSchema = (t: (key: string) => string) =>
  z.object({
    // Person fields
    nationalId: z.string().min(1, t('nationalIdRequired')),
    country: z.string().min(1, t('countryRequired')),
    firstName: z.string().min(1, t('firstNameRequired')),
    lastName: z.string().min(1, t('lastNameRequired')),
    dateOfBirth: z.string().min(1, t('dateOfBirthRequired')),
    sex: z.enum(['M', 'F'], {
      message: t('selectValidGender'),
    }),
    phoneCountryCode: z.string().optional(),
    phone: z.string().optional(),
    email: z.email(t('invalidEmail')).optional().or(z.literal('')),
    address: z.string().optional(),

    // Patient fields
    emergencyContactName: z.string().optional(),
    emergencyContactPhoneCountryCode: z.string().optional(),
    emergencyContactPhone: z.string().optional(),
    medicalHistory: z.string().optional(),
    allergies: z.string().optional(),
  })

interface PatientFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
  patient?: Patient | null
  mode?: 'create' | 'edit'
  title?: string
  description?: string
}

export function PatientForm({
  open,
  onOpenChange,
  onSuccess,
  patient,
  mode = 'create',
  title,
  description,
}: PatientFormProps) {
  const t = useTranslations('patients')
  const tCommon = useTranslations('common')
  const router = useRouter()

  // Use the appropriate mutation hook
  const createPatientMutation = useCreatePatient()
  const updatePatientMutation = useUpdatePatient()

  const parsedPhone = parsePhoneNumber(patient?.person?.phone)
  const parsedEmergencyPhone = parsePhoneNumber(patient?.emergencyContactPhone)

  const form = useForm({
    resolver: zodResolver(patientSchema(t)),
    defaultValues: {
      // Person fields
      nationalId: patient?.person?.nationalId || '',
      country: patient?.person?.country || 'ECU',
      firstName: patient?.person?.firstName || '',
      lastName: patient?.person?.lastName || '',
      dateOfBirth: patient?.person?.dateOfBirth
        ? patient.person.dateOfBirth.toISOString().split('T')[0]
        : '',
      sex: (patient?.person?.sex as 'M' | 'F') || 'F',
      phoneCountryCode: parsedPhone.countryCode,
      phone: parsedPhone.number,
      email: patient?.person?.email || '',
      address: patient?.person?.address || '',

      // Patient fields
      emergencyContactName: patient?.emergencyContactName || '',
      emergencyContactPhoneCountryCode: parsedEmergencyPhone.countryCode,
      emergencyContactPhone: parsedEmergencyPhone.number,
      medicalHistory: patient?.medicalHistory || '',
      allergies: patient?.allergies || '',
    },
  })

  const onSubmit = async (data: any) => {
    const patientData = {
      person: {
        nationalId: data.nationalId,
        country: data.country,
        firstName: data.firstName,
        lastName: data.lastName,
        dateOfBirth: new Date(data.dateOfBirth),
        sex: data.sex,
        phoneCountryCode: data.phoneCountryCode || undefined,
        phone: data.phone ? cleanPhoneNumber(data.phone) : undefined,
        email: data.email || undefined,
        address: data.address || undefined,
      } as any,
      emergencyContactName: data.emergencyContactName || undefined,
      emergencyContactPhoneCountryCode:
        data.emergencyContactPhoneCountryCode || undefined,
      emergencyContactPhone: data.emergencyContactPhone
        ? cleanPhoneNumber(data.emergencyContactPhone)
        : undefined,
      medicalHistory: data.medicalHistory || undefined,
      allergies: data.allergies || undefined,
    }

    if (mode === 'create') {
      createPatientMutation.mutate(patientData, {
        onSuccess: newPatient => {
          onOpenChange(false)
          form.reset()
          onSuccess?.()
          router.push(`/patients/${newPatient.id}`)
        },
      })
    } else if (mode === 'edit' && patient) {
      updatePatientMutation.mutate(
        {
          id: patient.id,
          patientData,
        },
        {
          onSuccess: updatedPatient => {
            onOpenChange(false)
            onSuccess?.()
            // Data will be automatically refetched by TanStack Query
          },
        }
      )
    }
  }

  const isSubmitting =
    createPatientMutation.isPending || updatePatientMutation.isPending

  const defaultTitle = mode === 'create' ? t('newPatient') : t('editPatient')
  const defaultDescription =
    mode === 'create' ? t('newPatientDescription') : t('editPatientDescription')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        blurOnly
        className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto overflow-x-hidden rounded-lg p-4 sm:p-6 w-[calc(100vw-2rem)] sm:w-[calc(100vw-3rem)] lg:w-full"
      >
        <DialogHeader>
          <DialogTitle>{title || defaultTitle}</DialogTitle>
          <DialogDescription>
            {description || defaultDescription}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Personal Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-foreground border-b pb-2">
                {t('personalInformation')}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="nationalId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('nationalId')}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t('nationalIdPlaceholder')}
                          className="w-full"
                          {...field}
                        />
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
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('firstName')}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t('firstNamePlaceholder')}
                          className="w-full"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('lastName')}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t('lastNamePlaceholder')}
                          className="w-full"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="dateOfBirth"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('dateOfBirth')}</FormLabel>
                      <FormControl>
                        <div className="w-full overflow-hidden">
                          <Input
                            type="date"
                            className="w-full max-w-full [&::-webkit-date-and-time-value]:text-xs [&::-webkit-calendar-picker-indicator]:text-xs"
                            style={{
                              WebkitAppearance: 'none',
                              MozAppearance: 'none',
                              appearance: 'none',
                              minWidth: '100%',
                              maxWidth: '100%',
                              boxSizing: 'border-box',
                              width: '100% !important',
                            }}
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="sex"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('sex')}</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t('selectGender')} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="F">Femenino</SelectItem>
                          <SelectItem value="M">Masculino</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      <FormLabel>{t('phoneNumber')}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t('phoneNumberPlaceholder')}
                          className="w-full"
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                          className="w-full"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('address')}</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder={t('addressPlaceholder')}
                        className="min-h-[80px] w-full"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Medical Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-foreground border-b pb-2">
                {t('medicalInformation')}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="emergencyContactName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('emergencyContactName')}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t('emergencyNamePlaceholder')}
                          className="w-full"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="emergencyContactPhoneCountryCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {t('emergencyContactPhoneCountryCode')}
                      </FormLabel>
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
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="emergencyContactPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('emergencyContactPhoneNumber')}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t('phoneNumberPlaceholder')}
                          className="w-full"
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
                name="medicalHistory"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('medicalHistory')}</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder={t('medicalHistoryPlaceholder')}
                        className="min-h-[100px] w-full"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="allergies"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('allergies')}</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder={t('allergiesPlaceholder')}
                        className="min-h-[80px] w-full"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                {t('cancel')}
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {tCommon('loading')}
                  </>
                ) : (
                  t('save')
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
