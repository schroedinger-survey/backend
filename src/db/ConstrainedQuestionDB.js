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
}

const constrainedQuestionDB = new ConstrainedQuestionDB();
module.exports = constrainedQuestionDB;