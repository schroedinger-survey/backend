const express = require("express");
const securedPath = require("../middleware/AuthorizationMiddleware");
const surveyService = require("../service/SurveyService");
const {createSurveyValidationRules} = require("../utils/Validators");


const surveyRouter = express.Router();

surveyRouter.get("/", securedPath, createSurveyValidationRules, validate, surveyService.createSurvey);

module.exports = surveyRouter;
