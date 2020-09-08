const AbstractEmail = require("./AbstractEmail");

class PrivateSurveyParticipationToken extends AbstractEmail {
    constructor(receiver, parameters) {
        const title = `${parameters.email} invited you to participate in a survey.`
        super(receiver, title, parameters);
    }

    content() {
        return `
            Please click on the following link to take part in the survey 
            
            https://schroedinger-survey/survey/${this.parameters.survey_id}?token=${this.parameters.token}
        `
    }
}

module.exports = PrivateSurveyParticipationToken;