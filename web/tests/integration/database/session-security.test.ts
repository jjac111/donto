import { describe, it, expect, beforeEach } from 'vitest'
import { 
  supabase, 
  supabaseAdmin,
  TEST_USERS, 
  TEST_CLINICS,
  createFullUserSession,
  setActiveClinic,
  getCurrentActiveClinic
} from '../../setup'

describe('Session Security Tests', () => {
  beforeEach(async () => {
    await supabase.auth.signOut()
  })

  describe('Session Validation', () => {
    it('should return correct clinic from get_current_active_clinic', async () => {
      await createFullUserSession(
        TEST_USERS.clinic1Admin.email,
        TEST_USERS.clinic1Admin.password
      )

      const activeClinic = await getCurrentActiveClinic()
      expect(activeClinic).toBe(TEST_CLINICS.clinic1)
    })

    it('should return NULL when no session exists', async () => {
      // Don't sign in - no session
      const { data, error } = await supabase.rpc('get_current_active_clinic')
      
      expect(error).toBeNull()
      expect(data).toBeNull()
    })

    it('should block data access when session expired', async () => {
      // Create session for clinic1Admin
      await createFullUserSession(
        TEST_USERS.clinic1Admin.email,
        TEST_USERS.clinic1Admin.password
      )

      // Manually expire the session using admin client
      const { error: expireError } = await supabaseAdmin
        .from('user_sessions')
        .update({ expires_at: new Date(Date.now() - 1000).toISOString() })
        .eq('user_id', TEST_USERS.clinic1Admin.id)

      expect(expireError).toBeNull()

      // Try to access data - should get empty results due to expired session
      const { data: patients, error } = await supabase
        .from('patients')
        .select('*')

      expect(error).toBeNull()
      expect(patients).toEqual([]) // Should be empty due to expired session
    })
  })

  describe('Session Management', () => {
    it('should create valid session with set_active_clinic', async () => {
      // Login without auto-clinic selection (use noAccessUser who has clinic access)
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: TEST_USERS.noAccessUser.email,
        password: TEST_USERS.noAccessUser.password,
      })

      expect(authError).toBeNull()
      expect(data.user).toBeTruthy()

      // Manually set active clinic
      const sessionToken = await setActiveClinic(TEST_CLINICS.emptyClinic)
      expect(sessionToken).toBeTruthy()

      // Verify active clinic is set
      const activeClinic = await getCurrentActiveClinic()
      expect(activeClinic).toBe(TEST_CLINICS.emptyClinic)
    })

    it('should reject invalid clinic access', async () => {
      // Login as clinic1Admin
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: TEST_USERS.clinic1Admin.email,
        password: TEST_USERS.clinic1Admin.password,
      })

      expect(authError).toBeNull()

      // Try to set clinic2 (which clinic1Admin doesn't have access to)
      await expect(
        setActiveClinic(TEST_CLINICS.clinic2)
      ).rejects.toThrow('User does not have access to clinic')
    })

    it('should invalidate old sessions when setting new clinic', async () => {
      // Login as noAccessUser who has access to emptyClinic
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: TEST_USERS.noAccessUser.email,
        password: TEST_USERS.noAccessUser.password,
      })

      expect(authError).toBeNull()

      // Set first clinic
      await setActiveClinic(TEST_CLINICS.emptyClinic)
      
      // Get sessions count
      const { data: sessions1 } = await supabaseAdmin
        .from('user_sessions')
        .select('*')
        .eq('user_id', TEST_USERS.noAccessUser.id)
        .gt('expires_at', new Date().toISOString())

      expect(sessions1!.length).toBeGreaterThan(0)

      // Set clinic again (should invalidate previous)
      await setActiveClinic(TEST_CLINICS.emptyClinic)

      // Check that we still have sessions (new one created, old one expired)
      const { data: sessions2 } = await supabaseAdmin
        .from('user_sessions')
        .select('*')
        .eq('user_id', TEST_USERS.noAccessUser.id)
        .gt('expires_at', new Date().toISOString())

      // Should have exactly 1 active session (the new one)
      expect(sessions2!.length).toBe(1)
    })

    it('should handle session expiration correctly', async () => {
      await createFullUserSession(
        TEST_USERS.clinic1Admin.email,
        TEST_USERS.clinic1Admin.password
      )

      // Verify we can access data initially
      const { data: initialPatients } = await supabase
        .from('patients')
        .select('*')

      expect(initialPatients!.length).toBeGreaterThan(0)

      // Expire the session
      await supabaseAdmin
        .from('user_sessions')
        .update({ expires_at: new Date(Date.now() - 1000).toISOString() })
        .eq('user_id', TEST_USERS.clinic1Admin.id)

      // Try to access data again - should be blocked
      const { data: expiredPatients } = await supabase
        .from('patients')
        .select('*')

      expect(expiredPatients).toEqual([])
    })
  })

  describe('Real-Time Access Revocation', () => {
    it('should immediately block access when profile deactivated', async () => {
      await createFullUserSession(
        TEST_USERS.clinic1Admin.email,
        TEST_USERS.clinic1Admin.password
      )

      // Verify initial access
      const { data: initialPatients } = await supabase
        .from('patients')
        .select('*')

      expect(initialPatients!.length).toBeGreaterThan(0)

      // Deactivate user profile using admin client
      await supabaseAdmin
        .from('profiles')
        .update({ is_active: false })
        .eq('user_id', TEST_USERS.clinic1Admin.id)

      // Try to access data - should be blocked immediately
      const { data: blockedPatients } = await supabase
        .from('patients')
        .select('*')

      expect(blockedPatients).toEqual([])

      // Reactivate for cleanup
      await supabaseAdmin
        .from('profiles')
        .update({ is_active: true })
        .eq('user_id', TEST_USERS.clinic1Admin.id)
    })

    it('should validate current session properly', async () => {
      await createFullUserSession(
        TEST_USERS.clinic1Admin.email,
        TEST_USERS.clinic1Admin.password
      )

      // Valid session should return true
      const { data: isValid1, error: error1 } = await supabase.rpc('validate_current_session')
      expect(error1).toBeNull()
      expect(isValid1).toBe(true)

      // Expire session
      await supabaseAdmin
        .from('user_sessions')
        .update({ expires_at: new Date(Date.now() - 1000).toISOString() })
        .eq('user_id', TEST_USERS.clinic1Admin.id)

      // Expired session should return false
      const { data: isValid2, error: error2 } = await supabase.rpc('validate_current_session')
      expect(error2).toBeNull()
      expect(isValid2).toBe(false)
    })
  })
})
