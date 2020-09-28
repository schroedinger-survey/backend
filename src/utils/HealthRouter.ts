import postgresDB from "../drivers/PostgresDB";
import redisDB from "../drivers/RedisDB";
import elasticsearchDB from "../drivers/ElasticsearchDB";
import exception from "./Exception";
import loggerFactory from "./Logger";

import { Request, Response} from 'express';
const express = require("express");
const httpContext = require("express-http-context");

const log = loggerFactory.buildDebugLogger("src/router/HealthRouter.js");

const healthRouter = express.Router();

/**
 * Health router for checking a service's health. Don't expose this route to outside word.
 */
healthRouter.get("/", async (req: Request, res: Response) => {
    httpContext.set("method", "healthRouter");
    try {
        await postgresDB.query("SELECT 'Check health'");
        await redisDB.set("Check", "health");
        await elasticsearchDB.indices.get({index: "debug"});
        await elasticsearchDB.indices.get({index: "access"});
        return res.status(200).send("OK");
    } catch (e) {
        log.error(e.message);
        return exception(res, 500, "An unexpected error happened. Please try again.", e.message);
    }
});

export default healthRouter;

