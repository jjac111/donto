// TanStack Query hooks for procedures
// Handles procedure data fetching and cache management

import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-client'
import { supabase } from '@/lib/api'
import { Procedure, DbProcedure } from '@/types'

// Data transformation utilities
const transformProcedure = (dbProcedure: DbProcedure): Procedure => ({
  id: dbProcedure.id,
  clinicId: dbProcedure.clinic_id,
  code: dbProcedure.code || undefined,
  name: dbProcedure.name,
  description: dbProcedure.description || undefined,
  defaultCost: dbProcedure.default_cost || undefined,
  estimatedDurationMinutes: dbProcedure.estimated_duration_minutes || undefined,
  category: dbProcedure.category || undefined,
  isActive: dbProcedure.is_active,
  displayName: dbProcedure.code
    ? `${dbProcedure.code} - ${dbProcedure.name}`
    : dbProcedure.name,
})

// Get all active procedures
export const useProcedures = () => {
  return useQuery({
    queryKey: queryKeys.procedures,
    queryFn: async (): Promise<Procedure[]> => {
      const { data, error } = await supabase
        .from('procedures')
        .select('*')
        .eq('is_active', true)
        .order('category', { ascending: true })

      if (error) {
        throw new Error(`Failed to fetch procedures: ${error.message}`)
      }

      return (data || []).map(transformProcedure)
    },
    staleTime: 15 * 60 * 1000, // 15 minutes - procedures don't change frequently
  })
}

// Get single procedure by ID
export const useProcedure = (id: string) => {
  return useQuery({
    queryKey: queryKeys.procedure(id),
    queryFn: async (): Promise<Procedure | null> => {
      const { data, error } = await supabase
        .from('procedures')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return null // Procedure not found
        }
        throw new Error(`Failed to fetch procedure: ${error.message}`)
      }

      return transformProcedure(data)
    },
    enabled: !!id,
    staleTime: 10 * 60 * 1000, // 10 minutes - individual procedure data
  })
}

// Get procedures by category
export const useProceduresByCategory = (category?: string) => {
  return useQuery({
    queryKey: [...queryKeys.procedures, 'category', category],
    queryFn: async (): Promise<Procedure[]> => {
      let query = supabase.from('procedures').select('*').eq('is_active', true)

      if (category) {
        query = query.eq('category', category)
      }

      const { data, error } = await query.order('name', { ascending: true })

      if (error) {
        throw new Error(`Failed to fetch procedures: ${error.message}`)
      }

      return (data || []).map(transformProcedure)
    },
    staleTime: 15 * 60 * 1000,
  })
}
