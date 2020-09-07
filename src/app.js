const httpContext = require("express-http-context");
const express = require("express");
const swaggerUi = require("swagger-ui-express");
const swaggerDocument = require("../docs/swagger.json");
const app = express();
const expressWinston = require("express-winston");
const userRouter = require("./router/UserRouter");
const healthRouter = require("./router/HealthRouter");
const redisAccess = require("./db/RedisDB");
const sqlAccess = require("./db/PostgresDB");
const securityRouter = require("./router/SecurityRouter");
const surveyRouter = require("./router/SurveyRouter");
const tokenRouter = require("./router/TokenRouter");
const submissionRouter = require("./router/SubmissionRouter");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const compression = require("compression");
const shouldCompress = require("./middleware/CompressionMiddleware");
const winston = require("winston");
const {v4: uuidv4} = require("uuid");
const atob = require("atob");
require("winston-daily-rotate-file");

app.use(express.json());
app.use(express.urlencoded({extended: false}));

app.use(httpContext.middleware);
app.enable("trust proxy");

function assignContext(req, res, next) {
    httpContext.ns.bindEmitter(req);
    httpContext.ns.bindEmitter(res);

    if (req.headers && req.headers.authorization) {
        try {
            const body = JSON.parse(atob(req.headers.authorization.split(".")[1]));
            req.id = JSON.stringify({username: body.username});
        } catch (e) {
            req.id = JSON.stringify({anonymous: uuidv4()});
        }
    } else {
        req.id = JSON.stringify({anonymous: uuidv4()});
    }

    httpContext.set("id", JSON.parse(req.id));
    return next();
}

app.use(assignContext);


const customFormat = winston.format.printf(info => {
    const final = JSON.parse(info.message);
    if (httpContext.get("id")) {
        final.context = httpContext.get("id");
    } else {
        final.context = {"system": "System configuration"}
    }
    if (info.meta.httpRequest) {
        final.host = info.meta.httpRequest.remoteIp
    }
    final.user_agent = info.meta.req.headers["user-agent"]
    return JSON.stringify(final);
});

app.use(expressWinston.logger({
    transports: [
        new winston.transports.Console(),
        new winston.transports.DailyRotateFile({
            filename: "logs/%DATE%-access.log",
            datePattern: "YYYY-MM-DD-HH",
            zippedArchive: true,
            maxSize: "50mb",
            maxFiles: "30",
            options: {flags: "a"},
            auditFile: "logs/access-audit.json"
        })
    ],
    format: winston.format.combine(
        winston.format.colorize(),
        winston.format.json(),
        customFormat
    ),
    meta: true, dynamicMeta: (req, res) => {
        const httpRequest = {}
        const meta = {}
        if (req) {
            meta.httpRequest = httpRequest
            httpRequest.requestMethod = req.method
            httpRequest.requestUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`
            httpRequest.protocol = `HTTP/${req.httpVersion}`
            httpRequest.remoteIp = req.ip.indexOf(":") >= 0 ? req.ip.substring(req.ip.lastIndexOf(":") + 1) : req.ip   // Just ipv4
            httpRequest.requestSize = req.socket.bytesRead
            httpRequest.userAgent = req.get("User-Agent")
            httpRequest.referrer = req.get("Referrer")
        }
        return meta
    },
    msg: `
    {
     "method": "{{req.method}}",
     "url": "{{req.url}}",
     "status": "{{res.statusCode}}",
     "response_time": {{res.responseTime}}
     }`,
    expressFormat: false,
    colorize: false,
    ignoreRoute: function (req, res) {
        return false;
    }
}));


const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000
});
app.use(limiter);
app.use(helmet());
app.use(compression({filter: shouldCompress}));

app.use("/token", tokenRouter);
app.use("/user", userRouter);
app.use("/health", healthRouter);
app.use("/security", securityRouter);
app.use("/survey", surveyRouter);
app.use("/submission", submissionRouter);
app.use("/", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.close = async () => {
    await redisAccess.close();
    await sqlAccess.close()
}

module.exports = app;