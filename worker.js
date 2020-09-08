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
    log.info("Email worker connected to Message Queue");

    connection.createChannel(async (error, channel) => {
        if (error) {
            throw error;
        }

        await channel.assertQueue(process.env.MAIL_QUEUE);
        channel.consume(process.env.MAIL_QUEUE, async function (mail) {
            log.info("New incoming email. Sending email now.");
            const mailObject = JSON.parse(mail);
            await mailSender.send(mailObject);
        });
    });
};

loop().catch((e) => {
    log.error("The email worker report an error " + e.message);
    process.exit(1);
})