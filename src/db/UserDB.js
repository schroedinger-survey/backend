const postgresDB = require("../drivers/PostgresDB");

class UserDB {
    constructor() {
        this.deleteUserById = this.deleteUserById.bind(this);
        this.register = this.register.bind(this);
        this.getUser = this.getUser.bind(this);
        this.getUserById = this.getUserById.bind(this);
        this.getUserByEmail = this.getUserByEmail.bind(this);
        this.changeUserInformation = this.changeUserInformation.bind(this);
    }

    deleteUserById(id)  {
        const deleteUser = {
            name: "delete-user-by-id",
            rowMode: "array",
            text: "DELETE FROM users WHERE id=$1",
            values: [id.split("-").join("")]
        };
        return postgresDB.query(deleteUser);
    }

    getUserById(id) {
        const searchUser = {
            name: "search-user-by-id",
            rowMode: "array",
            text: "SELECT id, username, email, created FROM users WHERE id=$1",
            values: [id.split("-").join("")]
        };
        return postgresDB.query(searchUser);
    }

    getUserByIdUnsecured(id) {
        const searchUser = {
            name: "search-user-by-unsecured-id",
            rowMode: "array",
            text: "SELECT * FROM users WHERE id=$1",
            values: [id.split("-").join("")]
        };
        return postgresDB.query(searchUser);
    }


    register(username, hashed_password, email) {
        const registerUser = {
            name: "register-user",
            text: "INSERT INTO users (username, hashed_password, email) VALUES ($1, $2, $3) RETURNING id",
            values: [username, hashed_password, email]
        };
        return postgresDB.query(registerUser);
    }

    getUser(username) {
        const searchUser = {
            name: "search-user-by-username",
            rowMode: "array",
            text: "SELECT * FROM users WHERE username=$1",
            values: [username]
        };
        return postgresDB.query(searchUser);
    }

    getUserByEmail(email) {
        const searchUser = {
            name: "search-user-by-email",
            rowMode: "array",
            text: "SELECT * FROM users WHERE email=$1",
            values: [email]
        };
        return postgresDB.query(searchUser);
    }

    changeUserInformation(id, newUserName, newEmail, newHashedPassword, oldUserName, oldEmail, oldHashedPassword) {
        const changeUserInfo = {
            name: "change-user-info",
            rowMode: "array",
            text: `
            WITH args (user_id, new_username, new_email, new_hashed_password, old_username, old_email, old_hashed_password) as (VALUES ($1, $2, $3, $4, $5, $6, $7))
            UPDATE users SET 
            username = CASE WHEN args.new_username IS NOT NULL THEN args.new_username ELSE args.old_username END,
            email = CASE WHEN args.new_email IS NOT NULL THEN args.new_email ELSE args.old_email END,
            hashed_password = CASE WHEN args.new_hashed_password IS NOT NULL THEN args.new_hashed_password ELSE args.old_hashed_password END
            FROM args
            WHERE users.id = args.user_id::uuid RETURNING users.id
            `,
            values: [id.split("-").join(""), newUserName, newEmail, newHashedPassword, oldUserName, oldEmail, oldHashedPassword]
        };
        return postgresDB.query(changeUserInfo);
    }
}

const userDB = new UserDB()

module.exports = userDB;