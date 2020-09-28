import AbstractEmail from "./AbstractEmail";

export default class PrivateSurveyParticipationToken extends AbstractEmail {
    constructor(receiver: string, parameters: object) {
        const title = "You received an invitation to participate in a survey."
        super(receiver, title, parameters);
    }

    content() {
        return `
            A survey on Schroedinger Survey wants your opinion.
            
            Please click on the following link to take part in the survey:
            
            https://schroedinger-survey.de/s/${this.parameters["survey_id"]}?token=${this.parameters["token"]}
        `.trim();
    }
}