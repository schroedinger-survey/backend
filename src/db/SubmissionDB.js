const postgresDB = require("./PostgresDB");

class SubmissionDB {
    constructor() {
        this.createUnsecuredSubmission = this.createUnsecuredSubmission.bind(this);
        this.createSecuredSubmission = this.createSecuredSubmission.bind(this);
        this.createConstrainedAnswer = this.createConstrainedAnswer.bind(this);
        this.createFreestyleAnswer = this.createFreestyleAnswer.bind(this);
        this.countSubmissions = this.countSubmissions.bind(this);
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
            AND surveys.id = submissions.survey_id
            AND surveys.user_id = users.id
            ORDER BY submissions.created DESC OFFSET $6 LIMIT $7;`,
            values: [user_id.split("-").join(""), survey_id.split("-").join(""), page_number * page_size, page_size]
        };
        return postgresDB.query(selectQuery);
    }

    countSubmissions(user_id, survey_id) {
        const selectQuery = {
            rowMode: "array",
            name: "get-submissions",
            text: `SELECT count(*) FROM submissions, users, surveys
                   WHERE users.id = $1
                     AND surveys.id = submissions.survey_id
                     AND surveys.user_id = users.id;`,
            values: [user_id.split("-").join(""), survey_id.split("-").join("")]
        };
        return postgresDB.query(selectQuery);
    }
}

const submissionDB = new SubmissionDB();
module.exports = submissionDB;