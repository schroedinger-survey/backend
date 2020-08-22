const express = require("express");
const surveyService = require("../service/SurveyService");
const {createSubmissionValidationRules} = require("../utils/Validators");
const {validate} = require("../utils/Validators");


const submissionRouter = express.Router();

submissionRouter.post("/", createSubmissionValidationRules, validate, surveyService.createSurvey);

module.exports = submissionRouter;