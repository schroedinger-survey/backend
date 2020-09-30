import Context from "./utils/Context";
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

const express = require("express");
const swaggerUi = require("swagger-ui-express");
const swaggerDocument = require("../docs/swagger.json");
const app = express();
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const compression = require("compression");
const atob = require("atob");

import { Request, Response, NextFunction} from 'express';
const log = loggerFactory.buildDebugLogger("src/app.ts");

/**
 * Assigning each REST call on the server with an ID. If the request has a JWT token,
 * the ID in the JWT's payload will be used as ID. Else an UUID will be used.
 */
function assignContext(req: Request, res: Response, next: NextFunction) {
    Context.bindRequest(req);
    Context.bindResponse(res);
    Context.setMethod("assignContext");

    if (req.headers && req.headers.authorization) {
        try {
            const body = JSON.parse(atob(req.headers.authorization.split(".")[1]));
            req["schroedinger"].id = JSON.stringify({type: "authenticated", id: body.username});
        } catch (e) {
            log.debug("Error while assigning ID to request.", e.message)
            req["schroedinger"].id = JSON.stringify({type: "anonymous", id: uuid()});
        }
    } else {
        req["schroedinger"].id = JSON.stringify({type: "anonymous", id: uuid()});
    }
    const now = new Date();
    req["schroedinger"]["@timestamp"] = now;

    Context.setId(JSON.parse(req["schroedinger"].id).id);
    Context.setTimestamp(String(now.getTime()));
    return next();
}

app.enable("trust proxy");
app.use(cacheable.initialize);
app.use(userCache.readLastChangedPassword);
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(Context.middleware());
app.use(assignContext);
app.use(loggerFactory.buildAccessLogger());
app.use(rateLimit({windowMs: 15 * 60 * 1000, max: 1000}));
app.use(helmet());
app.use(compression({
    filter: (req: Request, res: Response) => {
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