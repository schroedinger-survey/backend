const postgresDB = require("./PostgresDB");

class TokenDB{
    constructor() {
        this.createToken = this.createToken.bind(this);
    }

    createToken(surveyId){
        const insertSurvey = {
            name: "create-token",
            rowMode: "array",
            text: "INSERT INTO tokens (survey_id) values ($1) RETURNING id",
            values: [surveyId.split("-").join("")]
        };
        return postgresDB.query(insertSurvey);
    }
}

const tokenDB = new TokenDB();
module.exports = tokenDB;