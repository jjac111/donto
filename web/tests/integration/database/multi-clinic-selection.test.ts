import { describe, it, expect, beforeEach } from 'vitest'
import { supabase, TEST_USERS, TEST_CLINICS } from '../../setup'

describe('Multi-Clinic Selection Flow', () => {
  beforeEach(async () => {
    await supabase.auth.signOut()
  })

  it('returns multiple profiles for multi-clinic user (no 406)', async () => {
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: TEST_USERS.multiClinicUser.email,
      password: TEST_USERS.multiClinicUser.password,
    })

    expect(authError).toBeNull()

    const { data, error } = await supabase
      .from('profiles')
      .select(
        `
        clinic_id,
        clinic:clinic_id(name),
        role,
        provider_id
      `
      )
      .eq('user_id', TEST_USERS.multiClinicUser.id)
      .eq('is_active', true)

    expect(error).toBeNull()
    expect(Array.isArray(data)).toBe(true)
    expect((data || []).length).toBeGreaterThanOrEqual(2)
  })

  it('using .single() on multi-clinic profile query yields an error', async () => {
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: TEST_USERS.multiClinicUser.email,
      password: TEST_USERS.multiClinicUser.password,
    })
    expect(authError).toBeNull()

    const { data, error } = await supabase
      .from('profiles')
      .select(
        `
        clinic_id,
        clinic:clinic_id(name),
        role,
        provider_id
      `
      )
      .eq('user_id', TEST_USERS.multiClinicUser.id)
      .eq('is_active', true)
      .single()

    // Expect an error because more than one row exists
    expect(data).toBeNull()
    expect(error).not.toBeNull()
    // PostgREST uses 406 for .single() when not exactly one row
    // supabase-js doesn't always expose status, but error should exist
  })

  it('after selecting a clinic, fetching a single profile for that clinic succeeds', async () => {
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: TEST_USERS.multiClinicUser.email,
      password: TEST_USERS.multiClinicUser.password,
    })
    expect(authError).toBeNull()

    // Manually set active clinic to clinic1
    const { error: setError } = await supabase.rpc('set_active_clinic', {
      clinic_uuid: TEST_CLINICS.clinic1,
    })
    expect(setError).toBeNull()

    const { data, error } = await supabase
      .from('profiles')
      .select(
        `
        clinic_id,
        clinic:clinic_id(name),
        role,
        provider_id
      `
      )
      .eq('user_id', TEST_USERS.multiClinicUser.id)
      .eq('clinic_id', TEST_CLINICS.clinic1)
      .eq('is_active', true)
      .single()

    expect(error).toBeNull()
    expect(data).toBeTruthy()
    expect(data!.clinic_id).toBe(TEST_CLINICS.clinic1)
  })
})
