import blackListedJwtDB from "../db/redis/BlackListedJwtDB";
import tokenDB from "../db/sql/TokenDB";
import exception from "../utils/Exception";
import surveyDB from "../db/sql/SurveyDB";
import jsonWebToken from "../utils/JsonWebToken";
import loggerFactory from "../utils/Logger";
import userDB from "../db/sql/UserDB";
import userCache from "../cache/UserCache";

const httpContext = require("express-http-context");
const log = loggerFactory.buildDebugLogger("src/middleware/Authorization.ts");

class Authorization {

    /**
     * Control if the token is valid. A token is valid only if it is still alive and was created after
     * the last time the user changed his/her password and is not on the blacklist.
     *
     * Don't check if JWT has access to resource.
     */
    isJwtTokenValid = async (jwt, req = null, res = null) => {
        if (!jwt) {
            return {valid: false, status: 403, message: "Not Authorized to access this API. JWT-Token needed."}
        }
        const jwtIsBlackListed = await blackListedJwtDB.isBlackListed(jwt);
        if (jwtIsBlackListed === true) {
            return {valid: false, status: 403, message: "Authorization token is not valid any more."}
        }
        let user = null;

        try {
            user = jsonWebToken.verify(jwt);
        } catch (e) {
            log.error(e.message);
            return {valid: false, status: 403, message: "The authorization token is expired."}
        }

        // Check for the last time user changed his password
        let lastPasswordChange;

        // Check for cache hit
        if (req  && req.schroedinger.cache.last_changed_password) {
            lastPasswordChange = req.schroedinger.cache.last_changed_password;
        } else {
            // No cache hit. Has to read the last time user changed his password from database.
            const query = await userDB.getUserById(user.id);
            if(query.length !== 1){
                return {valid: false, status: 404, message: "Can not find the owner of the token in database."};
            }
            const sourceOfTruthUser = query[0];
            lastPasswordChange = Date.parse(sourceOfTruthUser.last_changed_password) / 1000;

            // Set the queried result for cache handler to write into cache
            if(res) {
                res.schroedinger.cache.last_changed_password = {
                    key: user.id,
                    value: lastPasswordChange
                }
            }
        }

        // After resetting password. A small buffer of one second can be tolerated
        // which means every token generated less than one second after the password of the owner was changed will be tolerated
        // this buffer is mainly for unit test which can automate the process very quick and therefore will fail.
        log.debug(`Token was granted at ${user.iat}, last time the password was changed at ${lastPasswordChange}`);
        if (lastPasswordChange - user.iat > 1) {
            return {
                valid: false,
                status: 403,
                message: `Token issued at ${user.iat}, user changed password last time at ${lastPasswordChange}`
            }
        }
        return {valid: true, payload: user};
    }

    /**
     * Check if a participation is still valid. Don't check if participation token belongs to survey.
     */
    isParticipationTokenValid = async (participationToken) => {
        const tokens = await tokenDB.getToken(participationToken);
        if (tokens.length === 0) {
            return {valid: false, status: 403, message: "Token not found!"}
        }
        if (tokens[0].used === false) {
            return {valid: true, token: tokens[0]};
        }
        return {valid: false, status: 403, message: "Token is not valid anymore."}

    }

    /**
     * User has to carry a JWT token to access an API protected by this handler.
     * Don't test if jwt has access to resource.
     */
    securedPath = async (req, res, next) => {
        httpContext.set("method", "securedPath");
        if (req.headers) {
            // Check JWT Token. If JWT is valid, everything good. Don't check if jwt belongs to resource.
            const result = await this.isJwtTokenValid(req.headers.authorization, req, res);
            if (result.valid === true) {
                req.schroedinger.user = result.payload;
                return next();
            }
            return exception(res, result.status,  result.message);
        }
        return exception(res, 403,  "No authorization token found.");
    };

    /**
     * User has to carry a JWT token or a participation token
     * to access an API protected by this handler.
     *
     * This handler does not test if the token belongs to the survey.
     */
    securedOrOneTimePassPath = async (req, res, next) => {
        httpContext.set("method", "securedOrOneTimePassPath");
        try {
            // Check JWT Token. If JWT is valid, everything good.
            // Don't test if jwt has access to resource.
            // Responsibility of SQL layer.
            if (req.headers && req.headers.authorization) {
                const result = await this.isJwtTokenValid(req.headers.authorization, req, res);
                if (result.valid === true) {
                    req.schroedinger.user = result.payload;
                } else {
                    return exception(res, result.status,  result.message);
                }
            }

            // Check for participation token. If participation token is there, everything good. Don't check if token belongs to survey.
            // Responsibility of SQL layer.
            if (req.query && req.query.token) {
                const result = await this.isParticipationTokenValid(req.query.token);
                if (result.valid === true) {
                    req.schroedinger.token = result.token;
                } else {
                    return exception(res, result.status,  result.message);
                }
            }

            if (req.schroedinger.user || req.schroedinger.token) {
                return await userCache.writeLastChangedPassword(req, res, next);
            }

            return exception(res, 403,  "No authorization or participation token found.");
        } catch (e) {
            log.error(e.message);
            return exception(res, 403, e.message);
        }
    };


    /**
     * User has to carry a JWT token or a participation token
     * to access an API protected by this handler. The participation token must be still valid.
     *
     * This handler does not test if the token belongs to the survey.
     */
    securedCreatingSubmission = async (req, res, next) => {
        httpContext.set("method", "securedCreatingSubmission");
        try {
            // Check for participation token. If participation token is there, everything good. Don't check if token belongs to survey.
            // Responsibility of SQL layer.
            if (req.query && req.query.token) {
                const result = await this.isParticipationTokenValid(req.query.token);
                if (result.valid === true) {
                    req.schroedinger.token = result.token;
                } else {
                    return exception(res, result.status,  result.message);
                }
            }

            // Check JWT Token. If JWT is valid, everything good. Don't check if jwt belongs to survey.
            // Don't test if jwt has access to resource.
            // Responsibility of SQL layer.
            if (req.headers && req.headers.authorization) {
                const result = await this.isJwtTokenValid(req.headers.authorization, req, res);
                if (result.valid === true) {
                    req.schroedinger.user = result.payload;
                } else {
                    return exception(res, result.status,  result.message);
                }
            }

            if (req.schroedinger.user || req.schroedinger.token) {
                return next();
            }

            // No token or jwt found. Check if survey is secured. If not, user is authenticated anyway... Just in case
            if(req.body.survey_id) {
                const survey_id = req.body.survey_id;
                const surveys = await surveyDB.getSurveyById(survey_id);
                if (surveys.length === 1) {
                    const survey = surveys[0];
                    if (survey.secured === false) {
                        return next();
                    }
                    return exception(res, 403, "Secured survey but no JWT token or Participation found.");
                }
            }
            return exception(res, 403, "Can not find the corresponding survey to verify its secured status.");
        } catch (e) {
            log.error(e.message);
            return res.status(403).send(e.message);
        }
    };
}

const authorization = new Authorization();
export default authorization;