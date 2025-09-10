import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { User } from '@/types'
import { supabase } from '@/lib/api'

// Auth state listener to handle session changes
let authStateListenerInitialized = false

export interface AuthState {
  // State
  user: User | null
  clinicId: string | null
  clinicName: string | null
  availableClinics: Array<{
    clinicId: string
    clinicName: string
    role: string
    providerId?: string
  }> | null
  needsClinicSelection: boolean
  isLoading: boolean
  error: string | null

  // Computed
  isAuthenticated: boolean

  // Actions
  setUser: (user: User | null) => void
  setClinicId: (clinicId: string | null) => void
  setClinicName: (name: string | null) => void
  setAvailableClinics: (clinics: AuthState['availableClinics']) => void
  setNeedsClinicSelection: (needs: boolean) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  clearError: () => void
  fetchUserProfile: () => Promise<void>
  selectClinic: (clinicId: string) => Promise<void>
  loadUserClinics: () => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        user: null,
        clinicId: null,
        clinicName: null,
        availableClinics: null,
        needsClinicSelection: false,
        isLoading: true, // Start with loading true to prevent flash
        error: null,

        // Computed - moved out of getter to fix persistence issues
        isAuthenticated: false,

        // Actions
        setUser: user =>
          set({ user, isAuthenticated: user !== null }, false, 'auth/setUser'),

        setClinicId: clinicId => set({ clinicId }, false, 'auth/setClinicId'),

        setClinicName: clinicName =>
          set({ clinicName }, false, 'auth/setClinicName'),

        setAvailableClinics: availableClinics =>
          set({ availableClinics }, false, 'auth/setAvailableClinics'),

        setNeedsClinicSelection: needsClinicSelection =>
          set({ needsClinicSelection }, false, 'auth/setNeedsClinicSelection'),

        setLoading: isLoading => set({ isLoading }, false, 'auth/setLoading'),

        setError: error => set({ error }, false, 'auth/setError'),

        clearError: () => set({ error: null }, false, 'auth/clearError'),

        fetchUserProfile: async () => {
          try {
            const { data: authUser } = await supabase.auth.getUser()
            const userId = authUser.user?.id
            if (!userId) return

            // Ask backend for current active clinic

            const { data: currentClinicId, error: clinicErr } =
              await supabase.rpc('get_current_active_clinic')
            if (clinicErr) {
              console.error(
                '❌ fetchUserProfile: Error getting active clinic:',
                clinicErr
              )
              throw clinicErr
            }

            if (currentClinicId) {
              // Fetch the profile for the active clinic only
              const { data: activeProfile, error: profileErr } = await supabase
                .from('profiles')
                .select(
                  `
                  clinic_id,
                  clinic:clinic_id(name),
                  provider_id,
                  provider:provider_id(
                    person:person_id(first_name, last_name)
                  )
                `
                )
                .eq('user_id', userId)
                .eq('clinic_id', currentClinicId)
                .eq('is_active', true)
                .single()

              if (profileErr) throw profileErr

              if (activeProfile) {
                const clinicName = (activeProfile as any).clinic?.name || ''
                const firstName =
                  (activeProfile as any).provider?.person?.first_name || ''
                const lastName =
                  (activeProfile as any).provider?.person?.last_name || ''
                const displayName =
                  `${firstName} ${lastName}`.trim() || 'Usuario'

                set(
                  {
                    clinicId: activeProfile.clinic_id,
                    clinicName,
                    needsClinicSelection: false,
                  },
                  false,
                  'auth/fetchUserProfile/success'
                )

                // Update user with profile data
                const currentUser = get().user
                if (currentUser) {
                  set(
                    {
                      user: {
                        ...currentUser,
                        firstName,
                        lastName,
                        displayName,
                        clinicId: activeProfile.clinic_id,
                      },
                    },
                    false,
                    'auth/updateUserFromProfile'
                  )
                }
              }

              // Also load the list of clinics for switcher UI
              const { data: allProfiles, error: listErr } = await supabase
                .from('profiles')
                .select(
                  `
                  clinic_id,
                  clinic:clinic_id(name),
                  role,
                  provider_id
                `
                )
                .eq('user_id', userId)
                .eq('is_active', true)

              if (!listErr && allProfiles) {
                const clinics = (allProfiles as any[]).map(profile => ({
                  clinicId: (profile as any).clinic_id,
                  clinicName: (profile as any).clinic?.name || '',
                  role: (profile as any).role,
                  providerId: (profile as any).provider_id,
                }))

                set(
                  { availableClinics: clinics },
                  false,
                  'auth/fetchUserProfile/clinics'
                )
              }
            } else {
              // No active clinic: fetch all profiles (array) for selection UI
              const { data: allProfiles, error: allErr } = await supabase
                .from('profiles')
                .select(
                  `
                  clinic_id,
                  clinic:clinic_id(name),
                  role,
                  provider_id
                `
                )
                .eq('user_id', userId)
                .eq('is_active', true)

              if (allErr) {
                console.error(
                  '❌ fetchUserProfile: Error fetching profiles:',
                  allErr
                )
                throw allErr
              }

              if (allProfiles && allProfiles.length > 0) {
                const clinics = (allProfiles as any[]).map(profile => ({
                  clinicId: (profile as any).clinic_id,
                  clinicName: (profile as any).clinic?.name || '',
                  role: (profile as any).role,
                  providerId: (profile as any).provider_id,
                }))

                set(
                  {
                    availableClinics: clinics,
                    needsClinicSelection: true,
                    clinicId: null,
                    clinicName: null,
                  },
                  false,
                  'auth/fetchUserProfile/multipleClinics'
                )
              } else {
                // No profiles found - still require selection (UI can show empty)
                set(
                  {
                    availableClinics: [],
                    needsClinicSelection: true,
                    clinicId: null,
                    clinicName: null,
                  },
                  false,
                  'auth/fetchUserProfile/noProfiles'
                )
              }
            }
          } catch (error) {
            console.warn('Failed to fetch user profile:', error)
          }
        },

