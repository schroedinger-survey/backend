import postgresDB from "../drivers/PostgresDB";
import elasticsearchDB from "../drivers/ElasticsearchDB";
import loggerFactory from "./Logger";

import { Request, Response} from "express";
import Context from "./Context";
import {UnknownError} from "../errors/UnknownError";
const express = require("express");

const log = loggerFactory.buildDebugLogger("src/router/HealthRouter.js");

const healthRouter = express.Router();

/**
 * Health router for checking a service's health. Don't expose this route to outside word.
 */
healthRouter.get("/", async (req: Request, res: Response) => {
    Context.setMethod("healthRouter");
    try {
        await postgresDB.query("SELECT 'Check health'");
        await elasticsearchDB.indices.get({index: "debug"});
        await elasticsearchDB.indices.get({index: "access"});
        return res.status(200).send("OK");
    } catch (e) {
        log.error(e.message);
        return res["schroedinger"].error(new UnknownError(e.message, "Change user"));
    }
});

export default healthRouter;

