const sqlAccess = require("./SQLAccess");

const register = (username, hashed_password, email) => {
    const registerUser = {
        name: "register-user",
        text: "INSERT INTO users (username, hashed_password, email) VALUES ($1, $2, $3)",
        values: [username, hashed_password, email]
    }
    return sqlAccess.query(registerUser);
}

module.exports = {register};