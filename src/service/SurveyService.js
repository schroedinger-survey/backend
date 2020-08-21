const postgresDB = require("../db/PostgresDB");
const log = require("../utils/Logger");
const surveyDB = require("../db/SurveyDB");
const freestyleQuestionDB = require("../db/FreestyleQuestionDB");
const constrainedQuestionDB = require("../db/ConstrainedQuestionDB");
const constrainedQuestionOptionDB = require("../db/ConstrainedQuestionOptionDB");

class SurveyService {
    async createSurvey(req, res) {
        const userId = req.user.id;
        const {title, description, secured} = req.body;
        const startDate = req.body.start_date ? req.body.start_date : new Date();
        const endDate = req.body.end_date ? req.body.endDate : null;

        try {
            await postgresDB.begin();
            let createdSurvey = await surveyDB.createSurvey(title, description, startDate, endDate, secured, userId);
            const surveyId = createdSurvey.rows[0].id

            const freestyleQuestions = req.body.freestyle_questions;
            for (let i = 0; i < freestyleQuestions.length; i++) {
                const fSQ = freestyleQuestions[i];
                await freestyleQuestionDB.createFreestyleQuestion(fSQ.title, fSQ.position, surveyId);
            }

            const constrainedQuestions = req.body.constrained_questions;
            for (let i = 0; i < constrainedQuestions.length; i++) {
                const constrainedQuestion = constrainedQuestions[i];
                const createdQuestion = await constrainedQuestionDB.createConstrainedQuestion(constrainedQuestion.title, constrainedQuestion.position, surveyId);
                const questionId = createdQuestion.rows[0].id

                const questionOptions = constrainedQuestion.options;
                for (let j = 0; j < questionOptions.length; j++) {
                    const option = questionOptions[j];
                    await constrainedQuestionOptionDB.createConstrainedQuestionOption(option.name, option.position, questionId);
                }
            }
            await postgresDB.commit();
            return res.sendStatus(201);
        } catch (e) {
            log.error(e);
            postgresDB.rollback();
            return res.status(500).send(e.message);
        }
    }
}

const surveyService = new SurveyService();

module.exports = surveyService;