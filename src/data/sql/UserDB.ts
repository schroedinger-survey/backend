import AbstractSqlDB from "./AbstractSqlDB";

class UserDB extends AbstractSqlDB {
    getUserByUsernameOrEmail = (input: string) => {
        return this.query(
            "SELECT * FROM users WHERE username=$1 OR email = $2",
            [input, input]
        );
    }

    deleteUserById = (userId: string) => {
        return this.query(
            "DELETE FROM users WHERE id=$1",
            [userId.split("-").join("")]
        );
    }

    getUserById = (userId: string) => {
        return this.query(
            "SELECT id, username, email, created, last_edited, last_changed_password FROM users WHERE id=$1",
            [userId.split("-").join("")]
        );
    }

    getUserByIdUnsecured = (userId: string) => {
        return this.query(
            "SELECT * FROM users WHERE id=$1",
            [userId.split("-").join("")]
        );
    }


    register = (username: string, hashed_password: string, email: string) => {
        return this.query(
            "INSERT INTO users (username, hashed_password, email) VALUES ($1, $2, $3) RETURNING id",
            [username, hashed_password, email]
        );
    }

    getUserByUserNameUnsecured = (username: string) => {
        return this.query(
            "SELECT * FROM users WHERE username=$1",
            [username]
        );
    }

    getUserByEmailUnsecured = (email: string) => {
        return this.query(
            "SELECT * FROM users WHERE email=$1",
            [email]
        );
    }

    changeUserInformation = (userId: string, newUserName: string, newEmail: string, newHashedPassword: string, oldUserName: string, oldEmail: string, oldHashedPassword: string) => {
        return this.query(`
            WITH args (user_id, new_username, new_email, new_hashed_password, old_username, old_email, old_hashed_password) as (VALUES ($1, $2, $3, $4, $5, $6, $7))
            UPDATE users SET 
            username = CASE WHEN args.new_username IS NOT NULL THEN args.new_username ELSE args.old_username END,
            email = CASE WHEN args.new_email IS NOT NULL THEN args.new_email ELSE args.old_email END,
            hashed_password = CASE WHEN args.new_hashed_password IS NOT NULL THEN args.new_hashed_password ELSE args.old_hashed_password END
            FROM args
            WHERE users.id = args.user_id::uuid RETURNING users.id
            `,
            [userId.split("-").join(""), newUserName, newEmail, newHashedPassword, oldUserName, oldEmail, oldHashedPassword]
        );
    }

    logout = (userId: string) => {
        return this.query(`
            UPDATE users SET logged_out = (now() at time zone 'utc') WHERE id = $1;`,
            [userId.split("-").join("")]
        );
    }
}

const userDB = new UserDB()
export default userDB;