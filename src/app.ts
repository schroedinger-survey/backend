import tokenRouter from "./router/TokenRouter";
import userRouter from "./router/UserRouter";
import healthRouter from "./utils/HealthRouter";
import securityRouter from "./utils/SecurityRouter";
import surveyRouter from "./router/SurveyRouter";
import submissionRouter from "./router/SubmissionRouter";
import redisDB from "./drivers/RedisDB";
import postgresDB from "./drivers/PostgresDB";
import elasticsearchDB from "./drivers/ElasticsearchDB";
import {uuid} from "uuidv4";
import loggerFactory from "./utils/Logger";
import cacheable from "./cache/Cachable";
import userCache from "./cache/UserCache";

const httpContext = require("express-http-context");
const express = require("express");
const swaggerUi = require("swagger-ui-express");
const swaggerDocument = require("../docs/swagger.json");
const app = express();
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const compression = require("compression");
const atob = require("atob");

const log = loggerFactory.buildDebugLogger("src/app.js");

/**
 * Assigning each REST call on the server with an ID. If the request has a JWT token,
 * the ID in the JWT's payload will be used as ID. Else an UUID will be used.
 */
function assignContext(req, res, next) {
    httpContext.ns.bindEmitter(req);
    httpContext.ns.bindEmitter(res);
    httpContext.set("method", "assignContext");

    if (req.headers && req.headers.authorization) {
        try {
            const body = JSON.parse(atob(req.headers.authorization.split(".")[1]));
            req.id = JSON.stringify({type: "authenticated", id: body.username});
        } catch (e) {
            log.debug("Error while assigning ID to request.", e.message)
            req.id = JSON.stringify({type: "anonymous", id: uuid()});
        }
    } else {
        req.id = JSON.stringify({type: "anonymous", id: uuid()});
    }
    const now = new Date();
    req["@timestamp"] = now;
    httpContext.set("id", JSON.parse(req.id).id);
    httpContext.set("@timestamp", now);
    return next();
}

app.enable("trust proxy");
app.use(cacheable.initialize);
app.use(userCache.readLastChangedPassword);
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(httpContext.middleware);
app.use(assignContext);
app.use(loggerFactory.buildAccessLogger());
app.use(rateLimit({windowMs: 15 * 60 * 1000, max: 1000}));
app.use(helmet());
app.use(compression({
    filter: (req, res) => {
        return req.headers["x-no-compression"] ? false : compression.filter(req, res);
    }
}));
app.use("/token", tokenRouter);
app.use("/user", userRouter);
app.use("/health", healthRouter);
app.use("/security", securityRouter);
app.use("/survey", surveyRouter);
app.use("/submission", submissionRouter);

// Only invoked if a SQL layer changed the pass word of user and pass next()
app.use(userCache.writeLastChangedPassword);
// In case of cache invalidation, this handler will take the responsibility of ending/finalizing a HTTP request
app.use(cacheable.finalize);

// SWAGGER UI
app.use("/", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.close = async () => {
    log.debug("Closing server");
    await redisDB.close();
    await postgresDB.close();
    await elasticsearchDB.close();
}

export default app;