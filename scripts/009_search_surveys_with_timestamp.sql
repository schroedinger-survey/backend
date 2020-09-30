CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

ALTER TABLE IF EXISTS surveys
    ALTER COLUMN start_date SET DATA TYPE timestamp  USING start_date::timestamp,
    ALTER COLUMN start_date SET DEFAULT CURRENT_TIMESTAMP,
    ALTER COLUMN end_date SET DATA TYPE timestamp USING end_date::timestamp,
    ALTER COLUMN end_date SET DEFAULT null;

