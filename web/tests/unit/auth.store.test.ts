import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useAuthStore } from '@/store/auth'

// Mock supabase module used by the store
vi.mock('@/lib/api', () => {
  const mockAuth = {
    getUser: vi.fn(),
    getSession: vi.fn(),
    signInWithPassword: vi.fn(),
    signOut: vi.fn(),
    onAuthStateChange: vi.fn(() => ({
      data: { subscription: { unsubscribe: vi.fn() } },
    })),
  }

  const mockFrom = vi.fn()
  const mockRpc = vi.fn()

  const supabase = {
    auth: mockAuth,
    from: mockFrom,
    rpc: mockRpc,
  }

  return { supabase }
})

// Convenient accessors to the mocked supabase
import { supabase } from '@/lib/api'

function resetStore() {
  const {
    setUser,
    setClinicName,
    setAvailableClinics,
    setNeedsClinicSelection,
    setLoading,
    setError,
  } = useAuthStore.getState()
  setUser(null)
  setClinicName(null)
  setAvailableClinics(null)
  setNeedsClinicSelection(false)
  setLoading(false)
  setError(null)
}

describe('Auth Store', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetStore()
  })

  it('login sets user and triggers profile fetch', async () => {
    // Arrange
    ;(supabase.auth.signInWithPassword as any).mockResolvedValue({
      data: { user: { id: 'u1', email: 'test@test.com', user_metadata: {} } },
      error: null,
    })
    ;(supabase.rpc as any).mockResolvedValue({ data: null, error: null }) // auto_select_clinic_on_login

    const fetchSpy = vi.spyOn(useAuthStore.getState(), 'fetchUserProfile')

    // Act
    await useAuthStore.getState().login('x@test.com', 'pw')

    // Assert
    expect(useAuthStore.getState().isAuthenticated).toBe(true)
    expect(fetchSpy).toHaveBeenCalled()
  })

  it('fetchUserProfile populates availableClinics when no active clinic', async () => {
    ;(supabase.auth.getUser as any).mockResolvedValue({
      data: { user: { id: 'u1' } },
    })
    ;(supabase.rpc as any).mockResolvedValue({ data: null, error: null }) // get_current_active_clinic => null

    // profiles select returns 2 rows
    ;(supabase.from as any).mockReturnValue({
      select: () => ({
        eq: () => ({
          eq: () => ({
            data: [
              {
                clinic_id: 'c1',
                clinic: { name: 'Clinic 1' },
                role: 'admin',
                provider_id: null,
              },
              {
                clinic_id: 'c2',
                clinic: { name: 'Clinic 2' },
                role: 'provider',
                provider_id: 'p1',
              },
            ],
            error: null,
          }),
        }),
      }),
    })

    await useAuthStore.getState().fetchUserProfile()

    expect(useAuthStore.getState().needsClinicSelection).toBe(true)
    expect(useAuthStore.getState().availableClinics?.length).toBe(2)
  })

  it('selectClinic calls RPC and refreshes profile', async () => {
    ;(supabase.rpc as any).mockResolvedValue({
      data: 'session-token',
      error: null,
    })
    const fetchSpy = vi.spyOn(useAuthStore.getState(), 'fetchUserProfile')

    await useAuthStore.getState().selectClinic('c1')

    expect(supabase.rpc).toHaveBeenCalledWith('set_active_clinic', {
      clinic_uuid: 'c1',
      session_duration_hours: 24,
    })
    expect(fetchSpy).toHaveBeenCalled()
  })

  it('logout clears user_sessions then signs out and resets state', async () => {
    ;(supabase.auth.getUser as any).mockResolvedValue({
      data: { user: { id: 'u1' } },
    })
    const deleteMock = vi.fn().mockResolvedValue({ error: null })
    ;(supabase.from as any).mockReturnValue({
      delete: () => ({ eq: deleteMock }),
    })
    ;(supabase.auth.signOut as any).mockResolvedValue({ error: null })

    useAuthStore.setState({
      user: {
        id: 'u1',
        email: 'x',
        displayName: '',
        role: undefined,
        clinicId: undefined,
      },
      isAuthenticated: true,
    } as any)

    await useAuthStore.getState().logout()

    expect(deleteMock).toHaveBeenCalled()
    expect(useAuthStore.getState().isAuthenticated).toBe(false)
    expect(useAuthStore.getState().user).toBeNull()
  })
})
