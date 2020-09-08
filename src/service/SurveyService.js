const httpContext = require("express-http-context");
const postgresDB = require("../drivers/PostgresDB");
const surveyDB = require("../db/SurveyDB");
const freestyleQuestionDB = require("../db/FreestyleQuestionDB");
const constrainedQuestionDB = require("../db/ConstrainedQuestionDB");
const constrainedQuestionOptionDB = require("../db/ConstrainedQuestionOptionDB");
const queryConvert = require("../utils/QueryConverter");
const Exception = require("../utils/Exception");
const {DebugLogger} = require("../utils/Logger");

const log = DebugLogger("src/service/SurveyService.js");

class SurveyService {
    constructor() {
        this.getSurvey = this.getSurvey.bind(this);
        this.createSurvey = this.createSurvey.bind(this);
        this.searchPublicSurveys = this.searchPublicSurveys.bind(this);
        this.countPublicSurveys = this.countPublicSurveys.bind(this);
        this.searchSecuredSurveys = this.searchSecuredSurveys.bind(this);
        this.countSecuredSurveys = this.countSecuredSurveys.bind(this);
        this.retrievePublicSurvey = this.retrievePublicSurvey.bind(this);
        this.retrievePrivateSurvey = this.retrievePrivateSurvey.bind(this);
    }

    async getSurvey(id) {
        httpContext.set("method", "getSurvey");
        const promises = [];
        promises.push(surveyDB.getSurvey(id));
        promises.push(freestyleQuestionDB.getQuestionsOfSurvey(id));
        promises.push(constrainedQuestionDB.getQuestionsOfSurvey(id));

        const [surveyArray, freeStyleQuestionArray, constrainedQuestionArray] = await Promise.all(promises);
        if (surveyArray.rows.length === 1) {
            const survey = queryConvert(surveyArray)[0];

            survey.freestyle_questions = [];
            const freeStyleQuestions = queryConvert(freeStyleQuestionArray);
            for (const i of freeStyleQuestions) {
                survey.freestyle_questions.push(i);
            }

            survey.constrained_questions = [];
            const constrainedQuestions = queryConvert(constrainedQuestionArray);
            for (const i of constrainedQuestions) {
                i.options = queryConvert(await constrainedQuestionOptionDB.getOptionsOfQuestion(i.id));
                survey.constrained_questions.push(i);
            }
            return survey;
        }
        throw new Error(`Survey with id ${id} could not found`);
    }

    async retrievePrivateSurvey(req, res) {
        httpContext.set("method", "retrievePrivateSurvey");
        try {
            const survey_id = req.params.survey_id;
            const surveys = queryConvert(await surveyDB.getSurvey(survey_id));
            if (surveys.length === 1) {
                const survey = surveys[0];
                if (req.user) {
                    if (survey.user_id !== req.user.id) {
                        return res.status(403).send("User is not owner of survey");
                    }
                } else if (req.token) {
                    if (req.token.survey_id !== survey.id) {
                        return res.status(403).send("Token does not belong to survey");
                    }
                }
                const promises = [];
                promises.push(freestyleQuestionDB.getQuestionsOfSurvey(survey_id));
                promises.push(constrainedQuestionDB.getQuestionsOfSurvey(survey_id));

                const [freeStyleQuestionArray, constrainedQuestionArray] = await Promise.all(promises);
                survey.freestyle_questions = [];
                const freeStyleQuestions = queryConvert(freeStyleQuestionArray);
                for (const i of freeStyleQuestions) {
                    survey.freestyle_questions.push(i);
                }

                survey.constrained_questions = [];
                const constrainedQuestions = queryConvert(constrainedQuestionArray);
                for (const i of constrainedQuestions) {
                    i.options = queryConvert(await constrainedQuestionOptionDB.getOptionsOfQuestion(i.id));
                    survey.constrained_questions.push(i);
                }
                return res.status(200).send(survey);
            }
        } catch (e) {
            log.error(e.message);
            return Exception(500, "An unexpected error happened. Please try again.", e.message).send(res);
        }
    }

    async retrievePublicSurvey(req, res) {
        httpContext.set("method", "retrievePublicSurvey");
        try {
            const survey_id = req.params.survey_id;
            const surveys = queryConvert(await surveyDB.getSurvey(survey_id));
            if (surveys.length === 1) {
                const survey = surveys[0];
                if (survey.secured === false) {
                    const promises = [];
                    promises.push(freestyleQuestionDB.getQuestionsOfSurvey(survey_id));
                    promises.push(constrainedQuestionDB.getQuestionsOfSurvey(survey_id));

                    const [freeStyleQuestionArray, constrainedQuestionArray] = await Promise.all(promises);
                    survey.freestyle_questions = [];
                    const freeStyleQuestions = queryConvert(freeStyleQuestionArray);
                    for (const i of freeStyleQuestions) {
                        survey.freestyle_questions.push(i);
                    }

                    survey.constrained_questions = [];
                    const constrainedQuestions = queryConvert(constrainedQuestionArray);
                    for (const i of constrainedQuestions) {
                        i.options = queryConvert(await constrainedQuestionOptionDB.getOptionsOfQuestion(i.id));
                        survey.constrained_questions.push(i);
                    }
                    return res.status(200).send(survey);
                }
                return res.sendStatus(403);
            }
        } catch (e) {
            log.error(e.message);
            return Exception(500, "An unexpected error happened. Please try again.", e.message).send(res);
        }
    }

