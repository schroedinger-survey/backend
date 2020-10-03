import tokenDB from "../db/TokenDB";
import surveyDB from "../db/SurveyDB";
import jsonWebToken from "../utils/JsonWebToken";
import loggerFactory from "../utils/Logger";
import userDB from "../db/UserDB";
import {Request, Response, NextFunction} from 'express';
import Context from "../utils/Context";
import JwtTokenInvalidError from "../errors/JwtTokenInvalidError";
import JwtTokenNotSpecifiedError from "../errors/JwtTokenNotSpecifiedError";
import {JwtTokenOrTokenNotSpecifiedError} from "../errors/JwtTokenOrTokenNotSpecifiedError";
import AuthenticationError from "../errors/AuthenticationError";
import ParticipationTokenNotValidError from "../errors/ParticipationTokenNotValidError";

const log = loggerFactory.buildDebugLogger("src/middleware/Authorization.ts");

class Authorization {

    /**
     * Control if the token is valid. A token is valid only if it is still alive and was created after
     * the last time the user changed his/her password and is not on the blacklist.
     *
     * Don't check if JWT has access to resource.
     */
    isJwtTokenValid = async (jwt: string) => {
        if (!jwt) {
            return {valid: false, message: "Not Authorized to access this API. JWT-Token needed."}
        }

        try {
            let user = jsonWebToken.verify(jwt);
            // No cache hit. Has to read the last time user changed his password from database.
            const query = await userDB.getUserByIdUnsecured(user.id);
            if (query.length !== 1) {
                return {valid: false, message: "Can not find the owner of the token in database."};
            }
            const sourceOfTruthUser = query[0];
            const lastPasswordChangeMs = new Date(sourceOfTruthUser.last_changed_password).getTime();
            const lastTimeLogoutMs = new Date(sourceOfTruthUser.logged_out).getTime();
            const tokenIssuedAtMs = user.issued_at_utc;

            // After resetting password. A small buffer of one second can be tolerated
            // which means every token generated less than one second after the password of the owner was changed will be tolerated
            // this buffer is mainly for unit test which can automate the process very quick and therefore will fail.
            log.debug(`Token was granted at ${tokenIssuedAtMs}, last time the password was changed at ${lastPasswordChangeMs}`);
            if (lastPasswordChangeMs - tokenIssuedAtMs > 1000) {
                return {valid: false, message: `Token issued at ${tokenIssuedAtMs}, user changed password last time at ${lastPasswordChangeMs}`}
            }

            log.debug(`Token was granted at ${tokenIssuedAtMs}, last time user logged out at ${lastTimeLogoutMs}`);
            if (lastTimeLogoutMs - tokenIssuedAtMs > 1000) {
                return {valid: false, message: `Token issued at ${tokenIssuedAtMs}, user logged out at ${lastTimeLogoutMs}`}
            }
            return {valid: true, payload: user};
        } catch (e) {
            log.error(e.message);
            return {valid: false, message: "The authorization token is expired."}
        }

    }

    /**
     * Check if a participation is still valid. Don't check if participation token belongs to survey.
     */
    isParticipationTokenValid = async (participationToken: string) => {
        const tokens = await tokenDB.getToken(participationToken);
        if (tokens.length === 0) {
            return {valid: false, message: "Participation token not found."}
        }
        if (tokens[0].used === false) {
            return {valid: true, token: tokens[0]};
        }
        return {valid: false, message: "Token is not valid anymore."}

    }

    /**
     * User has to carry a JWT token to access an API protected by this handler.
     * Don't test if jwt has access to resource.
     */
    securedPath = async (req: Request, res: Response, next: NextFunction) => {
        Context.setMethod("securedPath");
        if (req.headers) {
            // Check JWT Token. If JWT is valid, everything good. Don't check if jwt belongs to resource.
            const result = await this.isJwtTokenValid(req.headers.authorization);
            if (result.valid === true) {
                req.schroedinger.user = result.payload;
                return next();
            }
            return res.schroedinger.error(new JwtTokenInvalidError(result.message, "Validating JWT"));
        }
        return res.schroedinger.error(new JwtTokenNotSpecifiedError());
    };

