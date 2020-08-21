const postgresDB = require("./PostgresDB");

class ConstrainedQuestionDB {
    createConstrainedQuestion(question_text, position, survey_id) {
        const insertConstrainedQuestion = {
            name: "create-constrained-question",
            text: "INSERT INTO constrained_questions(question_text, position, survey_id) VALUES ($1, $2, $3) RETURNING id",
            values: [question_text, position, survey_id.split("-").join("")]
        };
        return postgresDB.query(insertConstrainedQuestion);
    }

    getQuestionsOfSurvey(survey_id){
        const selectQuery = {
            rowMode: "array",
            name: "select-constrained-questions-by-survey-id",
            text: "SELECT * FROM constrained_questions where survey_id = $1",
            values: [survey_id.split("-").join("")]
        };
        return postgresDB.query(selectQuery);
    }
}

const constrainedQuestionDB = new ConstrainedQuestionDB();
module.exports = constrainedQuestionDB;