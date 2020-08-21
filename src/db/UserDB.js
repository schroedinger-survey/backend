const postgresDB = require("./PostgresDB");

class UserDB {
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
            name: "search-user",
            text: "SELECT * FROM users WHERE username=$1",
            values: [username]
        };
        return postgresDB.query(searchUser);
    }
}

const userDB = new UserDB()

module.exports = userDB;