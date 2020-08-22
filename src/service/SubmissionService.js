const queryConvert = require("../utils/QueryConverter");
const surveyService = require("./SurveyService");
const tokenDB = require("../db/TokenDB");
const postgresDB = require("../db/PostgresDB");
const submissionDB = require("../db/SubmissionDB");

class SubmissionService {
    constructor() {
        this.createSubmission = this.createSubmission.bind(this);
    }

    async createSubmission(req, res) {
        try {
            await postgresDB.begin();
            const requestedSubmission = req.body;
            let survey = null;

            try {
                survey = await surveyService.getSurvey(requestedSubmission.survey_id);
            }catch (e){
                return res.status(400).send(`Can not get survey: ${e.message}`);
            }

            let token = null;
            if (!req.user && survey.secured === true) {
                if(!req.token){
                    return res.status(403).send("Survey is secured. No JWT or participation token found.");
                }
                token = req.token;
                if (token.survey_id !== requestedSubmission.survey_id) {
                    return res.status(403).send("Provided invitation token is not valid for this survey.");
                }
            } else if (req.user && req.user.id !== survey.user_id) {
                return res.status(403).send("You don't have access to this survey.");
            }
            requestedSubmission.constrained_answers.sort((a, b) => {
                if (a.constrained_question_id > b.constrained_question_id) {
                    return 1;
                }
                if (a.constrained_question_id < b.constrained_question_id) {
                    return -1;
                }
                return 0;

            });
            requestedSubmission.freestyle_answers.sort((a, b) => {
                if (a.freestyle_question_id > b.freestyle_question_id) {
                    return 1;
                }
                if (a.freestyle_question_id < b.freestyle_question_id) {
                    return -1;
                }
                return 0;

            });

            survey.freestyle_questions.sort((a, b) => {
                if (a.id > b.id) {
                    return 1;
                }
                if (a.id < b.id) {
                    return -1;
                }
                return 0;

            });

            survey.constrained_questions.sort((a, b) => {
                if (a.id > b.id) {
                    return 1;
                }
                if (a.id < b.id) {
                    return -1;
                }
                return 0;

            });
            if (survey.constrained_questions.length !== requestedSubmission.constrained_answers.length) {
                return res.status(400).send("There are not enough answers.");
            }
            if (survey.freestyle_questions.length !== requestedSubmission.freestyle_answers.length) {
                return res.status(400).send("There are not enough answers.");
            }
            for (let i = 0; i < survey.freestyle_questions.length; i++) {
                if (survey.freestyle_questions[i].id !== requestedSubmission.freestyle_answers[i].freestyle_question_id) {
                    return res.status(400).send(`Question "${survey.freestyle_questions[i].question_text} missing."`);
                }
            }
            for (let i = 0; i < survey.constrained_questions.length; i++) {
                if (survey.constrained_questions[i].id !== requestedSubmission.constrained_answers[i].constrained_question_id) {
                    return res.status(400).send(`Question "${survey.constrained_questions[i].question_text} missing."`);
                }
                const optionsSet = new Set();
                for (let j = 0; j < survey.constrained_questions[i].options.length; j++) {
                    optionsSet.add(survey.constrained_questions[i].options[j].id);
                }
                if (!optionsSet.has(requestedSubmission.constrained_answers[i].constrained_questions_option_id)) {
                    return res.status(400).send(`Option for question "${survey.constrained_questions[i].question_text}" invalid."`);
                }
            }

            let submissions = queryConvert(await submissionDB.createUnsecuredSubmission(survey.id));
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
            if(token){
                submission.token_id = token;
            }
            return res.status(201).send(submission);
        } catch (e) {
            await postgresDB.rollback();
            return res.status(500).send(e.message);
        }
    }
}

const submissionService = new SubmissionService();
module.exports = submissionService;