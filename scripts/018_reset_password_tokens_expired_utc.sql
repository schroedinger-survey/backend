ALTER TABLE IF EXISTS reset_password_tokens
    ALTER COLUMN expired SET DATA TYPE timestamp USING (now() at time zone 'utc') + interval '1' HOUR;