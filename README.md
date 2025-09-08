# Donto

<p align="center">
  <img src="web/public/logos/logo-transparent-circle.png" alt="Donto logo" width="240" />
</p>

## Overview

Donto is a cloud-based dental clinic administration system. The MVP targets a single clinic (single tenant) and focuses on the fastest possible flows for patient registration, appointment scheduling, basic clinical notes, and treatment planning. Spanish is the default UI language with full i18n support.

- **Core goals**: register patients in ≤60s, schedule visits in ≤30s, and keep clinical documentation frictionless.
- **Design principles**: ease of use, great data visibility, fewer clicks, modern layouts, zero tolerance for user frustration.

## Current Scope (MVP)

- Patient registry (demographics, contacts, identifiers)
- Representatives/guardians for underage patients
- Provider directory and availability metadata
- Appointments: create/edit/cancel, day/week calendar, provider filters, double-booking prevention, iCal invites to providers
- Clinical notes: simple free text or SOAP; finalize with addendum
- Treatment plans: planned procedures, status tracking, completion logging
- Odontogram: interactive tooth diagram using FDI numbering with 5-section tooth model (center + 4 surfaces)
- Authentication: email/password, single Admin role for MVP; RBAC-ready architecture
- Spanish-first UI with i18n scaffolding

For full details, see the PRD.

## Roadmap

Active plan is a 4-week push to MVP with staged delivery of Patients/Providers → Scheduling → Clinical features → Production readiness.

- Docs:
  - PRD: `docs/prd/donto-mvp-prd.md`
  - Core Principles: `docs/prd/donto-core-principles.md`
  - UI Architecture: `docs/ui/ui-architecture.md`
  - Implementation Roadmap: `docs/roadmap/mvp-implementation-roadmap.md`

Post-MVP targets include multi-tenant architecture, patient portal, online booking, advanced odontogram, reporting, and billing.

## Tech Stack

- Web App: Next.js 15, React 19, TypeScript, Tailwind CSS v4, shadcn/ui
- State/Data: Zustand, TanStack Query
- i18n: next-intl (Spanish-first; strings in `web/messages/`)
- Backend/DB: Supabase (PostgreSQL) with RLS, SQL functions, and typed client
- Auth: Supabase Auth (email/password)
- Email: Resend (for calendar invites; iCal attachments)
- Testing: Vitest (unit + database integration tests)
- Tooling: ESLint, Prettier, TypeScript strict
- Hosting: Live at [dontosoft.com](https://dontosoft.com)

## Repository Structure

```
docs/            Product docs, PRD, roadmap, UI architecture
supabase/        Config, migrations, seed data
web/             Next.js app (app router)
  src/app/       Routes (dashboard, patients, etc.)
  src/components UI components (shadcn/ui-based)
  src/store/     Zustand stores
  src/lib/       API and utilities
  public/logos/  Brand assets
```

## Getting Started (Dev)

1) Install deps

```bash
cd web && npm install
```

2) Run the app

```bash
npm run dev
```

Open `http://localhost:3000`.

Environment variables and secrets are required for local auth/email; keep all secrets outside the repo.

## Internationalization

Spanish is the default UI. All user-facing strings must be translatable. See `web/messages/` and `web/src/i18n/`.

## Status

MVP in active development; see `docs/roadmap/mvp-implementation-roadmap.md` for the latest status and daily checklist.

**Live Demo**: [dontosoft.com](https://dontosoft.com)

## License

MIT License - see [LICENSE](LICENSE) file for details.


