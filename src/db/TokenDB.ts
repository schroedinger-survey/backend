import AbstractSqlDB from "./AbstractSqlDB";

class TokenDB extends AbstractSqlDB {
    countTokensBySurveyIdAndUserId = (survey_id: string, user_id: string, used: string) => {
        return this.query(
            `
            WITH args (survey_id, user_id, used) as (VALUES ($1, $2, $3))
            SELECT count(distinct(tokens.id))::integer FROM tokens, surveys, args
            WHERE 
            tokens.survey_id = args.survey_id::uuid
            AND surveys.user_id = args.user_id::uuid
            AND (args.used IS NULL OR tokens.used = args.used::boolean)`,
            [survey_id.split("-").join(""), user_id.split("-").join(""), used]
        );
    }

    getTokensBySurveyIdAndUserId = (survey_id: string, user_id: string, used: string, page_number: number, page_size: number) => {
        return this.query(
            `
            WITH args (survey_id, user_id, used) as (VALUES ($1, $2, $3))
            SELECT tokens.*, secured_submissions.submission_id
            FROM (SELECT tokens.* FROM tokens, surveys, args
            WHERE 
            tokens.survey_id = args.survey_id::uuid
            AND surveys.user_id = args.user_id::uuid
            AND (args.used IS NULL OR tokens.used = args.used::boolean)
            GROUP BY tokens.id
            ORDER BY tokens.created DESC OFFSET $4 LIMIT $5) AS tokens 
            LEFT JOIN secured_submissions ON tokens.id = secured_submissions.token_id;`,
            [survey_id.split("-").join(""), user_id.split("-").join(""), used, page_number * page_size, page_size]
        );
    }

    deleteUnusedTokens = (tokenId: string, userId: string) => {
        return this.query(
                `DELETE
                 FROM tokens
                 WHERE id = $1::uuid
                   AND used = false
                   AND id IN (SELECT tokens.id
                              FROM tokens,
                                   users,
                                   surveys
                              WHERE users.id = $2::uuid
                                AND users.id = surveys.user_id
                                AND tokens.survey_id = surveys.id);`,
            [tokenId.split("-").join(""), userId.split("-").join("")]
        );
    }

    createToken = (surveyId: string) => {
        return this.query(
            "INSERT INTO tokens (survey_id) values ($1) RETURNING id",
            [surveyId.split("-").join("")]
        );
    }

    getToken = (tokenId: string) => {
        return this.query(
            "SELECT * FROM tokens WHERE id = $1",
            [tokenId.split("-").join("")]
        );
    }

    setTokenUsed = (tokenId: string) => {
        return this.query(
            "UPDATE tokens SET used = TRUE, used_date = CAST($1 as date) WHERE id = $2",
            [new Date(), tokenId.split("-").join("")]
        );
    }
}

const tokenDB = new TokenDB();
export default tokenDB;