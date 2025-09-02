# Auth Flow Refactor - Multi-Clinic Support

## Overview

The current auth system uses single-clinic user metadata, but our new schema supports multi-clinic users with role-based access. This document outlines the required changes to implement proper multi-clinic authentication.

## Current Issues

### 1. Login Flow Problems

- **Issue**: Auth store tries to get user data from `user_metadata` (lines 67-71 in auth.ts)
- **Problem**: No clinic selection after login
- **Impact**: Users can't access any data due to RLS policies requiring active clinic

### 2. Missing Multi-Clinic Support

- **Issue**: Assumes single clinic in `user_metadata.clinic_id`
- **Problem**: Dr. Smith can't switch between his multiple clinics
- **Impact**: Limits system to single-clinic users only

### 3. Session Management Gap

- **Issue**: No session tracking for active clinic
- **Problem**: RLS policies expect `get_current_active_clinic()` but we're not setting it
- **Impact**: All database queries fail due to RLS blocking access

### 4. API Layer Disconnect

- **Issue**: API still uses hardcoded "clinic-1"
- **Problem**: Not using actual user's clinic context
- **Impact**: Wrong clinic data or access denied errors

## Required TODO Tasks

### Phase 1: Auth Store Updates

#### TODO 1: Extend Auth Store Interface

- [ ] Add `availableClinics: Profile[]` to auth state
- [ ] Add `activeClinic: string | null` to auth state
- [ ] Add `setActiveClinic: (clinicId: string) => Promise<void>` action
- [ ] Add `switchClinic: (clinicId: string) => Promise<void>` action
- [ ] Add `refreshClinics: () => Promise<void>` action

#### TODO 2: Update Auth State Type

- [ ] Remove dependency on `user_metadata.clinic_id`
- [ ] Update User interface to support multiple clinics
- [ ] Add session token tracking for active clinic

### Phase 2: API Layer Updates

#### TODO 3: Add Profile/Session API Functions

- [ ] Create `authApi.getUserProfiles()` - fetch user's clinic memberships
- [ ] Create `authApi.setActiveClinic(clinicId)` - calls database `set_active_clinic()`
- [ ] Create `authApi.getCurrentSession()` - validates current session
- [ ] Create `authApi.switchClinic(clinicId)` - updates active clinic session

#### TODO 4: Remove Hardcoded Clinic References

- [ ] Update `patientsApi.create()` to use session-based clinic ID
- [ ] Update `appointmentsApi.create()` to use session-based clinic ID
- [ ] Remove all "clinic-1" hardcoded references
- [ ] Ensure all API calls respect current active clinic

### Phase 3: Login Flow Refactor

#### TODO 5: Multi-Step Login Process

- [ ] **Step 1**: Supabase authentication (email/password)
- [ ] **Step 2**: Fetch user's clinic profiles
- [ ] **Step 3**: Handle clinic selection logic:
  - Single clinic → auto-select and redirect
  - Multiple clinics → show clinic picker
  - No clinics → show "access denied" message
- [ ] **Step 4**: Set active clinic session in database
- [ ] **Step 5**: Update auth store with full context
- [ ] **Step 6**: Redirect to dashboard

#### TODO 6: Update Auth Event Handlers

- [ ] Update `onAuthStateChange` SIGNED_IN handler
- [ ] Update session restoration logic
- [ ] Add session validation on app startup
- [ ] Handle expired/invalid sessions gracefully

### Phase 4: UI Components

#### TODO 7: Create Clinic Picker Component

- [ ] `components/auth/clinic-picker.tsx`
- [ ] Show list of user's available clinics
- [ ] Display clinic name and user's role at each clinic
- [ ] Handle clinic selection and session creation
- [ ] Loading and error states
- [ ] Responsive design

#### TODO 8: Create Clinic Switcher Component

- [ ] `components/layout/clinic-switcher.tsx`
- [ ] Dropdown in app header for clinic switching
- [ ] Show current active clinic
- [ ] Allow switching between user's clinics
- [ ] Update session without full logout/login

#### TODO 9: Update Protected Route Logic

- [ ] Check for authenticated user AND active clinic
- [ ] Redirect to clinic picker if no active clinic
- [ ] Handle session expiration
- [ ] Validate user has access to requested clinic

### Phase 5: Session Management

#### TODO 10: Session Validation Middleware

- [ ] Create middleware to validate sessions on each request
- [ ] Check session expiration
- [ ] Verify user still has access to active clinic
- [ ] Auto-refresh sessions when needed
- [ ] Force logout when access revoked

#### TODO 11: Session Cleanup

- [ ] Clean up expired sessions on logout
- [ ] Handle multiple concurrent sessions
- [ ] Session timeout warnings
- [ ] Graceful session renewal

### Phase 6: Error Handling & Edge Cases

#### TODO 12: Access Revocation Handling

- [ ] Detect when user loses access to active clinic
- [ ] Force logout and show appropriate message
- [ ] Redirect to clinic picker if other clinics available
- [ ] Clean up local state

#### TODO 13: Network/API Error Handling

- [ ] Handle session API failures gracefully
- [ ] Retry logic for session validation
- [ ] Offline session caching
- [ ] Error messages in Spanish

#### TODO 14: User Experience Edge Cases

- [ ] Handle user with no clinic access
- [ ] Handle clinic deletion while user is active
- [ ] Handle role changes (admin → provider)
- [ ] Handle invitation acceptance flow

### Phase 7: Security Validation

#### TODO 15: Session Security

- [ ] Validate session tokens on server side
- [ ] Implement session hijacking protection
- [ ] Rate limit session creation
- [ ] Audit session access

#### TODO 16: RLS Policy Testing

- [ ] Test RLS policies work with new session system
- [ ] Verify no data leakage between clinics
- [ ] Test access revocation scenarios
- [ ] Performance test with session validation

## Implementation Priority

### High Priority (Blocking)

- TODO 3: Add Profile/Session API Functions
- TODO 5: Multi-Step Login Process
- TODO 7: Create Clinic Picker Component
- TODO 4: Remove Hardcoded Clinic References

### Medium Priority (UX)

- TODO 8: Create Clinic Switcher Component
- TODO 10: Session Validation Middleware
- TODO 12: Access Revocation Handling

### Low Priority (Polish)

- TODO 11: Session Cleanup
- TODO 13: Network/API Error Handling
- TODO 16: RLS Policy Testing

## Success Criteria

### MVP Success

- [ ] User can log in and select clinic
- [ ] RLS policies work with session-based clinic selection
- [ ] Users can only see data from their active clinic
- [ ] Multi-clinic users can switch clinics

### Full Success

- [ ] Real-time access revocation works
- [ ] Session management is secure and performant
- [ ] All edge cases handled gracefully
- [ ] Comprehensive security testing passed

## Notes

- This refactor touches core authentication, so testing is critical
- Consider feature flags for gradual rollout
- Backup plan: revert to single-clinic if issues arise
- Database functions (`set_active_clinic`, `get_current_active_clinic`) are already implemented
