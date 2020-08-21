const express = require("express");
const sqlAccess = require("../dataaccess/SQLAccess");
const redisAccess = require("../dataaccess/RedisAccess");


const healthRouter = express.Router();

healthRouter.get("/", async (req, res) => {
    try {
        await sqlAccess.query("SELECT 'Check health'");
        await redisAccess.set("Check", "health");
        return res.sendStatus(200);
    }catch (e){
        return res.sendStatus(500);
    }
});

module.exports = healthRouter;

