'use client'

import { useState } from 'react'
import { Sidebar } from './sidebar'
import { Header } from './header'

interface AppLayoutProps {
  children: React.ReactNode
  showSidebar?: boolean
  title?: string
  showSearch?: boolean
}

export function AppLayout({
  children,
  showSidebar = true,
  title = 'Dashboard',
  showSearch = true,
}: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  if (!showSidebar) {
    return <div className="min-h-screen">{children}</div>
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-y-auto">
        {/* Header */}
        <Header
          title={title}
          showSearch={showSearch}
          onMenuClick={() => setSidebarOpen(true)}
        />

        {/* Page content */}
        <main className="flex-1 py-6">
          <div className="px-4 pb-6 sm:px-6 lg:pb-8 lg:px-8">{children}</div>
        </main>
      </div>
    </div>
  )
}
