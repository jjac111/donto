# Donto — MVP Product Requirements Document (PRD)

## 1) Product vision and goals
Donto is a cloud-based dental clinic administration system for managing patients, providers, clinical records, treatments, and appointments. The MVP focuses on a single clinic (single tenant), delivering core scheduling, basic clinical documentation, and treatment planning to replace spreadsheets and paper workflows. Spanish is the initial target language.

- Primary goal: Enable front-desk and dentists to register patients, schedule visits, capture essential clinical notes, and plan treatments in a simple, reliable app.
- Secondary goal: Provide a central clinic calendar with provider availability and external calendar sync to reduce double-bookings.

## 2) Users and persons (MVP)
- MVP uses a single system role: Admin. All users have full access.
- Person records include Patients and Providers. Not all persons are system users.
- Future: granular roles/permissions to be added post-MVP without major refactor.

## 3) MVP scope (what’s in)
- Patient registry: create/edit patients, demographics, contact info, identifiers.
- Representatives/guardians: link underage (or dependent) patients to adult representatives with contact and consent info.
- Provider directory: create/edit providers, specialties.
- Appointments and scheduling:
  - Create/edit/cancel appointments with patient, provider, date/time, duration, reason.
  - Central clinic calendar views (day/week), filter by provider.
  - Prevent double-booking the same provider time slot.
  - External calendar sync (provider calendars) — baseline support (see 7.4).
- Clinical notes: basic encounter notes (subjective/objective/assessment/plan or simplified SOAP), per-visit; finalize with addenda.
- Treatment plans and procedures: define planned procedures per patient, mark as completed during visits, track status.
- Authentication & authorization: single-role now; architecture prepared for future RBAC.
- Internationalization: Spanish-first UI; i18n scaffolding in place for future languages.
- Tooth-level data capture (minimal): record initial tooth condition baseline at patient onboarding and specify tooth targets for treatment items via form fields (no graphical odontogram UI in MVP).

## 4) Out of scope for MVP (post-MVP targets)
- Reporting and data export (CSV or dashboards).
- Audit trail/change history UI and detailed logging (reserve hooks for later).
- Patient file uploads (PDFs/images) and document management.
- Appointment reminders and notifications (including WhatsApp/SMS/email).
- Graphical odontogram/charting UI and overlays.
- Imaging/PACS integrations (e.g., panoramic/CBCT).
- Patient portal and online booking.
- Multi-location org hierarchy and cross-location scheduling.
- Localization beyond Spanish.
- Billing, payments, insurance claims/eligibility.

## 5) Success metrics (MVP)
- Time-to-schedule: create an appointment in ≤ 30 seconds.
- Time-to-register: create a patient (with representative if needed) in ≤ 60 seconds.
- Reliability: no data loss incidents; uptime ≥ 99.5% (business hours focus).
- Adoption: at least 3 active clinics using core flows for 2+ weeks.

## 6) Core user stories (MVP)
- As an Admin, I can register a new patient with contact details in under a minute.
- As an Admin, I can add a representative for a minor patient and capture consent details.
- As an Admin, I can find an open slot and book an appointment for a patient.
- As an Admin (provider), I can open a patient’s chart, review basic history, and document today’s visit with a simple note.
- As an Admin (provider), I can create a treatment plan with multiple procedures and update statuses (planned, in-progress, done), specifying the tooth where applicable.
- As an Admin, I can connect a provider’s external calendar so clinic bookings appear in their personal calendar.

## 7) Functional requirements (high level)

### 7.1 Authentication & authorization
- Email/password sign-in with secure session management.
- Single system role in MVP (Admin) with full access.
- RBAC-ready architecture to add granular roles later without breaking changes.
- Session timeout and sign-out behavior.

### 7.2 Clinic & provider management
- Create/edit clinic profile (name, address, contact).
- Create/edit providers, specialties, and basic availability windows.
- Store per-provider external calendar linkage (e.g., Google/Microsoft) metadata.

### 7.3 Patient management
- Create/edit patients: name, DOB, sex, contact info, identifiers (e.g., MRN), allergies, brief medical history (free text for MVP).
- Add representative/guardian: name, relationship, contact info, and consent notes.
- Record initial tooth condition baseline using simple tooth-level fields (e.g., present/missing/treated/notes) without graphical charting.
- Search patients by name, phone, or ID.

### 7.4 Appointments & scheduling
- Create/edit/cancel appointments with patient, provider, date/time, duration, reason.
- Calendar views: day and week; filter by provider; central clinic calendar.
- Prevent double-booking the same provider time slot.
- External calendar sync (baseline):
  - One-way push from Donto to provider calendar when an appointment is created/updated/cancelled.
  - Read provider busy times for conflict checks if feasible; otherwise, start with push-only and iterate.

