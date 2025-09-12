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
      return num >= 41 && num <= 48
    })
    .sort((a, b) => parseInt(b.number) - parseInt(a.number)) // Right to left (31-38)

  const lowerRightTeeth = teeth
    .filter(tooth => {
      const num = parseInt(tooth.number)
      return num >= 31 && num <= 38
    })
    .sort((a, b) => parseInt(a.number) - parseInt(b.number)) // Left to right (48-41)

  return (
    <div
      className={`odontogram w-full max-w-full overflow-hidden ${className}`}
    >
      <div className="odontogram-grid space-y-6 w-full">
        {/* Mobile: All 4 grids stacked vertically */}
        <div className="flex flex-col md:hidden gap-6">
          {/* Upper Left Quadrant */}
          <div className="flex flex-col items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">
              {t('maxillary')} - {t('left')}
            </span>
            <ToothGrid
              teeth={upperLeftTeeth}
              onToothClick={onToothClick}
              selectedTooth={selectedTooth}
              jaw="upper"
              side="left"
            />
          </div>

          {/* Upper Right Quadrant */}
          <div className="flex flex-col items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">
              {t('maxillary')} - {t('right')}
            </span>
            <ToothGrid
              teeth={upperRightTeeth}
              onToothClick={onToothClick}
              selectedTooth={selectedTooth}
              jaw="upper"
              side="right"
            />
          </div>
        </div>

        {/* Desktop: Upper quadrants in one row */}
        <div className="hidden md:flex flex-col gap-6">
          <div className="flex flex-row justify-evenly gap-8">
            {/* Upper Left Quadrant */}
            <div className="flex flex-col items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">
                {t('maxillary')} - {t('left')}
              </span>
              <ToothGrid
                teeth={upperLeftTeeth}
                onToothClick={onToothClick}
                selectedTooth={selectedTooth}
                jaw="upper"
                side="left"
              />
            </div>

            {/* Upper Right Quadrant */}
            <div className="flex flex-col items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">
                {t('maxillary')} - {t('right')}
              </span>
              <ToothGrid
                teeth={upperRightTeeth}
                onToothClick={onToothClick}
                selectedTooth={selectedTooth}
                jaw="upper"
                side="right"
              />
            </div>
          </div>

          {/* Desktop: Lower quadrants in one row */}
          <div className="flex flex-row justify-evenly gap-8">
            {/* Lower Left Quadrant */}
            <div className="flex flex-col items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">
                {t('mandibular')} - {t('left')}
              </span>
              <ToothGrid
                teeth={lowerLeftTeeth}
                onToothClick={onToothClick}
                selectedTooth={selectedTooth}
                jaw="lower"
                side="left"
              />
            </div>

            {/* Lower Right Quadrant */}
            <div className="flex flex-col items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">
                {t('mandibular')} - {t('right')}
              </span>
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

        {/* Mobile/Tablet: Lower Right first, then Lower Left */}
        <div className="flex flex-col md:hidden gap-6">
          <div className="flex flex-col items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">
              {t('mandibular')} - {t('right')}
            </span>
            <ToothGrid
              teeth={lowerRightTeeth}
              onToothClick={onToothClick}
              selectedTooth={selectedTooth}
              jaw="lower"
              side="right"
            />
          </div>
          <div className="flex flex-col items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">
              {t('mandibular')} - {t('left')}
            </span>
            <ToothGrid
              teeth={lowerLeftTeeth}
              onToothClick={onToothClick}
              selectedTooth={selectedTooth}
              jaw="lower"
              side="left"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
