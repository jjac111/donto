# Donto — MVP Product Requirements Document (PRD)

## 1) Product vision and goals
Donto is a cloud-based dental clinic administration system for managing patients, providers, clinical records, treatments, and appointments. The MVP focuses on a single clinic (single tenant), delivering core scheduling, basic clinical documentation, and treatment planning to replace spreadsheets and paper workflows.

- Primary goal: Enable front-desk and dentists to register patients, schedule visits, capture essential clinical notes, and plan treatments in a simple, reliable app.
- Secondary goal: Provide minimal reporting and exports so clinics can get data out without vendor lock-in.

## 2) Users and roles
- Clinic Admin: Manages clinic settings, providers, roles, and permissions.
- Dentist/Provider: Reviews patient records, documents visits, creates treatment plans, and completes procedures.
- Assistant/Receptionist: Registers patients, manages schedules, checks patients in/out.
- Hygienist: Documents hygiene visits, notes, and completes relevant procedures.
- (Post-MVP) Patient Portal User: Views upcoming appointments, basic records, and receives reminders.

MVP roles & permissions (high level):
- Admin: Full access to clinic configuration and all records.
- Dentist/Provider: Read/write for assigned patient records, clinical notes, treatment plans, schedule.
- Receptionist/Assistant: Read/write for patients and appointments; read-only clinical notes; no deletion of clinical records.
- Hygienist: Read/write for hygiene notes and appointments; read-only for treatment plans not owned.

## 3) MVP scope (what’s in)
- Patient registry: create/edit patients, demographics, contact info, identifiers.
- Provider directory: create/edit providers, specialties.
- Appointments: create/edit/cancel, daily/weekly calendar views, basic search and filtering.
- Clinical notes: basic encounter notes (subjective/objective/assessment/plan or simplified SOAP), per-visit.
- Treatment plans and procedures: define planned procedures per patient, mark as completed during visits, track status.
- Access control: role-based access at a coarse level.
- Basic reporting: daily schedule export, patient list export, procedure log export (CSV).
- Audit trail: minimal change log for critical entities (patients, appointments, notes, treatment items).

## 4) Out of scope for MVP (post-MVP targets)
- Insurance claims, eligibility, EDI, and prior auth workflows.
- Billing & payments, invoicing, and POS integrations.
- Inventory and consumables management.
- E-prescriptions and lab orders.
- Imaging/PACS integrations (e.g., panoramic/CBCT), odontogram with charting overlays.
- Patient portal, reminders via SMS/WhatsApp, and online booking.
- Multi-location org hierarchy and cross-location scheduling.
- Advanced analytics dashboards and cohort reporting.
- Localization beyond English and multi-currency.

## 5) Success metrics (MVP)
- Time-to-schedule: front-desk can create an appointment in ≤ 30 seconds.
- Reliability: no data loss incidents; uptime ≥ 99.5% (business hours focus).
- Data export: users can export patient list and daily schedule successfully.
- Adoption: at least 3 active clinics using core flows for 2+ weeks.

## 6) Core user stories (MVP)
- As a Receptionist, I can register a new patient with contact details in under a minute.
- As a Receptionist, I can find an open slot and book an appointment for a patient.
- As a Dentist, I can open a patient’s chart, review basic history, and document today’s visit with a simple note.
- As a Dentist, I can create a treatment plan with multiple procedures and update statuses (planned, in-progress, done).
- As an Admin, I can add providers and set their working hours/availability.
- As any authorized user, I can export today’s schedule to CSV.

## 7) Functional requirements (high level)

### 7.1 Authentication & authorization
- Email/password sign-in with secure session management.
- Role-based authorization guards at route and API levels.
- Session timeout and sign-out behavior.

### 7.2 Clinic & provider management
- Create/edit clinic profile (name, address, contact).
- Create/edit providers, specialties, and basic availability windows.

### 7.3 Patient management
- Create/edit patients: name, DOB, sex, contact info, identifiers (e.g., MRN), allergies, brief medical history (free text for MVP).
- Search patients by name, phone, or ID.

### 7.4 Appointments & scheduling
- Create/edit/cancel appointments with patient, provider, date/time, duration, reason.
- Calendar views: day and week; filter by provider.
- Prevent double-booking the same provider time slot.
- Appointment statuses: scheduled, arrived, in-progress, completed, cancelled, no-show.

### 7.5 Clinical notes
- Per-visit note tied to an appointment (or standalone if needed).
- Template: simple free-text or SOAP fields (configurable minimal template).
- Read-only after finalization with an addendum mechanism.