### 7.5 Clinical notes
- Per-visit note tied to an appointment (or standalone if needed).
- Template: simple free-text or SOAP fields (configurable minimal template).
- Read-only after finalization with an addendum mechanism.

### 7.6 Treatment plans & procedures
- Create a plan per patient; add planned procedures with code/name, tooth (required when applicable), notes, and status.
- Mark procedures as completed with date/provider and tooth reference.
- View history of completed procedures per patient.

### 7.7 Internationalization (i18n)
- Spanish-first UI content.
- Centralized translation framework and string catalog to enable future languages.

## 8) Non-functional requirements (NFRs)
- Security: TLS everywhere; least-privilege access; secure storage of secrets.
- Privacy: PII protection. Reserve audit hooks for writes; full audit trail post-MVP.
- Performance: common list views return in ≤ 500ms P95 for typical clinic data volumes.
- Availability: target 99.5%+ during business hours; planned maintenance off-hours with notice.
- Observability: structured logging and minimal error tracking for client and server.
- Internationalization: Spanish as default; all user-facing strings translatable.
- Data portability: Post-MVP; avoid design decisions that block exports.

## 9) Data model overview (conceptual)
Entities:
- Clinic
- Provider (with optional ExternalCalendarLink)
- Patient
- PatientRepresentative (links Patient to a Representative person/contact)
- Appointment
- ClinicalNote
- TreatmentPlan
- TreatmentItem
- (Post-MVP) AuditLog

Key relationships:
- Clinic has many Providers and Patients.
- Patient has many Appointments, ClinicalNotes, TreatmentPlans, and PatientRepresentatives.
- TreatmentPlan has many TreatmentItems; TreatmentItem can be linked to an Appointment when completed.

Tooth-level data (MVP):
- Tooth reference stored on TreatmentItem and in Patient’s baseline record using a chosen numbering system.
- Graphical display deferred; captured via form fields.

Note: This section is conceptual; specific schemas are defined during implementation.

## 10) Privacy, compliance, and risk
- Handle PII with care; restrict access; log sensitive writes where feasible.
- Regulatory requirements for initial markets are TBD; design for configurability of data residency if needed.
- Backups and restore strategy appropriate for MVP; document RPO/RTO targets for leadership.

## 11) Operational considerations
- Environment separation: development, staging, production.
- Minimal operations RBAC: who can deploy, view logs, run diagnostics.
- Incident response basics: error tracking alert to on-call channel; acknowledge within business-day SLA.

## 12) Phased roadmap
- Phase 0 — Project setup: repo, CI, environments, auth, skeleton UI, RBAC scaffolding, Spanish i18n baseline.
- Phase 1 — Patients & Providers: registry screens, search, representatives, provider availability, external calendar linkage metadata.
- Phase 2 — Scheduling: appointment CRUD, central clinic calendar views, double-booking prevention, one-way calendar push.
- Phase 3 — Clinical notes: per-visit notes, finalize and addendum.
- Phase 4 — Treatment plans: create plans, manage items, mark complete; tooth-level fields required where applicable.
- Phase 5 — Hardening: performance, UX polish, minimal write-audit hooks (no UI), documentation.
- Post-MVP — Graphical odontogram UI, reporting/exports, full audit trail UI, notifications (WhatsApp/SMS/email), portal/online booking, imaging.

## 13) Assumptions (MVP)
- Single clinic (single tenant) in MVP; multi-location is post-MVP.
- Spanish-first UI; additional languages are post-MVP.
- Desktop-first UX; mobile web should be usable but not optimized.
- No appointment reminders in MVP.
- No patient file uploads in MVP.
- No graphical odontogram UI in MVP (tooth-level data captured via forms).

## 14) Open questions
- Regulatory constraints for initial markets (e.g., PHI storage location) — TBD.
- Tooth numbering system: FDI (ISO-3950) vs Universal vs Palmer — which to adopt first?
- Which external calendar providers to support first (Google, Microsoft 365, both)?
- Do we need provider busy-time reads in MVP or can we defer to post-MVP iteration?

## 15) Risks and mitigations
- Scope creep from advanced dental-specific features (odontogram, imaging): strictly gate to post-MVP.
- Scheduling complexity (availability, overlapping roles, external calendar conflicts): start with push-only; validate with early users, iterate to read busy times.
- Adoption risk: keep flows Spanish-first, fast, and low-friction.

## 16) Glossary (selected)
- Clinical Note: Documentation for a patient visit.
- Treatment Plan: Planned procedures for a patient over time.
- Procedure: A discrete dental service item (e.g., filling, cleaning) tracked individually.
- External Calendar Link: Association between a provider and their personal calendar for sync.
- Patient Representative: An adult authorized to act on behalf of a patient.

---
Version: 0.3 (representatives + tooth-level data baseline)
Owner: Product
Last updated: TBD
