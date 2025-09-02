-- Donto Database Schema
-- PostgreSQL / Supabase

-- Core clinic entity
CREATE TABLE clinics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    address TEXT,
    phone VARCHAR(50),
    email VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Providers (dentists, hygienists, etc.)
CREATE TABLE providers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    specialty VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Patients
CREATE TABLE patients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    date_of_birth DATE NOT NULL,
    sex VARCHAR(10),
    phone VARCHAR(50),
    email VARCHAR(255),
    address TEXT,
    emergency_contact_name VARCHAR(200),
    emergency_contact_phone VARCHAR(50),
    medical_history TEXT,
    allergies TEXT,
    patient_number VARCHAR(50) UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Patient representatives/guardians
CREATE TABLE patient_representatives (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    relationship VARCHAR(50) NOT NULL,
    phone VARCHAR(50),
    email VARCHAR(255),
    consent_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Appointments
CREATE TABLE appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
    appointment_date TIMESTAMP WITH TIME ZONE NOT NULL,
    duration_minutes INTEGER NOT NULL DEFAULT 30,
    appointment_type VARCHAR(50) NOT NULL,
    status VARCHAR(20) DEFAULT 'scheduled', -- scheduled, completed, cancelled, no_show
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Clinical notes for visits
CREATE TABLE clinical_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
    subjective TEXT,
    objective TEXT,
    assessment TEXT,
    plan TEXT,
    is_finalized BOOLEAN DEFAULT false,
    finalized_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Dental procedures catalog
CREATE TABLE procedures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    code VARCHAR(20),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    default_cost DECIMAL(10,2),
    estimated_duration_minutes INTEGER,
    category VARCHAR(100), -- e.g., "preventive", "restorative", "surgical"
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Treatment plans
CREATE TABLE treatment_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
    name VARCHAR(255),
    status VARCHAR(20) DEFAULT 'active', -- active, completed, cancelled
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Individual treatment items within a plan
CREATE TABLE treatment_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    treatment_plan_id UUID NOT NULL REFERENCES treatment_plans(id) ON DELETE CASCADE,
    procedure_id UUID NOT NULL REFERENCES procedures(id) ON DELETE CASCADE,
    tooth_number VARCHAR(10), -- e.g., "11", "14", "21"
    tooth_surfaces VARCHAR(20), -- e.g., "M,D,B,L,O" for affected surfaces
    priority VARCHAR(20) DEFAULT 'recommended', -- urgent, recommended, optional
    status VARCHAR(20) DEFAULT 'planned', -- planned, in_progress, completed, cancelled
    custom_cost DECIMAL(10,2), -- override default procedure cost if needed
    provider_notes TEXT,
    completed_date DATE,
    completed_appointment_id UUID REFERENCES appointments(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Cost estimates
CREATE TABLE cost_estimates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    treatment_plan_id UUID NOT NULL REFERENCES treatment_plans(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    estimate_number VARCHAR(50) UNIQUE,
    subtotal DECIMAL(10,2) NOT NULL,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL,
    valid_until DATE,
    status VARCHAR(20) DEFAULT 'draft', -- draft, sent, approved, expired
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Individual cost items within an estimate
CREATE TABLE cost_estimate_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cost_estimate_id UUID NOT NULL REFERENCES cost_estimates(id) ON DELETE CASCADE,
    treatment_item_id UUID NOT NULL REFERENCES treatment_items(id) ON DELETE CASCADE,
    unit_cost DECIMAL(10,2) NOT NULL,
    quantity INTEGER DEFAULT 1,
    total_cost DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tooth conditions/odontogram data
CREATE TABLE tooth_conditions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    tooth_number VARCHAR(10) NOT NULL, -- e.g., "11", "14", "21"
    surface VARCHAR(10) NOT NULL, -- "M", "D", "B", "L", "O" (mesial, distal, buccal, lingual, occlusal)
    condition_type VARCHAR(50) NOT NULL, -- "healthy", "caries", "filling", "crown", "missing", etc.
    notes TEXT,
    recorded_date DATE DEFAULT CURRENT_DATE,
    recorded_by_provider_id UUID REFERENCES providers(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(patient_id, tooth_number, surface)
);

-- Basic indexes for performance
CREATE INDEX idx_appointments_date ON appointments(appointment_date);
CREATE INDEX idx_appointments_patient ON appointments(patient_id);
CREATE INDEX idx_appointments_provider ON appointments(provider_id);
CREATE INDEX idx_patients_clinic ON patients(clinic_id);
CREATE INDEX idx_patients_number ON patients(patient_number);
CREATE INDEX idx_treatment_items_plan ON treatment_items(treatment_plan_id);
CREATE INDEX idx_treatment_items_procedure ON treatment_items(procedure_id);
CREATE INDEX idx_tooth_conditions_patient ON tooth_conditions(patient_id);
CREATE INDEX idx_clinical_notes_patient ON clinical_notes(patient_id);
CREATE INDEX idx_procedures_clinic ON procedures(clinic_id);

-- GIN indexes for full-text search (Spanish language)
-- Patient search: name, phone, email, patient number
CREATE INDEX idx_patients_search ON patients 
USING gin(to_tsvector('spanish', 
    first_name || ' ' || last_name || ' ' || 
    COALESCE(patient_number, '')
));

-- Provider search: name and specialty
CREATE INDEX idx_providers_search ON providers 
USING gin(to_tsvector('spanish', 
    first_name || ' ' || last_name || ' ' || 
    COALESCE(specialty, '')
));

-- Procedure search: name and description
CREATE INDEX idx_procedures_search ON procedures 
USING gin(to_tsvector('spanish', 
    name || ' ' || 
    COALESCE(description, '') || ' ' || 
    COALESCE(code, '')
));

-- Clinical notes search (for finding past treatments)
CREATE INDEX idx_clinical_notes_search ON clinical_notes 
USING gin(to_tsvector('spanish', 
    COALESCE(subjective, '') || ' ' || 
    COALESCE(objective, '') || ' ' || 
    COALESCE(assessment, '') || ' ' || 
    COALESCE(plan, '')
));

-- PostgreSQL functions for full-text search using GIN indexes

-- Patient search function using GIN index
CREATE OR REPLACE FUNCTION search_patients(search_query TEXT, result_limit INTEGER DEFAULT 20)
RETURNS SETOF patients AS $$
BEGIN
    RETURN QUERY
    SELECT *
    FROM patients
    WHERE to_tsvector('spanish', 
        first_name || ' ' || last_name || ' ' || 
        COALESCE(patient_number, '')
    ) @@ plainto_tsquery('spanish', search_query)
    ORDER BY created_at DESC
    LIMIT result_limit;
END;
$$ LANGUAGE plpgsql;

-- Provider search function
CREATE OR REPLACE FUNCTION search_providers(search_query TEXT, result_limit INTEGER DEFAULT 20)
RETURNS SETOF providers AS $$
BEGIN
    RETURN QUERY
    SELECT *
    FROM providers
    WHERE to_tsvector('spanish', 
        first_name || ' ' || last_name || ' ' || 
        COALESCE(specialty, '')
    ) @@ plainto_tsquery('spanish', search_query)
    ORDER BY created_at DESC
    LIMIT result_limit;
END;
$$ LANGUAGE plpgsql;

-- Procedure search function
CREATE OR REPLACE FUNCTION search_procedures(search_query TEXT, result_limit INTEGER DEFAULT 20)
RETURNS SETOF procedures AS $$
BEGIN
    RETURN QUERY
    SELECT *
    FROM procedures
    WHERE to_tsvector('spanish', 
        name || ' ' || 
        COALESCE(description, '') || ' ' || 
        COALESCE(code, '')
    ) @@ plainto_tsquery('spanish', search_query)
    AND is_active = true
    ORDER BY created_at DESC
    LIMIT result_limit;
END;
$$ LANGUAGE plpgsql;

-- User profiles table for multi-clinic, multi-role access
CREATE TABLE profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    provider_id UUID REFERENCES providers(id) ON DELETE SET NULL, -- Optional link to provider record
    role VARCHAR(50) NOT NULL DEFAULT 'admin', -- admin, provider, staff
    is_active BOOLEAN DEFAULT true,
    invited_by UUID REFERENCES auth.users(id),
    invited_at TIMESTAMP WITH TIME ZONE,
    joined_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, clinic_id) -- One profile per user per clinic
);

-- User sessions table to track active clinic per session
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    active_clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    session_token UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure user has access to the active clinic
    CONSTRAINT fk_user_clinic_access 
        FOREIGN KEY (user_id, active_clinic_id) 
        REFERENCES profiles(user_id, clinic_id)
);

