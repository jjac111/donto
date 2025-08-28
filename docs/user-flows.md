# Donto — User Flows Documentation

## Overview
This document defines the core user flows for Donto dental clinic administration system. While MVP uses a single Admin role, flows are described from the perspective of two primary personas: Assistant (front desk) and Provider (dentist) to ensure proper workflow design for future role implementation.

---

## Flow 1: New Patient Registration

**Goal:** Complete patient registration with initial diagnosis

### Steps:
1. **Search existing patients** (name/phone/ID) → if found, redirect to profile
2. **Enter basic info:** name, DOB, sex, phone, email, address
3. **Add representative** (if under 18): name, relationship, contact, consent notes
4. **Record allergies and medical history** (free text)
5. **Initial odontogram:** click tooth surfaces to record current conditions
6. **Save** → option to book appointment immediately

**Success Criteria:** Patient created in <60 seconds

---

## Flow 2: Appointment Creation

**Goal:** Schedule appointment with no double-bookings

### Steps:
1. **Search and select patient** → if new, redirect to registration
2. **Select appointment type:** consultation, cleaning, treatment, emergency
3. **Set duration:** 15min, 30min, 1hr, 2hr
4. **Choose provider** from available list
5. **Pick date/time** from calendar view (unavailable slots blocked)
6. **Add notes** (optional)
7. **Save** → send calendar invite to provider email

**Success Criteria:** Appointment scheduled in <30 seconds

---

## Flow 3: Treatment Plan Creation

**Goal:** Define treatment plan with procedures and timeline

### Steps:
1. **Open patient chart** → review current odontogram and notes
2. **Update odontogram** with new findings per tooth surface
3. **Add treatment items:**
   - Select procedure from list
   - Click affected tooth surfaces on odontogram
   - Set priority (urgent/recommended/optional)
   - Add provider notes
4. **Set treatment sequence** and dependencies
5. **Save** → option to create cost estimate immediately

**Success Criteria:** Treatment plan ready for cost estimation

---

## Flow 4: Cost Estimate Creation

**Goal:** Generate cost breakdown for treatment plan

### Steps:
1. **Open treatment plan** → review procedures list
2. **Assign costs:** each procedure loads default price, manually adjust if needed
3. **Apply discounts** if applicable
4. **Group by priority/visit** and calculate totals
5. **Generate printable estimate** with validity period
6. **Save estimate** → option to convert approved items to scheduled treatments

**Success Criteria:** Professional estimate ready for patient review

---

## Flow 5: Appointment Management

**Goal:** Track appointment status and document visit

### Steps:
1. **Mark appointment status:** click appointment in calendar → select "show", "no show", or "cancelled"
2. **For completed appointments:**
   - Create clinical note for visit
   - Update odontogram if treatments performed
   - Mark completed treatment items
   - Schedule follow-up if needed

**Success Criteria:** Appointment status tracked, visit documented

---

## Key Design Principles

### Minimal Clicks
- Search → select → minimal required fields → save
- Default values where possible
- Immediate navigation to next logical step

### Error Prevention
- Prevent double-booking automatically
- Validate required fields
- Confirm destructive actions

### Context Awareness
- Carry patient context between flows
- Show relevant alerts/history
- Link treatment plans to cost estimates

---

**Version:** 1.0  
**Last Updated:** TBD  
**Owner:** Product

