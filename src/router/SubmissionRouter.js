const express = require("express");
const submissionService = require("../service/SubmissionService");
const {securedOrOneTimePassPath} = require("../middleware/AuthorizationMiddleware");
const {optionalSecuredPath} = require("../middleware/AuthorizationMiddleware");
const {createSubmissionValidationRules} = require("../utils/Validators");
const {validate} = require("../utils/Validators");


const submissionRouter = express.Router();

submissionRouter.post("/", createSubmissionValidationRules, validate, optionalSecuredPath, securedOrOneTimePassPath, submissionService.createSubmission);

module.exports = submissionRouter;