        selectClinic: async (clinicId: string) => {
          try {
            // Call set_active_clinic RPC function
            const { data, error } = await supabase.rpc('set_active_clinic', {
              clinic_uuid: clinicId,
              session_duration_hours: 24,
            })

            if (error) {
              console.error('❌ selectClinic: RPC error:', error)
              throw error
            }

            // Refresh user profile to get the selected clinic data
            await get().fetchUserProfile()
          } catch (error) {
            set(
              { error: 'Error al seleccionar clínica' },
              false,
              'auth/selectClinic/error'
            )
          }
        },

        loadUserClinics: async () => {
          try {
            const { data: authUser } = await supabase.auth.getUser()
            const userId = authUser.user?.id
            if (!userId) return

            const { data: allProfiles, error } = await supabase
              .from('profiles')
              .select(
                `
                clinic_id,
                clinic:clinic_id(name),
                role,
                provider_id
              `
              )
              .eq('user_id', userId)
              .eq('is_active', true)

            if (error) return

            const clinics = (allProfiles || []).map(profile => ({
              clinicId: (profile as any).clinic_id,
              clinicName: (profile as any).clinic?.name || '',
              role: (profile as any).role,
              providerId: (profile as any).provider_id,
            }))

            set({ availableClinics: clinics }, false, 'auth/loadUserClinics')
          } catch (e) {
            // noop
          }
        },

        login: async (email: string, password: string) => {
          set({ isLoading: true, error: null }, false, 'auth/login/start')

          try {
            const { data, error } = await supabase.auth.signInWithPassword({
              email,
              password,
            })

            if (error) {
              throw new Error(error.message)
            }

            if (data.user) {
              // Try auto-clinic selection
              await supabase.rpc('auto_select_clinic_on_login')

              // Create our app user from Supabase user
              const user: User = {
                id: data.user.id,
                email: data.user.email!,
                firstName: data.user.user_metadata?.first_name,
                lastName: data.user.user_metadata?.last_name,
                role: data.user.user_metadata?.role,
                clinicId: data.user.user_metadata?.clinic_id,
                displayName:
                  `${data.user.user_metadata?.first_name} ${data.user.user_metadata?.last_name}`.trim(),
              }

              set(
                { user, isLoading: false, isAuthenticated: true },
                false,
                'auth/login/success'
              )

              // Fetch user profile data
              get().fetchUserProfile()
            } else {
              throw new Error('No user data received')
            }
          } catch (error) {
            set(
              {
                error:
                  error instanceof Error
                    ? error.message
                    : 'Error al iniciar sesión',
                isLoading: false,
              },
              false,
              'auth/login/error'
            )
          }
        },

