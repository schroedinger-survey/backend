const httpContext = require("express-http-context");
const express = require("express");
const swaggerUi = require("swagger-ui-express");
const swaggerDocument = require("../docs/swagger.json");
const app = express();
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
const {v4: uuidv4} = require("uuid");
const atob = require("atob");
const {AccessLogger} = require("./utils/Logger");
const {DebugLogger} = require("./utils/Logger");

const log = DebugLogger("src/app.js");


app.use(express.json());
app.use(express.urlencoded({extended: false}));

app.use(httpContext.middleware);
app.enable("trust proxy");

function assignContext(req, res, next) {
    log.debug("New request. Assigning context");
    httpContext.ns.bindEmitter(req);
    httpContext.ns.bindEmitter(res);

    if (req.headers && req.headers.authorization) {
        try {
            const body = JSON.parse(atob(req.headers.authorization.split(".")[1]));
            req.id = JSON.stringify({type: "authenticated", id: body.username});
        } catch (e) {
            req.id = JSON.stringify({type: "anonymous", id: uuidv4()});
        }
    } else {
        req.id = JSON.stringify({type: "anonymous", id: uuidv4()});
    }
    const now = new Date();
    req["@timestamp"] = now;
    httpContext.set("id", JSON.parse(req.id).id);
    httpContext.set("@timestamp", now);
    return next();
}

app.use(assignContext);
app.use(AccessLogger());

app.use(rateLimit({windowMs: 15 * 60 * 1000, max: 1000}));
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
    log.debug("Closing server");
    await redisAccess.close();
    await sqlAccess.close()
}

module.exports = app;