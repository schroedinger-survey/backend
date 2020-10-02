ALTER TABLE IF EXISTS tokens
    ALTER COLUMN used_date SET DATA TYPE timestamp USING (now() at time zone 'utc');