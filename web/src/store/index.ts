// Export all stores from a single entry point
export { useAuthStore, type AuthState } from './auth'
export { useAppStore, type AppState } from './app'

// Store selectors for common patterns
export const authSelectors = {
  user: (state: any) => state.user,
  isAuthenticated: (state: any) => state.isAuthenticated,
  isLoading: (state: any) => state.isLoading,
  error: (state: any) => state.error,
}

export const appSelectors = {
  selectedPatient: (state: any) => state.selectedPatient,
  patientDisplayName: (state: any) => state.patientDisplayName,
  currentView: (state: any) => state.currentView,
  sidebarOpen: (state: any) => state.sidebarOpen,
}
