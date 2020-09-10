const {body, validationResult, query} = require("express-validator");


/**
 * PUT /user
 */
const userChangeInformationValidationRules = [
    body("old_password").exists()
];

/**
 * POST /user
 */
const userRegisterValidationRules = [
    body("username").exists(),
    body("password").exists(),
    body("email").exists().isEmail()
];

/**
 * DELETE /user
 */
const userDeleteValidationRules = [
    body("password").exists()
];

/**
 * POST /user/login
 */
const userLoginValidationRules = [
    body("username").exists(),
    body("password").exists()
];

/**
 * POST /user/password/reset
 */
const userResetForgottenPasswordValidationRules = [
    body("reset_password_token").exists(),
    body("new_password").exists()
];

/**
 * POST /survey
 */
const createSurveyValidationRules = [
    body("title").exists(),
    body("description").exists(),
    body("secured").exists().isBoolean(),
    body("constrained_questions").exists().isArray(),
    body("constrained_questions.*.question_text").exists(),
    body("constrained_questions.*.position").exists(),
    body("constrained_questions.*.options").exists(),
    body("constrained_questions.*.options.*.answer").exists(),
    body("constrained_questions.*.options.*.position").exists().isNumeric(),
    body("freestyle_questions").exists().isArray(),
    body("freestyle_questions.*.question_text").exists(),
    body("freestyle_questions.*.position").exists().isNumeric()
];

/**
 * GET /token
 */
const retrieveTokensValidationRules = [
    query("survey_id").exists()
];

/**
 * POST /token
 */
const createTokenValidationRules = [
    body("amount").exists().isNumeric(),
    body("survey_id").exists()
];

/**
 * POST /token/email
 */
const createTokenAndSendEmailValidationRules = [
    body("survey_id").exists(),
    body("emails").exists().isArray(),
    body("emails.*").exists().isEmail()
];

/**
 * POST /submission
 */
const createSubmissionValidationRules = [
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
const getSubmissionValidationRules = [
    query("survey_id").exists()
];

/**
 * Copy pasted from https://dev.to/nedsoft/a-clean-approach-to-using-express-validator-8go
 */
const validate = (req, res, next) => {
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

module.exports = {
    retrieveTokensValidationRules,
    userResetForgottenPasswordValidationRules,
    createSubmissionValidationRules,
    userDeleteValidationRules,
    userRegisterValidationRules,
    userLoginValidationRules,
    createSurveyValidationRules,
    createTokenValidationRules,
    createTokenAndSendEmailValidationRules,
    getSubmissionValidationRules,
    userChangeInformationValidationRules,
    validate
}