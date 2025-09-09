'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import {
  ToothWithConditions,
  ToothSurfaceCondition,
} from '@/types/dental-conditions'

interface ToothProps {
  tooth: ToothWithConditions
  onClick: () => void
  isSelected?: boolean
}

export function Tooth({ tooth, onClick, isSelected }: ToothProps) {
  // Helper to add alpha to hex color (e.g., #RRGGBB -> #RRGGBB33)
  const withAlpha = (hex: string, alphaHex: string): string => {
    if (hex && hex.startsWith('#') && hex.length === 7)
      return `${hex}${alphaHex}`
    return hex
  }

  // SVG fills
  const getFill = (surface?: ToothSurfaceCondition): string => {
    const color = surface?.condition?.color
    return color ? withAlpha(color, '33') : 'transparent'
  }

  const getToothStatusColor = (): string => {
    // Check if tooth has any conditions
    const hasConditions = tooth.surfaces.some(surface => surface.condition)
    const hasUrgentConditions = tooth.surfaces.some(
      surface =>
        surface.condition?.severity === 'critico' ||
        surface.condition?.severity === 'alto'
    )

    if (!tooth.isPresent) return 'border-gray-800 bg-gray-200'
    if (hasUrgentConditions) return 'border-red-500 bg-red-50'
    if (hasConditions) return 'border-orange-500 bg-orange-50'
    return 'border-green-500 bg-green-50'
  }

  return (
    <div className="tooth-container flex flex-col items-center gap-1">
      {/* Tooth number */}
      <span
        className={cn(
          'text-xs font-medium text-muted-foreground',
          isSelected && 'text-primary font-bold'
        )}
      >
        {tooth.number}
      </span>

      {/* Tooth visualization */}
      <div
        className={cn(
          'tooth relative w-12 h-12 border-2 rounded cursor-pointer transition-all duration-200 hover:scale-105',
          getToothStatusColor(),
          isSelected && 'ring-2 ring-primary ring-offset-1 scale-105'
        )}
        onClick={onClick}
        role="button"
        tabIndex={0}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onClick()
          }
        }}
        aria-label={`Diente ${tooth.number}`}
      >
        {/* SVG diagram with trapezoids */}
        <svg
          className="absolute inset-0 z-0"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          shapeRendering="crispEdges"
        >
          <polygon
            points="0,0 100,0 71,29 29,29"
            fill={getFill(tooth.surfaces.find(s => s.surface === 'M'))}
          />
          <polygon
            points="0,100 100,100 71,71 29,71"
            fill={getFill(tooth.surfaces.find(s => s.surface === 'D'))}
          />
          <polygon
            points="0,0 29,29 29,71 0,100"
            fill={getFill(tooth.surfaces.find(s => s.surface === 'B'))}
          />
          <polygon
            points="100,0 71,29 71,71 100,100"
            fill={getFill(tooth.surfaces.find(s => s.surface === 'L'))}
          />

          {/* Center square (larger) */}
          <rect
            x="29"
            y="29"
            width="42"
            height="42"
            rx="6"
            fill={getFill(tooth.surfaces.find(s => s.surface === 'O'))}
            stroke={
              tooth.surfaces.find(s => s.surface === 'O')?.condition?.color ||
              '#9ca3af'
            }
            strokeOpacity="0.65"
            strokeWidth="1.25"
          />

          {/* Diagram diagonal lines only (avoid extra horizontals) */}
          <line
            x1="0"
            y1="0"
            x2="29"
            y2="29"
            stroke="#9ca3af"
            strokeOpacity="0.5"
          />
          <line
            x1="100"
            y1="0"
            x2="71"
            y2="29"
            stroke="#9ca3af"
            strokeOpacity="0.5"
          />
          <line
            x1="0"
            y1="100"
            x2="29"
            y2="71"
            stroke="#9ca3af"
            strokeOpacity="0.5"
          />
          <line
            x1="100"
            y1="100"
            x2="71"
            y2="71"
            stroke="#9ca3af"
            strokeOpacity="0.5"
          />
        </svg>

        {/* Click target overlay to keep interactions the same */}
        <div className="absolute inset-0" />

        {/* Missing tooth indicator */}
        {!tooth.isPresent && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-6 h-0.5 bg-gray-600 rotate-45"></div>
          </div>
        )}

        {/* Treatment indicator */}
        {tooth.hasTreatments && (
          <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full border border-white"></div>
        )}
      </div>
    </div>
  )
}
