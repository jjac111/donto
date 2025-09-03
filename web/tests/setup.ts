import { beforeAll, beforeEach, afterAll, afterEach } from 'vitest'
import { createClient } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'

// Test environment variables
const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY 
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

// Global test clients
export let supabase: SupabaseClient
export let supabaseAdmin: SupabaseClient

// Test user credentials (IDs match seed.sql)
export const TEST_USERS = {
  clinic1Admin: {
    email: 'clinic1-admin@test.com',
    password: 'testpassword123',
    id: '550e8400-e29b-41d4-a716-446655530001',
  },
  clinic1Provider: {
    email: 'clinic1-provider@test.com',
    password: 'testpassword123', 
    id: '550e8400-e29b-41d4-a716-446655530002',
  },
  clinic2Admin: {
    email: 'clinic2-admin@test.com', 
    password: 'testpassword123',
    id: '550e8400-e29b-41d4-a716-446655530003',
  },
  noAccessUser: {
    email: 'no-access@test.com',
    password: 'testpassword123',
    id: '550e8400-e29b-41d4-a716-446655530004',
  },
}

// Test clinic IDs (match seed.sql)
export const TEST_CLINICS = {
  clinic1: '550e8400-e29b-41d4-a716-446655440001',
  clinic2: '550e8400-e29b-41d4-a716-446655440002',
  emptyClinic: '550e8400-e29b-41d4-a716-446655440003',
}

beforeAll(async () => {
  // Initialize Supabase clients
  supabase = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!)
  supabaseAdmin = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  console.log('🧪 Setting up test database...')
  
  // Run seed data
  await seedTestData()
  
  console.log('✅ Test database setup complete')
})

/* afterAll(async () => {
  console.log('🧹 Cleaning up test database...')
  await cleanupTestData()
  console.log('✅ Test database cleanup complete')
}) */

beforeEach(async () => {
  // Clear any existing sessions before each test
  await supabase.auth.signOut()
})

afterEach(async () => {
  // Cleanup after each test
  await supabase.auth.signOut()
})

async function seedTestData() {
  // This function will seed test data
  // For now, we'll implement a basic version
  console.log('📊 Seeding test data...')
  
  // TODO: Implement full seed data loading
  // This will be expanded when we create the seed.sql file
}

async function cleanupTestData() {
  // Clean up test data if needed
  // For development, we might want to keep data between runs
  console.log('🗑️ Cleaning up test data...')
}

// Utility function to create authenticated user session
export async function createUserSession(userEmail: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: userEmail,
    password: password,
  })
  
  if (error) {
    throw new Error(`Failed to sign in test user: ${error.message}`)
  }
  
  return data
}

// Utility function to set active clinic for current user
export async function setActiveClinic(clinicId: string) {
  const { data, error } = await supabase.rpc('set_active_clinic', {
    clinic_uuid: clinicId,
  })
  
  if (error) {
    throw new Error(`Failed to set active clinic: ${error.message}`)
  }
  
  return data
}

// Utility function to get current active clinic
export async function getCurrentActiveClinic() {
  const { data, error } = await supabase.rpc('get_current_active_clinic')
  
  if (error) {
    throw new Error(`Failed to get active clinic: ${error.message}`)
  }
  
  return data
}

// Utility function to login and auto-select clinic if user has only one
export async function loginWithAutoClinicSelection(userEmail: string, password: string) {
  // First, sign in the user
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: userEmail,
    password: password,
  })
  
  if (authError) {
    throw new Error(`Failed to sign in test user: ${authError.message}`)
  }
  
  // Try to auto-select clinic
  const { data: sessionToken, error: clinicError } = await supabase.rpc('auto_select_clinic_on_login')
  
  if (clinicError) {
    throw new Error(`Failed to auto-select clinic: ${clinicError.message}`)
  }
  
  return {
    authData,
    sessionToken, // Will be null if user has 0 or multiple clinics
    needsClinicSelection: sessionToken === null
  }
}

// Helper to create a full authenticated session (login + clinic selection)
export async function createFullUserSession(userEmail: string, password: string, clinicId?: string) {
  const loginResult = await loginWithAutoClinicSelection(userEmail, password)
  
  // If auto-selection worked, we're done
  if (!loginResult.needsClinicSelection) {
    return {
      ...loginResult,
      activeClinic: await getCurrentActiveClinic()
    }
  }
  
  // If manual selection needed and clinicId provided
  if (clinicId) {
    const sessionToken = await setActiveClinic(clinicId)
    return {
      ...loginResult,
      sessionToken,
      activeClinic: clinicId,
      needsClinicSelection: false
    }
  }
  
  // User needs to select clinic but none provided
  throw new Error('User has multiple/no clinics and requires manual clinic selection')
}
