const postgresDB = require("../db/PostgresDB");
const surveyDB = require("../db/SurveyDB");
const tokenDB = require("../db/TokenDB");
const queryConvert = require("../utils/QueryConverter");
const log = require("../utils/Logger");

class TokenService {
    constructor() {
        this.createToken = this.createToken.bind(this);
    }

    async createToken(req, res) {
        const {amount, survey_id} = req.body;
        const user_id = req.user.id;
        try {
            await postgresDB.begin();
            const surveys = queryConvert(await surveyDB.getSurveyByIdAndUserId(survey_id, user_id));
            if (surveys.length > 0) {
                const promises = [];
                for (let i = 0; i < Number(amount); i++) {
                    promises.push(tokenDB.createToken(survey_id));
                }
                const createdTokens = await Promise.all(promises);
                await postgresDB.commit();

                const ret = [];
                for (let i = 0; i < createdTokens.length; i++) {
                    const result = queryConvert(createdTokens[i])[0];
                    ret.push(result);
                }
                return res.status(201).json(ret);
            }
            await postgresDB.rollback()
            return res.status(403).send("No survey found for this user id and survey id");

        } catch (e) {
            log.error(e);
            return res.sendStatus(500);
        }
    }
}

const tokenService = new TokenService();

module.exports = tokenService;