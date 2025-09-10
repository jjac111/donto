'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import { ToothWithConditions, ToothCondition } from '@/types/dental-conditions'

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

  // Get condition for a specific surface
  const getConditionForSurface = (
    surface: 'M' | 'D' | 'B' | 'L' | 'O'
  ): ToothCondition | undefined => {
    return tooth.conditions.find(condition =>
      condition.surfaces.includes(surface)
    )
  }

  // SVG fills
  const getFill = (surface: 'M' | 'D' | 'B' | 'L' | 'O'): string => {
    const condition = getConditionForSurface(surface)
    if (condition) {
      // Get condition details from dental-conditions.json
      const dentalConditions = require('@/lib/dental-conditions.json')
      for (const category of Object.values(dentalConditions)) {
        const conditionDetails = (category as any[]).find(
          c => c.id === condition.conditionType
        )
        if (conditionDetails) {
          return withAlpha(conditionDetails.color, '33')
        }
      }
    }
    return 'white'
  }

  const getToothStatusColor = (): string => {
    // Check if tooth has any conditions
    const hasConditions = tooth.conditions.length > 0
    const hasUrgentConditions = tooth.conditions.some(condition => {
      // Get severity from dental-conditions.json
      const dentalConditions = require('@/lib/dental-conditions.json')
      for (const category of Object.values(dentalConditions)) {
        const conditionDetails = (category as any[]).find(
          c => c.id === condition.conditionType
        )
        if (conditionDetails) {
          return (
            conditionDetails.severity === 'critical' ||
            conditionDetails.severity === 'high'
          )
        }
      }
      return false
    })

    if (!tooth.isPresent) return 'border-gray-800 bg-gray-200'
    if (hasUrgentConditions) return 'border-red-500 bg-red-50'
    if (hasConditions) return 'border-blue-500 bg-blue-50' // Any conditions
    return 'border-gray-300 bg-white' // Neutral border for healthy teeth
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
          <polygon points="0,0 100,0 71,29 29,29" fill={getFill('M')} />
          <polygon points="0,100 100,100 71,71 29,71" fill={getFill('D')} />
          <polygon points="0,0 29,29 29,71 0,100" fill={getFill('B')} />
          <polygon points="100,0 71,29 71,71 100,100" fill={getFill('L')} />

          {/* Center square (larger) */}
          <rect
            x="29"
            y="29"
            width="42"
            height="42"
            rx="6"
            fill={getFill('O')}
            stroke={(() => {
              const condition = getConditionForSurface('O')
              if (condition) {
                const dentalConditions = require('@/lib/dental-conditions.json')
                for (const category of Object.values(dentalConditions)) {
                  const conditionDetails = (category as any[]).find(
                    c => c.id === condition.conditionType
                  )
                  if (conditionDetails) {
                    return conditionDetails.color
                  }
                }
              }
              return '#9ca3af'
            })()}
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
