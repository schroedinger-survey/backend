const postgresDB = require("../db/PostgresDB");
const log = require("../utils/Logger");
const surveyDB = require("../db/SurveyDB");
const freestyleQuestionDB = require("../db/FreestyleQuestionDB");
const constrainedQuestionDB = require("../db/ConstrainedQuestionDB");
const constrainedQuestionOptionDB = require("../db/ConstrainedQuestionOptionDB");
const queryConvert = require("../utils/QueryConverter");

class SurveyService {
    constructor() {
        this.getSurvey = this.getSurvey.bind(this);
        this.createSurvey = this.createSurvey.bind(this);
    }

    async getSurvey(id) {
        const promises = [];
        promises.push(surveyDB.getSurvey(id));
        promises.push(freestyleQuestionDB.getQuestionsOfSurvey(id));
        promises.push(constrainedQuestionDB.getQuestionsOfSurvey(id));

        const [surveyArray, freeStyleQuestionArray, constrainedQuestionArray] = await Promise.all(promises);
        if(surveyArray.rows.length === 1) {
            const survey = queryConvert(surveyArray)[0];

            survey.freestyle_questions = [];
            const freeStyleQuestions = queryConvert(freeStyleQuestionArray);
            for(const i of freeStyleQuestions){
                survey.freestyle_questions.push(i);
            }

            survey.constrained_questions = [];
            const constrainedQuestions = queryConvert(constrainedQuestionArray);
            for(const i of constrainedQuestions){
                i.options = queryConvert(await constrainedQuestionOptionDB.getOptionsOfQuestion(i.id));
                for(const j of i.options){
                    j.name = j.answer;
                    delete j.answer;
                }
                i.title = i.question_text;
                delete i.question_text;
                survey.constrained_questions.push(i);
            }
            return survey;
        }
            throw new Error(`Survey with id ${id} could not found`);

    }

    async createSurvey(req, res) {
        const userId = req.user.id;
        const {title, description, secured} = req.body;
        const startDate = req.body.start_date ? req.body.start_date : new Date();
        const endDate = req.body.end_date ? req.body.endDate : null;

        try {
            await postgresDB.begin();
            const createdSurvey = await surveyDB.createSurvey(title, description, startDate, endDate, secured, userId);
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
            return res.status(201).send(await this.getSurvey(surveyId));
        } catch (e) {
            log.error(e);
            postgresDB.rollback();
            return res.status(500).send(e.message);
        }
    }
}

const surveyService = new SurveyService();

module.exports = surveyService;