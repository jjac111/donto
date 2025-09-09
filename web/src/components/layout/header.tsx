'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { DarkModeToggle } from '@/components/ui/dark-mode-toggle'
import { SearchInput } from '@/components/ui/search-input'
import { useAuthStore } from '@/store'
import {
  User,
  ChevronDown,
  Building2,
  Settings,
  LogOut,
  Menu,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'

interface HeaderProps {
  title: string
  showSearch?: boolean
  onMenuClick?: () => void
  className?: string
}

export function Header({
  title,
  showSearch = true,
  onMenuClick,
  className,
}: HeaderProps) {
  const [searchValue, setSearchValue] = useState('')
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showClinicMenu, setShowClinicMenu] = useState(false)
  const {
    user,
    clinicName,
    availableClinics,
    selectClinic,
    loadUserClinics,
    logout,
  } = useAuthStore()
  const t = useTranslations('header')
  const router = useRouter()

  return (
    <header
      className={cn(
        'sticky top-0 z-30 flex h-17 items-center justify-between border-b border-border bg-background px-6 py-4 shadow-sm sm:px-8 lg:px-10',
        className
      )}
    >
      {/* Left side - Menu and Title */}
      <div className="flex items-center space-x-4">
        {/* Mobile menu button */}
        {onMenuClick && (
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            <Menu className="h-6 w-6" />
            <span className="sr-only">{t('openSidebar')}</span>
          </button>
        )}

        <h1 className="text-lg font-semibold text-foreground">{title}</h1>
      </div>

      {/* Center - Search */}
      {showSearch && (
        <div className="hidden lg:block flex-1 max-w-md mx-8">
          <SearchInput value={searchValue} onChange={setSearchValue} />
        </div>
      )}

      {/* Right side - Actions */}
      <div className="flex items-center space-x-2">
        {/* Clinic switcher */}
        {availableClinics && availableClinics.length > 1 && (
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              onClick={async () => {
                if (!availableClinics || availableClinics.length === 0) {
                  await loadUserClinics()
                }
                setShowClinicMenu(!showClinicMenu)
              }}
              className="hidden lg:flex items-center space-x-2"
            >
              <Building2 className="h-4 w-4" />
              <span>{clinicName}</span>
              <ChevronDown className="h-4 w-4" />
            </Button>

            {showClinicMenu && (
              <div className="absolute right-0 top-full mt-2 w-56 rounded-md border border-border bg-popover p-1 shadow-md">
                {availableClinics.map(c => (
                  <Button
                    key={c.clinicId}
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start"
                    onClick={async () => {
                      setShowClinicMenu(false)
                      await selectClinic(c.clinicId)
                      router.refresh()
                      if (typeof window !== 'undefined') {
                        window.location.reload()
                      }
                    }}
                  >
                    <Building2 className="mr-2 h-4 w-4" />
                    <span className="truncate">{c.clinicName}</span>
                  </Button>
                ))}
              </div>
            )}
          </div>
        )}

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
            <ChevronDown className="h-4 w-4" />
          </Button>

          {/* User dropdown menu */}
          {showUserMenu && (
            <div className="absolute right-0 top-full mt-2 w-48 rounded-md border border-border bg-popover p-1 shadow-md">
              {/* Signed-in email (non-interactive) */}
              {user?.email && (
                <div className="px-3 py-2 text-xs text-muted-foreground border-b border-border truncate">
                  {user.email}
                </div>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start"
                onClick={() => setShowUserMenu(false)}
              >
                <User className="mr-2 h-4 w-4" />
                {t('profile')}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start"
                onClick={() => setShowUserMenu(false)}
              >
                <Settings className="mr-2 h-4 w-4" />
                {t('settings')}
              </Button>
              <hr className="my-1" />
              <div className="px-3 py-2 flex ">
                <DarkModeToggle />
              </div>
              <hr className="my-1" />
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-destructive hover:text-destructive"
                onClick={() => {
                  setShowUserMenu(false)
                  logout()
                }}
              >
                <LogOut className="mr-2 h-4 w-4" />
                {t('logout')}
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
