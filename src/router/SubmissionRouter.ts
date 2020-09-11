import validators from "../utils/Validators";
import authorizationMiddleware from "../middleware/AuthorizationMiddleware";
import submissionService from "../service/SubmissionService";

const express = require("express");


const submissionRouter = express.Router();

submissionRouter.post("/", validators.createSubmissionValidationRules, validators.validate, authorizationMiddleware.securedCreatingSubmission, submissionService.createSubmission);
submissionRouter.get("/", validators.getSubmissionValidationRules, validators.validate, authorizationMiddleware.securedPath, submissionService.getSubmissions);
submissionRouter.get("/count", validators.getSubmissionValidationRules, validators.validate, authorizationMiddleware.securedPath, submissionService.countSubmissions);
submissionRouter.get("/:submission_id", authorizationMiddleware.securedPath, submissionService.getSubmissionById);


export default submissionRouter;