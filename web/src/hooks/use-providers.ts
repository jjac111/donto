// TanStack Query hooks for providers
// Handles provider data fetching and cache management

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-client'
import { supabase } from '@/lib/api'
import { Provider, DbProvider, DbPerson } from '@/types'
import { useAuthStore } from '@/store/auth'

// Data transformation utilities
const transformProvider = (
  dbProvider: DbProvider,
  dbPerson: DbPerson
): Provider => ({
  id: dbProvider.id,
  personId: dbProvider.person_id,
  clinicId: dbProvider.clinic_id,
  specialty: dbProvider.specialty || undefined,
  isActive: dbProvider.is_active,

  // Person data
  person: {
    id: dbPerson.id,
    clinicId: dbPerson.clinic_id,
    nationalId: dbPerson.national_id,
    country: dbPerson.country,
    firstName: dbPerson.first_name,
    lastName: dbPerson.last_name,
    dateOfBirth: new Date(dbPerson.date_of_birth),
    sex: dbPerson.sex || undefined,
    phone: dbPerson.phone || undefined,
    phoneCountryCode: dbPerson.phone_country_code || undefined,
    email: dbPerson.email || undefined,
    address: dbPerson.address || undefined,
    displayName: `${dbPerson.first_name} ${dbPerson.last_name}`,
    age:
      new Date().getFullYear() - new Date(dbPerson.date_of_birth).getFullYear(),
    initials: `${dbPerson.first_name[0]}${dbPerson.last_name[0]}`.toUpperCase(),
  },

  // Computed fields
  displayName: `${dbPerson.first_name} ${dbPerson.last_name}`,
})

// Get all active providers for current clinic
export const useProviders = () => {
  const { clinicId } = useAuthStore()

  return useQuery({
    queryKey: [...queryKeys.providers, clinicId],
    queryFn: async (): Promise<Provider[]> => {
      const { data, error } = await supabase
        .from('providers')
        .select(
          `
          *,
          person:person_id(*)
        `
        )
        .eq('clinic_id', clinicId)

      if (error) {
        throw new Error(`Failed to fetch providers: ${error.message}`)
      }

      return (data || [])
        .map((item: any) => transformProvider(item, item.person))
        .sort((a, b) => a.displayName.localeCompare(b.displayName))
    },
    enabled: !!clinicId,
    staleTime: 10 * 60 * 1000, // 10 minutes - providers don't change frequently
  })
}

// Get single provider by ID
export const useProvider = (id: string) => {
  return useQuery({
    queryKey: queryKeys.provider(id),
    queryFn: async (): Promise<Provider | null> => {
      const { data, error } = await supabase
        .from('providers')
        .select(
          `
          *,
          person:person_id(*)
        `
        )
        .eq('id', id)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return null // Provider not found
        }
        throw new Error(`Failed to fetch provider: ${error.message}`)
      }

      return transformProvider(data, data.person)
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes - individual provider data
  })
}

// Create provider mutation
export const useCreateProvider = () => {
  const queryClient = useQueryClient()
  const { clinicId } = useAuthStore()

  return useMutation({
    mutationFn: async (providerData: {
      person: {
        nationalId: string
        country: string
        firstName: string
        lastName: string
        dateOfBirth: Date
        sex?: string
        phone?: string
        phoneCountryCode?: string
        email?: string
        address?: string
      }
      specialty?: string
    }) => {
      // First create the person
      const { data: person, error: personError } = await supabase
        .from('persons')
        .insert({
          clinic_id: clinicId,
          national_id: providerData.person.nationalId,
          country: providerData.person.country,
          first_name: providerData.person.firstName,
          last_name: providerData.person.lastName,
          date_of_birth: providerData.person.dateOfBirth
            .toISOString()
            .split('T')[0],
          sex: providerData.person.sex || null,
          phone: providerData.person.phone || null,
          phone_country_code: providerData.person.phoneCountryCode || null,
          email: providerData.person.email || null,
          address: providerData.person.address || null,
        })
        .select()
        .single()

      if (personError) {
        throw new Error(`Failed to create person: ${personError.message}`)
      }

      // Then create the provider
      const { data: provider, error: providerError } = await supabase
        .from('providers')
        .insert({
          person_id: person.id,
          clinic_id: clinicId,
          specialty: providerData.specialty || null,
          is_active: true,
        })
        .select()
        .single()

      if (providerError) {
        throw new Error(`Failed to create provider: ${providerError.message}`)
      }

      return transformProvider(provider, person)
    },
    onSuccess: () => {
      // Invalidate providers list for current clinic
      queryClient.invalidateQueries({
        queryKey: [...queryKeys.providers, clinicId],
      })
    },
  })
}

