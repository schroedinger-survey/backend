import tokenDB from "../db/TokenDB";
import postgresDB from "../drivers/PostgresDB";
import surveyDB from "../db/SurveyDB";
import mailSender from "../mail/MailSender";
import PrivateSurveyParticipationToken from "../mail/PrivateSurveyParticipationToken";
import loggerFactory from "../utils/Logger";
import Context from "../utils/Context";
import {Request, Response} from "express";
import {UnknownError} from "../errors/UnknownError";
import NoAccessToSurveyError from "../errors/NoAccessToSurveyError";
const log = loggerFactory.buildDebugLogger("src/service/TokenService.js");

class TokenService {
    countTokens = async (req: Request, res: Response) => {
        Context.setMethod("countTokens");
        const survey_id = req.query.survey_id.toString();
        const used = req.query.used ? req.query.used.toString() : null;
        const user_id = req.schroedinger.user.id.toString();
        try{
            const query = await tokenDB.countTokensBySurveyIdAndUserId(survey_id, user_id, used);
            return res.status(200).send(query[0]);
        } catch (e) {
            log.error(e.message);
            await postgresDB.rollback();
            return res.schroedinger.error(new UnknownError(e.message, "Count participation token"));
        }
    }

    retrieveTokens = async (req: Request, res: Response) => {
        Context.setMethod("retrieveTokens");
        const survey_id = req.query.survey_id.toString();
        const used = req.query.used ? req.query.used.toString() : null;
        const page_number = req.query.page_number ? Number(req.query.page_number) : 0;
        const page_size = req.query.page_size ? Number(req.query.page_size) : 3;
        const user_id = req.schroedinger.user.id;
        try{
            const query = await tokenDB.getTokensBySurveyIdAndUserId(survey_id, user_id, used, page_number, page_size);
            return res.status(200).send(query);
        } catch (e) {
            log.error(e.message);
            await postgresDB.rollback();
            return res.schroedinger.error(new UnknownError(e.message, "Retrieve token"));
        }
    }

    deleteUnusedToken = async (req: Request, res: Response) => {
        Context.setMethod("deleteUnusedToken");
        const user_id = req.schroedinger.user.id;
        const token_id = req.params.token_id;
        try{
            await tokenDB.deleteUnusedTokens(token_id, user_id);
            return res.sendStatus(204);
        } catch (e) {
            log.error(e.message);
            await postgresDB.rollback();
            return res.schroedinger.error(new UnknownError(e.message, "Delete unused token"));
        }
    }

    createToken = async (req: Request, res: Response) => {
        Context.setMethod("createToken");
        const {amount, survey_id} = req.body;
        const user_id = req.schroedinger.user.id;
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
            await postgresDB.rollback();
            return res.schroedinger.error(new NoAccessToSurveyError("Can not find the survey with the corresponding ID and user's ID"));

        } catch (e) {
            log.error(e.message);
            await postgresDB.rollback();
            return res.schroedinger.error(new UnknownError(e.message, "Create token"));
        }
    }

    createTokenAndSendEmail = async (req: Request, res: Response) => {
        Context.setMethod("createTokenAndSendEmail");
        const {emails, survey_id} = req.body;
        const user_id = req.schroedinger.user.id;
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
            return res.schroedinger.error(new NoAccessToSurveyError("Can not find the survey with the corresponding ID and user's ID"));
        } catch (e) {
            log.error(e.message);
            await postgresDB.rollback();
            return res.schroedinger.error(new UnknownError(e.message, "Create token and send mail"));
        }
    }
}

const tokenService = new TokenService();
export default tokenService;