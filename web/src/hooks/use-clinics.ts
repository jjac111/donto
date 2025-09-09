// TanStack Query hooks for clinics
// Handles clinic data fetching and cache management

import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-client'
import { supabase } from '@/lib/api'

// Get clinic by ID
export const useClinic = (id: string) => {
  return useQuery({
    queryKey: queryKeys.clinic(id),
    queryFn: async (): Promise<{ id: string; name: string } | null> => {
      const { data, error } = await supabase
        .from('clinics')
        .select('id, name')
        .eq('id', id)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return null // Clinic not found
        }
        throw new Error(`Failed to fetch clinic: ${error.message}`)
      }

      return data
    },
    enabled: !!id,
    staleTime: 30 * 60 * 1000, // 30 minutes - clinic info rarely changes
  })
}
