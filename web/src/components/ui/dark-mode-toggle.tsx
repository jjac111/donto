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

    // Check localStorage first, then system preference
    const savedTheme = localStorage.getItem('theme')
    const systemPrefersDark = window.matchMedia(
      '(prefers-color-scheme: dark)'
    ).matches

    const shouldBeDark =
      savedTheme === 'dark' || (!savedTheme && systemPrefersDark)

    setIsDarkMode(shouldBeDark)
    applyTheme(shouldBeDark)
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

    // Persist to localStorage
    localStorage.setItem('theme', checked ? 'dark' : 'light')
  }

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        {showIcons && <Sun className="h-4 w-4" />}
        <Toggle checked={false} disabled />
        {showIcons && <Moon className="h-4 w-4" />}
      </div>
    )
  }

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {showIcons && <Sun className="h-4 w-4" />}
      <Toggle checked={isDarkMode} onCheckedChange={handleToggle} size={size} />
      {showIcons && <Moon className="h-4 w-4" />}
    </div>
  )
}
