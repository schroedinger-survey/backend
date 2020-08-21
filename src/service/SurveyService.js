class SurveyService {
    async createSurvey(req, res) {
        return res.sendStatus(201);
    }
}

const surveyService = new SurveyService();

module.exports = surveyService;