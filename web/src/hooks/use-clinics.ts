// TanStack Query hooks for clinics
// Handles clinic data fetching and cache management

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-client'
import { supabase } from '@/lib/api'
import { Clinic } from '@/types/entities'

// Get clinic by ID with full details
export const useClinic = (id: string) => {
  return useQuery({
    queryKey: queryKeys.clinic(id),
    queryFn: async (): Promise<Clinic | null> => {
      const { data, error } = await supabase
        .from('clinics')
        .select('id, name, address, phone, email, country, phone_country_code')
        .eq('id', id)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return null // Clinic not found
        }
        throw new Error(`Failed to fetch clinic: ${error.message}`)
      }

      return {
        id: data.id,
        name: data.name,
        address: data.address,
        phone: data.phone,
        email: data.email,
        country: data.country,
        phoneCountryCode: data.phone_country_code,
      }
    },
    enabled: !!id,
    staleTime: 30 * 60 * 1000, // 30 minutes - clinic info rarely changes
  })
}

// Update clinic mutation
export const useUpdateClinic = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Clinic> }) => {
      const { data: updatedClinic, error } = await supabase
        .from('clinics')
        .update({
          name: data.name,
          address: data.address,
          phone: data.phone,
          email: data.email,
          country: data.country,
          phone_country_code: data.phoneCountryCode,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single()

      if (error) {
        throw new Error(`Failed to update clinic: ${error.message}`)
      }

      return updatedClinic
    },
    onSuccess: updatedClinic => {
      // Update the clinic cache
      queryClient.setQueryData(
        queryKeys.clinic(updatedClinic.id),
        updatedClinic
      )

      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['clinics'] })
    },
  })
}
