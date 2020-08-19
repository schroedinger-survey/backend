const express = require("express");

const surveyRouter = express.Router();

surveyRouter.post("/");
surveyRouter.get("/public");
surveyRouter.get("/public/:survey_id");
surveyRouter.get("/public/count");
surveyRouter.get("/secured");
surveyRouter.get("/secured/:survey_id");
surveyRouter.get("/secured/count");

module.exports = surveyRouter;