'use client'

import React from 'react'

import { ToothWithConditions } from '@/types/dental-conditions'
import { Tooth } from './tooth'

interface ToothGridProps {
  teeth: ToothWithConditions[]
  onToothClick: (toothNumber: string) => void
  selectedTooth?: string
  jaw: 'upper' | 'lower'
  side: 'left' | 'right'
}

export function ToothGrid({
  teeth,
  onToothClick,
  selectedTooth,
  jaw,
  side,
}: ToothGridProps) {
  return (
    <div className="tooth-grid grid grid-cols-8 gap-1 max-w-full overflow-hidden">
      {teeth.map(tooth => (
        <Tooth
          key={tooth.number}
          tooth={tooth}
          onClick={() => onToothClick(tooth.number)}
          isSelected={selectedTooth === tooth.number}
          jaw={jaw}
          side={side}
        />
      ))}
    </div>
  )
}
