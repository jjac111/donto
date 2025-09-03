'use client'

import { useTranslations } from 'next-intl'
import { useAuthStore } from '@/store'

interface AppLayoutProps {
  children: React.ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  const tNav = useTranslations('navigation')
  const tCommon = useTranslations('common')
  const { user, logout } = useAuthStore()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">Donto</h1>
            </div>

            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">
                {user?.firstName} {user?.lastName}
              </span>
              <button
                onClick={() => logout()}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                {tCommon('logout')}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            <a
              href="/dashboard"
              className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm"
            >
              {tCommon('dashboard')}
            </a>
            <a
              href="/patients"
              className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm"
            >
              {tNav('patients')}
            </a>
            <a
              href="/appointments"
              className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm"
            >
              {tNav('appointments')}
            </a>
            <a
              href="/calendar"
              className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm"
            >
              {tNav('calendar')}
            </a>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">{children}</div>
      </main>
    </div>
  )
}
