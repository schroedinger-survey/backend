const express = require("express");
const postgresDB = require("../db/PostgresDB");
const redisDB = require("../db/RedisDB");
const elasticsearchDB = require("../db/ElasticsearchDB");


const healthRouter = express.Router();

healthRouter.get("/", async (req, res) => {
    try {
        await postgresDB.query("SELECT 'Check health'");
        await redisDB.set("Check", "health");
        await elasticsearchDB.indices.get({index: "debug"});
        await elasticsearchDB.indices.get({index: "access"});
        return res.status(200).send("OK");
    }catch (e){
        return res.sendStatus(500);
    }
});

module.exports = healthRouter;

