const postgresDB = require("../drivers/PostgresDB");

class FreestyleQuestionDB {
    constructor() {
        this.createFreestyleQuestion = this.createFreestyleQuestion.bind(this);
        this.getQuestionsOfSurvey = this.getQuestionsOfSurvey.bind(this);
        this.deleteFreestyleQuestion = this.deleteFreestyleQuestion.bind(this);
    }

    createFreestyleQuestion(question_text, position, survey_id) {
        const insertFreeStyleQuestion = {
            name: "create-freestyle-question",
            text: "INSERT INTO freestyle_questions(question_text, position, survey_id) VALUES ($1, $2, $3::uuid) RETURNING id",
            values: [question_text, position, survey_id.split("-").join("")]
        };
        return postgresDB.query(insertFreeStyleQuestion);
    }

    deleteFreestyleQuestion(question_id) {
        const deleteQuestion = {
            name: "delete-freestyle-question",
            rowMode: "array",
            text: "DELETE FROM freestyle_questions WHERE id = $1 RETURNING *",
            values: [question_id.split("-").join("")]
        };
        return postgresDB.query(deleteQuestion);
    }

    getQuestionsOfSurvey(survey_id){
        const selectQuery = {
            rowMode: "array",
            name: "select-freestyle-questions-by-survey-id",
            text: "SELECT * FROM freestyle_questions where survey_id = $1::uuid",
            values: [survey_id.split("-").join("")]
        };
        return postgresDB.query(selectQuery);
    }
}

const freestyleQuestionDB = new FreestyleQuestionDB();
module.exports = freestyleQuestionDB;