    async createSurvey(req, res) {
        httpContext.set("method", "createSurvey");
        const userId = req.user.id;
        const {title, description, secured} = req.body;
        const startDate = req.body.start_date ? req.body.start_date : new Date();
        const endDate = req.body.end_date ? req.body.end_date : null;

        try {
            await postgresDB.begin();
            const createdSurvey = await surveyDB.createSurvey(title, description, startDate, endDate, secured, userId);
            const surveyId = createdSurvey.rows[0].id

            const freestyleQuestions = req.body.freestyle_questions;
            for (let i = 0; i < freestyleQuestions.length; i++) {
                const fSQ = freestyleQuestions[i];
                await freestyleQuestionDB.createFreestyleQuestion(fSQ.question_text, fSQ.position, surveyId);
            }

            const constrainedQuestions = req.body.constrained_questions;
            for (let i = 0; i < constrainedQuestions.length; i++) {
                const constrainedQuestion = constrainedQuestions[i];
                const createdQuestion = await constrainedQuestionDB.createConstrainedQuestion(constrainedQuestion.question_text, constrainedQuestion.position, surveyId);
                const questionId = createdQuestion.rows[0].id

                const questionOptions = constrainedQuestion.options;
                for (let j = 0; j < questionOptions.length; j++) {
                    const option = questionOptions[j];
                    await constrainedQuestionOptionDB.createConstrainedQuestionOption(option.answer, option.position, questionId);
                }
            }

            await postgresDB.commit();
            return res.status(201).send(await this.getSurvey(surveyId));
        } catch (e) {
            log.error(e);
            postgresDB.rollback();
            return Exception(500, "An unexpected error happened. Please try again.", e.message).send(res);
        }
    }

    async searchPublicSurveys(req, res) {
        httpContext.set("method", "searchPublicSurveys");
        log.debug("search public surveys");
        const title = req.query.title ? req.query.title : null;
        const page_number = req.query.page_number ? req.query.page_number : 0;
        const page_size = req.query.page_size ? req.query.page_size : 5;
        const start_date = req.query.start_date ? req.query.start_date : null;
        const end_date = req.query.end_date ? req.query.end_date : null;
        const description = req.query.description ? req.query.description : null;
        const user_id = req.query.user_id ? req.query.user_id : null;

        const publicSurveyIds = queryConvert(await surveyDB.searchPublicSurveys(user_id, title, description, start_date, end_date, page_number, page_size));
        const promises = [];
        for (const i of publicSurveyIds) {
            promises.push(this.getSurvey(i.id));
        }
        const ret = await Promise.all(promises);
        return res.status(200).json(ret)
    }

    async countPublicSurveys(req, res) {
        httpContext.set("method", "countPublicSurveys");
        log.debug("Count public surveys");
        const title = req.query.title ? req.query.title : null;
        const end_date = req.query.end_date ? req.query.end_date : null;
        const start_date = req.query.start_date ? req.query.start_date : null;
        const description = req.query.description ? req.query.description : null;
        const user_id = req.query.user_id ? req.query.user_id : null;

        const result = await surveyDB.countPublicSurveys(user_id, title, description, start_date, end_date);
        return res.status(200).json(queryConvert(result)[0])
    }

    async searchSecuredSurveys(req, res) {
        httpContext.set("method", "searchSecuredSurveys");
        const title = req.query.title ? req.query.title : null;
        const page_number = req.query.page_number ? req.query.page_number : 0;
        const page_size = req.query.page_size ? req.query.page_size : 5;
        const start_date = req.query.start_date ? req.query.start_date : null;
        const end_date = req.query.end_date ? req.query.end_date : null;
        const description = req.query.description ? req.query.description : null;

        const result = queryConvert(await surveyDB.searchSecuredSurveys(title, description, start_date, end_date, page_number, page_size, req.user.id));
        const ret = [];

        // Collecting promises
        for (const i of result) {
            ret.push(this.getSurvey(i.id));
        }

        // Resolve the promises and return
        return res.status(200).json(await Promise.all(ret))
    }

    async countSecuredSurveys(req, res) {
        httpContext.set("method", "countSecuredSurveys");
        const title = req.query.title ? req.query.title : null;
        const end_date = req.query.end_date ? req.query.end_date : null;
        const start_date = req.query.start_date ? req.query.start_date : null;
        const description = req.query.description ? req.query.description : null;

        const result = await surveyDB.countSecuredSurveys(title, description, start_date, end_date, req.user.id);
        return res.status(200).json(queryConvert(result)[0])
    }
}

const surveyService = new SurveyService();
module.exports = surveyService;