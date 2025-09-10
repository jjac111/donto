-- Donto Test Seed Data
-- This file contains test data for running database security tests

-- Clean up existing test data (in case re-running)
DELETE FROM user_sessions WHERE user_id IN (
    SELECT id FROM auth.users WHERE email LIKE '%@test.com' AND email != 'test@test.com'
);
DELETE FROM profiles WHERE user_id IN (
    SELECT id FROM auth.users WHERE email LIKE '%@test.com' AND email != 'test@test.com'
);
DELETE FROM auth.identities WHERE user_id IN (
    SELECT id FROM auth.users WHERE email LIKE '%@test.com' AND email != 'test@test.com'
);
DELETE FROM auth.users WHERE email LIKE '%@test.com' AND email != 'test@test.com';

-- Create test auth users
INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    recovery_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
) VALUES
    ('00000000-0000-0000-0000-000000000000', '550e8400-e29b-41d4-a716-446655530001', 'authenticated', 'authenticated', 'clinic1-admin@test.com', crypt('testpassword123', gen_salt('bf')), current_timestamp, current_timestamp, current_timestamp, '{"provider":"email","providers":["email"]}', '{}', current_timestamp, current_timestamp, '', '', '', ''),
    ('00000000-0000-0000-0000-000000000000', '550e8400-e29b-41d4-a716-446655530002', 'authenticated', 'authenticated', 'clinic1-provider@test.com', crypt('testpassword123', gen_salt('bf')), current_timestamp, current_timestamp, current_timestamp, '{"provider":"email","providers":["email"]}', '{}', current_timestamp, current_timestamp, '', '', '', ''),
    ('00000000-0000-0000-0000-000000000000', '550e8400-e29b-41d4-a716-446655530003', 'authenticated', 'authenticated', 'clinic2-admin@test.com', crypt('testpassword123', gen_salt('bf')), current_timestamp, current_timestamp, current_timestamp, '{"provider":"email","providers":["email"]}', '{}', current_timestamp, current_timestamp, '', '', '', ''),
    ('00000000-0000-0000-0000-000000000000', '550e8400-e29b-41d4-a716-446655530004', 'authenticated', 'authenticated', 'no-access@test.com', crypt('testpassword123', gen_salt('bf')), current_timestamp, current_timestamp, current_timestamp, '{"provider":"email","providers":["email"]}', '{}', current_timestamp, current_timestamp, '', '', '', ''),
    ('00000000-0000-0000-0000-000000000000', '550e8400-e29b-41d4-a716-446655530005', 'authenticated', 'authenticated', 'deactivated@test.com', crypt('testpassword123', gen_salt('bf')), current_timestamp, current_timestamp, current_timestamp, '{"provider":"email","providers":["email"]}', '{}', current_timestamp, current_timestamp, '', '', '', ''),
    ('00000000-0000-0000-0000-000000000000', '550e8400-e29b-41d4-a716-446655530006', 'authenticated', 'authenticated', 'empty-clinic@test.com', crypt('testpassword123', gen_salt('bf')), current_timestamp, current_timestamp, current_timestamp, '{"provider":"email","providers":["email"]}', '{}', current_timestamp, current_timestamp, '', '', '', ''),
    ('00000000-0000-0000-0000-000000000000', '550e8400-e29b-41d4-a716-446655530007', 'authenticated', 'authenticated', 'multi-clinic@test.com', crypt('testpassword123', gen_salt('bf')), current_timestamp, current_timestamp, current_timestamp, '{"provider":"email","providers":["email"]}', '{}', current_timestamp, current_timestamp, '', '', '', ''),
    ('00000000-0000-0000-0000-000000000000', '550e8400-e29b-41d4-a716-446655530008', 'authenticated', 'authenticated', 'test@test.com', crypt('test', gen_salt('bf')), current_timestamp, current_timestamp, current_timestamp, '{"provider":"email","providers":["email"]}', '{}', current_timestamp, current_timestamp, '', '', '', '');

