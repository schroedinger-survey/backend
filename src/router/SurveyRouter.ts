import authorization from "../security/Authorization";
import validators from "../utils/Validators";
import surveyService from "../service/SurveyService";
import {Router} from "express";

const surveyRouter = Router();

surveyRouter.post("/",
    authorization.securedPath,
    validators.surveyCreateValidationRules,
    validators.validate,
    surveyService.createSurvey);

surveyRouter.delete("/:survey_id",
    authorization.securedPath,
    surveyService.deleteSurvey);

surveyRouter.put("/:survey_id",
    authorization.securedPath,
    validators.surveyUpdateValidationRules,
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

surveyRouter.get("/secured/:survey_id",
    authorization.securedOrOneTimePassPath,
    surveyService.retrievePrivateSurvey);

surveyRouter.get("/all",
    authorization.securedPath,
    surveyService.searchAllSurveys);

surveyRouter.get("/all/count",
    authorization.securedPath,
    surveyService.countAllSurveys);

export default surveyRouter;
