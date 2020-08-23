const postgresDB = require("./PostgresDB");

class UserDB {
    constructor() {
        this.register = this.register.bind(this);
        this.getUser = this.getUser.bind(this);
        this.getUserById = this.getUserById.bind(this);
        this.getUserByEmail = this.getUserByEmail.bind(this);
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

    register(username, hashed_password, email) {
        const registerUser = {
            name: "register-user",
            text: "INSERT INTO users (username, hashed_password, email) VALUES ($1, $2, $3)",
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
}

const userDB = new UserDB()

module.exports = userDB;