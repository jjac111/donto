-- Refactor tooth conditions to support multiple surfaces and profile-based recording
-- This migration updates the tooth_conditions table structure

-- First, drop the existing unique constraint
ALTER TABLE tooth_conditions DROP CONSTRAINT IF EXISTS tooth_conditions_patient_id_tooth_number_surface_key;

-- Add new columns
ALTER TABLE tooth_conditions
ADD COLUMN surfaces TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN recorded_by_profile_id UUID REFERENCES profiles(id);

-- Update existing data: migrate surface to surfaces array and provider to profile
UPDATE tooth_conditions
SET
  surfaces = ARRAY[surface],
  recorded_by_profile_id = (
    SELECT p.id
    FROM providers pr
    JOIN profiles p ON p.provider_id = pr.id
    WHERE pr.id = recorded_by_provider_id
  );

-- Remove old columns (we'll do this after confirming data migration)
-- ALTER TABLE tooth_conditions DROP COLUMN surface;
-- ALTER TABLE tooth_conditions DROP COLUMN recorded_by_provider_id;

-- Add new unique constraint for patient-tooth-condition uniqueness
-- (allowing multiple conditions per tooth, but ensuring no duplicate conditions for the same tooth)
ALTER TABLE tooth_conditions
ADD CONSTRAINT tooth_conditions_patient_id_tooth_number_condition_type_key
UNIQUE(patient_id, tooth_number, condition_type);

-- Add index for better query performance
CREATE INDEX idx_tooth_conditions_surfaces ON tooth_conditions USING GIN(surfaces);
CREATE INDEX idx_tooth_conditions_profile ON tooth_conditions(recorded_by_profile_id);

-- Add constraint to ensure surfaces array only contains valid values
ALTER TABLE tooth_conditions
ADD CONSTRAINT tooth_conditions_surfaces_check
CHECK (surfaces <@ ARRAY['M', 'D', 'B', 'L', 'O']);

-- Optional: Add constraint to ensure at least one surface is selected
-- ALTER TABLE tooth_conditions
-- ADD CONSTRAINT tooth_conditions_surfaces_not_empty
-- CHECK (array_length(surfaces, 1) > 0);
