import emailMessageQueue from "../src/data/queue/EmailMessageQueue";

require("dotenv-flow").config({
    silent: true
});
import mailSender from "../src/data/drivers/MailSender";
const express = require("express");
import loggerFactory from "../src/utils/Logger";
const http = require("http");

const log = loggerFactory.buildDebugLogger("schroedinger-worker.ts", false);

const loop = async () => {
    const app = express();

    const channel = await emailMessageQueue.consumeEmails(async function (message: string ){
        const mailObject = JSON.parse(message);
        await mailSender.send(mailObject);
    });
    app.get("/health", async (req, res) => {
        if (await channel.checkQueue(process.env.SCHROEDINGER_MAIL_QUEUE)) {
            log.info("Health check. MQ channel is active");
            return res.status(200).send("OK");
        }
        log.info("Health check. MQ channel is not active");
        return res.status(500).send("Fail");
    });

    const server = http.createServer(app);
    const port = Number(process.env.SCHROEDINGER_WORKER_PORT)
    server.listen(port, async () => {
        log.info(`Email worker started at ${port}`);
    });
    process.on("uncaughtException", err => {
        log.error(`Uncaught Exception: ${err.message}`);
        server.close();
        process.exit(1);
    });
};

loop().catch((e) => {
    log.error("The email worker report an error " + e.message);
    process.exit(1);
})
