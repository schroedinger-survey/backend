const postgresDB = require("./PostgresDB");

class SubmissionDB {
    constructor() {
        this.createUnsecuredSubmission = this.createUnsecuredSubmission.bind(this);
        this.createSecuredSubmission = this.createSecuredSubmission.bind(this);
        this.createConstrainedAnswer = this.createConstrainedAnswer.bind(this);
        this.createFreestyleAnswer = this.createFreestyleAnswer.bind(this);
    }

    async createUnsecuredSubmission(survey_id) {

    }

    async createSecuredSubmission(survey_id, token_id) {

    }

    async createConstrainedAnswer(submission_id, constrained_question_id, constrained_questions_option_id) {

    }

    async createFreestyleAnswer(submission_id, freetext_question_id, answer) {

    }
}

const submissionDB = new SubmissionDB();
module.exports = submissionDB;