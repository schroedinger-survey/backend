import AbstractSqlDB from "./AbstractSqlDB";

class UserDB extends AbstractSqlDB {
    deleteUserById = (id) => {
        return this.query(
            "DELETE FROM users WHERE id=$1",
            [id.split("-").join("")]
        );
    }

    getUserById = (id) => {
        return this.query(
            "SELECT id, username, email, created, last_edited, last_changed_password FROM users WHERE id=$1",
            [id.split("-").join("")]
        );
    }

    getUserByIdUnsecured = (id) => {
        return this.query(
            "SELECT * FROM users WHERE id=$1",
            [id.split("-").join("")]
        );
    }


    register = (username, hashed_password, email) => {
        return this.query(
            "INSERT INTO users (username, hashed_password, email) VALUES ($1, $2, $3) RETURNING id",
            [username, hashed_password, email]
        );
    }

    getUserByUserNameUnsecured = (username) => {
        return this.query(
            "SELECT * FROM users WHERE username=$1",
            [username]
        );
    }

    getUserByEmailUnsecured = (email) => {
        return this.query(
            "SELECT * FROM users WHERE email=$1",
            [email]
        );
    }

    changeUserInformation = (id, newUserName, newEmail, newHashedPassword, oldUserName, oldEmail, oldHashedPassword) => {
        return this.query(`
            WITH args (user_id, new_username, new_email, new_hashed_password, old_username, old_email, old_hashed_password) as (VALUES ($1, $2, $3, $4, $5, $6, $7))
            UPDATE users SET 
            username = CASE WHEN args.new_username IS NOT NULL THEN args.new_username ELSE args.old_username END,
            email = CASE WHEN args.new_email IS NOT NULL THEN args.new_email ELSE args.old_email END,
            hashed_password = CASE WHEN args.new_hashed_password IS NOT NULL THEN args.new_hashed_password ELSE args.old_hashed_password END
            FROM args
            WHERE users.id = args.user_id::uuid RETURNING users.id
            `,
            [id.split("-").join(""), newUserName, newEmail, newHashedPassword, oldUserName, oldEmail, oldHashedPassword]
        );
    }
}

const userDB = new UserDB()
export default userDB;