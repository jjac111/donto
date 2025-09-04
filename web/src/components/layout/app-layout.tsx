'use client'

import { useState } from 'react'
import { Sidebar } from './sidebar'
import { Button } from '@/components/ui/button'
import { Menu } from 'lucide-react'

interface AppLayoutProps {
  children: React.ReactNode
  showSidebar?: boolean
}

export function AppLayout({ children, showSidebar = true }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  if (!showSidebar) {
    return <div className="min-h-screen bg-background">{children}</div>
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-y-auto">
        {/* Mobile header */}
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-border bg-background px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:hidden">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden"
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Open sidebar</span>
          </Button>

          <div className="flex-1 text-sm font-semibold leading-6 text-foreground">
            Donto
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 py-6">
          <div className="px-4 sm:px-6 lg:px-8">{children}</div>
        </main>
      </div>
    </div>
  )
}
