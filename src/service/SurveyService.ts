import postgresDB from "../drivers/PostgresDB";
import surveyDB from "../db/SurveyDB";
import submissionDB from "../db/SubmissionDB";
import freestyleQuestionDB from "../db/FreestyleQuestionDB";
import constrainedQuestionDB from "../db/ConstrainedQuestionDB";
import constrainedQuestionOptionDB from "../db/ConstrainedQuestionOptionDB";
import loggerFactory from "../utils/Logger";
import Context from "../utils/Context";
import {Request, Response} from "express";
import {UnknownError} from "../errors/UnknownError";
import SurveyNotFoundError from "../errors/SurveyNotFoundError";
import SurveyAlreadyHaveSubmissionError from "../errors/SurveyAlreadyHaveSubmissionError";
import NoAccessToSurveyError from "../errors/NoAccessToSurveyError";
import InvalidSurveyError from "../errors/InvalidSurveyError";

const log = loggerFactory.buildDebugLogger("src/service/SurveyService.js");

class SurveyService {
    updateSurvey = async (req: Request, res: Response) => {
        Context.setMethod("updateSurvey");
        const user_id = req["schroedinger"].user.id;
        const survey_id = req.params.survey_id;
        try {
            await postgresDB.begin("REPEATABLE READ");
            const query = await surveyDB.getSurveyByIdAndUserId(survey_id, user_id);
            if (query.length !== 1) {
                return res["schroedinger"].error(new SurveyNotFoundError("Can not find the survey in database.", "Find survey by survey ID and user ID."));
            }
            const survey = query[0];
            const countQuery = await submissionDB.countSubmissions(user_id, survey_id);
            if (countQuery.length !== 1) {
                await postgresDB.rollback();
                return res["schroedinger"].error(new SurveyNotFoundError("Can not find the survey in database.", "Can not find how many submissions the survey has"));
            }
            const count = countQuery[0].count;
            if (count > 0) {
                await postgresDB.rollback();
                return res["schroedinger"].error(new SurveyAlreadyHaveSubmissionError());
            }

            const new_title = req.body.title ? req.body.title : survey.title;
            const new_description = req.body.description ? req.body.description : survey.description;
            const new_start_date = req.body.start_date ? req.body.start_date : new Date(survey.start_date).getTime();
            const new_end_date = req.body.end_date ? req.body.end_date : survey.end_date ? new Date(survey.end_date).getTime() : null;
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
            return res["schroedinger"].error(new UnknownError(e.message, "Update survey"));
        }
    }

    deleteSurvey = async (req: Request, res: Response) => {
        Context.setMethod("deleteSurvey");
        const user_id = req["schroedinger"].user.id;
        const survey_id = req.params.survey_id;
        log.warn(`User with ID ${user_id} wants to delete survey ${survey_id}`);
        try {
            await surveyDB.deleteSurvey(survey_id, user_id);
            return res.sendStatus(204);
        } catch (e) {
            log.error(e.message);
            return res["schroedinger"].error(new UnknownError(e.message, "Delete survey."));
        }
    }

    retrievePrivateSurvey = async (req: Request, res: Response) => {
        Context.setMethod("retrievePrivateSurvey");
        try {
            const survey_id = req.params.survey_id;
            const surveys = await surveyDB.getSurveyById(survey_id);
            if (surveys.length === 1) {
                const survey = surveys[0];
                if (req["schroedinger"].user && survey.user_id !== req["schroedinger"].user.id) {
                    return res["schroedinger"].error(new NoAccessToSurveyError("User is not owner of survey."));
                }
                if (req["schroedinger"].token && req["schroedinger"].token.survey_id !== survey.id) {
                    return res["schroedinger"].error(new NoAccessToSurveyError("Token does not belong to survey."));
                }
                return res.status(200).send(survey);
            }
            return res["schroedinger"].error(new SurveyNotFoundError("Can not find survey in database.", "Retrieving private survey."));
        } catch (e) {
            log.error(e.message);
            return res["schroedinger"].error(new UnknownError(e.message, "Retrieve private survey"));
        }
    }

    retrievePublicSurvey = async (req: Request, res: Response) => {
        Context.setMethod("retrievePublicSurvey");
        try {
            const survey_id = req.params.survey_id;
            const surveys = await surveyDB.getSurveyById(survey_id);
            if (surveys.length === 1) {
                const survey = surveys[0];
                if (survey.secured === false) {
                    return res.status(200).send(survey);
                }
                return res["schroedinger"].error(new NoAccessToSurveyError("No access to secured survey."));
            }
            return res["schroedinger"].error(new SurveyNotFoundError("Can not find survey in database.", "Retrieving public survey."));
        } catch (e) {
            log.error(e.message);
            return res["schroedinger"].error(new UnknownError(e.message, "Retrieve public survey"));
        }
    }

