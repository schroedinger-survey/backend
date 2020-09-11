import DebugLogger from "../utils/Logger";
import postgresDB from "../drivers/PostgresDB";
import redisDB from "../drivers/RedisDB";
import elasticsearchDB from "../drivers/ElasticsearchDB";
import exception from "../utils/Exception";

const express = require("express");
const httpContext = require("express-http-context");

const log = DebugLogger("src/router/HealthRouter.js");

const healthRouter = express.Router();

healthRouter.get("/", async (req, res) => {
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

