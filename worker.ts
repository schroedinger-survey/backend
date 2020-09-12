require("dotenv-flow").config({
    silent: true
});
import mailSender from "./src/mail/MailSender";
const httpContext = require("express-http-context");
const amqplib = require("amqplib");
const express = require("express");
import loggerFactory from "./src/utils/Logger";

const log = loggerFactory.buildDebugLogger("worker.ts");



const loop = async () => {
    httpContext.set("method", "loop");
    const connection = await amqplib.connect(`amqp://${process.env.RABBITMQ_USER}:${process.env.RABBITMQ_PASSWORD}@${process.env.RABBITMQ_HOST}`);
    log.info(`Email worker established connection to message queue: ${process.env.RABBITMQ_HOST}, ${process.env.RABBITMQ_USER}, ${process.env.MAIL_QUEUE}`);
    process.once("SIGINT", connection.close.bind(connection));

    const app = express();

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
            await channel.ack(message);
        } catch (e) {
            log.error("Error sending email", e);
            await channel.nack(message, true);
        }
    }, { noAck: false });
    app.get("/health", async (req, res) => {
        if (await channel.assertQueue(process.env.MAIL_QUEUE)) {
            log.info("Health check. MQ channel is active");
            return res.status(200).send("OK");
        }
        log.info("Health check. MQ channel is not active");
        return res.status(500).send("Fail");
    });

    const port = 3002;
    app.listen(port, function () {
        log.info(`Worker is listening at port ${port}`)
    });
};

loop().catch((e) => {
    log.error("The email worker report an error " + e.message);
    process.exit(1);
})