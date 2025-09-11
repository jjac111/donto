'use client'

import React from 'react'
import { useTranslations } from 'next-intl'

import { ToothWithConditions } from '@/types/dental-conditions'
import { ToothGrid } from './tooth-grid'

interface OdontogramProps {
  teeth: ToothWithConditions[]
  onToothClick: (toothNumber: string) => void
  selectedTooth?: string
  className?: string
}

export function Odontogram({
  teeth,
  onToothClick,
  selectedTooth,
  className = '',
}: OdontogramProps) {
  const t = useTranslations('diagnosis')

  // Organize teeth by quadrants for proper dental layout
  const upperLeftTeeth = teeth
    .filter(tooth => {
      const num = parseInt(tooth.number)
      return num >= 11 && num <= 18
    })
    .sort((a, b) => parseInt(b.number) - parseInt(a.number)) // Right to left

  const upperRightTeeth = teeth
    .filter(tooth => {
      const num = parseInt(tooth.number)
      return num >= 21 && num <= 28
    })
    .sort((a, b) => parseInt(a.number) - parseInt(b.number)) // Left to right

  const lowerLeftTeeth = teeth
    .filter(tooth => {
      const num = parseInt(tooth.number)
      return num >= 31 && num <= 38
    })
    .sort((a, b) => parseInt(b.number) - parseInt(a.number)) // Right to left (31-38)

  const lowerRightTeeth = teeth
    .filter(tooth => {
      const num = parseInt(tooth.number)
      return num >= 41 && num <= 48
    })
    .sort((a, b) => parseInt(a.number) - parseInt(b.number)) // Left to right (48-41)

  return (
    <div className={`odontogram ${className}`}>
      <div className="odontogram-grid space-y-8">
        {/* Upper jaw */}
        <div className="upper-jaw">
          <div className="flex justify-center mb-2">
            <span className="text-sm font-medium text-muted-foreground">
              {t('maxillary')}
            </span>
          </div>
          <div className="flex justify-center gap-12">
            <ToothGrid
              teeth={upperLeftTeeth}
              onToothClick={onToothClick}
              selectedTooth={selectedTooth}
              jaw="upper"
              side="left"
            />
            <div className="w-2" /> {/* Separation */}
            <ToothGrid
              teeth={upperRightTeeth}
              onToothClick={onToothClick}
              selectedTooth={selectedTooth}
              jaw="upper"
              side="right"
            />
          </div>
        </div>

        {/* Lower jaw */}
        <div className="lower-jaw">
          <div className="flex justify-center mb-2">
            <span className="text-sm font-medium text-muted-foreground">
              {t('mandibular')}
            </span>
          </div>
          <div className="flex justify-center gap-12">
            <ToothGrid
              teeth={lowerLeftTeeth}
              onToothClick={onToothClick}
              selectedTooth={selectedTooth}
              jaw="lower"
              side="left"
            />
            <div className="w-2" /> {/* Separation */}
            <ToothGrid
              teeth={lowerRightTeeth}
              onToothClick={onToothClick}
              selectedTooth={selectedTooth}
              jaw="lower"
              side="right"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
