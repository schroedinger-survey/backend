import postgresDB from "../drivers/PostgresDB";
import exception from "../utils/Exception";
import surveyDB from "../db/sql/SurveyDB";
import submissionDB from "../db/sql/SubmissionDB";
import freestyleQuestionDB from "../db/sql/FreestyleQuestionDB";
import constrainedQuestionDB from "../db/sql/ConstrainedQuestionDB";
import constrainedQuestionOptionDB from "../db/sql/ConstrainedQuestionOptionDB";
import loggerFactory from "../utils/Logger";

const httpContext = require("express-http-context");

const log = loggerFactory.buildDebugLogger("src/service/SurveyService.js");

class SurveyService {
    updateSurvey = async (req, res) => {
        httpContext.set("method", "updateSurvey");
        const user_id = req.schroedinger.user.id;
        const survey_id = req.params.survey_id;
        try {
            await postgresDB.begin("REPEATABLE READ");
            const query = await surveyDB.getSurveyByIdAndUserId(survey_id, user_id);
            if (query.length !== 1) {
                return exception(res, 404, "Survey not found.", "Can not find the survey in database.");
            }
            const survey = query[0];
            const countQuery = await submissionDB.countSubmissions(user_id, survey_id);
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

            for (const question of req.body.added_constrained_questions) {
                const createdQuestion = await constrainedQuestionDB.createConstrainedQuestion(question.question_text, question.position, survey_id);
                const questionId = createdQuestion[0].id

                for (const option of question.options) {
                    await constrainedQuestionOptionDB.createConstrainedQuestionOption(option.answer, option.position, questionId);
                }
            }

            for (const question of req.body.deleted_freestyle_questions) {
                await freestyleQuestionDB.deleteFreestyleQuestion(question.question_id);
            }

            for (const question of req.body.deleted_constrained_questions) {
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

    deleteSurvey = async (req, res) => {
        httpContext.set("method", "deleteSurvey");
        const user_id = req.schroedinger.user.id;
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

    retrievePrivateSurvey = async (req, res) => {
        httpContext.set("method", "retrievePrivateSurvey");
        try {
            const survey_id = req.params.survey_id;
            const surveys = await surveyDB.getSurveyById(survey_id);
            if (surveys.length === 1) {
                const survey = surveys[0];
                if (req.schroedinger.user && survey.user_id !== req.schroedinger.user.id) {
                    return exception(res, 403, "User is not owner of survey");
                } else if (req.schroedinger.token && req.schroedinger.token.survey_id !== survey.id) {
                    return exception(res, 403, "Token does not belong to survey");
                }
                return res.status(200).send(survey);
            }
            return exception(res, 404, "Survey not found.");
        } catch (e) {
            log.error(e.message);
            return exception(res, 500, "An unexpected error happened. Please try again.", e.message);
        }
    }

    retrievePublicSurvey = async (req, res) => {
        httpContext.set("method", "retrievePublicSurvey");
        try {
            const survey_id = req.params.survey_id;
            const surveys = await surveyDB.getSurveyById(survey_id);
            if (surveys.length === 1) {
                const survey = surveys[0];
                if (survey.secured === false) {
                    return res.status(200).send(survey);
                }
                return exception(res, 403, "No access to secured survey.");
            }
            return exception(res, 404, "Survey not found.");
        } catch (e) {
            log.error(e.message);
            return exception(res, 500, "An unexpected error happened. Please try again.", e.message);
        }
    }

    createSurvey = async (req, res) => {
        httpContext.set("method", "createSurvey");
        const userId = req.schroedinger.user.id;
        const {title, description, secured} = req.body;
        const startDate = req.body.start_date ? req.body.start_date : new Date();
        const endDate = req.body.end_date ? req.body.end_date : null;
        if (req.body.freestyle_questions.length + req.body.constrained_questions.length === 0) {
            return exception(res, 400, "Please provide at least one question.", null);
        }

        try {
            await postgresDB.begin();
            const createdSurvey = await surveyDB.createSurvey(title, description, startDate, endDate, secured, userId);
            const surveyId = createdSurvey[0].id

            for(const question of req.body.freestyle_questions){
                await freestyleQuestionDB.createFreestyleQuestion(question.question_text, question.position, surveyId);
            }

            for (const question of req.body.constrained_questions) {
                const createdQuestion = await constrainedQuestionDB.createConstrainedQuestion(question.question_text, question.position, surveyId);
                const questionId = createdQuestion[0].id
                for (const option of question.options) {
                    await constrainedQuestionOptionDB.createConstrainedQuestionOption(option.answer, option.position, questionId);
                }
            }

            const retrieved = await surveyDB.getSurveyById(surveyId);
            if (retrieved.length === 1) {
                await postgresDB.commit();
                return res.status(201).send(retrieved[0]);
            }
            postgresDB.rollback();
            return exception(res, 500, "An unexpected error happened. Please try again.");
        } catch (e) {
            log.error(e);
            postgresDB.rollback();
            return exception(res, 500, "An unexpected error happened. Please try again.", e.message);
        }
    }

    searchPublicSurveys = async (req, res) => {
        httpContext.set("method", "searchPublicSurveys");
        log.debug("search public surveys");
        const title = req.query.title ? req.query.title : null;
        const page_number = req.query.page_number ? req.query.page_number : 0;
        const page_size = req.query.page_size ? req.query.page_size : 5;
        const start_date = req.query.start_date ? req.query.start_date : null;
        const end_date = req.query.end_date ? req.query.end_date : null;
        const description = req.query.description ? req.query.description : null;
        const user_id = req.query.user_id ? req.query.user_id : null;

        try {
            const ret = await surveyDB.searchSurveys(user_id, title, description, false, start_date, end_date, page_number, page_size);
            return res.status(200).json(ret);
        } catch (e) {
            log.error(e);
            return exception(res, 500, "An unexpected error happened. Please try again.", e.message);
        }
    }

    countPublicSurveys = async (req, res) => {
        httpContext.set("method", "countPublicSurveys");
        log.debug("Count public surveys");
        const title = req.query.title ? req.query.title : null;
        const end_date = req.query.end_date ? req.query.end_date : null;
        const start_date = req.query.start_date ? req.query.start_date : null;
        const description = req.query.description ? req.query.description : null;
        const user_id = req.query.user_id ? req.query.user_id : null;

        try {
            const result = await surveyDB.countSurveys(user_id, title, description, false, start_date, end_date);
            return res.status(200).json(result[0]);
        } catch (e) {
            log.error(e);
            return exception(res, 500, "An unexpected error happened. Please try again.", e.message);
        }
    }

    searchSecuredSurveys = async (req, res) => {
        httpContext.set("method", "searchSecuredSurveys");
        const title = req.query.title ? req.query.title : null;
        const page_number = req.query.page_number ? req.query.page_number : 0;
        const page_size = req.query.page_size ? req.query.page_size : 5;
        const start_date = req.query.start_date ? req.query.start_date : null;
        const end_date = req.query.end_date ? req.query.end_date : null;
        const description = req.query.description ? req.query.description : null;
        const user_id = req.schroedinger.user.id;

        try {
            const ret = await surveyDB.searchSurveys(user_id, title, description, true, start_date, end_date, page_number, page_size);
            return res.status(200).json(ret);
        } catch (e) {
            log.error(e);
            return exception(res, 500, "An unexpected error happened. Please try again.", e.message);
        }
    }

    countSecuredSurveys = async (req, res) => {
        httpContext.set("method", "countSecuredSurveys");
        const title = req.query.title ? req.query.title : null;
        const end_date = req.query.end_date ? req.query.end_date : null;
        const start_date = req.query.start_date ? req.query.start_date : null;
        const description = req.query.description ? req.query.description : null;
        const user_id = req.schroedinger.user.id;

        try {
            const result = await surveyDB.countSurveys(user_id, title, description, true, start_date, end_date);
            return res.status(200).json(result[0]);
        } catch (e) {
            log.error(e);
            return exception(res, 500, "An unexpected error happened. Please try again.", e.message);
        }
    }
}

const surveyService = new SurveyService();
export default surveyService;