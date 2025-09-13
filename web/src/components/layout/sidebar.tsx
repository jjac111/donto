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
          'fixed left-0 top-2 bottom-2 z-50 w-64 transform border border-border bg-card transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 lg:flex lg:flex-col',
          'rounded-r-2xl lg:rounded-none',
          isOpen ? 'translate-x-0' : '-translate-x-full',
          className
        )}
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-center h-17 px-6 py-4 border-b border-border">
            <Link href="/">
              <Logo size="lg" />
            </Link>
          </div>

          {/* Search - Hidden on desktop when shown in header */}
          <div className="p-4 lg:hidden">
            {/* Search Box */}
            <SearchInput />
          </div>

          <Separator className="lg:hidden" />

          {/* Navigation */}
          <nav className="flex-1 flex flex-col p-6">
            <div className="space-y-3 h-full flex flex-col">
              {navigation.map(item => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      'flex flex-1 items-center space-x-4 rounded-lg px-4 py-4 text-base font-medium transition-colors hover:bg-accent hover:text-accent-foreground',
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
                    <item.icon className="h-6 w-6" />
                    <span>{item.name}</span>
                  </Link>
                )
              })}
            </div>

            <Separator className="my-6" />

            {/* Footer */}
            <div>
              <Link
                href="/settings"
                className={cn(
                  'flex items-center space-x-4 rounded-lg px-4 py-4 text-base font-medium transition-colors hover:bg-accent hover:text-accent-foreground',
                  pathname === '/settings'
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground'
                )}
              >
                <Settings className="h-6 w-6" />
                <span>{t('settings')}</span>
              </Link>
            </div>
          </nav>
        </div>
      </div>
    </>
  )
}
