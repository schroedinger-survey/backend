const axios = require("axios");
const Exception = require("../utils/Exception");
const RECAPTCHA_TOKEN = process.env.RECAPTCHA_TOKEN;
const {DebugLogger} = require("../utils/Logger");
const log = DebugLogger("src/middleware/RecaptchaMiddleware.js");

const recaptchaPath = async (req, res, next) => {
    const token = req.query.recaptcha;
    if (token) {
        try {
            const data = await axios.post(`https://www.google.com/recaptcha/api/siteverify?secret=${RECAPTCHA_TOKEN}&response=${token}`);
            if (data.success === true) {
                log.warn("Recaptcha token verification successful.");
                next();
            } else {
                return Exception(400, "Recaptcha verification not successed.", data).send(res);
            }
        } catch (e) {
            log.error(e.message);
            return Exception(500, "An unexpected error happened. Please try again.", e.message).send(res);
        }
    } else {
        log.warn("Trying to access recaptcha protected API without a recaptcha token");
        return Exception(403, "Recaptcha token missing. Please try again.").send(res);
    }
}

module.exports = recaptchaPath;