-- Create test user email identities (required for newer Supabase versions)
INSERT INTO auth.identities (
    id,
    user_id,
    provider_id,
    identity_data,
    provider,
    last_sign_in_at,
    created_at,
    updated_at
) VALUES
    (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655530001', '550e8400-e29b-41d4-a716-446655530001', format('{"sub":"%s","email":"%s"}', '550e8400-e29b-41d4-a716-446655530001'::text, 'clinic1-admin@test.com')::jsonb, 'email', current_timestamp, current_timestamp, current_timestamp),
    (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655530002', '550e8400-e29b-41d4-a716-446655530002', format('{"sub":"%s","email":"%s"}', '550e8400-e29b-41d4-a716-446655530002'::text, 'clinic1-provider@test.com')::jsonb, 'email', current_timestamp, current_timestamp, current_timestamp),
    (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655530003', '550e8400-e29b-41d4-a716-446655530003', format('{"sub":"%s","email":"%s"}', '550e8400-e29b-41d4-a716-446655530003'::text, 'clinic2-admin@test.com')::jsonb, 'email', current_timestamp, current_timestamp, current_timestamp),
    (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655530004', '550e8400-e29b-41d4-a716-446655530004', format('{"sub":"%s","email":"%s"}', '550e8400-e29b-41d4-a716-446655530004'::text, 'no-access@test.com')::jsonb, 'email', current_timestamp, current_timestamp, current_timestamp),
    (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655530005', '550e8400-e29b-41d4-a716-446655530005', format('{"sub":"%s","email":"%s"}', '550e8400-e29b-41d4-a716-446655530005'::text, 'deactivated@test.com')::jsonb, 'email', current_timestamp, current_timestamp, current_timestamp),
    (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655530006', '550e8400-e29b-41d4-a716-446655530006', format('{"sub":"%s","email":"%s"}', '550e8400-e29b-41d4-a716-446655530006'::text, 'empty-clinic@test.com')::jsonb, 'email', current_timestamp, current_timestamp, current_timestamp),
    (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655530007', '550e8400-e29b-41d4-a716-446655530007', format('{"sub":"%s","email":"%s"}', '550e8400-e29b-41d4-a716-446655530007'::text, 'multi-clinic@test.com')::jsonb, 'email', current_timestamp, current_timestamp, current_timestamp),
    (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655530008', '550e8400-e29b-41d4-a716-446655530008', format('{"sub":"%s","email":"%s"}', '550e8400-e29b-41d4-a716-446655530008'::text, 'test@test.com')::jsonb, 'email', current_timestamp, current_timestamp, current_timestamp);

-- Test clinics
INSERT INTO clinics (id, name, address, phone, email) VALUES
    ('550e8400-e29b-41d4-a716-446655440001', 'Clínica Dental Norte', 'Av. Principal 123, Quito', '+593-2-234-5678', 'contacto@clinicalnorte.com'),
    ('550e8400-e29b-41d4-a716-446655440002', 'Clínica Dental Sur', 'Calle Secundaria 456, Guayaquil', '+593-4-345-6789', 'info@clinicalsur.com'),
    ('550e8400-e29b-41d4-a716-446655440003', 'Clínica Vacía', 'Sin datos', NULL, NULL);

-- Test persons for Clinic 1 (Norte)
INSERT INTO persons (id, clinic_id, national_id, country, first_name, last_name, date_of_birth, sex, phone, email, address) VALUES
    -- Patients
    ('550e8400-e29b-41d4-a716-446655441001', '550e8400-e29b-41d4-a716-446655440001', '1234567890', 'ECU', 'María', 'González', '1985-03-15', 'F', '+593-99-123-4567', 'maria.gonzalez@email.com', 'Barrio La Floresta, Quito'),
    ('550e8400-e29b-41d4-a716-446655441002', '550e8400-e29b-41d4-a716-446655440001', '2345678901', 'ECU', 'Carlos', 'Rodríguez', '1978-07-22', 'M', '+593-99-234-5678', 'carlos.rodriguez@email.com', 'Sector El Bosque, Quito'),
    ('550e8400-e29b-41d4-a716-446655441003', '550e8400-e29b-41d4-a716-446655440001', '3456789012', 'ECU', 'Ana', 'Vargas', '1992-11-08', 'F', '+593-99-345-6789', 'ana.vargas@email.com', 'La Carolina, Quito'),
    -- Providers
    ('550e8400-e29b-41d4-a716-446655441004', '550e8400-e29b-41d4-a716-446655440001', '4567890123', 'ECU', 'Dr. Roberto', 'Maldonado', '1975-05-12', 'M', '+593-99-456-7890', 'roberto.maldonado@clinica.com', 'Consultorio Norte'),
    ('550e8400-e29b-41d4-a716-446655441005', '550e8400-e29b-41d4-a716-446655440001', '5678901234', 'ECU', 'Dra. Patricia', 'Santos', '1982-09-30', 'F', '+593-99-567-8901', 'patricia.santos@clinica.com', 'Consultorio Norte');

-- Test persons for Clinic 2 (Sur)
INSERT INTO persons (id, clinic_id, national_id, country, first_name, last_name, date_of_birth, sex, phone, email, address) VALUES
    -- Patients (same national IDs as Clinic 1 to test isolation)
    ('550e8400-e29b-41d4-a716-446655442001', '550e8400-e29b-41d4-a716-446655440002', '1234567890', 'ECU', 'María', 'Jiménez', '1985-03-15', 'F', '+593-98-123-4567', 'maria.jimenez@email.com', 'Barrio Centenario, Guayaquil'),
    ('550e8400-e29b-41d4-a716-446655442002', '550e8400-e29b-41d4-a716-446655440002', '6789012345', 'ECU', 'Luis', 'Pérez', '1980-12-05', 'M', '+593-98-234-5678', 'luis.perez@email.com', 'Urdesa, Guayaquil'),
    -- Providers
    ('550e8400-e29b-41d4-a716-446655442003', '550e8400-e29b-41d4-a716-446655440002', '7890123456', 'ECU', 'Dr. Fernando', 'Castillo', '1970-08-18', 'M', '+593-98-345-6789', 'fernando.castillo@clinica.com', 'Consultorio Sur');

-- Test patients
INSERT INTO patients (id, person_id, clinic_id, medical_history, allergies, emergency_contact_name, emergency_contact_phone) VALUES
    -- Clinic 1 patients
    ('550e8400-e29b-41d4-a716-446655451001', '550e8400-e29b-41d4-a716-446655441001', '550e8400-e29b-41d4-a716-446655440001', 'Hipertensión controlada', 'Penicilina', 'Juan González', '+593-99-111-2222'),
    ('550e8400-e29b-41d4-a716-446655451002', '550e8400-e29b-41d4-a716-446655441002', '550e8400-e29b-41d4-a716-446655440001', 'Diabetes tipo 2', NULL, 'Elena Rodríguez', '+593-99-222-3333'),
    ('550e8400-e29b-41d4-a716-446655451003', '550e8400-e29b-41d4-a716-446655441003', '550e8400-e29b-41d4-a716-446655440001', 'Sin antecedentes', 'Ibuprofeno', 'Pedro Vargas', '+593-99-333-4444'),
    -- Clinic 2 patients
    ('550e8400-e29b-41d4-a716-446655452001', '550e8400-e29b-41d4-a716-446655442001', '550e8400-e29b-41d4-a716-446655440002', 'Asma bronquial', 'Aspirina', 'Carlos Jiménez', '+593-98-111-2222'),
    ('550e8400-e29b-41d4-a716-446655452002', '550e8400-e29b-41d4-a716-446655442002', '550e8400-e29b-41d4-a716-446655440002', 'Sin antecedentes', NULL, 'Rosa Pérez', '+593-98-222-3333');

-- Test providers
INSERT INTO providers (id, person_id, clinic_id, specialty, is_active) VALUES
    -- Clinic 1 providers
    ('550e8400-e29b-41d4-a716-446655461001', '550e8400-e29b-41d4-a716-446655441004', '550e8400-e29b-41d4-a716-446655440001', 'Odontología General', true),
    ('550e8400-e29b-41d4-a716-446655461002', '550e8400-e29b-41d4-a716-446655441005', '550e8400-e29b-41d4-a716-446655440001', 'Ortodoncia', true),
    -- Clinic 2 providers
    ('550e8400-e29b-41d4-a716-446655462001', '550e8400-e29b-41d4-a716-446655442003', '550e8400-e29b-41d4-a716-446655440002', 'Endodoncia', true);

-- Test procedures for each clinic
INSERT INTO procedures (id, clinic_id, code, name, description, default_cost, estimated_duration_minutes, category, is_active) VALUES
    -- Clinic 1 procedures
    ('550e8400-e29b-41d4-a716-446655471001', '550e8400-e29b-41d4-a716-446655440001', 'P001', 'Limpieza Dental', 'Profilaxis y limpieza dental completa', 45.00, 45, 'preventivo', true),
    ('550e8400-e29b-41d4-a716-446655471002', '550e8400-e29b-41d4-a716-446655440001', 'P002', 'Obturación Simple', 'Restauración de caries con resina', 35.00, 30, 'restaurativo', true),
    ('550e8400-e29b-41d4-a716-446655471003', '550e8400-e29b-41d4-a716-446655440001', 'P003', 'Extracción Simple', 'Extracción de diente simple', 25.00, 20, 'quirúrgico', true),
    -- Clinic 2 procedures
    ('550e8400-e29b-41d4-a716-446655472001', '550e8400-e29b-41d4-a716-446655440002', 'E001', 'Endodoncia Unirradicular', 'Tratamiento de conducto simple', 120.00, 90, 'endodoncia', true),
    ('550e8400-e29b-41d4-a716-446655472002', '550e8400-e29b-41d4-a716-446655440002', 'E002', 'Endodoncia Multirradicular', 'Tratamiento de conducto múltiple', 180.00, 120, 'endodoncia', true);

-- Test appointments
INSERT INTO appointments (id, clinic_id, patient_id, provider_id, appointment_date, duration_minutes, appointment_type, status, notes) VALUES
    -- Clinic 1 appointments
    ('550e8400-e29b-41d4-a716-446655481001', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655451001', '550e8400-e29b-41d4-a716-446655461001', '2024-02-15 09:00:00-05', 45, 'consulta', 'completed', 'Paciente llegó puntual'),
    ('550e8400-e29b-41d4-a716-446655481002', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655451002', '550e8400-e29b-41d4-a716-446655461002', '2024-02-15 10:30:00-05', 60, 'tratamiento', 'scheduled', 'Revisión de ortodoncia'),
    -- Clinic 2 appointments
    ('550e8400-e29b-41d4-a716-446655482001', '550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655452001', '550e8400-e29b-41d4-a716-446655462001', '2024-02-15 14:00:00-05', 90, 'endodoncia', 'scheduled', 'Primera sesión endodoncia');

-- Test clinical notes
INSERT INTO clinical_notes (id, appointment_id, patient_id, provider_id, subjective, objective, assessment, plan, is_finalized) VALUES
    ('550e8400-e29b-41d4-a716-446655491001', '550e8400-e29b-41d4-a716-446655481001', '550e8400-e29b-41d4-a716-446655451001', '550e8400-e29b-41d4-a716-446655461001', 
     'Paciente refiere dolor en molar superior derecho', 
     'Caries profunda en pieza 16, sensibilidad al frío', 
     'Caries extensa pieza 16, requiere tratamiento', 
     'Obturación con resina compuesta', true);


-- Test treatment plans
INSERT INTO treatment_plans (id, patient_id, provider_id, name, status) VALUES
    ('550e8400-e29b-41d4-a716-446655511001', '550e8400-e29b-41d4-a716-446655451001', '550e8400-e29b-41d4-a716-446655461001', 'Plan Restaurativo Integral', 'active'),
    ('550e8400-e29b-41d4-a716-446655511002', '550e8400-e29b-41d4-a716-446655451002', '550e8400-e29b-41d4-a716-446655461002', 'Tratamiento Ortodóntico', 'active');

-- Test treatment items
INSERT INTO treatment_items (id, treatment_plan_id, procedure_id, tooth_number, tooth_surfaces, priority, status, custom_cost, provider_notes) VALUES
    ('550e8400-e29b-41d4-a716-446655521001', '550e8400-e29b-41d4-a716-446655511001', '550e8400-e29b-41d4-a716-446655471002', '16', 'O', 'urgent', 'planned', 35.00, 'Caries profunda requiere atención inmediata'),
    ('550e8400-e29b-41d4-a716-446655521002', '550e8400-e29b-41d4-a716-446655511001', '550e8400-e29b-41d4-a716-446655471001', NULL, NULL, 'recommended', 'planned', 45.00, 'Limpieza preventiva');

-- Test user profiles (linked to the auth users created above)
INSERT INTO profiles (id, user_id, clinic_id, provider_id, role, is_active) VALUES
    -- Clinic 1 admin
    ('550e8400-e29b-41d4-a716-446655531001', '550e8400-e29b-41d4-a716-446655530001', '550e8400-e29b-41d4-a716-446655440001', NULL, 'admin', true),
    -- Clinic 1 provider
    ('550e8400-e29b-41d4-a716-446655531002', '550e8400-e29b-41d4-a716-446655530002', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655461001', 'provider', true),
    -- Clinic 2 admin
    ('550e8400-e29b-41d4-a716-446655532001', '550e8400-e29b-41d4-a716-446655530003', '550e8400-e29b-41d4-a716-446655440002', NULL, 'admin', true),
    -- User with access to empty clinic
    ('550e8400-e29b-41d4-a716-446655533001', '550e8400-e29b-41d4-a716-446655530006', '550e8400-e29b-41d4-a716-446655440003', NULL, 'staff', true),
    -- User with deactivated profile (no access)
    ('550e8400-e29b-41d4-a716-446655533002', '550e8400-e29b-41d4-a716-446655530005', '550e8400-e29b-41d4-a716-446655440003', NULL, 'staff', false),
    -- Multi-clinic user - admin in Clinic 1
    ('550e8400-e29b-41d4-a716-446655534001', '550e8400-e29b-41d4-a716-446655530007', '550e8400-e29b-41d4-a716-446655440001', NULL, 'admin', true),
    -- Multi-clinic user - provider in Clinic 2
    ('550e8400-e29b-41d4-a716-446655534002', '550e8400-e29b-41d4-a716-446655530007', '550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655462001', 'provider', true),
    -- Test user - admin in Clinic 1 (same as multi-clinic user)
    ('550e8400-e29b-41d4-a716-446655534003', '550e8400-e29b-41d4-a716-446655530008', '550e8400-e29b-41d4-a716-446655440001', NULL, 'admin', true),
    -- Test user - provider in Clinic 2 (same as multi-clinic user)
    ('550e8400-e29b-41d4-a716-446655534004', '550e8400-e29b-41d4-a716-446655530008', '550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655462001', 'provider', true);

-- NOTE: no-access@test.com (ID 530004) intentionally has NO profiles - that's why it's "no access"

-- Test tooth conditions (new multi-surface format with English condition types)
INSERT INTO tooth_conditions (id, patient_id, tooth_number, surfaces, condition_type, notes, recorded_by_profile_id) VALUES
    ('550e8400-e29b-41d4-a716-446655501001', '550e8400-e29b-41d4-a716-446655451001', '16', ARRAY['O'], 'dental_caries', 'Deep caries on occlusal surface', '550e8400-e29b-41d4-a716-446655531001'),
    ('550e8400-e29b-41d4-a716-446655501002', '550e8400-e29b-41d4-a716-446655451001', '17', ARRAY['M'], 'restoration', 'Amalgam restoration in good condition', '550e8400-e29b-41d4-a716-446655531001'),
    ('550e8400-e29b-41d4-a716-446655501003', '550e8400-e29b-41d4-a716-446655451002', '21', ARRAY['L'], 'dental_caries', 'Early proximal caries lesion', '550e8400-e29b-41d4-a716-446655531002'),
    ('550e8400-e29b-41d4-a716-446655501004', '550e8400-e29b-41d4-a716-446655451001', '14', ARRAY['M', 'D', 'O'], 'coronal_fracture', 'Crown fracture affecting mesial, distal, and occlusal surfaces', '550e8400-e29b-41d4-a716-446655531001'),
    ('550e8400-e29b-41d4-a716-446655501005', '550e8400-e29b-41d4-a716-446655452001', '36', ARRAY['B', 'L'], 'gingivitis', 'Localized gingivitis on buccal and lingual surfaces', '550e8400-e29b-41d4-a716-446655534002'),
    ('550e8400-e29b-41d4-a716-446655501006', '550e8400-e29b-41d4-a716-446655452002', '11', ARRAY['M', 'D'], 'enamel_hypoplasia', 'Developmental enamel defect on anterior surfaces', '550e8400-e29b-41d4-a716-446655534002');

-- Create some cost estimates for testing
INSERT INTO cost_estimates (id, treatment_plan_id, patient_id, estimate_number, subtotal, discount_amount, total_amount, valid_until, status, notes) VALUES
    ('550e8400-e29b-41d4-a716-446655541001', '550e8400-e29b-41d4-a716-446655511001', '550e8400-e29b-41d4-a716-446655451001', 'EST-2024-001', 80.00, 8.00, 72.00, '2024-03-15', 'draft', 'Descuento por pronto pago');

INSERT INTO cost_estimate_items (id, cost_estimate_id, treatment_item_id, unit_cost, quantity, total_cost) VALUES
    ('550e8400-e29b-41d4-a716-446655551001', '550e8400-e29b-41d4-a716-446655541001', '550e8400-e29b-41d4-a716-446655521001', 35.00, 1, 35.00),
    ('550e8400-e29b-41d4-a716-446655551002', '550e8400-e29b-41d4-a716-446655541001', '550e8400-e29b-41d4-a716-446655521002', 45.00, 1, 45.00);

-- Update timestamps to make data feel more realistic
UPDATE persons SET created_at = NOW() - INTERVAL '30 days', updated_at = NOW() - INTERVAL '30 days';
UPDATE patients SET created_at = NOW() - INTERVAL '30 days', updated_at = NOW() - INTERVAL '30 days';
UPDATE providers SET created_at = NOW() - INTERVAL '30 days', updated_at = NOW() - INTERVAL '30 days';
UPDATE appointments SET created_at = NOW() - INTERVAL '10 days', updated_at = NOW() - INTERVAL '10 days';
UPDATE clinical_notes SET created_at = NOW() - INTERVAL '10 days', updated_at = NOW() - INTERVAL '10 days';
UPDATE treatment_plans SET created_at = NOW() - INTERVAL '20 days', updated_at = NOW() - INTERVAL '20 days';
UPDATE treatment_items SET created_at = NOW() - INTERVAL '20 days', updated_at = NOW() - INTERVAL '20 days';
UPDATE procedures SET created_at = NOW() - INTERVAL '60 days', updated_at = NOW() - INTERVAL '60 days';
UPDATE tooth_conditions SET created_at = NOW() - INTERVAL '15 days', updated_at = NOW() - INTERVAL '15 days';
UPDATE cost_estimates SET created_at = NOW() - INTERVAL '5 days', updated_at = NOW() - INTERVAL '5 days';
