'use client'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { Toggle } from '@/components/ui/toggle'
import {
  Users,
  Calendar,
  FileText,
  Settings,
  Stethoscope,
  DollarSign,
  FileCheck,
  Menu,
  X,
  Search,
  Moon,
  Sun,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
  className?: string
  isDarkMode?: boolean
  onDarkModeToggle?: (checked: boolean) => void
}

const navigation = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: FileText,
  },
  {
    name: 'Patients',
    href: '/patients',
    icon: Users,
  },
  {
    name: 'Schedule',
    href: '/schedule',
    icon: Calendar,
  },
  {
    name: 'Treatment Plans',
    href: '/treatments',
    icon: Stethoscope,
  },
  {
    name: 'Estimates',
    href: '/estimates',
    icon: DollarSign,
  },
  {
    name: 'Clinical Notes',
    href: '/clinical-notes',
    icon: FileCheck,
  },
]

export function Sidebar({
  isOpen,
  onClose,
  className,
  isDarkMode,
  onDarkModeToggle,
}: SidebarProps) {
  const pathname = usePathname()

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
          <div className="flex items-center justify-between p-6">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <Stethoscope className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-lg font-semibold text-foreground">
                Donto
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="lg:hidden"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <Separator />

          {/* Search and Dark Mode - Hidden on desktop when shown in header */}
          <div className="p-4 space-y-4 lg:hidden">
            {/* Search Box */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search patients, appointments..."
                className="pl-10"
              />
            </div>

            {/* Dark Mode Toggle */}
            {onDarkModeToggle && (
              <div className="flex items-center space-x-3">
                <Sun className="h-4 w-4" />
                <Toggle
                  checked={isDarkMode ?? false}
                  onCheckedChange={onDarkModeToggle}
                />
                <Moon className="h-4 w-4" />
              </div>
            )}
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
                  {item.name === 'Patients' && (
                    <Badge variant="secondary" className="ml-auto">
                      12
                    </Badge>
                  )}
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
              <span>Settings</span>
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}
