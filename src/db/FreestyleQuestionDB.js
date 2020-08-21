const postgresDB = require("./PostgresDB");

class FreestyleQuestionDB {
    createFreestyleQuestion(question_text, position, survey_id) {
        const insertFreeStyleQuestion = {
            name: "create-freestyle-question",
            text: "INSERT INTO freestyle_questions(question_text, position, survey_id) VALUES ($1, $2, $3) RETURNING id",
            values: [question_text, position, survey_id.split("-").join("")]
        };
        return postgresDB.query(insertFreeStyleQuestion);
    }
}

const freestyleQuestionDB = new FreestyleQuestionDB();
module.exports = freestyleQuestionDB;