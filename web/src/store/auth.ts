import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { User } from '@/types'

export interface AuthState {
  // State
  user: User | null
  isLoading: boolean
  error: string | null
  
  // Computed
  isAuthenticated: boolean
  
  // Actions
  setUser: (user: User | null) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  clearError: () => void
}

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        user: null,
        isLoading: false,
        error: null,
        
        // Computed
        get isAuthenticated() {
          return get().user !== null
        },
        
        // Actions
        setUser: (user) => set({ user }, false, 'auth/setUser'),
        
        setLoading: (isLoading) => set({ isLoading }, false, 'auth/setLoading'),
        
        setError: (error) => set({ error }, false, 'auth/setError'),
        
        clearError: () => set({ error: null }, false, 'auth/clearError'),
        
        login: async (email: string, password: string) => {
          set({ isLoading: true, error: null }, false, 'auth/login/start')
          
          try {
            // TODO: Replace with actual Supabase auth
            // const { data, error } = await supabase.auth.signInWithPassword({ email, password })
            
            // Mock implementation for now
            await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate API call
            
            if (email === 'admin@clinic.com' && password === 'password') {
              const user: User = {
                id: '1',
                email,
                firstName: 'Admin',
                lastName: 'User',
                role: 'admin',
                clinicId: 'clinic-1',
                displayName: 'Admin User'
              }
              set({ user, isLoading: false }, false, 'auth/login/success')
            } else {
              throw new Error('Credenciales inválidas')
            }
          } catch (error) {
            set({ 
              error: error instanceof Error ? error.message : 'Error al iniciar sesión',
              isLoading: false 
            }, false, 'auth/login/error')
          }
        },
        
        logout: () => {
          set({ user: null, error: null }, false, 'auth/logout')
          // TODO: Clear Supabase session
          // await supabase.auth.signOut()
        }
      }),
      {
        name: 'donto-auth', // localStorage key
        partialize: (state) => ({ user: state.user }), // Only persist user, not loading/error states
      }
    ),
    { name: 'auth-store' } // DevTools name
  )
)
