import loggerFactory from "../utils/Logger";

const httpContext = require("express-http-context");
const nodemailer = require("nodemailer");
const amqplib = require("amqplib");

const log = loggerFactory.buildDebugLogger("src/mail/MailSender.js");


/**
 * Used to send user mail for account verifying and password reset
 */
class MailSender {
    private transporter;

    constructor() {
        this.transporter = nodemailer.createTransport({
            host: process.env.MAIL_SERVER,
            port: 587,
            secure: false,
            auth: {
                user: process.env.MAIL_SENDER,
                pass: process.env.MAIL_PASSWORD
            },
            disableFileAccess: true,
            disableUrlAccess: true
        }, {from: process.env.MAIL_SENDER})
        this.send = this.send.bind(this);
        this.publish = this.publish.bind(this);
    }

    /**
     * Publish a batch of email to message queues so the email workers can send them to receivers
     * @param emails objects of class @{AbstractMail}
     * @returns {Promise<void>}
     */
    publish = async (emails) => {
        httpContext.set("method", "publish");
        try {
            log.info(`Publishing ${emails.length} new emails to message queue`);
            const connection = await amqplib.connect(`amqp://${process.env.RABBITMQ_USER}:${process.env.RABBITMQ_PASSWORD}@${process.env.RABBITMQ_HOST}`);
            log.debug(`Connection to message queue established: ${process.env.RABBITMQ_HOST}, ${process.env.RABBITMQ_USER}, ${process.env.MAIL_QUEUE}`)
            const channel = await connection.createChannel();
            log.debug("Created message channel to message queue.");
            await channel.assertQueue(process.env.MAIL_QUEUE);
            log.debug(`Message queue ${process.env.MAIL_QUEUE} exists. Process to publish.`);
            for (const email of emails) {
                await channel.sendToQueue(process.env.MAIL_QUEUE, Buffer.from(JSON.stringify(email)), {
                    persistent: true,
                    contentType: "application/json"
                });
                log.info("Sent one email of the batch.");
            }
            await channel.close();
            await connection.close();
            log.debug("Connection to message queue closed");
        } catch (e) {
            log.error("Error while publishing messages" + e.message);
            throw e;
        }
    }

    /**
     * Send link with random token to user after registration for account verification
     * @param email Object of @{AbstractEmail}
     */
    send = async (email) => {
        httpContext.set("method", "send");
        log.debug("Porcess to send email to ", JSON.stringify(email));
        return this.transporter.sendMail({
            to: email.receiver,
            subject: email.subject,
            html: email.body
        });
    }
}

const mailSender = new MailSender();
export default mailSender;