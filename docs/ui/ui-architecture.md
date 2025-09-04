# Donto UI Architecture

## Purpose

Define the UI/UX structure grounded in real user journeys, aligned with Core Product Principles and i18n-first development.

## Personas (Draft)

- Provider (Dentist/Odontologist)
- Assistant/Reception
- Clinic Administrator

## Core Journeys → Pages

### Authentication and clinic context

- Login → Clinic selection (if applicable) → Dashboard
- Switch clinic from app (switcher in header)

### Schedule and appointments

- View calendar (day/week) → View availability → Create/edit appointment
- Search patient from calendar → View quick detail → Schedule

### Patients

- Search/list patients → Create patient → View patient record
- Record: basic data, history, odontogram, treatment plans, notes, attachments

### Clinical Workflows

- View patient → Create/edit treatment plan → Add procedures to plan
- Treatment plan → Generate cost estimate → Create estimate document
- Patient visit → Create clinical note (SOAP or simplified) → Link to treatment plan
- Treatment execution → Update procedure status → Track completion

### Cost Estimation & Documentation

- Select treatment plan → Choose procedures → Calculate costs → Generate estimate
- Estimate → Send to patient → Track approval → Convert to treatment order
- Treatment completion → Generate invoice → Payment tracking

### Clinic/Administration

- Clinic configuration (data, users/roles)
- Procedure catalogs (services, materials, pricing)
- Treatment templates and protocols

## Page Hierarchy & Navigation

### File Structure (Next.js app directory)

- /auth
  - /auth/login
  - /auth/clinic-picker
- /app (protected route: requires session + active clinic)
  - /app/dashboard
  - /app/schedule (calendar)
  - /app/patients
    - /app/patients/new
    - /app/patients/[id]
      - /app/patients/[id]/summary
      - /app/patients/[id]/odontogram
      - /app/patients/[id]/plans
      - /app/patients/[id]/notes
      - /app/patients/[id]/files
  - /app/treatments
    - /app/treatments/plans
    - /app/treatments/plans/[id]
    - /app/treatments/plans/[id]/estimate
  - /app/estimates
    - /app/estimates/new
    - /app/estimates/[id]
  - /app/clinical-notes
    - /app/clinical-notes/new
    - /app/clinical-notes/[id]
  - /app/settings
    - /app/settings/clinic
    - /app/settings/users
    - /app/settings/procedures

### Actual URL Routes

- /login
- /clinic-picker
- /dashboard
- /schedule
- /patients
- /patients/new
- /patients/[id]
- /patients/[id]/summary
- /patients/[id]/odontogram
- /patients/[id]/plans
- /patients/[id]/notes
- /patients/[id]/files
- /treatments
- /treatments/plans
- /treatments/plans/[id]
- /treatments/plans/[id]/estimate
- /estimates
- /estimates/new
- /estimates/[id]
- /clinical-notes
- /clinical-notes/new
- /clinical-notes/[id]
- /settings
- /settings/clinic
- /settings/users
- /settings/procedures

## Protected Route Rules

- Requires authenticated user and valid `activeClinic`
- If no active clinic → redirect to `/auth/clinic-picker`
- Validate session expiration and handle renewal (clear UX with proper i18n)

## Key Screens (Definition of Done)

- Login:
  - Form with i18n, immediate feedback, clear errors
- Clinic Picker:
  - List of user's clinics with visible role, loading/error states
  - Selection establishes active session and redirects to `/app/dashboard`
- Dashboard:
  - Shortcuts to common tasks (create appointment, search patient)
  - Useful empty state
- Agenda:
  - Day/week view, inline create/edit appointment, quick patient search
- Patients (list):
  - Quick search and filters, results in ≤200ms P95
- Patient (detail):
  - Tab navigation: Summary, Odontogram (FDI, 5 sections), Plans (link surfaces), Notes (SOAP and simple), Files
- Treatment Plans:
  - List of patient treatment plans, create new plan, link procedures to tooth surfaces
- Cost Estimates:
  - Generate from treatment plan, calculate totals, create printable estimate document
- Clinical Notes:
  - SOAP format and simplified notes, link to treatment plans and procedures

## Component Reuse Strategy (shadcn/ui)

- Header with clinic switcher (`ClinicSwitcher`), user menu, global search
- `ClinicPicker` (auth) and `ClinicSwitcher` (layout) share `Profile` typing
- Forms with Zod and i18n
- Odontogram: modular component with surfaces and states, performant
- Treatment plan builder: procedure selection, tooth surface linking
- Cost calculator: dynamic pricing, estimate document generation
- Clinical note editor: SOAP templates, procedure linking

## State & i18n

- All text with i18n support (default locale configurable)
- Global auth state: `availableClinics`, `activeClinic`, session
- Navigation and permissions derived from user role per clinic

## Acceptance Criteria (MVP UI)

- User enters, selects clinic (if applicable) and reaches dashboard without friction
- Create appointment from agenda in ≤30s total
- Search patient in ≤200ms P95
- View and edit odontogram with fast and intuitive interactions
- Create treatment plan with procedure selection in ≤60s
- Generate cost estimate from treatment plan in ≤30s
- Create clinical note (SOAP or simple) in ≤45s

## Open Questions

- Initial scope of configuration (catalogs/procedures) in MVP?
- Mobile support priority for agenda vs. patient detail?
