require("dotenv-flow").config();
const log = require("./src/log/Logger");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const compression = require("compression")

/**
 * Security configuration
 */
const app = require("./app");
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100
});
app.use(limiter);
app.use(helmet());
app.use(compression({ filter: shouldCompress }))

function shouldCompress (req, res) {
    if (req.headers["x-no-compression"]) {
        // Don't compress responses with this request header
        return false
    }

    // Fallback to standard filter function
    return compression.filter(req, res)
}


/**
 * Module dependencies.
 */
const debug = require("debug")("schroedinger-backend:server");
const http = require("http");

/**
 * Get port from environment and store in Express.
 */
const port = normalizePort(process.env.PORT || "3000");
app.set("port", port);

/**
 * Create HTTP server.
 */
const server = http.createServer(app);

/**
 * Listen on provided port, on all network interfaces.
 */
server.listen(port);
server.on("error", onError);
server.on("listening", onListening);

/**
 * Normalize a port into a number, string, or false.
 */
function normalizePort(val) {
    const port = parseInt(val, 10);
    if (isNaN(port)) {
        // Named pipe
        return val;
    }
    if (port >= 0) {
        // Port number
        return port;
    }
    return false;
}

/**
 * Event listener for HTTP server "error" event.
 */
function onError(error) {
    if (error.syscall !== "listen") {
        throw error;
    }
    const bind = typeof port === "string"
        ? "Pipe " + port
        : "Port " + port;
    // Handle specific listen errors with friendly messages
    switch (error.code) {
        case "EACCES":
            log.error(bind + " requires elevated privileges");
            process.exit(1);
            break;
        case "EADDRINUSE":
            log.error(bind + " is already in use");
            process.exit(1);
            break;
        default:
            throw error;
    }
}

/**
 * Event listener for HTTP server "listening" event.
 */
function onListening() {
    const addr = server.address();
    const bind = typeof addr === "string"
        ? "pipe " + addr
        : "port " + addr.port;
    debug("Listening on " + bind);
    log.info("Listening on Port", port);
}
