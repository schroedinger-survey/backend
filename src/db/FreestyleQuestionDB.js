const postgresDB = require("../drivers/PostgresDB");

class FreestyleQuestionDB {
    constructor() {
        this.createFreestyleQuestion = this.createFreestyleQuestion.bind(this);
        this.getQuestionsOfSurvey = this.getQuestionsOfSurvey.bind(this);
    }

    createFreestyleQuestion(question_text, position, survey_id) {
        const insertFreeStyleQuestion = {
            name: "create-freestyle-question",
            text: "INSERT INTO freestyle_questions(question_text, position, survey_id) VALUES ($1, $2, $3) RETURNING id",
            values: [question_text, position, survey_id.split("-").join("")]
        };
        return postgresDB.query(insertFreeStyleQuestion);
    }

    getQuestionsOfSurvey(survey_id){
        const selectQuery = {
            rowMode: "array",
            name: "select-freestyle-questions-by-survey-id",
            text: "SELECT * FROM freestyle_questions where survey_id = $1",
            values: [survey_id.split("-").join("")]
        };
        return postgresDB.query(selectQuery);
    }
}

const freestyleQuestionDB = new FreestyleQuestionDB();
module.exports = freestyleQuestionDB;