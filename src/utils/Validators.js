const {body, validationResult, query} = require("express-validator");

const userRegisterValidationRules = [
    body("username").exists(),
    body("password").exists(),
    body("email").exists().isEmail()
];

const userLoginValidationRules = [
    body("username").exists(),
    body("password").exists()
];

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

const createTokenValidationRules = [
    query("amount").exists().isNumeric(),
    query("survey_id").exists().isNumeric()
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
    userRegisterValidationRules,
    userLoginValidationRules,
    createSurveyValidationRules,
    createTokenValidationRules,
    validate
}