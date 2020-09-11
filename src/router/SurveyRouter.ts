import authorizationMiddleware from "../middleware/AuthorizationMiddleware";
import validators from "../utils/Validators";
import surveyService from "../service/SurveyService";

const express = require("express");

const surveyRouter = express.Router();

surveyRouter.post("/", authorizationMiddleware.securedPath, validators.createSurveyValidationRules, validators.validate, surveyService.createSurvey);
surveyRouter.delete("/:survey_id", authorizationMiddleware.securedPath, surveyService.deleteSurvey);
surveyRouter.put("/:survey_id", authorizationMiddleware.securedPath, validators.updateSurveyValidationRules, validators.validate, surveyService.updateSurvey);

surveyRouter.get("/public", surveyService.searchPublicSurveys);
surveyRouter.get("/public/count", surveyService.countPublicSurveys);
surveyRouter.get("/public/:survey_id", surveyService.retrievePublicSurvey);

surveyRouter.get("/secured", authorizationMiddleware.securedPath, surveyService.searchSecuredSurveys);
surveyRouter.get("/secured/count", authorizationMiddleware.securedPath, surveyService.countSecuredSurveys);
surveyRouter.get("/secured/:survey_id", authorizationMiddleware.securedOrOneTimePassPath, surveyService.retrievePrivateSurvey);

export default surveyRouter;
