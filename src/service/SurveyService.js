const httpContext = require("express-http-context");
const postgresDB = require("../drivers/PostgresDB");
const surveyDB = require("../db/SurveyDB");
const freestyleQuestionDB = require("../db/FreestyleQuestionDB");
const constrainedQuestionDB = require("../db/ConstrainedQuestionDB");
const constrainedQuestionOptionDB = require("../db/ConstrainedQuestionOptionDB");
const queryConvert = require("../utils/QueryConverter");
const exception = require("../utils/Exception");
const submissionDB = require("../db/SubmissionDB");
const {DebugLogger} = require("../utils/Logger");

const log = DebugLogger("src/service/SurveyService.js");

class SurveyService {
    constructor() {
        this.updateSurvey = this.updateSurvey.bind(this);
        this.deleteSurvey = this.deleteSurvey.bind(this);
        this.getSurvey = this.getSurvey.bind(this);
        this.createSurvey = this.createSurvey.bind(this);
        this.searchPublicSurveys = this.searchPublicSurveys.bind(this);
        this.countPublicSurveys = this.countPublicSurveys.bind(this);
        this.searchSecuredSurveys = this.searchSecuredSurveys.bind(this);
        this.countSecuredSurveys = this.countSecuredSurveys.bind(this);
        this.retrievePublicSurvey = this.retrievePublicSurvey.bind(this);
        this.retrievePrivateSurvey = this.retrievePrivateSurvey.bind(this);
    }

    async updateSurvey(req, res) {
        httpContext.set("method", "updateSurvey");
        const user_id = req.user.id;
        const survey_id = req.params.survey_id;
        try {
            await postgresDB.begin();
            const query = queryConvert((await surveyDB.getSurveyByIdAndUserId(survey_id, user_id)));
            if (query.length !== 1) {
                return exception(404, "Survey not found.", "Can not find the survey in database.", res);
            }
            const survey = query[0];
            const countQuery = queryConvert((await submissionDB.countSubmissions(user_id, survey_id)));
            if (countQuery.length !== 1) {
                await postgresDB.rollback();
                return exception(res, 404, "Survey not found.", "Can find how many submissions the survey has.");
            }
            const count = countQuery[0].count;
            if (count > 0) {
                await postgresDB.rollback();
                return exception(res, 400, "Change is not possible.", `The survey has already ${count} submissions.`);
            }

            const new_title = req.body.title ? req.body.title : survey.title;
            const new_description = req.body.description ? req.body.description : survey.description;
            const new_start_date = req.body.start_date ? req.body.start_date : survey.start_date;
            const new_end_date = req.body.end_date ? req.body.end_date : survey.end_date;
            const new_secured = req.body.secured !== null ? req.body.secured : survey.secured;

            await surveyDB.updateSurvey(survey_id, user_id, new_title, new_description, new_start_date, new_end_date, new_secured);

            const added_freestyle_questions = req.body.added_freestyle_questions;
            for (const question of added_freestyle_questions) {
                await freestyleQuestionDB.createFreestyleQuestion(question.question_text, question.position, survey_id);
            }

            const added_constrained_questions = req.body.added_constrained_questions;
            for (const question of added_constrained_questions) {
                const createdQuestion = await constrainedQuestionDB.createConstrainedQuestion(question.question_text, question.position, survey_id);
                const questionId = createdQuestion.rows[0].id

                for (const option of question.options) {
                    await constrainedQuestionOptionDB.createConstrainedQuestionOption(option.answer, option.position, questionId);
                }
            }

            const deleted_freestyle_questions = req.body.deleted_freestyle_questions;
            for (const question of deleted_freestyle_questions) {
                await freestyleQuestionDB.deleteFreestyleQuestion(question.question_id);
            }

            const deleted_constrained_questions = req.body.deleted_constrained_questions;
            for (const question of deleted_constrained_questions) {
                await constrainedQuestionDB.deleteConstrainedQuestion(question.question_id);
            }

            await postgresDB.commit();
            return res.sendStatus(204);
        } catch (e) {
            await postgresDB.rollback();
            log.error(e.message);
            return exception(res, 500, "An unexpected error happened. Please try again.", e.message);
        }
    }

    async deleteSurvey(req, res) {
        httpContext.set("method", "deleteSurvey");
        const user_id = req.user.id;
        const survey_id = req.params.survey_id;
        log.warn(`User with ID ${user_id} wants to delete survey ${survey_id}`);
        try {
            await surveyDB.deleteSurvey(survey_id, user_id);
            return res.sendStatus(204);
        } catch (e) {
            log.error(e.message);
            return exception(res, 500, "An unexpected error happened. Please try again.", e.message);
        }
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
                        return exception(res, 403, "User is not owner of survey");
                    }
                } else if (req.token) {
                    if (req.token.survey_id !== survey.id) {
                        return exception(res, 403, "Token does not belong to survey");
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
            return exception(res, 404, "Survey not found.");
        } catch (e) {
            log.error(e.message);
            return exception(res, 500, "An unexpected error happened. Please try again.", e.message);
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
                return exception(res, 403, "No access to secured survey.");
            }
            return exception(res, 404, "Survey not found.");
        } catch (e) {
            log.error(e.message);
            return exception(res,500, "An unexpected error happened. Please try again.", e.message);
        }
    }

    async createSurvey(req, res) {
        httpContext.set("method", "createSurvey");
        const userId = req.user.id;
        const {title, description, secured} = req.body;
        const startDate = req.body.start_date ? req.body.start_date : new Date();
        const endDate = req.body.end_date ? req.body.end_date : null;
        if(req.body.freestyle_questions.length + req.body.constrained_questions.length === 0){
            return exception(res, 400, "Please provide at least one question.", null);
        }

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
            return exception(res, 500, "An unexpected error happened. Please try again.", e.message);
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