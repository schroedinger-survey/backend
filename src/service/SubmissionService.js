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
            const survey = await surveyService.getSurvey(requestedSubmission.survey_id);
            let token = null;
            if (survey.secured === true) {
                if (!req.query || !req.query.token) {
                    return res.status(403).send("Secured survey. You need to provide an invitation link for this.");
                }
                const tokens = queryConvert(await tokenDB.getToken(req.query.token));
                if (tokens.length !== 1) {
                    return res.status(403).send("Provided invation token not found in database.");
                }
                token = tokens[0];
                if (token.survey_id !== requestedSubmission.survey_id) {
                    return res.status(403).send("Provided invation token is not valid for this survey.");
                }
            }
            requestedSubmission.constrained_answers.sort((a, b) => {
                if (a.constrained_question_id > b.constrained_question_id) {
                    return 1;
                } else if (a.constrained_question_id < b.constrained_question_id) {
                    return -1;
                } else {
                    return 0;
                }
            });
            requestedSubmission.freestyle_answers.sort((a, b) => {
                if (a.freestyle_question_id > b.freestyle_question_id) {
                    return 1;
                } else if (a.freestyle_question_id < b.freestyle_question_id) {
                    return -1;
                } else {
                    return 0;
                }
            });

            survey.freestyle_questions.sort((a, b) => {
                if (a.id > b.id) {
                    return 1;
                } else if (a.id < b.id) {
                    return -1;
                } else {
                    return 0;
                }
            });

            survey.constrained_questions.sort((a, b) => {
                if (a.id > b.id) {
                    return 1;
                } else if (a.id < b.id) {
                    return -1;
                } else {
                    return 0;
                }
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

            let submissions = null;
            if (survey.secured === true) {
                submissions = queryConvert(await submissionDB.createSecuredSubmission(survey.id, token.id));
                await tokenDB.setTokenUsed(token.id);

            } else if (survey.secured === false) {
                submissions = queryConvert(await submissionDB.createUnsecuredSubmission(survey.id));
            } else {
                return res.status(500).send("Can not determine if the survey is secured or not.");
            }
            if(!submissions || submissions.length === 0){
                await postgresDB.rollback();
                return res.status(500).send("Can not create submission. Please try again.");
            }else{
                const submission = submissions[0];
                for(let i = 0; i < requestedSubmission.constrained_answers.length; i++){
                    const constrained_question_id = requestedSubmission.constrained_answers[i].constrained_question_id;
                    const constrained_questions_option_id = requestedSubmission.constrained_answers[i].constrained_questions_option_id;
                    await submissionDB.createConstrainedAnswer(submission.id, constrained_question_id, constrained_questions_option_id);
                }
                for(let i = 0; i < requestedSubmission.freestyle_answers.length; i++){
                    const freestyle_question_id = requestedSubmission.freestyle_answers[i].freestyle_question_id;
                    const answer = requestedSubmission.freestyle_answers[i].answer;
                    await submissionDB.createConstrainedAnswer(submission.id, freestyle_question_id, answer);
                }
            }
            await postgresDB.commit();
            return res.sendStatus(201);
        } catch (e) {
            await postgresDB.rollback();
            return res.status(500).send(e.message);
        }
    }
}

const submissionService = new SubmissionService();
module.exports = submissionService;