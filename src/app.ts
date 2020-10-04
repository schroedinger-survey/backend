import Context from "./utils/Context";
import tokenRouter from "./router/TokenRouter";
import userRouter from "./router/UserRouter";
import healthRouter from "./utils/HealthRouter";
import securityRouter from "./utils/SecurityRouter";
import surveyRouter from "./router/SurveyRouter";
import submissionRouter from "./router/SubmissionRouter";
import postgresDB from "./drivers/PostgresDB";
import elasticsearchDB from "./drivers/ElasticsearchDB";
import { v4 as uuid } from "uuid";
import loggerFactory from "./utils/Logger";
const express = require("express");
const swaggerUi = require("swagger-ui-express");
const swaggerDocument = require("../docs/swagger.json");
const app = express();
const helmet = require("helmet");
const atob = require("atob");

import { Request, Response, NextFunction} from "express";
import ErrorMessage from "./errors/ErrorMessage";
import rabbitmq from "./drivers/RabbitMQ";
const log = loggerFactory.buildDebugLogger("src/app.ts");

/**
 * Assigning each REST call on the server with an ID. If the request has a JWT token,
 * the ID in the JWT's payload will be used as ID. Else an UUID will be used.
 */
function initialize(req: Request, res: Response, next: NextFunction) {
    Context.bindRequest(req);
    Context.bindResponse(res);
    Context.setMethod("assignContext");
    req["schroedinger"] = {};
    res["schroedinger"] = {};

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

    res["schroedinger"].error = function(error: ErrorMessage){
        return res.status(error.statusCode()).send(JSON.stringify(error.serialize()));
    }
    return next();
}

app.enable("trust proxy");
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(Context.middleware());
app.use(initialize);
app.use(loggerFactory.buildAccessLogger());
app.use(helmet());
app.use("/token", tokenRouter);
app.use("/user", userRouter);
app.use("/health", healthRouter);
app.use("/security", securityRouter);
app.use("/survey", surveyRouter);
app.use("/submission", submissionRouter);

// SWAGGER UI
app.use("/", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.close = async () => {
    log.debug("Closing server");
    await postgresDB.close();
    await elasticsearchDB.close();
    await rabbitmq.close();
}

export default app;