### 7.6 Treatment plans & procedures
- Create a plan per patient; add planned procedures with code/name, tooth (optional), notes, and status.
- Mark procedures as completed with date/provider.
- View history of completed procedures per patient.

### 7.7 Reporting & data export
- CSV exports: patient list, today’s schedule, procedure log by date range.
- Minimal on-screen reports for the above.

### 7.8 Auditing & change history
- Log create/update/delete for patients, appointments, notes finalization, and treatment items.
- Viewable audit entries per record (basic timeline).

## 8) Non-functional requirements (NFRs)
- Security: TLS everywhere; least-privilege access; secure storage of secrets.
- Privacy: PII protection, audit logging of reads/writes to clinical data (at least writes in MVP).
- Performance: common list views return in ≤ 500ms P95 for typical clinic data volumes.
- Availability: target 99.5%+ during business hours; planned maintenance off-hours with notice.
- Observability: structured logging and minimal error tracking for client and server.
- Data portability: CSV exports available for key datasets without vendor lock-in.

## 9) Data model overview (conceptual)
Entities:
- Clinic
- Provider
- Patient
- Appointment
- ClinicalNote
- TreatmentPlan
- TreatmentItem
- AuditLog

Key relationships:
- Clinic has many Providers and Patients.
- Patient has many Appointments, ClinicalNotes, and TreatmentPlans.
- TreatmentPlan has many TreatmentItems; TreatmentItem can be linked to an Appointment when completed.
- AuditLog references entity type and entity ID.

Note: This section is conceptual; specific schemas and migrations are defined separately during implementation.

## 10) Privacy, compliance, and risk
- Handle PII with care: restrict exports to authorized users; log sensitive changes.
- Consent forms, e-signatures, and HIPAA/GDPR-grade features are post-MVP; however, follow best practices to avoid rework.
- Backups and restore strategy appropriate for MVP; document RPO/RTO targets for leadership.

## 11) Operational considerations
- Environment separation: development, staging, production.
- Minimal RBAC for operations: who can deploy, view logs, run diagnostics.
- Incident response basics: error tracking alert to on-call channel; acknowledge within business-day SLA.

## 12) Phased roadmap
- Phase 0 — Project setup: repo, CI, environments, auth, skeleton UI, RBAC scaffolding.
- Phase 1 — Patients & Providers: registry screens, search, provider availability.
- Phase 2 — Scheduling: appointment CRUD, calendar views, double-booking prevention.
- Phase 3 — Clinical notes: per-visit notes, finalize and addendum.
- Phase 4 — Treatment plans: create plans, manage items, mark complete.
- Phase 5 — Reporting & auditing: CSV exports, basic on-screen reports, audit log views.
- Phase 6 — Hardening & launch: NFR checks, performance, UX polish, documentation.

## 13) Assumptions (MVP)
- Single clinic (single tenant) in MVP; multi-location is post-MVP.
- English-only UI; single currency; no tax or billing logic.
- Desktop-first UX; mobile web should be usable but not optimized.
- One-way reminders (if any) are optional and email-only; SMS is post-MVP.
- Imaging integrations, odontogram charting, and insurance flows are out-of-scope for MVP.

## 14) Open questions
- Do we need patient file uploads (e.g., PDFs/photos) in MVP, or can that wait?
- Should we support appointment reminders at MVP (email) or defer entirely?
- Is a simplified odontogram must-have for early adopters, or post-MVP?
- Do clinics require import tools from existing systems for day-one migration?
- Any regulatory constraints for initial markets (e.g., PHI storage location)?
- Do providers need templated note snippets/shortcuts at MVP?
- What minimum audit log detail is acceptable (writes only vs. read events)?

## 15) Risks and mitigations
- Scope creep from advanced dental-specific features (odontogram, imaging): strictly gate to post-MVP.
- Data quality issues from free-text fields: introduce structure incrementally after MVP.
- Scheduling complexity (availability, overlapping roles): start simple and iterate with feedback.
- Adoption risk: ensure exports and avoid lock-in to build trust with early clinics.

## 16) Glossary (selected)
- Clinical Note: Documentation for a patient visit.
- Treatment Plan: Planned procedures for a patient over time.
- Procedure: A discrete dental service item (e.g., filling, cleaning) tracked individually.

---
Version: 0.1 (MVP draft)
Owner: Product
Last updated: TBD
