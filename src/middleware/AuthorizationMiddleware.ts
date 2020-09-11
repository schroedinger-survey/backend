import DebugLogger from "../utils/Logger";
import blackListedJwtDB from "../db/cache/BlackListedJwtDB";
import lastTimeUserChangedPasswordDB from "../db/cache/LastTimeUserChangedPasswordDB";
import tokenDB from "../db/sql/TokenDB";
import exception from "../utils/Exception";
import surveyDB from "../db/sql/SurveyDB";
import jsonWebToken from "../utils/JsonWebToken";

const httpContext = require("express-http-context");
const log = DebugLogger("src/middleware/AuthorizationMiddleware.js");

class AuthorizationMiddleware {

    /**
     * Control if the token is valid. A token is valid only if it is still alive and was created after
     * the last time the user changed his/her password and is not on the blacklist.
     * @param jwt
     * @returns {Promise<{valid: boolean, message: string, status: number}|{valid: boolean, payload: *}>}
     */
    isJwtTokenValid = async (jwt) => {
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

        let lastPasswordChange;
        if ((await lastTimeUserChangedPasswordDB.lastTimeChangedExists(user.id)) === true) {
            lastPasswordChange = (await lastTimeUserChangedPasswordDB.getLastTimeChanged(user.id));
        } else {
            lastPasswordChange = user.user_created_at;
            await lastTimeUserChangedPasswordDB.setLastTimeChanged(user.id, lastPasswordChange);
        }

        log.debug(`Token was granted at ${user.iat}, last time the password was changed at ${lastPasswordChange}`);
        if (lastPasswordChange > user.iat) {
            return {
                valid: false,
                status: 403,
                message: `Token issued at ${user.iat}, user changed password last time at ${lastPasswordChange}`
            }
        }
        return {valid: true, payload: user};
    }

    /**
     * Check if a participation is still valid
     * @param participationToken participation token
     * @returns {Promise<{valid: boolean, message: string, status: number}|{valid: boolean, token: *}>}
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
     * User has to carry a JWT token to access an API protected by this handler
     */
    securedPath = async (req, res, next) => {
        httpContext.set("method", "securedPath");
        if (req.headers) {
            const result = await this.isJwtTokenValid(req.headers.authorization);
            if (result.valid === true) {
                req.user = result.payload;
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
            // Check JWT Token. JWT Token should not be invalid and should not be older than the last time user changed his password.
            if (req.headers && req.headers.authorization) {
                const result = await this.isJwtTokenValid(req.headers.authorization);
                if (result.valid === true) {
                    req.user = result.payload;
                } else {
                    return exception(res, result.status,  result.message);
                }
            }

            if (req.query && req.query.token) {
                const result = await this.isParticipationTokenValid(req.query.token);
                if (result.valid === true) {
                    req.token = result.token;
                } else {
                    return exception(res, result.status,  result.message);
                }
            }

            if (req.user || req.token) {
                return next();
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
            // Check JWT Token. JWT Token should not be invalid and should not be older than the last time user changed his password.
            if (req.headers && req.headers.authorization) {
                const result = await this.isJwtTokenValid(req.headers.authorization);
                if (result.valid === true) {
                    req.user = result.payload;
                } else {
                    return exception(res, result.status, result.message);
                }
            }

            if (req.query && req.query.token) {
                const result = await this.isParticipationTokenValid(req.query.token);
                if (result.valid === true) {
                    req.token = result.token;
                } else {
                    return exception(res, result.status, result.message);
                }
            }

            if (req.user || req.token) {
                return next();
            }

            const survey_id = req.body.survey_id;
            const surveys = await surveyDB.getSurvey(survey_id);
            if (surveys.length === 1) {
                const survey = surveys[0];
                if (survey.secured === false) {
                    return next();
                }
                return exception(res, 403, "Secured survey but no JWT token or Participation found.");

            }
            return exception(res, 403, "Can not find the corresponding survey to verify its secured status.");

        } catch (e) {
            log.error(e.message);
            return res.status(403).send(e.message);
        }
    };
}

const authorizationMiddleware = new AuthorizationMiddleware();
export default authorizationMiddleware;