        logout: async () => {
          set({ isLoading: true }, false, 'auth/logout/start')

          try {
            // Expire DB-backed clinic sessions before signing out (RLS needs auth)
            // Use UPDATE expires_at instead of DELETE to maintain audit trail
            try {
              const { data: authUser } = await supabase.auth.getUser()
              const userId = authUser.user?.id
              if (userId) {
                await supabase
                  .from('user_sessions')
                  .update({ expires_at: new Date().toISOString() })
                  .eq('user_id', userId)
              }
            } catch (e) {
              console.warn('Failed to expire user_sessions on logout:', e)
            }

            await supabase.auth.signOut()
            set(
              {
                user: null,
                clinicId: null,
                clinicName: null,
                availableClinics: null,
                needsClinicSelection: false,
                error: null,
                isAuthenticated: false,
                isLoading: false,
              },
              false,
              'auth/logout/success'
            )
          } catch (error) {
            console.error('Logout error:', error)
            // Even if logout fails, clear local state
            set(
              {
                user: null,
                clinicId: null,
                clinicName: null,
                availableClinics: null,
                needsClinicSelection: false,
                error: null,
                isAuthenticated: false,
                isLoading: false,
              },
              false,
              'auth/logout/force'
            )
          }
        },
      }),
      {
        name: 'donto-auth', // localStorage key
        partialize: state => ({
          user: state.user,
          clinicId: state.clinicId,
          clinicName: state.clinicName,
          needsClinicSelection: state.needsClinicSelection,
          isAuthenticated: state.isAuthenticated,
        }), // Persist user, clinic, and auth state
      }
    ),
    {
      name: 'auth-store',
      enabled: process.env.NODE_ENV === 'development',
      store: 'Auth Store',
    }
  )
)

// Development helpers - only available in development mode
if (process.env.NODE_ENV === 'development') {
  if (typeof window !== 'undefined') {
    ;(window as any).authStore = useAuthStore
  }
}

// Initialize auth state listener
const initializeAuthStateListener = () => {
  if (authStateListenerInitialized) return

  authStateListenerInitialized = true

  // Debug: Check current auth state
  supabase.auth.getUser().then(({ data: { user } }) => {
    // Debug logging removed
  })

  // Listen for auth state changes (login, logout, token refresh)
  supabase.auth.onAuthStateChange(async (event, session) => {
    const { setUser } = useAuthStore.getState()

    if (
      (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') &&
      session?.user
    ) {
      // User signed in or initial session loaded - update our store
      const user: User = {
        id: session.user.id,
        email: session.user.email!,
        firstName: session.user.user_metadata?.first_name,
        lastName: session.user.user_metadata?.last_name,
        role: session.user.user_metadata?.role,
        clinicId: session.user.user_metadata?.clinic_id,
        displayName:
          `${session.user.user_metadata?.first_name} ${session.user.user_metadata?.last_name}`.trim(),
      }

      useAuthStore.setState({
        user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      })

      // Fetch user profile data (clinic info, availableClinics) for both SIGNED_IN and INITIAL_SESSION
      useAuthStore.getState().fetchUserProfile()
    } else if (event === 'SIGNED_OUT') {
      // User signed out - clear our store
      useAuthStore.setState({
        user: null,
        clinicId: null,
        clinicName: null,
        availableClinics: null,
        needsClinicSelection: false,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      })
    } else if (event === 'TOKEN_REFRESHED') {
      // Token was refreshed - user stays logged in
    } else if (event === 'INITIAL_SESSION' && !session) {
      // INITIAL_SESSION fired but session is undefined - try to recover
      supabase.auth
        .getSession()
        .then(({ data: { session: recoveredSession } }) => {
          if (recoveredSession?.user) {
            // Trigger the session handling logic manually
            const user: User = {
              id: recoveredSession.user.id,
              email: recoveredSession.user.email!,
              firstName: recoveredSession.user.user_metadata?.first_name,
              lastName: recoveredSession.user.user_metadata?.last_name,
              role: recoveredSession.user.user_metadata?.role,
              clinicId: recoveredSession.user.user_metadata?.clinic_id,
              displayName:
                `${recoveredSession.user.user_metadata?.first_name} ${recoveredSession.user.user_metadata?.last_name}`.trim(),
            }

            useAuthStore.setState({
              user,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            })

            // Fetch user profile data (clinic info, availableClinics)
            useAuthStore.getState().fetchUserProfile()
          } else {
            useAuthStore.setState({
              isLoading: false,
            })
          }
        })
    }
  })

  // Check for existing session on startup
  supabase.auth.getSession().then(({ data: { session } }) => {
    if (session?.user) {
      // Session exists - this will trigger INITIAL_SESSION event which handles the user setup
    } else {
      useAuthStore.setState({
        isLoading: false,
      })
    }
  })
}

// Initialize the listener (will only run once)
if (typeof window !== 'undefined') {
  initializeAuthStateListener()
}
