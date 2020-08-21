const postgresDB = require("./PostgresDB");

class ConstrainedQuestionOptionDB {
    constructor() {
        this.createConstrainedQuestionOption = this.createConstrainedQuestionOption.bind(this);
        this.getOptionsOfQuestion = this.getOptionsOfQuestion.bind(this);
    }

    createConstrainedQuestionOption(answer, position, constrainedQuestionId) {
        const insertConstrainedQuestion = {
            name: "create-constrained-question-option",
            text: "INSERT INTO constrained_questions_options(answer, position, constrained_question_id) VALUES ($1, $2, $3) RETURNING id",
            values: [answer, position, constrainedQuestionId.split("-").join("")]
        };
        return postgresDB.query(insertConstrainedQuestion);
    }

    getOptionsOfQuestion(constrained_question_id){
        const selectQuery = {
            rowMode: "array",
            name: "select-constrained-questions-options-by-question-id",
            text: "SELECT * FROM constrained_questions_options where constrained_question_id = $1",
            values: [constrained_question_id.split("-").join("")]
        };
        return postgresDB.query(selectQuery);
    }
}

const constrainedQuestionOptionDB = new ConstrainedQuestionOptionDB();
module.exports = constrainedQuestionOptionDB;