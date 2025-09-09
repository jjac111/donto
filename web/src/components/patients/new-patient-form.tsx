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
import { useCreatePatient } from '@/hooks/use-patients'

const newPatientSchema = (t: (key: string) => string) =>
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
    phone: z.string().optional(),
    email: z.email(t('invalidEmail')).optional().or(z.literal('')),
    address: z.string().optional(),

    // Patient fields
    emergencyContactName: z.string().optional(),
    emergencyContactPhone: z.string().optional(),
    medicalHistory: z.string().optional(),
    allergies: z.string().optional(),
  })

interface NewPatientFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function NewPatientForm({
  open,
  onOpenChange,
  onSuccess,
}: NewPatientFormProps) {
  const t = useTranslations('patients')
  const tCommon = useTranslations('common')
  const router = useRouter()

  // Use the mutation hook for creating patients
  const createPatientMutation = useCreatePatient()

  const form = useForm({
    resolver: zodResolver(newPatientSchema(t)),
    defaultValues: {
      // Person fields
      nationalId: '',
      country: 'EC', // Default to Ecuador
      firstName: '',
      lastName: '',
      dateOfBirth: '',
      sex: 'F',
      phone: '',
      email: '',
      address: '',

      // Patient fields
      emergencyContactName: '',
      emergencyContactPhone: '',
      medicalHistory: '',
      allergies: '',
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
        phone: data.phone || undefined,
        email: data.email || undefined,
        address: data.address || undefined,
      } as any,
      emergencyContactName: data.emergencyContactName || undefined,
      emergencyContactPhone: data.emergencyContactPhone || undefined,
      medicalHistory: data.medicalHistory || undefined,
      allergies: data.allergies || undefined,
    }

    createPatientMutation.mutate(patientData, {
      onSuccess: newPatient => {
        // Close the modal
        onOpenChange(false)
        // Reset form
        form.reset()
        // Call success callback
        onSuccess?.()
        // Navigate to patient page
        router.push(`/patients/${newPatient.id}`)
      },
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <div className="fixed inset-0 z-50 bg-transparent backdrop-blur-sm" />
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto overflow-x-hidden rounded-lg p-4 sm:p-6 w-[calc(100vw-2rem)] sm:w-[calc(100vw-3rem)] lg:w-full">
        <DialogHeader>
          <DialogTitle>{t('newPatient')}</DialogTitle>
          <DialogDescription>{t('newPatientDescription')}</DialogDescription>
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
                        <SelectContent>
                          <SelectItem value="EC">Ecuador</SelectItem>
                          <SelectItem value="MX">México</SelectItem>
                          <SelectItem value="US">Estados Unidos</SelectItem>
                          <SelectItem value="CA">Canadá</SelectItem>
                          <SelectItem value="ES">España</SelectItem>
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
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('phone')}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t('phonePlaceholder')}
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
                  name="emergencyContactPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('emergencyContactPhone')}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t('phonePlaceholder')}
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
              <Button type="submit" disabled={createPatientMutation.isPending}>
                {createPatientMutation.isPending ? (
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
