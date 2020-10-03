import loggerFactory from "../utils/Logger";
import AbstractEmail from "./AbstractEmail";
import Context from "../utils/Context";
import rabbitmq from "../drivers/RabbitMQ";

const nodemailer = require("nodemailer");

const log = loggerFactory.buildDebugLogger("src/mail/MailSender.js");


/**
 * Used to send user mail for account verifying and password reset
 */
class MailSender {
    private transporter;

    constructor() {
        this.transporter = nodemailer.createTransport({
            host: process.env.SCHROEDINGER_MAIL_SERVER,
            port: 587,
            secure: false,
            auth: {
                user: process.env.SCHROEDINGER_MAIL_SENDER,
                pass: process.env.SCHROEDINGER_MAIL_PASSWORD
            },
            disableFileAccess: true,
            disableUrlAccess: true
        }, {from: process.env.SCHROEDINGER_MAIL_SENDER})
        this.send = this.send.bind(this);
        this.publish = this.publish.bind(this);
    }

    /**
     * Publish a batch of email to message queues so the email workers can send them to receivers
     * @param emails objects of class @{AbstractMail}
     * @returns {Promise<void>}
     */
    publish = async (emails: Array<AbstractEmail>) => {
        Context.setMethod("publish");
        try {
            const mailBatch = [];
            for(const email of emails){
                mailBatch.push(JSON.stringify(email));
            }
            await rabbitmq.publish(process.env.SCHROEDINGER_MAIL_QUEUE, mailBatch);
        } catch (e) {
            log.error("Error while publishing messages" + e.message);
            throw e;
        }
    }

    /**
     * Send link with random token to user after registration for account verification
     * @param email Object of @{AbstractEmail}
     */
    send = async (email: Record<string, unknown>) => {
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