# Donto Design System

## Overview

Design system built on Tailwind CSS v4 and shadcn/ui components, optimized for dental practice management workflows.

## Color Palette

### Primary Colors
- **Primary**: `oklch(0.205 0 0)` - Dark gray for primary actions
- **Primary Foreground**: `oklch(0.985 0 0)` - Light text on primary
- **Secondary**: `oklch(0.97 0 0)` - Light gray for secondary actions
- **Secondary Foreground**: `oklch(0.205 0 0)` - Dark text on secondary

### Semantic Colors
- **Destructive**: `oklch(0.577 0.245 27.325)` - Red for errors/danger
- **Muted**: `oklch(0.97 0 0)` - Subtle backgrounds
- **Muted Foreground**: `oklch(0.556 0 0)` - Subtle text
- **Accent**: `oklch(0.97 0 0)` - Accent backgrounds
- **Accent Foreground**: `oklch(0.205 0 0)` - Accent text

### Surface Colors
- **Background**: `oklch(1 0 0)` - Main background (white)
- **Foreground**: `oklch(0.145 0 0)` - Main text (dark gray)
- **Card**: `oklch(1 0 0)` - Card backgrounds
- **Card Foreground**: `oklch(0.145 0 0)` - Card text
- **Border**: `oklch(0.922 0 0)` - Borders and dividers
- **Input**: `oklch(0.922 0 0)` - Input backgrounds
- **Ring**: `oklch(0.708 0 0)` - Focus rings

### Dark Mode
All colors have dark mode variants defined in CSS variables.

## Typography

### Font Stack
- **Sans**: `var(--font-geist-sans)` - Primary font for UI
- **Mono**: `var(--font-geist-mono)` - Code and data display

### Text Sizes
- **xs**: `0.75rem` (12px) - Small labels, captions
- **sm**: `0.875rem` (14px) - Body text, form labels
- **base**: `1rem` (16px) - Default body text
- **lg**: `1.125rem` (18px) - Large body text
- **xl**: `1.25rem` (20px) - Small headings
- **2xl**: `1.5rem` (24px) - Medium headings
- **3xl**: `1.875rem` (30px) - Large headings
- **4xl**: `2.25rem` (36px) - Extra large headings

## Spacing System

### Base Unit: 0.25rem (4px)

- **xs**: `0.25rem` (4px)
- **sm**: `0.5rem` (8px)
- **md**: `0.75rem` (12px)
- **lg**: `1rem` (16px)
- **xl**: `1.5rem` (24px)
- **2xl**: `2rem` (32px)
- **3xl**: `3rem` (48px)
- **4xl**: `4rem` (64px)

## Border Radius

- **sm**: `calc(var(--radius) - 4px)` - Small elements
- **md**: `calc(var(--radius) - 2px)` - Medium elements
- **lg**: `var(--radius)` - Large elements (default: 0.625rem)
- **xl**: `calc(var(--radius) + 4px)` - Extra large elements

## Component Variants

### Button Variants
- **default**: Primary button style
- **secondary**: Secondary button style
- **destructive**: Danger/delete actions
- **outline**: Outlined button style
- **ghost**: Minimal button style
- **link**: Link-style button

### Button Sizes
- **sm**: Small buttons (compact)
- **md**: Medium buttons (default)
- **lg**: Large buttons (prominent)

### Input Variants
- **default**: Standard input style
- **error**: Error state styling
- **disabled**: Disabled state styling

## Dental-Specific Components

### Odontogram
- **Tooth Size**: 32px × 32px base
- **Surface Colors**: 
  - Healthy: `oklch(0.97 0 0)` (muted)
  - Caries: `oklch(0.577 0.245 27.325)` (destructive)
  - Filled: `oklch(0.646 0.222 41.116)` (chart-1)
  - Crown: `oklch(0.6 0.118 184.704)` (chart-2)
  - Missing: `oklch(0.708 0 0)` (ring)

### Treatment Plan Colors
- **Planned**: `oklch(0.6 0.118 184.704)` (chart-2)
- **In Progress**: `oklch(0.828 0.189 84.429)` (chart-4)
- **Completed**: `oklch(0.398 0.07 227.392)` (chart-3)

## Usage Guidelines

### Accessibility
- Minimum contrast ratio: 4.5:1 for normal text
- Focus indicators on all interactive elements
- Semantic HTML structure

### Performance
- Use CSS variables for theming
- Prefer Tailwind utilities over custom CSS
- Optimize for mobile-first responsive design

### Consistency
- Use design tokens for all spacing, colors, and typography
- Follow shadcn/ui component patterns
- Maintain consistent interaction patterns across the app
