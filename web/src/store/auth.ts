import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { User } from "@/types";
import { supabase } from "@/lib/api";

// Auth state listener to handle session changes
let authStateListenerInitialized = false;

export interface AuthState {
  // State
  user: User | null;
  isLoading: boolean;
  error: string | null;

  // Computed
  isAuthenticated: boolean;

  // Actions
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        user: null,
        isLoading: false,
        error: null,

        // Computed - moved out of getter to fix persistence issues
        isAuthenticated: false,

        // Actions
        setUser: (user) =>
          set({ user, isAuthenticated: user !== null }, false, "auth/setUser"),

        setLoading: (isLoading) => set({ isLoading }, false, "auth/setLoading"),

        setError: (error) => set({ error }, false, "auth/setError"),

        clearError: () => set({ error: null }, false, "auth/clearError"),

        login: async (email: string, password: string) => {
          set({ isLoading: true, error: null }, false, "auth/login/start");

          try {
            const { data, error } = await supabase.auth.signInWithPassword({ 
              email, 
              password 
            });

            if (error) {
              throw new Error(error.message);
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
                displayName: `${data.user.user_metadata?.first_name} ${data.user.user_metadata?.last_name}`.trim(),
              };
              
              set(
                { user, isLoading: false, isAuthenticated: true },
                false,
                "auth/login/success"
              );
            } else {
              throw new Error("No user data received");
            }
          } catch (error) {
            console.error("Auth: Login failed:", error);
            set(
              {
                error:
                  error instanceof Error
                    ? error.message
                    : "Error al iniciar sesión",
                isLoading: false,
              },
              false,
              "auth/login/error"
            );
          }
        },

        logout: async () => {
          set({ isLoading: true }, false, "auth/logout/start");
          
          try {
            await supabase.auth.signOut();
            set(
              { user: null, error: null, isAuthenticated: false, isLoading: false },
              false,
              "auth/logout/success"
            );
          } catch (error) {
            console.error("Logout error:", error);
            // Even if logout fails, clear local state
            set(
              { user: null, error: null, isAuthenticated: false, isLoading: false },
              false,
              "auth/logout/force"
            );
          }
        },
      }),
      {
        name: "donto-auth", // localStorage key
        partialize: (state) => ({
          user: state.user,
          isAuthenticated: state.isAuthenticated,
        }), // Persist user and auth state
      }
    ),
    { name: "auth-store" } // DevTools name
  )
);

// Initialize auth state listener
const initializeAuthStateListener = () => {
  if (authStateListenerInitialized) return;
  
  authStateListenerInitialized = true;
  
  // Listen for auth state changes (login, logout, token refresh)
  supabase.auth.onAuthStateChange(async (event, session) => {
    console.log('Supabase auth event:', event, session?.user?.email);
    
    const { setUser } = useAuthStore.getState();
    
    if (event === 'SIGNED_IN' && session?.user) {
      // User signed in - update our store
      const user: User = {
        id: session.user.id,
        email: session.user.email!,
        firstName: session.user.user_metadata?.first_name,
        lastName: session.user.user_metadata?.last_name,
        role: session.user.user_metadata?.role,
        clinicId: session.user.user_metadata?.clinic_id,
        displayName: `${session.user.user_metadata?.first_name} ${session.user.user_metadata?.last_name}`.trim(),
      };
      
      useAuthStore.setState({ 
        user, 
        isAuthenticated: true, 
        isLoading: false, 
        error: null 
      });
    } else if (event === 'SIGNED_OUT') {
      // User signed out - clear our store
      useAuthStore.setState({ 
        user: null, 
        isAuthenticated: false, 
        isLoading: false, 
        error: null 
      });
    } else if (event === 'TOKEN_REFRESHED') {
      // Token was refreshed - user stays logged in
      console.log('Auth token refreshed successfully');
    }
  });
  
  // Check for existing session on startup
  supabase.auth.getSession().then(({ data: { session } }) => {
    if (session?.user) {
      const user: User = {
        id: session.user.id,
        email: session.user.email!,
        firstName: session.user.user_metadata?.first_name,
        lastName: session.user.user_metadata?.last_name,
        role: session.user.user_metadata?.role,
        clinicId: session.user.user_metadata?.clinic_id,
        displayName: `${session.user.user_metadata?.first_name} ${session.user.user_metadata?.last_name}`.trim(),
      };
      
      useAuthStore.setState({ 
        user, 
        isAuthenticated: true, 
        isLoading: false 
      });
    } else {
      useAuthStore.setState({ 
        isLoading: false 
      });
    }
  });
};

// Initialize the listener (will only run once)
if (typeof window !== 'undefined') {
  initializeAuthStateListener();
}