-- Indexes for performance
CREATE INDEX idx_profiles_user_id ON profiles(user_id);
CREATE INDEX idx_profiles_clinic_id ON profiles(clinic_id);
CREATE INDEX idx_profiles_provider_id ON profiles(provider_id);
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX idx_user_sessions_expires ON user_sessions(expires_at);

-- Function to get current active clinic from session
CREATE OR REPLACE FUNCTION get_current_active_clinic()
RETURNS UUID AS $$
DECLARE
    clinic_id UUID;
BEGIN
    -- Get active clinic from current session
    -- This will be set by the application when user selects clinic
    SELECT active_clinic_id INTO clinic_id
    FROM user_sessions
    WHERE user_id = auth.uid()
    AND expires_at > NOW()
    ORDER BY updated_at DESC
    LIMIT 1;
    
    RETURN clinic_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to set active clinic for current session
CREATE OR REPLACE FUNCTION set_active_clinic(clinic_uuid UUID, session_duration_hours INTEGER DEFAULT 24)
RETURNS UUID AS $$
DECLARE
    session_id UUID;
    new_token UUID;
BEGIN
    -- Verify user has access to this clinic
    IF NOT EXISTS (
        SELECT 1 FROM profiles 
        WHERE user_id = auth.uid() 
        AND clinic_id = clinic_uuid 
        AND is_active = true
    ) THEN
        RAISE EXCEPTION 'User does not have access to clinic %', clinic_uuid;
    END IF;
    
    -- Generate new session token
    new_token := gen_random_uuid();
    
    -- Deactivate existing sessions for this user
    UPDATE user_sessions 
    SET expires_at = NOW() 
    WHERE user_id = auth.uid();
    
    -- Create new session
    INSERT INTO user_sessions (user_id, active_clinic_id, session_token, expires_at)
    VALUES (auth.uid(), clinic_uuid, new_token, NOW() + (session_duration_hours || ' hours')::interval)
    RETURNING id INTO session_id;
    
    RETURN new_token;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's clinic memberships
