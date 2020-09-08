require("dotenv-flow").config({
    silent: true
});
const httpContext = require("express-http-context");
const amqplib = require("amqplib");
const mailSender = require("./src/mail/MailSender");
const {DebugLogger} = require("./src/utils/Logger");
const log = DebugLogger("workers.js");


const loop = async () => {
    httpContext.set("method", "loop");
    const connection = await amqplib.connect(`amqp://${process.env.RABBITMQ_USER}:${process.env.RABBITMQ_PASSWORD}@${process.env.RABBITMQ_HOST}`);
    log.info(`Email worker established connection to message queue: ${process.env.RABBITMQ_HOST}, ${process.env.RABBITMQ_USER}, ${process.env.MAIL_QUEUE}`);

    const channel = await connection.createChannel();
    log.debug("Created message channel to message queue.");
    await channel.assertQueue(process.env.MAIL_QUEUE);
    log.debug(`Message queue ${process.env.MAIL_QUEUE} exists. Process to consume.`);
    channel.consume(process.env.MAIL_QUEUE, async function (message) {
        const mail = message.content.toString();
        const mailObject = JSON.parse(mail);
        log.debug("New incoming email. Sending email now.", mailObject);
        try {
            await mailSender.send(mailObject);
        }catch (e){
            log.error("Error sending email", e);
        }
    }, {noAck: true});
};

loop().catch((e) => {
    log.error("The email worker report an error " + e.message);
    process.exit(1);
})