const express = require("express");
const postgresDB = require("../db/PostgresDB");
const redisDB = require("../db/RedisDB");


const healthRouter = express.Router();

healthRouter.get("/", async (req, res) => {
    try {
        await postgresDB.query("SELECT 'Check health'");
        await redisDB.set("Check", "health");
        return res.status(200).send("OK");
    }catch (e){
        return res.sendStatus(500);
    }
});

module.exports = healthRouter;

