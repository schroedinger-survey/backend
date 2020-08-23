ALTER TABLE surveys
    DROP CONSTRAINT IF EXISTS surveys_end_date_after_start_date;

ALTER TABLE surveys ADD CONSTRAINT surveys_end_date_after_start_date CHECK (end_date IS NULL OR end_date > start_date );