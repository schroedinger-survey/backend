const postgresDB = require("../db/PostgresDB");
const surveyDB = require("../db/SurveyDB");
const tokenDB = require("../db/TokenDB");
const queryConvert = require("../utils/QueryConverter");

class TokenService {
    constructor() {
        this.createToken = this.createToken.bind(this);
    }

    async createToken(req, res) {
        const {amount, survey_id} = req.query;
        const user_id = req.user.id;
        try {
            await postgresDB.begin();
            const surveys = await surveyDB.getSurveyByIdAndUserId(survey_id, user_id);
            if(surveys.rowCount > 0){
                const promises = [];
                for(let i = 0; i < Number(amount); i++){
                    promises.push(tokenDB.createToken(survey_id));
                }
                const result = await Promise.all(promises);
                await postgresDB.commit();
                return res.status(201).json(queryConvert(result));
            }else{

                await postgresDB.rollback()
                return res.sendStatus(403);
            }
        } catch (e) {
            return res.sendStatus(500);
        }
    }
}

const tokenService = new TokenService();

module.exports = tokenService;