const {body, validationResult} = require("express-validator");

const userRegisterValidationRules = [
    body("username").exists(),
    body("password").exists(),
    body("email").exists()
];

const userLoginValidationRules = [
    body("username").exists(),
    body("password").exists()
]

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
    validate
}