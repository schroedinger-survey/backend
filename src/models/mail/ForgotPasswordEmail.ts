import AbstractEmail from "./AbstractEmail";

export default class ForgotPasswordEmail extends AbstractEmail {
    constructor(receiver: string, parameters: Record<string, unknown>) {
        const title = "You forgot your account's detail or requested to reset your password."
        super(receiver, title, parameters);
    }

    content() : string {
        return `
            Following is your account's details:
            
            Account: ${this.parameters["username"]}
            Please following this link to reset your password: https://${process.env.SCHROEDINGER_FRONTEND_URL}/reset-forgotten-password?token=${this.parameters["token"]}
            
            If you did not request the operation, ignore this email.
        `.trim();
    }
}

