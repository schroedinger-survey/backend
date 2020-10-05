import authorization from "./Authorization";

import { Request, Response} from "express";
const express = require("express");


const securityRouter = express.Router();

/**
 * Security router for debugging. Is is not that important but do not expose this route if you do not have any use for it.
 */
securityRouter.get("/", authorization.securedPath, async (req: Request, res: Response) => {
    return res.status(200).json(req["schroedinger"].user);
});

export default securityRouter;

