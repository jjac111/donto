'use client'

import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { DarkModeToggle } from '@/components/ui/dark-mode-toggle'
import { Logo } from '@/components/ui/logo'
import { SearchInput } from '@/components/ui/search-input'
import {
  Users,
  Calendar,
  FileText,
  Settings,
  Stethoscope,
  DollarSign,
  FileCheck,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
  className?: string
}

export function Sidebar({ isOpen, onClose, className }: SidebarProps) {
  const pathname = usePathname()
  const t = useTranslations('navigation')

  const navigation = [
    {
      name: t('dashboard'),
      href: '/dashboard',
      icon: FileText,
    },
    {
      name: t('patients'),
      href: '/patients',
      icon: Users,
    },
    {
      name: t('schedule'),
      href: '/schedule',
      icon: Calendar,
    },
    {
      name: t('treatmentPlans'),
      href: '/treatments',
      icon: Stethoscope,
    },
    {
      name: t('estimates'),
      href: '/estimates',
      icon: DollarSign,
    },
    {
      name: t('clinicalNotes'),
      href: '/clinical-notes',
      icon: FileCheck,
    },
  ]

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          'fixed left-0 top-0 z-50 h-full w-64 transform border-r border-border bg-card transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 lg:flex lg:flex-col',
          isOpen ? 'translate-x-0' : '-translate-x-full',
          className
        )}
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between h-17 px-6 py-4 border-b border-border">
            <Logo size="lg" />
          </div>

          {/* Search and Dark Mode - Hidden on desktop when shown in header */}
          <div className="p-4 space-y-4 lg:hidden">
            {/* Search Box */}
            <SearchInput />

            {/* Dark Mode Toggle */}
            <DarkModeToggle />
          </div>

          <Separator className="lg:hidden" />

          {/* Navigation */}
          <nav className="flex-1 space-y-1 p-4">
            {navigation.map(item => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'flex items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground',
                    isActive
                      ? 'bg-accent text-accent-foreground'
                      : 'text-muted-foreground'
                  )}
                  onClick={() => {
                    // Close sidebar on mobile when navigating
                    if (window.innerWidth < 1024) {
                      onClose()
                    }
                  }}
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </Link>
              )
            })}
          </nav>

          <Separator />

          {/* Footer */}
          <div className="p-4">
            <Link
              href="/settings"
              className={cn(
                'flex items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground',
                pathname === '/settings'
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground'
              )}
            >
              <Settings className="h-4 w-4" />
              <span>{t('settings')}</span>
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}
