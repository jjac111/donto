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


-- Centralized persons table per clinic (national_id + country uniqueness)
CREATE TABLE persons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    national_id VARCHAR(50) NOT NULL,
    country VARCHAR(3) NOT NULL DEFAULT 'ECU', -- ISO country code, default Dominican Republic
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    date_of_birth DATE NOT NULL,
    sex VARCHAR(10),
    phone VARCHAR(50),
    email VARCHAR(255),
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(clinic_id, national_id, country) -- One person per clinic per national ID
);


-- Providers (dentists, hygienists, etc.) - linked to persons
CREATE TABLE providers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    person_id UUID NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    specialty VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

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
        ON DELETE CASCADE
);



-- Patients (role-specific data linked to persons)
CREATE TABLE patients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    person_id UUID NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    medical_history TEXT,
    allergies TEXT,
    emergency_contact_name VARCHAR(200),
    emergency_contact_phone VARCHAR(50),
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


-- Tooth diagnosis history - simple audit log for diagnosis sessions
CREATE TABLE tooth_diagnosis_histories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    recorded_by_profile_id UUID REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tooth diagnosis information per patient with current conditions
CREATE TABLE tooth_diagnoses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tooth_number VARCHAR(10) NOT NULL, -- e.g., "11", "14", "21"
    is_present BOOLEAN DEFAULT true, -- false if tooth is missing
    is_treated BOOLEAN DEFAULT false, -- true if tooth has been treated
    requires_extraction BOOLEAN DEFAULT false, -- true if tooth needs to be extracted
    general_notes TEXT, -- General notes about the tooth
    tooth_conditions JSONB DEFAULT '[]'::jsonb, -- Array of condition objects with diagnosis history
    -- tooth_conditions structure: [{"surfaces": ["M","D","B","L","O"], "condition_type": "caries", "notes": "text", "diagnosis_date": "2024-01-01", "recorded_by_profile_id": "uuid", "created_at": "timestamp"}]
    history_id UUID REFERENCES tooth_diagnosis_histories(id) ON DELETE CASCADE, -- Reference to the diagnosis history that created this tooth record
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(history_id, tooth_number) -- One tooth record per history per tooth number
);


-- Basic indexes for performance
CREATE INDEX idx_persons_clinic ON persons(clinic_id);
CREATE INDEX idx_persons_national_id ON persons(clinic_id, national_id, country);
CREATE INDEX idx_patients_person ON patients(person_id);
CREATE INDEX idx_patients_clinic ON patients(clinic_id);

CREATE INDEX idx_providers_person ON providers(person_id);
CREATE INDEX idx_providers_clinic ON providers(clinic_id);
CREATE INDEX idx_appointments_date ON appointments(appointment_date);
CREATE INDEX idx_appointments_patient ON appointments(patient_id);
CREATE INDEX idx_appointments_provider ON appointments(provider_id);
CREATE INDEX idx_treatment_items_plan ON treatment_items(treatment_plan_id);
CREATE INDEX idx_treatment_items_procedure ON treatment_items(procedure_id);
CREATE INDEX idx_tooth_diagnoses_tooth_number ON tooth_diagnoses(tooth_number);
CREATE INDEX idx_tooth_diagnoses_history_id ON tooth_diagnoses(history_id);
CREATE INDEX idx_tooth_diagnosis_histories_patient ON tooth_diagnosis_histories(patient_id);
CREATE INDEX idx_tooth_diagnosis_histories_profile ON tooth_diagnosis_histories(recorded_by_profile_id);
CREATE INDEX idx_clinical_notes_patient ON clinical_notes(patient_id);
CREATE INDEX idx_procedures_clinic ON procedures(clinic_id);

-- Indexes for performance
CREATE INDEX idx_profiles_user_id ON profiles(user_id);
CREATE INDEX idx_profiles_clinic_id ON profiles(clinic_id);
CREATE INDEX idx_profiles_provider_id ON profiles(provider_id);
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX idx_user_sessions_expires ON user_sessions(expires_at);

-- GIN indexes for full-text search (Spanish language)
-- Person search: name, national_id, phone, email
CREATE INDEX idx_persons_search ON persons 
USING gin(to_tsvector('spanish', 
    first_name || ' ' || last_name || ' ' || 
    national_id || ' ' ||
    COALESCE(phone, '') || ' ' ||
    COALESCE(email, '')
));

-- Patient search: no longer needed as we search via persons table

