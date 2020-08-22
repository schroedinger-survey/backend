const postgresDB = require("./PostgresDB");

class TokenDB{
    constructor() {
        this.createToken = this.createToken.bind(this);
        this.getToken = this.getToken.bind(this);
        this.setTokenUsed = this.setTokenUsed.bind(this);
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

    getToken(id){
        const selectToken = {
            name: "select-token",
            rowMode: "array",
            text: "SELECT * FROM tokens WHERE id = $1",
            values: [id.split("-").join("")]
        };
        return postgresDB.query(selectToken);
    }

    setTokenUsed(id){
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