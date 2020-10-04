require("dotenv-flow").config({
    silent: true
});
import app from "../src/app";
const http = require("http");
import loggerFactory from "../src/utils/Logger";
const log = loggerFactory.buildDebugLogger("schroedinger-server.ts");

const server = http.createServer(app);
server.listen(Number(process.env.SCHROEDINGER_BACKEND_PORT), () => {
    log.info(`Server started at ${process.env.SCHROEDINGER_BACKEND_PORT}`);
});
process.on("uncaughtException", err => {
    log.error(`Uncaught Exception: ${err.message}`);
    server.close();
    process.exit(1);
});