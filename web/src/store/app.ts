import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { Patient } from '@/types'

export interface AppState {
  // UI State
  sidebarOpen: boolean
  selectedPatient: Patient | null

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
  setSelectedPatient: (patient: Patient | null) => void
  setCurrentView: (view: AppState['currentView']) => void

  // Computed
  patientDisplayName: string | null
}

export const useAppStore = create<AppState>()(
  devtools(
    (set, get) => ({
      // Initial state
      sidebarOpen: true,
      selectedPatient: null,
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

      setSelectedPatient: selectedPatient =>
        set({ selectedPatient }, false, 'app/setSelectedPatient'),

      setCurrentView: currentView =>
        set({ currentView }, false, 'app/setCurrentView'),

      // Computed
      get patientDisplayName() {
        const patient = get().selectedPatient
        return patient
          ? `${patient.person?.firstName} ${patient.person?.lastName}`
          : null
      },
    }),
    { name: 'app-store' }
  )
)
