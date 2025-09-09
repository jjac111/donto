'use client'

import { useEffect, useState } from 'react'
import { Toggle } from '@/components/ui/toggle'
import { Sun, Moon } from 'lucide-react'

interface DarkModeToggleProps {
  className?: string
  showIcons?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export function DarkModeToggle({
  className,
  showIcons = true,
  size = 'md',
}: DarkModeToggleProps) {
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Handle hydration
  useEffect(() => {
    setMounted(true)

    // Check if dark class is already on html (from server-side cookie)
    const isCurrentlyDark = document.documentElement.classList.contains('dark')
    setIsDarkMode(isCurrentlyDark)
  }, [])

  const applyTheme = (dark: boolean) => {
    if (dark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  const handleToggle = (checked: boolean) => {
    setIsDarkMode(checked)
    applyTheme(checked)

    // Persist using cookie (1 year)
    try {
      document.cookie = `theme=${
        checked ? 'dark' : 'light'
      }; path=/; max-age=31536000; SameSite=Lax`
    } catch {}
  }

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        {showIcons && <Sun className="h-4 w-4" />}
        <Toggle checked={false} disabled onCheckedChange={() => {}} />
        {showIcons && <Moon className="h-4 w-4" />}
      </div>
    )
  }

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {showIcons && <Sun className="h-4 w-4" />}
      <Toggle checked={isDarkMode} onCheckedChange={handleToggle} />
      {showIcons && <Moon className="h-4 w-4" />}
    </div>
  )
}
