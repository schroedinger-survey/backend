const express = require("express");
const {securedPath, securedOrOneTimePassPath} = require("../middleware/AuthorizationMiddleware");
const surveyService = require("../service/SurveyService");
const {updateSurveyValidationRules} = require("../utils/Validators");
const {createSurveyValidationRules, validate} = require("../utils/Validators");

const surveyRouter = express.Router();

surveyRouter.post("/", securedPath, createSurveyValidationRules, validate, surveyService.createSurvey);
surveyRouter.delete("/:survey_id", securedPath, surveyService.deleteSurvey);
surveyRouter.put("/:survey_id", securedPath, updateSurveyValidationRules, validate, surveyService.updateSurvey);

surveyRouter.get("/public", surveyService.searchPublicSurveys);
surveyRouter.get("/public/count", surveyService.countPublicSurveys);
surveyRouter.get("/public/:survey_id", surveyService.retrievePublicSurvey);

surveyRouter.get("/secured", securedPath, surveyService.searchSecuredSurveys);
surveyRouter.get("/secured/count", securedPath, surveyService.countSecuredSurveys);
surveyRouter.get("/secured/:survey_id", securedOrOneTimePassPath, surveyService.retrievePrivateSurvey);

module.exports = surveyRouter;
