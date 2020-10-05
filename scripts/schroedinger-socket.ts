import newSubmissionNotificationMessageQueue from "../src/data/queue/NewSubmissionMessageQueue";

require("dotenv-flow").config({
    silent: true
});
import initialize from "../src/initialize";
import rabbitmq from "../src/data/drivers/RabbitMQ";
import jsonWebToken from "../src/security/JsonWebToken";
import loggerFactory from "../src/utils/Logger";

const express = require("express");
const app = express();
const http = require("http");
const log = loggerFactory.buildDebugLogger("schroedinger-socket.ts");
import helmet from "helmet";
import userSpecificDebuggingQueue from "../src/data/queue/UserSpecificDebuggingQueue";

/**
 * Declaring HTTP server, serving static documentation of sockets
 */
app.enable("trust proxy");
app.use(initialize);
app.use(helmet());
app.use(loggerFactory.buildAccessLogger());
const server = http.createServer(app);

app.get("/health", async (req, res) => {
    if (await rabbitmq.checkQueue(process.env.SCHROEDINGER_MAIL_QUEUE)) {
        log.info("Health check. MQ channel is active");
        return res.status(200).send("OK");
    }
    log.info("Health check. MQ channel is not active");
    return res.status(500).send("Fail");
});

/**
 * Declaring IO for new submission notification
 */
const notificationBroker = require("socket.io")(server, {path: "/socket.io"});
notificationBroker
    .use(function (socket, next) {
        log.info("New socket connection. Process to authorize.");
        socket.schroedinger = {};
        /*
         * Authorize connection
         */
        if (socket.handshake.query && socket.handshake.query.authorization) {
            try {
                socket.schroedinger.user = jsonWebToken.verify(socket.handshake.query.authorization);
                log.info("Socket authorized successfully");
                return next();
            } catch (e) {
                log.error(e.message);
            }
        }
        return next(new Error("Authentication error"));
    })
    .on("connect", async (socket) => {
        try {
            log.info(`User ${socket.schroedinger.user.id} authorized successfully.`);

            /*
             * New submission notification path
             */
            const newSubmissionNotificationChannel = await newSubmissionNotificationMessageQueue.consumeNewSubmissionNotification(socket.schroedinger.user.id, async function (notification: string) {
                log.info(`New message for user ${socket.schroedinger.user.id}`);
                socket.emit(`new-submission/${socket.schroedinger.user.id}`, notification);
            });

            /*
             * User specific debugging path. Mainly for debugging stuff.
             */
            const userSpecificDebuggingChannel = await userSpecificDebuggingQueue.consumeUserSpecificDebuggingNotification(socket.schroedinger.user.id, async function (notification: string) {
                log.info(`New message for user ${socket.schroedinger.user.id}`);
                socket.emit(`debug/${socket.schroedinger.user.id}`, notification);
            });

            /*
             * Socket disconnect path
             */
            socket.on("disconnect", async () => {
                log.info(`User ${socket.schroedinger.user.id} disconnected.`);
                await newSubmissionNotificationChannel.close();
                await userSpecificDebuggingChannel.close();
            });
        } catch (e) {
            log.error(e.message);
            process.exit(1);
        }
    });

/**
 * Start the HTTP server
 */
const port = Number(process.env.SCHROEDINGER_SOCKET_PORT)
server.listen(port, () => {
    log.info(`Socket server started at ${port}`);
});
process.on("uncaughtException", err => {
    log.error(`Uncaught Exception: ${err.message}`);
    server.close();
    process.exit(1);
});
