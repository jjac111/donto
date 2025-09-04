'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Toggle } from '@/components/ui/toggle'
import {
  Search,
  Bell,
  User,
  ChevronDown,
  Building2,
  Moon,
  Sun,
  Settings,
  LogOut,
  Menu,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface HeaderProps {
  title: string
  showSearch?: boolean
  isDarkMode?: boolean
  onDarkModeToggle?: (checked: boolean) => void
  onMenuClick?: () => void
  className?: string
}

export function Header({
  title,
  showSearch = true,
  isDarkMode = false,
  onDarkModeToggle,
  onMenuClick,
  className,
}: HeaderProps) {
  const [searchValue, setSearchValue] = useState('')
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showClinicMenu, setShowClinicMenu] = useState(false)

  return (
    <header
      className={cn(
        'sticky top-0 z-30 flex h-24 items-center justify-between border-b border-border bg-background px-6 py-4 shadow-sm sm:px-8 lg:px-10',
        className
      )}
    >
      {/* Left side - Menu, Title and Search */}
      <div className="flex flex-1 items-center space-x-4">
        {/* Mobile menu button */}
        {onMenuClick && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onMenuClick}
            className="lg:hidden p-2"
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Open sidebar</span>
          </Button>
        )}

        <h1 className="text-lg font-semibold text-foreground">{title}</h1>

        {showSearch && (
          <div className="hidden lg:block flex-1 max-w-md mx-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search patients, appointments..."
                value={searchValue}
                onChange={e => setSearchValue(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        )}
      </div>

      {/* Right side - Actions */}
      <div className="flex items-center space-x-2">
        {/* Dark mode toggle */}
        {onDarkModeToggle && (
          <div className="hidden lg:flex items-center space-x-2">
            <Sun className="h-4 w-4" />
            <Toggle checked={isDarkMode} onCheckedChange={onDarkModeToggle} />
            <Moon className="h-4 w-4" />
          </div>
        )}

        {/* Clinic switcher */}
        <div className="relative">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowClinicMenu(!showClinicMenu)}
            className="hidden lg:flex items-center space-x-2"
          >
            <Building2 className="h-4 w-4" />
            <span>Clínica Central</span>
            <ChevronDown className="h-4 w-4" />
          </Button>
        </div>

        {/* Notifications */}
        {/* <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-4 w-4" />
          <Badge
            variant="destructive"
            className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs"
          >
            3
          </Badge>
        </Button> */}

        {/* User menu */}
        <div className="relative">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center space-x-2"
          >
            <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
              <User className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="hidden sm:block">Dr. García</span>
            <ChevronDown className="h-4 w-4" />
          </Button>

          {/* User dropdown menu */}
          {showUserMenu && (
            <div className="absolute right-0 top-full mt-2 w-48 rounded-md border border-border bg-popover p-1 shadow-md">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start"
                onClick={() => setShowUserMenu(false)}
              >
                <User className="mr-2 h-4 w-4" />
                Profile
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start"
                onClick={() => setShowUserMenu(false)}
              >
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Button>
              <hr className="my-1" />
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-destructive hover:text-destructive"
                onClick={() => setShowUserMenu(false)}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
