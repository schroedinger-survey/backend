const postgresDB = require("./PostgresDB");

class SurveyDB {
    createSurvey(title, description, startDate, endDate, secured, userId) {
        const insertSurvey = {
            name: "create-survey",
            text: "INSERT INTO surveys(title, description, start_date, end_date, secured, user_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id",
            values: [title, description, startDate, endDate, secured, userId.split("-").join("")]
        };
        return postgresDB.query(insertSurvey);
    }

    getSurvey(id){
        const selectQuery = {
            rowMode: "array",
            name: "get-survey",
            text: "SELECT * FROM surveys where id = $1",
            values: [id.split("-").join("")]
        };
        return postgresDB.query(selectQuery);

    }
}

const surveyDB = new SurveyDB();
module.exports = surveyDB;