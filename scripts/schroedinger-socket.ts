require("dotenv-flow").config({
    silent: true
});
import rabbitmq from "../src/drivers/RabbitMQ";
import jsonWebToken from "../src/utils/JsonWebToken";
import loggerFactory from "../src/utils/Logger";

const fs = require("fs");
const path = require("path");
const log = loggerFactory.buildDebugLogger("schroedinger-socket.ts", false);

/**
 * Declaring HTTP server, serving static documentation of sockets
 */
const httpServer = require("http").createServer((request, response) => {
    if (request.url === "/health") {
        response.statusCode = 200;
        return response.end("OK");
    }
    const publicFolder = "build";
    const mediaTypes = {
        html: "text/html",
        css: "text/css",
        js: "application/javascript"
    }
    const filepath = path.join(publicFolder, request.url === "/" ? "index.html" : request.url);
    fs.readFile(filepath, function (error, data) {
        if (error) {
            response.statusCode = 404;
            return response.end("File not found.");
        }
        let mediaType = "text/html"
        const extension = path.extname(filepath)
        if (extension.length > 0 && mediaTypes.hasOwnProperty(extension.slice(1))) {
            mediaType = mediaTypes[extension.slice(1)]
        }
        response.setHeader("Content-Type", mediaType)
        response.end(data)
    });
});

/**
 * Declaring IO for new submission notification
 */
const notification = require("socket.io")(httpServer);
notification
    .of("/notification")
    .use(function (socket, next) {
        log.info("New socket connection. Process to authorize.");
        socket.schroedinger = {};
        if (socket.handshake.query && socket.handshake.query.authorization) {
            try {
                socket.schroedinger.user = jsonWebToken.verify(socket.handshake.query.authorization);
                log.info("Socket authorized successfully");
                return next();
            } catch (e) {
                log.error(e.message);
                return next(new Error("Authentication error"));
            }
        } else {
            next(new Error("Authentication error"));
        }
    })
    .on("connect", async (socket) => {
        log.info(`User ${socket.schroedinger.user.id} authorized successfully.`);
        const channel = await rabbitmq.consume(socket.schroedinger.user.id, async function (notification: string) {
            socket.emit(`new-submission/${socket.schroedinger.user.id}`, notification);
        });
        socket.on("disconnect", async () => {
            log.info(`User ${socket.schroedinger.user.id} disconnected.`)
            await channel.close();
        });
    });

/**
 * Start the HTTP server
 */
const port = Number(process.env.SCHROEDINGER_SOCKET_PORT)
httpServer.listen(port, () => {
    log.info(`Socket server started at ${port}`);
});