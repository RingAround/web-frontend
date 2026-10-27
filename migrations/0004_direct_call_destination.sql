-- A direct request may report only its explicitly supplied destination.
ALTER TABLE requests ADD COLUMN destination_phone TEXT;
ALTER TABLE requests ADD COLUMN destination_name TEXT;
