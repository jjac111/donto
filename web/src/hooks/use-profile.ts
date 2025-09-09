// TanStack Query hooks for user profile
// Handles current user profile data fetching and cache management

import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-client'
import { supabase } from '@/lib/api'

export type UserProfile = {
  id: string
  email: string
  firstName: string
  lastName: string
  displayName: string
  role: string
  clinicId: string
  clinicName: string
}

// Get current user profile
export const useCurrentUserProfile = () => {
  return useQuery({
    queryKey: queryKeys.currentUserProfile(),
    queryFn: async (): Promise<UserProfile | null> => {
      const { data, error } = await supabase
        .from('profiles')
        .select(
          `
          id,
          role,
          clinic_id,
          provider_id,
          clinic:clinic_id(id, name),
          provider:provider_id(
            person:person_id(first_name, last_name)
          )
        `
        )
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .eq('is_active', true)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return null // Profile not found
        }
        throw new Error(`Failed to fetch user profile: ${error.message}`)
      }

      if (!data) return null

      // Get user email from auth
      const { data: authUser } = await supabase.auth.getUser()
      const email = authUser.user?.email || ''

      // Determine name from provider or use email as fallback
      let firstName = ''
      let lastName = ''
      let displayName = ''

      if ((data as any).provider?.person) {
        firstName = (data as any).provider.person.first_name
        lastName = (data as any).provider.person.last_name
        displayName = `${firstName} ${lastName}`.trim()
      } else {
        // For non-provider users, use email prefix as name
        const emailPrefix = email.split('@')[0]
        firstName = emailPrefix
        lastName = ''
        displayName = emailPrefix
      }

      return {
        id: data.id,
        email,
        firstName,
        lastName,
        displayName,
        role: data.role,
        clinicId: data.clinic_id,
        clinicName: (data as any).clinic?.name || '',
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - profile changes infrequently
    refetchOnWindowFocus: false, // Don't refetch profile on window focus
  })
}
