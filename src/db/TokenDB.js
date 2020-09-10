const postgresDB = require("../drivers/PostgresDB");

class TokenDB {
    constructor() {
        this.getTokensBySurveyIdAndUserId = this.getTokensBySurveyIdAndUserId.bind(this);
        this.deleteUnusedTokens = this.deleteUnusedTokens.bind(this);
        this.createToken = this.createToken.bind(this);
        this.getToken = this.getToken.bind(this);
        this.setTokenUsed = this.setTokenUsed.bind(this);
    }

    countTokensBySurveyIdAndUserId(survey_id, user_id, used) {
        const selectToken = {
            name: "count-token-by-survey-id-and-user-id",
            rowMode: "array",
            text: `
            WITH args (survey_id, user_id, used) as (VALUES ($1, $2, $3))
            SELECT count(tokens.*)::integer FROM tokens, surveys, args
            WHERE 
            tokens.survey_id = args.survey_id::uuid
            AND surveys.user_id = args.user_id::uuid
            AND (args.used IS NULL OR tokens.used = args.used::boolean)`,
            values: [survey_id.split("-").join(""), user_id.split("-").join(""), used]
        };
        return postgresDB.query(selectToken);
    }

    getTokensBySurveyIdAndUserId(survey_id, user_id, used, page_number, page_size) {
        const selectToken = {
            name: "select-token-by-survey-id-and-user-id",
            rowMode: "array",
            text: `
            WITH args (survey_id, user_id, used) as (VALUES ($1, $2, $3))
            SELECT tokens.*, secured_submissions.submission_id
            FROM (SELECT tokens.* FROM tokens, surveys, args
            WHERE 
            tokens.survey_id = args.survey_id::uuid
            AND surveys.user_id = args.user_id::uuid
            AND (args.used IS NULL OR tokens.used = args.used::boolean)
            ORDER BY tokens.created DESC OFFSET $4 LIMIT $5) AS tokens 
            LEFT JOIN secured_submissions ON tokens.id = secured_submissions.token_id;`,
            values: [survey_id.split("-").join(""), user_id.split("-").join(""), used, page_number * page_size, page_size]
        };
        return postgresDB.query(selectToken);
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
            text: "UPDATE tokens SET used = TRUE, used_date = CAST($1 as date) WHERE id = $2",
            values: [new Date(), id.split("-").join("")]
        };
        return postgresDB.query(updateToken);
    }
}

const tokenDB = new TokenDB();
module.exports = tokenDB;