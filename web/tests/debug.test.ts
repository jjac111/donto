import { describe, it, expect, beforeEach } from 'vitest'
import {
  supabase,
  supabaseAdmin,
  TEST_USERS,
  TEST_CLINICS,
  loginWithAutoClinicSelection,
  getCurrentActiveClinic,
} from './setup'

describe('Debug Auto-Clinic Selection', () => {
  beforeEach(async () => {
    // Clean slate for each test
    /*await supabase.auth.signOut()
    
    // Clear any existing sessions for test users
    const testUserIds = Object.values(TEST_USERS).map(user => user.id)
    await supabaseAdmin
      .from('user_sessions')
      .delete()
      .in('user_id', testUserIds)
      */
  })

  it('should do nothing', async () => {})
})
