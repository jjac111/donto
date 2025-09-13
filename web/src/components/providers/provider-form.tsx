'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  useCreateProvider,
  useUpdateProvider,
  useDeleteProvider,
} from '@/hooks/use-providers'
import { Provider } from '@/types/entities'
import countries from 'world-countries'
import {
  parsePhoneNumberWithError,
  isValidPhoneNumber,
} from 'libphonenumber-js'
import { toast } from 'sonner'

// Helper function to get phone code for a country
const getPhoneCode = (countryCode: string): string => {
  const country = countries.find(c => c.cca3 === countryCode)
  if (!country || !country.idd?.root) return ''

  const root = country.idd.root
  const suffix = country.idd.suffixes?.[0] || ''
  return root + suffix
}

// Helper function to parse existing phone number using libphonenumber-js
const parseExistingPhone = (
  phone: string | undefined
): { countryCode: string; number: string } => {
  if (!phone) return { countryCode: '+593', number: '' }

  try {
    // Clean the phone number first (remove non-digits and leading zeros)
    const cleanedPhone = cleanPhoneNumber(phone)

    // Try to parse as E.164 format first
    if (phone.startsWith('+')) {
      const parsed = parsePhoneNumberWithError(phone)
      if (parsed && parsed.isValid()) {
        return {
          countryCode: `+${parsed.countryCallingCode}`,
          number: parsed.nationalNumber,
        }
      }
    }

    // If no country code, try with Ecuador default
    const phoneWithCountryCode = `+593${cleanedPhone}`
    const parsed = parsePhoneNumberWithError(phoneWithCountryCode)
    if (parsed && parsed.isValid()) {
      return {
        countryCode: '+593',
        number: parsed.nationalNumber,
      }
    }
  } catch (error) {
    // If parsing fails, return empty values
    return { countryCode: '+593', number: '' }
  }

  // If all parsing fails, return empty values
  return { countryCode: '+593', number: '' }
}

// Helper function to clean phone number (remove non-digits and trailing zeros)
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

// Sort countries alphabetically by name for better UX
const sortedCountries = countries
  .filter(country => country.independent !== false) // Only independent countries
  .sort((a, b) => a.name.common.localeCompare(b.name.common))

// Form validation schema
const createProviderSchema = (t: (key: string) => string) =>
  z
    .object({
      // Personal information
      nationalId: z.string().min(1, t('nationalIdRequired')),
      country: z.string().min(1, t('countryRequired')),
      firstName: z.string().min(1, t('firstNameRequired')),
      lastName: z.string().min(1, t('lastNameRequired')),
      dateOfBirth: z.string().min(1, t('dateOfBirthRequired')),
      sex: z.string().optional(),
      phoneCountryCode: z.string().optional(),
      phone: z.string().optional(),
      email: z.string().email(t('invalidEmail')).optional().or(z.literal('')),
      address: z.string().optional(),

      // Professional information
      specialty: z.string().optional(),
      isActive: z.boolean(),
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

type ProviderFormData = {
  nationalId: string
  country: string
  firstName: string
  lastName: string
  dateOfBirth: string
  sex?: string
  phoneCountryCode?: string
  phone?: string
  email?: string
  address?: string
  specialty?: string
  isActive: boolean
}

interface ProviderFormProps {
  provider?: Provider
  onSuccess?: () => void
  onCancel?: () => void
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function ProviderForm({
  provider,
  onSuccess,
  onCancel,
  open,
  onOpenChange,
}: ProviderFormProps) {
  const t = useTranslations('settings.providers')
  const tToast = useTranslations('toast')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const createProvider = useCreateProvider()
  const updateProvider = useUpdateProvider()
  const deleteProvider = useDeleteProvider()

  const isEditing = !!provider

  const parsedPhone = parseExistingPhone(provider?.person?.phone)

  const form = useForm<ProviderFormData>({
    resolver: zodResolver(createProviderSchema(t)),
    defaultValues: {
      nationalId: provider?.person?.nationalId || '',
      country: provider?.person?.country || 'ECU',
      firstName: provider?.person?.firstName || '',
      lastName: provider?.person?.lastName || '',
      dateOfBirth: provider?.person?.dateOfBirth
        ? provider.person.dateOfBirth.toISOString().split('T')[0]
        : '',
      sex: provider?.person?.sex || '',
      phoneCountryCode: parsedPhone.countryCode,
      phone: parsedPhone.number,
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
          phone: data.phone ? cleanPhoneNumber(data.phone) : undefined,
          phoneCountryCode: data.phoneCountryCode || undefined,
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
        toast.success(tToast('provider.updated'))
      } else {
        await createProvider.mutateAsync(providerData)
        toast.success(tToast('provider.created'))
      }

      onSuccess?.()
    } catch (error) {
      console.error('Provider form error:', error)
      toast.error(
        isEditing
          ? tToast('provider.updateFailed')
          : tToast('provider.createFailed')
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!provider) return

    setIsDeleting(true)
    try {
      await deleteProvider.mutateAsync(provider.id)
      toast.success(tToast('provider.deleted'))
      onSuccess?.()
    } catch (error) {
      console.error('Delete provider error:', error)
      toast.error(tToast('provider.deleteFailed'))
    } finally {
      setIsDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  const formContent = (
    <div className="space-y-6">
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

              {/* Phone fields - side by side on mobile */}
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
          <div className="flex justify-between pt-4">
            {/* Delete button - only show when editing */}
            {isEditing && (
              <Button
                type="button"
                variant="destructive"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={isSubmitting || isDeleting}
              >
                {isDeleting ? (
                  <>
                    <LoadingSpinner className="mr-2 h-4 w-4" />
                    Eliminando...
                  </>
                ) : (
                  'Eliminar'
                )}
              </Button>
            )}

            {/* Save/Cancel buttons */}
            <div className="flex space-x-2 ml-auto">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isSubmitting || isDeleting}
              >
                {t('cancel')}
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || isDeleting}
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
          </div>
        </form>
      </Form>
    </div>
  )

  // If no dialog props provided, render form content directly
  if (!open && !onOpenChange) {
    return (
      <>
        {formContent}
        {/* Delete Confirmation Dialog */}
        <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle>{t('confirmDelete')}</DialogTitle>
              <DialogDescription>
                {t('confirmDeleteDescription')}
              </DialogDescription>
            </DialogHeader>
            {provider && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="font-medium">{provider.displayName}</p>
                {provider.specialty && (
                  <p className="text-sm text-muted-foreground">
                    {provider.specialty}
                  </p>
                )}
              </div>
            )}
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
              >
                {t('cancel')}
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <LoadingSpinner className="mr-2 h-4 w-4" />
                    Eliminando...
                  </>
                ) : (
                  t('deleteProvider')
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    )
  }

  // Render with Dialog wrapper
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? t('editProvider') : t('addProvider')}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Modifica la información del personal'
              : 'Agrega nuevo personal a la clínica'}
          </DialogDescription>
        </DialogHeader>
        {formContent}
        {/* Delete Confirmation Dialog */}
        <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle>{t('confirmDelete')}</DialogTitle>
              <DialogDescription>
                {t('confirmDeleteDescription')}
              </DialogDescription>
            </DialogHeader>
            {provider && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="font-medium">{provider.displayName}</p>
                {provider.specialty && (
                  <p className="text-sm text-muted-foreground">
                    {provider.specialty}
                  </p>
                )}
              </div>
            )}
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
              >
                {t('cancel')}
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <LoadingSpinner className="mr-2 h-4 w-4" />
                    Eliminando...
                  </>
                ) : (
                  t('deleteProvider')
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  )
}
