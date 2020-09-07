const httpContext = require("express-http-context");
const queryConvert = require("../utils/QueryConverter");
const surveyService = require("./SurveyService");
const tokenDB = require("../db/TokenDB");
const postgresDB = require("../db/PostgresDB");
const submissionDB = require("../db/SubmissionDB");
const {DebugLogger} = require("../utils/Logger");

const log = DebugLogger("src/service/SubmissionService.js");

class SubmissionService {
    constructor() {
        this.createSubmission = this.createSubmission.bind(this);
        this.getSubmissions = this.getSubmissions.bind(this);
        this.countSubmissions = this.countSubmissions.bind(this);
    }

    async createSubmission(req, res) {
        httpContext.set("method", "createSubmission");
        try {
            await postgresDB.begin();
            const requestedSubmission = req.body;
            let survey = null;

            try {
                survey = await surveyService.getSurvey(requestedSubmission.survey_id);
            } catch (e) {
                await postgresDB.rollback();
                return res.status(400).send(`Can not get survey: ${e.message}`);
            }

            let token = null;
            if (!req.user && survey.secured === true) {
                token = req.token;
                if (token.survey_id !== requestedSubmission.survey_id) {
                    await postgresDB.rollback();
                    return res.status(403).send("Provided invitation token is not valid for this survey.");
                }
            } else if (req.user && req.user.id !== survey.user_id) {
                await postgresDB.rollback();
                return res.status(403).send("You don't have access to this survey.");
            }


            const today = new Date()
            if (survey.start_date > today) {
                await postgresDB.rollback();
                return res.status(401).send(`The survey is not active yet. It will start at ${survey.start_date}`);
            }
            if (survey.end_date && survey.end_date < today) {
                await postgresDB.rollback();
                return res.status(401).send("The survey is not active any more.");
            }

            requestedSubmission.constrained_answers.sort((a, b) => {
                return a.constrained_question_id.localeCompare(b.constrained_question_id);

            });

            requestedSubmission.freestyle_answers.sort((a, b) => {
                return a.freestyle_question_id.localeCompare(b.freestyle_question_id);
            });

            survey.freestyle_questions.sort((a, b) => {
                return a.id.localeCompare(b.id);
            });

            survey.constrained_questions.sort((a, b) => {
                return a.id.localeCompare(b.id);
            });

            if (survey.constrained_questions.length !== requestedSubmission.constrained_answers.length) {
                await postgresDB.rollback();
                return res.status(400).send("There are not enough answers.");
            }

            if (survey.freestyle_questions.length !== requestedSubmission.freestyle_answers.length) {
                await postgresDB.rollback();
                return res.status(400).send("There are not enough answers.");
            }
            for (let i = 0; i < survey.freestyle_questions.length; i++) {
                if (survey.freestyle_questions[i].id !== requestedSubmission.freestyle_answers[i].freestyle_question_id) {
                    await postgresDB.rollback();
                    return res.status(400).send(`Question "${survey.freestyle_questions[i].question_text} missing."`);
                }
            }
            for (let i = 0; i < survey.constrained_questions.length; i++) {
                if (survey.constrained_questions[i].id !== requestedSubmission.constrained_answers[i].constrained_question_id) {
                    await postgresDB.rollback();
                    return res.status(400).send(`Question "${survey.constrained_questions[i].question_text} missing."`);
                }
                const optionsSet = new Set();
                for (let j = 0; j < survey.constrained_questions[i].options.length; j++) {
                    optionsSet.add(survey.constrained_questions[i].options[j].id);
                }
                if (!optionsSet.has(requestedSubmission.constrained_answers[i].constrained_questions_option_id)) {
                    await postgresDB.rollback();
                    return res.status(400).send(`Option for question "${survey.constrained_questions[i].question_text}" invalid."`);
                }
            }

            const submissions = queryConvert(await submissionDB.createUnsecuredSubmission(survey.id));
            if (!submissions || submissions.length === 0) {
                await postgresDB.rollback();
                return res.status(500).send("Can not create submission. Please try again.");
            }
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
            await postgresDB.rollback();
            return res.status(500).send(e.message);
        }
    }

    async getSubmissions(req, res) {
        httpContext.set("method", "getSubmissions");
        const user_id = req.user.id;
        const survey_id = req.query.survey_id;
        const page_number = req.query.page_number ? req.query.page_number : 0;
        const page_size = req.query.page_size ? req.query.page_size : 5;

        const submissions = queryConvert(await submissionDB.getSubmissions(user_id, survey_id, page_number, page_size));

        for (let i = 0; i < submissions.length; i++) {
            const submission = submissions[i];
            submission.constrained_answers = queryConvert(await submissionDB.getConstrainedAnswers(submission.id, req.user.id));
            submission.freestyle_answers = queryConvert(await submissionDB.getFreestyleAnswers(submission.id, req.user.id));
        }

        return res.status(200).json(submissions);
    }

    async countSubmissions(req, res) {
        httpContext.set("method", "countSubmissions");
        const user_id = req.user.id;
        const survey_id = req.query.survey_id;

        const result = await submissionDB.countSubmissions(user_id, survey_id);
        return res.status(200).json(queryConvert(result)[0])
    }
}

const submissionService = new SubmissionService();
module.exports = submissionService;
