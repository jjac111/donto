-- Add country and phone_country_code fields to clinics table
ALTER TABLE clinics 
ADD COLUMN country VARCHAR(3) DEFAULT 'ECU',
ADD COLUMN phone_country_code VARCHAR(10) DEFAULT '+593';

