import DebugLogger from "../utils/Logger";
import exception from "../utils/Exception";

const axios = require("axios");
const RECAPTCHA_TOKEN = process.env.RECAPTCHA_TOKEN;
const log = DebugLogger("src/middleware/RecaptchaMiddleware.js");

const recaptchaPath = async (req, res, next) => {
    const clientRecaptchaToken = req.query.recaptcha;
    if (clientRecaptchaToken) {
        try {
            const data = await axios.post(`https://www.google.com/recaptcha/api/siteverify?secret=${RECAPTCHA_TOKEN}&response=${clientRecaptchaToken}`);
            if (data.success === true) {
                log.warn("Recaptcha token verification successful.");
                return next();
            }
            return exception(res, 400, "Recaptcha verification not successed.", data);
        } catch (e) {
            log.error(e.message);
            return exception(res, 500, "An unexpected error happened. Please try again.", e.message);
        }
    } else {
        log.warn("Trying to access recaptcha protected API without a recaptcha token");
        return exception(res, 403, "Recaptcha token missing. Please try again.");
    }
}

export default recaptchaPath;