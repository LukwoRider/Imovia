ALTER TABLE properties 
ADD COLUMN is_for_sale BOOLEAN DEFAULT false NOT NULL,
ADD COLUMN is_under_renovation BOOLEAN DEFAULT false NOT NULL;