require("dotenv-flow").config({
    silent: true
});
import rabbitmq from "../src/drivers/RabbitMQ";
import jsonWebToken from "../src/utils/JsonWebToken";
import loggerFactory from "../src/utils/Logger";

const httpServer = require("http").createServer((req, res) => {
    res.statusCode = 200;
    res.write("OK");
    res.end();
});
const io = require("socket.io")(httpServer);
const log = loggerFactory.buildDebugLogger("schroedinger-socket.ts", false);

io.use(function (socket, next) {
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
}).on("connection", async (socket) => {
    log.info(`User ${socket.schroedinger.user.id} authorized successfully.`);
    const channel = await rabbitmq.consume(socket.schroedinger.user.id, async function(notification: string){
        socket.emit(socket.schroedinger.user.id, notification);
    });
    socket.on("disconnect", async () => {
        log.info(`User ${socket.schroedinger.user.id} disconnected.`)
        await channel.close();
    });
});

const port = Number(process.env.SCHROEDINGER_SOCKET_PORT)
httpServer.listen(port, () => {
    log.info(`Socket server started at ${port}`);
});