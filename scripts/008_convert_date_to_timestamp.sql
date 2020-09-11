ALTER TABLE IF EXISTS users
    ALTER COLUMN created SET DATA TYPE timestamp USING created::timestamp,
    ADD COLUMN IF NOT EXISTS last_edited timestamp DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS last_changed_password timestamp DEFAULT NOW();

ALTER TABLE IF EXISTS surveys
    ALTER COLUMN created SET DATA TYPE timestamp USING NOW(),
    ADD COLUMN last_edited timestamp DEFAULT NOW();

ALTER TABLE IF EXISTS tokens
    ALTER COLUMN created SET DATA TYPE timestamp USING NOW(),
    ADD COLUMN last_edited timestamp DEFAULT NOW();

ALTER TABLE IF EXISTS constrained_questions
    ALTER COLUMN created SET DATA TYPE timestamp USING NOW(),
    ADD COLUMN last_edited timestamp DEFAULT NOW();

ALTER TABLE IF EXISTS constrained_questions_options
    ALTER COLUMN created SET DATA TYPE timestamp USING NOW(),
    ADD COLUMN last_edited timestamp DEFAULT NOW();

ALTER TABLE IF EXISTS freestyle_questions
    ALTER COLUMN created SET DATA TYPE timestamp USING NOW(),
    ADD COLUMN last_edited timestamp DEFAULT NOW();

ALTER TABLE IF EXISTS submissions
    ALTER COLUMN created SET DATA TYPE timestamp USING NOW(),
    ADD COLUMN last_edited timestamp DEFAULT NOW();

ALTER TABLE IF EXISTS freestyle_answers
    ALTER COLUMN created SET DATA TYPE timestamp USING NOW(),
    ADD COLUMN last_edited timestamp DEFAULT NOW();

ALTER TABLE IF EXISTS constrained_answers
    ALTER COLUMN created SET DATA TYPE timestamp USING NOW(),
    ADD COLUMN last_edited timestamp DEFAULT NOW();

ALTER TABLE IF EXISTS reset_password_tokens
    ADD COLUMN last_edited timestamp DEFAULT NOW();

CREATE FUNCTION sync_last_edited() RETURNS trigger AS $$
BEGIN
    NEW.last_edited := NOW();

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sync_last_edited_users BEFORE UPDATE ON users FOR EACH ROW EXECUTE PROCEDURE sync_last_edited();

CREATE TRIGGER sync_last_edited_surveys BEFORE UPDATE ON surveys FOR EACH ROW EXECUTE PROCEDURE sync_last_edited();

CREATE TRIGGER sync_last_edited_tokens BEFORE UPDATE ON tokens FOR EACH ROW EXECUTE PROCEDURE sync_last_edited();

CREATE TRIGGER sync_last_edited_constrained_questions BEFORE UPDATE ON constrained_questions FOR EACH ROW EXECUTE PROCEDURE sync_last_edited();

CREATE TRIGGER sync_last_edited_constrained_questions_options BEFORE UPDATE ON constrained_questions_options FOR EACH ROW EXECUTE PROCEDURE sync_last_edited();

CREATE TRIGGER sync_last_edited_freestyle_questions BEFORE UPDATE ON freestyle_questions FOR EACH ROW EXECUTE PROCEDURE sync_last_edited();

CREATE TRIGGER sync_last_edited_submissions BEFORE UPDATE ON submissions FOR EACH ROW EXECUTE PROCEDURE sync_last_edited();

CREATE TRIGGER sync_last_edited_secured_submissions BEFORE UPDATE ON secured_submissions FOR EACH ROW EXECUTE PROCEDURE sync_last_edited();

CREATE TRIGGER sync_last_edited_freestyle_answers BEFORE UPDATE ON freestyle_answers FOR EACH ROW EXECUTE PROCEDURE sync_last_edited();

CREATE TRIGGER sync_last_edited_constrained_answers BEFORE UPDATE ON constrained_answers FOR EACH ROW EXECUTE PROCEDURE sync_last_edited();

CREATE TRIGGER sync_last_edited_reset_password_tokens BEFORE UPDATE ON reset_password_tokens FOR EACH ROW EXECUTE PROCEDURE sync_last_edited();

CREATE FUNCTION sync_last_changed_password() RETURNS trigger AS $$
BEGIN
    NEW.last_changed_password := NOW();

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sync_last_changed_password BEFORE UPDATE OF last_changed_password ON users FOR EACH ROW EXECUTE PROCEDURE sync_last_changed_password();