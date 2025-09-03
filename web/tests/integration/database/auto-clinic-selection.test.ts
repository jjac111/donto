import { describe, it, expect, beforeEach } from 'vitest'
import { 
  supabase, 
  TEST_USERS, 
  TEST_CLINICS,
  loginWithAutoClinicSelection,
  createFullUserSession,
  getCurrentActiveClinic 
} from '../../setup'

describe('Auto-Clinic Selection Tests', () => {
  beforeEach(async () => {
    // Sign out before each test
    await supabase.auth.signOut()
  })

  it('should auto-select clinic for user with single clinic access', async () => {
    // clinic1Admin has access to only one clinic
    const result = await loginWithAutoClinicSelection(
      TEST_USERS.clinic1Admin.email, 
      TEST_USERS.clinic1Admin.password
    )

    expect(result.needsClinicSelection).toBe(false)
    expect(result.sessionToken).toBeTruthy()
    
    // Verify the correct clinic was selected
    const activeClinic = await getCurrentActiveClinic()
    expect(activeClinic).toBe(TEST_CLINICS.clinic1)
  })

  it('should require manual selection for user with no clinic access', async () => {
    // deactivatedUser has no active clinic profiles
    const result = await loginWithAutoClinicSelection(
      TEST_USERS.deactivatedUser.email,
      TEST_USERS.deactivatedUser.password
    )

    expect(result.needsClinicSelection).toBe(true)
    expect(result.sessionToken).toBeNull()
    
    // Verify no clinic is active
    const activeClinic = await getCurrentActiveClinic()
    expect(activeClinic).toBeNull()
  })

  it('should create full session with createFullUserSession helper', async () => {
    const session = await createFullUserSession(
      TEST_USERS.clinic1Admin.email,
      TEST_USERS.clinic1Admin.password
    )

    expect(session.needsClinicSelection).toBe(false)
    expect(session.activeClinic).toBe(TEST_CLINICS.clinic1)
    expect(session.authData.user).toBeTruthy()
  })

  it('should handle manual clinic selection when needed', async () => {
    // Use emptyClinicUser who has access to emptyClinic for manual selection
    const session = await createFullUserSession(
      TEST_USERS.emptyClinicUser.email,
      TEST_USERS.emptyClinicUser.password,
      TEST_CLINICS.emptyClinic
    )

    expect(session.needsClinicSelection).toBe(false)
    expect(session.activeClinic).toBe(TEST_CLINICS.emptyClinic)
  })

  it('should throw error when manual selection needed but no clinic provided', async () => {
    await expect(
      createFullUserSession(
        TEST_USERS.deactivatedUser.email,
        TEST_USERS.deactivatedUser.password
        // No clinicId provided
      )
    ).rejects.toThrow('requires manual clinic selection')
  })

  it('should create valid user session in database', async () => {
    await createFullUserSession(
      TEST_USERS.clinic1Admin.email,
      TEST_USERS.clinic1Admin.password
    )

    // Check that user_sessions table has records for this user
    const { data: sessions, error } = await supabase
      .from('user_sessions')
      .select('*')
      .eq('user_id', TEST_USERS.clinic1Admin.id)
      .order('created_at', { ascending: false })

    expect(error).toBeNull()
    expect(sessions!.length).toBeGreaterThan(0)
    expect(sessions![0].active_clinic_id).toBe(TEST_CLINICS.clinic1)
    expect(new Date(sessions![0].expires_at)).toBeInstanceOf(Date)
  })
})
