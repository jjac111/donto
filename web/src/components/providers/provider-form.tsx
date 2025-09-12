'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Toggle } from '@/components/ui/toggle'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { useCreateProvider, useUpdateProvider } from '@/hooks/use-providers'
import { Provider } from '@/types/entities'
// import { toast } from 'sonner' // TODO: Add toast library

// Form validation schema
const providerSchema = z.object({
  // Personal information
  nationalId: z.string().min(1, 'El ID nacional es obligatorio'),
  country: z.string().min(1, 'El país es obligatorio'),
  firstName: z.string().min(1, 'El nombre es obligatorio'),
  lastName: z.string().min(1, 'Los apellidos son obligatorios'),
  dateOfBirth: z.string().min(1, 'La fecha de nacimiento es obligatoria'),
  sex: z.string().optional(),
  phone: z.string().optional(),
  email: z
    .string()
    .email('Correo electrónico inválido')
    .optional()
    .or(z.literal('')),
  address: z.string().optional(),

  // Professional information
  specialty: z.string().optional(),
  isActive: z.boolean(),
})

type ProviderFormData = z.infer<typeof providerSchema>

interface ProviderFormProps {
  provider?: Provider
  onSuccess?: () => void
  onCancel?: () => void
}

export function ProviderForm({
  provider,
  onSuccess,
  onCancel,
}: ProviderFormProps) {
  const t = useTranslations('settings.providers')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const createProvider = useCreateProvider()
  const updateProvider = useUpdateProvider()

  const isEditing = !!provider

  const form = useForm<ProviderFormData>({
    resolver: zodResolver(providerSchema),
    defaultValues: {
      nationalId: provider?.person?.nationalId || '',
      country: provider?.person?.country || 'EC',
      firstName: provider?.person?.firstName || '',
      lastName: provider?.person?.lastName || '',
      dateOfBirth: provider?.person?.dateOfBirth
        ? provider.person.dateOfBirth.toISOString().split('T')[0]
        : '',
      sex: provider?.person?.sex || '',
      phone: provider?.person?.phone || '',
      email: provider?.person?.email || '',
      address: provider?.person?.address || '',
      specialty: provider?.specialty || '',
      isActive: provider?.isActive ?? true,
    },
  })

  const onSubmit = async (data: ProviderFormData) => {
    setIsSubmitting(true)

    try {
      const providerData = {
        person: {
          nationalId: data.nationalId,
          country: data.country,
          firstName: data.firstName,
          lastName: data.lastName,
          dateOfBirth: new Date(data.dateOfBirth),
          sex: data.sex || undefined,
          phone: data.phone || undefined,
          email: data.email || undefined,
          address: data.address || undefined,
        },
        specialty: data.specialty || undefined,
      }

      if (isEditing) {
        await updateProvider.mutateAsync({
          id: provider.id,
          data: {
            person: providerData.person,
            specialty: providerData.specialty,
            isActive: data.isActive,
          },
        })
        console.log('Provider updated successfully')
      } else {
        await createProvider.mutateAsync(providerData)
        console.log('Provider created successfully')
      }

      onSuccess?.()
    } catch (error) {
      console.error('Provider form error:', error)
      alert(isEditing ? t('updateError') : t('createError'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="p-6">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-lg font-semibold">
            {isEditing ? t('editProvider') : t('addProvider')}
          </h2>
          <p className="text-sm text-muted-foreground">
            {isEditing
              ? 'Modifica la información del personal'
              : 'Agrega nuevo personal a la clínica'}
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Personal Information Section */}
            <div className="space-y-4">
              <h3 className="text-md font-medium">{t('personalInfo')}</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('firstName')}</FormLabel>
                      <FormControl>
                        <Input placeholder="Dr. Juan" {...field} />
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
                        <Input placeholder="Pérez García" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="nationalId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('nationalId')}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t('nationalIdPlaceholder')}
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
                          <SelectItem value="CO">Colombia</SelectItem>
                          <SelectItem value="PE">Perú</SelectItem>
                          <SelectItem value="MX">México</SelectItem>
                          <SelectItem value="US">Estados Unidos</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="dateOfBirth"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('dateOfBirth')}</FormLabel>
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
                      <FormLabel>{t('sex')}</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t('selectSex')} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="M">{t('male')}</SelectItem>
                          <SelectItem value="F">{t('female')}</SelectItem>
                          <SelectItem value="O">{t('other')}</SelectItem>
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
                        <Input placeholder={t('phonePlaceholder')} {...field} />
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
                      <Input placeholder={t('addressPlaceholder')} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Professional Information Section */}
            <div className="space-y-4">
              <h3 className="text-md font-medium">{t('professionalInfo')}</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="specialty"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('specialty')}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t('specialtyPlaceholder')}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          {t('isActive')}
                        </FormLabel>
                        <div className="text-sm text-muted-foreground">
                          {t('isActiveDescription')}
                        </div>
                      </div>
                      <FormControl>
                        <Toggle
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isSubmitting}
              >
                {t('cancel')}
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="min-w-[100px]"
              >
                {isSubmitting ? (
                  <>
                    <LoadingSpinner className="mr-2 h-4 w-4" />
                    {t('saving')}
                  </>
                ) : (
                  t('save')
                )}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </Card>
  )
}
