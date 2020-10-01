DROP TRIGGER IF EXISTS sync_last_changed_password ON users;

CREATE TRIGGER sync_last_changed_password BEFORE UPDATE OF hashed_password ON users FOR EACH ROW EXECUTE PROCEDURE sync_last_changed_password();

