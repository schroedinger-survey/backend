const postgresDB = require("../drivers/PostgresDB");

class ForgotPasswordDB {
    constructor() {
        this.createForgotPasswordToken = this.createForgotPasswordToken.bind(this);
        this.changeUserPassword = this.changeUserPassword.bind(this);
        this.getForgotPasswordTokenByUserId = this.getForgotPasswordTokenByUserId.bind(this);
    }


    getForgotPasswordTokenByUserId(userid) {
        const insertToken = {
            name: "get-forgot-password-token-by-user-id",
            rowMode: "array",
            text: "SELECT reset_password_tokens.* FROM reset_password_tokens, users WHERE users.id = $1::uuid AND reset_password_tokens.user_id = users.id",
            values: [userid.split("-").join("")]
        };
        return postgresDB.query(insertToken);
    }

    createForgotPasswordToken(userid) {
        const insertToken = {
            name: "create-forgot-password-token",
            rowMode: "array",
            text: "INSERT INTO reset_password_tokens(user_id) VALUES ($1) RETURNING id",
            values: [userid.split("-").join("")]
        };
        return postgresDB.query(insertToken);
    }

    changeUserPassword(resetPasswordToken, newHashedPassword) {
        const changeUserPassword = {
            name: "change-user-password",
            rowMode: "array",
            text: `WITH password_resetted AS (UPDATE users
                    SET hashed_password = $1
                    FROM reset_password_tokens
                    WHERE users.id = reset_password_tokens.user_id
                    AND reset_password_tokens.id = $2::uuid
                    AND reset_password_tokens.expired > NOW()
                    RETURNING reset_password_tokens.id as token, users.id as user_id)
                    DELETE FROM reset_password_tokens WHERE reset_password_tokens.id in (SELECT token FROM password_resetted) 
                    RETURNING (SELECT user_id from password_resetted);`,
            values: [newHashedPassword, resetPasswordToken.split("-").join("")]
        };
        return postgresDB.query(changeUserPassword);
    }
}

const forgotPasswordDB = new ForgotPasswordDB();
module.exports = forgotPasswordDB;