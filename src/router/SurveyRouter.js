const express = require("express");
const securedPath = require("../middleware/AuthorizationMiddleware");
const surveyService = require("../service/SurveyService");
const {createSurveyValidationRules, validate} = require("../utils/Validators");


const surveyRouter = express.Router();

surveyRouter.post("/", securedPath, createSurveyValidationRules, validate, surveyService.createSurvey);
surveyRouter.get("/public", surveyService.searchPublicSurveys);
surveyRouter.get("/public/count", surveyService.countPublicSurveys);
surveyRouter.get("/secured", securedPath, surveyService.searchSecuredSurveys);
surveyRouter.get("/secured/count", securedPath, surveyService.countSecuredSurveys);

module.exports = surveyRouter;
