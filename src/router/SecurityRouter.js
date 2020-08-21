const express = require("express");
const securedPath = require("../middleware/AuthorizationMiddleware");


const securityRouter = express.Router();

securityRouter.get("/", securedPath, async (req, res) => {
    return res.status(200).json(req.user);
});

module.exports = securityRouter;

