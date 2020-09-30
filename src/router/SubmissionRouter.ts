import validators from "../utils/Validators";
import authorization from "../middleware/Authorization";
import submissionService from "../service/SubmissionService";

const express = require("express");


const submissionRouter = express.Router();

submissionRouter.post("/",
    validators.submissionCreateValidationRules,
    validators.validate,
    authorization.securedCreatingSubmission,
    submissionService.createSubmission);

submissionRouter.get("/",
    validators.submissionGetValidationRules,
    validators.validate,
    authorization.securedPath,
    submissionService.getSubmissions);

submissionRouter.get("/count",
    validators.submissionGetValidationRules,
    validators.validate,
    authorization.securedPath,
    submissionService.countSubmissions);

submissionRouter.get("/:submission_id",
    authorization.securedPath,
    submissionService.getSubmissionById);


export default submissionRouter;