// Update provider mutation
export const useUpdateProvider = () => {
  const queryClient = useQueryClient()
  const { clinicId } = useAuthStore()

  return useMutation({
    mutationFn: async ({
      id,
      data: updateData,
    }: {
      id: string
      data: {
        person?: {
          nationalId?: string
          country?: string
          firstName?: string
          lastName?: string
          dateOfBirth?: Date
          sex?: string
          phone?: string
          phoneCountryCode?: string
          email?: string
          address?: string
        }
        specialty?: string
        isActive?: boolean
      }
    }) => {
      // Get current provider to access person_id
      const { data: currentProvider, error: fetchError } = await supabase
        .from('providers')
        .select('person_id')
        .eq('id', id)
        .single()

      if (fetchError) {
        throw new Error(`Failed to fetch provider: ${fetchError.message}`)
      }

      // Update person data if provided
      if (updateData.person) {
        const personUpdateData: any = {}
        if (updateData.person.nationalId)
          personUpdateData.national_id = updateData.person.nationalId
        if (updateData.person.country)
          personUpdateData.country = updateData.person.country
        if (updateData.person.firstName)
          personUpdateData.first_name = updateData.person.firstName
        if (updateData.person.lastName)
          personUpdateData.last_name = updateData.person.lastName
        if (updateData.person.dateOfBirth)
          personUpdateData.date_of_birth = updateData.person.dateOfBirth
            .toISOString()
            .split('T')[0]
        if (updateData.person.sex !== undefined)
          personUpdateData.sex = updateData.person.sex
        if (updateData.person.phone !== undefined)
          personUpdateData.phone = updateData.person.phone
        if (updateData.person.phoneCountryCode !== undefined)
          personUpdateData.phone_country_code =
            updateData.person.phoneCountryCode
        if (updateData.person.email !== undefined)
          personUpdateData.email = updateData.person.email
        if (updateData.person.address !== undefined)
          personUpdateData.address = updateData.person.address

        const { error: personError } = await supabase
          .from('persons')
          .update(personUpdateData)
          .eq('id', currentProvider.person_id)

        if (personError) {
          throw new Error(`Failed to update person: ${personError.message}`)
        }
      }

      // Update provider data
      const providerUpdateData: any = {}
      if (updateData.specialty !== undefined)
        providerUpdateData.specialty = updateData.specialty
      if (updateData.isActive !== undefined)
        providerUpdateData.is_active = updateData.isActive

      const { data: updatedProvider, error: providerError } = await supabase
        .from('providers')
        .update(providerUpdateData)
        .eq('id', id)
        .select()
        .single()

      if (providerError) {
        throw new Error(`Failed to update provider: ${providerError.message}`)
      }

      // Fetch updated person data
      const { data: updatedPerson, error: personFetchError } = await supabase
        .from('persons')
        .select('*')
        .eq('id', currentProvider.person_id)
        .single()

      if (personFetchError) {
        throw new Error(
          `Failed to fetch updated person: ${personFetchError.message}`
        )
      }

      return transformProvider(updatedProvider, updatedPerson)
    },
    onSuccess: updatedProvider => {
      // Update the specific provider cache
      queryClient.setQueryData(
        queryKeys.provider(updatedProvider.id),
        updatedProvider
      )
      // Invalidate providers list for current clinic
      queryClient.invalidateQueries({
        queryKey: [...queryKeys.providers, clinicId],
      })
    },
  })
}

// Delete provider mutation (hard delete)
export const useDeleteProvider = () => {
  const queryClient = useQueryClient()
  const { clinicId } = useAuthStore()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('providers').delete().eq('id', id)

      if (error) {
        throw new Error(`Failed to delete provider: ${error.message}`)
      }
    },
    onSuccess: () => {
      // Invalidate providers list for current clinic
      queryClient.invalidateQueries({
        queryKey: [...queryKeys.providers, clinicId],
      })
    },
  })
}
