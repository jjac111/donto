# Donto — User Flows Documentation

## Overview
This document defines the core user flows for Donto dental clinic administration system. While MVP uses a single Admin role, flows are described from the perspective of two primary personas: Assistant (front desk) and Provider (dentist) to ensure proper workflow design for future role implementation.

---

## Flow 1: New Patient Registration

**Primary Actor:** Assistant  
**Trigger:** Walk-in patient or phone call for new patient  
**Goal:** Complete patient registration ready for appointment booking

### Steps:
1. **Patient Search** (verify not already in system)
   - Search by name, phone, or ID
   - If found → redirect to existing patient profile
   - If not found → continue to registration

2. **Basic Information Capture**
   - Full name, DOB, sex, phone, email, address
   - Patient ID generation (auto or manual)
   - Emergency contact information

3. **Medical History & Allergies**
   - Known allergies (drug, environmental)
   - Current medications
   - Medical conditions (diabetes, heart disease, etc.)
   - Previous dental history (free text for MVP)

4. **Representative/Guardian (if applicable)**
   - Patient age check → if under 18 or dependent
   - Representative name, relationship, contact info
   - Consent notes and authorization details

5. **Initial Tooth Assessment**
   - Open odontogram interface
   - Record baseline tooth conditions per surface
   - Note missing teeth, existing restorations, obvious issues

6. **Insurance/Payment Info** (future - note for now)
   - Insurance provider details
   - Payment preferences

7. **Save & Next Actions**
   - Save patient record
   - Option to immediately book appointment
   - Print patient welcome packet (future)

**Success Criteria:** Patient created in <60 seconds, ready for appointment booking

---

## Flow 2: Appointment Creation

**Primary Actor:** Assistant  
**Trigger:** Patient requests appointment (new or existing)  
**Goal:** Schedule appointment with appropriate provider and time slot

### Steps:
1. **Patient Selection**
   - Search for existing patient
   - If new patient → redirect to registration flow first
   - Display patient summary (last visit, active treatments)

2. **Appointment Type & Urgency**
   - Select appointment reason (consultation, cleaning, treatment, emergency)
   - Estimated duration (15min, 30min, 1hr, 2hr)
   - Urgency level (routine, urgent, emergency)

3. **Provider Selection**
   - Show available providers
   - Display specialties if relevant to appointment type
   - Consider provider preferences for patient (history)

4. **Date & Time Selection**
   - Calendar view showing provider availability
   - Block out unavailable slots (lunch, existing appointments)
   - Show scheduling conflicts if any
   - Suggest alternative times if first choice unavailable

5. **Appointment Details**
   - Add notes about appointment purpose
   - Special instructions or requirements
   - Pre-appointment prep needed

6. **Confirmation & Notifications**
   - Review appointment summary
   - Send calendar invitation to provider email
   - Option to print appointment card for patient
   - Add to clinic calendar

**Success Criteria:** Appointment scheduled in <30 seconds with no double-bookings

---

## Flow 3: Treatment Plan Creation

**Primary Actor:** Provider  
**Trigger:** After patient examination or during consultation  
**Goal:** Define comprehensive treatment plan with procedures and timeline

### Steps:
1. **Patient Context Review**
   - Open patient chart
   - Review recent clinical notes
   - Check current odontogram status
   - Review previous treatment plans

2. **Examination Documentation**
   - Update odontogram with current findings
   - Note new conditions per tooth surface
   - Photo documentation placeholders (future)

3. **Treatment Planning**
   - Add treatment items one by one:
     - Procedure code and name
     - Affected teeth/surfaces (select via odontogram)
     - Priority level (urgent, recommended, optional)
     - Estimated duration
   - Set treatment sequence/dependencies
   - Add provider notes for each item

4. **Timeline Planning**
   - Suggested appointment schedule
   - Group procedures by visit when possible
   - Consider healing time between treatments
   - Mark any urgent items

5. **Patient Communication Prep**
   - Generate treatment summary for patient
   - Note discussion points
   - Mark items for cost estimation

6. **Save & Next Steps**
   - Save treatment plan
   - Option to create cost estimate immediately
   - Schedule next appointment if agreed
   - Flag items for insurance pre-authorization (future)

**Success Criteria:** Comprehensive treatment plan created with clear next steps

---

## Flow 4: Treatment Estimate (Presupuesto) Creation

**Primary Actor:** Assistant or Provider  
**Trigger:** Treatment plan exists and patient requests cost information  
**Goal:** Provide accurate cost breakdown for planned treatments

### Steps:
1. **Treatment Plan Review**
   - Open existing treatment plan
   - Review all planned procedures
   - Check procedure codes and descriptions

2. **Cost Assignment**
   - For each treatment item:
     - Assign procedure cost (from fee schedule)
     - Note any material costs
     - Apply provider-specific rates if applicable
     - Consider multiple visit requirements

3. **Payment Options & Discounts**
   - Apply insurance coverage if available (future)
   - Calculate patient portion
   - Add payment plan options
   - Apply clinic discounts if applicable

4. **Estimate Formatting**
   - Group by priority or visit
   - Show itemized breakdown
   - Calculate subtotals and total
   - Add validity period for estimate

5. **Patient Presentation**
   - Generate printable estimate
   - Review with patient
   - Note any modifications requested
   - Document patient questions/concerns

6. **Follow-up Actions**
   - Save estimate version
   - Schedule discussion follow-up if needed
   - Convert approved items to scheduled treatments
   - Send copy to patient email (future)

**Success Criteria:** Clear, professional cost estimate ready for patient discussion

---

## Flow 5: Patient Check-in for Appointment

**Primary Actor:** Assistant → Provider  
**Trigger:** Patient arrives for scheduled appointment  
**Goal:** Efficient transition from arrival to treatment

### Assistant Tasks:
1. **Arrival Processing**
   - Verify patient identity
   - Check appointment details
   - Update contact info if needed
   - Collect any required forms

2. **Pre-appointment Updates**
   - Review/update medical history changes
   - Check for new allergies or medications
   - Update insurance information (future)
   - Collect payment for previous services if due

3. **Clinical Preparation**
   - Flag any special requirements for provider
   - Prepare patient chart/tablet for provider
   - Note any patient concerns or questions
   - Update appointment status to "checked in"

### Provider Tasks:
4. **Chart Review**
   - Review patient history quickly
   - Check planned treatments for today
   - Note any alerts or special considerations
   - Review previous visit notes

5. **Patient Interaction**
   - Greet patient and confirm treatment plan
   - Address any patient questions
   - Perform examination/treatment
   - Update odontogram with findings

6. **Documentation**
   - Create clinical note for visit
   - Mark completed treatment items
   - Update treatment plan status
   - Note any complications or follow-up needs

7. **Visit Completion**
   - Schedule follow-up appointments if needed
   - Provide post-treatment instructions
   - Update billing information
   - Finalize clinical notes

**Success Criteria:** Smooth patient flow from check-in to completion with complete documentation

---

## Cross-Flow Considerations

### Information Continuity
- Each flow should carry forward relevant context
- Patient alerts visible across all flows
- Treatment history accessible during planning
- Cost information linked to treatment plans

### Error Prevention
- Validation at each step
- Confirm destructive actions
- Prevent double-booking
- Flag incomplete information

### Spanish-First Design
- All flows designed with Spanish text in mind
- Cultural considerations for patient interaction
- Local terminology and procedures

### Future Role Separation
- Clear handoff points between assistant and provider tasks
- Permission-aware interfaces ready for role implementation
- Audit trail hooks for sensitive actions

---

**Version:** 1.0  
**Last Updated:** TBD  
**Owner:** Product
