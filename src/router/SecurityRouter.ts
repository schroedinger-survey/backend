import authorizationMiddleware from "../middleware/AuthorizationMiddleware";

const express = require("express");


const securityRouter = express.Router();

securityRouter.get("/", authorizationMiddleware.securedPath, async (req, res) => {
    return res.status(200).json(req.user);
});

export default securityRouter;

