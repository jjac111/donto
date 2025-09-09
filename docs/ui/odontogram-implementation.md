# Odontogram Implementation Plan

## Overview

The odontogram component provides a visual interface for recording and tracking dental conditions per tooth surface. This document outlines the implementation approach for integrating odontogram functionality into patient diagnosis workflow.

## Requirements

### Core Functionality
- Visual dental chart with FDI tooth numbering system
- Interactive tooth selection (whole tooth click)
- Surface-specific condition recording (5 sections per tooth)
- Condition evolution/history tracking
- Mobile-friendly interaction model

### Technical Specifications
- **Tooth Layout**: Simplified grid view with each tooth as a square
- **Surface Model**: 5-section tooth (center + 4 cardinal surfaces: M, D, B, L, O)
- **Interaction**: Click whole tooth → opens condition form dialog
- **Data Structure**: Normalized conditions with categories and evolution tracking
- **UI Framework**: React + TypeScript + shadcn/ui components

## Architecture

### Component Structure

```
components/diagnosis/
├── odontogram/
│   ├── odontogram.tsx           # Main odontogram component
│   ├── tooth.tsx                # Individual tooth component
│   ├── tooth-grid.tsx           # Grid layout component
│   └── tooth-surfaces.tsx       # Surface visualization
├── diagnosis-form.tsx           # Condition entry dialog
├── condition-history.tsx        # Evolution tracking
└── dental-conditions.ts         # Condition definitions
```

### Data Flow

1. **Patient Load**: Fetch existing tooth conditions for patient
2. **Odontogram Display**: Render teeth with current condition indicators
3. **Tooth Selection**: User clicks tooth → opens condition dialog
4. **Condition Entry**: User selects surfaces and conditions via form
5. **Data Persistence**: Save conditions with timestamp and provider
6. **History Tracking**: Maintain evolution of conditions over time

## Tooth Model

### Visual Design
- **Shape**: Square with central square for occlusal/incisal surface
- **Sections**: 4 surrounding sections for cardinal surfaces
- **Color Coding**: Different colors for different condition types
- **Numbering**: FDI system displayed prominently

### Surface Mapping
```
┌─────┬─────┐
│  M  │  D  │
├─────┼─────┤
│  B  │  L  │
├─────┼─────┤
│     O     │
└───────────┘
```

Where:
- **M**: Mesial (anterior surface)
- **D**: Distal (posterior surface)
- **B**: Buccal (cheek-facing surface)
- **L**: Lingual (tongue-facing surface)
- **O**: Occlusal/Incisal (biting surface)

## Condition System

### Condition Categories

```typescript
interface DentalCondition {
  id: string
  category: 'ortodoncia' | 'cirugia' | 'endodoncia' | 'general' | 'periodoncia' | 'protesis'
  name: string
  description: string
  color: string
  severity: 'bajo' | 'medio' | 'alto' | 'critico'
}
```

### Sample Conditions (dental-conditions.json)

```json
{
  "ortodoncia": [
    {
      "id": "maloclusion_clase_i",
      "name": "Maloclusión Clase I",
      "description": "Relación molar normal con apiñamiento dental",
      "color": "#FFD700",
      "severity": "medio"
    }
  ],
  "cirugia": [
    {
      "id": "extraccion_indicada",
      "name": "Extracción Indicada",
      "description": "Diente requiere extracción quirúrgica",
      "color": "#FF6B6B",
      "severity": "alto"
    }
  ],
  "endodoncia": [
    {
      "id": "necrosis_pulpar",
      "name": "Necrosis Pulpar",
      "description": "Muerte del tejido pulpar",
      "color": "#4ECDC4",
      "severity": "alto"
    }
  ],
  "general": [
    {
      "id": "caries",
      "name": "Caries Dental",
      "description": "Lesión cariosa activa",
      "color": "#FF8C00",
      "severity": "medio"
    },
    {
      "id": "restauracion",
      "name": "Restauración",
      "description": "Obturación o corona existente",
      "color": "#98D8C8",
      "severity": "bajo"
    }
  ]
}
```

## Database Integration

### Existing Schema Utilization
- **tooth_conditions** table: Stores condition per surface
- **patients** table: Links conditions to patient
- **providers** table: Tracks who recorded conditions

### New Requirements
- **condition_evolution** table: Track changes over time
- **condition_templates** table: Predefined condition types

## UI/UX Considerations

### Mobile Optimization
- **Touch Targets**: Minimum 44px for clickable areas
- **Dialog Centering**: Modal dialogs for condition entry
- **Swipe Gestures**: Navigate between teeth/sections
- **Responsive Grid**: Adaptive layout for different screen sizes

### Accessibility
- **Keyboard Navigation**: Arrow keys for tooth selection
- **Screen Reader**: Descriptive labels for surfaces and conditions
- **Color Contrast**: High contrast ratios for condition indicators
- **Focus Management**: Proper focus flow in dialogs

### Performance
- **Virtualization**: Only render visible teeth in large grids
- **Lazy Loading**: Load condition data on demand
- **Optimistic Updates**: Immediate UI feedback for condition changes
- **Caching**: Cache condition templates and patient data

## Implementation Phases

### Phase 1: Core Odontogram
- Create tooth grid component
- Implement basic tooth rendering
- Add FDI numbering system
- Style with shadcn/ui design system

### Phase 2: Condition Management
- Create dental conditions JSON
- Build condition form dialog
- Implement surface selection UI
- Add condition persistence

### Phase 3: Integration & History
- Integrate into patient detail page
- Implement condition evolution tracking
- Add history viewing capabilities
- Polish mobile experience

### Phase 4: Advanced Features
- Bulk condition operations
- Condition filtering/search
- Export capabilities
- Integration with treatment planning

## Testing Strategy

### Unit Tests
- Tooth component rendering
- Surface selection logic
- Condition form validation
- Data transformation utilities

### Integration Tests
- End-to-end condition recording workflow
- Database persistence and retrieval
- Mobile responsiveness
- Accessibility compliance

### User Acceptance Testing
- Dental professional workflow validation
- Performance with large condition sets
- Edge case handling (missing teeth, complex conditions)

## Success Metrics

- **Usability**: Time to record conditions for a full mouth examination
- **Accuracy**: Reduction in data entry errors
- **Performance**: Load times for odontogram with condition history
- **Accessibility**: WCAG 2.1 AA compliance score
- **Mobile**: Touch interaction success rate

## Future Enhancements

- **3D Visualization**: Advanced tooth models with 3D rendering
- **AI Integration**: Automated condition detection from images
- **Collaborative Editing**: Multiple providers editing simultaneously
- **Template System**: Predefined condition sets for common procedures
- **Analytics**: Condition trends and treatment outcome tracking
