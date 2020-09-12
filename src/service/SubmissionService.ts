import postgresDB from "../drivers/PostgresDB";
import exception from "../utils/Exception";
import tokenDB from "../db/sql/TokenDB";
import submissionDB from "../db/sql/SubmissionDB";
import loggerFactory from "../utils/Logger";
import surveyDB from "../db/sql/SurveyDB";

const httpContext = require("express-http-context");

const log = loggerFactory.buildDebugLogger("src/service/SubmissionService.js");

class SubmissionService {
    createSubmission = async (req, res) => {
        httpContext.set("method", "createSubmission");
        log.debug("Start creating new submission.");
        try {
            await postgresDB.begin();
            const requestedSubmission = req.body;
            const query = await surveyDB.getSurveyById(requestedSubmission.survey_id);
            if (query.length !== 1) {
                return exception(res, 404, "Can not retrieve the survey.");
            }
            const survey = query[0];

            let token = null;
            if (!req.schroedinger.user && survey.secured === true) {
                token = req.schroedinger.token;
                if (token.survey_id !== requestedSubmission.survey_id) {
                    await postgresDB.rollback();
                    return exception(res, 403, "Provided invitation token is not valid for this survey.", null);
                }
            } else if (req.schroedinger.user && req.schroedinger.user.id !== survey.user_id) {
                await postgresDB.rollback();
                return exception(res, 403, "You don't have access to this survey.", null);
            }

            const today = new Date();
            const start_date = new Date(survey.start_date);
            if (start_date > today) {
                await postgresDB.rollback();
                return exception(res, 401, "The survey is not active yet.", survey.start_date);
            }
            if (survey.end_date && new Date(survey.end_date) < today) {
                await postgresDB.rollback();
                return exception(res, 401, "The survey is not active any more.", survey.end_date);
            }

            requestedSubmission.constrained_answers.sort((a, b) => {return a.constrained_question_id.localeCompare(b.constrained_question_id);});
            requestedSubmission.freestyle_answers.sort((a, b) => {return a.freestyle_question_id.localeCompare(b.freestyle_question_id);});
            survey.freestyle_questions.sort((a, b) => {return a.id.localeCompare(b.id);});
            survey.constrained_questions.sort((a, b) => {return a.id.localeCompare(b.id);});

            if (survey.constrained_questions.length !== requestedSubmission.constrained_answers.length) {
                await postgresDB.rollback();
                return exception(res, 400, "There are not enough answers.", null);
            }

            if (survey.freestyle_questions.length !== requestedSubmission.freestyle_answers.length) {
                await postgresDB.rollback();
                return exception(res, 400, "There are not enough answers.", null);
            }

            for (let i = 0; i < survey.freestyle_questions.length; i++) {
                if (survey.freestyle_questions[i].id !== requestedSubmission.freestyle_answers[i].freestyle_question_id) {
                    await postgresDB.rollback();
                    return exception(res, 400, "A question is missing.", survey.freestyle_questions[i].question_text);
                }
            }
            for (let i = 0; i < survey.constrained_questions.length; i++) {
                if (survey.constrained_questions[i].id !== requestedSubmission.constrained_answers[i].constrained_question_id) {
                    await postgresDB.rollback();
                    return exception(res, 400, "A question is missing.", survey.constrained_questions[i].question_text);
                }
                const optionsSet = new Set();
                for (let j = 0; j < survey.constrained_questions[i].options.length; j++) {
                    optionsSet.add(survey.constrained_questions[i].options[j].id);
                }
                if (!optionsSet.has(requestedSubmission.constrained_answers[i].constrained_questions_option_id)) {
                    await postgresDB.rollback();
                    return exception(res, 400, "The chosen option is not valid", survey.constrained_questions[i].question_text);
                }
            }

            // Everything okay. Start creating submission.
            const submissions = await submissionDB.createUnsecuredSubmission(survey.id);

            if (!submissions || submissions.length === 0) {
                await postgresDB.rollback();
                return exception(res, 500, "Can not create submission.", null);
            }
            await postgresDB.savepoint("SAVE_SUBMISSION");

            const submission = submissions[0];
            if (survey.secured === true && token) {
                await submissionDB.createSecuredSubmission(submission.id, token.id);
                await tokenDB.setTokenUsed(token.id);
            }

            for (let i = 0; i < requestedSubmission.constrained_answers.length; i++) {
                const constrained_question_id = requestedSubmission.constrained_answers[i].constrained_question_id;
                const constrained_questions_option_id = requestedSubmission.constrained_answers[i].constrained_questions_option_id;
                await submissionDB.createConstrainedAnswer(submission.id, constrained_question_id, constrained_questions_option_id);
            }
            for (let i = 0; i < requestedSubmission.freestyle_answers.length; i++) {
                const answer = requestedSubmission.freestyle_answers[i].answer;
                const freestyle_question_id = requestedSubmission.freestyle_answers[i].freestyle_question_id;
                await submissionDB.createFreestyleAnswer(submission.id, freestyle_question_id, answer);
            }

            await postgresDB.commit();
            submission.survey_id = survey.id;
            if (token) {
                submission.token_id = token;
            }
            return res.status(201).send(submission);
        } catch (e) {
            log.error(e.message);
            await postgresDB.rollback();
            return exception(res, 500, "An unexpected error happened. Please try again.", e.message);
        }
    }

    getSubmissionById = async (req, res) => {
        httpContext.set("method", "getSubmissionById");
        log.debug("Retrieving submission of a survey by its id.")
        const user_id = req.schroedinger.user.id;
        const submission_id = req.params.submission_id;
        try {
            const submissions = await submissionDB.getSubmissionById(user_id, submission_id);
            if (submissions.length !== 1) {
                return exception(res, 400, "Can not find submission with id", submission_id);
            }
            return res.status(200).json(submissions[0]);
        } catch (e) {
            log.error(e.message);
            return exception(res, 500, "An unexpected error happened. Please try again.", e.message);
        }
    }

    getSubmissions = async (req, res) => {
        httpContext.set("method", "getSubmissions");
        log.debug("Retrieving submissions of a survey.")
        const user_id = req.schroedinger.user.id;
        const survey_id = req.query.survey_id;
        const page_number = req.query.page_number ? req.query.page_number : 0;
        const page_size = req.query.page_size ? req.query.page_size : 5;

        try {
            const submissions = await submissionDB.getSubmissions(user_id, survey_id, page_number, page_size);
            return res.status(200).json(submissions);
        } catch (e) {
            log.error(e.message);
            return exception(res, 500, "An unexpected error happened. Please try again.", e.message);
        }
    }

    countSubmissions = async (req, res) => {
        httpContext.set("method", "countSubmissions");
        log.debug("Counting submissions of a survey.")
        const user_id = req.schroedinger.user.id;
        const survey_id = req.query.survey_id;

        try {
            const result = await submissionDB.countSubmissions(user_id, survey_id);
            return res.status(200).json(result[0]);
        } catch (e) {
            log.error(e.message);
            return exception(res, 500, "An unexpected error happened. Please try again.", e.message);
        }
    }
}

const submissionService = new SubmissionService();
export default submissionService;