    createSurvey = async (req: Request, res: Response) => {
        Context.setMethod("createSurvey");
        const userId = req["schroedinger"].user.id;
        const {title, description, secured} = req.body;
        const startDate = req.body.start_date ? req.body.start_date : new Date().getTime();
        const endDate = req.body.end_date ? req.body.end_date : null;
        if (req.body.freestyle_questions.length + req.body.constrained_questions.length === 0) {
            return res["schroedinger"].error(new InvalidSurveyError());
        }

        try {
            await postgresDB.begin();
            const createdSurvey = await surveyDB.createSurvey(title, description, startDate, endDate, secured, userId);
            const surveyId = createdSurvey[0].id

            for (const question of req.body.freestyle_questions) {
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
            return res["schroedinger"].error(new UnknownError("An unexpected error happened. Please try again.", "Create survey"));
        } catch (e) {
            log.error(e);
            postgresDB.rollback();
            return res["schroedinger"].error(new UnknownError(e.message, "Create survey"));
        }
    }

    searchPublicSurveys = async (req: Request, res: Response) => {
        Context.setMethod("searchPublicSurveys");
        log.debug("search public surveys");
        const start_date = req.query.start_date ? Number(req.query.start_date) : null;
        const end_date = req.query.end_date ? Number(req.query.end_date) : null;
        const page_size = req.query.page_size ? Number(req.query.page_size) : 5;
        const page_number = req.query.page_number ? Number(req.query.page_number) : 0;
        const description = req.query.description ? req.query.description.toString() : null;
        const user_id = req.query.user_id ? req.query.user_id.toString() : null;
        const title = req.query.title ? req.query.title.toString() : null;

        try {
            const ret = await surveyDB.searchSurveys(user_id, title, description, "false", start_date, end_date, page_number, page_size);
            return res.status(200).json(ret);
        } catch (e) {
            log.error(e);
            return res["schroedinger"].error(new UnknownError(e.message, "Search survey"));
        }
    }

    countPublicSurveys = async (req: Request, res: Response) => {
        Context.setMethod("countPublicSurveys");
        log.debug("Count public surveys");
        const title = req.query.title ? req.query.title.toString() : null;
        const end_date = req.query.end_date ? Number(req.query.end_date) : null;
        const start_date = req.query.start_date ? Number(req.query.start_date) : null;
        const description = req.query.description ? req.query.description.toString() : null;
        const user_id = req.query.user_id ? req.query.user_id.toString() : null;

        try {
            const result = await surveyDB.countSurveys(user_id, title, description, "false", start_date, end_date);
            return res.status(200).json(result[0]);
        } catch (e) {
            log.error(e);
            return res["schroedinger"].error(new UnknownError(e.message, "Count public survey"));
        }
    }

    searchSecuredSurveys = async (req: Request, res: Response) => {
        Context.setMethod("searchSecuredSurveys");
        const title = req.query.title ? req.query.title.toString() : null;
        const page_size = req.query.page_size ? Number(req.query.page_size) : 5;
        const page_number = req.query.page_number ? Number(req.query.page_number) : 0;
        const end_date = req.query.end_date ? Number(req.query.end_date) : null;
        const start_date = req.query.start_date ? Number(req.query.start_date) : null;
        const description = req.query.description ? req.query.description.toString() : null;
        const user_id = req["schroedinger"].user.id.toString();

        try {
            const ret = await surveyDB.searchSurveys(user_id, title, description, "true", start_date, end_date, page_number, page_size);
            return res.status(200).json(ret);
        } catch (e) {
            log.error(e);
            return res["schroedinger"].error(new UnknownError(e.message, "Search secured survey"));
        }
    }

    countSecuredSurveys = async (req: Request, res: Response) => {
        Context.setMethod("countSecuredSurveys");
        const title = req.query.title ? req.query.title.toString() : null;
        const end_date = req.query.end_date ? Number(req.query.end_date) : null;
        const description = req.query.description ? req.query.description.toString() : null;
        const start_date = req.query.start_date ? Number(req.query.start_date) : null;
        const user_id = req["schroedinger"].user.id.toString();

        try {
            const result = await surveyDB.countSurveys(user_id, title, description, "true", start_date, end_date);
            return res.status(200).json(result[0]);
        } catch (e) {
            log.error(e);
            return res["schroedinger"].error(new UnknownError(e.message, "Count secured survey"));
        }
    }

    searchAllSurveys = async (req: Request, res: Response) => {
        Context.setMethod("searchAllSurveys");
        const title = req.query.title ? req.query.title.toString() : null;
        const page_size = req.query.page_size ? Number(req.query.page_size) : 5;
        const page_number = req.query.page_number ? Number(req.query.page_number) : 0;
        const end_date = req.query.end_date ? Number(req.query.end_date) : null;
        const start_date = req.query.start_date ? Number(req.query.start_date) : null;
        const description = req.query.description ? req.query.description.toString() : null;
        const user_id = req["schroedinger"].user.id.toString();

        try {
            const ret = await surveyDB.searchSurveys(user_id, title, description, null, start_date, end_date, page_number, page_size);
            return res.status(200).json(ret);
        } catch (e) {
            log.error(e);
            return res["schroedinger"].error(new UnknownError(e.message, "Search secured survey"));
        }
    }

    countAllSurveys = async (req: Request, res: Response) => {
        Context.setMethod("countAllSurveys");
        const title = req.query.title ? req.query.title.toString() : null;
        const end_date = req.query.end_date ? Number(req.query.end_date) : null;
        const description = req.query.description ? req.query.description.toString() : null;
        const start_date = req.query.start_date ? Number(req.query.start_date) : null;
        const user_id = req["schroedinger"].user.id.toString();

        try {
            const result = await surveyDB.countSurveys(user_id, title, description, null, start_date, end_date);
            return res.status(200).json(result[0]);
        } catch (e) {
            log.error(e);
            return res["schroedinger"].error(new UnknownError(e.message, "Count secured survey"));
        }
    }
}

const surveyService = new SurveyService();
export default surveyService;