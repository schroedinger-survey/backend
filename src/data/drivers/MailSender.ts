import loggerFactory from "../../utils/Logger";
import Context from "../../utils/Context";

const nodemailer = require("nodemailer");

const log = loggerFactory.buildDebugLogger("src/mail/MailSender.js");


/**
 * Used to send user mail for account verifying and password reset
 */
class MailSender {
    private transporter= nodemailer.createTransport({
        host: process.env.SCHROEDINGER_MAIL_SERVER,
        port: 587,
        secure: false,
        auth: {
            user: process.env.SCHROEDINGER_MAIL_SENDER,
            pass: process.env.SCHROEDINGER_MAIL_PASSWORD
        },
        disableFileAccess: true,
        disableUrlAccess: true
    }, {from: process.env.SCHROEDINGER_MAIL_SENDER});

    /**
     * Send link with random token to user after registration for account verification
     * @param email Object of @{AbstractEmail}
     */
    send = async (email: Record<string, string>) => {
        Context.setMethod("send");
        log.debug("Process to send email to ", JSON.stringify(email));
        return this.transporter.sendMail({
            to: email["receiver"],
            subject: email["subject"],
            html: email["body"]
        });
    }
}

const mailSender = new MailSender();
export default mailSender;