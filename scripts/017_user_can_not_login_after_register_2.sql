DROP TRIGGER IF EXISTS sync_last_changed_password ON users;

DROP FUNCTION sync_last_changed_password;

CREATE FUNCTION sync_last_changed_password() RETURNS trigger AS $$
BEGIN
    NEW.last_changed_password := (now() at time zone 'utc');

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sync_last_changed_password BEFORE UPDATE OF hashed_password ON users FOR EACH ROW EXECUTE PROCEDURE sync_last_changed_password();