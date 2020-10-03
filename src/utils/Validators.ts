const {body, validationResult, query} = require("express-validator");

import { Request, Response, NextFunction} from 'express';
/**
 * Get started at https://express-validator.github.io/docs/
 */
class Validators {
    /**
     * PUT /user
     */
    userChangeInformationValidationRules = [
        body("old_password").exists().isString().isLength({min: 1}).withMessage("Current password must be specified to change user's information.")
    ];

    /**
     * POST /user
     */
    userRegisterValidationRules = [
        body("username").exists().isString().isLength({min: 1}).withMessage("A valid user name must be specified for registration."),
        body("password").exists().isString().isLength({min: 6}).withMessage("A valid password with minimal 6 characters must be specified for registration."),
        body("email").exists().isEmail().withMessage("A valid email must be specified for registration.")
    ];

    /**
     * DELETE /user
     */
    userDeleteValidationRules = [
        body("password").exists().isString().isLength({min: 1}).withMessage("To delete the account, the current password must be specified.")
    ];

    /**
     * POST /user/login
     */
    userLoginValidationRules = [
        body("username").exists().isString().isLength({min: 1}).withMessage("Specify username to login."),
        body("password").exists().isString().isLength({min: 1}).withMessage("Specify password to login.")
    ];

    /**
     * POST /user/password/reset
     */
    userResetForgottenPasswordValidationRules = [
        body("reset_password_token").exists().isString().isLength({min: 1}).withMessage("The reset password token can not found specified."),
        body("new_password").exists().isString().isLength({min: 6}).withMessage("The new password must be at least 6 char")
    ];

    /**
     * POST /survey
     */
    surveyCreateValidationRules = [
        body("title").exists().isString().isLength({min: 1}).withMessage("Please specify the title of the survey."),
        body("description").exists().isString().isLength({min: 1}).withMessage("Please specify the description of the survey."),
        body("secured").exists().isBoolean().withMessage("Please specify if the survey can be seen by everybody"),
        body("start_date").optional().isNumeric().withMessage("Please specify the start date and time of the survey"),
        body("end_date").optional().isNumeric().withMessage("Please specify the end date and time of the survey"),
        body("constrained_questions").exists().isArray(),
        body("constrained_questions.*.question_text").exists().isString().isLength({min: 1}),
        body("constrained_questions.*.position").exists().isNumeric(),
        body("constrained_questions.*.options").exists().isArray().isLength({min: 2}),
        body("constrained_questions.*.options.*.answer").exists().isString().isLength({min: 1}),
        body("constrained_questions.*.options.*.position").exists().isNumeric(),
        body("freestyle_questions").exists().isArray(),
        body("freestyle_questions.*.question_text").exists().isString().isLength({min: 1}),
        body("freestyle_questions.*.position").exists().isNumeric()
    ];

    /**
     * PUT /survey
     */
    surveyUpdateValidationRules = [
        body("title").optional().isString().isLength({min: 1}).withMessage("Please specify the title of the survey."),
        body("description").optional().isString().isLength({min: 1}).withMessage("Please specify the description of the survey."),
        body("secured").optional().isBoolean().withMessage("Please specify if the survey can be seen by everybody"),
        body("start_date").optional().isNumeric().withMessage("Please specify the start date and time of the survey"),
        body("end_date").optional().isNumeric().withMessage("Please specify the end date and time of the survey"),
        body("added_constrained_questions").exists().isArray(),
        body("added_constrained_questions.*.question_text").exists(),
        body("added_constrained_questions.*.position").exists(),
        body("added_constrained_questions.*.options").exists().isArray(),
        body("added_constrained_questions.*.options.*.answer").exists(),
        body("added_constrained_questions.*.options.*.position").exists().isNumeric(),
        body("added_freestyle_questions").exists().isArray(),
        body("added_freestyle_questions.*.question_text").exists(),
        body("added_freestyle_questions.*.position").exists().isNumeric(),
        body("deleted_constrained_questions").exists().isArray(),
        body("deleted_constrained_questions.*.question_id").exists(),
        body("deleted_freestyle_questions").exists().isArray(),
        body("deleted_freestyle_questions.*.question_id").exists()
    ];

    /**
     * GET /token
     */
    tokenRetrieveValidationRules = [
        query("survey_id").exists().withMessage("Please specify the ID of the targeted survey.")
    ];

    /**
     * POST /token
     */
    tokenCreateValidationRules = [
        body("amount").exists().isNumeric().withMessage("Please specify how many tokens you can to create."),
        body("survey_id").exists().withMessage("Please specify the ID of the targeted survey.")
    ];

    /**
     * POST /token/email
     */
    tokenCreateAndSendEmailValidationRules = [
        body("survey_id").exists().withMessage("Please specify the ID of the targeted survey."),
        body("emails").exists().isArray().isLength({max: 100}).withMessage("Please specify the emails. Maximal 100 emails batch sending are allowed."),
        body("emails.*").exists().isEmail()
    ];

    /**
     * POST /submission
     */
    submissionCreateValidationRules = [
        body("survey_id").exists().withMessage("Please specify the ID of the targeted survey."),
        body("constrained_answers").exists().isArray(),
        body("freestyle_answers").exists().isArray(),
        body("constrained_answers.*.constrained_question_id").exists(),
        body("constrained_answers.*.constrained_questions_option_id").exists(),
        body("freestyle_answers.*.freestyle_question_id").exists(),
        body("freestyle_answers.*.answer").exists()
    ];

    /**
     * GET /submission
     */
    submissionGetValidationRules = [
        query("survey_id").exists().withMessage("Please specify the ID of the targeted survey.")
    ];

    /**
     * Copy pasted from https://dev.to/nedsoft/a-clean-approach-to-using-express-validator-8go
     */
    validate = (req: Request, res: Response, next: NextFunction) => {
        const errors = validationResult(req)
        if (errors.isEmpty()) {
            return next()
        }
        const extractedErrors = []
        errors.array().map(err => extractedErrors.push({[err.param]: err.msg}))

        return res.status(422).json({
            errors: extractedErrors
        })
    }

}
const validators = new Validators();
export default validators;