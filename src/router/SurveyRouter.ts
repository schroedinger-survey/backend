
import authorization from "../middleware/Authorization";
import validators from "../utils/Validators";
import surveyService from "../service/SurveyService";

const express = require("express");

const surveyRouter = express.Router();

surveyRouter.post("/",
    authorization.securedPath,
    validators.createSurveyValidationRules,
    validators.validate,
    surveyService.createSurvey);

surveyRouter.delete("/:survey_id",
    authorization.securedPath,
    surveyService.deleteSurvey);

surveyRouter.put("/:survey_id",
    authorization.securedPath,
    validators.updateSurveyValidationRules,
    validators.validate,
    surveyService.updateSurvey);

surveyRouter.get("/public",
    surveyService.searchPublicSurveys);

surveyRouter.get("/public/count",
    surveyService.countPublicSurveys);

surveyRouter.get("/public/:survey_id",
    surveyService.retrievePublicSurvey);

surveyRouter.get("/secured",
    authorization.securedPath,
    surveyService.searchSecuredSurveys);

surveyRouter.get("/secured/count",
    authorization.securedPath,
    surveyService.countSecuredSurveys);
surveyRouter.get("/secured/:survey_id", authorization.securedOrOneTimePassPath, surveyService.retrievePrivateSurvey);

export default surveyRouter;
