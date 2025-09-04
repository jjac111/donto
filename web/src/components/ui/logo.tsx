import Image from 'next/image'
import { cn } from '@/lib/utils'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  showText?: boolean
  textClassName?: string
}

const sizeMap = {
  sm: 24,
  md: 32,
  lg: 48,
  xl: 64,
}

export function Logo({
  size = 'md',
  className,
  showText = true,
  textClassName,
}: LogoProps) {
  const logoSize = sizeMap[size]

  return (
    <div className={cn('flex items-center space-x-2', className)}>
      <Image
        src="/logos/logo-transparent-circle.png"
        alt="Donto Logo"
        width={logoSize}
        height={logoSize}
        className="flex-shrink-0"
        priority
      />
      {showText && (
        <span
          className={cn('text-lg font-semibold text-foreground', textClassName)}
        >
          DONTO
        </span>
      )}
    </div>
  )
}
