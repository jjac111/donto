-- Add phone country code field to persons table (phone field already exists)
ALTER TABLE persons 
ADD COLUMN phone_country_code VARCHAR(5);

-- Add phone country code field to patients table for emergency contact (emergency_contact_phone field already exists)
ALTER TABLE patients 
ADD COLUMN emergency_contact_phone_country_code VARCHAR(5);

-- Migrate existing phone data (if any exists)
-- Note: This will need to be run after the application logic is updated
-- to properly parse existing phone numbers

-- Add comments for clarity
COMMENT ON COLUMN persons.phone_country_code IS 'Country code for phone number (e.g., +593)';
COMMENT ON COLUMN patients.emergency_contact_phone_country_code IS 'Country code for emergency contact phone';
