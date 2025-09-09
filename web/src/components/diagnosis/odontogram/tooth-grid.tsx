'use client'

import React from 'react'
import { Tooth } from './tooth'
import { ToothWithConditions } from '@/types/dental-conditions'

interface ToothGridProps {
  teeth: ToothWithConditions[]
  onToothClick: (toothNumber: string) => void
  selectedTooth?: string
}

export function ToothGrid({
  teeth,
  onToothClick,
  selectedTooth,
}: ToothGridProps) {
  return (
    <div className="tooth-grid flex gap-1">
      {teeth.map(tooth => (
        <Tooth
          key={tooth.number}
          tooth={tooth}
          onClick={() => onToothClick(tooth.number)}
          isSelected={selectedTooth === tooth.number}
        />
      ))}
    </div>
  )
}