-- Provider search: specialty only (person data searched separately)
CREATE INDEX idx_providers_search ON providers 
USING gin(to_tsvector('spanish', 
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

-- Find or create person by national_id in current clinic
CREATE OR REPLACE FUNCTION find_or_create_person(
    p_national_id VARCHAR(50),
    p_country VARCHAR(3),
    p_first_name VARCHAR(100),
    p_last_name VARCHAR(100),
    p_date_of_birth DATE,
    p_sex VARCHAR(10) DEFAULT NULL,
    p_phone VARCHAR(50) DEFAULT NULL,
    p_email VARCHAR(255) DEFAULT NULL,
    p_address TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    person_uuid UUID;
    clinic_uuid UUID;
BEGIN
    -- Get current active clinic
    clinic_uuid := get_current_active_clinic();
    
    IF clinic_uuid IS NULL THEN
        RAISE EXCEPTION 'No active clinic selected';
    END IF;
    
    -- Try to find existing person
    SELECT id INTO person_uuid
    FROM persons
    WHERE clinic_id = clinic_uuid
    AND national_id = p_national_id
    AND country = p_country;
    
    -- If not found, create new person
    IF person_uuid IS NULL THEN
        INSERT INTO persons (
            clinic_id, national_id, country, first_name, last_name,
            date_of_birth, sex, phone, email, address
        ) VALUES (
            clinic_uuid, p_national_id, p_country, p_first_name, p_last_name,
            p_date_of_birth, p_sex, p_phone, p_email, p_address
        ) RETURNING id INTO person_uuid;
    ELSE
        -- Update existing person data (in case info changed)
        UPDATE persons SET
            first_name = p_first_name,
            last_name = p_last_name,
            date_of_birth = p_date_of_birth,
            sex = COALESCE(p_sex, sex),
            phone = COALESCE(p_phone, phone),
            email = COALESCE(p_email, email),
            address = COALESCE(p_address, address),
            updated_at = NOW()
        WHERE id = person_uuid;
    END IF;
    
    RETURN person_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Search persons in current clinic
CREATE OR REPLACE FUNCTION search_persons(search_query TEXT, result_limit INTEGER DEFAULT 20)
RETURNS SETOF persons AS $$
BEGIN
    RETURN QUERY
    SELECT *
    FROM persons
    WHERE clinic_id = get_current_active_clinic()
    AND to_tsvector('spanish', 
        first_name || ' ' || last_name || ' ' || 
        national_id || ' ' ||
        COALESCE(phone, '') || ' ' ||
        COALESCE(email, '')
    ) @@ plainto_tsquery('spanish', search_query)
    ORDER BY created_at DESC
    LIMIT result_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enhanced patient search (joins with persons)
CREATE OR REPLACE FUNCTION search_patients(search_query TEXT, result_limit INTEGER DEFAULT 20)
RETURNS TABLE (
    patient_id UUID,
    person_id UUID,
    national_id VARCHAR(50),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    date_of_birth DATE,
    phone VARCHAR(50),
    email VARCHAR(255),
    medical_history TEXT,
    allergies TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id as patient_id,
        pe.id as person_id,
        pe.national_id,
        pe.first_name,
        pe.last_name,
        pe.date_of_birth,
        pe.phone,
        pe.email,
        p.medical_history,
        p.allergies
    FROM patients p
    JOIN persons pe ON pe.id = p.person_id
    WHERE p.clinic_id = get_current_active_clinic()
    AND (
        to_tsvector('spanish', 
            pe.first_name || ' ' || pe.last_name || ' ' || 
            pe.national_id || ' ' ||
            COALESCE(pe.phone, '') || ' ' ||
            COALESCE(pe.email, '')
        ) @@ plainto_tsquery('spanish', search_query)
    )
    ORDER BY p.created_at DESC
    LIMIT result_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enhanced provider search (joins with persons)
CREATE OR REPLACE FUNCTION search_providers(search_query TEXT, result_limit INTEGER DEFAULT 20)
RETURNS TABLE (
    provider_id UUID,
    person_id UUID,
    national_id VARCHAR(50),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(50),
    email VARCHAR(255),
    specialty VARCHAR(100),
    is_active BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pr.id as provider_id,
        pe.id as person_id,
        pe.national_id,
        pe.first_name,
        pe.last_name,
        pe.phone,
        pe.email,
        pr.specialty,
        pr.is_active
    FROM providers pr
    JOIN persons pe ON pe.id = pr.person_id
    WHERE pr.clinic_id = get_current_active_clinic()
    AND pr.is_active = true
    AND (
        to_tsvector('spanish', 
            pe.first_name || ' ' || pe.last_name || ' ' || 
            pe.national_id || ' ' ||
            COALESCE(pe.phone, '') || ' ' ||
            COALESCE(pe.email, '') || ' ' ||
            COALESCE(pr.specialty, '')
        ) @@ plainto_tsquery('spanish', search_query)
    )
    ORDER BY pr.created_at DESC
    LIMIT result_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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



-- Function to get current active clinic from session
CREATE OR REPLACE FUNCTION get_current_active_clinic()
RETURNS UUID AS $$
DECLARE
    clinic_id UUID;
BEGIN
    -- Get active clinic from current session
    -- User must have an active profile for that specific clinic
    SELECT us.active_clinic_id INTO clinic_id
    FROM user_sessions us
    JOIN profiles p ON p.user_id = us.user_id 
      AND p.clinic_id = us.active_clinic_id 
      AND p.is_active = true
    WHERE us.user_id = auth.uid()
    AND us.expires_at > NOW()
    ORDER BY us.updated_at DESC
    LIMIT 1;
    
    RETURN clinic_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Debug function to check auth.uid()
CREATE OR REPLACE FUNCTION debug_auth_uid()
RETURNS UUID AS $$
BEGIN
    RETURN auth.uid();
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
ALTER TABLE persons ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinical_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE treatment_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE treatment_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE procedures ENABLE ROW LEVEL SECURITY;
ALTER TABLE tooth_diagnoses ENABLE ROW LEVEL SECURITY;
ALTER TABLE tooth_diagnosis_histories ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinics ENABLE ROW LEVEL SECURITY;
ALTER TABLE cost_estimates ENABLE ROW LEVEL SECURITY;
ALTER TABLE cost_estimate_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_representatives ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles table
CREATE POLICY "Users can view own profiles" ON profiles
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update own profiles" ON profiles
    FOR UPDATE USING (user_id = auth.uid());

-- RLS Policies for user_sessions table
CREATE POLICY "Users can manage own sessions" ON user_sessions
    FOR ALL USING (user_id = auth.uid());

-- Core RLS policy: All clinic data must match current active clinic
CREATE POLICY "Clinic isolation for persons" ON persons
    FOR ALL USING (
        clinic_id = get_current_active_clinic()
        AND 
        get_current_active_clinic() IS NOT NULL
    );

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

CREATE POLICY "Clinic isolation for tooth_diagnoses" ON tooth_diagnoses
    FOR ALL USING (
        -- Tooth diagnoses link via history -> patient
        EXISTS (
            SELECT 1 FROM tooth_diagnosis_histories tdh
            JOIN patients p ON p.id = tdh.patient_id
            WHERE tdh.id = history_id 
            AND p.clinic_id = get_current_active_clinic()
        )
        AND 
        get_current_active_clinic() IS NOT NULL
    );

CREATE POLICY "Clinic isolation for tooth_diagnosis_histories" ON tooth_diagnosis_histories
    FOR ALL USING (
        -- Tooth diagnosis histories link via patient
        EXISTS (
            SELECT 1 FROM patients p 
            WHERE p.id = patient_id 
            AND p.clinic_id = get_current_active_clinic()
        )
        AND 
        get_current_active_clinic() IS NOT NULL
    );

-- RLS Policy for clinics table
-- Users can only access clinics they have profiles for
CREATE POLICY "Users can access assigned clinics" ON clinics
    FOR ALL USING (
        id IN (
            SELECT clinic_id 
            FROM profiles 
            WHERE user_id = auth.uid() 
            AND is_active = true
        )
    );

-- RLS Policy for cost_estimates table
-- Cost estimates are accessible via the patient's clinic
CREATE POLICY "Clinic isolation for cost_estimates" ON cost_estimates
    FOR ALL USING (
        -- Cost estimates link via patient
        EXISTS (
            SELECT 1 FROM patients p 
            WHERE p.id = patient_id 
            AND p.clinic_id = get_current_active_clinic()
        )
        AND 
        get_current_active_clinic() IS NOT NULL
    );

-- RLS Policy for cost_estimate_items table  
-- Cost estimate items are accessible via cost_estimate -> patient -> clinic
CREATE POLICY "Clinic isolation for cost_estimate_items" ON cost_estimate_items
    FOR ALL USING (
        -- Cost estimate items link via cost_estimate -> patient
        EXISTS (
            SELECT 1 FROM cost_estimates ce
            JOIN patients p ON p.id = ce.patient_id
            WHERE ce.id = cost_estimate_id 
            AND p.clinic_id = get_current_active_clinic()
        )
        AND 
        get_current_active_clinic() IS NOT NULL
    );

-- RLS Policy for patient_representatives table
-- Patient representatives are accessible via the patient's clinic
CREATE POLICY "Clinic isolation for patient_representatives" ON patient_representatives
    FOR ALL USING (
        -- Patient representatives link via patient
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

-- Function to auto-select clinic on login if user has only one clinic
CREATE OR REPLACE FUNCTION auto_select_clinic_on_login()
RETURNS UUID AS $$
DECLARE
    clinic_count INTEGER;
    single_clinic_id UUID;
    session_token UUID;
BEGIN
    -- Get count of active clinics for current user
    SELECT COUNT(*) INTO clinic_count
    FROM profiles 
    WHERE user_id = auth.uid() 
    AND is_active = true;
    
    -- If user has exactly one clinic, get it and auto-select
    IF clinic_count = 1 THEN
        SELECT clinic_id INTO single_clinic_id
        FROM profiles 
        WHERE user_id = auth.uid() 
        AND is_active = true
        LIMIT 1;
        
        session_token := set_active_clinic(single_clinic_id);
        RETURN session_token;
    END IF;
    
    -- If user has 0 or multiple clinics, return NULL (requires manual selection)
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
