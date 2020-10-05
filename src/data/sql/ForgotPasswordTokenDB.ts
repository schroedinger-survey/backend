import AbstractSqlDB from "./AbstractSqlDB";

class ForgotPasswordDB extends AbstractSqlDB {
    getForgotPasswordTokenByUserId = (userid: string) => {
        return this.query(
            "SELECT reset_password_tokens.* FROM reset_password_tokens, users WHERE users.id = $1::uuid AND reset_password_tokens.user_id = users.id",
            [userid.split("-").join("")]
        );
    }

    createForgotPasswordToken = (userid: string) => {
        return this.query(
            "INSERT INTO reset_password_tokens(user_id) VALUES ($1) RETURNING id",
            [userid.split("-").join("")]
        );
    }

    changeUserPassword = (resetPasswordToken: string, newHashedPassword: string) => {
        return this.query(
                `WITH password_resetted AS (UPDATE users
                    SET hashed_password = $1
                    FROM reset_password_tokens
                    WHERE users.id = reset_password_tokens.user_id
                        AND reset_password_tokens.id = $2::uuid
                        AND reset_password_tokens.expired > NOW()
                    RETURNING reset_password_tokens.id as token, users.id as user_id)
                 DELETE
                 FROM reset_password_tokens
                 WHERE reset_password_tokens.id in (SELECT token FROM password_resetted)
                 RETURNING (SELECT user_id from password_resetted);`,
            [newHashedPassword, resetPasswordToken.split("-").join("")]
        );
    }
}

const forgotPasswordDB = new ForgotPasswordDB();
export default forgotPasswordDB;