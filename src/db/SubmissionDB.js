const postgresDB = require("../drivers/PostgresDB");

class SubmissionDB {
    constructor() {
        this.createUnsecuredSubmission = this.createUnsecuredSubmission.bind(this);
        this.createSecuredSubmission = this.createSecuredSubmission.bind(this);
        this.createConstrainedAnswer = this.createConstrainedAnswer.bind(this);
        this.createFreestyleAnswer = this.createFreestyleAnswer.bind(this);
        this.countSubmissions = this.countSubmissions.bind(this);
        this.getConstrainedAnswers = this.getConstrainedAnswers.bind(this);
        this.getFreestyleAnswers = this.getFreestyleAnswers.bind(this);
    }

    async createUnsecuredSubmission(survey_id) {
        const insertSurvey = {
            name: "create-submission",
            rowMode: "array",
            text: "INSERT INTO submissions(survey_id) VALUES ($1) RETURNING id",
            values: [survey_id.split("-").join("")]
        };
        return postgresDB.query(insertSurvey);

    }

    async createSecuredSubmission(submission_id, token_id) {
        const insertSurvey = {
            name: "create-secured-submission",
            rowMode: "array",
            text:"INSERT INTO secured_submissions(submission_id, token_id)values ($1, $2)",
            values: [submission_id.split("-").join(""), token_id.split("-").join("")]
        };
        return postgresDB.query(insertSurvey);
    }

    async createConstrainedAnswer(submission_id, constrained_question_id, constrained_questions_option_id) {
        const insertSurvey = {
            name: "create-constrained-answer",
            rowMode: "array",
            text: "INSERT INTO constrained_answers(submission_id, constrained_question_id, constrained_questions_option_id) values($1, $2, $3)",
            values: [submission_id.split("-").join(""), constrained_question_id.split("-").join(""), constrained_questions_option_id.split("-").join("")]
        };
        return postgresDB.query(insertSurvey);
    }

    async getConstrainedAnswers(submission_id, user_id) {
        const insertSurvey = {
            name: "get-constrained-answer",
            rowMode: "array",
            text: `
            SELECT 
                constrained_questions.question_text AS constrained_question_question_text, 
                constrained_questions.position AS constrained_question_position,
                constrained_questions_options.answer AS constrained_question_chose_option, 
                constrained_questions_options.position AS constrained_question_option_position,
                constrained_questions_options.id AS constrained_questions_option_id, 
                constrained_questions.id AS constrained_question_id
            FROM 
                constrained_answers, submissions, surveys, users, constrained_questions, constrained_questions_options
            WHERE 
                users.id = $1 
                AND submissions.id = $2 
                AND surveys.user_id = users.id
                AND submissions.survey_id = surveys.id
                AND constrained_questions.survey_id = surveys.id
                AND constrained_answers.submission_id = submissions.id
                AND constrained_answers.constrained_questions_option_id = constrained_questions_options.id
                AND constrained_answers.constrained_question_id = constrained_questions.id
                AND constrained_questions_options.constrained_question_id = constrained_questions.id;`,
            values: [user_id.split("-").join(""), submission_id.split("-").join("")]
        };
        return postgresDB.query(insertSurvey);
    }

    async getFreestyleAnswers(submission_id, user_id) {
        const selectSurvey = {
            name: "get-freestyle-answer",
            rowMode: "array",
            text: `
                SELECT
                    freestyle_questions.question_text AS freestyle_question_question_text, 
                    freestyle_questions.position AS freestyle_question_position,
                    freestyle_answers.answer AS freestyle_question_answer
                FROM
                    submissions, surveys, users, freestyle_questions, freestyle_answers
                WHERE
                    users.id = $1
                    AND submissions.id = $2
                    AND surveys.user_id = users.id 
                    AND freestyle_questions.survey_id = surveys.id
                    AND submissions.survey_id = surveys.id
                    AND freestyle_answers.freetext_question_id = freestyle_questions.id
                    AND freestyle_answers.submission_id = submissions.id;`,
            values: [user_id.split("-").join(""), submission_id.split("-").join("")]
        };
        return postgresDB.query(selectSurvey);
    }

    async createFreestyleAnswer(submission_id, freetext_question_id, answer) {
        const insertSurvey = {
            name: "create-freestyle-answer",
            rowMode: "array",
            text: "INSERT INTO freestyle_answers(submission_id, freetext_question_id, answer) values($1, $2, $3)",
            values: [submission_id.split("-").join(""), freetext_question_id.split("-").join(""), `'${answer}'`]
        };
        return postgresDB.query(insertSurvey);
    }

    getSubmissions(user_id, survey_id, page_number, page_size) {
        const selectQuery = {
            rowMode: "array",
            name: "get-submissions",
            text: `SELECT submissions.* FROM submissions, users, surveys
            WHERE users.id = $1
            AND surveys.id = $2
            AND surveys.user_id = users.id
            AND submissions.survey_id = surveys.id 
            ORDER BY submissions.created DESC OFFSET $3 LIMIT $4;`,
            values: [user_id.split("-").join(""), survey_id.split("-").join(""), page_number * page_size, page_size]
        };
        return postgresDB.query(selectQuery);
    }

    countSubmissions(user_id, survey_id) {
        const selectQuery = {
            rowMode: "array",
            name: "count-submissions",
            text: `SELECT count(*)::integer FROM submissions, users, surveys
                   WHERE users.id = $1
                     AND surveys.id = $2
                     AND surveys.user_id = users.id
                     AND submissions.survey_id = surveys.id;`,
            values: [user_id.split("-").join(""), survey_id.split("-").join("")]
        };
        return postgresDB.query(selectQuery);
    }
}

const submissionDB = new SubmissionDB();
module.exports = submissionDB;
