# Database Security Tests

## Overview

Critical security tests for multi-clinic, persons-centric database with RLS policies.

## Test Categories

### 1. RLS Policy Tests

#### Clinic Isolation Tests

- [x] User can only see persons from active clinic
- [x] User can only see patients from active clinic
- [x] User can only see providers from active clinic
- [x] User can only see appointments from active clinic
- [x] User cannot access data when no active clinic set
- [x] User cannot access data from inactive clinics

#### Cross-Clinic Access Prevention

- [x] User A cannot see User B's clinic data
- [x] Provider at Clinic 1 cannot see Clinic 2 patients
- [x] Search functions respect clinic boundaries
- [x] Join queries don't leak cross-clinic data

### 2. Session Security Tests

#### Session Validation

- [x] `get_current_active_clinic()` returns correct clinic
- [x] `get_current_active_clinic()` returns NULL when no session
- [x] Expired sessions block data access
- [x] Invalid session tokens rejected

#### Session Management

- [x] `set_active_clinic()` creates valid session
- [x] `set_active_clinic()` rejects invalid clinic access
- [x] Setting new clinic invalidates old sessions
- [x] Session expiration works correctly

#### Auto-Clinic Selection

- [x] User with single clinic access gets clinic auto-selected on login
- [x] User with multiple clinic access requires manual selection
- [x] User with no clinic access cannot proceed
- [x] Auto-selection creates valid user session

### 3. Real-Time Access Revocation

#### Profile Deactivation

- [x] Deactivating user profile immediately blocks access
- [ ] User loses access when removed from clinic
- [ ] Role changes don't break existing sessions
- [ ] Deleted clinic invalidates all user sessions

#### Session Cleanup

- [ ] Orphaned sessions are cleaned up
- [ ] Invalid profile references block access
- [x] Foreign key constraints prevent invalid sessions

### 4. Person/Identity Tests

#### National ID Uniqueness

- [ ] Cannot create duplicate national_id within clinic
- [ ] Can create same national_id across different clinics
- [ ] `find_or_create_person()` finds existing person
- [ ] `find_or_create_person()` creates new person when needed

#### Person Data Integrity

- [ ] Deleting person cascades to patients/providers
- [ ] Person updates reflect in all roles
- [ ] Person search works across roles

### 5. Function Security Tests

#### Database Functions

- [ ] Functions reject unauthenticated calls
- [ ] Functions validate user permissions
- [ ] Functions handle invalid parameters
- [ ] Functions respect RLS policies

#### Search Functions

- [x] `search_patients()` only returns clinic data
- [x] `search_providers()` only returns clinic data
- [x] `search_persons()` only returns clinic data
- [ ] Search functions handle empty queries

### 6. Edge Case Tests

#### Malicious Access Attempts

- [x] Direct table access blocked by RLS
- [ ] SQL injection attempts fail
- [ ] Invalid session manipulation blocked
- [x] Cross-clinic data requests rejected
- [ ] Auth token manipulation attempts blocked
- [ ] Privilege escalation via function calls blocked

#### Data Consistency

- [ ] Referential integrity maintained
- [ ] Cascade deletes work correctly
- [ ] Concurrent access handled properly
- [ ] Transaction rollbacks clean

#### Spanish Full-Text Search Edge Cases

- [ ] Search functions handle Spanish accents correctly
- [ ] Search functions handle special characters
- [ ] Search functions perform well with large datasets
- [ ] Search results respect clinic boundaries under load

#### Session Race Conditions

- [ ] Concurrent session creation handled properly
- [ ] Session expiration during active queries
- [ ] Clinic switching during active operations
- [ ] Multiple sessions per user handled correctly

#### Database Function Security

- [ ] Functions validate input parameters properly
- [ ] Functions handle NULL values safely
- [ ] Functions prevent injection attacks
- [ ] Functions maintain audit trails correctly

## Test Implementation

### Unit Tests (SQL)

- Direct PostgreSQL connection
- Test each RLS policy individually
- Test database functions in isolation
- Use test fixtures for consistent data

### Integration Tests (API)

- Test via Supabase client
- Simulate real user scenarios
- Test auth token validation
- Test session lifecycle

### Security Tests (Penetration)

- Attempt unauthorized data access
- Test session hijacking scenarios
- Validate input sanitization
- Test privilege escalation attempts

## Test Data Requirements

### Test Users

- User with single clinic access
- User with multiple clinic access
- User with no clinic access
- Deactivated user

### Test Clinics

- Active clinic with data
- Empty clinic
- Clinic with multiple users

### Test Scenarios

- Normal operation
- Access revocation during session
- Expired sessions
- Invalid permissions

## Success Criteria

### Security Validation

- [x] Zero data leakage between clinics
- [x] Real-time access revocation works
- [x] All RLS policies enforce correctly
- [x] Session security validated

### Performance Validation

- [ ] RLS policies don't degrade performance significantly
- [ ] Session validation is fast (<50ms)
- [ ] Search functions perform well with RLS
- [ ] Database functions are efficient

## Critical Test Cases

### Must Pass Before Production

1. **Clinic isolation**: Users cannot see other clinic data ✅
2. **Session validation**: Invalid sessions block all access ✅
3. **Real-time revocation**: Removing user access works immediately ✅
4. **Person uniqueness**: National ID constraints work correctly ⏳
5. **Function security**: All database functions respect permissions ⏳
