const httpContext = require('express-http-context');
const express = require("express");
const swaggerUi = require("swagger-ui-express");
const swaggerDocument = require("./docs/swagger.json");
const app = express();

const userRouter = require("./src/router/UserRouter");
const healthRouter = require("./src/router/HealthRouter");
const redisAccess = require("./src/db/RedisDB");
const sqlAccess = require("./src/db/PostgresDB");
const securityRouter = require("./src/router/SecurityRouter");
const surveyRouter = require("./src/router/SurveyRouter");
const tokenRouter = require("./src/router/TokenRouter");
const submissionRouter = require("./src/router/SubmissionRouter");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const compression = require("compression");
const shouldCompress = require("./src/middleware/CompressionMiddleware");
const morgan = require("morgan");
const fs = require('fs');
const path = require('path')
const accessLogStream = fs.createWriteStream(path.join(__dirname, 'logs/access.log'), {flags: 'a'})
const {v4: uuidv4} = require("uuid");
const atob = require('atob');

app.use(express.json());
app.use(express.urlencoded({extended: false}));

app.use(httpContext.middleware);
app.enable("trust proxy");

morgan.token('id', function getId(req) {
    return req.id
});

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

    httpContext.set('id',JSON.parse(req.id));
    return next();
}

app.use(assignContext);
app.use(morgan('{remote: ":remote-addr", context: :id,  date: ":date[clf]", method: ":method", url: ":url", status: :status, response_time: :response-time}', {stream: accessLogStream}));

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