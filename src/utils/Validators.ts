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
        body("old_password").exists().isString().isLength({min: 1})
    ];

    /**
     * POST /user
     */
    userRegisterValidationRules = [
        body("username").exists().isString().isLength({min: 1}),
        body("password").exists().isString().isLength({min: 6}),
        body("email").exists().isEmail()
    ];

    /**
     * DELETE /user
     */
    userDeleteValidationRules = [
        body("password").exists().isString().isLength({min: 1})
    ];

    /**
     * POST /user/login
     */
    userLoginValidationRules = [
        body("username").exists().isString().isLength({min: 1}),
        body("password").exists().isString().isLength({min: 1})
    ];

    /**
     * POST /user/password/reset
     */
    userResetForgottenPasswordValidationRules = [
        body("reset_password_token").exists().isString().isLength({min: 1}),
        body("new_password").exists().isString().isLength({min: 6})
    ];

    /**
     * POST /survey
     */
    surveyCreateValidationRules = [
        body("title").exists().isString().isLength({min: 1}),
        body("description").exists().isString().isLength({min: 1}),
        body("secured").exists().isBoolean(),
        body("start_date").optional().isNumeric(),
        body("end_date").optional().isNumeric(),
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
        body("title").optional().isString().isLength({min: 1}),
        body("description").optional().isString().isLength({min: 1}),
        body("secured").optional().isBoolean(),
        body("start_date").optional().isNumeric(),
        body("end_date").optional().isNumeric(),
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
        query("survey_id").exists()
    ];

    /**
     * POST /token
     */
    tokenCreateValidationRules = [
        body("amount").exists().isNumeric(),
        body("survey_id").exists()
    ];

    /**
     * POST /token/email
     */
    tokenCreateAndSendEmailValidationRules = [
        body("survey_id").exists(),
        body("emails").exists().isArray(),
        body("emails.*").exists().isEmail()
    ];

    /**
     * POST /submission
     */
    submissionCreateValidationRules = [
        body("survey_id").exists(),
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
        query("survey_id").exists()
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