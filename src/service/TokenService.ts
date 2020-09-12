import tokenDB from "../db/sql/TokenDB";
import postgresDB from "../drivers/PostgresDB";
import exception from "../utils/Exception";
import surveyDB from "../db/sql/SurveyDB";
import mailSender from "../mail/MailSender";
import PrivateSurveyParticipationToken from "../mail/PrivateSurveyParticipationToken";
import loggerFactory from "../utils/Logger";

const httpContext = require("express-http-context");

const log = loggerFactory.buildDebugLogger("src/service/TokenService.js");

class TokenService {
    countTokens = async (req, res) => {
        httpContext.set("method", "countTokens");
        const survey_id = req.query.survey_id;
        const used = req.query.used ? req.query.used : null;
        const user_id = req.user.id;
        try{
            const query = await tokenDB.countTokensBySurveyIdAndUserId(survey_id, user_id, used);
            return res.status(200).send(query[0]);
        } catch (e) {
            log.error(e.message);
            await postgresDB.rollback();
            return exception(res, 500, "An unexpected error happened. Please try again.", e.message);
        }
    }

    retrieveTokens = async (req, res) => {
        httpContext.set("method", "retrieveTokens");
        const survey_id = req.query.survey_id;
        const used = req.query.used ? req.query.used : null;
        const page_number = req.query.page_number ? req.query.page_number : 0;
        const page_size = req.query.page_size ? req.query.page_size : 3;
        const user_id = req.user.id;
        try{
            const query = await tokenDB.getTokensBySurveyIdAndUserId(survey_id, user_id, used, page_number, page_size);
            return res.status(200).send(query);
        } catch (e) {
            log.error(e.message);
            await postgresDB.rollback();
            return exception(res, 500, "An unexpected error happened. Please try again.", e.message);
        }
    }

    deleteUnusedToken = async (req, res) => {
        httpContext.set("method", "deleteUnusedToken");
        const user_id = req.user.id;
        const token_id = req.params.token_id;
        try{
            await tokenDB.deleteUnusedTokens(token_id, user_id);
            return res.sendStatus(204);
        } catch (e) {
            log.error(e.message);
            await postgresDB.rollback();
            return exception(res,500, "An unexpected error happened. Please try again.", e.message);
        }
    }

    createToken = async (req, res) => {
        httpContext.set("method", "createToken");
        const {amount, survey_id} = req.body;
        const user_id = req.user.id;
        log.info("Creating participation tokens");
        try {
            await postgresDB.begin();
            const surveys = await surveyDB.getSurveyByIdAndUserId(survey_id, user_id);
            if (surveys.length > 0) {
                const createdTokens = [];
                for (let i = 0; i < Number(amount); i++) {
                    createdTokens.push(await tokenDB.createToken(survey_id));
                }
                await postgresDB.commit();

                const ret = [];
                for (let i = 0; i < createdTokens.length; i++) {
                    const result = createdTokens[i][0];
                    ret.push(result);
                }
                return res.status(201).json(ret);
            }
            await postgresDB.rollback()
            return exception(res, 403, "No survey found for this user id and survey id", null);

        } catch (e) {
            log.error(e.message);
            await postgresDB.rollback();
            return exception(res, 500, "An unexpected error happened. Please try again.", e.message);
        }
    }

    createTokenAndSendEmail = async (req, res) => {
        httpContext.set("method", "createTokenAndSendEmail");
        const {emails, survey_id} = req.body;
        const user_id = req.user.id;
        log.info("Creating participation tokens and send them to " + emails.length + " emails");
        try {
            await postgresDB.begin();
            const surveys = await surveyDB.getSurveyByIdAndUserId(survey_id, user_id);
            if (surveys.length > 0) {
                const createdTokens = [];
                for (let i = 0; i < emails.length; i++) {
                    createdTokens.push(await tokenDB.createToken(survey_id));
                }
                await postgresDB.commit();
                log.info("Participation tokens created and saved");

                const tokens = [];
                const messages = [];
                for (let i = 0; i < createdTokens.length; i++) {
                    const token = createdTokens[i][0];
                    tokens.push(token);
                    messages.push(new PrivateSurveyParticipationToken(emails[i], {survey_id: survey_id, token: token.id}));
                }
                await mailSender.publish(messages);
                log.info("Emails published to message queue");

                return res.status(201).json(tokens);
            }
            await postgresDB.rollback()
            return exception(res, 403, "No survey found for this user id and survey id", null);
        } catch (e) {
            log.error(e.message);
            await postgresDB.rollback();
            return exception(res, 500, "An unexpected error happened. Please try again.", e.message);
        }
    }
}

const tokenService = new TokenService();
export default tokenService;