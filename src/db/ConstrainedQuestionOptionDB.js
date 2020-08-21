const postgresDB = require("./PostgresDB");

class ConstrainedQuestionOptionDB {
    createConstrainedQuestionOption(answer, position, constrainedQuestionId) {
        const insertConstrainedQuestion = {
            name: "create-constrained-question-option",
            text: "INSERT INTO constrained_questions_options(answer, position, constrained_question_id) VALUES ($1, $2, $3) RETURNING id",
            values: [answer, position, constrainedQuestionId.split("-").join("")]
        };
        return postgresDB.query(insertConstrainedQuestion);
    }
}

const constrainedQuestionOptionDB = new ConstrainedQuestionOptionDB();
module.exports = constrainedQuestionOptionDB;