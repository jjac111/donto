'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import { ToothWithConditions, ToothCondition } from '@/types/dental-conditions'
import dentalConditionsData from '@/lib/dental-conditions.json'

interface ToothProps {
  tooth: ToothWithConditions
  onClick: () => void
  isSelected?: boolean
  jaw: 'upper' | 'lower'
  side: 'left' | 'right'
}

export function Tooth({ tooth, onClick, isSelected, jaw, side }: ToothProps) {
  // Helper to add alpha to hex color (e.g., #RRGGBB -> #RRGGBB33)
  const withAlpha = (hex: string, alphaHex: string): string => {
    if (hex && hex.startsWith('#') && hex.length === 7)
      return `${hex}${alphaHex}`
    return hex
  }

  // Map condition surface (M, D, B, L, O) to visual surface (up, down, left, right, center)
  const getVisualSurface = (
    conditionSurface: 'M' | 'D' | 'B' | 'L' | 'O'
  ): 'up' | 'down' | 'left' | 'right' | 'center' => {
    if (conditionSurface === 'O') return 'center'

    // Map based on jaw and side orientation
    if (conditionSurface === 'M') {
      // Mesial
      return side === 'left' ? 'right' : 'left'
    }
    if (conditionSurface === 'D') {
      // Distal
      return side === 'left' ? 'left' : 'right'
    }
    if (conditionSurface === 'B') {
      // Buccal
      return jaw === 'upper' ? 'up' : 'down'
    }
    if (conditionSurface === 'L') {
      // Lingual
      return jaw === 'upper' ? 'down' : 'up'
    }

    return 'center'
  }

  // Get condition for a specific visual surface
  const getConditionForSurface = (
    visualSurface: 'up' | 'down' | 'left' | 'right' | 'center'
  ): ToothCondition | undefined => {
    return tooth.conditions.find(condition =>
      condition.surfaces.some(
        surface => getVisualSurface(surface) === visualSurface
      )
    )
  }

  // SVG fills - standard odontogram colors (red and blue only)
  const getFill = (
    visualSurface: 'up' | 'down' | 'left' | 'right' | 'center'
  ): string => {
    const condition = getConditionForSurface(visualSurface)
    if (condition) {
      // All conditions are red, or blue if tooth is treated
      return tooth.hasTreatments ? '#3b82f6' : '#ef4444' // blue or red
    }
    return 'white'
  }

  const getToothStatusColor = (): string => {
    // Check if tooth has any conditions
    const hasConditions = tooth.conditions.length > 0

    if (!tooth.isPresent) return 'border-blue-500 bg-blue-50'
    if (tooth.requiresExtraction) return 'border-red-500 bg-red-50'
    if (tooth.hasTreatments) return 'border-blue-500 bg-blue-50'
    if (hasConditions) {
      // Red border for untreated conditions
      return 'border-red-500 bg-red-50'
    }
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
      <div className="p-1">
        <div
          className={cn(
            'tooth relative w-8 h-8 sm:w-10 sm:h-10 md:w-8 md:h-8 xl:w-12 xl:h-12 border-2 rounded cursor-pointer transition-all duration-200 hover:scale-105',
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
            <polygon points="0,0 100,0 71,29 29,29" fill={getFill('up')} />
            <polygon
              points="0,100 100,100 71,71 29,71"
              fill={getFill('down')}
            />
            <polygon points="0,0 29,29 29,71 0,100" fill={getFill('left')} />
            <polygon
              points="100,0 71,29 71,71 100,100"
              fill={getFill('right')}
            />

            {/* Center square (larger) */}
            <rect
              x="29"
              y="29"
              width="42"
              height="42"
              rx="6"
              fill={getFill('center')}
              stroke={(() => {
                const condition = getConditionForSurface('center')
                if (condition) {
                  // Use standard odontogram colors
                  return tooth.hasTreatments ? '#3b82f6' : '#ef4444' // blue or red
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

          {/* Missing tooth indicator - blue X cross */}
          <div
            className={`absolute inset-0 transition-opacity duration-200 ${
              !tooth.isPresent ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <div className="absolute w-[141%] h-0.5 bg-blue-600 rotate-45 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 origin-center"></div>
            <div className="absolute w-[141%] h-0.5 bg-blue-600 -rotate-45 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 origin-center"></div>
          </div>

          {/* Extraction required indicator - red X cross */}
          <div
            className={`absolute inset-0 transition-opacity duration-200 ${
              tooth.requiresExtraction && tooth.isPresent
                ? 'opacity-100'
                : 'opacity-0'
            }`}
          >
            <div className="absolute w-[141%] h-0.5 bg-red-600 rotate-45 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 origin-center"></div>
            <div className="absolute w-[141%] h-0.5 bg-red-600 -rotate-45 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 origin-center"></div>
          </div>
        </div>
      </div>
    </div>
  )
}
