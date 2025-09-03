import { describe, it, expect } from 'vitest'
import { supabase, supabaseAdmin } from '../setup'

describe('Database Smoke Tests', () => {
  it('should connect to Supabase', async () => {
    expect(supabase).toBeDefined()
    expect(supabaseAdmin).toBeDefined()
  })

  it('should have access to database functions', async () => {
    // Test that we can call a basic database function
    const { data, error } = await supabaseAdmin.rpc('get_current_active_clinic')
    
    // We expect this to return null (no active session) but not error
    expect(error).toBeNull()
    expect(data).toBeNull()
  })

  it('should have proper table access via admin client', async () => {
    // Test that we can access tables with admin client
    const { data, error } = await supabaseAdmin
      .from('clinics')
      .select('id, name')
      .limit(1)
    
    expect(error).toBeNull()
    expect(Array.isArray(data)).toBe(true)
  })

  it('should block table access without authentication', async () => {
    // Test that RLS blocks unauthenticated access
    const { data, error } = await supabase
      .from('patients')
      .select('id')
      .limit(1)
    
    // Should return empty array due to RLS, not an error
    expect(error).toBeNull()
    expect(data).toEqual([])
  })
})
