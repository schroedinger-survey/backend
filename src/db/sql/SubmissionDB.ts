import AbstractSqlDB from "./AbstractSqlDB";

class SubmissionDB extends AbstractSqlDB {
    createUnsecuredSubmission = (survey_id) => {
        return this.query(
            "INSERT INTO submissions(survey_id) VALUES ($1) RETURNING id",
            [survey_id.split("-").join("")]
        );
    }

    createSecuredSubmission = (submission_id, token_id) => {
        return this.query(
            "INSERT INTO secured_submissions(submission_id, token_id)values ($1, $2)",
            [submission_id.split("-").join(""), token_id.split("-").join("")]
        );
    }

    createConstrainedAnswer = (submission_id, constrained_question_id, constrained_questions_option_id) => {
        return this.query(
            "INSERT INTO constrained_answers(submission_id, constrained_question_id, constrained_questions_option_id) values($1, $2, $3)",
            [submission_id.split("-").join(""), constrained_question_id.split("-").join(""), constrained_questions_option_id.split("-").join("")]
        );
    }

    getConstrainedAnswers = (submission_id, user_id) => {
        return this.query(`
                    SELECT constrained_questions.question_text    AS constrained_question_question_text,
                           constrained_questions.position         AS constrained_question_position,
                           constrained_questions_options.answer   AS constrained_question_chose_option,
                           constrained_questions_options.position AS constrained_question_option_position,
                           constrained_questions_options.id       AS constrained_questions_option_id,
                           constrained_questions.id               AS constrained_question_id
                    FROM constrained_answers,
                         submissions,
                         surveys,
                         users,
                         constrained_questions,
                         constrained_questions_options
                    WHERE users.id = $1
                      AND submissions.id = $2
                      AND surveys.user_id = users.id
                      AND submissions.survey_id = surveys.id
                      AND constrained_questions.survey_id = surveys.id
                      AND constrained_answers.submission_id = submissions.id
                      AND constrained_answers.constrained_questions_option_id = constrained_questions_options.id
                      AND constrained_answers.constrained_question_id = constrained_questions.id
                      AND constrained_questions_options.constrained_question_id = constrained_questions.id;`,
            [user_id.split("-").join(""), submission_id.split("-").join("")]
        );
    }

    getFreestyleAnswers = (submission_id, user_id) => {
        return this.query(`
                    SELECT freestyle_questions.question_text AS freestyle_question_question_text,
                           freestyle_questions.position      AS freestyle_question_position,
                           freestyle_answers.answer          AS freestyle_question_answer
                    FROM submissions,
                         surveys,
                         users,
                         freestyle_questions,
                         freestyle_answers
                    WHERE users.id = $1
                      AND submissions.id = $2
                      AND surveys.user_id = users.id
                      AND freestyle_questions.survey_id = surveys.id
                      AND submissions.survey_id = surveys.id
                      AND freestyle_answers.freetext_question_id = freestyle_questions.id
                      AND freestyle_answers.submission_id = submissions.id;`,
            [user_id.split("-").join(""), submission_id.split("-").join("")]
        );
    }

    createFreestyleAnswer = (submission_id, freetext_question_id, answer) => {
        return this.query(
            "INSERT INTO freestyle_answers(submission_id, freetext_question_id, answer) values($1, $2, $3)",
            [submission_id.split("-").join(""), freetext_question_id.split("-").join(""), answer]
        );
    }

    getSubmissionById = (user_id, submission_id) => {
        return this.query(`SELECT submissions.*
                           FROM submissions,
                                users,
                                surveys
                           WHERE users.id = $1::uuid
                             AND surveys.user_id = users.id
                             AND submissions.survey_id = surveys.id
                             AND submissions.id = $2::uuid;`,
            [user_id.split("-").join(""), submission_id.split("-").join("")]
        );
    }

    getSubmissions = (user_id, survey_id, page_number, page_size) => {
        return this.query(`SELECT submissions.*
                           FROM submissions,
                                users,
                                surveys
                           WHERE users.id = $1
                             AND surveys.id = $2
                             AND surveys.user_id = users.id
                             AND submissions.survey_id = surveys.id
                           ORDER BY submissions.created DESC
                           OFFSET $3 LIMIT $4;`,
            [user_id.split("-").join(""), survey_id.split("-").join(""), page_number * page_size, page_size]
        );
    }

    countSubmissions = (user_id, survey_id) => {
        return this.query(`SELECT count(*)::integer
                   FROM submissions,
                        users,
                        surveys
                   WHERE users.id = $1
                     AND surveys.id = $2
                     AND surveys.user_id = users.id
                     AND submissions.survey_id = surveys.id;`,
            [user_id.split("-").join(""), survey_id.split("-").join("")]
        );
    }
}

const submissionDB = new SubmissionDB();
export default submissionDB;
