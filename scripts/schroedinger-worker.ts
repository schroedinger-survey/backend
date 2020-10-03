require("dotenv-flow").config({
    silent: true
});
import mailSender from "../src/mail/MailSender";
import rabbitmq from "../src/drivers/RabbitMQ";
const httpContext = require("express-http-context");
const express = require("express");
import loggerFactory from "../src/utils/Logger";

const log = loggerFactory.buildDebugLogger("schroedinger-worker.ts", false);

const loop = async () => {
    httpContext.set("method", "loop");
    const app = express();

    const channel = await rabbitmq.consume(process.env.SCHROEDINGER_MAIL_QUEUE, async function (message: string ){
        const mailObject = JSON.parse(message);
        await mailSender.send(mailObject);
    });

    app.get("/", async (req, res) => {
        if (await channel.checkQueue(process.env.SCHROEDINGER_MAIL_QUEUE)) {
            log.info("Health check. MQ channel is active");
            return res.status(200).send("OK");
        }
        log.info("Health check. MQ channel is not active");
        return res.status(500).send("Fail");
    });

    const port = Number(process.env.SCHROEDINGER_WORKER_PORT);
    app.listen(port, function () {
        log.info(`Worker is listening at port ${port}`)
    });
};

loop().catch((e) => {
    log.error("The email worker report an error " + e.message);
    process.exit(1);
})