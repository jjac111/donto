import { describe, it, expect, beforeEach } from 'vitest'
import {
  supabase,
  supabaseAdmin,
  TEST_USERS,
  TEST_CLINICS,
  createFullUserSession,
} from '../../setup'

describe('Clinic Isolation Tests', () => {
  beforeEach(async () => {
    await supabase.auth.signOut()
  })

  describe('Basic Clinic Isolation', () => {
    it('should only see persons from active clinic', async () => {
      // Login as clinic1 admin
      await createFullUserSession(
        TEST_USERS.clinic1Admin.email,
        TEST_USERS.clinic1Admin.password
      )

      const { data: persons, error } = await supabase
        .from('persons')
        .select('*')

      expect(error).toBeNull()
      expect(persons).toBeDefined()
      // All persons should be from clinic1
      persons!.forEach(person => {
        expect(person.clinic_id).toBe(TEST_CLINICS.clinic1)
      })
    })

    it('should only see patients from active clinic', async () => {
      await createFullUserSession(
        TEST_USERS.clinic1Admin.email,
        TEST_USERS.clinic1Admin.password
      )

      const { data: patients, error } = await supabase
        .from('patients')
        .select('*')

      expect(error).toBeNull()
      expect(patients).toBeDefined()
      patients!.forEach(patient => {
        expect(patient.clinic_id).toBe(TEST_CLINICS.clinic1)
      })
    })

    it('should only see providers from active clinic', async () => {
      await createFullUserSession(
        TEST_USERS.clinic1Admin.email,
        TEST_USERS.clinic1Admin.password
      )

      const { data: providers, error } = await supabase
        .from('providers')
        .select('*')

      expect(error).toBeNull()
      expect(providers).toBeDefined()
      providers!.forEach(provider => {
        expect(provider.clinic_id).toBe(TEST_CLINICS.clinic1)
      })
    })

    it('should only see appointments from active clinic', async () => {
      await createFullUserSession(
        TEST_USERS.clinic1Admin.email,
        TEST_USERS.clinic1Admin.password
      )

      const { data: appointments, error } = await supabase
        .from('appointments')
        .select('*')

      expect(error).toBeNull()
      expect(appointments).toBeDefined()
      appointments!.forEach(appointment => {
        expect(appointment.clinic_id).toBe(TEST_CLINICS.clinic1)
      })
    })
  })

  describe('Cross-Clinic Access Prevention', () => {
    it('should not see other clinic data when switching clinics', async () => {
      // Login as clinic1 admin and verify clinic1 data
      await createFullUserSession(
        TEST_USERS.clinic1Admin.email,
        TEST_USERS.clinic1Admin.password
      )

      const { data: clinic1Patients } = await supabase
        .from('patients')
        .select('*')

      expect(clinic1Patients!.length).toBeGreaterThan(0)
      clinic1Patients!.forEach(patient => {
        expect(patient.clinic_id).toBe(TEST_CLINICS.clinic1)
      })

      // Logout and login as clinic2 admin
      await supabase.auth.signOut()
      await createFullUserSession(
        TEST_USERS.clinic2Admin.email,
        TEST_USERS.clinic2Admin.password
      )

      const { data: clinic2Patients } = await supabase
        .from('patients')
        .select('*')

      expect(clinic2Patients!.length).toBeGreaterThan(0)
      clinic2Patients!.forEach(patient => {
        expect(patient.clinic_id).toBe(TEST_CLINICS.clinic2)
      })

      // Verify no overlap in patient IDs
      const clinic1PatientIds = clinic1Patients!.map(p => p.id)
      const clinic2PatientIds = clinic2Patients!.map(p => p.id)
      const overlap = clinic1PatientIds.filter(id =>
        clinic2PatientIds.includes(id)
      )
      expect(overlap).toHaveLength(0)
    })

    it('should block access when no active clinic set', async () => {
      // Login but don't set clinic (deactivated user)
      const { data, error: authError } = await supabase.auth.signInWithPassword(
        {
          email: TEST_USERS.deactivatedUser.email,
          password: TEST_USERS.deactivatedUser.password,
        }
      )

      expect(authError).toBeNull()
      expect(data.user).toBeTruthy()

      // Try to access patients without active clinic
      const { data: patients, error } = await supabase
        .from('patients')
        .select('*')

      expect(error).toBeNull()
      expect(patients).toEqual([]) // Should return empty array due to RLS
    })
  })

  describe('Search Functions Respect Clinic Boundaries', () => {
    it('should only return clinic data from search_patients', async () => {
      await createFullUserSession(
        TEST_USERS.clinic1Admin.email,
        TEST_USERS.clinic1Admin.password
      )

      const { data: searchResults, error } = await supabase.rpc(
        'search_patients',
        {
          search_query: 'María',
          result_limit: 10,
        }
      )

      expect(error).toBeNull()
      expect(searchResults).toBeDefined()

      // All results should be from clinic1 patients
      if (searchResults && searchResults.length > 0) {
        // We need to check via a join since search_patients doesn't return clinic_id directly
        // Let's verify by checking if we can find these patient IDs in our clinic
        const patientIds = searchResults.map((p: any) => p.patient_id)

        const { data: patients } = await supabase
          .from('patients')
          .select('id, clinic_id')
          .in('id', patientIds)

        patients!.forEach(patient => {
          expect(patient.clinic_id).toBe(TEST_CLINICS.clinic1)
        })
      }
    })

    it('should only return clinic data from search_providers', async () => {
      await createFullUserSession(
        TEST_USERS.clinic1Admin.email,
        TEST_USERS.clinic1Admin.password
      )

      const { data: searchResults, error } = await supabase.rpc(
        'search_providers',
        {
          search_query: 'Roberto',
          result_limit: 10,
        }
      )

      expect(error).toBeNull()
      expect(searchResults).toBeDefined()

      if (searchResults && searchResults.length > 0) {
        const providerIds = searchResults.map((p: any) => p.provider_id)

        const { data: providers } = await supabase
          .from('providers')
          .select('id, clinic_id')
          .in('id', providerIds)

        providers!.forEach(provider => {
          expect(provider.clinic_id).toBe(TEST_CLINICS.clinic1)
        })
      }
    })

    it('should only return clinic data from search_persons', async () => {
      await createFullUserSession(
        TEST_USERS.clinic1Admin.email,
        TEST_USERS.clinic1Admin.password
      )

      const { data: searchResults, error } = await supabase.rpc(
        'search_persons',
        {
          search_query: 'María',
          result_limit: 10,
        }
      )

      expect(error).toBeNull()
      expect(searchResults).toBeDefined()

      if (searchResults && searchResults.length > 0) {
        searchResults.forEach((person: any) => {
          expect(person.clinic_id).toBe(TEST_CLINICS.clinic1)
        })
      }
    })
  })

  describe('Enhanced RLS Policy Tests', () => {
    it('should block access when user profile is deactivated (inactive clinic access)', async () => {
      // Create a session for clinic1Admin first
      await createFullUserSession(
        TEST_USERS.clinic1Admin.email,
        TEST_USERS.clinic1Admin.password
      )

      // Verify initial access works
      const { data: initialPatients, error: initialError } = await supabase
        .from('patients')
        .select('*')

      expect(initialError).toBeNull()
      expect(initialPatients!.length).toBeGreaterThan(0)

      // Deactivate the user's profile for the clinic
      const { error: deactivateError } = await supabaseAdmin
        .from('profiles')
        .update({ is_active: false })
        .eq('user_id', TEST_USERS.clinic1Admin.id)
        .eq('clinic_id', TEST_CLINICS.clinic1)

      expect(deactivateError).toBeNull()

      // Try to access data - should now be blocked by updated get_current_active_clinic()
      const { data: blockedPatients, error: blockedError } = await supabase
        .from('patients')
        .select('*')

      expect(blockedError).toBeNull()
      expect(blockedPatients).toEqual([]) // Should be empty due to inactive profile

      // Reactivate for cleanup (important for other tests)
      await supabaseAdmin
        .from('profiles')
        .update({ is_active: true })
        .eq('user_id', TEST_USERS.clinic1Admin.id)
        .eq('clinic_id', TEST_CLINICS.clinic1)
    })

    it('should only see clinics user has access to', async () => {
      await createFullUserSession(
        TEST_USERS.clinic1Admin.email,
        TEST_USERS.clinic1Admin.password
      )

      const { data: clinics, error } = await supabase
        .from('clinics')
        .select('*')

      expect(error).toBeNull()
      expect(clinics).toBeDefined()
      // Should only see clinic1 since user only has access to that clinic
      expect(clinics!.length).toBe(1)
      expect(clinics![0].id).toBe(TEST_CLINICS.clinic1)
    })

    it('should only see cost estimates from active clinic', async () => {
      await createFullUserSession(
        TEST_USERS.clinic1Admin.email,
        TEST_USERS.clinic1Admin.password
      )

      const { data: costEstimates, error } = await supabase.from(
        'cost_estimates'
      ).select(`
          *,
          patients!inner (
            id,
            clinic_id
          )
        `)

      expect(error).toBeNull()
      expect(costEstimates).toBeDefined()

      if (costEstimates && costEstimates.length > 0) {
        costEstimates.forEach((estimate: any) => {
          expect(estimate.patients.clinic_id).toBe(TEST_CLINICS.clinic1)
        })
      }
    })

    it('should only see cost estimate items from active clinic', async () => {
      await createFullUserSession(
        TEST_USERS.clinic1Admin.email,
        TEST_USERS.clinic1Admin.password
      )

      const { data: costEstimateItems, error } = await supabase.from(
        'cost_estimate_items'
      ).select(`
          *,
          cost_estimates!inner (
            id,
            patients!inner (
              id,
              clinic_id
            )
          )
        `)

      expect(error).toBeNull()
      expect(costEstimateItems).toBeDefined()

      if (costEstimateItems && costEstimateItems.length > 0) {
        costEstimateItems.forEach((item: any) => {
          expect(item.cost_estimates.patients.clinic_id).toBe(
            TEST_CLINICS.clinic1
          )
        })
      }
    })

    it('should only see patient representatives from active clinic', async () => {
      await createFullUserSession(
        TEST_USERS.clinic1Admin.email,
        TEST_USERS.clinic1Admin.password
      )

      const { data: patientRepresentatives, error } = await supabase.from(
        'patient_representatives'
      ).select(`
          *,
          patients!inner (
            id,
            clinic_id
          )
        `)

      expect(error).toBeNull()
      expect(patientRepresentatives).toBeDefined()

      if (patientRepresentatives && patientRepresentatives.length > 0) {
        patientRepresentatives.forEach((rep: any) => {
          expect(rep.patients.clinic_id).toBe(TEST_CLINICS.clinic1)
        })
      }
    })

    it('should prevent cross-clinic data leakage in join queries', async () => {
      // Login as clinic1Admin
      await createFullUserSession(
        TEST_USERS.clinic1Admin.email,
        TEST_USERS.clinic1Admin.password
      )

      // Complex query with joins across appointments, patients, and persons
      const { data: appointmentData, error } = await supabase.from(
        'appointments'
      ).select(`
          id,
          clinic_id,
          patient_id,
          patients!inner (
            id,
            clinic_id,
            persons!inner (
              id,
              clinic_id,
              first_name,
              last_name
            )
          )
        `)

      expect(error).toBeNull()
      expect(appointmentData).toBeDefined()

      // Verify all returned data belongs to clinic1
      if (appointmentData && appointmentData.length > 0) {
        appointmentData.forEach((appointment: any) => {
          expect(appointment.clinic_id).toBe(TEST_CLINICS.clinic1)
          expect(appointment.patients.clinic_id).toBe(TEST_CLINICS.clinic1)
          expect(appointment.patients.persons.clinic_id).toBe(
            TEST_CLINICS.clinic1
          )
        })
      }
    })
  })
})
