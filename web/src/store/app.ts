import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

export interface AppState {
  // UI State
  sidebarOpen: boolean

  // App State
  currentView:
    | 'dashboard'
    | 'patients'
    | 'appointments'
    | 'calendar'
    | 'treatments'

  // Actions
  setSidebarOpen: (open: boolean) => void
  toggleSidebar: () => void
  setCurrentView: (view: AppState['currentView']) => void
}

export const useAppStore = create<AppState>()(
  devtools(
    (set, get) => ({
      // Initial state
      sidebarOpen: true,
      currentView: 'dashboard',

      // Actions
      setSidebarOpen: sidebarOpen =>
        set({ sidebarOpen }, false, 'app/setSidebarOpen'),

      toggleSidebar: () =>
        set(
          state => ({ sidebarOpen: !state.sidebarOpen }),
          false,
          'app/toggleSidebar'
        ),

      setCurrentView: currentView =>
        set({ currentView }, false, 'app/setCurrentView'),
    }),
    { name: 'app-store' }
  )
)
