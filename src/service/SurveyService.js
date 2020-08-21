class SurveyService {
    async createSurvey(req, res) {
        return res.sendStatus(200);
    }
}

const surveyService = new SurveyService();

module.exports = surveyService;