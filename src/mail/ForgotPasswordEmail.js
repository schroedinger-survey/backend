const AbstractEmail = require("./AbstractEmail");

class ForgotPasswordEmail extends AbstractEmail {
    constructor(receiver, parameters) {
        const title = "You forgot your account's detail or requested to reset your password."
        super(receiver, title, parameters);
    }

    content() {
        return `
            Following is your account's details:
            
            Account: ${this.parameters.username}
            Please following this link to reset your password: https://schroedinger-survey.de/reset-forgotten-password?token=${this.parameters.token}
        `.trim();
    }
}

module.exports = ForgotPasswordEmail;