    /**
     * User has to carry a JWT token or a participation token
     * to access an API protected by this handler.
     *
     * This handler does not test if the token belongs to the survey.
     */
    securedOrOneTimePassPath = async (req: Request, res: Response, next: NextFunction) => {
        Context.setMethod("securedOrOneTimePassPath");
        try {
            // Check JWT Token. If JWT is valid, everything good.
            // Don't test if jwt has access to resource.
            // Responsibility of SQL layer.
            if (req.headers && req.headers.authorization) {
                const result = await this.isJwtTokenValid(req.headers.authorization);
                if (result.valid === true) {
                    req.schroedinger.user = result.payload;
                    return next();
                } else {
                    return res.schroedinger.error(new JwtTokenInvalidError(result.message, "Validating JWT"));
                }
            }

            // Check for participation token. If participation token is there, everything good. Don't check if token belongs to survey.
            // Responsibility of SQL layer.
            if (req.query && req.query.token) {
                const token = req.query.token.toString();
                const result = await this.isParticipationTokenValid(token);
                if (result.valid === true) {
                    req.schroedinger.token = result.token;
                    return next();
                } else {
                    return res.schroedinger.error(new JwtTokenInvalidError(result.message, "Validating JWT"));
                }
            }
            return res.schroedinger.error(new JwtTokenOrTokenNotSpecifiedError());
        } catch (e) {
            log.error(e.message);
            return res.schroedinger.error(new JwtTokenInvalidError(e.message, "Validating JWT"));
        }
    };


    /**
     * User has to carry a JWT token or a participation token
     * to access an API protected by this handler. The participation token must be still valid.
     *
     * This handler does not test if the token belongs to the survey.
     */
    securedCreatingSubmission = async (req: Request, res: Response, next: NextFunction) => {
        Context.setMethod("securedCreatingSubmission");
        try {
            // Check for participation token. If participation token is there, everything good. Don't check if token belongs to survey.
            // Responsibility of SQL layer.
            if (req.query && req.query.token) {
                const token = req.query.token.toString();
                const result = await this.isParticipationTokenValid(token);
                if (result.valid === true) {
                    req.schroedinger.token = result.token;
                } else {
                    return res.schroedinger.error(new ParticipationTokenNotValidError(result.message, "Creating submission"));
                }
            }

            // Check JWT Token. If JWT is valid, everything good. Don't check if jwt belongs to survey.
            // Don't test if jwt has access to resource.
            // Responsibility of SQL layer.
            if (req.headers && req.headers.authorization) {
                const result = await this.isJwtTokenValid(req.headers.authorization);
                if (result.valid === true) {
                    req.schroedinger.user = result.payload;
                } else {
                    return res.schroedinger.error(new JwtTokenInvalidError(result.message, "Validating JWT"));
                }
            }

            if (req.schroedinger.user || req.schroedinger.token) {
                return next();
            }

            // No token or jwt found. Check if survey is secured. If not, user is authenticated anyway... Just in case
            if (req.body.survey_id) {
                const survey_id = req.body.survey_id;
                const surveys = await surveyDB.getSurveyById(survey_id);
                if (surveys.length === 1) {
                    const survey = surveys[0];
                    if (survey.secured === false) {
                        return next();
                    }
                    return res.schroedinger.error(new JwtTokenOrTokenNotSpecifiedError());
                }
            }
            return res.schroedinger.error(new JwtTokenOrTokenNotSpecifiedError());
        } catch (e) {
            log.error(e.message);
            return res.schroedinger.error(new AuthenticationError(e.message, "Validating JWT"));
        }
    };
}

const authorization = new Authorization();
export default authorization;