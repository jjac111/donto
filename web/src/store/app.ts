/**
 * Zustand Store with Redux DevTools Integration
 *
 * To use DevTools:
 * 1. Install Redux DevTools browser extension
 * 2. Open browser dev tools
 * 3. Go to Redux tab
 * 4. You'll see "App Store" and "Auth Store" panels
 * 5. Use the time travel, action replay, and state inspection features
 *
 * Development helpers (only available in dev mode):
 * - reset(): Reset store to initial state
 * - getState(): Get current state
 * - logState(): Log current state to console
 */

import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

// DevTools helpers for development
const isDev = process.env.NODE_ENV === 'development'

const devtoolsConfig = {
  name: 'app-store',
  enabled: isDev,
  store: 'App Store',
  // Add custom serialize for better debugging
  serialize: {
    options: {
      date: true,
      function: false,
      regex: false,
      undefined: true,
      error: true,
      symbol: false,
      map: true,
      set: true,
    },
  },
}

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
  reset: () => void

  // Development helpers (only available in dev mode)
  getState?: () => AppState
  logState?: () => void
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

      // DevTools helpers
      reset: () =>
        set(
          { sidebarOpen: true, currentView: 'dashboard' },
          false,
          'app/reset'
        ),

      // Debug helpers (only in development)
      ...(isDev && {
        getState: () => get(),
        logState: () => console.log('App Store State:', get()),
      }),
    }),
    devtoolsConfig
  )
)

// Development helpers - only available in development mode
if (isDev) {
  // Add to window for easy access in browser console
  if (typeof window !== 'undefined') {
    ;(window as any).appStore = useAppStore
    console.log('🔧 Zustand DevTools enabled!')
    console.log('📊 Available in Redux DevTools: "App Store" and "Auth Store"')
    console.log('💻 Use window.appStore in console for direct access')
  }
}
