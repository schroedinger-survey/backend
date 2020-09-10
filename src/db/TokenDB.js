const postgresDB = require("../drivers/PostgresDB");

class TokenDB {
    constructor() {
        this.deleteUnusedTokens = this.deleteUnusedTokens.bind(this);
        this.createToken = this.createToken.bind(this);
        this.getToken = this.getToken.bind(this);
        this.setTokenUsed = this.setTokenUsed.bind(this);
    }

    deleteUnusedTokens(tokenId, userId) {
        const deleteToken = {
            name: "delete-token",
            rowMode: "array",
            text: `DELETE
                   FROM tokens
                   WHERE id = $1::uuid
                     AND used = false
                     AND id IN (SELECT tokens.id
                                FROM tokens,
                                     users,
                                     surveys
                                WHERE users.id = $2::uuid
                                  AND users.id = surveys.user_id
                                  AND tokens.survey_id = surveys.id);
            `,
            values: [tokenId.split("-").join(""), userId.split("-").join("")]
        };
        return postgresDB.query(deleteToken);
    }

    createToken(surveyId) {
        const insertToken = {
            name: "create-token",
            rowMode: "array",
            text: "INSERT INTO tokens (survey_id) values ($1) RETURNING id",
            values: [surveyId.split("-").join("")]
        };
        return postgresDB.query(insertToken);
    }

    getToken(id) {
        const selectToken = {
            name: "select-token",
            rowMode: "array",
            text: "SELECT * FROM tokens WHERE id = $1",
            values: [id.split("-").join("")]
        };
        return postgresDB.query(selectToken);
    }

    setTokenUsed(id) {
        const updateToken = {
            name: "update-token",
            rowMode: "array",
            text: "UPDATE tokens SET used = $1 AND used_date = $2 WHERE id = $3",
            values: [true, new Date(), id.split("-").join("")]
        };
        return postgresDB.query(updateToken);
    }
}

const tokenDB = new TokenDB();
module.exports = tokenDB;