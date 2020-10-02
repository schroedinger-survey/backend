DROP TRIGGER IF EXISTS sync_last_changed_password ON users;

DROP FUNCTION sync_last_changed_password;

CREATE FUNCTION sync_last_changed_password() RETURNS trigger AS $$
BEGIN
    NEW.last_changed_password := (now() at time zone 'utc');

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sync_last_changed_password AFTER UPDATE OF hashed_password ON users FOR EACH ROW EXECUTE PROCEDURE sync_last_changed_password();

CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

ALTER TABLE IF EXISTS surveys
    ALTER COLUMN start_date SET DEFAULT (now() at time zone 'utc'),
    ALTER COLUMN end_date SET DEFAULT null;

ALTER TABLE IF EXISTS users
    ALTER COLUMN created SET DEFAULT (now() at time zone 'utc'),
    ALTER COLUMN last_edited SET DEFAULT (now() at time zone 'utc'),
    ALTER COLUMN last_changed_password SET DEFAULT (now() at time zone 'utc');

ALTER TABLE IF EXISTS surveys
    ALTER COLUMN created SET DEFAULT (now() at time zone 'utc'),
    ALTER COLUMN last_edited SET DEFAULT (now() at time zone 'utc');

ALTER TABLE IF EXISTS tokens
    ALTER COLUMN created SET DEFAULT (now() at time zone 'utc'),
    ALTER COLUMN last_edited SET DEFAULT (now() at time zone 'utc');

ALTER TABLE IF EXISTS constrained_questions
    ALTER COLUMN created SET DEFAULT (now() at time zone 'utc'),
    ALTER COLUMN last_edited SET DEFAULT (now() at time zone 'utc');

ALTER TABLE IF EXISTS constrained_questions_options
    ALTER COLUMN created SET DEFAULT (now() at time zone 'utc'),
    ALTER COLUMN last_edited SET DEFAULT (now() at time zone 'utc');

ALTER TABLE IF EXISTS freestyle_questions
    ALTER COLUMN created SET DEFAULT (now() at time zone 'utc'),
    ALTER COLUMN last_edited SET DEFAULT (now() at time zone 'utc');

ALTER TABLE IF EXISTS submissions
    ALTER COLUMN created SET DEFAULT (now() at time zone 'utc'),
    ALTER COLUMN last_edited SET DEFAULT (now() at time zone 'utc');

ALTER TABLE IF EXISTS freestyle_answers
    ALTER COLUMN created SET DEFAULT (now() at time zone 'utc'),
    ALTER COLUMN last_edited SET DEFAULT (now() at time zone 'utc');

ALTER TABLE IF EXISTS constrained_answers
    ALTER COLUMN created SET DEFAULT (now() at time zone 'utc'),
    ALTER COLUMN last_edited SET DEFAULT (now() at time zone 'utc');

ALTER TABLE IF EXISTS reset_password_tokens
    ALTER COLUMN created SET DEFAULT (now() at time zone 'utc'),
    ALTER COLUMN last_edited SET DEFAULT (now() at time zone 'utc');
