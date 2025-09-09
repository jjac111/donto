// Test setup and utilities for TanStack Query hooks testing

import { beforeAll, afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'

// Mock environment variables
beforeAll(() => {
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'http://localhost:54321')
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'mock-anon-key')
})

// Clean up after each test
afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

// Mock IntersectionObserver (for components that might use it)
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Export common test utilities
export const mockPatient = {
  id: 'test-patient-id',
  personId: 'test-person-id',
  clinicId: 'test-clinic-id',
  displayName: 'John Doe',
  age: 30,
  createdAt: '2024-01-01T00:00:00Z',
  person: {
    id: 'test-person-id',
    clinicId: 'test-clinic-id',
    firstName: 'John',
    lastName: 'Doe',
    dateOfBirth: new Date('1994-01-01'),
    email: 'john@example.com',
    nationalId: '123456789',
    country: 'EC',
  },
}

export const mockAppointment = {
  id: 'test-appointment-id',
  clinicId: 'test-clinic-id',
  patientId: 'test-patient-id',
  providerId: 'test-provider-id',
  appointmentDate: new Date('2024-01-15T10:00:00Z'),
  durationMinutes: 60,
  appointmentType: 'checkup',
  status: 'scheduled',
  notes: 'Regular checkup',
  endTime: new Date('2024-01-15T11:00:00Z'),
  isToday: false,
  isPast: false,
  statusColor: 'blue',
}