CREATE OR REPLACE FUNCTION get_user_clinics()
RETURNS TABLE (
    clinic_id UUID,
    clinic_name VARCHAR(255),
    user_role VARCHAR(50),
    is_active BOOLEAN,
    provider_id UUID
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id as clinic_id,
        c.name as clinic_name,
        p.role as user_role,
        p.is_active,
        p.provider_id
    FROM profiles p
    JOIN clinics c ON c.id = p.clinic_id
    WHERE p.user_id = auth.uid()
    AND p.is_active = true
    ORDER BY c.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable Row Level Security on all main tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinical_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE treatment_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE treatment_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE procedures ENABLE ROW LEVEL SECURITY;
ALTER TABLE tooth_conditions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles table
CREATE POLICY "Users can view own profiles" ON profiles
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update own profiles" ON profiles
    FOR UPDATE USING (user_id = auth.uid());

-- RLS Policies for user_sessions table
CREATE POLICY "Users can manage own sessions" ON user_sessions
    FOR ALL USING (user_id = auth.uid());

-- Core RLS policy: All clinic data must match current active clinic
CREATE POLICY "Clinic isolation for patients" ON patients
    FOR ALL USING (
        clinic_id = get_current_active_clinic()
        AND 
        get_current_active_clinic() IS NOT NULL
    );

CREATE POLICY "Clinic isolation for providers" ON providers
    FOR ALL USING (
        clinic_id = get_current_active_clinic()
        AND 
        get_current_active_clinic() IS NOT NULL
    );

CREATE POLICY "Clinic isolation for appointments" ON appointments
    FOR ALL USING (
        clinic_id = get_current_active_clinic()
        AND 
        get_current_active_clinic() IS NOT NULL
    );

CREATE POLICY "Clinic isolation for clinical_notes" ON clinical_notes
    FOR ALL USING (
        -- Clinical notes don't have clinic_id directly, so check via patient
        EXISTS (
            SELECT 1 FROM patients p 
            WHERE p.id = patient_id 
            AND p.clinic_id = get_current_active_clinic()
        )
        AND 
        get_current_active_clinic() IS NOT NULL
    );

CREATE POLICY "Clinic isolation for treatment_plans" ON treatment_plans
    FOR ALL USING (
        -- Treatment plans link via patient
        EXISTS (
            SELECT 1 FROM patients p 
            WHERE p.id = patient_id 
            AND p.clinic_id = get_current_active_clinic()
        )
        AND 
        get_current_active_clinic() IS NOT NULL
    );

CREATE POLICY "Clinic isolation for treatment_items" ON treatment_items
    FOR ALL USING (
        -- Treatment items link via treatment plan -> patient
        EXISTS (
            SELECT 1 FROM treatment_plans tp
            JOIN patients p ON p.id = tp.patient_id
            WHERE tp.id = treatment_plan_id 
            AND p.clinic_id = get_current_active_clinic()
        )
        AND 
        get_current_active_clinic() IS NOT NULL
    );

CREATE POLICY "Clinic isolation for procedures" ON procedures
    FOR ALL USING (
        clinic_id = get_current_active_clinic()
        AND 
        get_current_active_clinic() IS NOT NULL
    );

CREATE POLICY "Clinic isolation for tooth_conditions" ON tooth_conditions
    FOR ALL USING (
        -- Tooth conditions link via patient
        EXISTS (
            SELECT 1 FROM patients p 
            WHERE p.id = patient_id 
            AND p.clinic_id = get_current_active_clinic()
        )
        AND 
        get_current_active_clinic() IS NOT NULL
    );

-- Security function to validate current session
CREATE OR REPLACE FUNCTION validate_current_session()
RETURNS BOOLEAN AS $$
BEGIN
    -- Check if user has an active, valid session
    RETURN EXISTS (
        SELECT 1 FROM user_sessions
        WHERE user_id = auth.uid()
        AND expires_at > NOW()
        AND active_clinic_id IN (
            SELECT clinic_id FROM profiles
            WHERE user_id = auth.uid()
            AND is_active = true
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;