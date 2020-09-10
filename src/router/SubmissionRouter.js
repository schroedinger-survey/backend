const express = require("express");
const submissionService = require("../service/SubmissionService");
const {getSubmissionValidationRules} = require("../utils/Validators");
const {securedPath} = require("../middleware/AuthorizationMiddleware");
const {securedCreatingSubmission} = require("../middleware/AuthorizationMiddleware");
const {createSubmissionValidationRules} = require("../utils/Validators");
const {validate} = require("../utils/Validators");


const submissionRouter = express.Router();

submissionRouter.post("/", createSubmissionValidationRules, validate, securedCreatingSubmission, submissionService.createSubmission);
submissionRouter.get("/", getSubmissionValidationRules, validate, securedPath, submissionService.getSubmissions);
submissionRouter.get("/count", getSubmissionValidationRules, validate, securedPath, submissionService.countSubmissions);
submissionRouter.get("/:submission_id", securedPath, submissionService.getSubmissionById);


module.exports = submissionRouter;