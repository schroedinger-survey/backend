import authorization from "../middleware/Authorization";

const express = require("express");


const securityRouter = express.Router();

securityRouter.get("/", authorization.securedPath, async (req, res) => {
    return res.status(200).json(req.schroedinger.user);
});

export default securityRouter;

