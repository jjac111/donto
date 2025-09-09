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
  // Get condition colors for each surface
  const getSurfaceColor = (surface: ToothSurfaceCondition): string => {
    if (!surface.condition) return 'bg-green-100 border-green-300' // Healthy
    return `bg-[${surface.condition.color}] border-gray-400`
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
        {/* Tooth surface grid - 5 sections */}
        <div className="tooth-surfaces absolute inset-0 grid grid-cols-2 grid-rows-2 p-0.5">
          {/* Top-left: Mesial (M) */}
          <div
            className={cn(
              'border border-white/20 rounded-tl',
              getSurfaceColor(
                tooth.surfaces.find(s => s.surface === 'M') || {
                  surface: 'M' as const,
                  recordedDate: new Date(),
                }
              )
            )}
            title="Mesial"
          />

          {/* Top-right: Distal (D) */}
          <div
            className={cn(
              'border border-white/20 rounded-tr',
              getSurfaceColor(
                tooth.surfaces.find(s => s.surface === 'D') || {
                  surface: 'D' as const,
                  recordedDate: new Date(),
                }
              )
            )}
            title="Distal"
          />

          {/* Bottom-left: Buccal (B) */}
          <div
            className={cn(
              'border border-white/20 rounded-bl',
              getSurfaceColor(
                tooth.surfaces.find(s => s.surface === 'B') || {
                  surface: 'B' as const,
                  recordedDate: new Date(),
                }
              )
            )}
            title="Buccal"
          />

          {/* Bottom-right: Lingual (L) */}
          <div
            className={cn(
              'border border-white/20 rounded-br',
              getSurfaceColor(
                tooth.surfaces.find(s => s.surface === 'L') || {
                  surface: 'L' as const,
                  recordedDate: new Date(),
                }
              )
            )}
            title="Lingual"
          />
        </div>

        {/* Center section: Occlusal (O) */}
        <div
          className={cn(
            'tooth-center absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-4 h-4 border border-white/30 rounded',
            getSurfaceColor(
              tooth.surfaces.find(s => s.surface === 'O') || {
                surface: 'O' as const,
                recordedDate: new Date(),
              }
            )
          )}
          title="Oclusal"
        />

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
