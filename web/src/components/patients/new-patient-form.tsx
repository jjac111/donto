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
import { patientsApi } from '@/lib/api'

const newPatientSchema = (t: (key: string) => string) =>
  z.object({
    // Person fields
    nationalId: z.string().min(1, t('patients.nationalIdRequired')),
    country: z.string().min(1, t('patients.countryRequired')),
    firstName: z.string().min(1, t('patients.firstNameRequired')),
    lastName: z.string().min(1, t('patients.lastNameRequired')),
    dateOfBirth: z.string().min(1, t('patients.dateOfBirthRequired')),
    sex: z.enum(['M', 'F'], {
      message: t('patients.selectValidGender'),
    }),
    phone: z.string().optional(),
    email: z
      .string()
      .email(t('patients.invalidEmail'))
      .optional()
      .or(z.literal('')),
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
  const t = useTranslations()
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

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
    setIsSubmitting(true)
    try {
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

      const newPatient = await patientsApi.create(patientData)

      // Close the modal
      onOpenChange(false)

      // Reset form
      form.reset()

      // Call success callback to refresh list
      onSuccess?.()

      // Navigate to patient page
      router.push(`/patients/${newPatient.id}`)
    } catch (error) {
      console.error('Error creating patient:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('patients.newPatient')}</DialogTitle>
          <DialogDescription>
            {t('patients.newPatientDescription')}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Personal Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-foreground border-b pb-2">
                {t('patients.personalInformation')}
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="nationalId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('patients.nationalId')}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t('patients.nationalIdPlaceholder')}
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
                      <FormLabel>{t('patients.country')}</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue
                              placeholder={t('patients.selectCountry')}
                            />
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

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('patients.firstName')}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t('patients.firstNamePlaceholder')}
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
                      <FormLabel>{t('patients.lastName')}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t('patients.lastNamePlaceholder')}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="dateOfBirth"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('patients.dateOfBirth')}</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
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
                      <FormLabel>{t('patients.sex')}</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue
                              placeholder={t('patients.selectGender')}
                            />
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

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('patients.phone')}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t('patients.phonePlaceholder')}
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
                      <FormLabel>{t('patients.email')}</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder={t('patients.emailPlaceholder')}
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
                    <FormLabel>{t('patients.address')}</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder={t('patients.addressPlaceholder')}
                        className="min-h-[80px]"
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
                {t('patients.medicalInformation')}
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="emergencyContactName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {t('patients.emergencyContactName')}
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t('patients.emergencyNamePlaceholder')}
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
                      <FormLabel>
                        {t('patients.emergencyContactPhone')}
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t('patients.phonePlaceholder')}
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
                    <FormLabel>{t('patients.medicalHistory')}</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder={t('patients.medicalHistoryPlaceholder')}
                        className="min-h-[100px]"
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
                    <FormLabel>{t('patients.allergies')}</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder={t('patients.allergiesPlaceholder')}
                        className="min-h-[80px]"
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
                {t('patients.cancel')}
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('common.loading')}
                  </>
                ) : (
                  t('patients.save')
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
