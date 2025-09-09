// TanStack Query hooks for providers
// Handles provider data fetching and cache management

import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-client'
import { supabase } from '@/lib/api'
import { Provider, DbProvider, DbPerson } from '@/types'

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

// Get all active providers
export const useProviders = () => {
  return useQuery({
    queryKey: queryKeys.providers,
    queryFn: async (): Promise<Provider[]> => {
      const { data, error } = await supabase
        .from('providers')
        .select(
          `
          *,
          person:person_id(*)
        `
        )
        .eq('is_active', true)
        .order('person.first_name', { ascending: true })

      if (error) {
        throw new Error(`Failed to fetch providers: ${error.message}`)
      }

      return (data || []).map((item: any) =>
        transformProvider(item, item.person)
      )
    },
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
