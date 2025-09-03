import { describe, it, expect, beforeEach } from 'vitest'
import {
  supabase,
  supabaseAdmin,
  TEST_USERS,
  TEST_CLINICS,
  createFullUserSession,
} from '../../setup'

describe('Person/Identity Tests', () => {
  beforeEach(async () => {
    await supabase.auth.signOut()

    // Clean up any test records from previous failed runs
    await supabaseAdmin.from('persons').delete().eq('last_name', 'CrossClinic')

    await supabaseAdmin.from('persons').delete().eq('last_name', 'Duplicate')

    await supabaseAdmin.from('persons').delete().eq('last_name', 'Usuario')

    await supabaseAdmin.from('persons').delete().eq('last_name', 'Cascade')
  })

  describe('National ID Uniqueness', () => {
    it('should prevent duplicate national_id within same clinic', async () => {
      // Login as clinic1Admin
      await createFullUserSession(
        TEST_USERS.clinic1Admin.email,
        TEST_USERS.clinic1Admin.password
      )

      // Try to create person with existing national_id in same clinic
      // (We know '1234567890' exists for clinic1 from seed data)
      const { data, error } = await supabase.from('persons').insert({
        clinic_id: TEST_CLINICS.clinic1,
        national_id: '1234567890', // Duplicate within clinic1
        country: 'ECU',
        first_name: 'Test',
        last_name: 'Duplicate',
        date_of_birth: '1990-01-01',
        sex: 'M',
      })

      // Should fail due to unique constraint
      expect(error).not.toBeNull()
      expect(error!.code).toBe('23505') // Unique violation
      expect(error!.message).toContain(
        'duplicate key value violates unique constraint'
      )
    })

    it('should allow same national_id across different clinics', async () => {
      // Login as clinic2Admin
      await createFullUserSession(
        TEST_USERS.clinic2Admin.email,
        TEST_USERS.clinic2Admin.password
      )

      // Create person with same national_id as exists in clinic1, but in clinic2
      // Use national_id that exists in clinic1 but NOT in clinic2
      const { data, error } = await supabase.from('persons').insert({
        clinic_id: TEST_CLINICS.clinic2,
        national_id: '2345678901', // This exists in clinic1 but not clinic2
        country: 'ECU',
        first_name: 'Test',
        last_name: 'CrossClinic',
        date_of_birth: '1990-01-01',
        sex: 'F',
      })

      // Should succeed - same national_id allowed across different clinics
      expect(error).toBeNull()
      expect(data).toBeDefined()

      // Cleanup - delete the test record we just created
      if (data && data.length > 0) {
        await supabaseAdmin.from('persons').delete().eq('id', data[0].id)
      }
    })
  })

  describe('find_or_create_person Function', () => {
    it('should find existing person when national_id exists', async () => {
      // Login as clinic1Admin
      await createFullUserSession(
        TEST_USERS.clinic1Admin.email,
        TEST_USERS.clinic1Admin.password
      )

      // Call find_or_create_person with existing national_id
      const { data: personId, error } = await supabase.rpc(
        'find_or_create_person',
        {
          p_national_id: '1234567890', // Exists in clinic1
          p_country: 'ECU',
          p_first_name: 'María', // Original name
          p_last_name: 'González',
          p_date_of_birth: '1985-03-15',
          p_sex: 'F',
        }
      )

      expect(error).toBeNull()
      expect(personId).toBeDefined()

      // Verify it found the existing person, not created new one
      const { data: person } = await supabase
        .from('persons')
        .select('*')
        .eq('id', personId)
        .single()

      expect(person.first_name).toBe('María') // Should be original name
      expect(person.national_id).toBe('1234567890')
      expect(person.clinic_id).toBe(TEST_CLINICS.clinic1)
    })

    it('should create new person when national_id does not exist', async () => {
      // Login as clinic1Admin
      await createFullUserSession(
        TEST_USERS.clinic1Admin.email,
        TEST_USERS.clinic1Admin.password
      )

      const newNationalId = '9999999999'

      // Call find_or_create_person with new national_id
      const { data: personId, error } = await supabase.rpc(
        'find_or_create_person',
        {
          p_national_id: newNationalId,
          p_country: 'ECU',
          p_first_name: 'Nuevo',
          p_last_name: 'Usuario',
          p_date_of_birth: '1990-01-01',
          p_sex: 'M',
        }
      )

      expect(error).toBeNull()
      expect(personId).toBeDefined()

      // Verify new person was created
      const { data: person } = await supabase
        .from('persons')
        .select('*')
        .eq('id', personId)
        .single()

      expect(person.first_name).toBe('Nuevo')
      expect(person.last_name).toBe('Usuario')
      expect(person.national_id).toBe(newNationalId)
      expect(person.clinic_id).toBe(TEST_CLINICS.clinic1)

      // Cleanup
      await supabaseAdmin.from('persons').delete().eq('id', personId)
    })
  })

  describe('Person Data Integrity', () => {
    it('should cascade delete person to patients/providers', async () => {
      // Login as clinic1Admin
      await createFullUserSession(
        TEST_USERS.clinic1Admin.email,
        TEST_USERS.clinic1Admin.password
      )

      // Create a test person
      const { data: newPerson, error: personError } = await supabase
        .from('persons')
        .insert({
          clinic_id: TEST_CLINICS.clinic1,
          national_id: '8888888888',
          country: 'ECU',
          first_name: 'Test',
          last_name: 'Cascade',
          date_of_birth: '1985-01-01',
          sex: 'M',
        })
        .select()
        .single()

      expect(personError).toBeNull()

      // Create a patient linked to this person
      const { data: newPatient, error: patientError } = await supabase
        .from('patients')
        .insert({
          person_id: newPerson.id,
          clinic_id: TEST_CLINICS.clinic1,
          medical_history: 'Test history',
        })
        .select()
        .single()

      expect(patientError).toBeNull()

      // Delete the person
      const { error: deleteError } = await supabaseAdmin
        .from('persons')
        .delete()
        .eq('id', newPerson.id)

      expect(deleteError).toBeNull()

      // Verify patient was also deleted (cascade)
      const { data: orphanedPatient } = await supabase
        .from('patients')
        .select('*')
        .eq('id', newPatient.id)

      expect(orphanedPatient).toEqual([]) // Should be empty due to cascade delete
    })

    it('should reflect person updates in all roles', async () => {
      // Login as clinic1Admin
      await createFullUserSession(
        TEST_USERS.clinic1Admin.email,
        TEST_USERS.clinic1Admin.password
      )

      // Update an existing person's name
      const { error: updateError } = await supabase
        .from('persons')
        .update({
          first_name: 'Updated',
          last_name: 'Name',
        })
        .eq('national_id', '1234567890')
        .eq('clinic_id', TEST_CLINICS.clinic1)

      expect(updateError).toBeNull()

      // Verify the update is reflected when querying patients
      const { data: patients } = await supabase
        .from('patients')
        .select(
          `
          id,
          persons!inner (
            first_name,
            last_name,
            national_id
          )
        `
        )
        .eq('persons.national_id', '1234567890')

      expect(patients!.length).toBeGreaterThan(0)
      expect(patients![0].persons.first_name).toBe('Updated')
      expect(patients![0].persons.last_name).toBe('Name')

      // Restore original name for other tests
      await supabaseAdmin
        .from('persons')
        .update({
          first_name: 'María',
          last_name: 'González',
        })
        .eq('national_id', '1234567890')
        .eq('clinic_id', TEST_CLINICS.clinic1)
    })
  })
})
