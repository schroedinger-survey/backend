const httpContext = require("express-http-context");
const express = require("express");
const postgresDB = require("../drivers/PostgresDB");
const redisDB = require("../drivers/RedisDB");
const elasticsearchDB = require("../drivers/ElasticsearchDB");
const Exception = require("../utils/Exception");
const {DebugLogger} = require("../utils/Logger");
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
    }catch (e){
        log.error(e.message);
        return Exception(500, "An unexpected error happened. Please try again.", e.message).send(res);
    }
});

module.exports = healthRouter;

