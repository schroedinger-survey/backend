const httpContext = require("express-http-context");
const jwt = require("jsonwebtoken");
const SECRET = process.env.SECRET;
const blackListedJwtDB = require("../db/BlackListedJwtDB");
const queryConvert = require("../utils/QueryConverter");
const tokenDB = require("../db/TokenDB");
const surveyDB = require("../db/SurveyDB");
const Exception = require("../utils/Exception");
const {DebugLogger} = require("../utils/Logger");
const log = DebugLogger("src/middleware/AuthorizationMiddleware.js");

const securedPath = async (req, res, next) => {
    httpContext.set("method", "securedPath");
    try {
        let jwtToken = null;
        if (req.headers && req.headers.authorization) {
            jwtToken = req.headers.authorization
        }
        if (jwtToken) {
            if (!(await blackListedJwtDB.isBlackListed(jwtToken))) {
                req.user = jwt.verify(jwtToken, SECRET);
                return next();
            }
            return Exception(403, "Authorization token is not valid any more.").send(res);
        }
        return Exception(403, "User is not authorized.").send(res);

    } catch (e) {
        log.error(e.message);
        return Exception(403, "The authorization token is expired.", e.message).send(res);
    }
};

const securedOrOneTimePassPath = async (req, res, next) => {
    httpContext.set("method", "securedOrOneTimePassPath");
    try {
        let jwtToken = null;
        if (req.headers && req.headers.authorization) {
            log.debug("Accessing survey with authorization token");
            jwtToken = req.headers.authorization
        }

        let oneTimePass = null;
        if (req.query && req.query.token) {
            log.debug("Accessing survey with participation token");
            oneTimePass = req.query.token
        }

        if (jwtToken) {
            if (!(await blackListedJwtDB.isBlackListed(jwtToken))) {
                req.user = jwt.verify(jwtToken, SECRET);
            }
        }

        if (oneTimePass) {
            const tokens = queryConvert(await tokenDB.getToken(oneTimePass));
            if (tokens.length === 0) {
                return Exception(403, "The given participation token is not valid.").send(res);
            }
            if (tokens[0].used === false) {
                req.token = tokens[0];
            } else {
                return Exception(403, "The given participation token is not valid anymore.").send(res);
            }
        }
        if (req.user || req.token) {
            return next();
        }
        return Exception(403, "No authorization or participation token found.").send(res);
    } catch (e) {
        log.error(e.message);
        return res.status(403).send(e.message);
    }
};


const securedCreatingSubmission = async (req, res, next) => {
    httpContext.set("method", "securedCreatingSubmission");
    try {
        let jwtToken = null;
        if (req.headers && req.headers.authorization) {
            jwtToken = req.headers.authorization
        }

        let oneTimePass = null;
        if (req.query && req.query.token) {
            oneTimePass = req.query.token
        }

        if (jwtToken) {
            if (!(await blackListedJwtDB.isBlackListed(jwtToken))) {
                req.user = jwt.verify(jwtToken, SECRET);
            }
        }

        if (oneTimePass) {
            const tokens = queryConvert(await tokenDB.getToken(oneTimePass));
            if (tokens.length === 0) {
                return res.status(403).send("Token not found!");
            }
            if (tokens[0].used === false) {
                req.token = tokens[0];
            } else {
                return res.status(403).send("Token no more valid!");
            }
        }
        if (req.user || req.token) {
            return next();
        }
        const survey_id = req.body.survey_id;
        const surveys = queryConvert(await surveyDB.getSurvey(survey_id));
        if (surveys.length === 1) {
            const survey = surveys[0];
            if (survey.secured === false) {
                return next();
            }
            return res.status(403).send("Secured survey but no JWT token or Participation found.");

        }
        return res.status(403).send("Can not find the corresponding survey to verify its secured status.")


    } catch (e) {
        log.error(e.message);
        return res.status(403).send(e.message);
    }
};


module.exports = {securedPath, securedOrOneTimePassPath, securedCreatingSubmission};